import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ChangeRequest } from '../../models/change-request.model';
import { ChangeRequestService } from '../../services/change-request.service';
import {
  formatRequestDateTime,
  operationLabel,
  resolveChangeRequestApiError,
  statusLabel
} from '../../utils/change-request.utils';

@Component({
  selector: 'app-validations',
  imports: [RouterLink],
  templateUrl: './validations.html',
  styleUrl: './validations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Validations implements OnInit {
  private readonly changeRequestService = inject(ChangeRequestService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly requests = signal<ChangeRequest[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly skeletonRows = [0, 1, 2, 3];
  private requestInFlight = false;

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
            resolveChangeRequestApiError(error, 'An error occurred. Please try again.')
          );
        }
      });
  }

  operationText(request: ChangeRequest): string {
    return operationLabel(request.operation);
  }

  statusText(): string {
    return statusLabel('PENDING');
  }

  submittedAt(request: ChangeRequest): string {
    return formatRequestDateTime(request.createdAt);
  }

  private clearNotice(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }
}
