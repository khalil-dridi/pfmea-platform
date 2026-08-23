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
import { catchError, distinctUntilChanged, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { FunctionType, PfmeaFunction } from '../../models/function.model';
import { ProcessWorkElement } from '../../models/process-work-element.model';
import { FunctionService } from '../../services/function.service';
import { ProcessWorkElementService } from '../../services/process-work-element.service';
import {
  FUNCTION_TYPES,
  functionDescriptionError,
  functionTypeError,
  functionTypeLabel,
  functionWorkElementError,
  mergeFunctions,
  resolveFunctionApiError
} from '../../utils/function.utils';

type NoticeKind = 'success' | 'pending';
type EditorMode = 'create' | 'edit' | 'view';
type PendingAction = 'create' | 'update' | 'discard';
type FunctionTypeFilter = FunctionType | 'all';
type FunctionsEmptyKind = 'none' | 'category' | 'search';

interface FunctionTypeFilterOption {
  id: FunctionTypeFilter;
  label: string;
}

interface FunctionsNotice {
  kind: NoticeKind;
  title: string;
  status: string | null;
}

@Component({
  selector: 'app-workspace-functions',
  imports: [ReactiveFormsModule, ConfirmationDialog],
  templateUrl: './workspace-functions.html',
  styleUrl: './workspace-functions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceFunctions {
  private readonly functionService = inject(FunctionService);
  private readonly workElementService = inject(ProcessWorkElementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly processId = input.required<string>();
  readonly processStepId = input.required<string>();
  readonly processName = input.required<string>();
  readonly processStepName = input.required<string>();
  readonly firstField = viewChild<ElementRef<HTMLElement>>('firstField');

  readonly functions = signal<PfmeaFunction[]>([]);
  readonly workElements = signal<ProcessWorkElement[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly editorError = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly notice = signal<FunctionsNotice | null>(null);
  readonly editorMode = signal<EditorMode | null>(null);
  readonly editingFunction = signal<PfmeaFunction | null>(null);
  readonly pendingAction = signal<PendingAction | null>(null);
  readonly selectedType = signal<FunctionType>('PROCESS_STEP');
  readonly typeFilter = signal<FunctionTypeFilter>('all');
  readonly functionTypes = FUNCTION_TYPES;
  readonly typeFilters: readonly FunctionTypeFilterOption[] = [
    { id: 'all', label: 'All Functions' },
    ...FUNCTION_TYPES.map(type => ({
      id: type,
      label: functionTypeLabel(type)
    }))
  ];

  readonly editorForm = this.formBuilder.nonNullable.group({
    type: this.formBuilder.nonNullable.control<FunctionType>('PROCESS_STEP', Validators.required),
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    workElementId: ['']
  });

  readonly contextKey = computed(() => `${this.processId()}::${this.processStepId()}`);

  readonly typedFunctions = computed(() => {
    const type = this.typeFilter();
    const items = this.functions();

    if (type === 'all') {
      return items;
    }

    return items.filter(item => item.type === type);
  });

  readonly filteredFunctions = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const items = this.typedFunctions();

    if (query.length === 0) {
      return items;
    }

    return items.filter(item => {
      return (
        functionTypeLabel(item.type).toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        this.associationLabel(item).toLowerCase().includes(query)
      );
    });
  });

  readonly emptyKind = computed<FunctionsEmptyKind | null>(() => {
    if (this.isLoading() || this.errorMessage() !== null) {
      return null;
    }

    if (this.functions().length === 0) {
      return 'none';
    }

    if (this.typedFunctions().length === 0) {
      return 'category';
    }

    if (this.filteredFunctions().length === 0) {
      return 'search';
    }

    return null;
  });

  readonly showWorkElementField = computed(() => this.selectedType() === 'WORK_ELEMENT');

  readonly editorTitle = computed(() => {
    const mode = this.editorMode();

    if (mode === 'edit') {
      return 'Edit Function';
    }

    if (mode === 'view') {
      return 'Function Details';
    }

    return 'Add Function';
  });

  readonly confirmTitle = computed(() => {
    const action = this.pendingAction();

    if (action === 'update') {
      return 'Save Changes?';
    }

    if (action === 'discard') {
      return 'Discard Changes?';
    }

    return 'Create Function?';
  });

  readonly confirmMessage = computed(() => {
    const action = this.pendingAction();

    if (action === 'update') {
      return 'Are you sure you want to update this function?';
    }

    if (action === 'discard') {
      return 'Are you sure you want to leave without saving your changes?';
    }

    return 'Are you sure you want to create this function?';
  });

  private lastTrigger: HTMLElement | null = null;
  private ignoreNextEscape = false;

  constructor() {
    toObservable(this.contextKey)
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(),
        switchMap(() => {
          this.searchQuery.set('');
          this.typeFilter.set('all');
          this.forceCloseEditor();
          this.notice.set(null);
          return this.fetchFunctions();
        })
      )
      .subscribe();

    this.editorForm.controls.type.valueChanges.pipe(takeUntilDestroyed()).subscribe(type => {
      this.selectedType.set(type);
      this.syncWorkElementValidator(type);
    });
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

  selectTypeFilter(type: FunctionTypeFilter): void {
    this.typeFilter.set(type);
  }

  typeLabel(type: FunctionType): string {
    return functionTypeLabel(type);
  }

  associationLabel(item: PfmeaFunction): string {
    if (item.type === 'PROCESS_ITEM') {
      return this.processName();
    }

    if (item.type === 'PROCESS_STEP') {
      return this.processStepName();
    }

    const workElement = this.workElements().find(element => element.id === item.workElementId);
    return workElement?.name ?? 'Work Element';
  }

  openCreate(event?: Event): void {
    this.rememberTrigger(event);
    this.notice.set(null);
    this.editorError.set(null);
    this.editingFunction.set(null);
    this.editorMode.set('create');
    const defaultType = this.defaultCreateType();
    this.selectedType.set(defaultType);
    this.editorForm.reset({
      type: defaultType,
      description: '',
      workElementId: ''
    });
    this.editorForm.enable();
    this.syncWorkElementValidator(defaultType);
    this.focusFirstField();
  }

  openView(item: PfmeaFunction, event?: Event): void {
    this.rememberTrigger(event);
    this.editorError.set(null);
    this.editingFunction.set(item);
    this.editorMode.set('view');
    this.populateForm(item);
    this.editorForm.disable();
    this.focusFirstField();
  }

  openEdit(item: PfmeaFunction, event?: Event): void {
    this.rememberTrigger(event);
    this.notice.set(null);
    this.editorError.set(null);
    this.editingFunction.set(item);
    this.editorMode.set('edit');
    this.populateForm(item);
    this.editorForm.enable();
    this.editorForm.controls.type.disable({ emitEvent: false });
    this.syncWorkElementValidator(item.type);
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
    this.fetchFunctions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  typeError(): string | null {
    return functionTypeError(this.editorForm.controls.type);
  }

  descriptionError(): string | null {
    return functionDescriptionError(this.editorForm.controls.description);
  }

  workElementError(): string | null {
    return functionWorkElementError(this.editorForm.controls.workElementId);
  }

  private defaultCreateType(): FunctionType {
    const filter = this.typeFilter();
    return filter === 'all' ? 'PROCESS_STEP' : filter;
  }

  private populateForm(item: PfmeaFunction): void {
    this.selectedType.set(item.type);
    this.editorForm.reset({
      type: item.type,
      description: item.description,
      workElementId: item.workElementId ?? ''
    });
  }

  private submitCreate(): void {
    const values = this.editorForm.getRawValue();
    const type = values.type;

    this.isSaving.set(true);
    this.functionService
      .createFunction({
        type,
        description: values.description,
        processId: type === 'PROCESS_ITEM' ? this.processId() : null,
        processStepId: type === 'PROCESS_STEP' ? this.processStepId() : null,
        workElementId: type === 'WORK_ELEMENT' ? values.workElementId : null
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.finishSuccessfulSave(
            result.outcome === 'pending'
              ? {
                  kind: 'pending',
                  title: 'Your function creation request has been submitted for approval.',
                  status: 'Pending approval'
                }
              : {
                  kind: 'success',
                  title: 'Function created successfully.',
                  status: null
                }
          );
        },
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to create this function.')
      });
  }

  private submitUpdate(): void {
    const item = this.editingFunction();

    if (!item) {
      return;
    }

    const values = this.editorForm.getRawValue();
    this.isSaving.set(true);

    this.functionService
      .updateFunction(item.id, {
        type: values.type,
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
                  title: 'Function updated successfully.',
                  status: null
                }
          );
        },
        error: (error: HttpErrorResponse) => this.failSave(error, 'Unable to update this function.')
      });
  }

  private finishSuccessfulSave(notice: FunctionsNotice): void {
    this.isSaving.set(false);
    this.pendingAction.set(null);
    this.forceCloseEditor();
    this.notice.set(notice);
    this.fetchFunctions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private failSave(error: HttpErrorResponse, fallback: string): void {
    this.isSaving.set(false);
    this.pendingAction.set(null);
    this.editorError.set(resolveFunctionApiError(error, fallback));
  }

  private forceCloseEditor(): void {
    this.editorMode.set(null);
    this.editingFunction.set(null);
    this.pendingAction.set(null);
    this.editorError.set(null);
    this.selectedType.set('PROCESS_STEP');
    this.editorForm.reset({
      type: 'PROCESS_STEP',
      description: '',
      workElementId: ''
    });
    this.editorForm.enable();
    this.restoreTriggerFocus();
  }

  private fetchFunctions() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return forkJoin({
      processFunctions: this.functionService.getFunctionsByProcess(this.processId()),
      stepFunctions: this.functionService.getFunctionsByProcessStep(this.processStepId()),
      workElements: this.workElementService.getWorkElementsByProcessStep(this.processStepId())
    }).pipe(
      switchMap(({ processFunctions, stepFunctions, workElements }) => {
        this.workElements.set(workElements);

        if (workElements.length === 0) {
          this.functions.set(mergeFunctions([processFunctions, stepFunctions]));
          return of(true);
        }

        return forkJoin(
          workElements.map(element =>
            this.functionService
              .getFunctionsByWorkElement(element.id)
              .pipe(catchError(() => of<PfmeaFunction[]>([])))
          )
        ).pipe(
          map(workElementFunctions => {
            this.functions.set(mergeFunctions([processFunctions, stepFunctions, ...workElementFunctions]));
            return true;
          })
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.functions.set([]);
        this.errorMessage.set(resolveFunctionApiError(error, 'Unable to load functions. Please try again.'));
        return of(false);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  private syncWorkElementValidator(type: FunctionType): void {
    const control = this.editorForm.controls.workElementId;

    if (type === 'WORK_ELEMENT' && this.editorMode() === 'create') {
      control.setValidators([Validators.required]);
    } else {
      control.clearValidators();
    }

    control.updateValueAndValidity({ emitEvent: false });
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
