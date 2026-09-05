// SourceInspectorModal — extended with full provenance chain (Phase 2).
// Shows: SOURCE → EXTRACTION → STRUCTURED RESULT → RANGE EVALUATION → VERIFICATION
// Original source snippet remains unchanged even after human edits.

import React from 'react';
import {
  X,
  ShieldCheck,
  Quote,
  AlertCircle,
  FileText,
  CheckCircle2,
  ArrowRight,
  Pencil,
  XCircle,
  Clock,
  Info
} from 'lucide-react';
import type { LabTestResult, AuditEntry } from '../types';
import { NOT_PROVIDED_MESSAGE } from '../services/referenceRangeEvaluator';

interface SourceInspectorModalProps {
  result: LabTestResult | null;
  auditLog?: AuditEntry[];
  onClose: () => void;
}

function formatTS(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  } catch {
    return iso;
  }
}

function VerificationBadge({ status }: { status: string }) {
  switch (status) {
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="h-3 w-3" /> VERIFIED
        </span>
      );
    case 'EDITED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-100 text-violet-800 border border-violet-300">
          <Pencil className="h-3 w-3" /> EDITED
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="h-3 w-3" /> REJECTED
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
          <Clock className="h-3 w-3" /> UNREVIEWED
        </span>
      );
  }
}

