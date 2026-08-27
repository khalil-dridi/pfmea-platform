import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SearchResult } from '../../models/search-result.model';
import { SearchPagination } from '../search-pagination/search-pagination';
import { SearchResultGrid } from '../search-result-grid/search-result-grid';
import { SearchResultItem } from '../search-result-item/search-result-item';

export type SearchViewMode = 'list' | 'grid';

@Component({
  selector: 'app-search-results',
  imports: [SearchPagination, SearchResultGrid, SearchResultItem],
  templateUrl: './search-results.html',
  styleUrl: './search-results.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchResults {
  readonly results = input.required<readonly SearchResult[]>();
  readonly query = input('');
  readonly totalElements = input(0);
  readonly totalPages = input(0);
  readonly page = input(0);
  readonly size = input(20);
  readonly viewMode = input<SearchViewMode>('list');
  readonly loading = input(false);

  readonly viewModeChange = output<SearchViewMode>();
  readonly pageChange = output<number>();
  readonly sizeChange = output<number>();

  readonly resultLabel = computed(() =>
    this.totalElements() === 1 ? 'result found' : 'results found'
  );
}
