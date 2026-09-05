// EditResultModal — compact editor for human-verified corrections to extracted lab values.
// SAFETY: Never adds diagnosis, treatment, or dosage recommendations.
// Original extracted values are preserved unchanged in result.originalExtracted.

import React, { useState, useEffect, useRef } from 'react';
import { X, Pencil, AlertTriangle, Info } from 'lucide-react';
import type { LabTestResult } from '../types';

interface EditResultModalProps {
  result: LabTestResult | null;
  onSave: (resultId: string, edits: EditPayload) => void;
  onClose: () => void;
}

export interface EditPayload {
  testName: string;
  value: string;
  unit: string;
  editReason: string;
}

export const EditResultModal: React.FC<EditResultModalProps> = ({ result, onSave, onClose }) => {
  // ALL hooks must be called unconditionally — before any conditional return.
  const [testName, setTestName] = useState(result?.testName ?? '');
  const [value, setValue] = useState(result?.value ?? '');
  const [unit, setUnit] = useState(result?.unit ?? '');
  const [editReason, setEditReason] = useState('');
  const [reasonError, setReasonError] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Sync local state when the result prop changes (e.g. different result opened).
  useEffect(() => {
    if (result) {
      setTestName(result.testName);
      setValue(result.value);
      setUnit(result.unit);
      setEditReason('');
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
    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus first input when modal opens
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }

    // Trap focus within modal
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
      // Restore focus when modal closes
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [result]);

  // Guard: render nothing when no result is selected. All hooks are already called above.
  if (!result) return null;

  const orig = result.originalExtracted;

  const hasChanges =
    testName.trim() !== result.testName ||
    value.trim() !== result.value ||
    unit.trim() !== result.unit;

  const handleSave = () => {
    if (!editReason.trim()) {
      setReasonError(true);
      return;
    }
    onSave(result.id, {
      testName: testName.trim(),
      value: value.trim(),
      unit: unit.trim(),
      editReason: editReason.trim()
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      ref={modalRef}
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-violet-50 border-b border-violet-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-violet-100 flex items-center justify-center">
              <Pencil className="h-4 w-4 text-violet-700" aria-hidden="true" />
            </div>
            <div>
              <h3 id="edit-modal-title" className="text-sm font-bold text-slate-900">Edit Extracted Result</h3>
              <p className="text-xs text-slate-500">Clinical Reviewer correction — original extraction preserved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close edit dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Safety Notice */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-2.5 rounded-md">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-amber-900">
              Edits are limited to correcting extraction errors (e.g. OCR artefacts, formatting issues).
              Do <strong>not</strong> alter values to reflect a diagnosis, inferred condition, or clinical interpretation.
            </span>
          </div>

          {/* Original Extracted Values */}
          {orig && (
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
              <div className="flex items-center gap-1.5 mb-2 text-slate-600 font-semibold">
                <Info className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>Original Extracted Values (immutable reference):</span>
              </div>
              <div className="font-mono text-[11px] text-slate-700 grid grid-cols-3 gap-2">
                <div><span className="text-slate-500">Name:</span> {orig.testName}</div>
                <div><span className="text-slate-500">Value:</span> {orig.value}</div>
                <div><span className="text-slate-500">Unit:</span> {orig.unit || '—'}</div>
              </div>
            </div>
          )}

          {/* Editable Fields */}
          <div className="space-y-3">
            <div>
              <label htmlFor="edit-test-name" className="block font-semibold text-slate-800 mb-1">Test Name</label>
              <input
                id="edit-test-name"
                ref={firstInputRef}
                type="text"
                value={testName}
                onChange={e => setTestName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-hidden text-sm"
                aria-describedby="edit-test-name-desc"
              />
              <span id="edit-test-name-desc" className="sr-only">Enter the corrected test name</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-value" className="block font-semibold text-slate-800 mb-1">Result Value</label>
                <input
                  id="edit-value"
                  type="text"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-hidden text-sm font-mono"
                  aria-describedby="edit-value-desc"
                />
                <span id="edit-value-desc" className="sr-only">Enter the corrected result value</span>
              </div>
              <div>
                <label htmlFor="edit-unit" className="block font-semibold text-slate-800 mb-1">Unit</label>
                <input
                  id="edit-unit"
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-hidden text-sm font-mono"
                  aria-describedby="edit-unit-desc"
                />
                <span id="edit-unit-desc" className="sr-only">Enter the corrected unit</span>
              </div>
            </div>
          </div>

          {/* Edit Reason — Required */}
          <div>
            <label htmlFor="edit-reason" className="block font-semibold text-slate-800 mb-1">
              Reason for Edit <span className="text-rose-600" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <textarea
              id="edit-reason"
              rows={2}
              value={editReason}
              onChange={e => { setEditReason(e.target.value); setReasonError(false); }}
              placeholder="e.g. Correcting OCR artefact — source report shows '1.42' not '142'"
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-violet-500 outline-hidden text-sm ${
                reasonError ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
              }`}
              aria-required="true"
              aria-invalid={reasonError}
              aria-describedby={reasonError ? 'edit-reason-error' : 'edit-reason-desc'}
            />
            <span id="edit-reason-desc" className="sr-only">Provide a reason for this edit for audit compliance</span>
            {reasonError && (
              <p id="edit-reason-error" className="text-rose-600 text-[11px] mt-1" role="alert">A reason is required for audit compliance.</p>
            )}
          </div>

          {!hasChanges && editReason.trim() === '' && (
            <p className="text-[11px] text-slate-500 italic">No changes made yet.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            aria-label="Cancel edit and close dialog"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges && !editReason.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-violet-700 hover:bg-violet-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Save edit and record audit entry"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Save Edit &amp; Record Audit Entry
          </button>
        </div>
      </div>
    </div>
  );
};
