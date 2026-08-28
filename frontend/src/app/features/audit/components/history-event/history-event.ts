import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HistoryEventView } from '../../models/audit-history.model';
import { HistoryEntityIcon } from '../history-entity-icon/history-entity-icon';

@Component({
  selector: 'app-history-event',
  imports: [HistoryEntityIcon],
  templateUrl: './history-event.html',
  styleUrl: './history-event.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryEvent {
  readonly item = input.required<HistoryEventView>();
  readonly index = input(0);
  readonly selected = input(false);
  readonly viewDetails = output<void>();

  onActivate(): void {
    this.viewDetails.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.viewDetails.emit();
    }
  }
}
