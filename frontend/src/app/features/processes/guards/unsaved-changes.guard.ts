import { CanDeactivateFn } from '@angular/router';

export interface DiscardableForm {
  hasUnsavedChanges(): boolean;
  confirmDiscard(): Promise<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<DiscardableForm> = component => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  return component.confirmDiscard();
};
