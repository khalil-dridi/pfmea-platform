import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-history-skeleton',
  templateUrl: './history-skeleton.html',
  styleUrl: './history-skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorySkeleton {}
