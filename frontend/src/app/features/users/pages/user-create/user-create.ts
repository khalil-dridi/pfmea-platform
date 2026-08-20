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
import { UserRole } from '../../../auth/models/login-response.model';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { UserService } from '../../services/user.service';
import {
  emailError,
  firstNameError,
  lastNameError,
  passwordError,
  resolveUserApiError,
  roleError
} from '../../utils/user.utils';

interface PendingUserCreate {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

@Component({
  selector: 'app-user-create',
  imports: [ReactiveFormsModule, RouterLink, ConfirmationDialog],
  templateUrl: './user-create.html',
  styleUrl: './user-create.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCreate {
  private readonly userService = inject(UserService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSaving = signal(false);
  readonly isPasswordVisible = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly pendingCreate = signal<PendingUserCreate | null>(null);

  readonly userForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    role: this.formBuilder.nonNullable.control<UserRole | ''>('', [Validators.required])
  });

  firstNameError(): string | null {
    return firstNameError(this.userForm.controls.firstName);
  }

  lastNameError(): string | null {
    return lastNameError(this.userForm.controls.lastName);
  }

  emailError(): string | null {
    return emailError(this.userForm.controls.email);
  }

  passwordError(): string | null {
    return passwordError(this.userForm.controls.password);
  }

  roleError(): string | null {
    return roleError(this.userForm.controls.role);
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible.update(value => !value);
  }

  cancel(): void {
    void this.router.navigateByUrl('/users');
  }

  closeConfirmation(): void {
    if (this.isSaving()) {
      return;
    }

    this.pendingCreate.set(null);
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    this.userForm.patchValue({
      firstName: this.userForm.controls.firstName.value.trim(),
      lastName: this.userForm.controls.lastName.value.trim(),
      email: this.userForm.controls.email.value.trim()
    });

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, password, role } = this.userForm.getRawValue();

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      this.userForm.controls.role.markAsTouched();
      return;
    }

    this.pendingCreate.set({ firstName, lastName, email, password, role });
  }

  confirmCreate(): void {
    const pending = this.pendingCreate();

    if (!pending || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    this.userService
      .createUser({
        firstName: pending.firstName,
        lastName: pending.lastName,
        email: pending.email,
        password: pending.password,
        role: pending.role
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: () => {
          this.userForm.controls.password.reset('');
          this.pendingCreate.set(null);
          void this.router.navigate(['/users'], { queryParams: { notice: 'created' } });
        },
        error: (error: HttpErrorResponse) => {
          this.pendingCreate.set(null);
          this.errorMessage.set(
            resolveUserApiError(error, 'An error occurred. Please try again.')
          );
        }
      });
  }
}
