import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../features/auth/models/login-response.model';

interface SidebarNavItem {
  label: string;
  path: string;
  icon: 'dashboard' | 'processes' | 'search' | 'actions' | 'reports' | 'profile' | 'users' | 'validations';
  roles?: readonly UserRole[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Sidebar {
  private readonly authService = inject(AuthService);

  readonly collapsed = input(false);
  readonly mobileOpen = input(false);
  readonly navigated = output<void>();

  readonly displayName = this.authService.displayName;
  readonly roleLabel = this.authService.roleLabel;

  private readonly navItems: readonly SidebarNavItem[] = [
    { label: 'Tableau de bord', path: '/dashboard', icon: 'dashboard' },
    { label: 'Processus', path: '/processes', icon: 'processes' },
    { label: 'Recherche', path: '/search', icon: 'search' },
    { label: 'Actions', path: '/actions', icon: 'actions' },
    { label: 'Rapports', path: '/reports', icon: 'reports' },
    { label: 'Profil', path: '/profile', icon: 'profile' },
    { label: 'Gestion des utilisateurs', path: '/users', icon: 'users', roles: ['SUPER_ADMIN'] },
    { label: 'Validations', path: '/validations', icon: 'validations', roles: ['SUPER_ADMIN'] }
  ];

  readonly visibleNavItems = computed(() => {
    const role = this.authService.currentUser()?.role;

    return this.navItems.filter(item => {
      if (!item.roles) {
        return true;
      }

      return role !== undefined && item.roles.includes(role);
    });
  });

  onNavigate(): void {
    this.navigated.emit();
  }
}
