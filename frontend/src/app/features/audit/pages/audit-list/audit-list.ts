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
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  of,
  skip,
  switchMap,
  tap
} from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthenticatedUser } from '../../../auth/models/login-response.model';
import { User as PlatformUser } from '../../../users/models/user.model';
import { UserService } from '../../../users/services/user.service';
import { HistoryDetailsDrawer } from '../../components/history-details-drawer/history-details-drawer';
import { HistoryEmptyState } from '../../components/history-empty-state/history-empty-state';
import { HistoryEvent } from '../../components/history-event/history-event';
import { HistoryFilters } from '../../components/history-filters/history-filters';
import { HistorySkeleton } from '../../components/history-skeleton/history-skeleton';
import {
  AuditHistoryFilters,
  AuditHistoryQuery,
  AuditStatistics,
  DEFAULT_HISTORY_PAGE_SIZE,
  HISTORY_PAGE_SIZES,
  HistoryActionFilter,
  HistoryEntityFilter,
  HistoryEventView
} from '../../models/audit-history.model';
import { AuditLog } from '../../models/audit-log.model';
import { AuditService } from '../../services/audit.service';
import {
  isHistoryActionFilter,
  isHistoryEntityFilter,
  readAuditStatistics,
  readHistoryDateParam,
  readHistoryPage,
  toHistoryEventView,
  visiblePageIndexes
} from '../../utils/audit-history.utils';
import { isUsableUserId, resolveAuditApiError } from '../../utils/audit.utils';

