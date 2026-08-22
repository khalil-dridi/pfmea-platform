import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { JsonDataComparison } from '../../../../shared/components/json-data-comparison/json-data-comparison';
import { ChangeRequest } from '../../models/change-request.model';

@Component({
  selector: 'app-data-comparison',
  imports: [JsonDataComparison],
  template: `
    <app-json-data-comparison
      [oldData]="request().oldData"
      [newData]="request().newData"
      [previousTitle]="isCreate() ? 'Previous Data' : 'Previous'"
      [newTitle]="isCreate() ? 'New Data' : 'Proposed'"
      previousColumn="Previous"
      newColumn="Proposed"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataComparison {
  readonly request = input.required<ChangeRequest>();

  readonly isCreate = computed(() => this.request().operation === 'CREATE');
}
