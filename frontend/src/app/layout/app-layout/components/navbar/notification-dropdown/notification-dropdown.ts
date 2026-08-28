import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Notification } from '../../../../../core/models/notification.model';
import { NotificationService } from '../../../../../core/services/notification.service';
import {
  resolveNotificationApiError,
  resolveNotificationRoute
} from '../../../../../core/utils/notification.utils';
import { formatRelativeTime } from '../../../../../core/utils/relative-time';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.html',
  styleUrl: './notification-dropdown.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationDropdown {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly closed = output<void>();

  readonly notifications = this.notificationService.notifications;
  readonly isLoading = this.notificationService.isLoading;
  readonly isLoadingMore = this.notificationService.isLoadingMore;
  readonly errorMessage = this.notificationService.errorMessage;
  readonly loadMoreError = this.notificationService.loadMoreError;
  readonly hasMore = this.notificationService.hasMore;
  readonly hasUnread = this.notificationService.hasUnread;
  readonly skeletonRows = [0, 1, 2, 3];

  readonly isMarkingAll = signal(false);
  readonly markingId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  formatTime(value: string): string {
    return formatRelativeTime(value);
  }

  isNew(id: string): boolean {
    return this.notificationService.isRecentlyAdded(id);
  }

  enterIndex(id: string): number {
    return this.notificationService.recentIndex(id);
  }

  retry(): void {
    this.actionError.set(null);
    this.notificationService.loadNotifications();
  }

  loadMore(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.notificationService.loadMore();
  }

  close(): void {
    this.closed.emit();
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  markAllAsRead(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.hasUnread() || this.isMarkingAll()) {
      return;
    }

    this.isMarkingAll.set(true);
    this.actionError.set(null);

    this.notificationService
      .markAllAsRead()
      .pipe(finalize(() => this.isMarkingAll.set(false)))
      .subscribe({
        error: (error: HttpErrorResponse) => {
          this.actionError.set(
            resolveNotificationApiError(error, 'Unable to mark notifications as read. Please try again.')
          );
        }
      });
  }

  onNotificationActivate(notification: Notification, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.markingId() === notification.id) {
      return;
    }

    const targetRoute = resolveNotificationRoute(notification);

    if (notification.read) {
      this.navigateIfPossible(targetRoute);
      return;
    }

    this.markingId.set(notification.id);
    this.actionError.set(null);

    this.notificationService
      .markAsRead(notification.id)
      .pipe(finalize(() => this.markingId.set(null)))
      .subscribe({
        next: () => this.navigateIfPossible(targetRoute),
        error: (error: HttpErrorResponse) => {
          this.actionError.set(
            resolveNotificationApiError(error, 'Unable to mark this notification as read. Please try again.')
          );
        }
      });
  }

  private navigateIfPossible(route: string | null): void {
    if (!route) {
      return;
    }

    this.closed.emit();
    void this.router.navigateByUrl(route);
  }
}