@Component({
  selector: 'app-audit-list',
  imports: [HistoryDetailsDrawer, HistoryEmptyState, HistoryEvent, HistoryFilters, HistorySkeleton],
  templateUrl: './audit-list.html',
  styleUrl: './audit-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditList {
  private readonly auditService = inject(AuditService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageSizes = HISTORY_PAGE_SIZES;
  readonly logs = signal<AuditLog[]>([]);
  readonly users = signal<PlatformUser[]>([]);
  readonly isLoading = signal(true);
  readonly isStatsLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly statsError = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly debouncedSearch = signal('');
  readonly entityFilter = signal<HistoryEntityFilter>('ALL');
  readonly actionFilter = signal<HistoryActionFilter>('ALL');
  readonly userFilter = signal('ALL');
  readonly fromDate = signal('');
  readonly toDate = signal('');
  readonly page = signal(0);
  readonly pageSize = signal(DEFAULT_HISTORY_PAGE_SIZE);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly statistics = signal<AuditStatistics | null>(null);
  readonly selectedItem = signal<HistoryEventView | null>(null);
  readonly reloadToken = signal(0);

  private profileRequestInFlight = false;

  readonly isSuperAdmin = computed(() => this.authService.hasRole('SUPER_ADMIN'));
  readonly isAdminOnly = computed(
    () => this.authService.hasRole('ADMIN') && !this.authService.hasRole('SUPER_ADMIN')
  );
  readonly currentUserId = computed(() => this.readUserId(this.authService.currentUser()));

  readonly items = computed(() => this.logs().map(log => toHistoryEventView(log)));

  readonly hasActiveFilters = computed(
    () =>
      this.debouncedSearch().trim().length > 0 ||
      this.fromDate().length > 0 ||
      this.toDate().length > 0 ||
      this.entityFilter() !== 'ALL' ||
      this.actionFilter() !== 'ALL' ||
      (!this.isAdminOnly() && this.userFilter() !== 'ALL')
  );

  readonly effectiveUserId = computed(() => {
    if (this.isAdminOnly()) {
      return this.currentUserId();
    }

    const selected = this.userFilter();
    return selected === 'ALL' ? null : selected;
  });

  readonly filterQuery = computed<AuditHistoryFilters>(() => {
    const entityType = this.entityFilter();
    const action = this.actionFilter();
    const search = this.debouncedSearch().trim();

    return {
      search: search.length > 0 ? search : undefined,
      entityType: entityType === 'ALL' ? undefined : entityType,
      action: action === 'ALL' ? undefined : action,
      userId: this.effectiveUserId() ?? undefined,
      from: this.fromDate() || undefined,
      to: this.toDate() || undefined
    };
  });

  readonly historyQuery = computed<AuditHistoryQuery>(() => ({
    ...this.filterQuery(),
    page: this.page(),
    size: this.pageSize()
  }));

  readonly loadKey = computed(() => ({
    query: this.historyQuery(),
    reload: this.reloadToken()
  }));

  readonly statsKey = computed(() => ({
    filters: this.filterQuery(),
    reload: this.reloadToken()
  }));

  readonly canPrev = computed(() => this.page() > 0);
  readonly canNext = computed(
    () => this.page() + 1 < this.totalPages() && this.totalElements() > 0
  );
  readonly rangeStart = computed(() =>
    this.totalElements() === 0 ? 0 : this.page() * this.pageSize() + 1
  );
  readonly rangeEnd = computed(() =>
    Math.min((this.page() + 1) * this.pageSize(), this.totalElements())
  );
  readonly visiblePages = computed(() =>
    visiblePageIndexes(this.page(), Math.max(this.totalPages(), 1))
  );
  readonly selectedId = computed(() => this.selectedItem()?.id ?? null);

  readonly pageStats = computed(() => {
    const stats = this.statistics();
    const total = stats?.totalEvents ?? 0;
    const approved = stats?.approved ?? 0;
    const rejected = stats?.rejected ?? 0;
    const pending = stats?.pending ?? 0;
    const filtered = this.hasActiveFilters();

    return [
      {
        key: 'total',
        label: 'Total Events',
        value: total,
        subtitle: filtered ? 'Matching current filters' : 'Across the audit trail',
        tone: 'purple',
        share: 100,
        showMeter: false
      },
      {
        key: 'approved',
        label: 'Approved',
        value: approved,
        subtitle: total > 0 ? `${percent(approved, total)}% of events` : 'Filtered dataset',
        tone: 'green',
        share: percent(approved, total),
        showMeter: total > 0
      },
      {
        key: 'rejected',
        label: 'Rejected',
        value: rejected,
        subtitle: total > 0 ? `${percent(rejected, total)}% of events` : 'Filtered dataset',
        tone: 'red',
        share: percent(rejected, total),
        showMeter: total > 0
      },
      {
        key: 'pending',
        label: 'Pending',
        value: pending,
        subtitle: 'Open change requests',
        tone: 'amber',
        share: percent(pending, total),
        showMeter: total > 0
      }
    ];
  });

  constructor() {
    this.applyQueryParams(this.route.snapshot.queryParamMap);
    this.debouncedSearch.set(this.searchQuery().trim());

    toObservable(this.searchQuery)
      .pipe(takeUntilDestroyed(), skip(1), debounceTime(400), distinctUntilChanged())
      .subscribe(value => {
        const next = value.trim();

        if (this.debouncedSearch() !== next) {
          this.page.set(0);
        }

        this.debouncedSearch.set(next);
      });

    toObservable(this.loadKey)
      .pipe(
        takeUntilDestroyed(),
        filter(key => !this.isAdminOnly() || isUsableUserId(key.query.userId)),
        distinctUntilChanged((left, right) => JSON.stringify(left) === JSON.stringify(right)),
        tap(key => this.syncUrl(key.query)),
        switchMap(key => this.fetchHistory(key.query))
      )
      .subscribe();

    toObservable(this.statsKey)
      .pipe(
        takeUntilDestroyed(),
        filter(key => !this.isAdminOnly() || isUsableUserId(key.filters.userId)),
        distinctUntilChanged((left, right) => JSON.stringify(left) === JSON.stringify(right)),
        switchMap(key => this.fetchStatistics(key.filters))
      )
      .subscribe();

    toObservable(this.authService.currentUser)
      .pipe(
        takeUntilDestroyed(),
        filter(() => this.isAdminOnly()),
        distinctUntilChanged()
      )
      .subscribe(() => this.ensureCurrentUserId());

    if (this.isSuperAdmin()) {
      this.loadUsers();
    }
  }

  loadHistory(): void {
    if (this.isAdminOnly() && !isUsableUserId(this.currentUserId())) {
      this.ensureCurrentUserId();
      return;
    }

    this.reloadToken.update(token => token + 1);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onEntityChange(value: HistoryEntityFilter): void {
    this.entityFilter.set(value);
    this.page.set(0);
  }

  onActionChange(value: HistoryActionFilter): void {
    this.actionFilter.set(value);
    this.page.set(0);
  }

  onUserChange(value: string): void {
    if (!this.isSuperAdmin()) {
      return;
    }

    this.userFilter.set(value);
    this.page.set(0);
  }

  onDateRangeChange(range: { from: string; to: string }): void {
    this.fromDate.set(readHistoryDateParam(range.from));
    this.toDate.set(readHistoryDateParam(range.to));
    this.page.set(0);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.debouncedSearch.set('');
    this.entityFilter.set('ALL');
    this.actionFilter.set('ALL');
    this.userFilter.set('ALL');
    this.fromDate.set('');
    this.toDate.set('');
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

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.page.set(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.pageSize.set(Number(target.value));
      this.page.set(0);
    }
  }

  openDetails(item: HistoryEventView): void {
    this.selectedItem.set(item);
  }

  closeDetails(): void {
    this.selectedItem.set(null);
  }

  private fetchHistory(query: AuditHistoryQuery) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.auditService.getHistory(query).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError((error: HttpErrorResponse) => {
        this.logs.set([]);
        this.totalElements.set(0);
        this.totalPages.set(0);
        this.errorMessage.set(
          resolveAuditApiError(error, 'Unable to load history. Please try again.', 'User history not found.')
        );
        return of(null);
      }),
      finalize(() => this.isLoading.set(false)),
      tap(page => {
        if (!page) {
          return;
        }

        const parsed = readHistoryPage(page);
        this.logs.set(parsed.content);
        this.totalElements.set(parsed.totalElements);
        this.totalPages.set(parsed.totalPages);

        const selected = this.selectedItem();
        if (selected) {
          const updated = parsed.content
            .map(log => toHistoryEventView(log))
            .find(item => item.id === selected.id);

          if (updated) {
            this.selectedItem.set(updated);
          }
        }

        if (parsed.totalPages > 0 && this.page() >= parsed.totalPages) {
          this.page.set(parsed.totalPages - 1);
        }
      })
    );
  }

  private fetchStatistics(filters: AuditHistoryFilters) {
    this.isStatsLoading.set(true);
    this.statsError.set(null);

    return this.auditService.getStatistics(filters).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => {
        this.statsError.set('Unable to load statistics.');
        return of(null);
      }),
      finalize(() => this.isStatsLoading.set(false)),
      tap(payload => {
        if (!payload) {
          return;
        }

        this.statistics.set(readAuditStatistics(payload));
      })
    );
  }

  private loadUsers(): void {
    this.userService
      .getUsers()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of<PlatformUser[]>([]))
      )
      .subscribe(users => this.users.set(users));
  }

  private ensureCurrentUserId(): void {
    if (this.readUserId(this.authService.currentUser()) || this.profileRequestInFlight) {
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.isLoading.set(false);
      this.isStatsLoading.set(false);
      return;
    }

    this.profileRequestInFlight = true;
    this.isLoading.set(true);
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
          this.isStatsLoading.set(false);
          this.errorMessage.set(
            resolveAuditApiError(error, 'Unable to load history. Please try again.', 'User history not found.')
          );
        }
      });
  }

  private applyQueryParams(params: ParamMap): void {
    const page = Number(params.get('page'));
    if (Number.isInteger(page) && page >= 0) {
      this.page.set(page);
    }

    const size = Number(params.get('size'));
    if ((HISTORY_PAGE_SIZES as readonly number[]).includes(size)) {
      this.pageSize.set(size);
    }

    const entityType = params.get('entityType');
    if (entityType && isHistoryEntityFilter(entityType)) {
      this.entityFilter.set(entityType);
    }

    const action = params.get('action');
    if (action && isHistoryActionFilter(action)) {
      this.actionFilter.set(action);
    }

    const userId = params.get('userId');
    if (userId && isUsableUserId(userId) && !this.isAdminOnly()) {
      this.userFilter.set(userId);
    }

    this.searchQuery.set(params.get('search') ?? params.get('q') ?? '');
    this.fromDate.set(readHistoryDateParam(params.get('from')));
    this.toDate.set(readHistoryDateParam(params.get('to')));
  }

  private syncUrl(query: AuditHistoryQuery): void {
    const queryParams: Record<string, string | number> = {
      page: query.page,
      size: query.size
    };

    if (query.search) {
      queryParams['search'] = query.search;
    }

    if (query.entityType) {
      queryParams['entityType'] = query.entityType;
    }

    if (query.action) {
      queryParams['action'] = query.action;
    }

    if (query.userId && !this.isAdminOnly()) {
      queryParams['userId'] = query.userId;
    }

    if (query.from) {
      queryParams['from'] = readHistoryDateParam(query.from);
    }

    if (query.to) {
      queryParams['to'] = readHistoryDateParam(query.to);
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  private readUserId(user: AuthenticatedUser | null): string | null {
    if (!user || !isUsableUserId(user.userId)) {
      return null;
    }

    return user.userId.trim();
  }
}

function percent(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}
