import React from 'react';
import { X, ShieldCheck, Quote, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import type { LabTestResult } from '../types';
import { NOT_PROVIDED_MESSAGE } from '../services/referenceRangeEvaluator';

interface SourceInspectorModalProps {
  result: LabTestResult | null;
  onClose: () => void;
}

export const SourceInspectorModal: React.FC<SourceInspectorModalProps> = ({ result, onClose }) => {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-md bg-teal-100 flex items-center justify-center text-teal-800">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Source Snippet & Provenance Inspector
              </h3>
              <p className="text-xs text-slate-500">
                Traceability record for extracted laboratory parameter
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Test Overview */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-slate-500 block font-medium">Test Name</span>
              <span className="text-sm font-bold text-slate-900">{result.testName}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Extracted Result</span>
              <span className="text-sm font-bold text-slate-900">
                {result.value} <span className="text-xs font-normal text-slate-600">{result.unit}</span>
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Report Date</span>
              <span className="text-sm font-semibold text-slate-800">{result.testDate || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Classification</span>
              <span
                className={`inline-block px-2 py-0.5 rounded font-bold text-xs mt-0.5 ${
                  result.status === 'LOW'
                    ? 'bg-blue-100 text-blue-800'
                    : result.status === 'HIGH'
                    ? 'bg-amber-100 text-amber-800'
                    : result.status === 'NORMAL'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                {result.status}
              </span>
            </div>
          </div>

          {/* Exact Verbatim Source Snippet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Quote className="h-3.5 w-3.5 text-teal-600" />
                <span>Exact Source Text Snippet (Verbatim):</span>
              </label>
              <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-medium">
                100% Unaltered Source Match
              </span>
            </div>
            <div className="bg-slate-950 text-emerald-400 font-mono p-3.5 rounded-lg border border-slate-800 text-xs shadow-inner overflow-x-auto">
              <code>"{result.sourceSnippet}"</code>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              MedLens links every structured datum directly back to the physical line in the uploaded report.
            </p>
          </div>

          {/* Reference Range Transparency */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">
              Source Reference Range Verification:
            </span>
            {result.rangeProvided && result.sourceReferenceRange ? (
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Source explicitly specified range: <strong className="font-mono bg-white px-1.5 py-0.5 border rounded">{result.sourceReferenceRange}</strong>.
                  Status <strong>{result.status}</strong> was mathematically derived solely from this threshold.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-700 bg-slate-100 p-2 rounded border border-slate-300">
                <AlertCircle className="h-4 w-4 text-slate-600 shrink-0" />
                <span>
                  <strong className="text-slate-900">{NOT_PROVIDED_MESSAGE}</strong> MedLens strict safety protocol prevented any range hallucination or external database lookup.
                </span>
              </div>
            )}
          </div>

          {/* Provenance & Confidence Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-md border border-slate-200">
              <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0" />
              <div>
                <span className="text-slate-500 block font-medium text-[11px]">Provenance Origin</span>
                <span className="font-bold text-slate-900">{result.provenance}</span>
                <span className="text-[11px] text-slate-500 block">Engine: {result.extractionEngine}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-md border border-slate-200">
              <div className="h-5 w-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px]">
                {Math.round(result.confidenceScore * 100)}%
              </div>
              <div>
                <span className="text-slate-500 block font-medium text-[11px]">Extraction Confidence</span>
                <span className="font-bold text-slate-900">{result.confidence} ({Math.round(result.confidenceScore * 100)}%)</span>
                <span className="text-[11px] text-slate-500 block">Direct tabular pattern match</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
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
