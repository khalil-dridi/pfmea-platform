import { Routes } from '@angular/router';
import { AuditDetail } from './pages/audit-detail/audit-detail';
import { AuditList } from './pages/audit-list/audit-list';

export const AUDIT_ROUTES: Routes = [
  {
    path: '',
    component: AuditList,
    data: { title: 'History' }
  },
  {
    path: ':id',
    component: AuditDetail,
    data: { title: 'Audit Details' }
  }
];
