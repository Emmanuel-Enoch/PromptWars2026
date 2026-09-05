// RejectResultModal — captures mandatory rejection reason before marking a result REJECTED.
// Evidence (original source snippet) is always preserved.

import React, { useState, useEffect, useRef } from 'react';
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
  // ALL hooks must be called unconditionally — before any conditional return.
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Reset form state when a new result is targeted.
  useEffect(() => {
    if (result) {
      setReason('');
      setReasonError(false);
    }
  }, [result]);

  // Handle Escape key — only active when modal is open (result is non-null).
  useEffect(() => {
    if (!result) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, result]);

  // Focus management — only active when modal is open (result is non-null).
  useEffect(() => {
    if (!result) return;
    previousActiveElement.current = document.activeElement as HTMLElement;

    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (!modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleTab);
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [result]);

  // Guard: render nothing when no result is selected. All hooks are already called above.
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
      ref={modalRef}
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-rose-100 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-rose-700" aria-hidden="true" />
            </div>
            <div>
              <h3 id="reject-modal-title" className="text-sm font-bold text-slate-900">Reject Extracted Result</h3>
              <p className="text-xs text-slate-500">Original extraction and source snippet will be preserved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close reject dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
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
            <label htmlFor="reject-reason" className="block font-semibold text-slate-800 mb-1">
              Rejection Reason <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="reject-reason"
              ref={textareaRef}
              rows={3}
              value={reason}
              onChange={e => { setReason(e.target.value); setReasonError(false); }}
              placeholder="e.g. Duplicate of Glucose result above. Specimen labelling error identified post-analysis."
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-rose-500 outline-hidden text-sm ${
                reasonError ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
              }`}
              aria-required="true"
              aria-invalid={reasonError}
              aria-describedby={reasonError ? 'reject-reason-error' : 'reject-reason-desc'}
            />
            <span id="reject-reason-desc" className="sr-only">Provide a reason for rejection for audit compliance</span>
            {reasonError && (
              <p id="reject-reason-error" className="text-rose-600 text-[11px] mt-1" role="alert">A rejection reason is required for audit compliance.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            aria-label="Cancel rejection and close dialog"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-md transition-colors"
            aria-label="Confirm rejection of this result"
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};
