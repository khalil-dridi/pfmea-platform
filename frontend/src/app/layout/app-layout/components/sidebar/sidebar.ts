import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../features/auth/models/login-response.model';

interface SidebarNavItem {
  label: string;
  path: string;
  icon: 'dashboard' | 'processes' | 'search' | 'actions' | 'reports' | 'profile' | 'users' | 'validations' | 'requests' | 'history';
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
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Processes', path: '/processes', icon: 'processes' },
    { label: 'Search', path: '/search', icon: 'search' },
    { label: 'Actions', path: '/actions', icon: 'actions' },
    { label: 'Reports', path: '/reports', icon: 'reports' },
    { label: 'Profile', path: '/profile', icon: 'profile' },
    { label: 'History', path: '/audit', icon: 'history', roles: ['SUPER_ADMIN'] },
    { label: 'My Requests', path: '/change-requests/my-requests', icon: 'requests', roles: ['ADMIN'] },
    { label: 'User Management', path: '/users', icon: 'users', roles: ['SUPER_ADMIN'] },
    { label: 'Validations', path: '/change-requests/validations', icon: 'validations', roles: ['SUPER_ADMIN'] }
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
