import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ProcessStepCreateRequest } from '../models/process-step-create-request.model';
import { ProcessStepMutationResult } from '../models/process-step-mutation-result.model';
import { ProcessStepUpdateRequest } from '../models/process-step-update-request.model';
import { ProcessStep } from '../models/process-step.model';
import { toProcessStepMutationResult } from '../utils/process-step.utils';

@Injectable({
  providedIn: 'root'
})
export class ProcessStepService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/process-steps`;

  getStepsByProcess(processId: string): Observable<ProcessStep[]> {
    return this.http.get<ProcessStep[]>(`${this.baseUrl}/process/${processId}`);
  }

  getProcessStepById(id: string): Observable<ProcessStep> {
    return this.http.get<ProcessStep>(`${this.baseUrl}/${id}`);
  }

  createProcessStep(request: ProcessStepCreateRequest): Observable<ProcessStepMutationResult> {
    return this.mutate('POST', this.baseUrl, request);
  }

  updateProcessStep(id: string, request: ProcessStepUpdateRequest): Observable<ProcessStepMutationResult> {
    return this.mutate('PUT', `${this.baseUrl}/${id}`, request);
  }

  private mutate(
    method: 'POST' | 'PUT',
    url: string,
    body: ProcessStepCreateRequest | ProcessStepUpdateRequest
  ): Observable<ProcessStepMutationResult> {
    const treatAsPending = this.authService.hasRole('ADMIN') && !this.authService.hasRole('SUPER_ADMIN');

    return this.http
      .request(method, url, {
        body,
        observe: 'response',
        responseType: 'text'
      })
      .pipe(
        map(response => toProcessStepMutationResult(response.status, response.body, treatAsPending)),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 202) {
            return of(toProcessStepMutationResult(202, null, true));
          }

          throw error;
        })
      );
  }
}
