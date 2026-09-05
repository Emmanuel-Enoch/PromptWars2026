// MedLens Evidence Intelligence Panel — Phase 3C
// Incorporates:
//   1. Evidence Coverage Metric Strip
//   2. Human-in-the-Loop Needs Review Queue
//   3. Confidence × Verification Matrix
// Fully non-interpretive, factual, and derived from existing report data.

import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  TableProperties,
  ListFilter
} from 'lucide-react';
import type { MedicalReport, LabTestResult } from '../types';
import {
  computeEvidenceCoverage,
  getNeedsReviewFindings,
  computeConfidenceVerificationMatrix
} from '../services/evidenceIntelligence';

interface EvidenceIntelligencePanelProps {
  report: MedicalReport;
  onInspectFinding: (result: LabTestResult) => void;
  onVerifyFinding?: (result: LabTestResult) => void;
  onSelectFindingInTable?: (resultId: string) => void;
}

export const EvidenceIntelligencePanel: React.FC<EvidenceIntelligencePanelProps> = ({
  report,
  onInspectFinding,
  onVerifyFinding
}) => {
  const [showMatrix, setShowMatrix] = useState<boolean>(false);
  const [showReviewQueue, setShowReviewQueue] = useState<boolean>(true);

  const coverage = computeEvidenceCoverage(report.results);
  const needsReview = getNeedsReviewFindings(report.results);
  const matrix = computeConfidenceVerificationMatrix(report.results);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden mb-4">
      {/* PART 1: EVIDENCE COVERAGE METRIC STRIP */}
      <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-700" />
            <span className="text-xs font-bold text-slate-900 tracking-tight uppercase">
              Evidence Coverage & Completeness
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (Factual coverage indicators — not an accuracy score)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMatrix(v => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors ${
                showMatrix
                  ? 'bg-teal-700 text-white border-teal-800'
                  : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
              }`}
              title="View Confidence × Verification Matrix"
            >
              <TableProperties className="h-3 w-3" />
              <span>Matrix</span>
              {showMatrix ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {needsReview.length > 0 && (
              <button
                type="button"
                onClick={() => setShowReviewQueue(v => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors ${
                  showReviewQueue
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-amber-800 hover:bg-amber-50 border-amber-200'
                }`}
              >
                <ListFilter className="h-3 w-3 text-amber-700" />
                <span>Review Queue ({needsReview.length})</span>
                {showReviewQueue ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </div>
        </div>

        {/* 4 Compact Metric Tiles in a clean strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
          {/* Tile 1: Source-linked findings */}
          <div className="bg-white p-2.5 rounded border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-600">Source-Linked</span>
              <FileText className="h-3.5 w-3.5 text-teal-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-bold text-slate-900 font-mono">
                {coverage.sourceLinkedCount}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                / {coverage.totalFindings}
              </span>
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              Traceable to raw report snippet
            </div>
          </div>

          {/* Tile 2: Documented ranges */}
          <div className="bg-white p-2.5 rounded border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-600">Documented Ranges</span>
              <Info className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-bold text-slate-900 font-mono">
                {coverage.rangesDocumentedCount}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                / {coverage.totalFindings}
              </span>
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              Reference range in source text
            </div>
          </div>

          {/* Tile 3: Human verified */}
          <div className="bg-white p-2.5 rounded border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-600">Human Verified</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base font-bold text-slate-900 font-mono">
                {coverage.humanVerifiedCount}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                / {coverage.totalFindings}
              </span>
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              Verified or edited by reviewer
            </div>
          </div>

          {/* Tile 4: Needs review */}
          <div className={`p-2.5 rounded border shadow-2xs ${
            coverage.needsReviewCount > 0
              ? 'bg-amber-50/70 border-amber-200'
              : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700">Needs Review</span>
              {coverage.needsReviewCount > 0 ? (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-base font-bold font-mono ${
                coverage.needsReviewCount > 0 ? 'text-amber-900' : 'text-emerald-900'
              }`}>
                {coverage.needsReviewCount}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                pending
              </span>
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              {coverage.needsReviewCount > 0 ? 'Awaiting human verification' : 'No unreviewed findings'}
            </div>
          </div>
        </div>
      </div>

      {/* PART 4: CONFIDENCE × VERIFICATION MATRIX (Expandable) */}
      {showMatrix && (
        <div className="p-4 bg-slate-50/60 border-b border-slate-200 animate-fadeIn">
          <div className="max-w-xl mx-auto bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <TableProperties className="h-3.5 w-3.5 text-teal-700" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  Confidence × Verification Matrix
                </span>
              </div>
              <span className="text-[10px] text-slate-600">
                Extraction Certainty vs Human Status
              </span>
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="py-1.5 px-3 font-semibold">Confidence</th>
                  <th className="py-1.5 px-3 font-semibold text-center text-emerald-800 bg-emerald-50/50">
                    Verified
                  </th>
                  <th className="py-1.5 px-3 font-semibold text-center text-slate-700 bg-slate-50">
                    Unverified
                  </th>
                  <th className="py-1.5 px-3 font-semibold text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                <tr>
                  <td className="py-1.5 px-3 font-sans font-medium text-slate-800">High</td>
                  <td className="py-1.5 px-3 text-center bg-emerald-50/30 text-emerald-900 font-bold">
                    {matrix.high.verified}
                  </td>
                  <td className="py-1.5 px-3 text-center text-slate-700">
                    {matrix.high.unverified}
                  </td>
                  <td className="py-1.5 px-3 text-center text-slate-500">
                    {matrix.high.total}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-sans font-medium text-slate-800">Medium</td>
                  <td className="py-1.5 px-3 text-center bg-emerald-50/30 text-emerald-900 font-bold">
                    {matrix.medium.verified}
                  </td>
                  <td className="py-1.5 px-3 text-center text-slate-700">
                    {matrix.medium.unverified}
                  </td>
                  <td className="py-1.5 px-3 text-center text-slate-500">
                    {matrix.medium.total}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-sans font-medium text-slate-800">Low</td>
                  <td className="py-1.5 px-3 text-center bg-emerald-50/30 text-emerald-900 font-bold">
                    {matrix.low.verified}
                  </td>
                  <td className="py-1.5 px-3 text-center text-slate-700">
                    {matrix.low.unverified}
                  </td>
                  <td className="py-1.5 px-3 text-center text-slate-500">
                    {matrix.low.total}
                  </td>
                </tr>
                {matrix.unknown.total > 0 && (
                  <tr>
                    <td className="py-1.5 px-3 font-sans font-medium text-slate-800">Unknown</td>
                    <td className="py-1.5 px-3 text-center bg-emerald-50/30 text-emerald-900 font-bold">
                      {matrix.unknown.verified}
                    </td>
                    <td className="py-1.5 px-3 text-center text-slate-700">
                      {matrix.unknown.unverified}
                    </td>
                    <td className="py-1.5 px-3 text-center text-slate-500">
                      {matrix.unknown.total}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 font-semibold bg-slate-50/60">
                  <td className="py-1.5 px-3 text-slate-700 font-sans">Total</td>
                  <td className="py-1.5 px-3 text-center text-emerald-800 font-mono">
                    {matrix.totals.verified}
                  </td>
                  <td className="py-1.5 px-3 text-center text-slate-700 font-mono">
                    {matrix.totals.unverified}
                  </td>
                  <td className="py-1.5 px-3 text-center text-slate-900 font-mono">
                    {matrix.totals.all}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-2 text-[10px] text-slate-600 italic">
              Confidence indicates parser pattern certainty; verification indicates human review status.
              Neither implies independent clinical correctness.
            </div>
          </div>
        </div>
      )}

      {/* PART 2: NEEDS REVIEW QUEUE (Collapsible) */}
      {showReviewQueue && needsReview.length > 0 && (
        <div className="p-4 bg-amber-50/30 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <AlertTriangle className="h-3 w-3 text-amber-700" />
                {needsReview.length} {needsReview.length === 1 ? 'Finding Needs' : 'Findings Need'} Review
              </span>
              <span className="text-xs text-slate-500">
                Human verification queue
              </span>
            </div>
            <span className="text-[11px] text-slate-600 hidden sm:inline">
              Click any item to inspect source or verify
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {needsReview.map(({ result, primaryReason }) => (
              <div
                key={result.id}
                className="bg-white rounded border border-amber-200/90 hover:border-teal-500 p-2.5 transition-all hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 leading-snug">
                      {result.testName}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800 whitespace-nowrap">
                      {result.value} <span className="text-[11px] font-normal text-slate-500">{result.unit}</span>
                    </span>
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    <Info className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                    <span className="truncate">{primaryReason}</span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-600 font-mono">
                    Ref: {result.rangeProvided && result.sourceReferenceRange ? result.sourceReferenceRange : 'Unstated'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onInspectFinding(result)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Inspect source snippet"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      <span>Inspect</span>
                    </button>
                    {onVerifyFinding && (
                      <button
                        type="button"
                        onClick={() => onVerifyFinding(result)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                        title="Quick verify"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        <span>Verify</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
