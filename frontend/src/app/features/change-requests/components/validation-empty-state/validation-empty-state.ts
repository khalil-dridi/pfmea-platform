import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-validation-empty-state',
  templateUrl: './validation-empty-state.html',
  styleUrl: './validation-empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationEmptyState {
  readonly filtered = input(false);

  readonly clearFilters = output<void>();
}
