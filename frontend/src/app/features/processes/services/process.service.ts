import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProcessCreateRequest } from '../models/process-create-request.model';
import { ProcessMutationResult } from '../models/process-mutation-result.model';
import { ProcessUpdateRequest } from '../models/process-update-request.model';
import { Process } from '../models/process.model';
import { toProcessMutationResult } from '../utils/process.utils';

@Injectable({
  providedIn: 'root'
})
export class ProcessService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/processes`;

  getProcesses(): Observable<Process[]> {
    return this.http.get<Process[]>(this.baseUrl);
  }

  getProcessById(id: string): Observable<Process> {
    return this.http.get<Process>(`${this.baseUrl}/${id}`);
  }

  createProcess(request: ProcessCreateRequest): Observable<ProcessMutationResult> {
    return this.mutate('POST', this.baseUrl, request);
  }

  updateProcess(id: string, request: ProcessUpdateRequest): Observable<ProcessMutationResult> {
    return this.mutate('PUT', `${this.baseUrl}/${id}`, request);
  }

  private mutate(
    method: 'POST' | 'PUT',
    url: string,
    body: ProcessCreateRequest | ProcessUpdateRequest
  ): Observable<ProcessMutationResult> {
    return this.http
      .request(method, url, {
        body,
        observe: 'response',
        responseType: 'text'
      })
      .pipe(
        map(response => toProcessMutationResult(response.status, response.body)),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 202) {
            return of(toProcessMutationResult(202, null));
          }

          throw error;
        })
      );
  }
}
