import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  HelpCircle
} from 'lucide-react';
import type { LabTestResult, MedicalReport, ReferenceRangeStatus } from '../types';
import type { EditPayload } from './EditResultModal';
import { NOT_PROVIDED_MESSAGE } from '../services/referenceRangeEvaluator';
import { SourceInspectorModal } from './SourceInspectorModal';
import { VerificationActions } from './VerificationActions';
import { EditResultModal } from './EditResultModal';
import { RejectResultModal } from './RejectResultModal';

interface StructuredResultsTableProps {
  report: MedicalReport;
  onVerify: (resultId: string) => void;
  onEdit: (resultId: string, edits: EditPayload) => void;
  onReject: (resultId: string, reason: string) => void;
  onUndoReject: (resultId: string) => void;
}

export const StructuredResultsTable: React.FC<StructuredResultsTableProps> = ({
  report,
  onVerify,
  onEdit,
  onReject,
  onUndoReject
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReferenceRangeStatus>('ALL');
  const [inspectedResult, setInspectedResult] = useState<LabTestResult | null>(null);
  const [editingResult, setEditingResult] = useState<LabTestResult | null>(null);
  const [rejectingResult, setRejectingResult] = useState<LabTestResult | null>(null);

  // Filter results
  const filteredResults = report.results.filter(res => {
    const matchesSearch = 
      res.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.value.toString().includes(searchTerm);

    const matchesStatus = statusFilter === 'ALL' || res.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Summary counts — only count actual lab results (never metadata)
  const totalCount = report.results.length;
  const normalCount = report.results.filter(r => r.status === 'NORMAL').length;
  const highCount = report.results.filter(r => r.status === 'HIGH').length;
  const lowCount = report.results.filter(r => r.status === 'LOW').length;
  const unprovidedCount = report.results.filter(r => r.status === 'NOT_PROVIDED_IN_SOURCE').length;
  const verifiedCount = report.results.filter(r =>
    r.verificationStatus === 'VERIFIED' || r.verificationStatus === 'EDITED'
  ).length;
  const rejectedCount = report.results.filter(r => r.verificationStatus === 'REJECTED').length;

  const auditLog = report.auditLog ?? [];

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Report Summary Card Header */}
      <div className="p-6 bg-slate-50/80 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h2 className="text-base font-bold text-slate-900">
                {report.title || 'Structured Laboratory Findings'}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold border border-teal-200">
                {report.results.length} Parameters
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                report.isDemoData
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-teal-50 text-teal-800 border-teal-300'
              }`}>
                {report.isDemoData ? 'Source: Synthetic Benchmark' : 'Source: USER_PROVIDED Report'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Facility: <span className="font-semibold text-slate-700">{report.facility}</span> • 
              Report Date: <span className="font-semibold text-slate-700">{report.reportDate}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
              <span>Provenance: <strong>{report.extractionEngine}</strong> (LOCAL_EXTRACTED)</span>
            </span>
          </div>
        </div>

        {/* Evidence Pipeline Flow */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-white px-3 py-1.5 rounded-md border border-slate-200 mb-3 overflow-x-auto">
          <span className="font-bold text-slate-800 shrink-0">Pipeline:</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium whitespace-nowrap">
            1. {report.isDemoData ? 'Synthetic Benchmark Source' : 'USER_PROVIDED Source'}
          </span>
          <span className="text-slate-400">→</span>
          <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-medium whitespace-nowrap">
            2. Deterministic Local Parser
          </span>
          <span className="text-slate-400">→</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium whitespace-nowrap">
            3. Source-Only Range Evaluation
          </span>
          <span className="text-slate-400">→</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium whitespace-nowrap">
            4. Human Review & Audit
          </span>
        </div>

        {/* Clinical Summary Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 pt-1">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Total</span>
            <span className="text-xl font-bold text-slate-900">{totalCount}</span>
          </div>

          <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>Normal</span>
            </span>
            <span className="text-xl font-bold text-emerald-900">{normalCount}</span>
          </div>

          <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-amber-600" />
              <span>High</span>
            </span>
            <span className="text-xl font-bold text-amber-900">{highCount}</span>
          </div>

          <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-blue-800 flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3 text-blue-600" />
              <span>Low</span>
            </span>
            <span className="text-xl font-bold text-blue-900">{lowCount}</span>
          </div>

          <div className="bg-slate-100/70 p-3 rounded-lg border border-slate-300 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-slate-500" />
              <span>No Range</span>
            </span>
            <span className="text-xl font-bold text-slate-800">{unprovidedCount}</span>
          </div>

          <div className="bg-teal-50/60 p-3 rounded-lg border border-teal-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-teal-800 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-teal-600" />
              <span>Verified</span>
            </span>
            <span className="text-xl font-bold text-teal-900">{verifiedCount}</span>
          </div>

          {rejectedCount > 0 && (
            <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-rose-800 block">Rejected</span>
              <span className="text-xl font-bold text-rose-900">{rejectedCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search test name or units..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            <span>Filter:</span>
          </span>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({totalCount})
          </button>

          <button
            onClick={() => setStatusFilter('NORMAL')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              statusFilter === 'NORMAL'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Normal ({normalCount})
          </button>

          <button
            onClick={() => setStatusFilter('HIGH')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              statusFilter === 'HIGH'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            High ({highCount})
          </button>

          <button
            onClick={() => setStatusFilter('LOW')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              statusFilter === 'LOW'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Low ({lowCount})
          </button>

          <button
            onClick={() => setStatusFilter('NOT_PROVIDED_IN_SOURCE')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              statusFilter === 'NOT_PROVIDED_IN_SOURCE'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            No Range ({unprovidedCount})
          </button>
        </div>
      </div>

      {/* Structured Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Test</th>
              <th className="py-3 px-4">Value</th>
              <th className="py-3 px-4">Unit</th>
              <th className="py-3 px-4">Reference Range</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Source Origin</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  <AlertCircle className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                  <span>No laboratory parameters match the current filters.</span>
                </td>
              </tr>
            ) : (
              filteredResults.map((res) => {
                const isHigh = res.status === 'HIGH';
                const isLow = res.status === 'LOW';
                const isNormal = res.status === 'NORMAL';
                const isNoRange = res.status === 'NOT_PROVIDED_IN_SOURCE';
                const isRejected = res.verificationStatus === 'REJECTED';

                return (
                  <tr
                    key={res.id}
                    className={`hover:bg-slate-50 transition-colors group ${isRejected ? 'opacity-60' : ''}`}
                  >
                    {/* Test Name */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span className={isRejected ? 'line-through text-slate-400' : ''}>
                          {res.testName}
                        </span>
                      </div>
                    </td>

                    {/* Value */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                      {res.value}
                    </td>

                    {/* Unit */}
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {res.unit || '—'}
                    </td>

                    {/* Reference Range */}
                    <td className="py-3 px-4">
                      {res.rangeProvided && res.sourceReferenceRange ? (
                        <span className="font-mono text-slate-700 font-medium">
                          {res.sourceReferenceRange}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 italic bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {NOT_PROVIDED_MESSAGE}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {isHigh && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <ArrowUpRight className="h-3 w-3 text-amber-700" />
                          HIGH
                        </span>
                      )}
                      {isLow && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          <ArrowDownRight className="h-3 w-3 text-blue-700" />
                          LOW
                        </span>
                      )}
                      {isNormal && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                          NORMAL
                        </span>
                      )}
                      {isNoRange && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
                          <HelpCircle className="h-3 w-3 text-slate-500" />
                          UNSTATED
                        </span>
                      )}
                    </td>

                    {/* Confidence */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                        {res.confidence} ({Math.round(res.confidenceScore * 100)}%)
                      </span>
                    </td>

                    {/* Source Origin — honest LOCAL_EXTRACTED label */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-slate-700">
                          {res.provenance}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {res.extractionEngine}
                        </span>
                      </div>
                    </td>

                    {/* Verification Actions */}
                    <td className="py-3 px-4">
                      <VerificationActions
                        result={res}
                        onVerify={onVerify}
                        onEdit={(result) => setEditingResult(result)}
                        onReject={(result) => setRejectingResult(result)}
                        onUndoReject={onUndoReject}
                      />
                    </td>

                    {/* Inspect Button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedResult(res);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition-colors"
                        title="View exact source snippet & provenance record"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info Strip */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Audit Rule:</span>
          <span>Click Inspect to view the full provenance chain. Use Verify/Edit/Reject for each result.</span>
        </div>
        <div>
          Showing {filteredResults.length} of {report.results.length} parameters
        </div>
      </div>

      {/* Source Inspector Modal — shows full provenance chain */}
      <SourceInspectorModal
        result={inspectedResult}
        auditLog={auditLog}
        onClose={() => setInspectedResult(null)}
      />

      {/* Edit Result Modal */}
      <EditResultModal
        result={editingResult}
        onSave={(resultId, edits) => {
          onEdit(resultId, edits);
          setEditingResult(null);
        }}
        onClose={() => setEditingResult(null)}
      />

      {/* Reject Result Modal */}
      <RejectResultModal
        result={rejectingResult}
        onConfirmReject={(resultId, reason) => {
          onReject(resultId, reason);
          setRejectingResult(null);
        }}
        onClose={() => setRejectingResult(null)}
      />
    </div>
  );
};
