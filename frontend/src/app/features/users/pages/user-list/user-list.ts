import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
  untracked
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { UserCard } from '../../components/user-card/user-card';
import { UserEmptyState } from '../../components/user-empty-state/user-empty-state';
import { UserFilters } from '../../components/user-filters/user-filters';
import { UserSkeleton } from '../../components/user-skeleton/user-skeleton';
import { UserRoleFilter, UserStatusFilter } from '../../models/user-filters.model';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { userFullName } from '../../utils/user.utils';

const PAGE_SIZES = [6, 12, 24] as const;
const DEFAULT_PAGE_SIZE = 12;

interface StatusConfirmation {
  user: User;
  enable: boolean;
}

@Component({
  selector: 'app-user-list',
  imports: [RouterLink, ConfirmationDialog, UserCard, UserEmptyState, UserFilters, UserSkeleton],
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

  readonly pageSizes = PAGE_SIZES;
  readonly users = signal<User[]>([]);
  readonly isLoading = signal(true);
  readonly isUpdatingStatus = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly roleFilter = signal<UserRoleFilter>('ALL');
  readonly statusFilter = signal<UserStatusFilter>('ALL');
  readonly confirmation = signal<StatusConfirmation | null>(null);
  readonly page = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

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

  readonly totalFiltered = computed(() => this.filteredUsers().length);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize()))
  );
  readonly pagedUsers = computed(() => {
    const start = this.page() * this.pageSize();
    return this.filteredUsers().slice(start, start + this.pageSize());
  });
  readonly canPrev = computed(() => this.page() > 0);
  readonly canNext = computed(() => this.page() + 1 < this.totalPages() && this.totalFiltered() > 0);
  readonly displayPage = computed(() => this.page() + 1);
  readonly hasActiveFilters = computed(
    () => this.searchQuery().length > 0 || this.roleFilter() !== 'ALL' || this.statusFilter() !== 'ALL'
  );

  constructor() {
    effect(() => {
      this.searchQuery();
      this.roleFilter();
      this.statusFilter();
      this.pageSize();
      untracked(() => this.page.set(0));
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const notice = params.get('notice');

        if (notice === 'created') {
          this.successMessage.set('User created successfully.');
          this.clearNotice();
        }

        if (notice === 'updated') {
          this.successMessage.set('User updated successfully.');
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
            this.resolveError(error, 'Unable to load users. Please try again.')
          );
        }
      });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onRoleChange(value: UserRoleFilter): void {
    this.roleFilter.set(value);
  }

  onStatusChange(value: UserStatusFilter): void {
    this.statusFilter.set(value);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('ALL');
    this.statusFilter.set('ALL');
    this.page.set(0);
  }

  previousPage(): void {
    if (this.canPrev()) {
      this.page.update(page => page - 1);
    }
  }

  nextPage(): void {
    if (this.canNext()) {
      this.page.update(page => page + 1);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.pageSize.set(Number(target.value));
    }
  }

  isCurrentUser(user: User): boolean {
    return user.id === this.currentUserId();
  }

  fullName(user: User): string {
    return userFullName(user);
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
              ? 'User enabled successfully.'
              : 'User disabled successfully.'
          );

          if (updatedUser.id === this.currentUserId()) {
            this.authService.applyProfile(updatedUser);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            this.resolveError(error, 'An error occurred. Please try again.')
          );
          this.confirmation.set(null);
        }
      });
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

  private resolveError(error: HttpErrorResponse, fallback: string): string {
    if (error.status === 400) {
      return 'The information entered is invalid.';
    }

    if (error.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }

    if (error.status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (error.status === 404) {
      return 'User not found.';
    }

    if (error.status === 409) {
      return 'This email address is already in use.';
    }

    return fallback;
  }
}
