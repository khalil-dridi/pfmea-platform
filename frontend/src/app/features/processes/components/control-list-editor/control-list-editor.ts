import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  viewChildren
} from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-control-list-editor',
  imports: [ReactiveFormsModule],
  templateUrl: './control-list-editor.html',
  styleUrl: './control-list-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ControlListEditor {
  private readonly formBuilder = inject(FormBuilder);
  private readonly inputs = viewChildren<ElementRef<HTMLTextAreaElement>>('controlInput');

  readonly controls = input.required<FormArray<FormControl<string>>>();
  readonly label = input.required<string>();
  readonly addLabel = input.required<string>();
  readonly emptyMessage = input.required<string>();
  readonly fieldId = input.required<string>();
  readonly errorMessage = input<string | null>(null);
  readonly disabled = input(false);

  inputId(index: number): string {
    return `${this.fieldId()}-${index}`;
  }

  add(): void {
    if (this.disabled()) {
      return;
    }

    const array = this.controls();
    array.push(this.formBuilder.nonNullable.control(''));
    array.markAsDirty();
    array.markAsTouched();
    array.updateValueAndValidity();
    this.focusLastInput();
  }

  remove(index: number): void {
    if (this.disabled()) {
      return;
    }

    const array = this.controls();

    if (index < 0 || index >= array.length) {
      return;
    }

    array.removeAt(index);
    array.markAsDirty();
    array.markAsTouched();
    array.updateValueAndValidity();
  }

  private focusLastInput(): void {
    setTimeout(() => {
      const fields = this.inputs();
      fields[fields.length - 1]?.nativeElement.focus();
    }, 0);
  }
}
