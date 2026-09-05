// EditResultModal — compact editor for human-verified corrections to extracted lab values.
// SAFETY: Never adds diagnosis, treatment, or dosage recommendations.
// Original extracted values are preserved unchanged in result.originalExtracted.

import React, { useState } from 'react';
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
  const [testName, setTestName] = useState(result?.testName ?? '');
  const [value, setValue] = useState(result?.value ?? '');
  const [unit, setUnit] = useState(result?.unit ?? '');
  const [editReason, setEditReason] = useState('');
  const [reasonError, setReasonError] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-violet-50 border-b border-violet-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-violet-100 flex items-center justify-center">
              <Pencil className="h-4 w-4 text-violet-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Edit Extracted Result</h3>
              <p className="text-xs text-slate-500">Clinical Reviewer correction — original extraction preserved</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Safety Notice */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-2.5 rounded-md">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-amber-900">
              Edits are limited to correcting extraction errors (e.g. OCR artefacts, formatting issues).
              Do <strong>not</strong> alter values to reflect a diagnosis, inferred condition, or clinical interpretation.
            </span>
          </div>

          {/* Original Extracted Values */}
          {orig && (
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
              <div className="flex items-center gap-1.5 mb-2 text-slate-600 font-semibold">
                <Info className="h-3.5 w-3.5 text-slate-500" />
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
              <label className="block font-semibold text-slate-800 mb-1">Test Name</label>
              <input
                type="text"
                value={testName}
                onChange={e => setTestName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-hidden text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Result Value</label>
                <input
                  type="text"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-hidden text-sm font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-800 mb-1">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-hidden text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Edit Reason — Required */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Reason for Edit <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={2}
              value={editReason}
              onChange={e => { setEditReason(e.target.value); setReasonError(false); }}
              placeholder="e.g. Correcting OCR artefact — source report shows '1.42' not '142'"
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-violet-500 outline-hidden text-sm ${
                reasonError ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
              }`}
            />
            {reasonError && (
              <p className="text-rose-600 text-[11px] mt-1">A reason is required for audit compliance.</p>
            )}
          </div>

          {!hasChanges && editReason.trim() === '' && (
            <p className="text-[11px] text-slate-500 italic">No changes made yet.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges && !editReason.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-violet-700 hover:bg-violet-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Pencil className="h-3.5 w-3.5" />
            Save Edit & Record Audit Entry
          </button>
        </div>
      </div>
    </div>
  );
};
