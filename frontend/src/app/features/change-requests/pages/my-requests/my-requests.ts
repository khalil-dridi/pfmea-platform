import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  ChangeRequest,
  ChangeRequestOperation,
  ChangeRequestStatus
} from '../../models/change-request.model';
import { ChangeRequestService } from '../../services/change-request.service';
import {
  entityDisplayName,
  entityTypeLabel,
  formatRequestDateTime,
  isCreatedAtInRange,
  operationLabel,
  resolveChangeRequestApiError,
  statusLabel
} from '../../utils/change-request.utils';

type StatusFilter = 'ALL' | ChangeRequestStatus;
type ActionFilter = 'ALL' | ChangeRequestOperation;

@Component({
  selector: 'app-my-requests',
  imports: [RouterLink],
  templateUrl: './my-requests.html',
  styleUrl: './my-requests.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyRequests implements OnInit {
  private readonly changeRequestService = inject(ChangeRequestService);
  private readonly destroyRef = inject(DestroyRef);

  readonly requests = signal<ChangeRequest[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly actionFilter = signal<ActionFilter>('ALL');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly fromDate = signal('');
  readonly toDate = signal('');
  readonly skeletonRows = [0, 1, 2, 3];
  private requestInFlight = false;

  readonly filteredRequests = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const action = this.actionFilter();
    const status = this.statusFilter();
    const fromDate = this.fromDate();
    const toDate = this.toDate();

    return this.requests().filter(request => {
      if (action !== 'ALL' && request.operation !== action) {
        return false;
      }

      if (status !== 'ALL' && request.status !== status) {
        return false;
      }

      if (!isCreatedAtInRange(request.createdAt, fromDate, toDate)) {
        return false;
      }

      return this.matchesSearch(request, query);
    });
  });

  readonly hasActiveFilters = computed(
    () =>
      this.searchQuery().trim().length > 0 ||
      this.actionFilter() !== 'ALL' ||
      this.statusFilter() !== 'ALL' ||
      this.fromDate().length > 0 ||
      this.toDate().length > 0
  );

  ngOnInit(): void {
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
      .getMyRequests()
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
            resolveChangeRequestApiError(error, 'An error occurred. Please try again.')
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

  onActionFilterChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    this.actionFilter.set(target.value === 'CREATE' || target.value === 'UPDATE' ? target.value : 'ALL');
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    const value = target.value;

    if (value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED') {
      this.statusFilter.set(value);
      return;
    }

    this.statusFilter.set('ALL');
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
    this.statusFilter.set('ALL');
    this.fromDate.set('');
    this.toDate.set('');
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
    return formatRequestDateTime(request.createdAt);
  }

  reviewedAt(request: ChangeRequest): string {
    return formatRequestDateTime(request.reviewedAt);
  }

  private matchesSearch(request: ChangeRequest, query: string): boolean {
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
}
