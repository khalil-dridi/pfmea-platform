import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { JsonDataComparison } from '../../../../shared/components/json-data-comparison/json-data-comparison';
import { ChangeRequest } from '../../models/change-request.model';

@Component({
  selector: 'app-data-comparison',
  imports: [JsonDataComparison],
  template: `
    <app-json-data-comparison
      [oldData]="request().oldData"
      [newData]="request().newData"
      previousTitle="Previous Data"
      newTitle="Proposed Changes"
      previousColumn="Previous"
      newColumn="Proposed"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataComparison {
  readonly request = input.required<ChangeRequest>();
}
