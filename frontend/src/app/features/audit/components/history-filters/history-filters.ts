import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostBinding,
  HostListener,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { User } from '../../../users/models/user.model';
import { HistoryActionFilter, HistoryEntityFilter } from '../../models/audit-history.model';
import {
  formatHistoryDate,
  HISTORY_ACTION_OPTIONS,
  HISTORY_ENTITY_OPTIONS,
  readHistoryDateParam
} from '../../utils/audit-history.utils';

@Component({
  selector: 'app-history-filters',
  templateUrl: './history-filters.html',
  styleUrl: './history-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryFilters {
  readonly query = input('');
  readonly entityType = input<HistoryEntityFilter>('ALL');
  readonly action = input<HistoryActionFilter>('ALL');
  readonly userId = input('ALL');
  readonly fromDate = input('');
  readonly toDate = input('');
  readonly users = input<User[]>([]);
  readonly showUserFilter = input(true);
  readonly disabled = input(false);
  readonly canClear = input(false);

  readonly queryChange = output<string>();
  readonly entityTypeChange = output<HistoryEntityFilter>();
  readonly actionChange = output<HistoryActionFilter>();
  readonly userIdChange = output<string>();
  readonly dateRangeChange = output<{ from: string; to: string }>();
  readonly cleared = output<void>();

  readonly entityOptions = HISTORY_ENTITY_OPTIONS;
  readonly actionOptions = HISTORY_ACTION_OPTIONS;
  readonly dateOpen = signal(false);
  readonly pendingFrom = signal('');
  readonly pendingTo = signal('');
  readonly datePlacement = signal<'bottom' | 'top'>('bottom');

  private readonly dateButton = viewChild<ElementRef<HTMLButtonElement>>('dateButton');

  @HostBinding('class.history-filters--open')
  get isDateOpen(): boolean {
    return this.dateOpen();
  }

  readonly dateButtonLabel = computed(() => {
    const from = readHistoryDateParam(this.fromDate());
    const to = readHistoryDateParam(this.toDate());

    if (from && to) {
      return `${this.formatDate(from)} – ${this.formatDate(to)}`;
    }

    if (from) {
      return `From ${this.formatDate(from)}`;
    }

    if (to) {
      return `Until ${this.formatDate(to)}`;
    }

    return 'Date range';
  });

  onQueryInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.queryChange.emit(target.value);
    }
  }

  onEntityChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.entityTypeChange.emit(target.value as HistoryEntityFilter);
    }
  }

  onActionChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.actionChange.emit(target.value as HistoryActionFilter);
    }
  }

  onUserChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.userIdChange.emit(target.value);
    }
  }

  userOptionLabel(user: User): string {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    return fullName || user.email;
  }

  toggleDate(): void {
    if (this.disabled()) {
      return;
    }

    this.dateOpen.update(open => {
      const next = !open;

      if (next) {
        this.pendingFrom.set(readHistoryDateParam(this.fromDate()));
        this.pendingTo.set(readHistoryDateParam(this.toDate()));
        this.updateDatePlacement();
      }

      return next;
    });
  }

  onPendingFromChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.pendingFrom.set(target.value);
    }
  }

  onPendingToChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.pendingTo.set(target.value);
    }
  }

  applyDates(): void {
    this.dateRangeChange.emit({
      from: readHistoryDateParam(this.pendingFrom()),
      to: readHistoryDateParam(this.pendingTo())
    });
    this.dateOpen.set(false);
  }

  clearDates(): void {
    this.pendingFrom.set('');
    this.pendingTo.set('');
    this.dateRangeChange.emit({ from: '', to: '' });
    this.dateOpen.set(false);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.dateOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dateOpen.set(false);
  }

  stopClick(event: Event): void {
    event.stopPropagation();
  }

  private updateDatePlacement(): void {
    const button = this.dateButton()?.nativeElement;
    const spaceBelow = button ? window.innerHeight - button.getBoundingClientRect().bottom : 240;
    this.datePlacement.set(spaceBelow < 230 ? 'top' : 'bottom');
  }

  private formatDate(value: string): string {
    return formatHistoryDate(`${value}T12:00:00`);
  }
}
