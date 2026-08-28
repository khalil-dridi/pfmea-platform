import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-validation-skeleton',
  templateUrl: './validation-skeleton.html',
  styleUrl: './validation-skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationSkeleton {
  readonly placeholders = [0, 1, 2, 3, 4];
}
