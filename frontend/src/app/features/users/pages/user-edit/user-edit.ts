import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { UserRole } from '../../../auth/models/login-response.model';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import {
  emailError,
  firstNameError,
  lastNameError,
  resolveUserApiError,
  roleError
} from '../../utils/user.utils';

interface PendingUserUpdate {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

@Component({
  selector: 'app-user-edit',
  imports: [ReactiveFormsModule, RouterLink, ConfirmationDialog],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserEdit implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = signal<User | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly pendingUpdate = signal<PendingUserUpdate | null>(null);

  readonly statusLabel = computed(() => {
    const user = this.user();
    return user?.enabled ? 'Active' : 'Disabled';
  });

  readonly userForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    role: this.formBuilder.nonNullable.control<UserRole | ''>('', [Validators.required])
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.isLoading.set(false);
      this.errorMessage.set('User not found.');
      return;
    }

    this.loadUser(id);
  }

  firstNameError(): string | null {
    return firstNameError(this.userForm.controls.firstName);
  }

  lastNameError(): string | null {
    return lastNameError(this.userForm.controls.lastName);
  }

  emailError(): string | null {
    return emailError(this.userForm.controls.email);
  }

  roleError(): string | null {
    return roleError(this.userForm.controls.role);
  }

  isFieldChanged(field: keyof PendingUserUpdate): boolean {
    const pending = this.pendingUpdate();
    const user = this.user();

    if (!pending || !user) {
      return false;
    }

    return pending[field] !== user[field];
  }

  cancel(): void {
    void this.router.navigateByUrl('/users');
  }

  closeConfirmation(): void {
    if (this.isSaving()) {
      return;
    }

    this.pendingUpdate.set(null);
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

    if (!this.user()) {
      return;
    }

    const { firstName, lastName, email, role } = this.userForm.getRawValue();

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      this.userForm.controls.role.markAsTouched();
      return;
    }

    this.pendingUpdate.set({ firstName, lastName, email, role });
  }

  confirmSave(): void {
    const user = this.user();
    const pending = this.pendingUpdate();

    if (!user || !pending || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    this.userService
      .updateUser(user.id, pending)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: updatedUser => {
          this.pendingUpdate.set(null);

          if (updatedUser.id === this.authService.currentUser()?.userId) {
            this.authService.applyProfile(updatedUser);
          }

          void this.router.navigate(['/users'], { queryParams: { notice: 'updated' } });
        },
        error: (error: HttpErrorResponse) => {
          this.pendingUpdate.set(null);
          this.errorMessage.set(
            resolveUserApiError(error, 'An error occurred. Please try again.')
          );
        }
      });
  }

  private loadUser(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.userService
      .getUserById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: user => {
          this.user.set(user);
          this.userForm.setValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
          });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            resolveUserApiError(error, 'An error occurred. Please try again.')
          );
        }
      });
  }
}
