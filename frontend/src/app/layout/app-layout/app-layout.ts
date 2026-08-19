import { ChangeDetectionStrategy, Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Navbar } from './components/navbar/navbar';
import { Sidebar } from './components/sidebar/sidebar';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Sidebar, Navbar],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppLayout implements OnInit {
  private readonly authService = inject(AuthService);

  readonly isCollapsed = signal(false);
  readonly isMobileOpen = signal(false);

  ngOnInit(): void {
    this.authService.ensureProfileLoaded();
  }

  toggleSidebar(): void {
    if (this.isMobileViewport()) {
      this.isMobileOpen.update(isOpen => !isOpen);
      return;
    }

    this.isCollapsed.update(isCollapsed => !isCollapsed);
  }

  closeMobileSidebar(): void {
    this.isMobileOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMobileSidebar();
  }

  private isMobileViewport(): boolean {
    return window.matchMedia('(max-width: 1024px)').matches;
  }
}
