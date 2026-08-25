import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { Process } from '../../../processes/models/process.model';
import { ProcessStep } from '../../../processes/models/process-step.model';
import { ProcessService } from '../../../processes/services/process.service';
import { ProcessStepService } from '../../../processes/services/process-step.service';
import { AnalysisCompletenessPanel } from '../../components/analysis-completeness-panel/analysis-completeness-panel';
import { DashboardScopeFilter } from '../../components/dashboard-scope-filter/dashboard-scope-filter';
import { EngineeringAttentionPanel } from '../../components/engineering-attention-panel/engineering-attention-panel';
import { OptimizationExecutionPanel } from '../../components/optimization-execution-panel/optimization-execution-panel';
import { PfmeaCoveragePanel } from '../../components/pfmea-coverage-panel/pfmea-coverage-panel';
import { RiskImprovementPanel } from '../../components/risk-improvement-panel/risk-improvement-panel';
import { RiskPosturePanel } from '../../components/risk-posture-panel/risk-posture-panel';
import { DashboardFilter, DashboardOverview } from '../../models/dashboard-overview.model';
import { DashboardService } from '../../services/dashboard.service';
import { isDashboardEmpty, resolveDashboardApiError } from '../../utils/dashboard.utils';

@Component({
  selector: 'app-dashboard',
  imports: [
    DashboardScopeFilter,
    PfmeaCoveragePanel,
    RiskPosturePanel,
    AnalysisCompletenessPanel,
    RiskImprovementPanel,
    OptimizationExecutionPanel,
    EngineeringAttentionPanel
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard {
  private readonly dashboardService = inject(DashboardService);
  private readonly processService = inject(ProcessService);
  private readonly processStepService = inject(ProcessStepService);
  private readonly destroyRef = inject(DestroyRef);

  readonly processes = signal<Process[]>([]);
  readonly steps = signal<ProcessStep[]>([]);
  readonly scope = signal<DashboardFilter>({ processId: null, processStepId: null });
  readonly overview = signal<DashboardOverview | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly filterError = signal<string | null>(null);
  readonly reloadToken = signal(0);

  readonly processId = computed(() => this.scope().processId);
  readonly processStepId = computed(() => this.scope().processStepId);

  readonly isInitialLoad = computed(() => this.isLoading() && this.overview() === null);
  readonly isRefreshing = computed(() => this.isLoading() && this.overview() !== null);

  readonly attentionRoute = computed(() => {
    const processId = this.processId();
    return processId ? `/processes/${processId}/workspace` : '/processes';
  });

  readonly isEmptyScope = computed(() => {
    const overview = this.overview();
    return !this.isLoading() && overview !== null && isDashboardEmpty(overview);
  });

  private readonly requestKey = computed(() => ({
    processId: this.scope().processId,
    processStepId: this.scope().processStepId,
    token: this.reloadToken()
  }));

  constructor() {
    toObservable(this.requestKey)
      .pipe(
        switchMap(key => {
          this.isLoading.set(true);
          this.errorMessage.set(null);

          return this.dashboardService
            .getOverview({
              processId: key.processId,
              processStepId: key.processStepId
            })
            .pipe(
              catchError((error: unknown) => {
                this.errorMessage.set(
                  error instanceof HttpErrorResponse
                    ? resolveDashboardApiError(error)
                    : 'Unable to load P-FMEA dashboard.'
                );
                this.overview.set(null);
                return of(null);
              }),
              finalize(() => this.isLoading.set(false))
            );
        }),
        takeUntilDestroyed()
      )
      .subscribe(overview => {
        if (overview) {
          this.overview.set(overview);
        }
      });

    toObservable(this.processId)
      .pipe(
        switchMap(processId => {
          if (!processId) {
            return of<ProcessStep[]>([]);
          }

          return this.processStepService.getStepsByProcess(processId).pipe(
            catchError(() => of<ProcessStep[]>([]))
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe(steps => this.steps.set(steps));

    this.loadProcesses();
  }

  onProcessChange(processId: string | null): void {
    this.steps.set([]);
    this.scope.set({ processId, processStepId: null });
  }

  onProcessStepChange(processStepId: string | null): void {
    this.scope.update(current => ({
      processId: current.processId,
      processStepId
    }));
  }

  retry(): void {
    this.loadProcesses();
    this.reloadToken.update(token => token + 1);
  }

  private loadProcesses(): void {
    this.filterError.set(null);

    this.processService
      .getProcesses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: processes => this.processes.set(processes),
        error: () => this.filterError.set('Unable to load processes for filtering.')
      });
  }
}
