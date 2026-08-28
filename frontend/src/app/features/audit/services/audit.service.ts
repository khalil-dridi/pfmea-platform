import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AuditHistoryFilters,
  AuditHistoryPage,
  AuditHistoryQuery,
  AuditStatistics
} from '../models/audit-history.model';
import { AuditLog } from '../models/audit-log.model';
import { toApiDateTimeEnd, toApiDateTimeStart } from '../utils/audit-history.utils';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/audit-logs`;

  getHistory(query: AuditHistoryQuery): Observable<AuditHistoryPage> {
    let params = this.buildFilterParams(query)
      .set('page', String(query.page))
      .set('size', String(query.size));

    return this.http.get<AuditHistoryPage>(`${this.baseUrl}/history`, { params });
  }

  getStatistics(filters: AuditHistoryFilters): Observable<AuditStatistics> {
    const params = this.buildFilterParams(filters);
    return this.http.get<AuditStatistics>(`${this.baseUrl}/statistics`, { params });
  }

  getAuditById(id: string): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.baseUrl}/${id}`);
  }

  getEntityHistory(entityType: string, entityId: string): Observable<AuditLog[]> {
    const params = new HttpParams()
      .set('entityType', entityType)
      .set('entityId', entityId);

    return this.http.get<AuditLog[]>(this.baseUrl, { params });
  }

  getUserHistory(userId: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.baseUrl}/user/${userId.trim()}`);
  }

  private buildFilterParams(filters: AuditHistoryFilters): HttpParams {
    let params = new HttpParams();
    const search = filters.search?.trim();
    const from = toApiDateTimeStart(filters.from);
    const to = toApiDateTimeEnd(filters.to);

    if (search) {
      params = params.set('search', search);
    }

    if (filters.entityType) {
      params = params.set('entityType', filters.entityType);
    }

    if (filters.action) {
      params = params.set('action', filters.action);
    }

    if (filters.userId) {
      params = params.set('userId', filters.userId);
    }

    if (from) {
      params = params.set('from', from);
    }

    if (to) {
      params = params.set('to', to);
    }

    return params;
  }
}
