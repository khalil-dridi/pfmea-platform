import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-user-skeleton',
  templateUrl: './user-skeleton.html',
  styleUrl: './user-skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserSkeleton {
  readonly placeholders = [0, 1, 2];
}
