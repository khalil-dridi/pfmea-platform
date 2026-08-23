import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';
import { ProcessCreate } from './pages/process-create/process-create';
import { ProcessDetail } from './pages/process-detail/process-detail';
import { ProcessEdit } from './pages/process-edit/process-edit';
import { ProcessList } from './pages/process-list/process-list';
import { ProcessWorkspace } from './pages/process-workspace/process-workspace';

export const PROCESSES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['ADMIN', 'SUPER_ADMIN'])],
    children: [
      {
        path: '',
        component: ProcessList,
        data: { title: 'Processes' }
      },
      {
        path: 'create',
        component: ProcessCreate,
        canDeactivate: [unsavedChangesGuard],
        data: { title: 'Create Process' }
      },
      {
        path: ':id/edit',
        component: ProcessEdit,
        canDeactivate: [unsavedChangesGuard],
        data: { title: 'Edit Process' }
      },
      {
        path: ':id/workspace',
        component: ProcessWorkspace,
        data: { title: 'P-FMEA Workspace' }
      },
      {
        path: ':id',
        component: ProcessDetail,
        data: { title: 'Process Details' }
      }
    ]
  }
];
