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
import { JsonDataComparison } from '../../../../shared/components/json-data-comparison/json-data-comparison';
import { AuditLog } from '../../models/audit-log.model';
import { AuditService } from '../../services/audit.service';
import { resultBadgeClass, toAuditPresentation } from '../../utils/audit-presentation';
import { resolveAuditApiError } from '../../utils/audit.utils';

@Component({
  selector: 'app-audit-detail',
  imports: [RouterLink, JsonDataComparison],
  templateUrl: './audit-detail.html',
  styleUrl: './audit-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditDetail implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly log = signal<AuditLog | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly technicalOpen = signal(false);

  readonly item = computed(() => {
    const log = this.log();
    return log ? toAuditPresentation(log) : null;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.isLoading.set(false);
      this.errorMessage.set('Audit record not found.');
      return;
    }

    this.loadAudit(id);
  }

  resultClass(): string {
    const item = this.item();
    return item ? resultBadgeClass(item.status) : '';
  }

  toggleTechnical(): void {
    this.technicalOpen.update(open => !open);
  }

  back(): void {
    void this.router.navigateByUrl('/audit');
  }

  private loadAudit(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auditService
      .getAuditById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: log => this.log.set(log),
        error: (error: HttpErrorResponse) => {
          this.log.set(null);
          this.errorMessage.set(resolveAuditApiError(error));
        }
      });
  }
}
