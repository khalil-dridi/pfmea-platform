export type ProcessNoticeKind = 'created' | 'updated' | 'pending-create' | 'pending-update';

export const PROCESS_NOTICE_KEY = 'processNotice';
export const PROCESS_NOTICE_USER_KEY = 'processNoticeUserId';

export interface ProcessNoticePayload {
  notice: ProcessNoticeKind;
  userId: string;
}

export function noticeForCreateStatus(status: number): ProcessNoticeKind {
  return status === 202 ? 'pending-create' : 'created';
}

export function noticeForUpdateStatus(status: number): ProcessNoticeKind {
  return status === 202 ? 'pending-update' : 'updated';
}

export function toProcessNoticeNavigationState(
  notice: ProcessNoticeKind,
  userId: string | undefined
): Record<string, string> {
  return {
    [PROCESS_NOTICE_KEY]: notice,
    [PROCESS_NOTICE_USER_KEY]: userId ?? ''
  };
}

export function readProcessNoticeFromState(state: unknown): ProcessNoticePayload | null {
  if (typeof state !== 'object' || state === null) {
    return null;
  }

  const record = state as Record<string, unknown>;
  const notice = record[PROCESS_NOTICE_KEY];
  const userId = record[PROCESS_NOTICE_USER_KEY];

  if (!isProcessNoticeKind(notice) || typeof userId !== 'string' || userId.length === 0) {
    return null;
  }

  return { notice, userId };
}

export function isPendingNotice(notice: ProcessNoticeKind): boolean {
  return notice === 'pending-create' || notice === 'pending-update';
}

export function isProcessNoticeKind(value: unknown): value is ProcessNoticeKind {
  return (
    value === 'created' ||
    value === 'updated' ||
    value === 'pending-create' ||
    value === 'pending-update'
  );
}

export function clearProcessNoticeFromHistory(): void {
  if (typeof history === 'undefined' || typeof history.replaceState !== 'function') {
    return;
  }

  const currentState = history.state;

  if (typeof currentState !== 'object' || currentState === null) {
    return;
  }

  if (!(PROCESS_NOTICE_KEY in currentState) && !(PROCESS_NOTICE_USER_KEY in currentState)) {
    return;
  }

  const nextState: Record<string, unknown> = { ...currentState };
  delete nextState[PROCESS_NOTICE_KEY];
  delete nextState[PROCESS_NOTICE_USER_KEY];
  history.replaceState(nextState, '');
}
