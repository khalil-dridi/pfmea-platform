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
import { UserService } from '../../services/user.service';
import {
  emailError,
  firstNameError,
  lastNameError,
  passwordError,
  resolveUserApiError,
  roleError
} from '../../utils/user.utils';

@Component({
  selector: 'app-user-create',
  imports: [ReactiveFormsModule, RouterLink],
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

  submit(): void {
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

    if (this.isSaving()) {
      return;
    }

    const { firstName, lastName, email, password, role } = this.userForm.getRawValue();

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      this.userForm.controls.role.markAsTouched();
      return;
    }

    this.isSaving.set(true);

    this.userService
      .createUser({ firstName, lastName, email, password, role })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: () => {
          this.userForm.controls.password.reset('');
          void this.router.navigate(['/users'], { queryParams: { notice: 'created' } });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            resolveUserApiError(error, 'Une erreur est survenue. Veuillez réessayer.')
          );
        }
      });
  }
}
