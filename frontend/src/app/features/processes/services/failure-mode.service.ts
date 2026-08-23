import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { FailureModeCreateRequest } from '../models/failure-mode-create-request.model';
import { FailureModeUpdateRequest } from '../models/failure-mode-update-request.model';
import { FailureMode } from '../models/failure-mode.model';
import { FailureMutationResult } from '../models/failure-mutation-result.model';
import { isFailureMode, mutateFailureEntity } from '../utils/failure-analysis.utils';

@Injectable({
  providedIn: 'root'
})
export class FailureModeService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/failure-modes`;

  getFailureModesByProcessStep(processStepId: string): Observable<FailureMode[]> {
    return this.http.get<FailureMode[]>(`${this.baseUrl}/process-step/${processStepId}`);
  }

  createFailureMode(request: FailureModeCreateRequest): Observable<FailureMutationResult<FailureMode>> {
    return this.mutate('POST', this.baseUrl, request);
  }

  updateFailureMode(
    id: string,
    request: FailureModeUpdateRequest
  ): Observable<FailureMutationResult<FailureMode>> {
    return this.mutate('PUT', `${this.baseUrl}/${id}`, request);
  }

  private mutate(
    method: 'POST' | 'PUT',
    url: string,
    body: FailureModeCreateRequest | FailureModeUpdateRequest
  ): Observable<FailureMutationResult<FailureMode>> {
    const treatAsPending = this.authService.hasRole('ADMIN') && !this.authService.hasRole('SUPER_ADMIN');
    return mutateFailureEntity(this.http, method, url, body, treatAsPending, isFailureMode);
  }
}
