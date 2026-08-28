import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChangeRequest } from '../../models/change-request.model';
import { buildReviewComparisonRows, hasReviewPreviousData } from '../../utils/review-comparison';

@Component({
  selector: 'app-data-comparison',
  templateUrl: './data-comparison.html',
  styleUrl: './data-comparison.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataComparison {
  readonly request = input.required<ChangeRequest>();

  readonly hasPreviousData = computed(() => hasReviewPreviousData(this.request().oldData));
  readonly rows = computed(() =>
    buildReviewComparisonRows(this.request().oldData, this.request().newData, this.request().entityType)
  );
}
