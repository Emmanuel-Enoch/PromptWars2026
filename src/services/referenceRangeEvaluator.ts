// Strict Source-Only Reference Range Evaluator
// CRITICAL SAFETY RULE:
// Reference ranges are NEVER invented or looked up from medical databases.
// Low, Normal, High are calculated STRICTLY from ranges explicitly provided in the source report.
// If the source does not provide a valid reference range, status MUST be 'NOT_PROVIDED_IN_SOURCE'.

import type { ReferenceRangeStatus } from '../types';

export interface EvaluatedRangeResult {
  status: ReferenceRangeStatus;
  rangeProvided: boolean;
  sourceReferenceRange: string | null;
  displayRange: string;
}

export const NOT_PROVIDED_MESSAGE = 'Reference range not provided in source.';

/**
 * Evaluates a numeric or string test value against the verbatim reference range from the source report.
 * Strictly adheres to source-only evaluation with zero medical presumption or hallucination.
 */
export function evaluateReferenceRange(
  numericValue: number | null,
  rawSourceRange: string | null | undefined
): EvaluatedRangeResult {
  // 1. Check if source range is missing, empty, or an explicit placeholder
  if (!rawSourceRange || typeof rawSourceRange !== 'string') {
    return {
      status: 'NOT_PROVIDED_IN_SOURCE',
      rangeProvided: false,
      sourceReferenceRange: null,
      displayRange: NOT_PROVIDED_MESSAGE
    };
  }

  const trimmed = rawSourceRange.trim();
  const lower = trimmed.toLowerCase();

  // Explicit non-range indicators in reports
  if (
    trimmed === '' ||
    trimmed === '-' ||
    trimmed === '--' ||
    trimmed === 'N/A' ||
    trimmed === 'NA' ||
    lower.includes('none provided') ||
    lower.includes('not provided') ||
    lower.includes('not established') ||
    lower.includes('unspecified') ||
    lower.includes('no ref') ||
    /^\.[0-9]+[a-z²³]/i.test(trimmed)
  ) {
    return {
      status: 'NOT_PROVIDED_IN_SOURCE',
      rangeProvided: false,
      sourceReferenceRange: trimmed || null,
      displayRange: NOT_PROVIDED_MESSAGE
    };
  }

  // If we don't have a numeric value to compare against, we cannot classify as Low/Normal/High
  if (numericValue === null || isNaN(numericValue)) {
    return {
      status: 'NOT_PROVIDED_IN_SOURCE',
      rangeProvided: true,
      sourceReferenceRange: trimmed,
      displayRange: trimmed
    };
  }

  // 2. Pattern: Standard Range [Min - Max] or [Min to Max]
  // Matches e.g. "70 - 99", "3.5 - 5.0", "135-145", "0.60 - 1.20", "12.0 to 16.0"
  const rangeMatch = trimmed.match(/^([0-9.]+)\s*(?:-|to)\s*([0-9.]+)$/i);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);

    if (!isNaN(min) && !isNaN(max)) {
      if (numericValue < min) {
        return {
          status: 'LOW',
          rangeProvided: true,
          sourceReferenceRange: trimmed,
          displayRange: trimmed
        };
      }
      if (numericValue > max) {
        return {
          status: 'HIGH',
          rangeProvided: true,
          sourceReferenceRange: trimmed,
          displayRange: trimmed
        };
      }
      return {
        status: 'NORMAL',
        rangeProvided: true,
        sourceReferenceRange: trimmed,
        displayRange: trimmed
      };
    }
  }

  // 3. Pattern: Upper Bound only [< Max] or [<= Max]
  // Matches e.g. "< 200", "< 150", "<= 100", "<5.7"
  const upperMatch = trimmed.match(/^<(=)?\s*([0-9.]+)$/);
  if (upperMatch) {
    const max = parseFloat(upperMatch[2]);
    if (!isNaN(max)) {
      if (numericValue > max) {
        return {
          status: 'HIGH',
          rangeProvided: true,
          sourceReferenceRange: trimmed,
          displayRange: trimmed
        };
      }
      return {
        status: 'NORMAL',
        rangeProvided: true,
        sourceReferenceRange: trimmed,
        displayRange: trimmed
      };
    }
  }

  // 4. Pattern: Lower Bound only [> Min] or [>= Min]
  // Matches e.g. "> 40", ">= 60", ">40.0"
  const lowerMatch = trimmed.match(/^>(=)?\s*([0-9.]+)$/);
  if (lowerMatch) {
    const min = parseFloat(lowerMatch[2]);
    if (!isNaN(min)) {
      if (numericValue < min) {
        return {
          status: 'LOW',
          rangeProvided: true,
          sourceReferenceRange: trimmed,
          displayRange: trimmed
        };
      }
      return {
        status: 'NORMAL',
        rangeProvided: true,
        sourceReferenceRange: trimmed,
        displayRange: trimmed
      };
    }
  }

  // 5. If the source range format cannot be deterministically mapped mathematically,
  // do NOT guess. Mark as NOT_PROVIDED_IN_SOURCE to avoid presenting uncertain info.
  return {
    status: 'NOT_PROVIDED_IN_SOURCE',
    rangeProvided: true,
    sourceReferenceRange: trimmed,
    displayRange: trimmed
  };
}
