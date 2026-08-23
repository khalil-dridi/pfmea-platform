import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { WorkspaceFailureAnalysis } from '../../components/workspace-failure-analysis/workspace-failure-analysis';
import { WorkspaceFunctions } from '../../components/workspace-functions/workspace-functions';
import { WorkspaceOptimization } from '../../components/workspace-optimization/workspace-optimization';
import { WorkspaceRiskAnalysis } from '../../components/workspace-risk-analysis/workspace-risk-analysis';
import { WorkspaceStructure } from '../../components/workspace-structure/workspace-structure';
import { Process } from '../../models/process.model';
import { ProcessStep } from '../../models/process-step.model';
import { ProcessService } from '../../services/process.service';
import { ProcessStepService } from '../../services/process-step.service';
import {
  processStepDescriptionError,
  processStepNameError,
  processStepNumberError,
  resolveProcessStepApiError
} from '../../utils/process-step.utils';
import { formatProcessDateTime, resolveProcessApiError } from '../../utils/process.utils';

type WorkspaceSection = 'structure' | 'functions' | 'failure' | 'risk' | 'optimization';
type EditorMode = 'create' | 'edit' | 'view';
type PendingAction = 'create' | 'update' | 'discard';
type NoticeKind = 'success' | 'pending';

interface WorkspaceSectionItem {
  id: WorkspaceSection;
  title: string;
  message: string;
}

interface WorkspaceNotice {
  kind: NoticeKind;
  title: string;
  status: string | null;
}

