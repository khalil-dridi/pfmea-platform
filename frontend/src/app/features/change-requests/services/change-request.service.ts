import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../core/models/page-response.model';
import { ChangeRequest, MyRequestsQuery } from '../models/change-request.model';
import {
  readChangeRequestPage,
  toApiDateTimeEnd,
  toApiDateTimeStart
} from '../utils/change-request.utils';

@Injectable({
  providedIn: 'root'
})
export class ChangeRequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/change-requests`;

  getMyRequests(query: MyRequestsQuery): Observable<PageResponse<ChangeRequest>> {
    return this.http
      .get<unknown>(`${this.baseUrl}/my-requests`, {
        params: this.buildMyRequestsParams(query)
      })
      .pipe(map(payload => readChangeRequestPage(payload)));
  }

  getPendingRequests(): Observable<ChangeRequest[]> {
    return this.http.get<ChangeRequest[]>(`${this.baseUrl}/pending`);
  }

  getRequestById(id: string): Observable<ChangeRequest> {
    return this.http.get<ChangeRequest>(`${this.baseUrl}/${id}`);
  }

  approveRequest(id: string, reviewComment?: string): Observable<ChangeRequest> {
    return this.http.post<ChangeRequest>(`${this.baseUrl}/${id}/approve`, {}, {
      params: this.toReviewParams(reviewComment)
    });
  }

  rejectRequest(id: string, reviewComment?: string): Observable<ChangeRequest> {
    return this.http.post<ChangeRequest>(`${this.baseUrl}/${id}/reject`, {}, {
      params: this.toReviewParams(reviewComment)
    });
  }

  private buildMyRequestsParams(query: MyRequestsQuery): HttpParams {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('size', String(query.size));

    const search = query.search?.trim();
    const from = toApiDateTimeStart(query.from);
    const to = toApiDateTimeEnd(query.to);

    if (search) {
      params = params.set('search', search);
    }

    if (query.operation) {
      params = params.set('operation', query.operation);
    }

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (from) {
      params = params.set('from', from);
    }

    if (to) {
      params = params.set('to', to);
    }

    return params;
  }

  private toReviewParams(reviewComment?: string): HttpParams {
    const comment = reviewComment?.trim() ?? '';

    if (comment.length === 0) {
      return new HttpParams();
    }

    return new HttpParams().set('reviewComment', comment);
  }
}
