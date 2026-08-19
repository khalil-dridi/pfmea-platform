import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-feature-placeholder',
  templateUrl: './feature-placeholder.html',
  styleUrl: './feature-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturePlaceholder {
  private readonly route = inject(ActivatedRoute);

  readonly title = toSignal(
    this.route.data.pipe(map(data => {
      const title = data['title'];
      return typeof title === 'string' ? title : '';
    })),
    { initialValue: '' }
  );
}
