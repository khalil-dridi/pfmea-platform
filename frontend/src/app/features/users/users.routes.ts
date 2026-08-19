import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UserCreate } from './pages/user-create/user-create';
import { UserEdit } from './pages/user-edit/user-edit';
import { UserList } from './pages/user-list/user-list';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['SUPER_ADMIN'])],
    children: [
      {
        path: '',
        component: UserList,
        data: { title: 'Gestion des utilisateurs' }
      },
      {
        path: 'create',
        component: UserCreate,
        data: { title: 'Ajouter un utilisateur' }
      },
      {
        path: ':id/edit',
        component: UserEdit,
        data: { title: 'Modifier un utilisateur' }
      }
    ]
  }
];
