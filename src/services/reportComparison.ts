// MedLens Report Comparison Engine — Phase 3B
// Strictly numerical and documentary comparison between two processed reports.
// NON-NEGOTIABLE SAFETY RULES:
//   - Purely factual difference calculations
//   - Zero clinical interpretation (never says "improved", "worsened", "progressing")
//   - Never invents or cross-contaminates reference ranges
//   - Zero division safe (never outputs Infinity, NaN)
//   - Unit safety: never calculates change if units differ
//   - Asymmetric test safety: never treats missing tests as zero

import type { LabTestResult, MedicalReport, ReferenceRangeStatus } from '../types';
import { NOT_PROVIDED_MESSAGE } from './referenceRangeEvaluator';

export type ComparisonPresence = 'BOTH' | 'ONLY_PREVIOUS' | 'ONLY_CURRENT';

export type ComparisonChangeLabel =
  | 'CHANGED'
  | 'UNCHANGED'
  | 'ONLY IN PREVIOUS'
  | 'ONLY IN CURRENT'
  | 'NUMERICAL CHANGE UNAVAILABLE'
  | 'UNITS DIFFER';

export interface ComparedTestResult {
  normalizedKey: string;
  testName: string;
  presence: ComparisonPresence;
  changeLabel: ComparisonChangeLabel;

  // Previous
  previousValue: string | null;
  previousNumeric: number | null;
  previousUnit: string | null;
  previousRange: string;
  previousStatus: ReferenceRangeStatus | null;
  previousResult?: LabTestResult;

  // Current
  currentValue: string | null;
  currentNumeric: number | null;
  currentUnit: string | null;
  currentRange: string;
  currentStatus: ReferenceRangeStatus | null;
  currentResult?: LabTestResult;

  // Differences
  unit: string | null;
  absoluteChange: number | null;
  absoluteChangeDisplay: string | null;
  percentageChange: number | null;
  percentageChangeDisplay: string | null;
  comparisonNote?: string;
}

export interface ReportComparisonSummary {
  previousReport: MedicalReport;
  currentReport: MedicalReport;
  results: ComparedTestResult[];
  matchingCount: number;
  onlyPreviousCount: number;
  onlyCurrentCount: number;
}

/**
 * Normalizes test name for deterministic pairing between reports.
 * Matches canonical laboratory markers regardless of formatting variants.
 */
