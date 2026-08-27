import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { Process } from '../../../processes/models/process.model';
import { ProcessStep } from '../../../processes/models/process-step.model';
import { ProcessService } from '../../../processes/services/process.service';
import { ProcessStepService } from '../../../processes/services/process-step.service';
import { SearchBar } from '../../components/search-bar/search-bar';
import { SearchEmptyState } from '../../components/search-empty-state/search-empty-state';
import { SearchError } from '../../components/search-error/search-error';
import { SearchFilters } from '../../components/search-filters/search-filters';
import { SearchHeader } from '../../components/search-header/search-header';
import { SearchLoading } from '../../components/search-loading/search-loading';
import { SearchResults, SearchViewMode } from '../../components/search-results/search-results';
import { SearchScope } from '../../components/search-scope/search-scope';
import { SearchEntityType } from '../../models/search-entity-type.model';
import { SearchRequest } from '../../models/search-request.model';
import { SearchResult } from '../../models/search-result.model';
import { SearchService } from '../../services/search.service';
import { DEFAULT_SEARCH_PAGE_SIZE, resolveSearchApiError } from '../../utils/search.utils';

type SearchPageState = 'idle' | 'loading' | 'results' | 'empty' | 'error';

@Component({
  selector: 'app-search',
  imports: [
    SearchHeader,
    SearchBar,
    SearchFilters,
    SearchScope,
    SearchResults,
    SearchEmptyState,
    SearchLoading,
    SearchError
  ],
  templateUrl: './search.html',
  styleUrl: './search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPage {
  private readonly searchService = inject(SearchService);
  private readonly processService = inject(ProcessService);
  private readonly processStepService = inject(ProcessStepService);
  private readonly destroyRef = inject(DestroyRef);

  readonly query = signal('');
  readonly entityType = signal<SearchEntityType | null>(null);
  readonly processId = signal<string | null>(null);
  readonly processStepId = signal<string | null>(null);
  readonly status = signal<string | null>(null);
  readonly priority = signal<string | null>(null);
  readonly page = signal(0);
  readonly pageSize = signal(DEFAULT_SEARCH_PAGE_SIZE);
  readonly viewMode = signal<SearchViewMode>('list');

  readonly processes = signal<Process[]>([]);
  readonly steps = signal<ProcessStep[]>([]);
  readonly results = signal<readonly SearchResult[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly submittedQuery = signal<string | null>(null);
  readonly isSearching = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedProcess = computed(() => {
    const processId = this.processId();
    return this.processes().find(process => process.id === processId) ?? null;
  });

  readonly selectedStep = computed(() => {
    const stepId = this.processStepId();
    return this.steps().find(step => step.id === stepId) ?? null;
  });

  readonly hasActiveFilters = computed(() => {
    return (
      this.entityType() !== null ||
      this.processId() !== null ||
      this.processStepId() !== null ||
      this.status() !== null ||
      this.priority() !== null
    );
  });

  readonly pageState = computed<SearchPageState>(() => {
    if (this.errorMessage() && !this.isSearching()) {
      return 'error';
    }

    if (this.submittedQuery() === null) {
      return this.isSearching() ? 'loading' : 'idle';
    }

    if (this.isSearching() && this.results().length === 0) {
      return 'loading';
    }

    if (this.totalElements() === 0) {
      return 'empty';
    }

    return 'results';
  });

  constructor() {
    this.processService
      .getProcesses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: processes => this.processes.set(processes),
        error: () => this.processes.set([])
      });

    toObservable(this.processId)
      .pipe(
        switchMap(processId => {
          if (!processId) {
            return of<ProcessStep[]>([]);
          }

          return this.processStepService.getStepsByProcess(processId).pipe(
            catchError(() => of<ProcessStep[]>([]))
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe(steps => this.steps.set(steps));
  }

  onQueryChange(value: string): void {
    this.query.set(value);
  }

  onEntityTypeChange(value: SearchEntityType | null): void {
    this.entityType.set(value);
  }

  onProcessChange(processId: string | null): void {
    this.processId.set(processId);
    this.processStepId.set(null);
  }

  onProcessStepChange(processStepId: string | null): void {
    this.processStepId.set(processStepId);
  }

  onStatusChange(status: string | null): void {
    this.status.set(status);
  }

  onPriorityChange(priority: string | null): void {
    this.priority.set(priority);
  }

  onViewModeChange(mode: SearchViewMode): void {
    this.viewMode.set(mode);
  }

  submitSearch(): void {
    this.runSearch(0);
  }

  onPageChange(page: number): void {
    this.runSearch(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.runSearch(0);
  }

  retry(): void {
    const submitted = this.submittedQuery();
    this.runSearch(this.page(), submitted ?? this.query());
  }

  clearFilters(): void {
    this.entityType.set(null);
    this.processId.set(null);
    this.processStepId.set(null);
    this.status.set(null);
    this.priority.set(null);
    this.steps.set([]);

    if (this.submittedQuery() !== null || this.query().trim().length > 0) {
      this.runSearch(0);
    }
  }

  private runSearch(page: number, queryOverride?: string): void {
    if (this.isSearching()) {
      return;
    }

    const query = (queryOverride ?? this.query()).trim();

    if (query.length === 0) {
      return;
    }

    this.page.set(page);
    this.errorMessage.set(null);
    this.isSearching.set(true);

    const request = this.buildRequest(page, query);

    this.searchService
      .search(request)
      .pipe(
        catchError((error: unknown) => {
          this.errorMessage.set(
            error instanceof HttpErrorResponse || error instanceof Error
              ? resolveSearchApiError(error)
              : 'Unable to complete the search.'
          );
          return of(null);
        }),
        finalize(() => this.isSearching.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(response => {
        this.submittedQuery.set(query);

        if (!response) {
          return;
        }

        this.results.set(response.content);
        this.totalElements.set(response.totalElements);
        this.totalPages.set(response.totalPages);
        this.page.set(response.page);
        this.pageSize.set(response.size);
      });
  }

  private buildRequest(page: number, query: string): SearchRequest {
    const request: SearchRequest = {
      q: query,
      page,
      size: this.pageSize()
    };

    const entityType = this.entityType();
    const processId = this.processId();
    const processStepId = this.processStepId();

    if (entityType) {
      request.entityType = entityType;
    }

    if (processId) {
      request.processId = processId;
    }

    if (processId && processStepId) {
      request.processStepId = processStepId;
    }

    return request;
  }
}
