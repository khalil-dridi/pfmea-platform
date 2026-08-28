import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification, NotificationPage, NotificationPayload } from '../models/notification.model';
import {
  NOTIFICATION_PAGE_SIZE,
  readNotificationPage,
  resolveNotificationApiError,
  toNotification
} from '../utils/notification.utils';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  private readonly notificationsSignal = signal<Notification[]>([]);
  private readonly isLoadingSignal = signal(false);
  private readonly isLoadingMoreSignal = signal(false);
  private readonly errorMessageSignal = signal<string | null>(null);
  private readonly loadMoreErrorSignal = signal<string | null>(null);
  private readonly currentPageSignal = signal(0);
  private readonly totalPagesSignal = signal(0);
  private readonly lastPageSignal = signal(true);
  private readonly recentIdsSignal = signal<string[]>([]);
  private hasLoaded = false;
  private initialInFlight = false;
  private moreInFlight = false;
  private loadGeneration = 0;

  readonly notifications = this.notificationsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isLoadingMore = this.isLoadingMoreSignal.asReadonly();
  readonly errorMessage = this.errorMessageSignal.asReadonly();
  readonly loadMoreError = this.loadMoreErrorSignal.asReadonly();
  readonly recentIds = this.recentIdsSignal.asReadonly();
  readonly hasMore = computed(() => !this.lastPageSignal());

  readonly unreadCount = computed(
    () => this.notificationsSignal().filter(notification => !notification.read).length
  );

  readonly hasUnread = computed(() => this.unreadCount() > 0);

  ensureLoaded(): void {
    if (this.hasLoaded || this.initialInFlight) {
      this.recentIdsSignal.set([]);
      return;
    }

    this.loadNotifications();
  }

  loadNotifications(): void {
    if (this.initialInFlight) {
      return;
    }

    this.moreInFlight = false;
    this.initialInFlight = true;
    this.isLoadingSignal.set(true);
    this.isLoadingMoreSignal.set(false);
    this.errorMessageSignal.set(null);
    this.loadMoreErrorSignal.set(null);
    this.recentIdsSignal.set([]);
    const generation = ++this.loadGeneration;

    this.getNotifications(0, NOTIFICATION_PAGE_SIZE).subscribe({
      next: page => {
        if (generation !== this.loadGeneration) {
          return;
        }

        this.applyPage(page, false);
        this.hasLoaded = true;
        this.isLoadingSignal.set(false);
        this.initialInFlight = false;
      },
      error: (error: HttpErrorResponse) => {
        if (generation !== this.loadGeneration) {
          return;
        }

        this.notificationsSignal.set([]);
        this.resetPaging();
        this.hasLoaded = false;
        this.errorMessageSignal.set(
          resolveNotificationApiError(error, 'Unable to load notifications. Please try again.')
        );
        this.isLoadingSignal.set(false);
        this.initialInFlight = false;
      }
    });
  }

  loadMore(): void {
    if (!this.hasMore() || this.initialInFlight || this.moreInFlight || this.isLoadingSignal()) {
      return;
    }

    this.moreInFlight = true;
    this.isLoadingMoreSignal.set(true);
    this.loadMoreErrorSignal.set(null);
    const generation = this.loadGeneration;
    const nextPage = this.currentPageSignal() + 1;

    this.getNotifications(nextPage, NOTIFICATION_PAGE_SIZE).subscribe({
      next: page => {
        if (generation !== this.loadGeneration) {
          return;
        }

        this.applyPage(page, true);
        this.isLoadingMoreSignal.set(false);
        this.moreInFlight = false;
      },
      error: (error: HttpErrorResponse) => {
        if (generation !== this.loadGeneration) {
          return;
        }

        this.loadMoreErrorSignal.set(
          resolveNotificationApiError(error, 'Unable to load more notifications.')
        );
        this.isLoadingMoreSignal.set(false);
        this.moreInFlight = false;
      }
    });
  }

  getNotifications(page: number, size: number): Observable<NotificationPage<NotificationPayload>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));

    return this.http
      .get<unknown>(this.baseUrl, { params })
      .pipe(map(payload => readNotificationPage(payload)));
  }

  markAsRead(id: string): Observable<Notification> {
    const existing = this.notificationsSignal().find(notification => notification.id === id);

    if (existing?.read) {
      return of(existing);
    }

    return this.runMutation(
      this.http.patch<NotificationPayload>(`${this.baseUrl}/${id}/read`, {}).pipe(
        map(payload => this.toReadNotification(id, payload)),
        tap(notification => this.replaceNotification(notification))
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
          tap(() => this.markLocalNotificationsRead()),
          map(() => undefined)
        )
    );
  }

  clear(): void {
    this.loadGeneration += 1;
    this.notificationsSignal.set([]);
    this.recentIdsSignal.set([]);
    this.errorMessageSignal.set(null);
    this.loadMoreErrorSignal.set(null);
    this.isLoadingSignal.set(false);
    this.isLoadingMoreSignal.set(false);
    this.initialInFlight = false;
    this.moreInFlight = false;
    this.hasLoaded = false;
    this.resetPaging();
  }

  isRecentlyAdded(id: string): boolean {
    return this.recentIdsSignal().includes(id);
  }

  recentIndex(id: string): number {
    return Math.max(0, this.recentIdsSignal().indexOf(id));
  }

  private applyPage(page: NotificationPage<NotificationPayload>, append: boolean): void {
    const incoming = page.content.map(payload => toNotification(payload));

    if (append) {
      const existingIds = new Set(this.notificationsSignal().map(notification => notification.id));
      const unique = incoming.filter(notification => !existingIds.has(notification.id));
      this.notificationsSignal.update(notifications => [...notifications, ...unique]);
      this.recentIdsSignal.set(unique.map(notification => notification.id));
    } else {
      this.notificationsSignal.set(incoming);
      this.recentIdsSignal.set([]);
    }

    this.currentPageSignal.set(page.number);
    this.totalPagesSignal.set(page.totalPages);
    this.lastPageSignal.set(
      page.last === true || page.totalPages <= 0 || page.number >= Math.max(page.totalPages - 1, 0)
    );
  }

  private resetPaging(): void {
    this.currentPageSignal.set(0);
    this.totalPagesSignal.set(0);
    this.lastPageSignal.set(true);
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
