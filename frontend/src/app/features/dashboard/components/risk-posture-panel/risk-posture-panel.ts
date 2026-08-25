import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RiskDistribution } from '../../models/dashboard-overview.model';
import {
  buildDonutSegments,
  distributionTotal,
  DONUT_RADIUS_PX,
  RiskBand
} from '../../utils/dashboard.utils';
import { AnimatedMetric } from '../animated-metric/animated-metric';

@Component({
  selector: 'app-risk-posture-panel',
  imports: [AnimatedMetric],
  templateUrl: './risk-posture-panel.html',
  styleUrl: './risk-posture-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RiskPosturePanel {
  readonly distribution = input<RiskDistribution | null>(null);
  readonly loading = input(false);
  readonly refreshing = input<boolean>(false);

  readonly radius = DONUT_RADIUS_PX;
  readonly highlighted = signal<RiskBand | null>(null);

  readonly total = computed(() => {
    const distribution = this.distribution();
    return distribution ? distributionTotal(distribution) : 0;
  });

  readonly segments = computed(() => {
    const distribution = this.distribution();
    return distribution ? buildDonutSegments(distribution) : [];
  });

  readonly undefinedCount = computed(() => this.distribution()?.notDefined ?? 0);

  highlight(band: RiskBand | null): void {
    this.highlighted.set(band);
  }
}
