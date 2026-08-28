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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { DataComparison } from '../../components/data-comparison/data-comparison';
import { ChangeRequest } from '../../models/change-request.model';
import { ChangeRequestService } from '../../services/change-request.service';
import {
  formatRequestDateTime,
  operationLabel,
  resolveChangeRequestApiError,
  statusLabel
} from '../../utils/change-request.utils';
import { displayBusinessText } from '../../utils/review-comparison';

type ReviewAction = 'approve' | 'reject';

@Component({
  selector: 'app-request-detail',
  imports: [RouterLink, ConfirmationDialog, DataComparison],
  templateUrl: './request-detail.html',
  styleUrl: './request-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestDetail implements OnInit {
  private readonly changeRequestService = inject(ChangeRequestService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly request = signal<ChangeRequest | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly pendingAction = signal<ReviewAction | null>(null);
  readonly reviewComment = signal('');
  private readonly requestId = signal<string | null>(null);

  readonly isSuperAdmin = computed(() => this.authService.hasRole('SUPER_ADMIN'));
  readonly canReview = computed(
    () => this.isSuperAdmin() && this.request()?.status === 'PENDING' && !this.isSubmitting()
  );
  readonly canRetry = computed(() => this.requestId() !== null);
  readonly isApproveSubmitting = computed(
    () => this.isSubmitting() && this.pendingAction() === 'approve'
  );
  readonly isRejectSubmitting = computed(
    () => this.isSubmitting() && this.pendingAction() === 'reject'
  );
  readonly eyebrow = computed(() => (this.isSuperAdmin() ? 'Validations' : 'My Requests'));

  readonly backLink = computed(() =>
    this.isSuperAdmin() ? '/change-requests/validations' : '/change-requests/my-requests'
  );

  readonly backLabel = computed(() =>
    this.isSuperAdmin() ? 'Back to Validations' : 'Back to My Requests'
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.isLoading.set(false);
      this.errorMessage.set('Change request not found.');
      return;
    }

    this.requestId.set(id);
    this.loadRequest(id);
  }

  statusText(request: ChangeRequest): string {
    return statusLabel(request.status);
  }

  operationText(request: ChangeRequest): string {
    return operationLabel(request.operation);
  }

  formatDate(value: string | null): string {
    return formatRequestDateTime(value);
  }

  personName(value: string | null | undefined): string {
    return displayBusinessText(value);
  }

  hasReviewComment(request: ChangeRequest): boolean {
    return !!request.reviewComment?.trim();
  }

  reviewCommentText(request: ChangeRequest): string {
    if (request.status === 'PENDING' && !this.hasReviewComment(request)) {
      return 'No review has been submitted yet.';
    }

    const comment = request.reviewComment?.trim();
    return comment && comment.length > 0 ? comment : 'No review comment provided.';
  }

  decisionLine(request: ChangeRequest): string {
    const reviewer = this.personName(request.reviewedByName);
    const reviewedAt = formatRequestDateTime(request.reviewedAt).replace(', ', ' at ');

    if (request.status === 'APPROVED') {
      return `Approved by ${reviewer} on ${reviewedAt}.`;
    }

    if (request.status === 'REJECTED') {
      return `Rejected by ${reviewer} on ${reviewedAt}.`;
    }

    return '';
  }

  onCommentInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLTextAreaElement) {
      this.reviewComment.set(target.value);
    }
  }

  openApproveDialog(): void {
    if (!this.canReview()) {
      return;
    }

    this.reviewComment.set('');
    this.pendingAction.set('approve');
  }

  openRejectDialog(): void {
    if (!this.canReview()) {
      return;
    }

    this.reviewComment.set('');
    this.pendingAction.set('reject');
  }

  closeDialog(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.pendingAction.set(null);
  }

  confirmReview(): void {
    const request = this.request();
    const action = this.pendingAction();

    if (!request || !action || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const comment = this.reviewComment().trim();
    const request$ =
      action === 'approve'
        ? this.changeRequestService.approveRequest(request.id, comment)
        : this.changeRequestService.rejectRequest(request.id, comment);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: updated => {
          this.request.set(updated);
          this.pendingAction.set(null);
          this.notificationService.loadNotifications();

          const notice = action === 'approve' ? 'approved' : 'rejected';
          void this.router.navigate(['/change-requests/validations'], {
            queryParams: { notice }
          });
        },
        error: (error: HttpErrorResponse) => {
          this.pendingAction.set(null);
          this.errorMessage.set(
            resolveChangeRequestApiError(error, 'Unable to complete this review. Please try again.')
          );
        }
      });
  }

  retry(): void {
    const id = this.requestId();

    if (id) {
      this.loadRequest(id);
    }
  }

  private loadRequest(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.changeRequestService
      .getRequestById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: request => this.request.set(request),
        error: (error: HttpErrorResponse) => {
          this.request.set(null);
          this.errorMessage.set(
            resolveChangeRequestApiError(error, 'Unable to load this change request. Please try again.')
          );
        }
      });
  }
}
