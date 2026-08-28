import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { distinctUntilChanged, filter, map } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { NotificationDropdown } from './notification-dropdown/notification-dropdown';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, NotificationDropdown],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly collapsed = input(false);
  readonly mobileOpen = input(false);
  readonly sidebarToggle = output<void>();

  readonly pageTitle = signal('Tableau de bord');
  readonly isMenuOpen = signal(false);
  readonly isNotificationsOpen = signal(false);

  readonly displayName = this.authService.displayName;
  readonly roleLabel = this.authService.roleLabel;
  readonly unreadCount = this.notificationService.unreadCount;

  private readonly notificationRoot = viewChild<ElementRef<HTMLElement>>('notificationRoot');

  private lastNotificationUserId: string | null = null;

  constructor() {
    this.updatePageTitle();

    toObservable(this.authService.currentUser)
      .pipe(
        map(user => user?.userId ?? null),
        distinctUntilChanged(),
        takeUntilDestroyed()
      )
      .subscribe(userId => this.onAuthenticatedUserChanged(userId));

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.updatePageTitle();
        this.isMenuOpen.set(false);
        this.isNotificationsOpen.set(false);
      });
  }

  unreadBadge(): string {
    const count = this.unreadCount();
    return count > 99 ? '99+' : String(count);
  }

  notificationsLabel(): string {
    const count = this.unreadCount();

    if (count === 0) {
      return 'Notifications';
    }

    if (count === 1) {
      return 'Notifications, 1 unread';
    }

    return `Notifications, ${this.unreadBadge()} unread`;
  }

  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  toggleUserMenu(): void {
    this.isNotificationsOpen.set(false);
    this.isMenuOpen.update(isOpen => !isOpen);
  }

  closeUserMenu(): void {
    this.isMenuOpen.set(false);
  }

  toggleNotifications(): void {
    const willOpen = !this.isNotificationsOpen();

    this.isMenuOpen.set(false);
    this.isNotificationsOpen.set(willOpen);

    if (willOpen) {
      this.notificationService.ensureLoaded();
    }
  }

  closeNotifications(): void {
    this.isNotificationsOpen.set(false);
  }

  closeUserMenuOnBlur(event: FocusEvent): void {
    const currentTarget = event.currentTarget;
    const nextTarget = event.relatedTarget;

    if (
      currentTarget instanceof HTMLElement &&
      nextTarget instanceof Node &&
      currentTarget.contains(nextTarget)
    ) {
      return;
    }

    this.isMenuOpen.set(false);
  }

  closeNotificationsOnBlur(event: FocusEvent): void {
    const currentTarget = event.currentTarget;
    const nextTarget = event.relatedTarget;

    if (!(nextTarget instanceof Node)) {
      return;
    }

    if (
      currentTarget instanceof HTMLElement &&
      currentTarget.contains(nextTarget)
    ) {
      return;
    }

    this.isNotificationsOpen.set(false);
  }

  logout(): void {
    this.isMenuOpen.set(false);
    this.isNotificationsOpen.set(false);
    this.notificationService.clear();
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isNotificationsOpen()) {
      return;
    }

    const root = this.notificationRoot()?.nativeElement;
    const target = event.target;

    if (root && target instanceof Node && root.contains(target)) {
      return;
    }

    this.isNotificationsOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isNotificationsOpen()) {
      this.isNotificationsOpen.set(false);
    }
  }

  private onAuthenticatedUserChanged(userId: string | null): void {
    if (this.lastNotificationUserId !== null && this.lastNotificationUserId !== userId) {
      this.notificationService.clear();
    }

    this.lastNotificationUserId = userId;

    if (userId) {
      this.notificationService.loadNotifications();
      return;
    }

    this.notificationService.clear();
  }

  private updatePageTitle(): void {
    let snapshot = this.router.routerState.snapshot.root;

    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }

    const title = snapshot.data['title'];
    this.pageTitle.set(typeof title === 'string' && title.length > 0 ? title : 'Tableau de bord');
  }
}
