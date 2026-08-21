import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { DiscardableForm } from '../../guards/unsaved-changes.guard';
import { ProcessService } from '../../services/process.service';
import { DiscardChangesController } from '../../utils/discard-changes-controller';
import {
  noticeForCreateStatus,
  toProcessNoticeNavigationState
} from '../../utils/process-notice';
import {
  processNameError,
  processNumberError,
  resolveProcessApiError
} from '../../utils/process.utils';

@Component({
  selector: 'app-process-create',
  imports: [ReactiveFormsModule, RouterLink, ConfirmationDialog],
  templateUrl: './process-create.html',
  styleUrl: './process-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessCreate implements DiscardableForm {
  private readonly processService = inject(ProcessService);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly discardChanges = new DiscardChangesController();

  readonly processForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    processNumber: ['', [Validators.required, Validators.maxLength(50)]]
  });

  private bypassUnsavedGuard = false;

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
      .createProcess(request)
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
              noticeForCreateStatus(result.status),
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
}
