import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { multilineStringToControls } from '../../utils/control-list.utils';

@Component({
  selector: 'app-control-list-display',
  templateUrl: './control-list-display.html',
  styleUrl: './control-list-display.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ControlListDisplay {
  readonly value = input<string | null | undefined>(null);
  readonly emptyLabel = input('Not defined');
  readonly compact = input(false);

  readonly items = computed(() => multilineStringToControls(this.value()));
}
