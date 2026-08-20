import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { UserProfile } from '../../../auth/models/user-profile.model';
import { ProfileService } from '../../services/profile.service';

type PendingConfirmation = 'profile' | 'password';

const passwordConfirmationMatch: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const newPassword = control.get('newPassword')?.value as string | undefined;
  const confirmPassword = control.get('confirmPassword')?.value as string | undefined;

  if (!newPassword || !confirmPassword || newPassword === confirmPassword) {
    return null;
  }

  return { passwordMismatch: true };
};

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, ConfirmationDialog],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Profile implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly profile = signal<UserProfile | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isChangingPassword = signal(false);
  readonly isEditing = signal(false);
  readonly isPasswordPanelOpen = signal(false);
  readonly isNewPasswordVisible = signal(false);
  readonly isConfirmPasswordVisible = signal(false);
  readonly isCurrentPasswordVisible = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly passwordErrorMessage = signal<string | null>(null);
  readonly pendingConfirmation = signal<PendingConfirmation | null>(null);

  readonly initials = computed(() => {
    const profile = this.profile();

    if (!profile) {
      return '';
    }

    const first = (profile.firstName ?? '').trim().charAt(0);
    const last = (profile.lastName ?? '').trim().charAt(0);
    const value = `${first}${last}`.toUpperCase();

    return value || profile.email.charAt(0).toUpperCase();
  });

  readonly displayName = computed(() => {
    const profile = this.profile();

    if (!profile) {
      return '';
    }

    const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
    return fullName || profile.email;
  });

  readonly statusLabel = computed(() => {
    const profile = this.profile();
    return profile?.enabled ? 'Active' : 'Disabled';
  });

  readonly roleBadge = computed(() => this.profile()?.role ?? '');

  readonly isConfirming = computed(
    () => this.isSaving() || this.isChangingPassword()
  );

  readonly profileForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]]
  });

  readonly passwordForm = this.formBuilder.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    },
    { validators: passwordConfirmationMatch }
  );

  ngOnInit(): void {
    this.loadProfile();

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params.get('action') === 'password') {
          this.openPasswordPanel();
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true
          });
        }
      });
  }

  startEdit(): void {
    const profile = this.profile();

    if (!profile) {
      return;
    }

    this.clearMessages();
    this.profileForm.setValue({
      firstName: profile.firstName,
      lastName: profile.lastName
    });
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    if (this.isSaving()) {
      return;
    }

    this.isEditing.set(false);
    this.pendingConfirmation.set(null);
    this.profileForm.reset();
  }

  requestSaveProfile(): void {
    this.profileForm.patchValue({
      firstName: this.profileForm.controls.firstName.value.trim(),
      lastName: this.profileForm.controls.lastName.value.trim()
    });

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.pendingConfirmation.set('profile');
  }

  requestPasswordChange(): void {
    this.passwordErrorMessage.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.pendingConfirmation.set('password');
  }

  closeConfirmation(): void {
    if (this.isConfirming()) {
      return;
    }

    this.pendingConfirmation.set(null);
  }

  confirmPendingAction(): void {
    const action = this.pendingConfirmation();

    if (action === 'profile') {
      this.performProfileSave();
      return;
    }

    if (action === 'password') {
      this.performPasswordChange();
    }
  }

  openPasswordPanel(): void {
    this.successMessage.set(null);
    this.passwordForm.reset();
    this.passwordErrorMessage.set(null);
    this.isCurrentPasswordVisible.set(false);
    this.isNewPasswordVisible.set(false);
    this.isConfirmPasswordVisible.set(false);
    this.isPasswordPanelOpen.set(true);
  }

  closePasswordPanel(): void {
    if (this.isChangingPassword() || this.pendingConfirmation() === 'password') {
      return;
    }

    if (!this.isPasswordPanelOpen()) {
      return;
    }

    this.isPasswordPanelOpen.set(false);
    this.passwordForm.reset();
    this.passwordErrorMessage.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.pendingConfirmation()) {
      return;
    }

    this.closePasswordPanel();
  }

  toggleCurrentPasswordVisibility(): void {
    this.isCurrentPasswordVisible.update(value => !value);
  }

  toggleNewPasswordVisibility(): void {
    this.isNewPasswordVisible.update(value => !value);
  }

  toggleConfirmPasswordVisibility(): void {
    this.isConfirmPasswordVisible.update(value => !value);
  }

  firstNameError(): string | null {
    const control = this.profileForm.controls.firstName;

    if (!control.touched || control.valid) {
      return null;
    }

    if (control.hasError('required')) {
      return 'First name is required.';
    }

    if (control.hasError('maxlength')) {
      return 'First name cannot exceed 100 characters.';
    }

    return null;
  }

  lastNameError(): string | null {
    const control = this.profileForm.controls.lastName;

    if (!control.touched || control.valid) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Last name is required.';
    }

    if (control.hasError('maxlength')) {
      return 'Last name cannot exceed 100 characters.';
    }

    return null;
  }

  currentPasswordError(): string | null {
    const control = this.passwordForm.controls.currentPassword;

    if (!control.touched || control.valid) {
      return null;
    }

    return 'Current password is required.';
  }

  newPasswordError(): string | null {
    const control = this.passwordForm.controls.newPassword;

    if (!control.touched || control.valid) {
      return null;
    }

    if (control.hasError('required')) {
      return 'New password is required.';
    }

    if (control.hasError('minlength')) {
      return 'New password must be at least 8 characters.';
    }

    return null;
  }

  confirmPasswordError(): string | null {
    const control = this.passwordForm.controls.confirmPassword;

    if (control.touched && control.hasError('required')) {
      return 'Please confirm the new password.';
    }

    if (control.touched && control.hasError('minlength')) {
      return 'Password confirmation must be at least 8 characters.';
    }

    if (
      this.passwordForm.touched &&
      this.passwordForm.hasError('passwordMismatch') &&
      control.value
    ) {
      return 'Passwords do not match.';
    }

    return null;
  }

  private performProfileSave(): void {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();

    const { firstName, lastName } = this.profileForm.getRawValue();

    this.profileService
      .updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: profile => {
          this.pendingConfirmation.set(null);
          this.profile.set(profile);
          this.isEditing.set(false);
          this.successMessage.set('Profile updated successfully.');
        },
        error: (error: HttpErrorResponse) => {
          this.pendingConfirmation.set(null);
          this.errorMessage.set(this.resolveProfileError(error));
        }
      });
  }

  private performPasswordChange(): void {
    if (this.isChangingPassword()) {
      return;
    }

    this.isChangingPassword.set(true);
    this.passwordErrorMessage.set(null);

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.profileService
      .changePassword({ currentPassword, newPassword })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isChangingPassword.set(false))
      )
      .subscribe({
        next: () => {
          this.pendingConfirmation.set(null);
          this.isPasswordPanelOpen.set(false);
          this.passwordForm.reset();
          this.passwordErrorMessage.set(null);
          this.successMessage.set('Password changed successfully.');
        },
        error: (error: HttpErrorResponse) => {
          this.pendingConfirmation.set(null);
          this.passwordErrorMessage.set(this.resolvePasswordError(error));
        }
      });
  }

  private loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.profileService
      .getCurrentProfile()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: profile => this.profile.set(profile),
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.resolveProfileError(error, true));
        }
      });
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private resolveProfileError(error: HttpErrorResponse, isLoad = false): string {
    if (error.status === 401) {
      return isLoad
        ? 'Your session has expired. Please sign in again.'
        : 'You are not authorized to perform this action.';
    }

    if (error.status === 403) {
      return 'You do not have permission to access this resource.';
    }

    if (error.status === 400) {
      return 'The information entered is invalid. Please check the form.';
    }

    if (error.status === 404) {
      return 'User profile not found.';
    }

    return 'An error occurred. Please try again.';
  }

  private resolvePasswordError(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return 'The current password is incorrect.';
    }

    if (error.status === 400) {
      return 'The information entered is invalid. Please check the form.';
    }

    if (error.status === 403) {
      return 'You do not have permission to access this resource.';
    }

    return 'An error occurred. Please try again.';
  }
}
