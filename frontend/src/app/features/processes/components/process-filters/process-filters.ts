import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ProcessSort, ProcessViewMode } from '../../models/process-list.model';

@Component({
  selector: 'app-process-filters',
  templateUrl: './process-filters.html',
  styleUrl: './process-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessFilters {
  readonly query = input.required<string>();
  readonly sort = input.required<ProcessSort>();
  readonly viewMode = input.required<ProcessViewMode>();
  readonly disabled = input(false);

  readonly queryChange = output<string>();
  readonly sortChange = output<ProcessSort>();
  readonly viewModeChange = output<ProcessViewMode>();
  readonly cleared = output<void>();

  readonly canClear = computed(() => this.query().length > 0);

  onQueryInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.queryChange.emit(target.value);
    }
  }

  onSortChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    const value = target.value;

    if (
      value === 'updated' ||
      value === 'created' ||
      value === 'name-asc' ||
      value === 'name-desc'
    ) {
      this.sortChange.emit(value);
    }
  }
}
