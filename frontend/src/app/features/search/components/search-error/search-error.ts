import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-search-error',
  templateUrl: './search-error.html',
  styleUrl: './search-error.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchError {
  readonly message = input('Unable to complete the search.');
  readonly disabled = input(false);

  readonly retry = output<void>();
}
