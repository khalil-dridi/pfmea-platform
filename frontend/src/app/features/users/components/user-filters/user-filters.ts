import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { UserRoleFilter, UserStatusFilter } from '../../models/user-filters.model';

@Component({
  selector: 'app-user-filters',
  templateUrl: './user-filters.html',
  styleUrl: './user-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFilters {
  readonly query = input.required<string>();
  readonly role = input.required<UserRoleFilter>();
  readonly status = input.required<UserStatusFilter>();
  readonly disabled = input(false);

  readonly queryChange = output<string>();
  readonly roleChange = output<UserRoleFilter>();
  readonly statusChange = output<UserStatusFilter>();
  readonly cleared = output<void>();

  readonly canClear = computed(
    () => this.query().length > 0 || this.role() !== 'ALL' || this.status() !== 'ALL'
  );

  onQueryInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.queryChange.emit(target.value);
    }
  }

  onRoleChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    this.roleChange.emit(target.value === 'ADMIN' || target.value === 'SUPER_ADMIN' ? target.value : 'ALL');
  }

  onStatusChange(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    this.statusChange.emit(target.value === 'ACTIVE' || target.value === 'DISABLED' ? target.value : 'ALL');
  }
}
