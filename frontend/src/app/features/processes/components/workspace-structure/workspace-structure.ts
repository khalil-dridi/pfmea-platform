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
import { catchError, distinctUntilChanged, finalize, of, switchMap, tap } from 'rxjs';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { ProcessWorkElement } from '../../models/process-work-element.model';
import { ProcessWorkElementService } from '../../services/process-work-element.service';
import {
  resolveWorkElementApiError,
  workElementDescriptionError,
  workElementNameError,
  workElementNumberError
} from '../../utils/process-work-element.utils';

type StructureNoticeKind = 'success' | 'pending';
type EditorMode = 'create' | 'edit' | 'view';
type PendingAction = 'create' | 'update' | 'discard';

interface StructureNotice {
  kind: StructureNoticeKind;
  title: string;
  status: string | null;
}

@Component({
  selector: 'app-workspace-structure',
  imports: [ReactiveFormsModule, ConfirmationDialog],
  templateUrl: './workspace-structure.html',
  styleUrl: './workspace-structure.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceStructure {
  private readonly workElementService = inject(ProcessWorkElementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly processStepId = input.required<string>();
  readonly firstField = viewChild<ElementRef<HTMLInputElement>>('firstField');

  readonly workElements = signal<ProcessWorkElement[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly editorError = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly notice = signal<StructureNotice | null>(null);
  readonly editorMode = signal<EditorMode | null>(null);
  readonly editingElement = signal<ProcessWorkElement | null>(null);
  readonly pendingAction = signal<PendingAction | null>(null);

  readonly editorForm = this.formBuilder.nonNullable.group({
    elementNumber: [1, [Validators.required, Validators.min(1)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(500)]]
  });

  readonly filteredWorkElements = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();

    if (query.length === 0) {
      return this.workElements();
    }

    return this.workElements().filter(element => {
      const description = element.description ?? '';
      return (
        String(element.elementNumber).includes(query) ||
        element.name.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query)
      );
    });
  });

  readonly editorTitle = computed(() => {
    const mode = this.editorMode();

    if (mode === 'edit') {
      return 'Edit Work Element';
    }

    if (mode === 'view') {
      return 'Work Element Details';
    }

    return 'Add Work Element';
  });

  readonly confirmTitle = computed(() => {
    const action = this.pendingAction();

    if (action === 'update') {
      return 'Save Changes?';
    }

    if (action === 'discard') {
      return 'Discard Changes?';
    }

    return 'Create Work Element?';
  });

  readonly confirmMessage = computed(() => {
    const action = this.pendingAction();

    if (action === 'update') {
      return 'Are you sure you want to submit these changes?';
    }

    if (action === 'discard') {
      return 'Are you sure you want to leave without saving your changes?';
    }

    return 'Are you sure you want to create this work element?';
  });

  private lastTrigger: HTMLElement | null = null;
  private ignoreNextEscape = false;

  constructor() {
    toObservable(this.processStepId)
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(),
        switchMap(processStepId => {
          this.searchQuery.set('');
          this.forceCloseEditor();
          this.notice.set(null);
          return this.fetchWorkElements(processStepId);
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

  openCreate(event?: Event): void {
    this.rememberTrigger(event);
    this.notice.set(null);
    this.editorError.set(null);
    this.editingElement.set(null);
    this.editorMode.set('create');
    this.editorForm.reset({
      elementNumber: this.nextElementNumber(),
      name: '',
      description: ''
    });
    this.editorForm.enable();
    this.focusFirstField();
  }

  openView(element: ProcessWorkElement, event?: Event): void {
    this.rememberTrigger(event);
    this.editorError.set(null);
    this.editingElement.set(element);
    this.editorMode.set('view');
    this.populateForm(element);
    this.editorForm.disable();
    this.focusFirstField();
  }

  openEdit(element: ProcessWorkElement, event?: Event): void {
    this.rememberTrigger(event);
    this.notice.set(null);
    this.editorError.set(null);
    this.editingElement.set(element);
    this.editorMode.set('edit');
    this.populateForm(element);
    this.editorForm.enable();
    this.focusFirstField();
  }

  requestCloseEditor(): void {
    if (this.isSaving() || this.pendingAction() !== null) {
      return;
    }

    if (this.editorMode() === 'view' || !this.editorForm.dirty) {
      this.forceCloseEditor();
      return;
    }

    this.pendingAction.set('discard');
  }

  requestSave(): void {
    if (this.editorMode() === 'view' || this.isSaving() || this.pendingAction() !== null) {
      return;
    }

    this.editorForm.patchValue({
      name: this.editorForm.controls.name.value.trim(),
      description: this.editorForm.controls.description.value.trim()
    });

    if (this.editorForm.invalid) {
      this.editorForm.markAllAsTouched();
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
    this.fetchWorkElements(this.processStepId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  nameError(): string | null {
    return workElementNameError(this.editorForm.controls.name);
  }

  numberError(): string | null {
    return workElementNumberError(this.editorForm.controls.elementNumber);
  }

  descriptionError(): string | null {
    return workElementDescriptionError(this.editorForm.controls.description);
  }

  descriptionText(value: string | null): string {
    return value && value.trim().length > 0 ? value : '—';
  }

  private populateForm(element: ProcessWorkElement): void {
    this.editorForm.reset({
      elementNumber: element.elementNumber,
      name: element.name,
      description: element.description ?? ''
    });
  }

  private nextElementNumber(): number {
    const numbers = this.workElements().map(element => element.elementNumber);
    return numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
  }

  private submitCreate(): void {
    const values = this.editorForm.getRawValue();

    this.isSaving.set(true);
    this.workElementService
      .createWorkElement({
        processStepId: this.processStepId(),
        elementNumber: Number(values.elementNumber),
        name: values.name,
        description: values.description
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.finishSuccessfulSave(
            result.outcome === 'pending'
              ? {
                  kind: 'pending',
                  title: 'Your work element creation request has been submitted for approval.',
                  status: 'Pending approval'
                }
              : {
                  kind: 'success',
                  title: 'Work element created successfully.',
                  status: null
                }
          );
        },
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to create this work element.')
      });
  }

  private submitUpdate(): void {
    const element = this.editingElement();

    if (!element) {
      return;
    }

    const values = this.editorForm.getRawValue();

    this.isSaving.set(true);
    this.workElementService
      .updateWorkElement(element.id, {
        elementNumber: Number(values.elementNumber),
        name: values.name,
        description: values.description
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.finishSuccessfulSave(
            result.outcome === 'pending'
              ? {
                  kind: 'pending',
                  title: 'Your change request has been submitted for approval.',
                  status: 'Pending approval'
                }
              : {
                  kind: 'success',
                  title: 'Work element updated successfully.',
                  status: null
                }
          );
        },
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to update this work element.')
      });
  }

  private finishSuccessfulSave(notice: StructureNotice): void {
    this.isSaving.set(false);
    this.pendingAction.set(null);
    this.forceCloseEditor();
    this.notice.set(notice);
    this.reloadAfterMutation();
  }

  private failSave(error: HttpErrorResponse, fallback: string): void {
    this.isSaving.set(false);
    this.pendingAction.set(null);
    this.editorError.set(resolveWorkElementApiError(error, fallback));
  }

  private forceCloseEditor(): void {
    this.editorMode.set(null);
    this.editingElement.set(null);
    this.pendingAction.set(null);
    this.editorError.set(null);
    this.editorForm.reset({
      elementNumber: 1,
      name: '',
      description: ''
    });
    this.editorForm.enable();
    this.restoreTriggerFocus();
  }

  private reloadAfterMutation(): void {
    this.fetchWorkElements(this.processStepId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private fetchWorkElements(processStepId: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.workElementService.getWorkElementsByProcessStep(processStepId).pipe(
      tap(elements => this.workElements.set(elements)),
      catchError((error: HttpErrorResponse) => {
        this.workElements.set([]);
        this.errorMessage.set(
          resolveWorkElementApiError(error, 'Unable to load work elements. Please try again.')
        );
        return of<ProcessWorkElement[]>([]);
      }),
      finalize(() => this.isLoading.set(false))
    );
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
