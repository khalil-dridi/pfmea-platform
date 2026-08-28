import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  input,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChangeRequest } from '../../models/change-request.model';
import {
  formatRequestDateTime,
  operationLabel,
  statusLabel
} from '../../utils/change-request.utils';

@Component({
  selector: 'app-validation-item',
  imports: [RouterLink],
  templateUrl: './validation-item.html',
  styleUrl: './validation-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationItem {
  readonly request = input.required<ChangeRequest>();
  readonly index = input(0);

  readonly menuOpen = signal(false);

  readonly accent = computed(() => entityAccent(this.request().entityType));
  readonly iconKind = computed(() => entityIconKind(this.request().entityType));
  readonly operationText = computed(() => operationLabel(this.request().operation));
  readonly statusText = computed(() => statusLabel(this.request().status));
  readonly submittedAt = computed(() => formatRequestDateTime(this.request().createdAt));
  readonly reviewLink = computed(() => ['/change-requests', this.request().id]);

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

function entityAccent(entityType: string): number {
  const value = entityType.toUpperCase();
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash + value.charCodeAt(index)) % 5;
  }

  return hash;
}

function entityIconKind(entityType: string): string {
  const value = entityType.trim().toUpperCase().replaceAll('-', '_');

  if (value === 'PROCESS' || value === 'PROCESS_STEP' || value === 'FUNCTION') {
    return value;
  }

  if (value === 'WORK_ELEMENT' || value === 'PROCESS_WORK_ELEMENT') {
    return 'WORK_ELEMENT';
  }

  if (value === 'FAILURE_MODE' || value === 'FAILURE_CAUSE' || value === 'RISK_ANALYSIS') {
    return value;
  }

  if (value === 'OPTIMIZATION' || value === 'OPTIMIZATION_ACTION' || value === 'ACTION') {
    return 'ACTION';
  }

  if (value === 'USER') {
    return 'USER';
  }

  return 'DEFAULT';
}
