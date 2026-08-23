import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { FunctionCreateRequest } from '../models/function-create-request.model';
import { FunctionMutationResult } from '../models/function-mutation-result.model';
import { FunctionUpdateRequest } from '../models/function-update-request.model';
import { PfmeaFunction } from '../models/function.model';
import { toFunctionMutationResult } from '../utils/function.utils';

@Injectable({
  providedIn: 'root'
})
export class FunctionService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/functions`;

  getFunctionsByProcess(processId: string): Observable<PfmeaFunction[]> {
    return this.http.get<PfmeaFunction[]>(`${this.baseUrl}/process/${processId}`);
  }

  getFunctionsByProcessStep(processStepId: string): Observable<PfmeaFunction[]> {
    return this.http.get<PfmeaFunction[]>(`${this.baseUrl}/process-step/${processStepId}`);
  }

  getFunctionsByWorkElement(workElementId: string): Observable<PfmeaFunction[]> {
    return this.http.get<PfmeaFunction[]>(`${this.baseUrl}/work-element/${workElementId}`);
  }

  getFunctionById(id: string): Observable<PfmeaFunction> {
    return this.http.get<PfmeaFunction>(`${this.baseUrl}/${id}`);
  }

  createFunction(request: FunctionCreateRequest): Observable<FunctionMutationResult> {
    return this.mutate('POST', this.baseUrl, request);
  }

  updateFunction(id: string, request: FunctionUpdateRequest): Observable<FunctionMutationResult> {
    return this.mutate('PUT', `${this.baseUrl}/${id}`, request);
  }

  private mutate(
    method: 'POST' | 'PUT',
    url: string,
    body: FunctionCreateRequest | FunctionUpdateRequest
  ): Observable<FunctionMutationResult> {
    const treatAsPending = this.authService.hasRole('ADMIN') && !this.authService.hasRole('SUPER_ADMIN');

    return this.http
      .request(method, url, {
        body,
        observe: 'response',
        responseType: 'text'
      })
      .pipe(
        map(response => toFunctionMutationResult(response.status, response.body, treatAsPending)),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 202) {
            return of(toFunctionMutationResult(202, null, true));
          }

          throw error;
        })
      );
  }
}
