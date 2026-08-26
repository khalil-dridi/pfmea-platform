import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AiConversationCreateRequest } from '../models/ai-conversation-create-request.model';
import { AiMessageRequest } from '../models/ai-message-request.model';
import { AiMessageResponse } from '../models/ai-message-response.model';
import { ConversationStartResponse } from '../models/conversation-start-response.model';
import { isAiMessageResponse, isConversationStartResponse } from '../utils/ai-assistant.utils';

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ai/conversations`;

  startConversation(processId: string, processStepId: string): Observable<ConversationStartResponse> {
    const body: AiConversationCreateRequest = { processId, processStepId };

    return this.http.post<unknown>(this.baseUrl, body).pipe(
      map(payload => {
        if (!isConversationStartResponse(payload)) {
          throw new Error('INVALID_AI_CONVERSATION_PAYLOAD');
        }

        return payload;
      })
    );
  }

  sendMessage(conversationId: string, message: string): Observable<AiMessageResponse> {
    const body: AiMessageRequest = { message };

    return this.http.post<unknown>(`${this.baseUrl}/${conversationId}/messages`, body).pipe(
      map(payload => {
        if (!isAiMessageResponse(payload)) {
          throw new Error('INVALID_AI_MESSAGE_PAYLOAD');
        }

        return payload;
      })
    );
  }

  resetConversation(conversationId: string): Observable<void> {
    return this.http
      .delete(`${this.baseUrl}/${conversationId}`, {
        observe: 'response',
        responseType: 'text'
      })
      .pipe(map(() => undefined));
  }
}
