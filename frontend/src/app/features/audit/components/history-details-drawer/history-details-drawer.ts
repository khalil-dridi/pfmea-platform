import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  viewChild
} from '@angular/core';
import { HistoryEventView } from '../../models/audit-history.model';
import { HistoryComparison } from '../history-comparison/history-comparison';
import { HistoryEntityIcon } from '../history-entity-icon/history-entity-icon';

@Component({
  selector: 'app-history-details-drawer',
  imports: [HistoryComparison, HistoryEntityIcon],
  templateUrl: './history-details-drawer.html',
  styleUrl: './history-details-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryDetailsDrawer {
  readonly item = input.required<HistoryEventView>();
  readonly closed = output<void>();

  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private readonly destroyRef = inject(DestroyRef);
  private scrollParent: HTMLElement | null = null;
  private previousOverflow = '';

  constructor() {
    afterNextRender(() => {
      this.lockPageScroll();
      this.closeButton()?.nativeElement.focus({ preventScroll: true });
    });

    this.destroyRef.onDestroy(() => this.unlockPageScroll());
  }

  close(): void {
    this.unlockPageScroll();
    this.closed.emit();
  }

  onOverlayClick(): void {
    this.close();
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  private lockPageScroll(): void {
    const scroller = document.querySelector('.app-content');

    if (!(scroller instanceof HTMLElement)) {
      return;
    }

    this.scrollParent = scroller;
    this.previousOverflow = scroller.style.overflow;
    scroller.style.overflow = 'hidden';
  }

  private unlockPageScroll(): void {
    if (!this.scrollParent) {
      return;
    }

    this.scrollParent.style.overflow = this.previousOverflow;
    this.scrollParent = null;
  }
}
