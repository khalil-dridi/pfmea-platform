import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SUGGESTED_PROMPTS } from '../../utils/ai-assistant.utils';

@Component({
  selector: 'app-suggested-prompts',
  templateUrl: './suggested-prompts.html',
  styleUrl: './suggested-prompts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuggestedPrompts {
  readonly disabled = input(false);
  readonly selected = output<string>();

  readonly prompts = SUGGESTED_PROMPTS;
}
