import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { formatCount, formatCoveragePercent } from '../../utils/dashboard.utils';
import { MOTION, tweenNumber } from '../../utils/dashboard-motion';

@Component({
  selector: 'app-animated-metric',
  template: `{{ text() }}`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display:inline;font-variant-numeric:tabular-nums'
  }
})
export class AnimatedMetric {
  readonly value = input.required<number>();
  readonly kind = input<'count' | 'percent'>('count');

  readonly text = signal('0');

  private displayed = 0;

  constructor() {
    effect(onCleanup => {
      const target = this.value();
      const kind = this.kind();
      const from = this.displayed;
      const cancel = tweenNumber(from, target, MOTION.value, next => {
        this.displayed = next;
        this.text.set(kind === 'percent' ? formatCoveragePercent(next) : formatCount(Math.round(next)));
      });

      onCleanup(cancel);
    });
  }
}
