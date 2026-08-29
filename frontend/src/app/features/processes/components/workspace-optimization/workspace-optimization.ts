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
import { FormArray, FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, distinctUntilChanged, finalize, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { ControlListEditor } from '../control-list-editor/control-list-editor';
import { FailureCause } from '../../models/failure-cause.model';
import { FailureEffect } from '../../models/failure-effect.model';
import { FailureMode } from '../../models/failure-mode.model';
import { OptimizationAction, OptimizationActionStatus, OptimizationActionType } from '../../models/optimization-action.model';
import { Optimization } from '../../models/optimization.model';
import { ActionPriority, DetectionScope, RiskAnalysis } from '../../models/risk-analysis.model';
import { FailureCauseService } from '../../services/failure-cause.service';
import { FailureEffectService } from '../../services/failure-effect.service';
import { FailureModeService } from '../../services/failure-mode.service';
import { OptimizationActionService } from '../../services/optimization-action.service';
import { OptimizationService } from '../../services/optimization.service';
import { RiskAnalysisService } from '../../services/risk-analysis.service';
import { optionalRequestText, optionalText, optionalTextError, requiredTextError } from '../../utils/failure-analysis.utils';
import {
  CONTROL_FIELD_MAX_LENGTH,
  controlListError,
  controlsToMultilineString,
  createControlList,
  replaceControlList
} from '../../utils/control-list.utils';
import {
  actionStatusClass,
  actionStatusLabel,
  actionTypeClass,
  actionTypeLabel,
  displayDate,
  isMissingOptimization,
  numericDisplay,
  optionalDate,
  OPTIMIZATION_ACTION_STATUSES,
  OPTIMIZATION_ACTION_TYPES,
  priorityBadge,
  resolveOptimizationApiError
} from '../../utils/optimization.utils';
import {
  ACTION_PRIORITIES,
  DETECTION_SCOPES,
  detectionScopeLabel,
  isMissingRiskAnalysis,
  requiredValueError,
  resolveRiskApiError
} from '../../utils/risk-analysis.utils';

type NoticeKind = 'success' | 'pending';
type EditorKind = 'risk' | 'optimization' | 'action';
type EditorMode = 'create' | 'edit' | 'view';
type PendingAction =
  | 'create-risk'
  | 'create-optimization'
  | 'update-optimization'
  | 'create-action'
  | 'update-action'
  | 'discard';
type StatusFilter = 'all' | OptimizationActionStatus;
type EmptyKind = 'none' | 'filter';

interface OptimizationNotice {
  kind: NoticeKind;
  title: string;
  status: string | null;
}

interface StatusFilterOption {
  id: StatusFilter;
  label: string;
}

interface OptimizationRow {
  mode: FailureMode;
  cause: FailureCause;
  effect: FailureEffect | null;
  risk: RiskAnalysis | null;
  optimization: Optimization | null;
  actions: OptimizationAction[];
  loadError: string | null;
}

@Component({
  selector: 'app-workspace-optimization',
  imports: [FormsModule, ReactiveFormsModule, ConfirmationDialog, ControlListEditor],
  templateUrl: './workspace-optimization.html',
  styleUrl: './workspace-optimization.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceOptimization {
  private readonly failureModeService = inject(FailureModeService);
  private readonly failureCauseService = inject(FailureCauseService);
  private readonly failureEffectService = inject(FailureEffectService);
  private readonly riskAnalysisService = inject(RiskAnalysisService);
  private readonly optimizationService = inject(OptimizationService);
  private readonly optimizationActionService = inject(OptimizationActionService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly processStepId = input.required<string>();
  readonly firstField = viewChild<ElementRef<HTMLElement>>('firstField');

  readonly rows = signal<OptimizationRow[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly editorError = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly notice = signal<OptimizationNotice | null>(null);
  readonly editorKind = signal<EditorKind | null>(null);
  readonly editorMode = signal<EditorMode | null>(null);
  readonly editingRow = signal<OptimizationRow | null>(null);
  readonly editingAction = signal<OptimizationAction | null>(null);
  readonly pendingAction = signal<PendingAction | null>(null);
  readonly actionPriorities = ACTION_PRIORITIES;
  readonly detectionScopes = DETECTION_SCOPES;
  readonly actionTypes = OPTIMIZATION_ACTION_TYPES;
  readonly actionStatuses = OPTIMIZATION_ACTION_STATUSES;
  readonly statusFilters: readonly StatusFilterOption[] = [
    { id: 'all', label: 'All' },
    { id: 'IN_APPLICATION', label: 'In Application' },
    { id: 'CLOSED', label: 'Closed' }
  ];

  readonly riskForm = this.formBuilder.nonNullable.group({
    preventionControls: createControlList(this.formBuilder),
    occurrence: this.formBuilder.control<number | null>(null, Validators.required),
    detectionControls: createControlList(this.formBuilder),
    detection: this.formBuilder.control<number | null>(null, Validators.required),
    detectionScope: this.formBuilder.control<DetectionScope | null>(null, Validators.required),
    actionPriority: this.formBuilder.control<ActionPriority | null>(null, Validators.required),
    specialProcess: ['', [Validators.maxLength(1000)]],
    specialCharacteristic: ['', [Validators.maxLength(1000)]]
  });

  get preventionControls(): FormArray<FormControl<string>> {
    return this.riskForm.controls.preventionControls;
  }

  get detectionControls(): FormArray<FormControl<string>> {
    return this.riskForm.controls.detectionControls;
  }

  readonly optimizationForm = this.formBuilder.nonNullable.group({
    severity: this.formBuilder.control<number | null>(null, Validators.required),
    occurrence: this.formBuilder.control<number | null>(null, Validators.required),
    detection: this.formBuilder.control<number | null>(null, Validators.required),
    actionPriority: this.formBuilder.control<ActionPriority | null>(null, Validators.required),
    specialProcess: ['', [Validators.maxLength(1000)]],
    specialCharacteristic: ['', [Validators.maxLength(1000)]],
    remarks: ['', [Validators.maxLength(2000)]]
  });

  readonly actionForm = this.formBuilder.nonNullable.group({
    actionType: this.formBuilder.control<OptimizationActionType | null>(null, Validators.required),
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    responsiblePerson: ['', [Validators.maxLength(255)]],
    targetCompletionDate: [''],
    status: this.formBuilder.control<OptimizationActionStatus | null>(null, Validators.required),
    evidence: ['', [Validators.maxLength(2000)]],
    completionDate: ['']
  });

  readonly filteredRows = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    return this.rows().filter(row => {
      if (status !== 'all' && !row.actions.some(action => action.status === status)) {
        return false;
      }

      if (query.length === 0) {
        return true;
      }

      const code = row.mode.failureCode ?? '';
      const actionText = row.actions.map(action => action.description).join(' ');

      return (
        row.mode.description.toLowerCase().includes(query) ||
        code.toLowerCase().includes(query) ||
        row.cause.description.toLowerCase().includes(query) ||
        actionText.toLowerCase().includes(query)
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
    const kind = this.editorKind();
    const mode = this.editorMode();

    if (kind === 'risk') {
      return 'Add Risk Analysis';
    }

    if (kind === 'action') {
      if (mode === 'edit') {
        return 'Edit Optimization Action';
      }

      return mode === 'view' ? 'Optimization Action' : 'Add Optimization Action';
    }

    if (mode === 'edit') {
      return 'Edit Optimization';
    }

    return mode === 'view' ? 'Optimization' : 'Add Optimization';
  });

  readonly confirmTitle = computed(() => {
    const action = this.pendingAction();

    if (action === 'create-risk') {
      return 'Create Risk Analysis?';
    }

    if (action === 'create-optimization') {
      return 'Create Optimization?';
    }

    if (action === 'create-action') {
      return 'Create Optimization Action?';
    }

    if (action === 'discard') {
      return 'Discard Changes?';
    }

    return 'Save Changes?';
  });

  readonly confirmMessage = computed(() => {
    const action = this.pendingAction();

    if (action === 'create-risk') {
      return 'Are you sure you want to create the risk analysis for this failure cause?';
    }

    if (action === 'create-optimization') {
      return 'Are you sure you want to create the optimization for this risk analysis?';
    }

    if (action === 'update-optimization') {
      return 'Are you sure you want to update this optimization?';
    }

    if (action === 'create-action') {
      return 'Are you sure you want to create this optimization action?';
    }

    if (action === 'update-action') {
      return 'Are you sure you want to update this optimization action?';
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
          this.statusFilter.set('all');
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

  selectStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
  }

  displayText(value: string | null | undefined): string {
    return optionalText(value);
  }

  dateText(value: string | null | undefined): string {
    return displayDate(value);
  }

  metricText(value: number | null | undefined): string {
    return numericDisplay(value);
  }

  apClass(priority: ActionPriority): string {
    return priorityBadge(priority);
  }

  typeLabel(type: OptimizationActionType): string {
    return actionTypeLabel(type);
  }

  statusLabel(status: OptimizationActionStatus): string {
    return actionStatusLabel(status);
  }

  statusClass(status: OptimizationActionStatus): string {
    return actionStatusClass(status);
  }

  typeClass(type: OptimizationActionType): string {
    return actionTypeClass(type);
  }

  cardClass(row: OptimizationRow): string {
    if (row.loadError) {
      return 'opt-card opt-card--error';
    }

    if (!row.risk) {
      return 'opt-card opt-card--blocked';
    }

    if (!row.optimization) {
      return 'opt-card opt-card--ready';
    }

    return 'opt-card opt-card--complete';
  }

  scopeLabel(scope: DetectionScope): string {
    return detectionScopeLabel(scope);
  }

  openCreateRisk(row: OptimizationRow, event: Event): void {
    this.openEditor('risk', 'create', row, event);
    this.resetRiskForm();
    this.riskForm.enable();
    this.focusFirstField();
  }

  openCreateOptimization(row: OptimizationRow, event: Event): void {
    if (!row.risk) {
      return;
    }

    this.openEditor('optimization', 'create', row, event);
    this.optimizationForm.reset({
      severity: null,
      occurrence: null,
      detection: null,
      actionPriority: null,
      specialProcess: '',
      specialCharacteristic: '',
      remarks: ''
    });
    this.optimizationForm.enable();
    this.focusFirstField();
  }

  openViewOptimization(row: OptimizationRow, event: Event): void {
    if (!row.optimization) {
      return;
    }

    this.openEditor('optimization', 'view', row, event);
    this.focusFirstField();
  }

  openEditOptimization(row: OptimizationRow, event: Event): void {
    if (!row.optimization) {
      return;
    }

    this.openEditor('optimization', 'edit', row, event);
    this.optimizationForm.reset({
      severity: row.optimization.severity,
      occurrence: row.optimization.occurrence,
      detection: row.optimization.detection,
      actionPriority: row.optimization.actionPriority,
      specialProcess: row.optimization.specialProcess ?? '',
      specialCharacteristic: row.optimization.specialCharacteristic ?? '',
      remarks: row.optimization.remarks ?? ''
    });
    this.optimizationForm.enable();
    this.focusFirstField();
  }

  openCreateAction(row: OptimizationRow, event: Event): void {
    if (!row.optimization) {
      return;
    }

    this.openEditor('action', 'create', row, event);
    this.actionForm.reset({
      actionType: null,
      description: '',
      responsiblePerson: '',
      targetCompletionDate: '',
      status: null,
      evidence: '',
      completionDate: ''
    });
    this.actionForm.enable();
    this.focusFirstField();
  }

  openViewAction(row: OptimizationRow, action: OptimizationAction, event: Event): void {
    this.openEditor('action', 'view', row, event);
    this.editingAction.set(action);
    this.focusFirstField();
  }

  openEditAction(row: OptimizationRow, action: OptimizationAction, event: Event): void {
    this.openEditor('action', 'edit', row, event);
    this.editingAction.set(action);
    this.actionForm.reset({
      actionType: action.actionType,
      description: action.description,
      responsiblePerson: action.responsiblePerson ?? '',
      targetCompletionDate: action.targetCompletionDate ?? '',
      status: action.status,
      evidence: action.evidence ?? '',
      completionDate: action.completionDate ?? ''
    });
    this.actionForm.enable();
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

    if (kind === 'risk') {
      this.preventionControls.markAsTouched();
      this.detectionControls.markAsTouched();
      this.riskForm.patchValue({
        specialProcess: this.riskForm.controls.specialProcess.value.trim(),
        specialCharacteristic: this.riskForm.controls.specialCharacteristic.value.trim()
      });

      if (this.riskForm.invalid) {
        this.riskForm.markAllAsTouched();
        return;
      }
    } else if (kind === 'optimization') {
      this.optimizationForm.patchValue({
        specialProcess: this.optimizationForm.controls.specialProcess.value.trim(),
        specialCharacteristic: this.optimizationForm.controls.specialCharacteristic.value.trim(),
        remarks: this.optimizationForm.controls.remarks.value.trim()
      });

      if (this.optimizationForm.invalid) {
        this.optimizationForm.markAllAsTouched();
        return;
      }
    } else {
      this.actionForm.patchValue({
        description: this.actionForm.controls.description.value.trim(),
        responsiblePerson: this.actionForm.controls.responsiblePerson.value.trim(),
        evidence: this.actionForm.controls.evidence.value.trim()
      });

      if (this.actionForm.invalid) {
        this.actionForm.markAllAsTouched();
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

    if (action === 'create-risk') {
      this.submitCreateRisk();
      return;
    }

    if (action === 'create-optimization') {
      this.submitCreateOptimization();
      return;
    }

    if (action === 'update-optimization') {
      this.submitUpdateOptimization();
      return;
    }

    if (action === 'create-action') {
      this.submitCreateAction();
      return;
    }

    this.submitUpdateAction();
  }

  retry(): void {
    this.fetchRows().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  riskPreventionError(): string | null {
    return controlListError(
      this.preventionControls,
      'Current Prevention Controls',
      CONTROL_FIELD_MAX_LENGTH
    );
  }

  riskOccurrenceError(): string | null {
    return requiredValueError(this.riskForm.controls.occurrence, 'Occurrence');
  }

  riskDetectionControlError(): string | null {
    return controlListError(
      this.detectionControls,
      'Current Detection Controls',
      CONTROL_FIELD_MAX_LENGTH
    );
  }

  riskDetectionError(): string | null {
    return requiredValueError(this.riskForm.controls.detection, 'Detection');
  }

  riskScopeError(): string | null {
    return requiredValueError(this.riskForm.controls.detectionScope, 'Detection Scope');
  }

  riskPriorityError(): string | null {
    return requiredValueError(this.riskForm.controls.actionPriority, 'Action Priority');
  }

  riskSpecialProcessError(): string | null {
    return optionalTextError(this.riskForm.controls.specialProcess, 'Special Process', 1000);
  }

  riskCharacteristicError(): string | null {
    return optionalTextError(this.riskForm.controls.specialCharacteristic, 'Special Characteristic', 1000);
  }

  severityError(): string | null {
    return requiredValueError(this.optimizationForm.controls.severity, 'Severity');
  }

  occurrenceError(): string | null {
    return requiredValueError(this.optimizationForm.controls.occurrence, 'Occurrence');
  }

  detectionError(): string | null {
    return requiredValueError(this.optimizationForm.controls.detection, 'Detection');
  }

  priorityError(): string | null {
    return requiredValueError(this.optimizationForm.controls.actionPriority, 'Action Priority');
  }

  specialProcessError(): string | null {
    return optionalTextError(this.optimizationForm.controls.specialProcess, 'Special Process', 1000);
  }

  characteristicError(): string | null {
    return optionalTextError(this.optimizationForm.controls.specialCharacteristic, 'Special Characteristic', 1000);
  }

  remarksError(): string | null {
    return optionalTextError(this.optimizationForm.controls.remarks, 'Remarks', 2000);
  }

  actionTypeError(): string | null {
    return requiredValueError(this.actionForm.controls.actionType, 'Action Type');
  }

  actionDescriptionError(): string | null {
    return requiredTextError(this.actionForm.controls.description, 'Description', 2000);
  }

  responsibleError(): string | null {
    return optionalTextError(this.actionForm.controls.responsiblePerson, 'Responsible Person', 255);
  }

  actionStatusError(): string | null {
    return requiredValueError(this.actionForm.controls.status, 'Status');
  }

  evidenceError(): string | null {
    return optionalTextError(this.actionForm.controls.evidence, 'Evidence', 2000);
  }

  private openEditor(kind: EditorKind, mode: EditorMode, row: OptimizationRow, event: Event): void {
    this.rememberTrigger(event);
    this.notice.set(null);
    this.editorError.set(null);
    this.editingAction.set(null);
    this.editingRow.set(row);
    this.editorKind.set(kind);
    this.editorMode.set(mode);
  }

  private submitCreateRisk(): void {
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
        currentPreventionControl: this.serializedRiskControls(this.preventionControls),
        occurrence: values.occurrence,
        currentDetectionControl: this.serializedRiskControls(this.detectionControls),
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
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to create this risk analysis.', true)
      });
  }

  private submitCreateOptimization(): void {
    const row = this.editingRow();
    const values = this.optimizationForm.getRawValue();

    if (
      !row?.risk ||
      values.severity === null ||
      values.occurrence === null ||
      values.detection === null ||
      !values.actionPriority
    ) {
      return;
    }

    this.isSaving.set(true);
    this.optimizationService
      .createOptimization({
        riskAnalysisId: row.risk.id,
        severity: values.severity,
        occurrence: values.occurrence,
        detection: values.detection,
        actionPriority: values.actionPriority,
        specialProcess: optionalRequestText(values.specialProcess),
        specialCharacteristic: optionalRequestText(values.specialCharacteristic),
        remarks: optionalRequestText(values.remarks)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result =>
          this.finishSuccessfulSave(
            result.outcome === 'pending'
              ? {
                  kind: 'pending',
                  title: 'Your optimization creation request has been submitted for approval.',
                  status: 'Pending approval'
                }
              : {
                  kind: 'success',
                  title: 'Optimization created successfully.',
                  status: null
                }
          ),
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to create this optimization.')
      });
  }

  private submitUpdateOptimization(): void {
    const row = this.editingRow();
    const values = this.optimizationForm.getRawValue();

    if (
      !row?.optimization ||
      values.severity === null ||
      values.occurrence === null ||
      values.detection === null ||
      !values.actionPriority
    ) {
      return;
    }

    this.isSaving.set(true);
    this.optimizationService
      .updateOptimization(row.optimization.id, {
        severity: values.severity,
        occurrence: values.occurrence,
        detection: values.detection,
        actionPriority: values.actionPriority,
        specialProcess: optionalRequestText(values.specialProcess),
        specialCharacteristic: optionalRequestText(values.specialCharacteristic),
        remarks: optionalRequestText(values.remarks)
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
                  title: 'Optimization updated successfully.',
                  status: null
                }
          ),
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to update this optimization.')
      });
  }

  private submitCreateAction(): void {
    const row = this.editingRow();
    const values = this.actionForm.getRawValue();

    if (!row?.optimization || !values.actionType || !values.status) {
      return;
    }

    this.isSaving.set(true);
    this.optimizationActionService
      .createAction({
        optimizationId: row.optimization.id,
        actionType: values.actionType,
        description: values.description,
        responsiblePerson: optionalRequestText(values.responsiblePerson),
        targetCompletionDate: optionalDate(values.targetCompletionDate),
        status: values.status,
        evidence: optionalRequestText(values.evidence),
        completionDate: optionalDate(values.completionDate)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result =>
          this.finishSuccessfulSave(
            result.outcome === 'pending'
              ? {
                  kind: 'pending',
                  title: 'Your optimization action creation request has been submitted for approval.',
                  status: 'Pending approval'
                }
              : {
                  kind: 'success',
                  title: 'Optimization action created successfully.',
                  status: null
                }
          ),
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to create this optimization action.')
      });
  }

  private submitUpdateAction(): void {
    const action = this.editingAction();
    const values = this.actionForm.getRawValue();

    if (!action || !values.actionType || !values.status) {
      return;
    }

    this.isSaving.set(true);
    this.optimizationActionService
      .updateAction(action.id, {
        actionType: values.actionType,
        description: values.description,
        responsiblePerson: optionalRequestText(values.responsiblePerson),
        targetCompletionDate: optionalDate(values.targetCompletionDate),
        status: values.status,
        evidence: optionalRequestText(values.evidence),
        completionDate: optionalDate(values.completionDate)
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
                  title: 'Optimization action updated successfully.',
                  status: null
                }
          ),
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to update this optimization action.')
      });
  }

  private finishSuccessfulSave(notice: OptimizationNotice): void {
    this.isSaving.set(false);
    this.pendingAction.set(null);
    this.forceCloseEditor();
    this.notice.set(notice);
    this.fetchRows().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private failSave(error: HttpErrorResponse, fallback: string, risk = false): void {
    this.isSaving.set(false);
    this.pendingAction.set(null);
    this.editorError.set(
      risk ? resolveRiskApiError(error, fallback) : resolveOptimizationApiError(error, fallback)
    );
  }

  private forceCloseEditor(): void {
    this.editorKind.set(null);
    this.editorMode.set(null);
    this.editingRow.set(null);
    this.editingAction.set(null);
    this.pendingAction.set(null);
    this.editorError.set(null);
    this.resetRiskForm();
    this.optimizationForm.reset({
      severity: null,
      occurrence: null,
      detection: null,
      actionPriority: null,
      specialProcess: '',
      specialCharacteristic: '',
      remarks: ''
    });
    this.actionForm.reset({
      actionType: null,
      description: '',
      responsiblePerson: '',
      targetCompletionDate: '',
      status: null,
      evidence: '',
      completionDate: ''
    });
    this.riskForm.enable();
    this.optimizationForm.enable();
    this.actionForm.enable();
    this.restoreTriggerFocus();
  }

  private resetRiskForm(): void {
    this.riskForm.reset({
      occurrence: null,
      detection: null,
      detectionScope: null,
      actionPriority: null,
      specialProcess: '',
      specialCharacteristic: ''
    });
    replaceControlList(this.preventionControls, [], this.formBuilder);
    replaceControlList(this.detectionControls, [], this.formBuilder);
  }

  private serializedRiskControls(array: FormArray<FormControl<string>>): string | null {
    return optionalRequestText(controlsToMultilineString(array.getRawValue()));
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
        this.errorMessage.set(resolveOptimizationApiError(error, 'Unable to load optimization data. Please try again.'));
        return of(false);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  private loadModeRows(mode: FailureMode) {
    return forkJoin({
      effect: this.loadEffect(mode.id),
      causes: this.failureCauseService.getFailureCausesByFailureMode(mode.id)
    }).pipe(
      switchMap(({ effect, causes }) => {
        if (causes.length === 0) {
          return of([] as OptimizationRow[]);
        }

        return forkJoin(causes.map(cause => this.loadRow(mode, cause, effect)));
      })
    );
  }

  private loadRow(mode: FailureMode, cause: FailureCause, effect: FailureEffect | null) {
    return this.loadRisk(cause.id).pipe(
      switchMap(riskSlot => {
        if (riskSlot.error) {
          return of({
            mode,
            cause,
            effect,
            risk: null,
            optimization: null,
            actions: [] as OptimizationAction[],
            loadError: riskSlot.error
          });
        }

        if (!riskSlot.risk) {
          return of({
            mode,
            cause,
            effect,
            risk: null,
            optimization: null,
            actions: [] as OptimizationAction[],
            loadError: null
          });
        }

        const risk = riskSlot.risk;

        return this.loadOptimization(risk.id).pipe(
          switchMap(optSlot => {
            if (optSlot.error || !optSlot.optimization) {
              return of({
                mode,
                cause,
                effect,
                risk,
                optimization: optSlot.optimization,
                actions: [] as OptimizationAction[],
                loadError: optSlot.error
              });
            }

            return this.optimizationActionService.getActionsByOptimization(optSlot.optimization.id).pipe(
              map(actions => ({
                mode,
                cause,
                effect,
                risk,
                optimization: optSlot.optimization,
                actions,
                loadError: null
              }))
            );
          })
        );
      })
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
          error: resolveOptimizationApiError(error, 'Unable to load optimization data. Please try again.')
        });
      })
    );
  }

  private loadOptimization(riskAnalysisId: string) {
    return this.optimizationService.getOptimizationByRiskAnalysis(riskAnalysisId).pipe(
      map(optimization => ({ optimization, error: null as string | null })),
      catchError((error: HttpErrorResponse) => {
        if (isMissingOptimization(error)) {
          return of({ optimization: null, error: null as string | null });
        }

        if (error.status === 401) {
          return throwError(() => error);
        }

        return of({
          optimization: null,
          error: resolveOptimizationApiError(error, 'Unable to load optimization data. Please try again.')
        });
      })
    );
  }

  private loadEffect(failureModeId: string) {
    return this.failureEffectService.getFailureEffectByFailureMode(failureModeId).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404 || error.status === 401) {
          return of(null);
        }

        const body = error.error;
        if (typeof body === 'object' && body !== null && 'message' in body) {
          const message = (body as { message: unknown }).message;
          if (typeof message === 'string' && message.toLowerCase().includes('not found')) {
            return of(null);
          }
        }

        return of(null);
      })
    );
  }

  private activeFormDirty(): boolean {
    if (this.editorKind() === 'risk') {
      return this.riskForm.dirty;
    }

    if (this.editorKind() === 'optimization') {
      return this.optimizationForm.dirty;
    }

    if (this.editorKind() === 'action') {
      return this.actionForm.dirty;
    }

    return false;
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
