import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly collapsed = input(false);
  readonly mobileOpen = input(false);
  readonly sidebarToggle = output<void>();

  readonly pageTitle = signal('Tableau de bord');
  readonly isMenuOpen = signal(false);

  readonly displayName = this.authService.displayName;
  readonly roleLabel = this.authService.roleLabel;

  constructor() {
    this.updatePageTitle();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.updatePageTitle();
        this.isMenuOpen.set(false);
      });
  }

  toggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  toggleUserMenu(): void {
    this.isMenuOpen.update(isOpen => !isOpen);
  }

  closeUserMenu(): void {
    this.isMenuOpen.set(false);
  }

  closeUserMenuOnBlur(event: FocusEvent): void {
    const currentTarget = event.currentTarget;
    const nextTarget = event.relatedTarget;

    if (
      currentTarget instanceof HTMLElement &&
      nextTarget instanceof Node &&
      currentTarget.contains(nextTarget)
    ) {
      return;
    }

    this.isMenuOpen.set(false);
  }

  logout(): void {
    this.isMenuOpen.set(false);
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }

  private updatePageTitle(): void {
    let snapshot = this.router.routerState.snapshot.root;

    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }

    const title = snapshot.data['title'];
    this.pageTitle.set(typeof title === 'string' && title.length > 0 ? title : 'Tableau de bord');
  }
}
