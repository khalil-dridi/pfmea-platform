import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AreasNeedingAttention } from '../../models/dashboard-overview.model';
import { AnimatedMetric } from '../animated-metric/animated-metric';

interface AttentionItem {
  id: string;
  label: string;
  value: number;
  emphasis: boolean;
}

@Component({
  selector: 'app-engineering-attention-panel',
  imports: [NgTemplateOutlet, RouterLink, AnimatedMetric],
  templateUrl: './engineering-attention-panel.html',
  styleUrl: './engineering-attention-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EngineeringAttentionPanel {
  readonly areas = input<AreasNeedingAttention | null>(null);
  readonly loading = input(false);
  readonly refreshing = input<boolean>(false);
  readonly targetRoute = input<string | null>(null);

  readonly items = computed<AttentionItem[]>(() => {
    const areas = this.areas();

    if (!areas) {
      return [];
    }

    return [
      {
        id: 'causes-without-risk',
        label: 'Failure Causes without Risk Analysis',
        value: areas.failureCausesWithoutRiskAnalysis,
        emphasis: false
      },
      {
        id: 'risk-without-optimization',
        label: 'Risk Analyses without Optimization',
        value: areas.riskAnalysesWithoutOptimization,
        emphasis: false
      },
      {
        id: 'high-priority',
        label: 'High Priority Risks',
        value: areas.highPriorityRisks,
        emphasis: true
      },
      {
        id: 'actions-in-application',
        label: 'Optimization Actions In Application',
        value: areas.optimizationActionsInApplication,
        emphasis: false
      }
    ];
  });
}
