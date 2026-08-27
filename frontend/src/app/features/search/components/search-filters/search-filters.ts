import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Process } from '../../../processes/models/process.model';
import { ProcessStep } from '../../../processes/models/process-step.model';
import { SearchEntityType } from '../../models/search-entity-type.model';
import { SEARCH_ENTITY_OPTIONS } from '../../utils/search.utils';

@Component({
  selector: 'app-search-filters',
  templateUrl: './search-filters.html',
  styleUrl: './search-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchFilters {
  readonly entityTypes = SEARCH_ENTITY_OPTIONS;
  readonly processes = input.required<readonly Process[]>();
  readonly steps = input.required<readonly ProcessStep[]>();
  readonly entityType = input<SearchEntityType | null>(null);
  readonly processId = input<string | null>(null);
  readonly processStepId = input<string | null>(null);
  readonly status = input<string | null>(null);
  readonly priority = input<string | null>(null);
  readonly disabled = input(false);

  readonly entityTypeChange = output<SearchEntityType | null>();
  readonly processChange = output<string | null>();
  readonly processStepChange = output<string | null>();
  readonly statusChange = output<string | null>();
  readonly priorityChange = output<string | null>();

  onEntityTypeChange(event: Event): void {
    this.entityTypeChange.emit(this.readSelectValue(event) as SearchEntityType | null);
  }

  onProcessSelect(event: Event): void {
    this.processChange.emit(this.readSelectValue(event));
  }

  onProcessStepSelect(event: Event): void {
    this.processStepChange.emit(this.readSelectValue(event));
  }

  onStatusSelect(event: Event): void {
    this.statusChange.emit(this.readSelectValue(event));
  }

  onPrioritySelect(event: Event): void {
    this.priorityChange.emit(this.readSelectValue(event));
  }

  private readSelectValue(event: Event): string | null {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement) || target.value.length === 0) {
      return null;
    }

    return target.value;
  }
}
