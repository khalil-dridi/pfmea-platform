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
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { distinctUntilChanged, finalize, map } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthenticatedUser } from '../../../auth/models/login-response.model';
import { User as PlatformUser } from '../../../users/models/user.model';
import { UserService } from '../../../users/services/user.service';
import { AuditAction, AuditLog } from '../../models/audit-log.model';
import { AuditService } from '../../services/audit.service';
import {
  actionLabel,
  AUDIT_ACTIONS,
  badgeClass,
  formatAuditDateTime,
  isUsableUserId,
  resolveAuditApiError,
  shortenId
} from '../../utils/audit.utils';

type ActionFilter = 'ALL' | AuditAction;

@Component({
  selector: 'app-audit-list',
  imports: [RouterLink],
  templateUrl: './audit-list.html',
  styleUrl: './audit-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditList implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly logs = signal<AuditLog[]>([]);
  readonly users = signal<PlatformUser[]>([]);
  readonly isLoading = signal(true);
  readonly hasCompletedLoad = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly actionFilter = signal<ActionFilter>('ALL');
  readonly selectedUserId = signal<string | null>(null);
  readonly actionOptions = AUDIT_ACTIONS;

  readonly isSuperAdmin = computed(() => this.authService.hasRole('SUPER_ADMIN'));
  readonly isAdmin = computed(() => this.authService.hasRole('ADMIN'));
  readonly currentUserId = computed(() => this.readUserId(this.authService.currentUser()));

  readonly filteredLogs = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const action = this.actionFilter();

    return this.logs().filter(log => {
      const matchesAction = action === 'ALL' || log.action === action;
      const matchesQuery =
        query.length === 0 ||
        log.action.toLowerCase().includes(query) ||
        log.entityType.toLowerCase().includes(query) ||
        log.performedByName.toLowerCase().includes(query) ||
        (log.entityId ?? '').toLowerCase().includes(query);

      return matchesAction && matchesQuery;
    });
  });

  private profileRequestInFlight = false;
  private loadedHistoryUserId: string | null = null;

  constructor() {
    toObservable(this.authService.currentUser)
      .pipe(
        takeUntilDestroyed(),
        map(user => this.readUserId(user)),
        distinctUntilChanged()
      )
      .subscribe(userId => this.onCurrentUserIdChanged(userId));
  }

  ngOnInit(): void {
    if (this.isSuperAdmin()) {
      this.loadUsers();
    }
  }

  loadHistory(): void {
    const userId = this.historyUserId();

    if (!isUsableUserId(userId)) {
      this.isLoading.set(true);
      this.hasCompletedLoad.set(false);
      this.ensureCurrentUserId();
      return;
    }

    this.isLoading.set(true);
    this.hasCompletedLoad.set(false);
    this.errorMessage.set(null);
    this.loadedHistoryUserId = userId;

    this.auditService
      .getUserHistory(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: logs => {
          this.logs.set(logs);
          this.hasCompletedLoad.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.logs.set([]);
          this.hasCompletedLoad.set(false);
          this.errorMessage.set(
            resolveAuditApiError(error, 'Unable to load history. Please try again.', 'User history not found.')
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

    const value = target.value;
    this.actionFilter.set(this.isAuditAction(value) ? value : 'ALL');
  }

  onUserFilterChange(event: Event): void {
    if (!this.isSuperAdmin()) {
      return;
    }

    const target = event.target;

    if (!(target instanceof HTMLSelectElement) || !isUsableUserId(target.value)) {
      return;
    }

    this.selectedUserId.set(target.value);
    this.loadHistory();
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  actionText(action: AuditAction): string {
    return actionLabel(action);
  }

  actionBadge(action: AuditAction): string {
    return badgeClass(action);
  }

  formatDate(value: string): string {
    return formatAuditDateTime(value);
  }

  entityId(value: string | null): string {
    return shortenId(value);
  }

  userOptionLabel(user: PlatformUser): string {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    return fullName || user.email;
  }

  private onCurrentUserIdChanged(userId: string | null): void {
    if (!userId) {
      this.logs.set([]);
      this.hasCompletedLoad.set(false);
      this.loadedHistoryUserId = null;
      this.selectedUserId.set(null);
      this.ensureCurrentUserId();
      return;
    }

    if (this.isAdminOnly()) {
      this.selectedUserId.set(userId);

      if (this.loadedHistoryUserId !== userId) {
        this.loadHistory();
      }

      return;
    }

    if (this.selectedUserId() === null) {
      this.selectedUserId.set(userId);
    }

    if (this.loadedHistoryUserId === null) {
      this.loadHistory();
    }
  }

  private ensureCurrentUserId(): void {
    if (this.readUserId(this.authService.currentUser()) || this.profileRequestInFlight) {
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.isLoading.set(false);
      return;
    }

    this.profileRequestInFlight = true;
    this.isLoading.set(true);
    this.hasCompletedLoad.set(false);
    this.errorMessage.set(null);

    this.authService
      .loadCurrentProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.profileRequestInFlight = false;
        },
        error: (error: HttpErrorResponse) => {
          this.profileRequestInFlight = false;
          this.isLoading.set(false);
          this.hasCompletedLoad.set(false);
          this.errorMessage.set(
            resolveAuditApiError(error, 'Unable to load history. Please try again.', 'User history not found.')
          );
        }
      });
  }

  private historyUserId(): string | null {
    if (this.isAdminOnly()) {
      return this.readUserId(this.authService.currentUser());
    }

    const selectedUserId = this.selectedUserId();
    return isUsableUserId(selectedUserId)
      ? selectedUserId
      : this.readUserId(this.authService.currentUser());
  }

  private isAdminOnly(): boolean {
    return this.authService.hasRole('ADMIN') && !this.authService.hasRole('SUPER_ADMIN');
  }

  private readUserId(user: AuthenticatedUser | null): string | null {
    if (!user || !isUsableUserId(user.userId)) {
      return null;
    }

    return user.userId.trim();
  }

  private loadUsers(): void {
    this.userService
      .getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: users => this.users.set(users),
        error: () => this.users.set([])
      });
  }

  private isAuditAction(value: string): value is AuditAction {
    return (AUDIT_ACTIONS as readonly string[]).includes(value);
  }
}