export function normalizeTestKey(rawName: string): string {
  const lower = rawName.toLowerCase().trim();

  // Ordered canonical keyword mappings
  if (lower.includes('hba1c') || lower.includes('hemoglobin a1c')) return 'hba1c';
  if (lower.includes('glucose')) return 'glucose';
  if (lower.includes('blood urea nitrogen') || lower === 'bun' || lower.startsWith('bun ') || lower.startsWith('bun(')) return 'bun';
  if (lower.includes('creatinine')) return 'creatinine';
  if (lower.includes('potassium')) return 'potassium';
  if (lower.includes('sodium')) return 'sodium';
  if (lower.includes('chloride')) return 'chloride';
  if (lower.includes('carbon dioxide') || lower.includes('co2') || lower.includes('bicarbonate')) return 'co2';
  if (lower.includes('calcium')) return 'calcium';
  if (lower.includes('total protein')) return 'total_protein';
  if (lower.includes('albumin/creatinine')) return 'urine_albumin_creatinine';
  if (lower.includes('albumin')) return 'albumin';
  if (lower.includes('bilirubin')) return 'bilirubin';
  if (lower.includes('alkaline phosphatase') || lower.includes('alp')) return 'alp';
  if (lower.includes('ast') || lower.includes('sgot')) return 'ast';
  if (lower.includes('alt') || lower.includes('sgpt')) return 'alt';
  if (lower.includes('egfr') || lower.includes('estimated gfr')) return 'egfr';
  if (lower.includes('cystatin')) return 'cystatin_c';
  if (lower.includes('uric acid')) return 'uric_acid';
  if (lower.includes('magnesium')) return 'magnesium';
  if (lower.includes('wbc') || lower.includes('white blood')) return 'wbc';
  if (lower.includes('rbc') || lower.includes('red blood')) return 'rbc';
  if (lower.includes('platelet')) return 'platelets';
  if (lower.includes('hematocrit')) return 'hematocrit';
  if (lower.includes('hemoglobin')) return 'hemoglobin';
  if (lower.includes('mcv')) return 'mcv';
  if (lower.includes('total cholesterol')) return 'total_cholesterol';
  if (lower.includes('triglycerides')) return 'triglycerides';
  if (lower.includes('hdl')) return 'hdl';
  if (lower.includes('ldl')) return 'ldl';
  if (lower.includes('tsh') || lower.includes('thyrotropin')) return 'tsh';
  if (lower.includes('free t4') || lower.includes('ft4')) return 'free_t4';
  if (lower.includes('insulin')) return 'insulin';

  // Generic fallback: normalize punctuation and spacing
  return lower.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Compares two processed MedicalReports in a purely deterministic, factual manner.
 * Does NOT mutate original report objects.
 * Never diagnoses, predicts, or makes clinical interpretations.
 */
export function compareMedicalReports(
  previousReport: MedicalReport,
  currentReport: MedicalReport
): ReportComparisonSummary {
  const prevMap = new Map<string, LabTestResult>();
  for (const r of previousReport.results) {
    const key = normalizeTestKey(r.testName);
    if (!prevMap.has(key)) {
      prevMap.set(key, r);
    }
  }

  const currMap = new Map<string, LabTestResult>();
  for (const r of currentReport.results) {
    const key = normalizeTestKey(r.testName);
    if (!currMap.has(key)) {
      currMap.set(key, r);
    }
  }

  // Preserve order: first all current report tests, then any previous-only tests
  const allKeys = new Set<string>();
  for (const r of currentReport.results) {
    allKeys.add(normalizeTestKey(r.testName));
  }
  for (const r of previousReport.results) {
    allKeys.add(normalizeTestKey(r.testName));
  }

  const comparedResults: ComparedTestResult[] = [];
  let matchingCount = 0;
  let onlyPreviousCount = 0;
  let onlyCurrentCount = 0;

  for (const key of allKeys) {
    const prev = prevMap.get(key);
    const curr = currMap.get(key);

    if (prev && curr) {
      matchingCount++;
      const testName = curr.testName || prev.testName;
      const prevRange = prev.rangeProvided && prev.sourceReferenceRange ? prev.sourceReferenceRange : NOT_PROVIDED_MESSAGE;
      const currRange = curr.rangeProvided && curr.sourceReferenceRange ? curr.sourceReferenceRange : NOT_PROVIDED_MESSAGE;

      const prevUnitClean = (prev.unit || '').trim();
      const currUnitClean = (curr.unit || '').trim();
      const unitsMatch = prevUnitClean.toLowerCase() === currUnitClean.toLowerCase();

      let absoluteChange: number | null = null;
      let absoluteChangeDisplay: string | null = null;
      let percentageChange: number | null = null;
      let percentageChangeDisplay: string | null = null;
      let comparisonNote: string | undefined = undefined;

      const prevNum = prev.numericValue;
      const currNum = curr.numericValue;

      const isPrevNumeric = prevNum !== null && !isNaN(prevNum);
      const isCurrNumeric = currNum !== null && !isNaN(currNum);

      let changeLabel: ComparisonChangeLabel;
      if (!isPrevNumeric || !isCurrNumeric) {
        comparisonNote = 'Numerical change not available.';
        if (prev.value && curr.value && prev.value.trim().toLowerCase() === curr.value.trim().toLowerCase()) {
          changeLabel = 'UNCHANGED';
        } else {
          changeLabel = 'NUMERICAL CHANGE UNAVAILABLE';
        }
      } else if (!unitsMatch) {
        comparisonNote = 'Units differ — numerical change not calculated.';
        changeLabel = 'UNITS DIFFER';
      } else {
        // Units match and both are numeric
        const unit = currUnitClean || prevUnitClean;
        const diff = Math.round((currNum - prevNum) * 1000) / 1000;
        absoluteChange = diff;
        const absSign = diff > 0 ? '+' : '';
        absoluteChangeDisplay = `${absSign}${diff} ${unit}`.trim();

        changeLabel = diff === 0 ? 'UNCHANGED' : 'CHANGED';

        // Percentage change: ((curr - prev) / prev) * 100
        if (prevNum === 0) {
          percentageChange = null;
          percentageChangeDisplay = 'Percentage change not available.';
        } else {
          const rawPct = ((currNum - prevNum) / Math.abs(prevNum)) * 100;
          const roundedPct = Math.round(rawPct * 10) / 10;
          percentageChange = roundedPct;
          const pctSign = roundedPct > 0 ? '+' : '';
          percentageChangeDisplay = `${pctSign}${roundedPct.toFixed(1)}%`;
        }
      }

      comparedResults.push({
        normalizedKey: key,
        testName,
        presence: 'BOTH',
        changeLabel,
        previousValue: prev.value,
        previousNumeric: prev.numericValue,
        previousUnit: prev.unit,
        previousRange: prevRange,
        previousStatus: prev.status,
        previousResult: prev,
        currentValue: curr.value,
        currentNumeric: curr.numericValue,
        currentUnit: curr.unit,
        currentRange: currRange,
        currentStatus: curr.status,
        currentResult: curr,
        unit: unitsMatch ? currUnitClean : `${prevUnitClean} vs ${currUnitClean}`,
        absoluteChange,
        absoluteChangeDisplay,
        percentageChange,
        percentageChangeDisplay,
        comparisonNote
      });
    } else if (curr && !prev) {
      onlyCurrentCount++;
      const currRange = curr.rangeProvided && curr.sourceReferenceRange ? curr.sourceReferenceRange : NOT_PROVIDED_MESSAGE;
      comparedResults.push({
        normalizedKey: key,
        testName: curr.testName,
        presence: 'ONLY_CURRENT',
        changeLabel: 'ONLY IN CURRENT',
        previousValue: null,
        previousNumeric: null,
        previousUnit: null,
        previousRange: NOT_PROVIDED_MESSAGE,
        previousStatus: null,
        currentValue: curr.value,
        currentNumeric: curr.numericValue,
        currentUnit: curr.unit,
        currentRange: currRange,
        currentStatus: curr.status,
        currentResult: curr,
        unit: curr.unit,
        absoluteChange: null,
        absoluteChangeDisplay: null,
        percentageChange: null,
        percentageChangeDisplay: null,
        comparisonNote: 'Only in current report'
      });
    } else if (prev && !curr) {
      onlyPreviousCount++;
      const prevRange = prev.rangeProvided && prev.sourceReferenceRange ? prev.sourceReferenceRange : NOT_PROVIDED_MESSAGE;
      comparedResults.push({
        normalizedKey: key,
        testName: prev.testName,
        presence: 'ONLY_PREVIOUS',
        changeLabel: 'ONLY IN PREVIOUS',
        previousValue: prev.value,
        previousNumeric: prev.numericValue,
        previousUnit: prev.unit,
        previousRange: prevRange,
        previousStatus: prev.status,
        previousResult: prev,
        currentValue: null,
        currentNumeric: null,
        currentUnit: null,
        currentRange: NOT_PROVIDED_MESSAGE,
        currentStatus: null,
        unit: prev.unit,
        absoluteChange: null,
        absoluteChangeDisplay: null,
        percentageChange: null,
        percentageChangeDisplay: null,
        comparisonNote: 'Only in previous report'
      });
    }
  }

  return {
    previousReport,
    currentReport,
    results: comparedResults,
    matchingCount,
    onlyPreviousCount,
    onlyCurrentCount
  };
}
