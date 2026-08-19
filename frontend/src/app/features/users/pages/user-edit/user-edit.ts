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
import { UserRole } from '../../../auth/models/login-response.model';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import {
  emailError,
  firstNameError,
  lastNameError,
  resolveUserApiError,
  roleError,
  userFullName
} from '../../utils/user.utils';

@Component({
  selector: 'app-user-edit',
  imports: [ReactiveFormsModule, RouterLink],
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

  readonly displayName = computed(() => {
    const user = this.user();
    return user ? userFullName(user) : '';
  });

  readonly statusLabel = computed(() => {
    const user = this.user();
    return user?.enabled ? 'Actif' : 'Désactivé';
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
      this.errorMessage.set('Utilisateur introuvable.');
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

  cancel(): void {
    void this.router.navigateByUrl('/users');
  }

  submit(): void {
    const user = this.user();
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

    if (!user || this.isSaving()) {
      return;
    }

    const { firstName, lastName, email, role } = this.userForm.getRawValue();

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      this.userForm.controls.role.markAsTouched();
      return;
    }

    this.isSaving.set(true);

    this.userService
      .updateUser(user.id, { firstName, lastName, email, role })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: updatedUser => {
          if (updatedUser.id === this.authService.currentUser()?.userId) {
            this.authService.applyProfile(updatedUser);
          }

          void this.router.navigate(['/users'], { queryParams: { notice: 'updated' } });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            resolveUserApiError(error, 'Une erreur est survenue. Veuillez réessayer.')
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
            resolveUserApiError(error, 'Une erreur est survenue. Veuillez réessayer.')
          );
        }
      });
  }
}
