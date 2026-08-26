import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Process } from '../../../processes/models/process.model';
import { ProcessStep } from '../../../processes/models/process-step.model';

@Component({
  selector: 'app-current-analysis-panel',
  templateUrl: './current-analysis-panel.html',
  styleUrl: './current-analysis-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CurrentAnalysisPanel {
  readonly processes = input.required<readonly Process[]>();
  readonly steps = input.required<readonly ProcessStep[]>();
  readonly processId = input<string | null>(null);
  readonly processStepId = input<string | null>(null);
  readonly busy = input(false);
  readonly resetting = input(false);
  readonly resetError = input<string | null>(null);

  readonly processChange = output<string | null>();
  readonly processStepChange = output<string | null>();
  readonly newChat = output<void>();
  readonly retryReset = output<void>();

  readonly selectedProcess = computed(() => {
    const processId = this.processId();
    return this.processes().find(process => process.id === processId) ?? null;
  });

  readonly selectedStep = computed(() => {
    const processStepId = this.processStepId();
    return this.steps().find(step => step.id === processStepId) ?? null;
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
