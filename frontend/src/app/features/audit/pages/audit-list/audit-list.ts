import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthenticatedUser } from '../../../auth/models/login-response.model';
import { User as PlatformUser } from '../../../users/models/user.model';
import { UserService } from '../../../users/services/user.service';
import { AuditLog } from '../../models/audit-log.model';
import {
  AuditActionFilter,
  AuditModuleFilter,
  AuditResultFilter,
  AuditResultStatus
} from '../../models/audit-presentation.model';
import { AuditService } from '../../services/audit.service';
import {
  ADMIN_ACTION_FILTERS,
  matchesActionFilter,
  matchesDateRange,
  matchesModuleFilter,
  matchesPerformedBy,
  matchesResultFilter,
  matchesSearch,
  MODULE_FILTERS,
  resultBadgeClass,
  SUPER_ADMIN_ACTION_FILTERS,
  toAuditPresentation
} from '../../utils/audit-presentation';
import { isUsableUserId, resolveAuditApiError } from '../../utils/audit.utils';

@Component({
  selector: 'app-audit-list',
  imports: [RouterLink],
  templateUrl: './audit-list.html',
  styleUrl: './audit-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditList {
  private readonly auditService = inject(AuditService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly logs = signal<AuditLog[]>([]);
  readonly users = signal<PlatformUser[]>([]);
  readonly isLoading = signal(true);
  readonly hasCompletedLoad = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly actionFilter = signal<AuditActionFilter>('ALL');
  readonly moduleFilter = signal<AuditModuleFilter>('ALL');
  readonly resultFilter = signal<AuditResultFilter>('ALL');
  readonly performedByFilter = signal('ALL');
  readonly fromDate = signal('');
  readonly toDate = signal('');

  readonly superAdminActionFilters = SUPER_ADMIN_ACTION_FILTERS;
  readonly adminActionFilters = ADMIN_ACTION_FILTERS;
  readonly moduleFilters = MODULE_FILTERS;

  readonly isSuperAdmin = computed(() => this.authService.hasRole('SUPER_ADMIN'));
  readonly isAdminOnly = computed(
    () => this.authService.hasRole('ADMIN') && !this.authService.hasRole('SUPER_ADMIN')
  );
  readonly currentUserId = computed(() => this.readUserId(this.authService.currentUser()));

  readonly items = computed(() => this.logs().map(log => toAuditPresentation(log)));

  readonly filteredItems = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const action = this.actionFilter();
    const module = this.moduleFilter();
    const result = this.resultFilter();
    const performedBy = this.performedByFilter();
    const fromDate = this.fromDate();
    const toDate = this.toDate();

    return this.items().filter(item => {
      return (
        matchesSearch(item, query) &&
        matchesActionFilter(item, action) &&
        matchesModuleFilter(item, module) &&
        matchesResultFilter(item, result) &&
        matchesPerformedBy(item, performedBy) &&
        matchesDateRange(item, fromDate, toDate)
      );
    });
  });

  readonly hasActiveFilters = computed(
    () =>
      this.searchQuery().trim().length > 0 ||
      this.actionFilter() !== 'ALL' ||
      this.moduleFilter() !== 'ALL' ||
      this.resultFilter() !== 'ALL' ||
      this.performedByFilter() !== 'ALL' ||
      this.fromDate().length > 0 ||
      this.toDate().length > 0
  );

  private profileRequestInFlight = false;
  private loadedHistoryUserId: string | null = null;
  private platformHistoryLoaded = false;

  constructor() {
    toObservable(this.authService.currentUser)
      .pipe(
        takeUntilDestroyed(),
        map(user => this.readUserId(user)),
        distinctUntilChanged()
      )
      .subscribe(userId => this.onCurrentUserIdChanged(userId));
  }

  loadHistory(): void {
    if (this.isAdminOnly()) {
      this.loadUserHistory();
      return;
    }

    this.loadPlatformHistory();
  }

  onSearchInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.searchQuery.set(target.value);
    }
  }

  onActionFilterChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    const options = this.isAdminOnly() ? this.adminActionFilters : this.superAdminActionFilters;
    const selected = options.find(option => option.value === target.value);

    if (selected) {
      this.actionFilter.set(selected.value);
    }
  }

  onModuleFilterChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    const selected = this.moduleFilters.find(option => option.value === target.value);

    if (selected) {
      this.moduleFilter.set(selected.value);
    }
  }

  onResultFilterChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    if (target.value === 'ALL' || target.value === 'SUCCESSFUL' || target.value === 'REJECTED' || target.value === 'PENDING') {
      this.resultFilter.set(target.value);
    }
  }

  onPerformedByChange(event: Event): void {
    if (!this.isSuperAdmin()) {
      return;
    }

    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    if (target.value === 'ALL' || isUsableUserId(target.value)) {
      this.performedByFilter.set(target.value);
    }
  }

  onFromDateChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.fromDate.set(target.value);
    }
  }

  onToDateChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.toDate.set(target.value);
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.actionFilter.set('ALL');
    this.moduleFilter.set('ALL');
    this.resultFilter.set('ALL');
    this.performedByFilter.set('ALL');
    this.fromDate.set('');
    this.toDate.set('');
  }

  resultClass(status: AuditResultStatus): string {
    return resultBadgeClass(status);
  }

  userOptionLabel(user: PlatformUser): string {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    return fullName || user.email;
  }

  private onCurrentUserIdChanged(userId: string | null): void {
    if (!userId) {
      this.logs.set([]);
      this.hasCompletedLoad.set(false);
      this.loadedHistoryUserId = null;
      this.platformHistoryLoaded = false;
      this.ensureCurrentUserId();
      return;
    }

    if (this.isAdminOnly()) {
      if (this.loadedHistoryUserId !== userId) {
        this.loadUserHistory();
      }

      return;
    }

    if (!this.platformHistoryLoaded) {
      this.loadPlatformHistory();
    }
  }

  private ensureCurrentUserId(): void {
    if (this.readUserId(this.authService.currentUser()) || this.profileRequestInFlight) {
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.isLoading.set(false);
      return;
    }

    this.profileRequestInFlight = true;
    this.isLoading.set(true);
    this.hasCompletedLoad.set(false);
    this.errorMessage.set(null);

    this.authService
      .loadCurrentProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.profileRequestInFlight = false;
        },
        error: (error: HttpErrorResponse) => {
          this.profileRequestInFlight = false;
          this.isLoading.set(false);
          this.hasCompletedLoad.set(false);
          this.errorMessage.set(
            resolveAuditApiError(error, 'Unable to load history. Please try again.', 'User history not found.')
          );
        }
      });
  }

  private loadUserHistory(): void {
    const userId = this.readUserId(this.authService.currentUser());

    if (!isUsableUserId(userId)) {
      this.isLoading.set(true);
      this.hasCompletedLoad.set(false);
      this.ensureCurrentUserId();
      return;
    }

    this.isLoading.set(true);
    this.hasCompletedLoad.set(false);
    this.errorMessage.set(null);
    this.loadedHistoryUserId = userId;

    this.auditService
      .getUserHistory(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: logs => {
          this.logs.set(this.sortLogs(logs));
          this.hasCompletedLoad.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.logs.set([]);
          this.hasCompletedLoad.set(false);
          this.errorMessage.set(
            resolveAuditApiError(error, 'Unable to load history. Please try again.', 'User history not found.')
          );
        }
      });
  }

  private loadPlatformHistory(): void {
    this.isLoading.set(true);
    this.hasCompletedLoad.set(false);
    this.errorMessage.set(null);

    this.userService
      .getUsers()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of<PlatformUser[]>([])),
        switchMap(users => {
          this.users.set(users);

          const userIds = this.uniqueUserIds([
            ...users.map(user => user.id),
            this.currentUserId()
          ]);

          if (userIds.length === 0) {
            return of<AuditLog[][]>([]);
          }

          return forkJoin(
            userIds.map(userId =>
              this.auditService.getUserHistory(userId).pipe(catchError(() => of<AuditLog[]>([])))
            )
          );
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: groups => {
          this.logs.set(this.mergeLogs(groups));
          this.hasCompletedLoad.set(true);
          this.platformHistoryLoaded = true;
        },
        error: (error: HttpErrorResponse) => {
          this.logs.set([]);
          this.hasCompletedLoad.set(false);
          this.platformHistoryLoaded = false;
          this.errorMessage.set(
            resolveAuditApiError(error, 'Unable to load history. Please try again.', 'User history not found.')
          );
        }
      });
  }

  private mergeLogs(groups: AuditLog[][]): AuditLog[] {
    const byId = new Map<string, AuditLog>();

    for (const group of groups) {
      for (const log of group) {
        byId.set(log.id, log);
      }
    }

    return this.sortLogs([...byId.values()]);
  }

  private sortLogs(logs: AuditLog[]): AuditLog[] {
    return [...logs].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  private uniqueUserIds(values: Array<string | null>): string[] {
    const ids = new Set<string>();

    for (const value of values) {
      if (isUsableUserId(value)) {
        ids.add(value.trim());
      }
    }

    return [...ids];
  }

  private readUserId(user: AuthenticatedUser | null): string | null {
    if (!user || !isUsableUserId(user.userId)) {
      return null;
    }

    return user.userId.trim();
  }
}
