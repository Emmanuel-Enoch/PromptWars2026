// VerificationActions — inline Verify / Edit / Reject buttons for each lab result row.
// Phase 2 component. Never introduces diagnosis, prescription, or treatment recommendations.

import React from 'react';
import { CheckCircle2, Pencil, XCircle, RotateCcw } from 'lucide-react';
import type { LabTestResult } from '../types';

interface VerificationActionsProps {
  result: LabTestResult;
  onVerify: (resultId: string) => void;
  onEdit: (result: LabTestResult) => void;
  onReject: (result: LabTestResult) => void;
  onUndoReject?: (resultId: string) => void;
}

export const VerificationActions: React.FC<VerificationActionsProps> = ({
  result,
  onVerify,
  onEdit,
  onReject,
  onUndoReject
}) => {
  const status = result.verificationStatus;

  if (status === 'REJECTED') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="h-3 w-3" />
          REJECTED
        </span>
        {onUndoReject && (
          <button
            onClick={e => { e.stopPropagation(); onUndoReject(result.id); }}
            title="Lift rejection — restore to UNREVIEWED"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Lift
          </button>
        )}
      </div>
    );
  }

  if (status === 'VERIFIED') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          VERIFIED
        </span>
        <button
          onClick={e => { e.stopPropagation(); onEdit(result); }}
          title="Edit this verified result"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </div>
    );
  }

  if (status === 'EDITED') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-100 text-violet-800 border border-violet-300">
          <Pencil className="h-3 w-3" />
          EDITED
        </span>
        <button
          onClick={e => { e.stopPropagation(); onVerify(result.id); }}
          title="Mark this edited result as verified"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
        >
          <CheckCircle2 className="h-3 w-3" />
          Verify
        </button>
      </div>
    );
  }

  // UNREVIEWED — show full action set
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={e => { e.stopPropagation(); onVerify(result.id); }}
        title="Mark as verified by reviewer"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
        aria-label={`Verify ${result.testName}`}
      >
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        Verify
      </button>
      <button
        onClick={e => { e.stopPropagation(); onEdit(result); }}
        title="Edit extracted value or metadata"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors"
        aria-label={`Edit ${result.testName}`}
      >
        <Pencil className="h-3 w-3" aria-hidden="true" />
        Edit
      </button>
      <button
        onClick={e => { e.stopPropagation(); onReject(result); }}
        title="Reject this result (evidence preserved)"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
        aria-label={`Reject ${result.testName}`}
      >
        <XCircle className="h-3 w-3" aria-hidden="true" />
        Reject
      </button>
    </div>
  );
};
