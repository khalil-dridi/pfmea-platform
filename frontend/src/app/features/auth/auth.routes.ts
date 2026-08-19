import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { guestGuard } from '../../core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard]
  }
];
