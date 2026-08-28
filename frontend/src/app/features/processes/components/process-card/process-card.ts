import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  input,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProcessViewMode } from '../../models/process-list.model';
import { Process } from '../../models/process.model';

@Component({
  selector: 'app-process-card',
  imports: [RouterLink],
  templateUrl: './process-card.html',
  styleUrl: './process-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessCard {
  readonly process = input.required<Process>();
  readonly index = input(0);
  readonly layout = input<ProcessViewMode>('grid');

  readonly menuOpen = signal(false);
  readonly accent = computed(() => this.index() % 6);
  readonly viewLink = computed(() => ['/processes', this.process().id]);
  readonly editLink = computed(() => ['/processes', this.process().id, 'edit']);
  readonly workspaceLink = computed(() => ['/processes', this.process().id, 'workspace']);

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }
}
