import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, distinctUntilChanged, finalize, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { FailureCause } from '../../models/failure-cause.model';
import { FailureEffect } from '../../models/failure-effect.model';
import { FailureMode } from '../../models/failure-mode.model';
import { FailureCauseService } from '../../services/failure-cause.service';
import { FailureEffectService } from '../../services/failure-effect.service';
import { FailureModeService } from '../../services/failure-mode.service';
import {
  optionalRequestText,
  optionalText,
  optionalTextError,
  requiredTextError,
  resolveFailureApiError,
  severityError
} from '../../utils/failure-analysis.utils';

type NoticeKind = 'success' | 'pending';
type EditorKind = 'mode' | 'effect' | 'cause';
type EditorMode = 'create' | 'edit' | 'view';
type PendingAction =
  | 'create-mode'
  | 'update-mode'
  | 'create-effect'
  | 'update-effect'
  | 'create-cause'
  | 'update-cause'
  | 'discard';

interface FailureNotice {
  kind: NoticeKind;
  title: string;
  status: string | null;
}

interface FailureModeBundle {
  mode: FailureMode;
  effect: FailureEffect | null;
  causes: FailureCause[];
}

@Component({
  selector: 'app-workspace-failure-analysis',
  imports: [ReactiveFormsModule, ConfirmationDialog],
  templateUrl: './workspace-failure-analysis.html',
  styleUrl: './workspace-failure-analysis.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceFailureAnalysis {
  private readonly failureModeService = inject(FailureModeService);
  private readonly failureEffectService = inject(FailureEffectService);
  private readonly failureCauseService = inject(FailureCauseService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly processStepId = input.required<string>();
  readonly firstField = viewChild<ElementRef<HTMLElement>>('firstField');

  readonly bundles = signal<FailureModeBundle[]>([]);
  readonly expandedIds = signal<ReadonlySet<string>>(new Set());
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly editorError = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly notice = signal<FailureNotice | null>(null);
  readonly editorKind = signal<EditorKind | null>(null);
  readonly editorMode = signal<EditorMode | null>(null);
  readonly editingMode = signal<FailureMode | null>(null);
  readonly editingEffect = signal<FailureEffect | null>(null);
  readonly editingCause = signal<FailureCause | null>(null);
  readonly targetModeId = signal<string | null>(null);
  readonly pendingAction = signal<PendingAction | null>(null);

  readonly modeForm = this.formBuilder.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    failureCode: ['', [Validators.maxLength(100)]]
  });

  readonly effectForm = this.formBuilder.nonNullable.group({
    ourPlant: ['', [Validators.maxLength(1000)]],
    shipToPlant: ['', [Validators.maxLength(1000)]],
    endUser: ['', [Validators.maxLength(1000)]],
    severity: this.formBuilder.control<number | null>(null, Validators.required)
  });

  readonly causeForm = this.formBuilder.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(1000)]]
  });

  readonly filteredBundles = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const items = this.bundles();

    if (query.length === 0) {
      return items;
    }

    return items.filter(({ mode }) => {
      const code = mode.failureCode ?? '';
      return mode.description.toLowerCase().includes(query) || code.toLowerCase().includes(query);
    });
  });

  readonly editorTitle = computed(() => {
    const kind = this.editorKind();
    const mode = this.editorMode();

    if (kind === 'effect') {
      if (mode === 'edit') {
        return 'Edit Failure Effect';
      }

      return mode === 'view' ? 'Failure Effect Details' : 'Add Failure Effect';
    }

    if (kind === 'cause') {
      if (mode === 'edit') {
        return 'Edit Failure Cause';
      }

      return mode === 'view' ? 'Failure Cause Details' : 'Add Failure Cause';
    }

    if (mode === 'edit') {
      return 'Edit Failure Mode';
    }

    return mode === 'view' ? 'Failure Mode Details' : 'Add Failure Mode';
  });

  readonly confirmTitle = computed(() => {
    const action = this.pendingAction();

    if (action === 'create-mode') {
      return 'Create Failure Mode?';
    }

    if (action === 'create-effect') {
      return 'Create Failure Effect?';
    }

    if (action === 'create-cause') {
      return 'Create Failure Cause?';
    }

    if (action === 'discard') {
      return 'Discard Changes?';
    }

    return 'Save Changes?';
  });

  readonly confirmMessage = computed(() => {
    const action = this.pendingAction();

    if (action === 'create-mode') {
      return 'Are you sure you want to create this failure mode?';
    }

    if (action === 'update-mode') {
      return 'Are you sure you want to update this failure mode?';
    }

    if (action === 'create-effect') {
      return 'Are you sure you want to create this failure effect?';
    }

    if (action === 'update-effect') {
      return 'Are you sure you want to update this failure effect?';
    }

    if (action === 'create-cause') {
      return 'Are you sure you want to create this failure cause?';
    }

    if (action === 'update-cause') {
      return 'Are you sure you want to update this failure cause?';
    }

    return 'Are you sure you want to leave without saving your changes?';
  });

  private lastTrigger: HTMLElement | null = null;
  private ignoreNextEscape = false;

  constructor() {
    toObservable(this.processStepId)
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(),
        switchMap(() => {
          this.searchQuery.set('');
          this.expandedIds.set(new Set());
          this.forceCloseEditor();
          this.notice.set(null);
          return this.fetchAnalysis();
        })
      )
      .subscribe();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.ignoreNextEscape) {
      this.ignoreNextEscape = false;
      return;
    }

    if (this.pendingAction() !== null || this.isSaving() || this.editorKind() === null) {
      return;
    }

    this.requestCloseEditor();
  }

  onSearchInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.searchQuery.set(target.value);
    }
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  toggleExpanded(id: string): void {
    const next = new Set(this.expandedIds());

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    this.expandedIds.set(next);
  }

  displayText(value: string | null | undefined): string {
    return optionalText(value);
  }

  openCreateMode(event?: Event): void {
    this.openEditor('mode', 'create', event);
    this.modeForm.reset({ description: '', failureCode: '' });
    this.modeForm.enable();
    this.focusFirstField();
  }

  openViewMode(mode: FailureMode, event: Event): void {
    event.stopPropagation();
    this.openEditor('mode', 'view', event);
    this.editingMode.set(mode);
    this.focusFirstField();
  }

  openEditMode(mode: FailureMode, event: Event): void {
    event.stopPropagation();
    this.openEditor('mode', 'edit', event);
    this.editingMode.set(mode);
    this.modeForm.reset({
      description: mode.description,
      failureCode: mode.failureCode ?? ''
    });
    this.modeForm.enable();
    this.focusFirstField();
  }

  openCreateEffect(modeId: string, event: Event): void {
    event.stopPropagation();
    this.openEditor('effect', 'create', event);
    this.targetModeId.set(modeId);
    this.effectForm.reset({
      ourPlant: '',
      shipToPlant: '',
      endUser: '',
      severity: null
    });
    this.effectForm.enable();
    this.focusFirstField();
  }

  openViewEffect(effect: FailureEffect, event: Event): void {
    event.stopPropagation();
    this.openEditor('effect', 'view', event);
    this.editingEffect.set(effect);
    this.focusFirstField();
  }

  openEditEffect(effect: FailureEffect, event: Event): void {
    event.stopPropagation();
    this.openEditor('effect', 'edit', event);
    this.editingEffect.set(effect);
    this.effectForm.reset({
      ourPlant: effect.ourPlant ?? '',
      shipToPlant: effect.shipToPlant ?? '',
      endUser: effect.endUser ?? '',
      severity: effect.severity
    });
    this.effectForm.enable();
    this.focusFirstField();
  }

  openCreateCause(modeId: string, event: Event): void {
    event.stopPropagation();
    this.openEditor('cause', 'create', event);
    this.targetModeId.set(modeId);
    this.causeForm.reset({ description: '' });
    this.causeForm.enable();
    this.focusFirstField();
  }

  openViewCause(cause: FailureCause, event: Event): void {
    event.stopPropagation();
    this.openEditor('cause', 'view', event);
    this.editingCause.set(cause);
    this.focusFirstField();
  }

  openEditCause(cause: FailureCause, event: Event): void {
    event.stopPropagation();
    this.openEditor('cause', 'edit', event);
    this.editingCause.set(cause);
    this.causeForm.reset({ description: cause.description });
    this.causeForm.enable();
    this.focusFirstField();
  }

  requestCloseEditor(): void {
    if (this.isSaving() || this.pendingAction() !== null) {
      return;
    }

    if (this.editorMode() === 'view' || !this.activeFormDirty()) {
      this.forceCloseEditor();
      return;
    }

    this.pendingAction.set('discard');
  }

  requestSave(): void {
    if (this.editorMode() === 'view' || this.isSaving() || this.pendingAction() !== null) {
      return;
    }

    const kind = this.editorKind();
    const mode = this.editorMode();

    if (!kind || !mode) {
      return;
    }

    if (kind === 'mode') {
      this.modeForm.patchValue({
        description: this.modeForm.controls.description.value.trim(),
        failureCode: this.modeForm.controls.failureCode.value.trim()
      });

      if (this.modeForm.invalid) {
        this.modeForm.markAllAsTouched();
        return;
      }
    }

    if (kind === 'effect') {
      this.effectForm.patchValue({
        ourPlant: this.effectForm.controls.ourPlant.value.trim(),
        shipToPlant: this.effectForm.controls.shipToPlant.value.trim(),
        endUser: this.effectForm.controls.endUser.value.trim()
      });

      if (this.effectForm.invalid) {
        this.effectForm.markAllAsTouched();
        return;
      }
    }

    if (kind === 'cause') {
      this.causeForm.patchValue({
        description: this.causeForm.controls.description.value.trim()
      });

      if (this.causeForm.invalid) {
        this.causeForm.markAllAsTouched();
        return;
      }
    }

    this.editorError.set(null);
    this.pendingAction.set(`${mode === 'edit' ? 'update' : 'create'}-${kind}` as PendingAction);
  }

  cancelConfirmation(): void {
    if (this.isSaving()) {
      return;
    }

    this.ignoreNextEscape = true;
    this.pendingAction.set(null);
  }

  confirmPendingAction(): void {
    const action = this.pendingAction();

    if (!action || this.isSaving()) {
      return;
    }

    if (action === 'discard') {
      this.forceCloseEditor();
      return;
    }

    if (action === 'create-mode') {
      this.submitCreateMode();
      return;
    }

    if (action === 'update-mode') {
      this.submitUpdateMode();
      return;
    }

    if (action === 'create-effect') {
      this.submitCreateEffect();
      return;
    }

    if (action === 'update-effect') {
      this.submitUpdateEffect();
      return;
    }

    if (action === 'create-cause') {
      this.submitCreateCause();
      return;
    }

    this.submitUpdateCause();
  }

  retry(): void {
    this.fetchAnalysis().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  modeDescriptionError(): string | null {
    return requiredTextError(this.modeForm.controls.description, 'Failure mode description', 1000);
  }

  modeCodeError(): string | null {
    return optionalTextError(this.modeForm.controls.failureCode, 'Failure code', 100);
  }

  effectPlantError(): string | null {
    return optionalTextError(this.effectForm.controls.ourPlant, 'Our Plant', 1000);
  }

  effectShipError(): string | null {
    return optionalTextError(this.effectForm.controls.shipToPlant, 'Ship to Plant', 1000);
  }

  effectUserError(): string | null {
    return optionalTextError(this.effectForm.controls.endUser, 'End User', 1000);
  }

  effectSeverityError(): string | null {
    return severityError(this.effectForm.controls.severity);
  }

  causeDescriptionError(): string | null {
    return requiredTextError(this.causeForm.controls.description, 'Failure cause description', 1000);
  }

  private openEditor(kind: EditorKind, mode: EditorMode, event?: Event): void {
    this.rememberTrigger(event);
    this.notice.set(null);
    this.editorError.set(null);
    this.editingMode.set(null);
    this.editingEffect.set(null);
    this.editingCause.set(null);
    this.targetModeId.set(null);
    this.editorKind.set(kind);
    this.editorMode.set(mode);
  }

  private submitCreateMode(): void {
    const values = this.modeForm.getRawValue();
    this.isSaving.set(true);

    this.failureModeService
      .createFailureMode({
        processStepId: this.processStepId(),
        description: values.description,
        failureCode: optionalRequestText(values.failureCode)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result =>
          this.finishSuccessfulSave(
            result.outcome === 'pending'
              ? {
                  kind: 'pending',
                  title: 'Your failure mode creation request has been submitted for approval.',
                  status: 'Pending approval'
                }
              : {
                  kind: 'success',
                  title: 'Failure mode created successfully.',
                  status: null
                }
          ),
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to create this failure mode.')
      });
  }

  private submitUpdateMode(): void {
    const item = this.editingMode();

    if (!item) {
      return;
    }

    const values = this.modeForm.getRawValue();
    this.isSaving.set(true);

    this.failureModeService
      .updateFailureMode(item.id, {
        description: values.description,
        failureCode: optionalRequestText(values.failureCode)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result =>
          this.finishSuccessfulSave(
            result.outcome === 'pending'
              ? {
                  kind: 'pending',
                  title: 'Your change request has been submitted for approval.',
                  status: 'Pending approval'
                }
              : {
                  kind: 'success',
                  title: 'Failure mode updated successfully.',
                  status: null
                }
          ),
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to update this failure mode.')
      });
  }

  private submitCreateEffect(): void {
    const modeId = this.targetModeId();
    const severity = this.effectForm.controls.severity.value;

    if (!modeId || severity === null) {
      return;
    }

    const values = this.effectForm.getRawValue();
    this.isSaving.set(true);

    this.failureEffectService
      .createFailureEffect({
        failureModeId: modeId,
        ourPlant: optionalRequestText(values.ourPlant),
        shipToPlant: optionalRequestText(values.shipToPlant),
        endUser: optionalRequestText(values.endUser),
        severity
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result =>
          this.finishSuccessfulSave(
            result.outcome === 'pending'
              ? {
                  kind: 'pending',
                  title: 'Your failure effect creation request has been submitted for approval.',
                  status: 'Pending approval'
                }
              : {
                  kind: 'success',
                  title: 'Failure effect created successfully.',
                  status: null
                }
          ),
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to create this failure effect.')
      });
  }

  private submitUpdateEffect(): void {
    const item = this.editingEffect();
    const severity = this.effectForm.controls.severity.value;

    if (!item || severity === null) {
      return;
    }

    const values = this.effectForm.getRawValue();
    this.isSaving.set(true);

    this.failureEffectService
      .updateFailureEffect(item.id, {
        ourPlant: optionalRequestText(values.ourPlant),
        shipToPlant: optionalRequestText(values.shipToPlant),
        endUser: optionalRequestText(values.endUser),
        severity
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result =>
          this.finishSuccessfulSave(
            result.outcome === 'pending'
              ? {
                  kind: 'pending',
                  title: 'Your change request has been submitted for approval.',
                  status: 'Pending approval'
                }
              : {
                  kind: 'success',
                  title: 'Failure effect updated successfully.',
                  status: null
                }
          ),
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to update this failure effect.')
      });
  }

  private submitCreateCause(): void {
    const modeId = this.targetModeId();

    if (!modeId) {
      return;
    }

    this.isSaving.set(true);
    this.failureCauseService
      .createFailureCause({
        failureModeId: modeId,
        description: this.causeForm.getRawValue().description
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result =>
          this.finishSuccessfulSave(
            result.outcome === 'pending'
              ? {
                  kind: 'pending',
                  title: 'Your failure cause creation request has been submitted for approval.',
                  status: 'Pending approval'
                }
              : {
                  kind: 'success',
                  title: 'Failure cause created successfully.',
                  status: null
                }
          ),
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to create this failure cause.')
      });
  }

  private submitUpdateCause(): void {
    const item = this.editingCause();

    if (!item) {
      return;
    }

    this.isSaving.set(true);
    this.failureCauseService
      .updateFailureCause(item.id, {
        description: this.causeForm.getRawValue().description
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result =>
          this.finishSuccessfulSave(
            result.outcome === 'pending'
              ? {
                  kind: 'pending',
                  title: 'Your change request has been submitted for approval.',
                  status: 'Pending approval'
                }
              : {
                  kind: 'success',
                  title: 'Failure cause updated successfully.',
                  status: null
                }
          ),
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to update this failure cause.')
      });
  }

  private finishSuccessfulSave(notice: FailureNotice): void {
    this.isSaving.set(false);
    this.pendingAction.set(null);
    this.forceCloseEditor();
    this.notice.set(notice);
    this.fetchAnalysis().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private failSave(error: HttpErrorResponse, fallback: string): void {
    this.isSaving.set(false);
    this.pendingAction.set(null);
    this.editorError.set(resolveFailureApiError(error, fallback));
  }

  private forceCloseEditor(): void {
    this.editorKind.set(null);
    this.editorMode.set(null);
    this.editingMode.set(null);
    this.editingEffect.set(null);
    this.editingCause.set(null);
    this.targetModeId.set(null);
    this.pendingAction.set(null);
    this.editorError.set(null);
    this.modeForm.reset({ description: '', failureCode: '' });
    this.effectForm.reset({
      ourPlant: '',
      shipToPlant: '',
      endUser: '',
      severity: null
    });
    this.causeForm.reset({ description: '' });
    this.modeForm.enable();
    this.effectForm.enable();
    this.causeForm.enable();
    this.restoreTriggerFocus();
  }

  private fetchAnalysis() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.failureModeService.getFailureModesByProcessStep(this.processStepId()).pipe(
      switchMap(modes => {
        if (modes.length === 0) {
          this.bundles.set([]);
          this.expandedIds.set(new Set());
          return of(true);
        }

        return forkJoin(modes.map(mode => this.loadBundle(mode))).pipe(
          map(bundles => {
            this.bundles.set(bundles);
            this.expandedIds.set(new Set());
            return true;
          })
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.bundles.set([]);
        this.errorMessage.set(resolveFailureApiError(error, 'Unable to load failure analysis. Please try again.'));
        return of(false);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  private loadBundle(mode: FailureMode) {
    return forkJoin({
      effect: this.loadEffect(mode.id),
      causes: this.failureCauseService.getFailureCausesByFailureMode(mode.id)
    }).pipe(map(({ effect, causes }) => ({ mode, effect, causes })));
  }

  private loadEffect(failureModeId: string) {
    return this.failureEffectService.getFailureEffectByFailureMode(failureModeId).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of(null);
        }

        // This runs only after GET /failure-modes succeeded with the same
        // HttpClient + auth interceptor, so the token is valid. A missing
        // effect throws EntityNotFoundException on the backend, which is
        // not mapped to 404 and is exposed as 401. Do not treat a 401 on
        // the parent Failure Mode list as an empty effect.
        if (error.status === 401) {
          return of(null);
        }

        return throwError(() => error);
      })
    );
  }

  private activeFormDirty(): boolean {
    const kind = this.editorKind();

    if (kind === 'mode') {
      return this.modeForm.dirty;
    }

    if (kind === 'effect') {
      return this.effectForm.dirty;
    }

    if (kind === 'cause') {
      return this.causeForm.dirty;
    }

    return false;
  }

  private rememberTrigger(event?: Event): void {
    const target = event?.currentTarget;
    this.lastTrigger = target instanceof HTMLElement ? target : null;
  }

  private restoreTriggerFocus(): void {
    this.lastTrigger?.focus();
    this.lastTrigger = null;
  }

  private focusFirstField(): void {
    queueMicrotask(() => this.firstField()?.nativeElement.focus());
  }
}
