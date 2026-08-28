import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProcessViewMode } from '../../models/process-list.model';

@Component({
  selector: 'app-process-skeleton',
  templateUrl: './process-skeleton.html',
  styleUrl: './process-skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessSkeleton {
  readonly layout = input<ProcessViewMode>('grid');
  readonly placeholders = [0, 1, 2, 3, 4, 5];
}
