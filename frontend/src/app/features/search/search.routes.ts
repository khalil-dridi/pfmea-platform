import { Routes } from '@angular/router';
import { SearchPage } from './pages/search/search';

export const SEARCH_ROUTES: Routes = [
  {
    path: '',
    component: SearchPage,
    data: { title: 'Global Search' }
  }
];
