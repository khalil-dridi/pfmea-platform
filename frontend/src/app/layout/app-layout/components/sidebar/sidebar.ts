import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../features/auth/models/login-response.model';

type SidebarIcon =
  | 'dashboard'
  | 'processes'
  | 'search'
  | 'assistant'
  | 'profile'
  | 'users'
  | 'validations'
  | 'requests'
  | 'history';

type SidebarSectionId = 'core' | 'governance' | 'account';

interface SidebarNavItem {
  label: string;
  path: string;
  icon: SidebarIcon;
  roles?: readonly UserRole[];
}

interface SidebarNavSection {
  id: SidebarSectionId;
  label: string;
  items: readonly SidebarNavItem[];
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

  private readonly navSections: readonly SidebarNavSection[] = [
    {
      id: 'core',
      label: 'Core',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { label: 'Processes', path: '/processes', icon: 'processes' },
        { label: 'Search', path: '/search', icon: 'search' },
        { label: 'AI Assistant', path: '/ai-assistant', icon: 'assistant' }
      ]
    },
    {
      id: 'governance',
      label: 'Governance',
      items: [
        { label: 'History', path: '/audit', icon: 'history', roles: ['SUPER_ADMIN'] },
        { label: 'Validations', path: '/change-requests/validations', icon: 'validations', roles: ['SUPER_ADMIN'] },
        { label: 'User Management', path: '/users', icon: 'users', roles: ['SUPER_ADMIN'] }
      ]
    },
    {
      id: 'account',
      label: 'Account',
      items: [
        { label: 'Profile', path: '/profile', icon: 'profile' },
        { label: 'My Requests', path: '/change-requests/my-requests', icon: 'requests', roles: ['ADMIN'] }
      ]
    }
  ];

  readonly visibleSections = computed(() =>
    this.navSections
      .map(section => ({
        id: section.id,
        label: section.label,
        items: section.items.filter(item => this.isItemVisible(item))
      }))
      .filter(section => section.items.length > 0)
  );

  readonly showSectionLabels = computed(() => !this.collapsed() || this.mobileOpen());

  onNavigate(): void {
    this.navigated.emit();
  }

  private isItemVisible(item: SidebarNavItem): boolean {
    if (!item.roles) {
      return true;
    }

    return this.authService.hasRole(...item.roles);
  }
}
