import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { buildReviewComparisonRows, hasReviewPreviousData } from '../../../change-requests/utils/review-comparison';

@Component({
  selector: 'app-history-comparison',
  templateUrl: './history-comparison.html',
  styleUrl: './history-comparison.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryComparison {
  readonly oldData = input<string | null>(null);
  readonly newData = input<string | null>(null);
  readonly entityType = input<string | undefined>(undefined);

  readonly hasPreviousData = computed(() => hasReviewPreviousData(this.oldData()));
  readonly hasNewData = computed(() => hasReviewPreviousData(this.newData()));
  readonly rows = computed(() =>
    buildReviewComparisonRows(this.oldData(), this.newData(), this.entityType())
  );
}
