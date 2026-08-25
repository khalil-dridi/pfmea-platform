import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Process } from '../../../processes/models/process.model';
import { ProcessStep } from '../../../processes/models/process-step.model';

@Component({
  selector: 'app-dashboard-scope-filter',
  templateUrl: './dashboard-scope-filter.html',
  styleUrl: './dashboard-scope-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardScopeFilter {
  readonly processes = input.required<readonly Process[]>();
  readonly steps = input.required<readonly ProcessStep[]>();
  readonly processId = input<string | null>(null);
  readonly processStepId = input<string | null>(null);

  readonly processChange = output<string | null>();
  readonly processStepChange = output<string | null>();
  readonly refreshing = input<boolean>(false);

  readonly selectedProcess = computed(() => {
    const processId = this.processId();
    return this.processes().find(process => process.id === processId) ?? null;
  });

  readonly selectedStep = computed(() => {
    const processStepId = this.processStepId();
    return this.steps().find(step => step.id === processStepId) ?? null;
  });

  readonly scopeLine = computed(() => {
    const process = this.selectedProcess();
    const step = this.selectedStep();

    if (!process) {
      return 'All Processes';
    }

    if (!step) {
      return `${process.name} · All Steps`;
    }

    return `${process.name} · Step ${step.stepNumber} · ${step.name}`;
  });

  onProcessChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    this.processChange.emit(target.value.length > 0 ? target.value : null);
  }

  onStepChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    this.processStepChange.emit(target.value.length > 0 ? target.value : null);
  }
}
