import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { FailureMutationResult } from '../models/failure-mutation-result.model';
import { OptimizationCreateRequest } from '../models/optimization-create-request.model';
import { OptimizationUpdateRequest } from '../models/optimization-update-request.model';
import { Optimization } from '../models/optimization.model';
import { mutateFailureEntity } from '../utils/failure-analysis.utils';
import { isOptimization } from '../utils/optimization.utils';

@Injectable({
  providedIn: 'root'
})
export class OptimizationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/optimizations`;

  getOptimizationByRiskAnalysis(riskAnalysisId: string): Observable<Optimization | null> {
    return this.http.get<Optimization>(`${this.baseUrl}/risk-analysis/${riskAnalysisId}`).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of(null);
        }

        return throwError(() => error);
      })
    );
  }

  createOptimization(request: OptimizationCreateRequest): Observable<FailureMutationResult<Optimization>> {
    return this.mutate('POST', this.baseUrl, request);
  }

  updateOptimization(
    id: string,
    request: OptimizationUpdateRequest
  ): Observable<FailureMutationResult<Optimization>> {
    return this.mutate('PUT', `${this.baseUrl}/${id}`, request);
  }

  private mutate(
    method: 'POST' | 'PUT',
    url: string,
    body: OptimizationCreateRequest | OptimizationUpdateRequest
  ): Observable<FailureMutationResult<Optimization>> {
    const treatAsPending = this.authService.hasRole('ADMIN') && !this.authService.hasRole('SUPER_ADMIN');
    return mutateFailureEntity(this.http, method, url, body, treatAsPending, isOptimization);
  }
}
