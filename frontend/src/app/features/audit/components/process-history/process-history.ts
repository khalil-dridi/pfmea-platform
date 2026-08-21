import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, finalize, map, merge, of, Subject, switchMap } from 'rxjs';
import { AuditLog } from '../../models/audit-log.model';
import { AuditService } from '../../services/audit.service';
import {
  actionLabel,
  actionSummary,
  badgeClass,
  formatAuditDateTime,
  resolveAuditApiError
} from '../../utils/audit.utils';

@Component({
  selector: 'app-process-history',
  imports: [RouterLink],
  templateUrl: './process-history.html',
  styleUrl: './process-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessHistory {
  private readonly auditService = inject(AuditService);
  private readonly reload$ = new Subject<void>();

  readonly processId = input.required<string>();

  readonly logs = signal<AuditLog[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    merge(
      toObservable(this.processId),
      this.reload$.pipe(map(() => this.processId()))
    )
      .pipe(
        takeUntilDestroyed(),
        switchMap(processId => this.fetchHistory(processId))
      )
      .subscribe(logs => this.logs.set(logs));
  }

  retry(): void {
    this.reload$.next();
  }

  actionText(log: AuditLog): string {
    return actionLabel(log.action);
  }

  actionBadge(log: AuditLog): string {
    return badgeClass(log.action);
  }

  summary(log: AuditLog): string {
    return actionSummary(log);
  }

  formatDate(value: string): string {
    return formatAuditDateTime(value);
  }

  private fetchHistory(processId: string) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.auditService.getEntityHistory('PROCESS', processId).pipe(
      catchError((error: HttpErrorResponse) => {
        this.errorMessage.set(resolveAuditApiError(error));
        return of<AuditLog[]>([]);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }
}
