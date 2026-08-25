import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { OptimizationActions } from '../../models/dashboard-overview.model';
import { actionCompletionRate, barWidth } from '../../utils/dashboard.utils';
import { AnimatedMetric } from '../animated-metric/animated-metric';

@Component({
  selector: 'app-optimization-execution-panel',
  imports: [AnimatedMetric],
  templateUrl: './optimization-execution-panel.html',
  styleUrl: './optimization-execution-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizationExecutionPanel {
  readonly actions = input<OptimizationActions | null>(null);
  readonly loading = input(false);
  readonly refreshing = input<boolean>(false);

  readonly isEmpty = computed(() => {
    const actions = this.actions();
    return actions !== null && actions.total === 0;
  });

  readonly completionRate = computed(() => {
    const actions = this.actions();
    return actions ? actionCompletionRate(actions) : null;
  });

  readonly completionWidth = computed(() => {
    const actions = this.actions();
    return actions ? barWidth(actions.closed, actions.total) : 0;
  });

  readonly total = computed(() => this.actions()?.total ?? 0);
  readonly inApplication = computed(() => this.actions()?.inApplication ?? 0);
  readonly closed = computed(() => this.actions()?.closed ?? 0);
}
