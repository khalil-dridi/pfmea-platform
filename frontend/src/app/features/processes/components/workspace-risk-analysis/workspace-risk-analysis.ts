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
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, distinctUntilChanged, finalize, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { FailureCause } from '../../models/failure-cause.model';
import { FailureMode } from '../../models/failure-mode.model';
import { ActionPriority, DetectionScope, RiskAnalysis } from '../../models/risk-analysis.model';
import { FailureCauseService } from '../../services/failure-cause.service';
import { FailureModeService } from '../../services/failure-mode.service';
import { RiskAnalysisService } from '../../services/risk-analysis.service';
import { optionalRequestText, optionalText, optionalTextError } from '../../utils/failure-analysis.utils';
import {
  ACTION_PRIORITIES,
  DETECTION_SCOPES,
  controlPreview,
  detectionScopeLabel,
  isMissingRiskAnalysis,
  priorityClass,
  requiredValueError,
  resolveRiskApiError
} from '../../utils/risk-analysis.utils';

type NoticeKind = 'success' | 'pending';
type EditorMode = 'create' | 'edit' | 'view';
type PendingAction = 'create' | 'update' | 'discard';
type PriorityFilter = 'all' | ActionPriority;
type EmptyKind = 'none' | 'filter';

interface RiskNotice {
  kind: NoticeKind;
  title: string;
  status: string | null;
}

interface PriorityFilterOption {
  id: PriorityFilter;
  label: string;
}

interface RiskAnalysisRow {
  mode: FailureMode;
  cause: FailureCause;
  risk: RiskAnalysis | null;
  loadError: string | null;
}

