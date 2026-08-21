import { signal } from '@angular/core';

export class DiscardChangesController {
  readonly isOpen = signal(false);

  private resolver: ((value: boolean) => void) | null = null;
  private pending: Promise<boolean> | null = null;

  prompt(): Promise<boolean> {
    if (this.pending) {
      return this.pending;
    }

    this.isOpen.set(true);
    this.pending = new Promise<boolean>(resolve => {
      this.resolver = resolve;
    });

    return this.pending;
  }

  stay(): void {
    this.finish(false);
  }

  discard(): void {
    this.finish(true);
  }

  private finish(value: boolean): void {
    this.isOpen.set(false);
    this.resolver?.(value);
    this.resolver = null;
    this.pending = null;
  }
}
