import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';
import { User } from '../models/user.model';

export function userFullName(user: Pick<User, 'firstName' | 'lastName' | 'email'>): string {
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return fullName || user.email;
}

export function userInitials(user: Pick<User, 'firstName' | 'lastName' | 'email'>): string {
  const first = (user.firstName ?? '').trim().charAt(0);
  const last = (user.lastName ?? '').trim().charAt(0);
  const initials = `${first}${last}`.toUpperCase();

  return initials || user.email.charAt(0).toUpperCase();
}

export function formatUserDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fr-FR').format(date);
}

export function resolveUserApiError(error: HttpErrorResponse, fallback: string): string {
  if (error.status === 400) {
    return 'The information entered is invalid.';
  }

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (error.status === 404) {
    return 'User not found.';
  }

  if (error.status === 409) {
    return 'This email address is already in use.';
  }

  return fallback;
}

export function firstNameError(control: AbstractControl): string | null {
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

export function lastNameError(control: AbstractControl): string | null {
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

export function emailError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return 'Email address is required.';
  }

  if (control.hasError('email') || control.hasError('maxlength')) {
    return 'Please enter a valid email address.';
  }

  return null;
}

export function passwordError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return 'Password is required.';
  }

  if (control.hasError('minlength')) {
    return 'Password must be at least 8 characters.';
  }

  return null;
}

export function roleError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  return 'Role is required.';
}
