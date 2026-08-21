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
import { ChangeRequest, ChangeRequestStatus } from '../../models/change-request.model';
import { ChangeRequestService } from '../../services/change-request.service';
import {
  formatRequestDateTime,
  operationLabel,
  resolveChangeRequestApiError,
  statusLabel
} from '../../utils/change-request.utils';

type StatusFilter = 'ALL' | ChangeRequestStatus;

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
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly skeletonRows = [0, 1, 2, 3];
  private requestInFlight = false;

  readonly filteredRequests = computed(() => {
    const status = this.statusFilter();

    if (status === 'ALL') {
      return this.requests();
    }

    return this.requests().filter(request => request.status === status);
  });

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

  statusText(status: ChangeRequestStatus): string {
    return statusLabel(status);
  }

  operationText(request: ChangeRequest): string {
    return operationLabel(request.operation);
  }

  submittedAt(request: ChangeRequest): string {
    return formatRequestDateTime(request.createdAt);
  }

  reviewedAt(request: ChangeRequest): string {
    return formatRequestDateTime(request.reviewedAt);
  }
}
