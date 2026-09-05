// RejectResultModal — captures mandatory rejection reason before marking a result REJECTED.
// Evidence (original source snippet) is always preserved.

import React, { useState } from 'react';
import { X, XCircle, AlertTriangle } from 'lucide-react';
import type { LabTestResult } from '../types';

interface RejectResultModalProps {
  result: LabTestResult | null;
  onConfirmReject: (resultId: string, reason: string) => void;
  onClose: () => void;
}

export const RejectResultModal: React.FC<RejectResultModalProps> = ({
  result,
  onConfirmReject,
  onClose
}) => {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);

  if (!result) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setReasonError(true);
      return;
    }
    onConfirmReject(result.id, reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-rose-100 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-rose-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Reject Extracted Result</h3>
              <p className="text-xs text-slate-500">Original extraction and source snippet will be preserved</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Result Summary */}
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <span className="text-slate-500 block mb-1 font-medium">Rejecting result:</span>
            <span className="font-bold text-slate-900 text-sm">{result.testName}</span>
            <span className="text-slate-600 ml-2 font-mono">{result.value} {result.unit}</span>
          </div>

          {/* Evidence Preservation Notice */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-2.5 rounded-md">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-amber-900">
              Rejection does <strong>not</strong> delete this result. The original source snippet and extracted value
              are preserved permanently for audit compliance. The result will be clearly marked as REJECTED.
            </span>
          </div>

          {/* Reason Field */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Rejection Reason <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => { setReason(e.target.value); setReasonError(false); }}
              placeholder="e.g. Duplicate of Glucose result above. Specimen labelling error identified post-analysis."
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-rose-500 outline-hidden text-sm ${
                reasonError ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
              }`}
            />
            {reasonError && (
              <p className="text-rose-600 text-[11px] mt-1">A rejection reason is required for audit compliance.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-md transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" />
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};