function StepHeader({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="h-5 w-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0">
        {step}
      </div>
      <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function ChainArrow() {
  return (
    <div className="flex justify-center my-2">
      <ArrowRight className="h-4 w-4 text-slate-300 rotate-90" />
    </div>
  );
}

export const SourceInspectorModal: React.FC<SourceInspectorModalProps> = ({
  result,
  auditLog = [],
  onClose
}) => {
  if (!result) return null;

  const orig = result.originalExtracted;
  // Entries relevant to this result
  const resultAuditEntries = auditLog.filter(e => e.resultId === result.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const wasEdited = result.verificationStatus === 'EDITED' && orig;
  const sourceSnippetToShow = orig?.sourceSnippet ?? result.sourceSnippet;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-md bg-teal-100 flex items-center justify-center text-teal-800">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Full Provenance Chain Inspector
              </h3>
              <p className="text-xs text-slate-500">
                Source → Extraction → Structured Result → Range Evaluation → Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-4 text-xs flex-1">

          {/* STEP 1: SOURCE */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <StepHeader step={1} label="Source Document" />
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Quote className="h-3.5 w-3.5 text-teal-600" />
                Verbatim Source Text Snippet:
              </label>
              <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-medium">
                100% Unaltered
              </span>
            </div>
            <div className="bg-slate-950 text-emerald-400 font-mono p-3 rounded-md border border-slate-800 text-xs overflow-x-auto">
              <code>"{sourceSnippetToShow}"</code>
            </div>
            {wasEdited && (
              <div className="flex items-start gap-1.5 mt-2 text-[11px] text-violet-700 bg-violet-50 p-2 rounded border border-violet-200">
                <Info className="h-3 w-3 shrink-0 mt-0.5" />
                This is the <strong>original</strong> source snippet. It remains unchanged even though a reviewer has edited the structured values above.
              </div>
            )}
          </div>

          <ChainArrow />

          {/* STEP 2: EXTRACTION */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <StepHeader step={2} label="Extraction" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-500 block font-medium">Engine</span>
                <span className="font-semibold text-slate-900">{result.extractionEngine}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Provenance</span>
                <span className="font-semibold text-slate-900">{result.provenance}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Confidence</span>
                <span className="font-semibold text-slate-900">
                  {result.confidence} ({Math.round(result.confidenceScore * 100)}%)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Report Date</span>
                <span className="font-semibold text-slate-900">{result.testDate || 'Not specified'}</span>
              </div>
            </div>
            {orig && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <span className="text-slate-500 font-medium block mb-1">Originally Extracted Values:</span>
                <div className="font-mono text-[11px] text-slate-700 flex gap-4 flex-wrap">
                  <span><span className="text-slate-400">Test:</span> {orig.testName}</span>
                  <span><span className="text-slate-400">Value:</span> {orig.value}</span>
                  <span><span className="text-slate-400">Unit:</span> {orig.unit || '—'}</span>
                </div>
              </div>
            )}
          </div>

          <ChainArrow />

          {/* STEP 3: STRUCTURED RESULT */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <StepHeader step={3} label="Structured Result" />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500 block font-medium">Test Name</span>
                <span className="font-bold text-slate-900 text-sm">{result.testName}</span>
                {wasEdited && orig && orig.testName !== result.testName && (
                  <span className="text-violet-600 text-[10px] block">(edited from: {orig.testName})</span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Current Value</span>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {result.value} <span className="text-slate-500 font-normal">{result.unit}</span>
                </span>
                {wasEdited && orig && (orig.value !== result.value || orig.unit !== result.unit) && (
                  <span className="text-violet-600 text-[10px] block">(edited from: {orig.value} {orig.unit})</span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Verification</span>
                <div className="mt-0.5">
                  <VerificationBadge status={result.verificationStatus} />
                </div>
              </div>
            </div>
          </div>

          <ChainArrow />

          {/* STEP 4: REFERENCE RANGE EVALUATION */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <StepHeader step={4} label="Reference Range Evaluation" />
            {result.rangeProvided && result.sourceReferenceRange ? (
              <div className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span>
                    Source explicitly provided range:{' '}
                    <strong className="font-mono bg-white px-1.5 py-0.5 border border-slate-200 rounded">
                      {result.sourceReferenceRange}
                    </strong>
                  </span>
                  <div className="mt-1">
                    Status <strong>{result.status}</strong> was mathematically derived solely from this source-provided threshold.
                    No external medical database was consulted.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-slate-700 bg-slate-100 p-2.5 rounded border border-slate-300">
                <AlertCircle className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">{NOT_PROVIDED_MESSAGE}</strong>
                  <div className="mt-1 text-slate-600">
                    MedLens strict safety protocol prevented any reference range assumption or external lookup.
                    Status is <strong>NOT_PROVIDED_IN_SOURCE</strong>.
                  </div>
                </div>
              </div>
            )}
          </div>

          <ChainArrow />

          {/* STEP 5: VERIFICATION */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <StepHeader step={5} label="Human Verification" />
            <div className="flex items-center gap-3 mb-3">
              <VerificationBadge status={result.verificationStatus} />
              {result.verifiedBy && (
                <span className="text-[11px] text-slate-600">
                  by <strong>{result.verifiedBy}</strong>
                  {result.verifiedAt ? ` at ${formatTS(result.verifiedAt)}` : ''}
                </span>
              )}
            </div>

            {result.editReason && (
              <div className="text-[11px] text-violet-800 bg-violet-50 p-2 rounded border border-violet-200 mt-1">
                Edit Reason: "{result.editReason}"
              </div>
            )}
            {result.rejectionReason && (
              <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded border border-rose-200 mt-1">
                Rejection Reason: "{result.rejectionReason}"
              </div>
            )}

            {/* Relevant audit entries */}
            {resultAuditEntries.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-700 block mb-2 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                  Audit History for this result:
                </span>
                <div className="space-y-1.5">
                  {resultAuditEntries.map(entry => (
                    <div key={entry.id} className="text-[11px] text-slate-700 flex items-start gap-2 bg-white border border-slate-200 p-2 rounded">
                      <Clock className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">{entry.actor}</span>
                        {' '}{entry.action.toLowerCase()}{' '}
                        {entry.previousValue && entry.newValue && (
                          <span className="font-mono">
                            <span className="line-through text-slate-400">{entry.previousValue}</span>
                            {' → '}
                            <span className="font-bold">{entry.newValue}</span>
                          </span>
                        )}
                        <span className="text-slate-400 ml-2">{formatTS(entry.timestamp)}</span>
                        {entry.reason && (
                          <div className="text-slate-500 italic mt-0.5">"{entry.reason}"</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resultAuditEntries.length === 0 && result.verificationStatus === 'UNREVIEWED' && (
              <p className="text-[11px] text-slate-400 italic">
                No verification actions recorded yet for this result.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
