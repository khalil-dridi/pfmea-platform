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
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ValidationEmptyState } from '../../components/validation-empty-state/validation-empty-state';
import { ValidationFilters } from '../../components/validation-filters/validation-filters';
import { ValidationItem } from '../../components/validation-item/validation-item';
import { ValidationSkeleton } from '../../components/validation-skeleton/validation-skeleton';
import { ChangeRequest } from '../../models/change-request.model';
import {
  ValidationOperationFilter,
  ValidationSort,
  ValidationStatusFilter
} from '../../models/validation-list.model';
import { ChangeRequestService } from '../../services/change-request.service';
import {
  entityDisplayName,
  entityTypeLabel,
  operationLabel,
  resolveChangeRequestApiError,
  statusLabel
} from '../../utils/change-request.utils';

const PAGE_SIZES = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-validations',
  imports: [ValidationEmptyState, ValidationFilters, ValidationItem, ValidationSkeleton],
  templateUrl: './validations.html',
  styleUrl: './validations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Validations implements OnInit {
  private readonly changeRequestService = inject(ChangeRequestService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageSizes = PAGE_SIZES;
  readonly requests = signal<ChangeRequest[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly statusFilter = signal<ValidationStatusFilter>('ALL');
  readonly operationFilter = signal<ValidationOperationFilter>('ALL');
  readonly sort = signal<ValidationSort>('newest');
  readonly page = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  private requestInFlight = false;

  readonly filteredRequests = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const operation = this.operationFilter();

    return this.requests().filter(request => {
      if (status !== 'ALL' && request.status !== status) {
        return false;
      }

      if (operation !== 'ALL' && request.operation !== operation) {
        return false;
      }

      return matchesValidationSearch(request, query);
    });
  });

  readonly sortedRequests = computed(() => {
    const items = [...this.filteredRequests()];
    const direction = this.sort() === 'oldest' ? 1 : -1;

    items.sort((left, right) => (timestamp(left.createdAt) - timestamp(right.createdAt)) * direction);
    return items;
  });

  readonly totalFiltered = computed(() => this.sortedRequests().length);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize()))
  );
  readonly pagedRequests = computed(() => {
    const start = this.page() * this.pageSize();
    return this.sortedRequests().slice(start, start + this.pageSize());
  });
  readonly canPrev = computed(() => this.page() > 0);
  readonly canNext = computed(
    () => this.page() + 1 < this.totalPages() && this.totalFiltered() > 0
  );
  readonly rangeStart = computed(() =>
    this.totalFiltered() === 0 ? 0 : this.page() * this.pageSize() + 1
  );
  readonly rangeEnd = computed(() =>
    Math.min((this.page() + 1) * this.pageSize(), this.totalFiltered())
  );
  readonly visiblePages = computed(() => visiblePageIndexes(this.page(), this.totalPages()));
  readonly hasActiveFilters = computed(
    () =>
      this.searchQuery().trim().length > 0 ||
      this.statusFilter() !== 'ALL' ||
      this.operationFilter() !== 'ALL' ||
      this.sort() !== 'newest'
  );

  constructor() {
    effect(() => {
      this.searchQuery();
      this.statusFilter();
      this.operationFilter();
      this.sort();
      this.pageSize();
      untracked(() => this.page.set(0));
    });

    effect(() => {
      const maxPage = Math.max(0, this.totalPages() - 1);

      if (this.page() > maxPage) {
        untracked(() => this.page.set(maxPage));
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const notice = params.get('notice');

        if (notice === 'approved') {
          this.successMessage.set('Change request approved successfully.');
          this.clearNotice();
        }

        if (notice === 'rejected') {
          this.successMessage.set('Change request rejected successfully.');
          this.clearNotice();
        }
      });

    this.loadRequests();
  }

  loadRequests(): void {
    if (this.requestInFlight) {
      return;
    }

    this.requestInFlight = true;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.changeRequestService
      .getPendingRequests()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.requestInFlight = false;
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: requests => this.requests.set(requests),
        error: (error: HttpErrorResponse) => {
          this.requests.set([]);
          this.errorMessage.set(
            resolveChangeRequestApiError(error, 'Unable to load validations. Please try again.')
          );
        }
      });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onStatusChange(value: ValidationStatusFilter): void {
    this.statusFilter.set(value);
  }

  onOperationChange(value: ValidationOperationFilter): void {
    this.operationFilter.set(value);
  }

  onSortChange(value: ValidationSort): void {
    this.sort.set(value);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('ALL');
    this.operationFilter.set('ALL');
    this.sort.set('newest');
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
    }
  }

  private clearNotice(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }
}

function matchesValidationSearch(request: ChangeRequest, query: string): boolean {
  if (query.length === 0) {
    return true;
  }

  const name = entityDisplayName(request) ?? '';
  const haystack = [
    operationLabel(request.operation),
    request.operation,
    entityTypeLabel(request.entityType),
    request.entityType,
    statusLabel(request.status),
    request.status,
    request.requestedByName,
    name
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

function timestamp(value: string): number {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function visiblePageIndexes(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index);
  }

  const start = Math.max(0, Math.min(current - 3, total - 7));
  return Array.from({ length: 7 }, (_, index) => start + index);
}
