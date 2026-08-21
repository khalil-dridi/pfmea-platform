import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChangeRequest } from '../../models/change-request.model';
import {
  buildComparisonRows,
  formatJsonFallback,
  isEmptyJsonObject,
  parseChangeRequestData
} from '../../utils/change-request.utils';

@Component({
  selector: 'app-data-comparison',
  templateUrl: './data-comparison.html',
  styleUrl: './data-comparison.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataComparison {
  readonly request = input.required<ChangeRequest>();

  readonly rows = computed(() => buildComparisonRows(this.request()));

  readonly hasPreviousData = computed(() => {
    return !isEmptyJsonObject(parseChangeRequestData(this.request().oldData));
  });

  readonly previousFallback = computed(() => formatJsonFallback(this.request().oldData));
  readonly proposedFallback = computed(() => formatJsonFallback(this.request().newData));
}
