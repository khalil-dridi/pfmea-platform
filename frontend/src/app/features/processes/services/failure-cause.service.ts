import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { FailureCauseCreateRequest } from '../models/failure-cause-create-request.model';
import { FailureCauseUpdateRequest } from '../models/failure-cause-update-request.model';
import { FailureCause } from '../models/failure-cause.model';
import { FailureMutationResult } from '../models/failure-mutation-result.model';
import { isFailureCause, mutateFailureEntity } from '../utils/failure-analysis.utils';

@Injectable({
  providedIn: 'root'
})
export class FailureCauseService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/failure-causes`;

  getFailureCausesByFailureMode(failureModeId: string): Observable<FailureCause[]> {
    return this.http.get<FailureCause[]>(`${this.baseUrl}/failure-mode/${failureModeId}`);
  }

  createFailureCause(request: FailureCauseCreateRequest): Observable<FailureMutationResult<FailureCause>> {
    return this.mutate('POST', this.baseUrl, request);
  }

  updateFailureCause(
    id: string,
    request: FailureCauseUpdateRequest
  ): Observable<FailureMutationResult<FailureCause>> {
    return this.mutate('PUT', `${this.baseUrl}/${id}`, request);
  }

  private mutate(
    method: 'POST' | 'PUT',
    url: string,
    body: FailureCauseCreateRequest | FailureCauseUpdateRequest
  ): Observable<FailureMutationResult<FailureCause>> {
    const treatAsPending = this.authService.hasRole('ADMIN') && !this.authService.hasRole('SUPER_ADMIN');
    return mutateFailureEntity(this.http, method, url, body, treatAsPending, isFailureCause);
  }
}
