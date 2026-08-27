import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-search-scope',
  templateUrl: './search-scope.html',
  styleUrl: './search-scope.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchScope {
  readonly processName = input<string | null>(null);
  readonly processStepName = input<string | null>(null);
  readonly canClear = input(false);
  readonly disabled = input(false);

  readonly clear = output<void>();
}
