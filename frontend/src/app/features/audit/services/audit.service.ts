import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuditLog } from '../models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/audit-logs`;

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
}
