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
import { UserProfile } from '../../../auth/models/user-profile.model';
import { ProfileService } from '../../services/profile.service';

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
  imports: [ReactiveFormsModule],
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
    return profile?.enabled ? 'Actif' : 'Inactif';
  });

  readonly roleBadge = computed(() => this.profile()?.role ?? '');

  readonly roleLabel = computed(() => {
    const role = this.profile()?.role;

    if (role === 'SUPER_ADMIN') {
      return 'Super administrateur';
    }

    if (role === 'ADMIN') {
      return 'Administrateur';
    }

    return '';
  });

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
    this.isEditing.set(false);
    this.profileForm.reset();
  }

  saveProfile(): void {
    this.profileForm.patchValue({
      firstName: this.profileForm.controls.firstName.value.trim(),
      lastName: this.profileForm.controls.lastName.value.trim()
    });

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

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
          this.profile.set(profile);
          this.isEditing.set(false);
          this.successMessage.set('Votre profil a été mis à jour.');
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.resolveProfileError(error));
        }
      });
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
    if (this.isChangingPassword() || !this.isPasswordPanelOpen()) {
      return;
    }

    this.isPasswordPanelOpen.set(false);
    this.passwordForm.reset();
    this.passwordErrorMessage.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closePasswordPanel();
  }

  submitPasswordChange(): void {
    this.passwordErrorMessage.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    if (this.isChangingPassword()) {
      return;
    }

    this.isChangingPassword.set(true);

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.profileService
      .changePassword({ currentPassword, newPassword })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isChangingPassword.set(false))
      )
      .subscribe({
        next: () => {
          this.isPasswordPanelOpen.set(false);
          this.passwordForm.reset();
          this.passwordErrorMessage.set(null);
          this.successMessage.set('Votre mot de passe a été modifié.');
        },
        error: (error: HttpErrorResponse) => {
          this.passwordErrorMessage.set(this.resolvePasswordError(error));
        }
      });
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
      return 'Le prénom est obligatoire.';
    }

    if (control.hasError('maxlength')) {
      return 'Le prénom ne peut pas dépasser 100 caractères.';
    }

    return null;
  }

  lastNameError(): string | null {
    const control = this.profileForm.controls.lastName;

    if (!control.touched || control.valid) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Le nom est obligatoire.';
    }

    if (control.hasError('maxlength')) {
      return 'Le nom ne peut pas dépasser 100 caractères.';
    }

    return null;
  }

  currentPasswordError(): string | null {
    const control = this.passwordForm.controls.currentPassword;

    if (!control.touched || control.valid) {
      return null;
    }

    return 'Le mot de passe actuel est obligatoire.';
  }

  newPasswordError(): string | null {
    const control = this.passwordForm.controls.newPassword;

    if (!control.touched || control.valid) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Le nouveau mot de passe est obligatoire.';
    }

    if (control.hasError('minlength')) {
      return 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
    }

    return null;
  }

  confirmPasswordError(): string | null {
    const control = this.passwordForm.controls.confirmPassword;

    if (control.touched && control.hasError('required')) {
      return 'Veuillez confirmer le nouveau mot de passe.';
    }

    if (control.touched && control.hasError('minlength')) {
      return 'Le mot de passe de confirmation doit contenir au moins 8 caractères.';
    }

    if (
      this.passwordForm.touched &&
      this.passwordForm.hasError('passwordMismatch') &&
      control.value
    ) {
      return 'Les mots de passe ne correspondent pas.';
    }

    return null;
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
        ? 'Votre session a expiré. Veuillez vous reconnecter.'
        : 'Vous n\'êtes pas autorisé à effectuer cette action.';
    }

    if (error.status === 403) {
      return 'Vous n\'avez pas l\'autorisation d\'accéder à cette ressource.';
    }

    if (error.status === 400) {
      return 'Les informations saisies sont invalides. Veuillez vérifier le formulaire.';
    }

    if (error.status === 404) {
      return 'Profil utilisateur introuvable.';
    }

    return 'Une erreur est survenue. Veuillez réessayer.';
  }

  private resolvePasswordError(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return 'Le mot de passe actuel est incorrect.';
    }

    if (error.status === 400) {
      return 'Les informations saisies sont invalides. Veuillez vérifier le formulaire.';
    }

    if (error.status === 403) {
      return 'Vous n\'avez pas l\'autorisation d\'accéder à cette ressource.';
    }

    return 'Une erreur est survenue. Veuillez réessayer.';
  }
}
