import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { Process } from '../../models/process.model';
import { ProcessService } from '../../services/process.service';
import {
  clearProcessNoticeFromHistory,
  isPendingNotice,
  ProcessNoticeKind,
  ProcessNoticePayload,
  readProcessNoticeFromState
} from '../../utils/process-notice';
import { formatProcessDateTime, resolveProcessApiError } from '../../utils/process.utils';

interface ProcessFeedback {
  kind: 'success' | 'pending';
  message: string;
  status: string | null;
}

@Component({
  selector: 'app-process-list',
  imports: [RouterLink],
  templateUrl: './process-list.html',
  styleUrl: './process-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessList implements OnInit {
  private readonly processService = inject(ProcessService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly processes = signal<Process[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly feedback = signal<ProcessFeedback | null>(null);
  readonly searchQuery = signal('');
  readonly skeletonRows = [0, 1, 2, 3, 4];
  private requestInFlight = false;
  private feedbackUserId: string | null = null;

  private readonly incomingNotice = readProcessNoticeFromState(
    this.router.getCurrentNavigation()?.extras.state
  );

  readonly filteredProcesses = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();

    if (query.length === 0) {
      return this.processes();
    }

    return this.processes().filter(process =>
      process.name.toLowerCase().includes(query) ||
      process.processNumber.toLowerCase().includes(query)
    );
  });

  constructor() {
    effect(() => {
      const userId = this.authService.currentUser()?.userId ?? null;

      if (this.feedbackUserId !== null && this.feedbackUserId !== userId) {
        this.feedback.set(null);
        this.feedbackUserId = null;
      }
    });
  }

  ngOnInit(): void {
    this.applyIncomingNotice();
    this.loadProcesses();
  }

  loadProcesses(): void {
    if (this.requestInFlight) {
      return;
    }

    this.requestInFlight = true;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.processService
      .getProcesses()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.requestInFlight = false;
          this.isLoading.set(false);
        })
      )
      .subscribe({
        next: processes => this.processes.set(processes),
        error: (error: HttpErrorResponse) => {
          this.processes.set([]);
          this.errorMessage.set(
            resolveProcessApiError(error, 'An error occurred. Please try again.')
          );
        }
      });
  }

  onSearchInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.searchQuery.set(target.value);
    }
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  formatDate(value: string): string {
    return formatProcessDateTime(value);
  }

  private applyIncomingNotice(): void {
    const payload =
      this.incomingNotice ?? readProcessNoticeFromState(history.state);

    this.stripTransientNotice();

    if (!payload) {
      return;
    }

    this.showNotice(payload);
  }

  private showNotice(payload: ProcessNoticePayload): void {
    const user = this.authService.currentUser();

    if (!user || payload.userId !== user.userId) {
      return;
    }

    if (isPendingNotice(payload.notice) && !this.authService.hasRole('ADMIN')) {
      return;
    }

    this.feedback.set(this.feedbackForNotice(payload.notice));
    this.feedbackUserId = payload.userId;
  }

  private feedbackForNotice(notice: ProcessNoticeKind): ProcessFeedback {
    if (notice === 'created') {
      return {
        kind: 'success',
        message: 'Process created successfully.',
        status: null
      };
    }

    if (notice === 'updated') {
      return {
        kind: 'success',
        message: 'Process updated successfully.',
        status: null
      };
    }

    if (notice === 'pending-create') {
      return {
        kind: 'pending',
        message: 'Your process creation request has been submitted for approval.',
        status: 'Status: Pending approval'
      };
    }

    return {
      kind: 'pending',
      message: 'Your process update request has been submitted for approval.',
      status: 'Status: Pending approval'
    };
  }

  private stripTransientNotice(): void {
    clearProcessNoticeFromHistory();

    if (!this.route.snapshot.queryParamMap.has('notice')) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }
}
