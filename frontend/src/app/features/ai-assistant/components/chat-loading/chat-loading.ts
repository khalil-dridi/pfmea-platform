import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-chat-loading',
  templateUrl: './chat-loading.html',
  styleUrl: './chat-loading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatLoading {
  readonly label = input('Analyzing...');
}
