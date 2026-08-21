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
        canActivate: [roleGuard(['ADMIN', 'SUPER_ADMIN'])],
        loadChildren: () =>
          import('./features/processes/processes.routes').then(m => m.PROCESSES_ROUTES)
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
        path: 'audit',
        canActivate: [roleGuard(['ADMIN', 'SUPER_ADMIN'])],
        loadChildren: () =>
          import('./features/audit/audit.routes').then(m => m.AUDIT_ROUTES)
      },
      {
        path: 'users',
        canActivate: [roleGuard(['SUPER_ADMIN'])],
        loadChildren: () =>
          import('./features/users/users.routes').then(m => m.USERS_ROUTES)
      },
      {
        path: 'change-requests',
        loadChildren: () =>
          import('./features/change-requests/change-requests.routes').then(
            m => m.CHANGE_REQUESTS_ROUTES
          )
      },
      {
        path: 'validations',
        pathMatch: 'full',
        redirectTo: '/change-requests/validations'
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
