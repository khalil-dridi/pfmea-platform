import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  skip,
  switchMap,
  tap
} from 'rxjs';
import {
  ChangeRequest,
  ChangeRequestOperation,
  ChangeRequestStatus,
  DEFAULT_MY_REQUEST_PAGE_SIZE,
  MY_REQUEST_PAGE_SIZES,
  MyRequestOperationFilter,
  MyRequestsQuery,
  MyRequestStatusFilter
} from '../../models/change-request.model';
import { ChangeRequestService } from '../../services/change-request.service';
import {
  entityDisplayName,
  entityTypeLabel,
  formatRequestListDate,
  operationLabel,
  readRequestDateParam,
  statusLabel,
  visibleRequestPageIndexes
} from '../../utils/change-request.utils';

const SEARCH_DEBOUNCE_MS = 400;
const LOAD_ERROR_MESSAGE = 'Unable to load your requests.';

@Component({
  selector: 'app-my-requests',
  imports: [RouterLink],
  templateUrl: './my-requests.html',
  styleUrl: './my-requests.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyRequests {
  private readonly changeRequestService = inject(ChangeRequestService);

  readonly pageSizes = MY_REQUEST_PAGE_SIZES;
  readonly skeletonRows = [0, 1, 2, 3, 4];

  readonly requests = signal<ChangeRequest[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly debouncedSearch = signal('');
  readonly operationFilter = signal<MyRequestOperationFilter>('ALL');
  readonly statusFilter = signal<MyRequestStatusFilter>('ALL');
  readonly fromDate = signal('');
  readonly toDate = signal('');
  readonly page = signal(0);
  readonly pageSize = signal(DEFAULT_MY_REQUEST_PAGE_SIZE);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly numberOfElements = signal(0);
  readonly isFirstPage = signal(true);
  readonly isLastPage = signal(true);
  readonly reloadToken = signal(0);
  private loadGeneration = 0;

  readonly hasActiveFilters = computed(
    () =>
      this.debouncedSearch().trim().length > 0 ||
      this.operationFilter() !== 'ALL' ||
      this.statusFilter() !== 'ALL' ||
      this.fromDate().length > 0 ||
      this.toDate().length > 0
  );

  readonly activeFilterCount = computed(() => {
    let count = 0;

    if (this.debouncedSearch().trim().length > 0) {
      count += 1;
    }
    if (this.operationFilter() !== 'ALL') {
      count += 1;
    }
    if (this.statusFilter() !== 'ALL') {
      count += 1;
    }
    if (this.fromDate().length > 0) {
      count += 1;
    }
    if (this.toDate().length > 0) {
      count += 1;
    }

    return count;
  });

  readonly listQuery = computed<MyRequestsQuery>(() => {
    const search = this.debouncedSearch().trim();
    const operation = this.operationFilter();
    const status = this.statusFilter();

    return {
      page: this.page(),
      size: this.pageSize(),
      search: search.length > 0 ? search : undefined,
      operation: operation === 'ALL' ? undefined : operation,
      status: status === 'ALL' ? undefined : status,
      from: this.fromDate() || undefined,
      to: this.toDate() || undefined
    };
  });

  readonly loadKey = computed(() => ({
    query: this.listQuery(),
    reload: this.reloadToken()
  }));

  readonly canPrev = computed(() => !this.isFirstPage() && this.page() > 0);
  readonly canNext = computed(() => !this.isLastPage() && this.totalElements() > 0);
  readonly rangeStart = computed(() =>
    this.totalElements() === 0 ? 0 : this.page() * this.pageSize() + 1
  );
  readonly rangeEnd = computed(() =>
    this.totalElements() === 0 ? 0 : this.page() * this.pageSize() + this.numberOfElements()
  );
  readonly visiblePages = computed(() =>
    visibleRequestPageIndexes(this.page(), this.totalPages())
  );
  readonly showSkeleton = computed(() => this.isLoading() && this.requests().length === 0);
  readonly showEmpty = computed(
    () => !this.isLoading() && this.errorMessage() === null && this.requests().length === 0
  );
  readonly showErrorState = computed(
    () => !this.isLoading() && this.errorMessage() !== null && this.requests().length === 0
  );
  readonly showResults = computed(() => this.requests().length > 0);
  readonly isRefreshing = computed(() => this.isLoading() && this.requests().length > 0);
  readonly paginationDisabled = computed(() => this.isLoading());

  constructor() {
    this.debouncedSearch.set(this.searchQuery().trim());

    toObservable(this.searchQuery)
      .pipe(takeUntilDestroyed(), skip(1), debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged())
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
        distinctUntilChanged((left, right) => JSON.stringify(left) === JSON.stringify(right)),
        switchMap(key => this.fetchRequests(key.query))
      )
      .subscribe();
  }

  loadRequests(): void {
    this.reloadToken.update(token => token + 1);
  }

  onSearchInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.searchQuery.set(target.value);
    }
  }

  onOperationFilterChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    this.operationFilter.set(isOperationFilter(target.value) ? target.value : 'ALL');
    this.page.set(0);
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    this.statusFilter.set(isStatusFilter(target.value) ? target.value : 'ALL');
    this.page.set(0);
  }

  onFromDateChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.fromDate.set(readRequestDateParam(target.value));
    this.page.set(0);
  }

  onToDateChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.toDate.set(readRequestDateParam(target.value));
    this.page.set(0);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.debouncedSearch.set('');
    this.operationFilter.set('ALL');
    this.statusFilter.set('ALL');
    this.fromDate.set('');
    this.toDate.set('');
    this.page.set(0);
  }

  previousPage(): void {
    if (!this.paginationDisabled() && this.canPrev()) {
      this.page.update(page => page - 1);
    }
  }

  nextPage(): void {
    if (!this.paginationDisabled() && this.canNext()) {
      this.page.update(page => page + 1);
    }
  }

  goToPage(page: number): void {
    if (this.paginationDisabled() || page < 0 || page >= this.totalPages() || page === this.page()) {
      return;
    }

    this.page.set(page);
  }

  onPageSizeChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    const nextSize = Number(target.value);

    if (!MY_REQUEST_PAGE_SIZES.includes(nextSize as (typeof MY_REQUEST_PAGE_SIZES)[number])) {
      return;
    }

    this.pageSize.set(nextSize);
    this.page.set(0);
  }

  statusText(status: ChangeRequestStatus): string {
    return statusLabel(status);
  }

  operationText(request: ChangeRequest): string {
    return operationLabel(request.operation);
  }

  entityTypeText(request: ChangeRequest): string {
    return entityTypeLabel(request.entityType);
  }

  entityName(request: ChangeRequest): string | null {
    return entityDisplayName(request);
  }

  submittedAt(request: ChangeRequest): string {
    return formatRequestListDate(request.createdAt);
  }

  reviewedAt(request: ChangeRequest): string {
    return formatRequestListDate(request.reviewedAt);
  }

  private fetchRequests(query: MyRequestsQuery) {
    const generation = ++this.loadGeneration;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.changeRequestService.getMyRequests(query).pipe(
      catchError((_error: HttpErrorResponse) => {
        if (generation !== this.loadGeneration) {
          return of(null);
        }

        if (this.requests().length === 0) {
          this.totalElements.set(0);
          this.totalPages.set(0);
          this.numberOfElements.set(0);
          this.isFirstPage.set(true);
          this.isLastPage.set(true);
        }

        this.errorMessage.set(LOAD_ERROR_MESSAGE);
        return of(null);
      }),
      finalize(() => {
        if (generation === this.loadGeneration) {
          this.isLoading.set(false);
        }
      }),
      tap(page => {
        if (!page || generation !== this.loadGeneration) {
          return;
        }

        this.requests.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.numberOfElements.set(page.numberOfElements);
        this.isFirstPage.set(page.first === true);
        this.isLastPage.set(page.last === true);

        if (page.totalPages > 0 && this.page() >= page.totalPages) {
          this.page.set(page.totalPages - 1);
        }
      })
    );
  }
}

function isOperationFilter(value: string): value is ChangeRequestOperation {
  return value === 'CREATE' || value === 'UPDATE';
}

function isStatusFilter(value: string): value is ChangeRequestStatus {
  return value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED';
}
