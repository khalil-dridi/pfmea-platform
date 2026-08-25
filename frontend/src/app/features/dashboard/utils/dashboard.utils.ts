import { HttpErrorResponse } from '@angular/common/http';
import {
  AreasNeedingAttention,
  DashboardOverview,
  OptimizationActions,
  OptimizationCoverage,
  PfmeaCoverage,
  RiskAnalysisCoverage,
  RiskDistribution,
  RiskImprovement
} from '../models/dashboard-overview.model';

export type RiskBand = 'high' | 'medium' | 'low' | 'notDefined';

export interface RiskBandItem {
  key: RiskBand;
  label: string;
  value: number;
}

export interface DonutSegment extends RiskBandItem {
  color: string;
  dashArray: string;
  dashOffset: number;
}

export interface ImprovementRow {
  key: RiskBand;
  label: string;
  current: number;
  optimized: number;
  currentWidth: number;
  optimizedWidth: number;
}

const RISK_BANDS: readonly { key: RiskBand; label: string; color: string }[] = [
  { key: 'high', label: 'High', color: '#c2414b' },
  { key: 'medium', label: 'Medium', color: '#d97706' },
  { key: 'low', label: 'Low', color: '#3d9b6a' },
  { key: 'notDefined', label: 'Not defined', color: '#8b889c' }
];

const DONUT_RADIUS = 54;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export const DONUT_RADIUS_PX = DONUT_RADIUS;
export const DONUT_CIRCUMFERENCE_PX = DONUT_CIRCUMFERENCE;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCoverage(value: unknown): value is PfmeaCoverage {
  return (
    isRecord(value) &&
    isFiniteNumber(value['processes']) &&
    isFiniteNumber(value['processSteps']) &&
    isFiniteNumber(value['workElements']) &&
    isFiniteNumber(value['functions']) &&
    isFiniteNumber(value['failureModes']) &&
    isFiniteNumber(value['failureCauses'])
  );
}

function isRiskDistribution(value: unknown): value is RiskDistribution {
  return (
    isRecord(value) &&
    isFiniteNumber(value['high']) &&
    isFiniteNumber(value['medium']) &&
    isFiniteNumber(value['low']) &&
    isFiniteNumber(value['notDefined'])
  );
}

function isRiskAnalysisCoverage(value: unknown): value is RiskAnalysisCoverage {
  return (
    isRecord(value) &&
    isFiniteNumber(value['totalFailureCauses']) &&
    isFiniteNumber(value['withRiskAnalysis']) &&
    isFiniteNumber(value['withoutRiskAnalysis']) &&
    isFiniteNumber(value['percentage'])
  );
}

function isOptimizationCoverage(value: unknown): value is OptimizationCoverage {
  return (
    isRecord(value) &&
    isFiniteNumber(value['totalRiskAnalyses']) &&
    isFiniteNumber(value['withOptimization']) &&
    isFiniteNumber(value['withoutOptimization']) &&
    isFiniteNumber(value['percentage'])
  );
}

function isRiskImprovement(value: unknown): value is RiskImprovement {
  return (
    isRecord(value) &&
    isRiskDistribution(value['current']) &&
    isRiskDistribution(value['optimized'])
  );
}

function isOptimizationActions(value: unknown): value is OptimizationActions {
  return (
    isRecord(value) &&
    isFiniteNumber(value['total']) &&
    isFiniteNumber(value['inApplication']) &&
    isFiniteNumber(value['closed'])
  );
}

function isAreasNeedingAttention(value: unknown): value is AreasNeedingAttention {
  return (
    isRecord(value) &&
    isFiniteNumber(value['failureCausesWithoutRiskAnalysis']) &&
    isFiniteNumber(value['riskAnalysesWithoutOptimization']) &&
    isFiniteNumber(value['highPriorityRisks']) &&
    isFiniteNumber(value['optimizationActionsInApplication'])
  );
}

export function isDashboardOverview(value: unknown): value is DashboardOverview {
  return (
    isRecord(value) &&
    isCoverage(value['coverage']) &&
    isRiskDistribution(value['riskDistribution']) &&
    isRiskAnalysisCoverage(value['riskAnalysisCoverage']) &&
    isOptimizationCoverage(value['optimizationCoverage']) &&
    isRiskImprovement(value['riskImprovement']) &&
    isOptimizationActions(value['optimizationActions']) &&
    isAreasNeedingAttention(value['areasNeedingAttention'])
  );
}

export function resolveDashboardApiError(error: HttpErrorResponse): string {
  if (error.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (error.status === 403) {
    return 'You are not authorized to view dashboard data.';
  }

  return 'Unable to load P-FMEA dashboard.';
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatCoveragePercent(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function distributionTotal(distribution: RiskDistribution): number {
  return distribution.high + distribution.medium + distribution.low + distribution.notDefined;
}

export function riskBandItems(distribution: RiskDistribution): RiskBandItem[] {
  return RISK_BANDS.map(band => ({
    key: band.key,
    label: band.label,
    value: distribution[band.key]
  }));
}

export function riskBandColor(key: RiskBand): string {
  const band = RISK_BANDS.find(item => item.key === key);
  return band?.color ?? '#8b889c';
}

export function buildDonutSegments(distribution: RiskDistribution): DonutSegment[] {
  const total = distributionTotal(distribution);

  if (total <= 0) {
    return [];
  }

  let offset = 0;

  return RISK_BANDS.map(band => {
    const value = distribution[band.key];
    const length = (value / total) * DONUT_CIRCUMFERENCE;
    const segment: DonutSegment = {
      key: band.key,
      label: band.label,
      value,
      color: band.color,
      dashArray: `${length} ${DONUT_CIRCUMFERENCE}`,
      dashOffset: -offset
    };
    offset += length;
    return segment;
  });
}

export function buildImprovementRows(improvement: RiskImprovement): ImprovementRow[] {
  const max = Math.max(
    improvement.current.high,
    improvement.current.medium,
    improvement.current.low,
    improvement.current.notDefined,
    improvement.optimized.high,
    improvement.optimized.medium,
    improvement.optimized.low,
    improvement.optimized.notDefined,
    0
  );

  return RISK_BANDS.map(band => {
    const current = improvement.current[band.key];
    const optimized = improvement.optimized[band.key];

    return {
      key: band.key,
      label: band.label,
      current,
      optimized,
      currentWidth: max === 0 ? 0 : (current / max) * 100,
      optimizedWidth: max === 0 ? 0 : (optimized / max) * 100
    };
  });
}

export function actionCompletionRate(actions: OptimizationActions): number | null {
  if (actions.total <= 0) {
    return null;
  }

  return (actions.closed / actions.total) * 100;
}

export function barWidth(value: number, total: number): number {
  if (total <= 0 || value <= 0) {
    return 0;
  }

  return (value / total) * 100;
}

export const RING_RADIUS_PX = 36;
export const RING_CIRCUMFERENCE_PX = 2 * Math.PI * RING_RADIUS_PX;

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 100);
}

export function ringDashOffset(percentage: number): number {
  return RING_CIRCUMFERENCE_PX * (1 - clampPercent(percentage) / 100);
}

export function isDashboardEmpty(overview: DashboardOverview): boolean {
  return (
    overview.coverage.processes === 0 &&
    overview.coverage.processSteps === 0 &&
    overview.coverage.workElements === 0 &&
    overview.coverage.functions === 0 &&
    overview.coverage.failureModes === 0 &&
    overview.coverage.failureCauses === 0
  );
}
