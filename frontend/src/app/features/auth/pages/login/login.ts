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

  readonly isSubmitting = signal(false);
  readonly isPasswordVisible = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly highlights = [
    {
      title: 'Complete P-FMEA Management',
      description: 'Structure and centralize your risk analyses.'
    },
    {
      title: 'Optimization Action Tracking',
      description: 'Manage actions and ensure their effectiveness.'
    },
    {
      title: 'Dashboards & Reports',
      description: 'Make decisions based on your data.'
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
      return 'Email address is required.';
    }

    if (this.emailControl.hasError('email')) {
      return 'Please enter a valid email address.';
    }

    return null;
  }

  passwordError(): string | null {
    if (!this.passwordControl.touched || this.passwordControl.valid) {
      return null;
    }

    if (this.passwordControl.hasError('required')) {
      return 'Password is required.';
    }

    if (this.passwordControl.hasError('minlength')) {
      return 'Password must be at least 8 characters.';
    }

    return null;
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return 'Incorrect email or password.';
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
