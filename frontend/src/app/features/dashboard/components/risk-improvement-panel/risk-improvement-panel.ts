import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RiskImprovement } from '../../models/dashboard-overview.model';
import { buildImprovementRows, distributionTotal } from '../../utils/dashboard.utils';
import { AnimatedMetric } from '../animated-metric/animated-metric';

@Component({
  selector: 'app-risk-improvement-panel',
  imports: [AnimatedMetric],
  templateUrl: './risk-improvement-panel.html',
  styleUrl: './risk-improvement-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RiskImprovementPanel {
  readonly improvement = input<RiskImprovement | null>(null);
  readonly loading = input(false);
  readonly refreshing = input<boolean>(false);

  readonly rows = computed(() => {
    const improvement = this.improvement();
    return improvement ? buildImprovementRows(improvement) : [];
  });

  readonly isEmpty = computed(() => {
    const improvement = this.improvement();

    if (!improvement) {
      return false;
    }

    return distributionTotal(improvement.current) === 0 && distributionTotal(improvement.optimized) === 0;
  });
}
