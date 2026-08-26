import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Process } from '../../../processes/models/process.model';
import { ProcessStep } from '../../../processes/models/process-step.model';
import { ProcessService } from '../../../processes/services/process.service';
import { ProcessStepService } from '../../../processes/services/process-step.service';
import { AiAssistantHeader } from '../../components/ai-assistant-header/ai-assistant-header';
import { AnalysisScopePanel } from '../../components/analysis-scope-panel/analysis-scope-panel';
import { ChatWindow } from '../../components/chat-window/chat-window';
import { CurrentAnalysisPanel } from '../../components/current-analysis-panel/current-analysis-panel';
import { ChatMessage } from '../../models/chat-message.model';
import { AiAssistantService } from '../../services/ai-assistant.service';
import {
  createMessageId,
  isConversationNotFoundError,
  resolveResetConversationError,
  resolveSendMessageError,
  resolveStartConversationError
} from '../../utils/ai-assistant.utils';

type PendingReset = 'new-chat' | 'process' | 'step';

@Component({
  selector: 'app-ai-assistant',
  imports: [AiAssistantHeader, AnalysisScopePanel, CurrentAnalysisPanel, ChatWindow],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiAssistant {
  private readonly processService = inject(ProcessService);
  private readonly processStepService = inject(ProcessStepService);
  private readonly aiAssistantService = inject(AiAssistantService);
  private readonly destroyRef = inject(DestroyRef);

  readonly processes = signal<Process[]>([]);
  readonly steps = signal<ProcessStep[]>([]);
  readonly processId = signal<string | null>(null);
  readonly processStepId = signal<string | null>(null);
  readonly conversationId = signal<string | null>(null);
  readonly messages = signal<readonly ChatMessage[]>([]);
  readonly expired = signal(false);

  readonly isLoadingProcesses = signal(false);
  readonly isLoadingSteps = signal(false);
  readonly isStarting = signal(false);
  readonly isSending = signal(false);
  readonly isResetting = signal(false);

  readonly processLoadError = signal<string | null>(null);
  readonly startError = signal<string | null>(null);
  readonly sendError = signal<string | null>(null);
  readonly resetError = signal<string | null>(null);

  readonly selectedProcess = computed(() => {
    const processId = this.processId();
    return this.processes().find(process => process.id === processId) ?? null;
  });

  readonly selectedStep = computed(() => {
    const processStepId = this.processStepId();
    return this.steps().find(step => step.id === processStepId) ?? null;
  });

  readonly scopeLine = computed(() => {
    const process = this.selectedProcess();
    const step = this.selectedStep();

    if (!process || !step) {
      return '';
    }

    return `${process.name} · Step ${step.stepNumber} · ${step.name}`;
  });

  readonly isActive = computed(() => this.conversationId() !== null && !this.expired());
  readonly chatBusy = computed(() => this.isSending() || this.isResetting() || this.isStarting());

  private lastOutboundMessage: string | null = null;
  private pendingReset: PendingReset | null = null;
  private pendingProcessId: string | null = null;
  private pendingStepId: string | null = null;
  private stepLoadToken = 0;

  constructor() {
    this.loadProcesses();
  }

  onProcessChange(processId: string | null): void {
    if (processId === this.processId()) {
      return;
    }

    if (!this.conversationId()) {
      this.applyProcessChange(processId);
      return;
    }

    this.pendingReset = 'process';
    this.pendingProcessId = processId;
    this.pendingStepId = null;
    this.resetConversationThen(() => this.applyProcessChange(processId));
  }

  onProcessStepChange(processStepId: string | null): void {
    if (processStepId === this.processStepId()) {
      return;
    }

    if (!this.conversationId()) {
      this.processStepId.set(processStepId);
      this.startError.set(null);
      return;
    }

    this.pendingReset = 'step';
    this.pendingProcessId = this.processId();
    this.pendingStepId = processStepId;
    this.resetConversationThen(() => {
      this.processStepId.set(processStepId);
      this.startError.set(null);
    });
  }

  startAnalysis(): void {
    const processId = this.processId();
    const processStepId = this.processStepId();

    if (!processId || !processStepId || this.isStarting()) {
      return;
    }

    this.isStarting.set(true);
    this.startError.set(null);
    this.expired.set(false);

    this.aiAssistantService
      .startConversation(processId, processStepId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.conversationId.set(response.conversationId);
          this.messages.set([
            {
              id: createMessageId(),
              role: 'assistant',
              content: response.message,
              timestamp: new Date()
            }
          ]);
          this.isStarting.set(false);
        },
        error: (error: unknown) => {
          this.isStarting.set(false);
          this.startError.set(
            error instanceof HttpErrorResponse
              ? resolveStartConversationError(error)
              : 'Please check the selected Process and Process Step and try again.'
          );
        }
      });
  }

  sendChatMessage(message: string): void {
    this.dispatchMessage(message, true);
  }

  retrySend(): void {
    if (this.lastOutboundMessage) {
      this.dispatchMessage(this.lastOutboundMessage, false);
    }
  }

  requestNewChat(): void {
    this.pendingReset = 'new-chat';
    this.pendingProcessId = null;
    this.pendingStepId = null;
    this.resetConversationThen(() => this.resetToEmptySetup());
  }

  retryReset(): void {
    if (this.pendingReset === 'new-chat') {
      this.requestNewChat();
      return;
    }

    if (this.pendingReset === 'process') {
      this.resetConversationThen(() => this.applyProcessChange(this.pendingProcessId));
      return;
    }

    if (this.pendingReset === 'step') {
      const stepId = this.pendingStepId;
      this.resetConversationThen(() => {
        this.processStepId.set(stepId);
        this.startError.set(null);
      });
    }
  }

  recoverFromExpiry(): void {
    this.expired.set(false);
    this.resetToEmptySetup();
  }

  private dispatchMessage(rawMessage: string, appendUser: boolean): void {
    const conversationId = this.conversationId();
    const message = rawMessage.trim();

    if (!conversationId || message.length === 0 || this.isSending()) {
      return;
    }

    this.lastOutboundMessage = message;
    this.sendError.set(null);

    if (appendUser) {
      this.messages.update(messages => [
        ...messages,
        {
          id: createMessageId(),
          role: 'user',
          content: message,
          timestamp: new Date()
        }
      ]);
    }

    this.isSending.set(true);

    this.aiAssistantService
      .sendMessage(conversationId, message)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.messages.update(messages => [
            ...messages,
            {
              id: createMessageId(),
              role: 'assistant',
              content: response.message,
              timestamp: new Date()
            }
          ]);
          this.isSending.set(false);
          this.lastOutboundMessage = null;
        },
        error: (error: unknown) => {
          this.isSending.set(false);

          if (error instanceof HttpErrorResponse && isConversationNotFoundError(error)) {
            this.markExpired();
            return;
          }

          this.sendError.set(
            error instanceof HttpErrorResponse
              ? resolveSendMessageError(error)
              : 'Unable to get a response. Please try again.'
          );
        }
      });
  }

  private resetConversationThen(onCleared: () => void): void {
    const conversationId = this.conversationId();

    if (!conversationId) {
      onCleared();
      return;
    }

    this.isResetting.set(true);
    this.resetError.set(null);

    this.aiAssistantService
      .resetConversation(conversationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isResetting.set(false);
          this.clearConversationLocal();
          this.pendingReset = null;
          onCleared();
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && isConversationNotFoundError(error)) {
            this.isResetting.set(false);
            this.clearConversationLocal();
            this.pendingReset = null;
            onCleared();
            return;
          }

          this.isResetting.set(false);
          this.resetError.set(
            error instanceof HttpErrorResponse
              ? resolveResetConversationError(error)
              : 'Unable to reset the conversation. Please try again.'
          );
        }
      });
  }

  private applyProcessChange(processId: string | null): void {
    this.processId.set(processId);
    this.processStepId.set(null);
    this.steps.set([]);
    this.startError.set(null);

    if (processId) {
      this.loadSteps(processId);
      return;
    }

    this.stepLoadToken += 1;
    this.isLoadingSteps.set(false);
  }

  private resetToEmptySetup(): void {
    this.processId.set(null);
    this.processStepId.set(null);
    this.steps.set([]);
    this.stepLoadToken += 1;
    this.isLoadingSteps.set(false);
    this.startError.set(null);
    this.sendError.set(null);
    this.resetError.set(null);
    this.expired.set(false);
  }

  private clearConversationLocal(): void {
    this.conversationId.set(null);
    this.messages.set([]);
    this.sendError.set(null);
    this.lastOutboundMessage = null;
    this.isSending.set(false);
  }

  private markExpired(): void {
    this.expired.set(true);
    this.clearConversationLocal();
  }

  private loadProcesses(): void {
    this.isLoadingProcesses.set(true);
    this.processLoadError.set(null);

    this.processService
      .getProcesses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: processes => {
          this.processes.set(processes);
          this.isLoadingProcesses.set(false);
        },
        error: () => {
          this.isLoadingProcesses.set(false);
          this.processLoadError.set('Unable to load processes. Please try again.');
        }
      });
  }

  private loadSteps(processId: string): void {
    const token = ++this.stepLoadToken;
    this.isLoadingSteps.set(true);

    this.processStepService
      .getStepsByProcess(processId)
      .pipe(
        catchError(() => of<ProcessStep[]>([])),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(steps => {
        if (token !== this.stepLoadToken) {
          return;
        }

        this.steps.set(steps);
        this.isLoadingSteps.set(false);
      });
  }
}
