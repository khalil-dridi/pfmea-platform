import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../auth/models/login-response.model';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { formatUserDate, resolveUserApiError, userFullName } from '../../utils/user.utils';

type RoleFilter = 'ALL' | UserRole;
type StatusFilter = 'ALL' | 'ACTIVE' | 'DISABLED';

interface StatusConfirmation {
  user: User;
  enable: boolean;
}

@Component({
  selector: 'app-user-list',
  imports: [RouterLink],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserList implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly users = signal<User[]>([]);
  readonly isLoading = signal(true);
  readonly isUpdatingStatus = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly roleFilter = signal<RoleFilter>('ALL');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly confirmation = signal<StatusConfirmation | null>(null);

  readonly currentUserId = computed(() => this.authService.currentUser()?.userId ?? null);

  readonly filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const role = this.roleFilter();
    const status = this.statusFilter();

    return this.users().filter(user => {
      const matchesQuery =
        query.length === 0 ||
        userFullName(user).toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesRole = role === 'ALL' || user.role === role;
      const matchesStatus =
        status === 'ALL' ||
        (status === 'ACTIVE' && user.enabled) ||
        (status === 'DISABLED' && !user.enabled);

      return matchesQuery && matchesRole && matchesStatus;
    });
  });

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const notice = params.get('notice');

        if (notice === 'created') {
          this.successMessage.set('L\'utilisateur a été créé.');
          this.clearNotice();
        }

        if (notice === 'updated') {
          this.successMessage.set('L\'utilisateur a été mis à jour.');
          this.clearNotice();
        }
      });

    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.userService
      .getUsers()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: users => this.users.set(users),
        error: (error: HttpErrorResponse) => {
          this.users.set([]);
          this.errorMessage.set(
            resolveUserApiError(error, 'Impossible de charger les utilisateurs. Veuillez réessayer.')
          );
        }
      });
  }

  onSearchInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.searchQuery.set(target.value);
    }
  }

  onRoleFilterChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.roleFilter.set(this.parseRoleFilter(target.value));
    }
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.statusFilter.set(this.parseStatusFilter(target.value));
    }
  }

  fullName(user: User): string {
    return userFullName(user);
  }

  createdAt(user: User): string {
    return formatUserDate(user.createdAt);
  }

  statusLabel(user: User): string {
    return user.enabled ? 'Actif' : 'Désactivé';
  }

  isCurrentUser(user: User): boolean {
    return user.id === this.currentUserId();
  }

  openStatusConfirmation(user: User): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.confirmation.set({
      user,
      enable: !user.enabled
    });
  }

  closeStatusConfirmation(): void {
    if (this.isUpdatingStatus()) {
      return;
    }

    this.confirmation.set(null);
  }

  confirmStatusChange(): void {
    const confirmation = this.confirmation();

    if (!confirmation || this.isUpdatingStatus()) {
      return;
    }

    this.isUpdatingStatus.set(true);

    const request$ = confirmation.enable
      ? this.userService.enableUser(confirmation.user.id)
      : this.userService.disableUser(confirmation.user.id);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isUpdatingStatus.set(false))
      )
      .subscribe({
        next: updatedUser => {
          this.replaceUser(updatedUser);
          this.confirmation.set(null);
          this.successMessage.set(
            confirmation.enable
              ? 'L\'utilisateur a été réactivé.'
              : 'L\'utilisateur a été désactivé.'
          );

          if (updatedUser.id === this.currentUserId()) {
            this.authService.applyProfile(updatedUser);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            resolveUserApiError(error, 'Une erreur est survenue. Veuillez réessayer.')
          );
          this.confirmation.set(null);
        }
      });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeStatusConfirmation();
  }

  private replaceUser(updatedUser: User): void {
    this.users.update(users =>
      users.map(user => (user.id === updatedUser.id ? updatedUser : user))
    );
  }

  private clearNotice(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  private parseRoleFilter(value: string): RoleFilter {
    if (value === 'ADMIN' || value === 'SUPER_ADMIN') {
      return value;
    }

    return 'ALL';
  }

  private parseStatusFilter(value: string): StatusFilter {
    if (value === 'ACTIVE' || value === 'DISABLED') {
      return value;
    }

    return 'ALL';
  }
}
