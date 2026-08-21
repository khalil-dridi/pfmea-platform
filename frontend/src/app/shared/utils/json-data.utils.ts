export type JsonObject = Record<string, unknown>;

export interface JsonComparisonRow {
  field: string;
  label: string;
  previous: string;
  next: string;
  changed: boolean;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Process Name',
  processNumber: 'Process Number',
  id: 'ID',
  createdAt: 'Created At',
  updatedAt: 'Updated At',
  entityType: 'Entity Type',
  entityId: 'Entity ID',
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  role: 'Role',
  enabled: 'Enabled',
  status: 'Status',
  operation: 'Operation',
  reviewComment: 'Review Comment'
};

const FIELD_ORDER = [
  'name',
  'processNumber',
  'firstName',
  'lastName',
  'email',
  'role',
  'enabled',
  'status',
  'operation',
  'id',
  'createdAt',
  'updatedAt'
];

export function parseJsonObject(raw: string | null): JsonObject | null {
  if (!raw || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as JsonObject;
    }

    return null;
  } catch {
    return null;
  }
}

export function isEmptyJsonObject(value: JsonObject | null): boolean {
  return value === null || Object.keys(value).length === 0;
}

export function formatJsonFallback(raw: string | null): string {
  if (!raw || raw.trim().length === 0) {
    return '';
  }

  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function buildJsonComparisonRows(
  oldData: string | null,
  newData: string | null
): JsonComparisonRow[] | null {
  const previous = parseJsonObject(oldData);
  const next = parseJsonObject(newData);

  if (previous === null && next === null) {
    return null;
  }

  const keys = orderedKeys(previous, next);

  if (keys.length === 0) {
    return null;
  }

  return keys.map(field => {
    const previousValue = formatFieldValue(previous?.[field]);
    const nextValue = formatFieldValue(next?.[field]);

    return {
      field,
      label: fieldLabel(field),
      previous: isEmptyJsonObject(previous) ? '—' : previousValue,
      next: nextValue,
      changed: previousValue !== nextValue
    };
  });
}

function orderedKeys(previous: JsonObject | null, next: JsonObject | null): string[] {
  const keys = new Set<string>([
    ...Object.keys(previous ?? {}),
    ...Object.keys(next ?? {})
  ]);

  const ordered = FIELD_ORDER.filter(key => keys.has(key));
  const remaining = [...keys].filter(key => !FIELD_ORDER.includes(key)).sort();

  return [...ordered, ...remaining];
}

function fieldLabel(field: string): string {
  if (field in FIELD_LABELS) {
    return FIELD_LABELS[field];
  }

  return field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, character => character.toUpperCase());
}

function formatFieldValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return formatComparisonDateTime(value);
    }

    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value) && value.length >= 3 && value.every(item => typeof item === 'number')) {
    const year = value[0];
    const month = value[1];
    const day = value[2];
    const hour = value[3] ?? 0;
    const minute = value[4] ?? 0;

    if (
      typeof year === 'number' &&
      typeof month === 'number' &&
      typeof day === 'number' &&
      typeof hour === 'number' &&
      typeof minute === 'number'
    ) {
      return formatComparisonDateTime(
        `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`
      );
    }
  }

  return JSON.stringify(value);
}

function formatComparisonDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
