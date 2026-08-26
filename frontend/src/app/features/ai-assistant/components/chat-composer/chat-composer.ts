import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-chat-composer',
  templateUrl: './chat-composer.html',
  styleUrl: './chat-composer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComposer {
  readonly disabled = input(false);
  readonly sending = input(false);
  readonly send = output<string>();

  readonly draft = signal('');

  readonly canSend = computed(
    () => this.draft().trim().length > 0 && !this.disabled() && !this.sending()
  );

  onInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLTextAreaElement) {
      this.draft.set(target.value);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    this.submit();
  }

  submit(): void {
    const message = this.draft().trim();

    if (message.length === 0 || !this.canSend()) {
      return;
    }

    this.send.emit(message);
    this.draft.set('');
  }
}