@Component({
  selector: 'app-process-workspace',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    ConfirmationDialog,
    WorkspaceStructure,
    WorkspaceFunctions,
    WorkspaceFailureAnalysis,
    WorkspaceRiskAnalysis,
    WorkspaceOptimization
  ],
  templateUrl: './process-workspace.html',
  styleUrl: './process-workspace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessWorkspace {
  private readonly processService = inject(ProcessService);
  private readonly processStepService = inject(ProcessStepService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly firstField = viewChild<ElementRef<HTMLInputElement>>('stepFirstField');

  readonly process = signal<Process | null>(null);
  readonly steps = signal<ProcessStep[]>([]);
  readonly selectedStepId = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly activeSection = signal<WorkspaceSection>('structure');
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly stepsErrorMessage = signal<string | null>(null);
  readonly editorError = signal<string | null>(null);
  readonly notice = signal<WorkspaceNotice | null>(null);
  readonly editorMode = signal<EditorMode | null>(null);
  readonly editingStep = signal<ProcessStep | null>(null);
  readonly pendingAction = signal<PendingAction | null>(null);

  readonly stepForm = this.formBuilder.nonNullable.group({
    stepNumber: [1, [Validators.required, Validators.min(1)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(500)]]
  });

  readonly sections: readonly WorkspaceSectionItem[] = [
    {
      id: 'structure',
      title: 'Structure',
      message: 'Process structure analysis for the selected process step will appear here.'
    },
    {
      id: 'functions',
      title: 'Functions',
      message: 'Function analysis for the selected process step will appear here.'
    },
    {
      id: 'failure',
      title: 'Failure Analysis',
      message: 'Failure analysis for the selected process step will appear here.'
    },
    {
      id: 'risk',
      title: 'Risk Analysis',
      message: 'Risk analysis for the selected process step will appear here.'
    },
    {
      id: 'optimization',
      title: 'Optimization',
      message: 'Optimization for the selected process step will appear here.'
    }
  ];

  readonly filteredSteps = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();

    if (query.length === 0) {
      return this.steps();
    }

    return this.steps().filter(step => {
      return step.name.toLowerCase().includes(query) || String(step.stepNumber).includes(query);
    });
  });

  readonly selectedStep = computed(() => {
    const selectedId = this.selectedStepId();
    return this.steps().find(step => step.id === selectedId) ?? null;
  });

  readonly activeSectionItem = computed(() => {
    const sectionId = this.activeSection();
    return this.sections.find(section => section.id === sectionId) ?? this.sections[0];
  });

  readonly editorTitle = computed(() => {
    const mode = this.editorMode();

    if (mode === 'edit') {
      return 'Edit Process Step';
    }

    if (mode === 'view') {
      return 'Process Step Details';
    }

    return 'Add Process Step';
  });

  readonly confirmTitle = computed(() => {
    const action = this.pendingAction();

    if (action === 'update') {
      return 'Save Changes?';
    }

    if (action === 'discard') {
      return 'Discard Changes?';
    }

    return 'Create Process Step?';
  });

  readonly confirmMessage = computed(() => {
    const action = this.pendingAction();

    if (action === 'update') {
      return 'Are you sure you want to update this process step?';
    }

    if (action === 'discard') {
      return 'Are you sure you want to leave without saving your changes?';
    }

    return 'Are you sure you want to create this process step?';
  });

  private lastTrigger: HTMLElement | null = null;
  private ignoreNextEscape = false;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.isLoading.set(false);
      this.errorMessage.set('Process not found.');
      return;
    }

    this.loadWorkspace(id);
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

  selectStep(stepId: string): void {
    this.selectedStepId.set(stepId);
  }

  selectSection(sectionId: WorkspaceSection): void {
    this.activeSection.set(sectionId);
  }

  formatDate(value: string): string {
    return formatProcessDateTime(value);
  }

  retry(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.loadWorkspace(id);
    }
  }

  back(): void {
    void this.router.navigateByUrl('/processes');
  }

  openCreateStep(event?: Event): void {
    this.rememberTrigger(event);
    this.notice.set(null);
    this.editorError.set(null);
    this.editingStep.set(null);
    this.editorMode.set('create');
    this.stepForm.reset({
      stepNumber: this.nextStepNumber(),
      name: '',
      description: ''
    });
    this.stepForm.enable();
    this.focusFirstField();
  }

  openViewStep(step: ProcessStep, event: Event): void {
    event.stopPropagation();
    this.rememberTrigger(event);
    this.editorError.set(null);
    this.editingStep.set(step);
    this.editorMode.set('view');
    this.populateForm(step);
    this.stepForm.disable();
    this.focusFirstField();
  }

  openEditStep(step: ProcessStep, event: Event): void {
    event.stopPropagation();
    this.rememberTrigger(event);
    this.notice.set(null);
    this.editorError.set(null);
    this.editingStep.set(step);
    this.editorMode.set('edit');
    this.populateForm(step);
    this.stepForm.enable();
    this.focusFirstField();
  }

  requestCloseEditor(): void {
    if (this.isSaving() || this.pendingAction() !== null) {
      return;
    }

    if (this.editorMode() === 'view' || !this.stepForm.dirty) {
      this.forceCloseEditor();
      return;
    }

    this.pendingAction.set('discard');
  }

  requestSaveStep(): void {
    if (this.editorMode() === 'view' || this.isSaving() || this.pendingAction() !== null) {
      return;
    }

    this.stepForm.patchValue({
      name: this.stepForm.controls.name.value.trim(),
      description: this.stepForm.controls.description.value.trim()
    });

    if (this.stepForm.invalid) {
      this.stepForm.markAllAsTouched();
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
      this.submitCreateStep();
      return;
    }

    this.submitUpdateStep();
  }

  nameError(): string | null {
    return processStepNameError(this.stepForm.controls.name);
  }

  numberError(): string | null {
    return processStepNumberError(this.stepForm.controls.stepNumber);
  }

  descriptionError(): string | null {
    return processStepDescriptionError(this.stepForm.controls.description);
  }

  private populateForm(step: ProcessStep): void {
    this.stepForm.reset({
      stepNumber: step.stepNumber,
      name: step.name,
      description: step.description ?? ''
    });
  }

  private nextStepNumber(): number {
    const numbers = this.steps().map(step => step.stepNumber);
    return numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
  }

  private submitCreateStep(): void {
    const processId = this.process()?.id;

    if (!processId) {
      return;
    }

    const values = this.stepForm.getRawValue();
    this.isSaving.set(true);

    this.processStepService
      .createProcessStep({
        processId,
        stepNumber: Number(values.stepNumber),
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
                  title: 'Your process step creation request has been submitted for approval.',
                  status: 'Pending approval'
                }
              : {
                  kind: 'success',
                  title: 'Process step created successfully.',
                  status: null
                }
          );
        },
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to create this process step.')
      });
  }

  private submitUpdateStep(): void {
    const step = this.editingStep();

    if (!step) {
      return;
    }

    const values = this.stepForm.getRawValue();
    this.isSaving.set(true);

    this.processStepService
      .updateProcessStep(step.id, {
        stepNumber: Number(values.stepNumber),
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
                  title: 'Process step updated successfully.',
                  status: null
                }
          );
        },
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to update this process step.')
      });
  }

  private finishSuccessfulSave(notice: WorkspaceNotice): void {
    this.isSaving.set(false);
    this.pendingAction.set(null);
    this.forceCloseEditor();
    this.notice.set(notice);
    this.reloadSteps();
  }

  private failSave(error: HttpErrorResponse, fallback: string): void {
    this.isSaving.set(false);
    this.pendingAction.set(null);
    this.editorError.set(resolveProcessStepApiError(error, fallback));
  }

  private forceCloseEditor(): void {
    this.editorMode.set(null);
    this.editingStep.set(null);
    this.pendingAction.set(null);
    this.editorError.set(null);
    this.stepForm.reset({
      stepNumber: 1,
      name: '',
      description: ''
    });
    this.stepForm.enable();
    this.restoreTriggerFocus();
  }

  private reloadSteps(): void {
    const processId = this.process()?.id;

    if (!processId) {
      return;
    }

    this.processStepService
      .getStepsByProcess(processId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: steps => {
          this.steps.set(steps);
          const currentSelection = this.selectedStepId();
          const stillExists = steps.some(step => step.id === currentSelection);
          this.selectedStepId.set(stillExists ? currentSelection : (steps[0]?.id ?? null));
        },
        error: (error: HttpErrorResponse) => {
          this.stepsErrorMessage.set(this.resolveStepsError(error));
        }
      });
  }

  private loadWorkspace(processId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.stepsErrorMessage.set(null);

    forkJoin({
      process: this.processService.getProcessById(processId),
      steps: this.processStepService.getStepsByProcess(processId).pipe(
        catchError((error: HttpErrorResponse) => {
          this.stepsErrorMessage.set(this.resolveStepsError(error));
          return of<ProcessStep[]>([]);
        })
      )
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: ({ process, steps }) => {
          this.process.set(process);
          this.steps.set(steps);

          const currentSelection = this.selectedStepId();
          const stillExists = steps.some(step => step.id === currentSelection);
          this.selectedStepId.set(stillExists ? currentSelection : (steps[0]?.id ?? null));
        },
        error: (error: HttpErrorResponse) => {
          this.process.set(null);
          this.steps.set([]);
          this.selectedStepId.set(null);
          this.errorMessage.set(this.resolveProcessError(error));
        }
      });
  }

  private resolveProcessError(error: HttpErrorResponse): string {
    if (error.status === 404) {
      return 'Process not found.';
    }

    return resolveProcessApiError(error, 'Unable to load this process. Please try again.');
  }

  private resolveStepsError(error: HttpErrorResponse): string {
    if (error.status === 404) {
      return 'Process not found.';
    }

    return 'Unable to load process steps. Please try again.';
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
