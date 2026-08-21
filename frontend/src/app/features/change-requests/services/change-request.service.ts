import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ChangeRequest } from '../models/change-request.model';

@Injectable({
  providedIn: 'root'
})
export class ChangeRequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/change-requests`;

  getMyRequests(): Observable<ChangeRequest[]> {
    return this.http.get<ChangeRequest[]>(`${this.baseUrl}/my-requests`);
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

  private toReviewParams(reviewComment?: string): HttpParams {
    const comment = reviewComment?.trim() ?? '';

    if (comment.length === 0) {
      return new HttpParams();
    }

    return new HttpParams().set('reviewComment', comment);
  }
}
