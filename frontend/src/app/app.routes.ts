import { Routes } from '@angular/router';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { AppLayout } from './layout/app-layout/app-layout';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { FeaturePlaceholder } from './shared/components/feature-placeholder/feature-placeholder';

export const routes: Routes = [
  ...AUTH_ROUTES,
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'processes',
        component: FeaturePlaceholder,
        data: { title: 'Processus' }
      },
      {
        path: 'search',
        component: FeaturePlaceholder,
        data: { title: 'Recherche' }
      },
      {
        path: 'actions',
        component: FeaturePlaceholder,
        data: { title: 'Actions' }
      },
      {
        path: 'reports',
        component: FeaturePlaceholder,
        data: { title: 'Rapports' }
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES)
      },
      {
        path: 'users',
        canActivate: [roleGuard(['SUPER_ADMIN'])],
        loadChildren: () =>
          import('./features/users/users.routes').then(m => m.USERS_ROUTES)
      },
      {
        path: 'validations',
        component: FeaturePlaceholder,
        canActivate: [roleGuard(['SUPER_ADMIN'])],
        data: { title: 'Validations' }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
