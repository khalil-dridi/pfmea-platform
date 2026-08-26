import { HttpErrorResponse } from '@angular/common/http';
import { AiMessageResponse } from '../models/ai-message-response.model';
import { ConversationStartResponse } from '../models/conversation-start-response.model';

export const SUGGESTED_PROMPTS: readonly string[] = [
  'What are the HIGH priority risks?',
  'Which failure causes have no Risk Analysis?',
  'Which risks have been optimized?',
  'What optimization actions are still pending?',
  'What are the main areas needing attention?'
];

export type AssistantContentBlock =
  | { readonly kind: 'paragraph'; readonly text: string }
  | { readonly kind: 'list'; readonly items: readonly string[] }
  | { readonly kind: 'table'; readonly headers: readonly string[]; readonly rows: readonly (readonly string[])[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isConversationStartResponse(value: unknown): value is ConversationStartResponse {
  return (
    isRecord(value) &&
    typeof value['conversationId'] === 'string' &&
    typeof value['processId'] === 'string' &&
    typeof value['processStepId'] === 'string' &&
    typeof value['message'] === 'string'
  );
}

export function isAiMessageResponse(value: unknown): value is AiMessageResponse {
  return (
    isRecord(value) &&
    typeof value['conversationId'] === 'string' &&
    typeof value['message'] === 'string'
  );
}

export function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatMessageTime(value: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(value);
}

export function extractApiErrorMessage(error: HttpErrorResponse): string | null {
  const body = error.error;

  if (typeof body === 'string' && body.trim().length > 0) {
    return body;
  }

  if (isRecord(body) && typeof body['message'] === 'string') {
    return body['message'];
  }

  return null;
}

export function isConversationNotFoundError(error: HttpErrorResponse): boolean {
  if (error.status === 404) {
    return true;
  }

  const message = extractApiErrorMessage(error)?.toLowerCase() ?? error.message.toLowerCase();
  return message.includes('conversation not found');
}

export function resolveStartConversationError(error: HttpErrorResponse): string {
  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You are not authorized to start an AI analysis.';
  }

  if (error.status === 400 || error.status === 404) {
    return 'Please check the selected Process and Process Step and try again.';
  }

  return 'Unable to start the AI analysis.';
}

export function resolveSendMessageError(error: HttpErrorResponse): string {
  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You are not authorized to continue this conversation.';
  }

  return 'Unable to get a response. Please try again.';
}

export function resolveResetConversationError(error: HttpErrorResponse): string {
  if (isConversationNotFoundError(error)) {
    return 'This AI conversation is no longer available.';
  }

  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  return 'Unable to reset the conversation. Please try again.';
}

export function parseAssistantContent(content: string): AssistantContentBlock[] {
  const normalized = content.replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return [];
  }

  return normalized.split(/\n{2,}/).flatMap(chunk => parseContentChunk(chunk));
}

function parseContentChunk(chunk: string): AssistantContentBlock[] {
  const lines = chunk
    .split('\n')
    .map(line => line.trimEnd())
    .filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    return [];
  }

  const table = parseTable(lines);

  if (table) {
    return [table];
  }

  if (lines.every(isListItem)) {
    return [
      {
        kind: 'list',
        items: lines.map(line => line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, '').trim())
      }
    ];
  }

  return [
    {
      kind: 'paragraph',
      text: lines.join('\n')
    }
  ];
}

function isListItem(line: string): boolean {
  return /^\s*(?:[-*]|\d+[.)])\s+\S/.test(line);
}

function parseTable(lines: readonly string[]): AssistantContentBlock | null {
  const tableLines = lines.filter(line => line.includes('|') && !isTableSeparator(line));

  if (tableLines.length < 2 || tableLines.length !== lines.filter(line => !isTableSeparator(line)).length) {
    return null;
  }

  const rows = tableLines.map(splitTableRow).filter(row => row.some(cell => cell.length > 0));

  if (rows.length < 2) {
    return null;
  }

  const headers = rows[0];
  const body = rows.slice(1);

  if (!headers || body.some(row => row.length === 0)) {
    return null;
  }

  return {
    kind: 'table',
    headers,
    rows: body
  };
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line);
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map(cell => cell.trim());
}
