import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';
import { resolveNotificationApiError } from '../utils/notification.utils';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  private readonly notificationsSignal = signal<Notification[]>([]);
  private readonly isLoadingSignal = signal(false);
  private readonly errorMessageSignal = signal<string | null>(null);
  private requestInFlight = false;
  private loadGeneration = 0;

  readonly notifications = this.notificationsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly errorMessage = this.errorMessageSignal.asReadonly();

  readonly unreadCount = computed(
    () => this.notificationsSignal().filter(notification => !notification.read).length
  );

  readonly hasUnread = computed(() => this.unreadCount() > 0);

  loadNotifications(): void {
    if (this.requestInFlight) {
      return;
    }

    this.requestInFlight = true;
    this.isLoadingSignal.set(true);
    this.errorMessageSignal.set(null);
    const generation = ++this.loadGeneration;

    this.http.get<Notification[]>(this.baseUrl).subscribe({
      next: notifications => {
        if (generation !== this.loadGeneration) {
          return;
        }

        this.notificationsSignal.set(notifications);
        this.isLoadingSignal.set(false);
        this.requestInFlight = false;
      },
      error: (error: HttpErrorResponse) => {
        if (generation !== this.loadGeneration) {
          return;
        }

        this.errorMessageSignal.set(
          resolveNotificationApiError(error, 'Unable to load notifications. Please try again.')
        );
        this.isLoadingSignal.set(false);
        this.requestInFlight = false;
      }
    });
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http
      .patch<Notification>(`${this.baseUrl}/${id}/read`, {})
      .pipe(tap(updated => this.replaceNotification(updated)));
  }

  markAllAsRead(): Observable<void> {
    return this.http
      .patch(`${this.baseUrl}/read-all`, {}, {
        observe: 'response',
        responseType: 'text'
      })
      .pipe(
        tap(() => this.markLocalNotificationsRead()),
        map(() => undefined)
      );
  }

  clear(): void {
    this.loadGeneration += 1;
    this.notificationsSignal.set([]);
    this.errorMessageSignal.set(null);
    this.isLoadingSignal.set(false);
    this.requestInFlight = false;
  }

  private replaceNotification(updated: Notification): void {
    this.notificationsSignal.update(notifications =>
      notifications.map(notification => (notification.id === updated.id ? updated : notification))
    );
  }

  private markLocalNotificationsRead(): void {
    const readAt = new Date().toISOString();

    this.notificationsSignal.update(notifications =>
      notifications.map(notification =>
        notification.read
          ? notification
          : {
              ...notification,
              read: true,
              readAt
            }
      )
    );
  }
}
