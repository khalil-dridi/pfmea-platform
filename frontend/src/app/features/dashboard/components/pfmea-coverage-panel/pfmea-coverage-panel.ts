import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PfmeaCoverage } from '../../models/dashboard-overview.model';
import { AnimatedMetric } from '../animated-metric/animated-metric';

type CoverageKey = keyof PfmeaCoverage;

interface CoverageItem {
  key: CoverageKey;
  label: string;
  value: number;
}

@Component({
  selector: 'app-pfmea-coverage-panel',
  imports: [AnimatedMetric],
  templateUrl: './pfmea-coverage-panel.html',
  styleUrl: './pfmea-coverage-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PfmeaCoveragePanel {
  readonly coverage = input<PfmeaCoverage | null>(null);
  readonly loading = input(false);
  readonly refreshing = input<boolean>(false);

  readonly items = computed<CoverageItem[]>(() => {
    const coverage = this.coverage();

    if (!coverage) {
      return [];
    }

    return [
      { key: 'processes', label: 'Processes', value: coverage.processes },
      { key: 'processSteps', label: 'Process Steps', value: coverage.processSteps },
      { key: 'workElements', label: 'Work Elements', value: coverage.workElements },
      { key: 'functions', label: 'Functions', value: coverage.functions },
      { key: 'failureModes', label: 'Failure Modes', value: coverage.failureModes },
      { key: 'failureCauses', label: 'Failure Causes', value: coverage.failureCauses }
    ];
  });
}
