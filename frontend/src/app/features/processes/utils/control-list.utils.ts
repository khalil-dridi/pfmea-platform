import { AbstractControl, FormArray, FormBuilder, FormControl, ValidatorFn } from '@angular/forms';

export const CONTROL_FIELD_MAX_LENGTH = 2000;

const LEADING_BULLET_PATTERN = /^(?:[-•*–—▪◦]\s+)+/;

export function multilineStringToControls(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n/)
    .map(line => normalizedControlText(line))
    .filter(line => line.length > 0);
}

export function controlsToMultilineString(controls: string[]): string {
  return controls
    .map(control => normalizedControlText(control))
    .filter(control => control.length > 0)
    .join('\n');
}

export function formatControlListValue(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  if (typeof value !== 'string') {
    return null;
  }

  const controls = multilineStringToControls(value);
  return controls.length > 0 ? controls.join('\n') : '—';
}

export function serializedControlsMaxLength(maxLength: number): ValidatorFn {
  return (control: AbstractControl) => {
    const serialized = controlsToMultilineString(readControlList(control));

    if (serialized.length <= maxLength) {
      return null;
    }

    return {
      maxlength: {
        requiredLength: maxLength,
        actualLength: serialized.length
      }
    };
  };
}

export function controlListError(
  control: AbstractControl,
  label: string,
  maxLength: number
): string | null {
  if (!control.touched || control.valid) {
    return null;
  }

  if (control.hasError('maxlength')) {
    return `${label} cannot exceed ${maxLength} characters.`;
  }

  return null;
}

export function replaceControlList(
  array: FormArray<FormControl<string>>,
  values: string[],
  formBuilder: FormBuilder
): void {
  array.clear();

  for (const value of values) {
    array.push(formBuilder.nonNullable.control(value));
  }

  array.markAsPristine();
  array.markAsUntouched();
  array.updateValueAndValidity({ emitEvent: false });
}

export function createControlList(
  formBuilder: FormBuilder,
  values: string[] = []
): FormArray<FormControl<string>> {
  return formBuilder.nonNullable.array(
    values.map(value => value),
    serializedControlsMaxLength(CONTROL_FIELD_MAX_LENGTH)
  );
}

function normalizedControlText(value: string): string {
  return value.trim().replace(LEADING_BULLET_PATTERN, '').trim();
}

function readControlList(control: AbstractControl): string[] {
  const value = control.value;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}
