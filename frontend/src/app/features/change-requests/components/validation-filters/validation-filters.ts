import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  ValidationOperationFilter,
  ValidationSort,
  ValidationStatusFilter
} from '../../models/validation-list.model';

@Component({
  selector: 'app-validation-filters',
  templateUrl: './validation-filters.html',
  styleUrl: './validation-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationFilters {
  readonly query = input.required<string>();
  readonly status = input.required<ValidationStatusFilter>();
  readonly operation = input.required<ValidationOperationFilter>();
  readonly sort = input.required<ValidationSort>();
  readonly disabled = input(false);

  readonly queryChange = output<string>();
  readonly statusChange = output<ValidationStatusFilter>();
  readonly operationChange = output<ValidationOperationFilter>();
  readonly sortChange = output<ValidationSort>();
  readonly cleared = output<void>();

  readonly canClear = computed(
    () =>
      this.query().length > 0 ||
      this.status() !== 'ALL' ||
      this.operation() !== 'ALL' ||
      this.sort() !== 'newest'
  );

  onQueryInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.queryChange.emit(target.value);
    }
  }

  onStatusChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    const value = target.value;

    if (value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED') {
      this.statusChange.emit(value);
      return;
    }

    this.statusChange.emit('ALL');
  }

  onOperationChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    this.operationChange.emit(target.value === 'CREATE' || target.value === 'UPDATE' ? target.value : 'ALL');
  }

  onSortChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    this.sortChange.emit(target.value === 'oldest' ? 'oldest' : 'newest');
  }

  focusStatus(): void {
    document.getElementById('validation-status')?.focus();
  }
}
