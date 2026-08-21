import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Process } from '../../models/process.model';
import { ProcessService } from '../../services/process.service';
import { formatProcessDateTime, resolveProcessApiError } from '../../utils/process.utils';

@Component({
  selector: 'app-process-detail',
  imports: [RouterLink],
  templateUrl: './process-detail.html',
  styleUrl: './process-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessDetail implements OnInit {
  private readonly processService = inject(ProcessService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly process = signal<Process | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.isLoading.set(false);
      this.errorMessage.set('Process not found.');
      return;
    }

    this.loadProcess(id);
  }

  formatDate(value: string): string {
    return formatProcessDateTime(value);
  }

  back(): void {
    void this.router.navigateByUrl('/processes');
  }

  private loadProcess(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.processService
      .getProcessById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: process => this.process.set(process),
        error: (error: HttpErrorResponse) => {
          this.process.set(null);
          this.errorMessage.set(
            resolveProcessApiError(error, 'An error occurred. Please try again.')
          );
        }
      });
  }
}
