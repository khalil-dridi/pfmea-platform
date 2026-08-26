import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Process } from '../../../processes/models/process.model';
import { ProcessStep } from '../../../processes/models/process-step.model';

@Component({
  selector: 'app-analysis-scope-panel',
  templateUrl: './analysis-scope-panel.html',
  styleUrl: './analysis-scope-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalysisScopePanel {
  readonly processes = input.required<readonly Process[]>();
  readonly steps = input.required<readonly ProcessStep[]>();
  readonly processId = input<string | null>(null);
  readonly processStepId = input<string | null>(null);
  readonly loadingProcesses = input(false);
  readonly loadingSteps = input(false);
  readonly starting = input(false);
  readonly startError = input<string | null>(null);
  readonly processLoadError = input<string | null>(null);

  readonly processChange = output<string | null>();
  readonly processStepChange = output<string | null>();
  readonly start = output<void>();
  readonly retry = output<void>();

  readonly canStart = computed(
    () =>
      this.processId() !== null &&
      this.processStepId() !== null &&
      !this.starting() &&
      !this.loadingSteps() &&
      !this.loadingProcesses()
  );

  readonly controlsDisabled = computed(
    () => this.starting() || this.loadingProcesses()
  );

  readonly stepDisabled = computed(
    () => this.controlsDisabled() || this.processId() === null || this.loadingSteps()
  );

  readonly helperText = computed(() => {
    if (this.processId() === null) {
      return 'Select a Process to begin.';
    }

    if (this.processStepId() === null) {
      return 'Select a Process Step to continue.';
    }

    return 'Your P-FMEA assistant is ready.';
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
