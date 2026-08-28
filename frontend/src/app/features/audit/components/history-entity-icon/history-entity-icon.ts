import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-history-entity-icon',
  templateUrl: './history-entity-icon.html',
  styleUrl: './history-entity-icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryEntityIcon {
  readonly kind = input('GENERIC');
  readonly accent = input(0);
}
