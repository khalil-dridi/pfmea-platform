import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  input,
  output,
  viewChild
} from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmationDialog {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly variant = input<'default' | 'danger'>('default');
  readonly isConfirming = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');

  constructor() {
    afterNextRender(() => {
      this.confirmButton()?.nativeElement.focus();
    });
  }

  onOverlayClick(): void {
    this.requestCancel();
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onCancel(): void {
    this.requestCancel();
  }

  onConfirm(): void {
    if (this.isConfirming()) {
      return;
    }

    this.confirmed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.requestCancel();
  }

  private requestCancel(): void {
    if (this.isConfirming()) {
      return;
    }

    this.cancelled.emit();
  }
}
