import { JsonComparisonRow, JsonObject, isEmptyJsonObject, parseJsonObject } from '../../../shared/utils/json-data.utils';
import { formatControlListValue } from '../../processes/utils/control-list.utils';
import { formatRequestDateTime } from './change-request.utils';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOOSE_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_ID_PATTERN = /^[0-9a-f]{32}$/i;

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  processName: 'Process',
  processNumber: 'Process Number',
  description: 'Description',
  elementNumber: 'Element Number',
  stepNumber: 'Step Number',
  processStepName: 'Process Step',
  processStep: 'Process Step',
  workElementName: 'Work Element',
  workElement: 'Work Element',
  failureModeName: 'Failure Mode',
  failureCauseName: 'Failure Cause',
  functionName: 'Function',
  failureCode: 'Failure Code',
  ourPlant: 'Our Plant',
  shipToPlant: 'Ship-to Plant',
  endUser: 'End User',
  currentPreventionControl: 'Current Prevention Controls',
  currentDetectionControl: 'Current Detection Controls',
  detectionScope: 'Detection Scope',
  actionPriority: 'Action Priority',
  specialProcess: 'Special Process',
  specialCharacteristic: 'Special Characteristic',
  remarks: 'Remarks',
  actionType: 'Action Type',
  responsiblePerson: 'Responsible Person',
  targetCompletionDate: 'Target Completion Date',
  completionDate: 'Completion Date',
  evidence: 'Evidence',
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  role: 'Role',
  enabled: 'Enabled',
  status: 'Status',
  type: 'Type',
  title: 'Title',
  severity: 'Severity',
  occurrence: 'Occurrence',
  detection: 'Detection',
  rpn: 'RPN',
  action: 'Action',
  prevention: 'Prevention',
  detectionAction: 'Detection Action'
};

const FIELD_ORDER = [
  'name',
  'processName',
  'processNumber',
  'title',
  'type',
  'description',
  'elementNumber',
  'stepNumber',
  'processStepName',
  'processStep',
  'workElementName',
  'workElement',
  'failureModeName',
  'failureCauseName',
  'functionName',
  'failureCode',
  'ourPlant',
  'shipToPlant',
  'endUser',
  'currentPreventionControl',
  'occurrence',
  'currentDetectionControl',
  'detection',
  'detectionScope',
  'severity',
  'actionPriority',
  'specialProcess',
  'specialCharacteristic',
  'remarks',
  'actionType',
  'responsiblePerson',
  'targetCompletionDate',
  'status',
  'evidence',
  'completionDate',
  'firstName',
  'lastName',
  'email',
  'role',
  'enabled',
  'rpn'
];

const COMPANION_NAME_KEYS: Record<string, string[]> = {
  processId: ['processName', 'process'],
  processStepId: ['processStepName', 'processStep'],
  workElementId: ['workElementName', 'workElement'],
  failureModeId: ['failureModeName', 'failureMode'],
  failureCauseId: ['failureCauseName', 'failureCause'],
  functionId: ['functionName', 'function'],
  optimizationId: ['optimizationName', 'optimization']
};

export function buildReviewComparisonRows(
  oldData: string | null,
  newData: string | null,
  entityType?: string
): JsonComparisonRow[] | null {
  const previous = presentPayload(parseJsonObject(oldData), entityType);
  const next = presentPayload(parseJsonObject(newData), entityType);

  if (previous.length === 0 && next.length === 0) {
    return null;
  }

  const keys = [...new Set([...previous.map(item => item.key), ...next.map(item => item.key)])];
  const ordered = [
    ...FIELD_ORDER.filter(key => keys.includes(key)),
    ...keys.filter(key => !FIELD_ORDER.includes(key))
  ];

  return ordered.map(key => {
    const previousField = previous.find(item => item.key === key);
    const nextField = next.find(item => item.key === key);
    const previousValue = previousField?.value ?? '—';
    const nextValue = nextField?.value ?? '—';

    return {
      field: key,
      label: previousField?.label ?? nextField?.label ?? reviewFieldLabel(key, entityType),
      previous: previousValue,
      next: nextValue,
      changed: previousValue !== nextValue
    };
  });
}

export function hasReviewPreviousData(oldData: string | null): boolean {
  return presentPayload(parseJsonObject(oldData)).length > 0;
}

