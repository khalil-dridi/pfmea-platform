import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-user-empty-state',
  templateUrl: './user-empty-state.html',
  styleUrl: './user-empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserEmptyState {
  readonly filtered = input(false);

  readonly clearFilters = output<void>();
}
