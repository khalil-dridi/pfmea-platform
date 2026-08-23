import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { FailureEffectCreateRequest } from '../models/failure-effect-create-request.model';
import { FailureEffectUpdateRequest } from '../models/failure-effect-update-request.model';
import { FailureEffect } from '../models/failure-effect.model';
import { FailureMutationResult } from '../models/failure-mutation-result.model';
import { isFailureEffect, mutateFailureEntity } from '../utils/failure-analysis.utils';

@Injectable({
  providedIn: 'root'
})
export class FailureEffectService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/failure-effects`;

  getFailureEffectByFailureMode(failureModeId: string): Observable<FailureEffect | null> {
    return this.http.get<FailureEffect>(`${this.baseUrl}/failure-mode/${failureModeId}`).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of(null);
        }

        return throwError(() => error);
      })
    );
  }

  createFailureEffect(request: FailureEffectCreateRequest): Observable<FailureMutationResult<FailureEffect>> {
    return this.mutate('POST', this.baseUrl, request);
  }

  updateFailureEffect(
    id: string,
    request: FailureEffectUpdateRequest
  ): Observable<FailureMutationResult<FailureEffect>> {
    return this.mutate('PUT', `${this.baseUrl}/${id}`, request);
  }

  private mutate(
    method: 'POST' | 'PUT',
    url: string,
    body: FailureEffectCreateRequest | FailureEffectUpdateRequest
  ): Observable<FailureMutationResult<FailureEffect>> {
    const treatAsPending = this.authService.hasRole('ADMIN') && !this.authService.hasRole('SUPER_ADMIN');
    return mutateFailureEntity(this.http, method, url, body, treatAsPending, isFailureEffect);
  }
}
