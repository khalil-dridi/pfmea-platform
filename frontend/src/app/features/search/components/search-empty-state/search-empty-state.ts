import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-search-empty-state',
  templateUrl: './search-empty-state.html',
  styleUrl: './search-empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchEmptyState {
  readonly kind = input<'idle' | 'none'>('idle');

  readonly clearFilters = output<void>();
}
