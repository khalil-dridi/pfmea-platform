import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ProcessWorkElementCreateRequest } from '../models/process-work-element-create-request.model';
import { ProcessWorkElementMutationResult } from '../models/process-work-element-mutation-result.model';
import { ProcessWorkElementUpdateRequest } from '../models/process-work-element-update-request.model';
import { ProcessWorkElement } from '../models/process-work-element.model';
import { toWorkElementMutationResult } from '../utils/process-work-element.utils';

@Injectable({
  providedIn: 'root'
})
export class ProcessWorkElementService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/process-work-elements`;

  getWorkElementsByProcessStep(processStepId: string): Observable<ProcessWorkElement[]> {
    return this.http.get<ProcessWorkElement[]>(`${this.baseUrl}/process-step/${processStepId}`);
  }

  getWorkElementById(id: string): Observable<ProcessWorkElement> {
    return this.http.get<ProcessWorkElement>(`${this.baseUrl}/${id}`);
  }

  createWorkElement(request: ProcessWorkElementCreateRequest): Observable<ProcessWorkElementMutationResult> {
    return this.mutate('POST', this.baseUrl, request);
  }

  updateWorkElement(
    id: string,
    request: ProcessWorkElementUpdateRequest
  ): Observable<ProcessWorkElementMutationResult> {
    return this.mutate('PUT', `${this.baseUrl}/${id}`, request);
  }

  private mutate(
    method: 'POST' | 'PUT',
    url: string,
    body: ProcessWorkElementCreateRequest | ProcessWorkElementUpdateRequest
  ): Observable<ProcessWorkElementMutationResult> {
    const treatAsPending = this.authService.hasRole('ADMIN') && !this.authService.hasRole('SUPER_ADMIN');

    return this.http
      .request(method, url, {
        body,
        observe: 'response',
        responseType: 'text'
      })
      .pipe(
        map(response => toWorkElementMutationResult(response.status, response.body, treatAsPending)),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 202) {
            return of(toWorkElementMutationResult(202, null, true));
          }

          throw error;
        })
      );
  }
}
