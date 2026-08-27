import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-search-header',
  templateUrl: './search-header.html',
  styleUrl: './search-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchHeader {}
