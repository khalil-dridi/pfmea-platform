import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchResult } from '../../models/search-result.model';
import {
  entityTypeLabel,
  formatPriority,
  formatStatus,
  highlightParts,
  viewRouteForResult
} from '../../utils/search.utils';

@Component({
  selector: 'app-search-result-item',
  imports: [RouterLink],
  templateUrl: './search-result-item.html',
  styleUrl: './search-result-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchResultItem {
  readonly result = input.required<SearchResult>();
  readonly query = input('');
  readonly layout = input<'list' | 'grid'>('list');
  readonly index = input(0);

  readonly label = computed(() => entityTypeLabel(this.result().entityType));
  readonly viewRoute = computed(() => viewRouteForResult(this.result()));
  readonly titleParts = computed(() => highlightParts(this.result().title, this.query()));
  readonly descriptionParts = computed(() => {
    const description = this.result().description;
    return description ? highlightParts(description, this.query()) : [];
  });
  readonly statusLabel = computed(() => {
    const status = this.result().status;
    return status ? formatStatus(status) : null;
  });
  readonly priorityLabel = computed(() => {
    const priority = this.result().actionPriority;
    return priority ? formatPriority(priority) : null;
  });
  readonly contextLine = computed(() => {
    const result = this.result();
    const processName = result.processName?.trim() ?? '';
    const stepName = result.processStepName?.trim() ?? '';

    if (!processName && !stepName) {
      return null;
    }

    if (processName && stepName) {
      return { processName, stepName };
    }

    return { processName: processName || null, stepName: stepName || null };
  });
}
