// AuditTrailPanel — sliding side panel showing all audit events for the current report.
// Each event has timestamp, actor, action, affected test, values, and reason where applicable.

import React from 'react';
import {
  X,
  History,
  CheckCircle2,
  Pencil,
  XCircle,
  FileText,
  Clock
} from 'lucide-react';
import type { AuditEntry, AuditAction } from '../types';

interface AuditTrailPanelProps {
  auditLog: AuditEntry[];
  isOpen: boolean;
  onClose: () => void;
}

function actionIcon(action: AuditAction) {
  switch (action) {
    case 'VERIFIED':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
    case 'EDITED':
      return <Pencil className="h-4 w-4 text-violet-600 shrink-0" />;
    case 'REJECTED':
      return <XCircle className="h-4 w-4 text-rose-600 shrink-0" />;
    case 'EXTRACTED':
      return <FileText className="h-4 w-4 text-teal-600 shrink-0" />;
    case 'REJECTION_LIFTED':
      return <Clock className="h-4 w-4 text-slate-500 shrink-0" />;
    default:
      return <Clock className="h-4 w-4 text-slate-500 shrink-0" />;
  }
}

function actionColor(action: AuditAction): string {
  switch (action) {
    case 'VERIFIED':         return 'bg-emerald-50 border-emerald-200';
    case 'EDITED':           return 'bg-violet-50 border-violet-200';
    case 'REJECTED':         return 'bg-rose-50 border-rose-200';
    case 'EXTRACTED':        return 'bg-teal-50 border-teal-200';
    case 'REJECTION_LIFTED': return 'bg-slate-50 border-slate-200';
    default:                 return 'bg-slate-50 border-slate-200';
  }
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  } catch {
    return iso;
  }
}

export const AuditTrailPanel: React.FC<AuditTrailPanelProps> = ({
  auditLog,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const sortedLog = [...auditLog].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white border-l border-slate-200 shadow-2xl flex flex-col">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <History className="h-5 w-5 text-teal-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Audit Trail</h2>
              <p className="text-xs text-slate-500">
                {auditLog.length} event{auditLog.length !== 1 ? 's' : ''} recorded for this report
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedLog.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 mb-1">No audit events yet.</p>
              <p>Verification actions (Verify, Edit, Reject) will be logged here.</p>
            </div>
          ) : (
            sortedLog.map(entry => (
              <div
                key={entry.id}
                className={`rounded-lg border p-3 text-xs ${actionColor(entry.action)}`}
              >
                {/* Event Header */}
                <div className="flex items-start gap-2">
                  {actionIcon(entry.action)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">
                        {entry.actor}
                        <span className="font-normal text-slate-600 mx-1">
                          {entry.action === 'VERIFIED' && 'verified'}
                          {entry.action === 'EDITED' && 'edited'}
                          {entry.action === 'REJECTED' && 'rejected'}
                          {entry.action === 'EXTRACTED' && 'extracted'}
                          {entry.action === 'REJECTION_LIFTED' && 'lifted rejection for'}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {entry.testName}
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>

                    {/* Value Change */}
                    {entry.previousValue && entry.newValue && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono">
                        <span className="line-through text-slate-500">{entry.previousValue}</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-bold text-slate-800">{entry.newValue}</span>
                      </div>
                    )}
                    {entry.previousValue && !entry.newValue && (
                      <div className="mt-1 text-[11px] font-mono text-slate-600">
                        Was: <span className="text-slate-800">{entry.previousValue}</span>
                      </div>
                    )}

                    {/* Reason */}
                    {entry.reason && (
                      <div className="mt-1.5 text-[11px] text-slate-700 italic border-t border-slate-200 pt-1.5">
                        Reason: "{entry.reason}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
          Audit events are persisted in browser localStorage and survive page refreshes.
        </div>
      </div>
    </>
  );
};
