import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChatMessage } from '../../models/chat-message.model';
import { formatMessageTime, parseAssistantContent } from '../../utils/ai-assistant.utils';

@Component({
  selector: 'app-chat-message',
  templateUrl: './chat-message.html',
  styleUrl: './chat-message.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatMessageBubble {
  readonly message = input.required<ChatMessage>();

  readonly isUser = computed(() => this.message().role === 'user');
  readonly timeLabel = computed(() => formatMessageTime(this.message().timestamp));
  readonly blocks = computed(() =>
    this.isUser() ? [] : parseAssistantContent(this.message().content)
  );
}
