import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardFilter, DashboardOverview } from '../models/dashboard-overview.model';
import { isDashboardOverview } from '../utils/dashboard.utils';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly overviewUrl = `${environment.apiUrl}/dashboard/overview`;

  getOverview(filter: DashboardFilter): Observable<DashboardOverview> {
    let params = new HttpParams();

    if (filter.processId) {
      params = params.set('processId', filter.processId);
    }

    if (filter.processId && filter.processStepId) {
      params = params.set('processStepId', filter.processStepId);
    }

    return this.http.get<unknown>(this.overviewUrl, { params }).pipe(
      map(payload => {
        if (!isDashboardOverview(payload)) {
          throw new Error('INVALID_DASHBOARD_PAYLOAD');
        }

        return payload;
      })
    );
  }
}