export function displayBusinessText(value: string | null | undefined): string {
  const text = value?.trim();

  if (!text || isTechnicalIdValue(text)) {
    return '—';
  }

  return text;
}

function presentPayload(
  payload: JsonObject | null,
  entityType?: string
): Array<{ key: string; label: string; value: string }> {
  if (isEmptyJsonObject(payload) || !payload) {
    return [];
  }

  const fields: Array<{ key: string; label: string; value: string }> = [];
  const usedKeys = new Set<string>();

  for (const [key, value] of Object.entries(payload)) {
    if (isMetaTimestampKey(key) || usedKeys.has(key)) {
      continue;
    }

    if (isTechnicalIdKey(key)) {
      const companion = readCompanionName(payload, key);

      if (companion && !usedKeys.has(companion.key)) {
        fields.push(companion);
        usedKeys.add(companion.key);
      }

      continue;
    }

    const formatted =
      key === 'currentPreventionControl' || key === 'currentDetectionControl'
        ? formatControlListValue(value)
        : formatReviewValue(value);

    if (formatted === null) {
      continue;
    }

    fields.push({
      key,
      label: reviewFieldLabel(key, entityType),
      value: formatted
    });
    usedKeys.add(key);
  }

  return fields;
}

function readCompanionName(
  payload: JsonObject,
  idKey: string
): { key: string; label: string; value: string } | null {
  const candidates = COMPANION_NAME_KEYS[idKey] ?? [];

  for (const candidate of candidates) {
    if (!(candidate in payload)) {
      continue;
    }

    const formatted = formatReviewValue(payload[candidate]);

    if (formatted && formatted !== '—') {
      return {
        key: candidate,
        label: reviewFieldLabel(candidate),
        value: formatted
      };
    }
  }

  return null;
}

function formatReviewValue(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  if (typeof value === 'string') {
    if (isTechnicalIdValue(value)) {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return formatRequestDateTime(value);
    }

    return value;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return null;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    for (const key of ['name', 'title', 'processName', 'processNumber']) {
      const formatted = formatReviewValue(record[key]);

      if (formatted && formatted !== '—') {
        return formatted;
      }
    }

    return null;
  }

  return null;
}

function reviewFieldLabel(field: string, entityType?: string): string {
  if (field === 'name' && entityType) {
    const entityLabel = entityNameLabel(entityType);

    if (entityLabel) {
      return entityLabel;
    }
  }

  if (field in FIELD_LABELS) {
    return FIELD_LABELS[field];
  }

  return field
    .replace(/Id$/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, character => character.toUpperCase());
}

function entityNameLabel(entityType: string): string | null {
  const normalized = entityType.trim().toUpperCase().replaceAll('-', '_');

  if (normalized === 'PROCESS') {
    return 'Process';
  }

  if (normalized === 'PROCESS_STEP') {
    return 'Process Step';
  }

  if (normalized === 'WORK_ELEMENT' || normalized === 'PROCESS_WORK_ELEMENT') {
    return 'Work Element';
  }

  if (normalized === 'FUNCTION') {
    return 'Function';
  }

  if (normalized === 'FAILURE_MODE') {
    return 'Failure Mode';
  }

  if (normalized === 'FAILURE_CAUSE') {
    return 'Failure Cause';
  }

  if (normalized === 'FAILURE_EFFECT') {
    return 'Failure Effect';
  }

  if (normalized === 'RISK_ANALYSIS') {
    return 'Risk Analysis';
  }

  if (normalized === 'OPTIMIZATION') {
    return 'Optimization';
  }

  if (normalized === 'OPTIMIZATION_ACTION' || normalized === 'ACTION') {
    return 'Action';
  }

  return null;
}

function isTechnicalIdKey(key: string): boolean {
  return (
    /^(id|uuid|guid|entityId|entity_id|requestedById|reviewedById)$/i.test(key) ||
    /(_id|Id)$/.test(key)
  );
}

function isMetaTimestampKey(key: string): boolean {
  return /^(createdAt|updatedAt|created_at|updated_at)$/i.test(key);
}

function isTechnicalIdValue(value: string): boolean {
  const trimmed = value.trim();
  return UUID_PATTERN.test(trimmed) || LOOSE_UUID_PATTERN.test(trimmed) || HEX_ID_PATTERN.test(trimmed);
}
