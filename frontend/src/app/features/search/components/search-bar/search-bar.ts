import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBar {
  readonly query = input.required<string>();
  readonly loading = input(false);

  readonly queryChange = output<string>();
  readonly submitted = output<void>();

  readonly canSearch = computed(() => this.query().trim().length > 0 && !this.loading());
  readonly canClear = computed(() => this.query().length > 0 && !this.loading());

  onInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.queryChange.emit(target.value);
    }
  }

  clear(): void {
    this.queryChange.emit('');
  }

  submit(): void {
    if (this.canSearch()) {
      this.submitted.emit();
    }
  }
}
