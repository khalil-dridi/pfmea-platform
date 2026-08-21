import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { DiscardableForm } from '../../guards/unsaved-changes.guard';
import { Process } from '../../models/process.model';
import { ProcessService } from '../../services/process.service';
import { DiscardChangesController } from '../../utils/discard-changes-controller';
import {
  noticeForUpdateStatus,
  toProcessNoticeNavigationState
} from '../../utils/process-notice';
import {
  processNameError,
  processNumberError,
  resolveProcessApiError
} from '../../utils/process.utils';

@Component({
  selector: 'app-process-edit',
  imports: [ReactiveFormsModule, RouterLink, ConfirmationDialog],
  templateUrl: './process-edit.html',
  styleUrl: './process-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessEdit implements OnInit, DiscardableForm {
  private readonly processService = inject(ProcessService);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly process = signal<Process | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly discardChanges = new DiscardChangesController();

  readonly processForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    processNumber: ['', [Validators.required, Validators.maxLength(50)]]
  });

  private bypassUnsavedGuard = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.isLoading.set(false);
      this.errorMessage.set('Process not found.');
      return;
    }

    this.loadProcess(id);
  }

  nameError(): string | null {
    return processNameError(this.processForm.controls.name);
  }

  numberError(): string | null {
    return processNumberError(this.processForm.controls.processNumber);
  }

  hasUnsavedChanges(): boolean {
    return !this.bypassUnsavedGuard && this.processForm.dirty;
  }

  confirmDiscard(): Promise<boolean> {
    return this.discardChanges.prompt();
  }

  cancel(): void {
    void this.router.navigateByUrl('/processes');
  }

  onSubmit(): void {
    if (this.isSaving()) {
      return;
    }

    const process = this.process();

    if (!process) {
      return;
    }

    this.errorMessage.set(null);
    this.processForm.patchValue({
      name: this.processForm.controls.name.value.trim(),
      processNumber: this.processForm.controls.processNumber.value.trim()
    });

    if (this.processForm.invalid) {
      this.processForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    const request = this.processForm.getRawValue();

    this.processService
      .updateProcess(process.id, request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: result => {
          this.bypassUnsavedGuard = true;
          this.processForm.markAsPristine();

          void this.router.navigate(['/processes'], {
            state: toProcessNoticeNavigationState(
              noticeForUpdateStatus(result.status),
              this.authService.currentUser()?.userId
            )
          });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            resolveProcessApiError(error, 'An error occurred. Please try again.')
          );
        }
      });
  }

  private loadProcess(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.processService
      .getProcessById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: process => {
          this.process.set(process);
          this.processForm.setValue({
            name: process.name,
            processNumber: process.processNumber
          });
          this.processForm.markAsPristine();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            resolveProcessApiError(error, 'An error occurred. Please try again.')
          );
        }
      });
  }
}