@Component({
  selector: 'app-workspace-risk-analysis',
  imports: [FormsModule, ReactiveFormsModule, ConfirmationDialog],
  templateUrl: './workspace-risk-analysis.html',
  styleUrl: './workspace-risk-analysis.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceRiskAnalysis {
  private readonly failureModeService = inject(FailureModeService);
  private readonly failureCauseService = inject(FailureCauseService);
  private readonly riskAnalysisService = inject(RiskAnalysisService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly processStepId = input.required<string>();
  readonly firstField = viewChild<ElementRef<HTMLElement>>('firstField');

  readonly rows = signal<RiskAnalysisRow[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly editorError = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly priorityFilter = signal<PriorityFilter>('all');
  readonly notice = signal<RiskNotice | null>(null);
  readonly editorMode = signal<EditorMode | null>(null);
  readonly editingRow = signal<RiskAnalysisRow | null>(null);
  readonly pendingAction = signal<PendingAction | null>(null);
  readonly detectionScopes = DETECTION_SCOPES;
  readonly actionPriorities = ACTION_PRIORITIES;
  readonly priorityFilters: readonly PriorityFilterOption[] = [
    { id: 'all', label: 'All' },
    { id: 'HIGH', label: 'High' },
    { id: 'MEDIUM', label: 'Medium' },
    { id: 'LOW', label: 'Low' }
  ];

  readonly riskForm = this.formBuilder.nonNullable.group({
    currentPreventionControl: ['', [Validators.maxLength(2000)]],
    occurrence: this.formBuilder.control<number | null>(null, Validators.required),
    currentDetectionControl: ['', [Validators.maxLength(2000)]],
    detection: this.formBuilder.control<number | null>(null, Validators.required),
    detectionScope: this.formBuilder.control<DetectionScope | null>(null, Validators.required),
    actionPriority: this.formBuilder.control<ActionPriority | null>(null, Validators.required),
    specialProcess: ['', [Validators.maxLength(1000)]],
    specialCharacteristic: ['', [Validators.maxLength(1000)]]
  });

  readonly filteredRows = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const priority = this.priorityFilter();

    return this.rows().filter(row => {
      if (priority !== 'all' && row.risk?.actionPriority !== priority) {
        return false;
      }

      if (query.length === 0) {
        return true;
      }

      const modeCode = row.mode.failureCode ?? '';
      const prevention = row.risk?.currentPreventionControl ?? '';
      const detection = row.risk?.currentDetectionControl ?? '';

      return (
        row.mode.description.toLowerCase().includes(query) ||
        modeCode.toLowerCase().includes(query) ||
        row.cause.description.toLowerCase().includes(query) ||
        prevention.toLowerCase().includes(query) ||
        detection.toLowerCase().includes(query)
      );
    });
  });

  readonly emptyKind = computed<EmptyKind | null>(() => {
    if (this.isLoading() || this.errorMessage() !== null) {
      return null;
    }

    if (this.rows().length === 0) {
      return 'none';
    }

    if (this.filteredRows().length === 0) {
      return 'filter';
    }

    return null;
  });

  readonly editorTitle = computed(() => {
    const mode = this.editorMode();

    if (mode === 'edit') {
      return 'Edit Risk Analysis';
    }

    return mode === 'view' ? 'Risk Analysis' : 'Add Risk Analysis';
  });

  readonly confirmTitle = computed(() => {
    const action = this.pendingAction();

    if (action === 'create') {
      return 'Create Risk Analysis?';
    }

    if (action === 'discard') {
      return 'Discard Changes?';
    }

    return 'Save Changes?';
  });

  readonly confirmMessage = computed(() => {
    const action = this.pendingAction();

    if (action === 'create') {
      return 'Are you sure you want to create the risk analysis for this failure cause?';
    }

    if (action === 'update') {
      return 'Are you sure you want to update this risk analysis?';
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
          this.priorityFilter.set('all');
          this.forceCloseEditor();
          this.notice.set(null);
          return this.fetchRows();
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

    if (this.pendingAction() !== null || this.isSaving() || this.editorMode() === null) {
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

  selectPriorityFilter(priority: PriorityFilter): void {
    this.priorityFilter.set(priority);
  }

  displayText(value: string | null | undefined): string {
    return optionalText(value);
  }

  controlText(value: string | null | undefined, hasRisk: boolean): string {
    return hasRisk ? controlPreview(value) : 'Not defined';
  }

  numericText(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : String(value);
  }

  scopeLabel(scope: DetectionScope): string {
    return detectionScopeLabel(scope);
  }

  apClass(priority: ActionPriority): string {
    return priorityClass(priority);
  }

  openCreate(row: RiskAnalysisRow, event: Event): void {
    this.openEditor('create', row, event);
    this.riskForm.reset({
      currentPreventionControl: '',
      occurrence: null,
      currentDetectionControl: '',
      detection: null,
      detectionScope: null,
      actionPriority: null,
      specialProcess: '',
      specialCharacteristic: ''
    });
    this.riskForm.enable();
    this.focusFirstField();
  }

  openView(row: RiskAnalysisRow, event: Event): void {
    if (!row.risk) {
      return;
    }

    this.openEditor('view', row, event);
    this.focusFirstField();
  }

  openEdit(row: RiskAnalysisRow, event: Event): void {
    if (!row.risk) {
      return;
    }

    this.openEditor('edit', row, event);
    this.riskForm.reset({
      currentPreventionControl: row.risk.currentPreventionControl ?? '',
      occurrence: row.risk.occurrence,
      currentDetectionControl: row.risk.currentDetectionControl ?? '',
      detection: row.risk.detection,
      detectionScope: row.risk.detectionScope,
      actionPriority: row.risk.actionPriority,
      specialProcess: row.risk.specialProcess ?? '',
      specialCharacteristic: row.risk.specialCharacteristic ?? ''
    });
    this.riskForm.enable();
    this.focusFirstField();
  }

  requestCloseEditor(): void {
    if (this.isSaving() || this.pendingAction() !== null) {
      return;
    }

    if (this.editorMode() === 'view' || !this.riskForm.dirty) {
      this.forceCloseEditor();
      return;
    }

    this.pendingAction.set('discard');
  }

  requestSave(): void {
    if (this.editorMode() === 'view' || this.isSaving() || this.pendingAction() !== null) {
      return;
    }

    this.riskForm.patchValue({
      currentPreventionControl: this.riskForm.controls.currentPreventionControl.value.trim(),
      currentDetectionControl: this.riskForm.controls.currentDetectionControl.value.trim(),
      specialProcess: this.riskForm.controls.specialProcess.value.trim(),
      specialCharacteristic: this.riskForm.controls.specialCharacteristic.value.trim()
    });

    if (this.riskForm.invalid) {
      this.riskForm.markAllAsTouched();
      return;
    }

    this.editorError.set(null);
    this.pendingAction.set(this.editorMode() === 'edit' ? 'update' : 'create');
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

    if (action === 'create') {
      this.submitCreate();
      return;
    }

    this.submitUpdate();
  }

  retry(): void {
    this.fetchRows().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  retryRow(row: RiskAnalysisRow): void {
    this.loadRisk(row.cause.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(slot => {
        this.rows.update(items =>
          items.map(item =>
            item.cause.id === row.cause.id
              ? { ...item, risk: slot.risk, loadError: slot.error }
              : item
          )
        );
      });
  }

  preventionError(): string | null {
    return optionalTextError(this.riskForm.controls.currentPreventionControl, 'Current Prevention Control', 2000);
  }

  occurrenceError(): string | null {
    return requiredValueError(this.riskForm.controls.occurrence, 'Occurrence');
  }

  detectionControlError(): string | null {
    return optionalTextError(this.riskForm.controls.currentDetectionControl, 'Current Detection Control', 2000);
  }

  detectionError(): string | null {
    return requiredValueError(this.riskForm.controls.detection, 'Detection');
  }

  scopeError(): string | null {
    return requiredValueError(this.riskForm.controls.detectionScope, 'Detection Scope');
  }

  priorityError(): string | null {
    return requiredValueError(this.riskForm.controls.actionPriority, 'Action Priority');
  }

  specialProcessError(): string | null {
    return optionalTextError(this.riskForm.controls.specialProcess, 'Special Process', 1000);
  }

  characteristicError(): string | null {
    return optionalTextError(this.riskForm.controls.specialCharacteristic, 'Special Characteristic', 1000);
  }

  private openEditor(mode: EditorMode, row: RiskAnalysisRow, event: Event): void {
    this.rememberTrigger(event);
    this.notice.set(null);
    this.editorError.set(null);
    this.editingRow.set(row);
    this.editorMode.set(mode);
  }

  private submitCreate(): void {
    const row = this.editingRow();
    const values = this.riskForm.getRawValue();

    if (
      !row ||
      values.occurrence === null ||
      values.detection === null ||
      !values.detectionScope ||
      !values.actionPriority
    ) {
      return;
    }

    this.isSaving.set(true);
    this.riskAnalysisService
      .createRiskAnalysis({
        failureCauseId: row.cause.id,
        currentPreventionControl: optionalRequestText(values.currentPreventionControl),
        occurrence: values.occurrence,
        currentDetectionControl: optionalRequestText(values.currentDetectionControl),
        detection: values.detection,
        detectionScope: values.detectionScope,
        actionPriority: values.actionPriority,
        specialProcess: optionalRequestText(values.specialProcess),
        specialCharacteristic: optionalRequestText(values.specialCharacteristic)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result =>
          this.finishSuccessfulSave(
            result.outcome === 'pending'
              ? {
                  kind: 'pending',
                  title: 'Your risk analysis creation request has been submitted for approval.',
                  status: 'Pending approval'
                }
              : {
                  kind: 'success',
                  title: 'Risk analysis created successfully.',
                  status: null
                }
          ),
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to create this risk analysis.')
      });
  }

  private submitUpdate(): void {
    const row = this.editingRow();
    const values = this.riskForm.getRawValue();

    if (
      !row?.risk ||
      values.occurrence === null ||
      values.detection === null ||
      !values.detectionScope ||
      !values.actionPriority
    ) {
      return;
    }

    this.isSaving.set(true);
    this.riskAnalysisService
      .updateRiskAnalysis(row.risk.id, {
        currentPreventionControl: optionalRequestText(values.currentPreventionControl),
        occurrence: values.occurrence,
        currentDetectionControl: optionalRequestText(values.currentDetectionControl),
        detection: values.detection,
        detectionScope: values.detectionScope,
        actionPriority: values.actionPriority,
        specialProcess: optionalRequestText(values.specialProcess),
        specialCharacteristic: optionalRequestText(values.specialCharacteristic)
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
                  title: 'Risk analysis updated successfully.',
                  status: null
                }
          ),
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to update this risk analysis.')
      });
  }

  private finishSuccessfulSave(notice: RiskNotice): void {
    this.isSaving.set(false);
    this.pendingAction.set(null);
    this.forceCloseEditor();
    this.notice.set(notice);
    this.fetchRows().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private failSave(error: HttpErrorResponse, fallback: string): void {
    this.isSaving.set(false);
    this.pendingAction.set(null);
    this.editorError.set(resolveRiskApiError(error, fallback));
  }

  private forceCloseEditor(): void {
    this.editorMode.set(null);
    this.editingRow.set(null);
    this.pendingAction.set(null);
    this.editorError.set(null);
    this.riskForm.reset({
      currentPreventionControl: '',
      occurrence: null,
      currentDetectionControl: '',
      detection: null,
      detectionScope: null,
      actionPriority: null,
      specialProcess: '',
      specialCharacteristic: ''
    });
    this.riskForm.enable();
    this.restoreTriggerFocus();
  }

  private fetchRows() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.failureModeService.getFailureModesByProcessStep(this.processStepId()).pipe(
      switchMap(modes => {
        if (modes.length === 0) {
          this.rows.set([]);
          return of(true);
        }

        return forkJoin(modes.map(mode => this.loadModeRows(mode))).pipe(
          map(groups => {
            this.rows.set(groups.flat());
            return true;
          })
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.rows.set([]);
        this.errorMessage.set(resolveRiskApiError(error, 'Unable to load risk analysis. Please try again.'));
        return of(false);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  private loadModeRows(mode: FailureMode) {
    return this.failureCauseService.getFailureCausesByFailureMode(mode.id).pipe(
      switchMap(causes => {
        if (causes.length === 0) {
          return of([] as RiskAnalysisRow[]);
        }

        return forkJoin(causes.map(cause => this.loadRow(mode, cause)));
      })
    );
  }

  private loadRow(mode: FailureMode, cause: FailureCause) {
    return this.loadRisk(cause.id).pipe(
      map(slot => ({
        mode,
        cause,
        risk: slot.risk,
        loadError: slot.error
      }))
    );
  }

  private loadRisk(failureCauseId: string) {
    return this.riskAnalysisService.getRiskAnalysisByFailureCause(failureCauseId).pipe(
      map(risk => ({ risk, error: null as string | null })),
      catchError((error: HttpErrorResponse) => {
        if (isMissingRiskAnalysis(error)) {
          return of({ risk: null, error: null as string | null });
        }

        if (error.status === 401) {
          return throwError(() => error);
        }

        return of({
          risk: null,
          error: resolveRiskApiError(error, 'Unable to load risk analysis. Please try again.')
        });
      })
    );
  }

  private rememberTrigger(event: Event): void {
    const target = event.currentTarget;
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
