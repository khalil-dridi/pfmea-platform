import { Routes } from '@angular/router';
import { Profile } from './pages/profile/profile';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    component: Profile,
        data: { title: 'My Profile' }
  }
];
