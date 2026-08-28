import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-history-empty-state',
  templateUrl: './history-empty-state.html',
  styleUrl: './history-empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryEmptyState {
  readonly filtered = input(false);
  readonly clearFilters = output<void>();
}
