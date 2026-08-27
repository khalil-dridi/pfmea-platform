import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SearchResult } from '../../models/search-result.model';
import { SearchResultItem } from '../search-result-item/search-result-item';

@Component({
  selector: 'app-search-result-grid',
  imports: [SearchResultItem],
  templateUrl: './search-result-grid.html',
  styleUrl: './search-result-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchResultGrid {
  readonly results = input.required<readonly SearchResult[]>();
  readonly query = input('');
}
