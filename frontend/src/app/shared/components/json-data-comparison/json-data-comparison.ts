import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  buildJsonComparisonRows,
  formatJsonFallback,
  isEmptyJsonObject,
  parseJsonObject
} from '../../utils/json-data.utils';

@Component({
  selector: 'app-json-data-comparison',
  templateUrl: './json-data-comparison.html',
  styleUrl: './json-data-comparison.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JsonDataComparison {
  readonly oldData = input<string | null>(null);
  readonly newData = input<string | null>(null);
  readonly previousTitle = input('Previous Data');
  readonly newTitle = input('New Data');
  readonly previousColumn = input('Previous');
  readonly newColumn = input('New');

  readonly rows = computed(() => buildJsonComparisonRows(this.oldData(), this.newData()));

  readonly hasPreviousData = computed(() => !isEmptyJsonObject(parseJsonObject(this.oldData())));

  readonly previousFallback = computed(() => formatJsonFallback(this.oldData()));
  readonly newFallback = computed(() => formatJsonFallback(this.newData()));
}
