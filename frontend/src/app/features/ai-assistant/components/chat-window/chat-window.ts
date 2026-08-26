import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  untracked,
  viewChild
} from '@angular/core';
import { ChatMessage } from '../../models/chat-message.model';
import { ChatComposer } from '../chat-composer/chat-composer';
import { ChatLoading } from '../chat-loading/chat-loading';
import { ChatMessageBubble } from '../chat-message/chat-message';
import { SuggestedPrompts } from '../suggested-prompts/suggested-prompts';

@Component({
  selector: 'app-chat-window',
  imports: [ChatComposer, ChatLoading, ChatMessageBubble, SuggestedPrompts],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatWindow {
  readonly messages = input.required<readonly ChatMessage[]>();
  readonly sending = input(false);
  readonly sendError = input<string | null>(null);
  readonly scopeLine = input('');
  readonly disabled = input(false);

  readonly send = output<string>();
  readonly retry = output<void>();
  readonly promptSelected = output<string>();

  private readonly transcript = viewChild<ElementRef<HTMLElement>>('transcript');
  private stickToBottom = true;

  readonly composerLocked = computed(() => this.disabled() || this.sending());

  constructor() {
    effect(() => {
      this.messages();
      this.sending();
      untracked(() => this.scrollIfNeeded());
    });
  }

  onTranscriptScroll(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    this.stickToBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 96;
  }

  private scrollIfNeeded(): void {
    if (!this.stickToBottom) {
      return;
    }

    queueMicrotask(() => {
      const element = this.transcript()?.nativeElement;

      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }
}
