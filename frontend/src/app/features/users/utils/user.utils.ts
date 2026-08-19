import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';
import { User } from '../models/user.model';

export function userFullName(user: Pick<User, 'firstName' | 'lastName' | 'email'>): string {
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return fullName || user.email;
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
    return 'Les informations saisies sont invalides.';
  }

  if (error.status === 401) {
    return 'Votre session a expiré. Veuillez vous reconnecter.';
  }

  if (error.status === 403) {
    return 'Vous n\'avez pas l\'autorisation d\'effectuer cette action.';
  }

  if (error.status === 404) {
    return 'Utilisateur introuvable.';
  }

  if (error.status === 409) {
    return 'L\'adresse e-mail est déjà utilisée.';
  }

  return fallback;
}

export function firstNameError(control: AbstractControl): string | null {
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

export function lastNameError(control: AbstractControl): string | null {
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

export function emailError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return 'L\'adresse e-mail est obligatoire.';
  }

  if (control.hasError('email') || control.hasError('maxlength')) {
    return 'Veuillez saisir une adresse e-mail valide.';
  }

  return null;
}

export function passwordError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('required')) {
    return 'Le mot de passe est obligatoire.';
  }

  if (control.hasError('minlength')) {
    return 'Le mot de passe doit contenir au moins 8 caractères.';
  }

  return null;
}

export function roleError(control: AbstractControl): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  return 'Le rôle est obligatoire.';
}
