import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification, NotificationPayload } from '../models/notification.model';
import { toNotification, resolveNotificationApiError } from '../utils/notification.utils';

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

    this.http.get<NotificationPayload[]>(this.baseUrl).subscribe({
      next: notifications => {
        if (generation !== this.loadGeneration) {
          return;
        }

        this.notificationsSignal.set(notifications.map(payload => toNotification(payload)));
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
    const existing = this.notificationsSignal().find(notification => notification.id === id);

    if (existing?.read) {
      return of(existing);
    }

    return this.runMutation(
      this.http.patch<NotificationPayload>(`${this.baseUrl}/${id}/read`, {}).pipe(
        map(payload => this.toReadNotification(id, payload)),
        tap(notification => {
          this.invalidateInFlightLoads();
          this.replaceNotification(notification);
        })
      )
    );
  }

  markAllAsRead(): Observable<void> {
    if (!this.hasUnread()) {
      return of(undefined);
    }

    return this.runMutation(
      this.http
        .patch(`${this.baseUrl}/read-all`, {}, {
          observe: 'response',
          responseType: 'text'
        })
        .pipe(
          tap(() => {
            this.invalidateInFlightLoads();
            this.markLocalNotificationsRead();
          }),
          map(() => undefined)
        )
    );
  }

  clear(): void {
    this.loadGeneration += 1;
    this.notificationsSignal.set([]);
    this.errorMessageSignal.set(null);
    this.isLoadingSignal.set(false);
    this.requestInFlight = false;
  }

  private runMutation<T>(source$: Observable<T>): Observable<T> {
    const shared$ = source$.pipe(
      shareReplay({ bufferSize: 1, refCount: false })
    );

    shared$.subscribe({
      error: () => undefined
    });

    return shared$;
  }

  private invalidateInFlightLoads(): void {
    this.loadGeneration += 1;
    this.requestInFlight = false;
    this.isLoadingSignal.set(false);
  }

  private toReadNotification(id: string, payload: NotificationPayload | null): Notification {
    const existing = this.notificationsSignal().find(notification => notification.id === id);
    const fromPayload = payload?.id ? toNotification(payload) : null;
    const base = fromPayload ?? existing;

    if (!base) {
      return {
        id,
        type: 'SYSTEM',
        title: '',
        message: '',
        relatedEntityType: null,
        relatedEntityId: null,
        read: true,
        readAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
    }

    return {
      ...base,
      id,
      read: true,
      readAt: fromPayload?.readAt ?? existing?.readAt ?? new Date().toISOString()
    };
  }

  private replaceNotification(updated: Notification): void {
    this.notificationsSignal.update(notifications =>
      notifications.map(notification =>
        notification.id === updated.id ? { ...notification, ...updated, read: true } : notification
      )
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
