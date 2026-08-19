import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly currentYear = new Date().getFullYear();
  readonly isSubmitting = signal(false);
  readonly isPasswordVisible = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly highlights = [
    {
      title: 'Gestion complète des P-FMEA',
      description: 'Structurez et centralisez vos analyses de risques.'
    },
    {
      title: 'Suivi des actions d’optimisation',
      description: 'Pilotez les actions et assurez leur efficacité.'
    },
    {
      title: 'Tableaux de bord & rapports',
      description: 'Prenez des décisions basées sur vos données.'
    }
  ] as const;

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false]
  });

  get emailControl() {
    return this.loginForm.controls.email;
  }

  get passwordControl() {
    return this.loginForm.controls.password;
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    const { email, password } = this.loginForm.getRawValue();

    this.authService
      .login({ email, password })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl(environment.postLoginRedirect);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
        }
      });
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible.update(isVisible => !isVisible);
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
  }

  emailError(): string | null {
    if (!this.emailControl.touched || this.emailControl.valid) {
      return null;
    }

    if (this.emailControl.hasError('required')) {
      return 'L’adresse e-mail est obligatoire.';
    }

    if (this.emailControl.hasError('email')) {
      return 'Veuillez saisir une adresse e-mail valide.';
    }

    return null;
  }

  passwordError(): string | null {
    if (!this.passwordControl.touched || this.passwordControl.valid) {
      return null;
    }

    if (this.passwordControl.hasError('required')) {
      return 'Le mot de passe est obligatoire.';
    }

    if (this.passwordControl.hasError('minlength')) {
      return 'Le mot de passe doit contenir au moins 8 caractères.';
    }

    return null;
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return 'Adresse e-mail ou mot de passe incorrect.';
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
