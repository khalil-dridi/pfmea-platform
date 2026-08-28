import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-process-empty-state',
  imports: [RouterLink],
  templateUrl: './process-empty-state.html',
  styleUrl: './process-empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessEmptyState {
  readonly filtered = input(false);

  readonly clearSearch = output<void>();
}
