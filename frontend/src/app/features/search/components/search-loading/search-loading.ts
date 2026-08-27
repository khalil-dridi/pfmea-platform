import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-search-loading',
  templateUrl: './search-loading.html',
  styleUrl: './search-loading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchLoading {}
