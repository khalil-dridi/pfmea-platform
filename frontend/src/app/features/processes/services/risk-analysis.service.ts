import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { FailureMutationResult } from '../models/failure-mutation-result.model';
import { RiskAnalysisCreateRequest } from '../models/risk-analysis-create-request.model';
import { RiskAnalysisUpdateRequest } from '../models/risk-analysis-update-request.model';
import { RiskAnalysis } from '../models/risk-analysis.model';
import { mutateFailureEntity } from '../utils/failure-analysis.utils';
import { isRiskAnalysis } from '../utils/risk-analysis.utils';

@Injectable({
  providedIn: 'root'
})
export class RiskAnalysisService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/risk-analyses`;

  getRiskAnalysisByFailureCause(failureCauseId: string): Observable<RiskAnalysis | null> {
    return this.http.get<RiskAnalysis>(`${this.baseUrl}/failure-cause/${failureCauseId}`).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of(null);
        }

        return throwError(() => error);
      })
    );
  }

  createRiskAnalysis(request: RiskAnalysisCreateRequest): Observable<FailureMutationResult<RiskAnalysis>> {
    return this.mutate('POST', this.baseUrl, request);
  }

  updateRiskAnalysis(
    id: string,
    request: RiskAnalysisUpdateRequest
  ): Observable<FailureMutationResult<RiskAnalysis>> {
    return this.mutate('PUT', `${this.baseUrl}/${id}`, request);
  }

  private mutate(
    method: 'POST' | 'PUT',
    url: string,
    body: RiskAnalysisCreateRequest | RiskAnalysisUpdateRequest
  ): Observable<FailureMutationResult<RiskAnalysis>> {
    const treatAsPending = this.authService.hasRole('ADMIN') && !this.authService.hasRole('SUPER_ADMIN');
    return mutateFailureEntity(this.http, method, url, body, treatAsPending, isRiskAnalysis);
  }
}
