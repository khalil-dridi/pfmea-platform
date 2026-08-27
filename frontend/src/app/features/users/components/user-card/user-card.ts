import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  input,
  output,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { User } from '../../models/user.model';
import { formatUserDate, userFullName, userInitials } from '../../utils/user.utils';

@Component({
  selector: 'app-user-card',
  imports: [RouterLink],
  templateUrl: './user-card.html',
  styleUrl: './user-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCard {
  readonly user = input.required<User>();
  readonly isCurrentUser = input(false);
  readonly isUpdating = input(false);
  readonly index = input(0);

  readonly statusToggle = output<User>();

  readonly menuOpen = signal(false);

  readonly fullName = computed(() => userFullName(this.user()));
  readonly initials = computed(() => userInitials(this.user()));
  readonly createdOn = computed(() => formatUserDate(this.user().createdAt));
  readonly updatedOn = computed(() => formatUserDate(this.user().updatedAt));
  readonly statusLabel = computed(() => (this.user().enabled ? 'Active' : 'Disabled'));
  readonly statusAction = computed(() => (this.user().enabled ? 'Disable' : 'Enable'));
  readonly editLink = computed(() => ['/users', this.user().id, 'edit']);

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  onStatusAction(event: Event): void {
    event.stopPropagation();
    this.closeMenu();
    this.statusToggle.emit(this.user());
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
