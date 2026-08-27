import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SearchRequest } from '../models/search-request.model';
import { SearchResponse } from '../models/search-response.model';
import { isSearchResponse } from '../utils/search.utils';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/search`;

  search(request: SearchRequest): Observable<SearchResponse> {
    let params = new HttpParams()
      .set('page', String(request.page))
      .set('size', String(request.size));

    const query = request.q?.trim();

    if (query) {
      params = params.set('q', query);
    }

    if (request.entityType) {
      params = params.set('entityType', request.entityType);
    }

    if (request.processId) {
      params = params.set('processId', request.processId);
    }

    if (request.processStepId) {
      params = params.set('processStepId', request.processStepId);
    }

    return this.http.get<unknown>(this.baseUrl, { params }).pipe(
      map(payload => {
        if (!isSearchResponse(payload)) {
          throw new Error('INVALID_SEARCH_PAYLOAD');
        }

        return payload;
      })
    );
  }
}
