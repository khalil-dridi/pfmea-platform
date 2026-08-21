import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { MyRequests } from './pages/my-requests/my-requests';
import { RequestDetail } from './pages/request-detail/request-detail';
import { Validations } from './pages/validations/validations';

export const CHANGE_REQUESTS_ROUTES: Routes = [
  {
    path: 'my-requests',
    canActivate: [roleGuard(['ADMIN'])],
    component: MyRequests,
    data: { title: 'My Requests' }
  },
  {
    path: 'validations',
    canActivate: [roleGuard(['SUPER_ADMIN'])],
    component: Validations,
    data: { title: 'Validations' }
  },
  {
    path: ':id',
    canActivate: [roleGuard(['ADMIN', 'SUPER_ADMIN'])],
    component: RequestDetail,
    data: { title: 'Change Request' }
  }
];
