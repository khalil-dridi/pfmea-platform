import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { FailureMutationResult } from '../models/failure-mutation-result.model';
import { OptimizationActionCreateRequest } from '../models/optimization-action-create-request.model';
import { OptimizationActionUpdateRequest } from '../models/optimization-action-update-request.model';
import { OptimizationAction } from '../models/optimization-action.model';
import { mutateFailureEntity } from '../utils/failure-analysis.utils';
import { isOptimizationAction } from '../utils/optimization.utils';

@Injectable({
  providedIn: 'root'
})
export class OptimizationActionService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/optimization-actions`;

  getActionsByOptimization(optimizationId: string): Observable<OptimizationAction[]> {
    return this.http.get<OptimizationAction[]>(`${this.baseUrl}/optimization/${optimizationId}`);
  }

  createAction(request: OptimizationActionCreateRequest): Observable<FailureMutationResult<OptimizationAction>> {
    return this.mutate('POST', this.baseUrl, request);
  }

  updateAction(
    id: string,
    request: OptimizationActionUpdateRequest
  ): Observable<FailureMutationResult<OptimizationAction>> {
    return this.mutate('PUT', `${this.baseUrl}/${id}`, request);
  }

  private mutate(
    method: 'POST' | 'PUT',
    url: string,
    body: OptimizationActionCreateRequest | OptimizationActionUpdateRequest
  ): Observable<FailureMutationResult<OptimizationAction>> {
    const treatAsPending = this.authService.hasRole('ADMIN') && !this.authService.hasRole('SUPER_ADMIN');
    return mutateFailureEntity(this.http, method, url, body, treatAsPending, isOptimizationAction);
  }
}
