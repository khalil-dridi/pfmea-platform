import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { OptimizationCoverage, RiskAnalysisCoverage } from '../../models/dashboard-overview.model';
import {
  clampPercent,
  RING_CIRCUMFERENCE_PX,
  RING_RADIUS_PX,
  ringDashOffset
} from '../../utils/dashboard.utils';
import { AnimatedMetric } from '../animated-metric/animated-metric';

@Component({
  selector: 'app-analysis-completeness-panel',
  imports: [AnimatedMetric],
  templateUrl: './analysis-completeness-panel.html',
  styleUrl: './analysis-completeness-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalysisCompletenessPanel {
  readonly riskCoverage = input<RiskAnalysisCoverage | null>(null);
  readonly optimizationCoverage = input<OptimizationCoverage | null>(null);
  readonly loading = input(false);
  readonly refreshing = input<boolean>(false);

  readonly radius = RING_RADIUS_PX;
  readonly circumference = RING_CIRCUMFERENCE_PX;

  readonly riskPercent = computed(() => this.riskCoverage()?.percentage ?? 0);
  readonly optimizationPercent = computed(() => this.optimizationCoverage()?.percentage ?? 0);
  readonly riskOffset = computed(() => ringDashOffset(this.riskPercent()));
  readonly optimizationOffset = computed(() => ringDashOffset(this.optimizationPercent()));
  readonly riskProgress = computed(() => clampPercent(this.riskPercent()));
  readonly optimizationProgress = computed(() => clampPercent(this.optimizationPercent()));

  readonly riskAnalyzed = computed(() => this.riskCoverage()?.withRiskAnalysis ?? 0);
  readonly riskMissing = computed(() => this.riskCoverage()?.withoutRiskAnalysis ?? 0);
  readonly optimizationDone = computed(() => this.optimizationCoverage()?.withOptimization ?? 0);
  readonly optimizationMissing = computed(() => this.optimizationCoverage()?.withoutOptimization ?? 0);
}
