import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
  untracked
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ProcessCard } from '../../components/process-card/process-card';
import { ProcessEmptyState } from '../../components/process-empty-state/process-empty-state';
import { ProcessFilters } from '../../components/process-filters/process-filters';
import { ProcessSkeleton } from '../../components/process-skeleton/process-skeleton';
import { ProcessSort, ProcessViewMode } from '../../models/process-list.model';
import { Process } from '../../models/process.model';
import { ProcessService } from '../../services/process.service';
import {
  clearProcessNoticeFromHistory,
  isPendingNotice,
  ProcessNoticeKind,
  ProcessNoticePayload,
  readProcessNoticeFromState
} from '../../utils/process-notice';
import { resolveProcessApiError } from '../../utils/process.utils';

const PAGE_SIZES = [6, 12, 18] as const;
const DEFAULT_PAGE_SIZE = 6;

interface ProcessFeedback {
  kind: 'success' | 'pending';
  message: string;
  status: string | null;
}

@Component({
  selector: 'app-process-list',
  imports: [RouterLink, ProcessCard, ProcessEmptyState, ProcessFilters, ProcessSkeleton],
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

  readonly pageSizes = PAGE_SIZES;
  readonly processes = signal<Process[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly feedback = signal<ProcessFeedback | null>(null);
  readonly searchQuery = signal('');
  readonly sort = signal<ProcessSort>('updated');
  readonly viewMode = signal<ProcessViewMode>('grid');
  readonly page = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  private requestInFlight = false;
  private feedbackUserId: string | null = null;

  private readonly incomingNotice = readProcessNoticeFromState(
    this.router.getCurrentNavigation()?.extras.state
  );

  readonly filteredProcesses = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const processes = this.processes();

    if (query.length === 0) {
      return processes;
    }

    return processes.filter(
      process =>
        process.name.toLowerCase().includes(query) ||
        process.processNumber.toLowerCase().includes(query)
    );
  });

  readonly sortedProcesses = computed(() => {
    const items = [...this.filteredProcesses()];
    const sort = this.sort();

    items.sort((left, right) => compareProcesses(left, right, sort));
    return items;
  });

  readonly totalFiltered = computed(() => this.sortedProcesses().length);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize()))
  );
  readonly pagedProcesses = computed(() => {
    const start = this.page() * this.pageSize();
    return this.sortedProcesses().slice(start, start + this.pageSize());
  });
  readonly canPrev = computed(() => this.page() > 0);
  readonly canNext = computed(
    () => this.page() + 1 < this.totalPages() && this.totalFiltered() > 0
  );
  readonly displayPage = computed(() => this.page() + 1);
  readonly rangeStart = computed(() =>
    this.totalFiltered() === 0 ? 0 : this.page() * this.pageSize() + 1
  );
  readonly rangeEnd = computed(() =>
    Math.min((this.page() + 1) * this.pageSize(), this.totalFiltered())
  );
  readonly visiblePages = computed(() => visiblePageIndexes(this.page(), this.totalPages()));
  readonly hasSearch = computed(() => this.searchQuery().trim().length > 0);

  constructor() {
    effect(() => {
      const userId = this.authService.currentUser()?.userId ?? null;

      if (this.feedbackUserId !== null && this.feedbackUserId !== userId) {
        this.feedback.set(null);
        this.feedbackUserId = null;
      }
    });

    effect(() => {
      this.searchQuery();
      this.sort();
      this.pageSize();
      untracked(() => this.page.set(0));
    });

    effect(() => {
      const maxPage = Math.max(0, this.totalPages() - 1);

      if (this.page() > maxPage) {
        untracked(() => this.page.set(maxPage));
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
            resolveProcessApiError(error, 'Unable to load processes. Please try again.')
          );
        }
      });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onSortChange(value: ProcessSort): void {
    this.sort.set(value);
  }

  onViewModeChange(value: ProcessViewMode): void {
    this.viewMode.set(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  previousPage(): void {
    if (this.canPrev()) {
      this.page.update(page => page - 1);
    }
  }

  nextPage(): void {
    if (this.canNext()) {
      this.page.update(page => page + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.page.set(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.pageSize.set(Number(target.value));
    }
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

function compareProcesses(left: Process, right: Process, sort: ProcessSort): number {
  if (sort === 'name-asc') {
    return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
  }

  if (sort === 'name-desc') {
    return right.name.localeCompare(left.name, undefined, { sensitivity: 'base' });
  }

  const leftTime = timestampForSort(sort === 'created' ? left.createdAt : left.updatedAt);
  const rightTime = timestampForSort(sort === 'created' ? right.createdAt : right.updatedAt);

  return rightTime - leftTime;
}

function timestampForSort(value: string): number {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function visiblePageIndexes(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index);
  }

  const start = Math.max(0, Math.min(current - 3, total - 7));
  return Array.from({ length: 7 }, (_, index) => start + index);
}
