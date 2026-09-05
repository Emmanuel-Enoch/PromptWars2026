// MedLens Evidence Intelligence Engine — Phase 3C
// Calculates Evidence Coverage, Needs Review Queue, and Confidence × Verification Matrix.
// Strictly factual and completeness-oriented.
// NON-NEGOTIABLE SAFETY RULES:
//   - Never labels coverage as "accuracy"
//   - Never implies an unstated reference range is an extraction error
//   - Never implies "high confidence + verified" means medically correct
//   - Purely derived from existing structured results and verification state

import type { LabTestResult, ConfidenceLevel } from '../types';

export interface EvidenceCoverageSummary {
  totalFindings: number;
  sourceLinkedCount: number;
  rangesDocumentedCount: number;
  humanVerifiedCount: number;
  needsReviewCount: number;
}

export interface NeedsReviewFinding {
  result: LabTestResult;
  reasons: string[];
  primaryReason: string;
}

export interface MatrixCellCounts {
  verified: number;
  unverified: number;
  total: number;
}

export interface ConfidenceVerificationMatrix {
  high: MatrixCellCounts;
  medium: MatrixCellCounts;
  low: MatrixCellCounts;
  /** Findings whose stored confidence is missing or not HIGH/MEDIUM/LOW. Never coerced. */
  unknown: MatrixCellCounts;
  totals: {
    verified: number;
    unverified: number;
    all: number;
  };
}

function isKnownConfidence(value: unknown): value is ConfidenceLevel {
  return value === 'HIGH' || value === 'MEDIUM' || value === 'LOW';
}

/**
 * Computes evidence coverage indicators from structured laboratory results.
 * Coverage reflects documentation completeness, NOT extraction accuracy.
 */
export function computeEvidenceCoverage(results: LabTestResult[]): EvidenceCoverageSummary {
  const totalFindings = results.length;
  if (totalFindings === 0) {
    return {
      totalFindings: 0,
      sourceLinkedCount: 0,
      rangesDocumentedCount: 0,
      humanVerifiedCount: 0,
      needsReviewCount: 0
    };
  }

  const sourceLinkedCount = results.filter(
    r => Boolean(r.sourceSnippet && r.sourceSnippet.trim().length > 0)
  ).length;

  const rangesDocumentedCount = results.filter(
    r =>
      r.rangeProvided &&
      r.status !== 'NOT_PROVIDED_IN_SOURCE' &&
      typeof r.sourceReferenceRange === 'string' &&
      r.sourceReferenceRange.trim().length > 0
  ).length;

  const humanVerifiedCount = results.filter(
    r => r.verificationStatus === 'VERIFIED' || r.verificationStatus === 'EDITED'
  ).length;

  const needsReviewCount = results.filter(isFindingNeedingReview).length;

  return {
    totalFindings,
    sourceLinkedCount,
    rangesDocumentedCount,
    humanVerifiedCount,
    needsReviewCount
  };
}

/**
 * Criteria for findings deserving human review.
 * Finding is in the Needs Review queue if it is currently UNREVIEWED.
 */
export function isFindingNeedingReview(r: LabTestResult): boolean {
  return r.verificationStatus === 'UNREVIEWED';
}

/**
 * Generates the list of findings needing human verification with factual reasons.
 * Missing source ranges are documented as unstated — never as extraction errors.
 */
export function getNeedsReviewFindings(results: LabTestResult[]): NeedsReviewFinding[] {
  return results
    .filter(isFindingNeedingReview)
    .map(r => {
      const reasons: string[] = [];
      if (r.confidence === 'LOW') {
        reasons.push('Low extraction confidence');
      } else if (r.confidence === 'MEDIUM') {
        reasons.push('Medium extraction confidence');
      }

      if (r.status === 'HIGH' || r.status === 'LOW') {
        reasons.push('Value outside documented source range');
      }

      if (!r.rangeProvided || r.status === 'NOT_PROVIDED_IN_SOURCE') {
        reasons.push('Reference range not documented in source');
      }

      if (reasons.length === 0) {
        reasons.push('Pending human verification');
      }

      return {
        result: r,
        reasons,
        primaryReason: reasons[0]
      };
    });
}

/**
 * Computes Confidence × Verification matrix counts.
 * Confidence and Verification are distinct concepts:
 *   - Confidence: extraction parser certainty
 *   - Verification: human reviewer status
 */
export function computeConfidenceVerificationMatrix(results: LabTestResult[]): ConfidenceVerificationMatrix {
  const rows: Record<ConfidenceLevel, { verified: number; unverified: number }> = {
    HIGH: { verified: 0, unverified: 0 },
    MEDIUM: { verified: 0, unverified: 0 },
    LOW: { verified: 0, unverified: 0 }
  };
  const unknown = { verified: 0, unverified: 0 };

  for (const r of results) {
    const isVerified = r.verificationStatus === 'VERIFIED' || r.verificationStatus === 'EDITED';
    if (!isKnownConfidence(r.confidence)) {
      if (isVerified) unknown.verified++;
      else unknown.unverified++;
      continue;
    }

    if (isVerified) {
      rows[r.confidence].verified++;
    } else {
      rows[r.confidence].unverified++;
    }
  }

  const highTotal = rows.HIGH.verified + rows.HIGH.unverified;
  const mediumTotal = rows.MEDIUM.verified + rows.MEDIUM.unverified;
  const lowTotal = rows.LOW.verified + rows.LOW.unverified;
  const unknownTotal = unknown.verified + unknown.unverified;

  const verifiedTotal =
    rows.HIGH.verified + rows.MEDIUM.verified + rows.LOW.verified + unknown.verified;
  const unverifiedTotal =
    rows.HIGH.unverified + rows.MEDIUM.unverified + rows.LOW.unverified + unknown.unverified;

  return {
    high: {
      verified: rows.HIGH.verified,
      unverified: rows.HIGH.unverified,
      total: highTotal
    },
    medium: {
      verified: rows.MEDIUM.verified,
      unverified: rows.MEDIUM.unverified,
      total: mediumTotal
    },
    low: {
      verified: rows.LOW.verified,
      unverified: rows.LOW.unverified,
      total: lowTotal
    },
    unknown: {
      verified: unknown.verified,
      unverified: unknown.unverified,
      total: unknownTotal
    },
    totals: {
      verified: verifiedTotal,
      unverified: unverifiedTotal,
      all: results.length
    }
  };
}
