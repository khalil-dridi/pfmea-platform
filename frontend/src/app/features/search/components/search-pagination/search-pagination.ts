import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DEFAULT_SEARCH_PAGE_SIZE, paginationRange, SEARCH_PAGE_SIZES } from '../../utils/search.utils';

@Component({
  selector: 'app-search-pagination',
  templateUrl: './search-pagination.html',
  styleUrl: './search-pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPagination {
  readonly pageSizes = SEARCH_PAGE_SIZES;
  readonly page = input(0);
  readonly size = input(DEFAULT_SEARCH_PAGE_SIZE);
  readonly totalElements = input(0);
  readonly totalPages = input(0);
  readonly disabled = input(false);

  readonly pageChange = output<number>();
  readonly sizeChange = output<number>();

  readonly tokens = computed(() => paginationRange(this.page(), this.totalPages()));
  readonly canPrev = computed(() => this.page() > 0);
  readonly canNext = computed(() => this.page() + 1 < this.totalPages());
  readonly from = computed(() => {
    if (this.totalElements() === 0) {
      return 0;
    }

    return this.page() * this.size() + 1;
  });
  readonly to = computed(() => Math.min((this.page() + 1) * this.size(), this.totalElements()));

  onSizeChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.sizeChange.emit(Number(target.value));
    }
  }
}
