// MedLens Report Comparison View — Phase 3B
// Evidence-first, purely factual comparison between two processed reports.
// Explicitly disclaims diagnosis, treatment, or clinical significance.

import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  ExternalLink,
  Info,
  ShieldCheck
} from 'lucide-react';
import type { MedicalReport, LabTestResult, AuditEntry, ReferenceRangeStatus } from '../types';
import {
  compareMedicalReports,
  type ReportComparisonSummary,
  type ComparisonChangeLabel
} from '../services/reportComparison';
import { SourceInspectorModal } from './SourceInspectorModal';

interface ReportComparisonViewProps {
  reports: MedicalReport[];
  currentReport: MedicalReport | null;
}

export const ReportComparisonView: React.FC<ReportComparisonViewProps> = ({
  reports,
  currentReport
}) => {
  const [previousReportId, setPreviousReportId] = useState<string>('');
  const [currentReportId, setCurrentReportId] = useState<string>('');
  const [comparisonSummary, setComparisonSummary] = useState<ReportComparisonSummary | null>(null);
  const [inspectedResult, setInspectedResult] = useState<LabTestResult | null>(null);
  const [inspectedAuditLog, setInspectedAuditLog] = useState<AuditEntry[]>([]);

  // Automatically prefill selectors when reports change
  useEffect(() => {
    if (reports.length >= 2) {
      // Default: currentReport is current, second most recent is previous
      const currId = currentReport?.id || reports[reports.length - 1].id;
      const prevReport = reports.filter(r => r.id !== currId)[0];

      setCurrentReportId(currId);
      if (prevReport) {
        setPreviousReportId(prevReport.id);
      }
    } else if (reports.length === 1) {
      setCurrentReportId(reports[0].id);
      setPreviousReportId('');
    }
  }, [reports, currentReport]);

  const handleRunComparison = () => {
    if (!previousReportId || !currentReportId || previousReportId === currentReportId) {
      return;
    }

    const prevRep = reports.find(r => r.id === previousReportId);
    const currRep = reports.find(r => r.id === currentReportId);

    if (prevRep && currRep) {
      const summary = compareMedicalReports(prevRep, currRep);
      setComparisonSummary(summary);
    }
  };

  const isSameReportSelected = previousReportId && currentReportId && previousReportId === currentReportId;
  const canCompare = reports.length >= 2 && previousReportId && currentReportId && !isSameReportSelected;

  const handleInspect = (result: LabTestResult, report: MedicalReport) => {
    setInspectedResult(result);
    setInspectedAuditLog(report.auditLog ?? []);
  };

  const renderStatusBadge = (status: ReferenceRangeStatus | null) => {
    if (!status) return <span className="text-slate-400">—</span>;

    switch (status) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <ArrowUpRight className="h-3 w-3 text-amber-700" />
            HIGH
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <ArrowDownRight className="h-3 w-3 text-blue-700" />
            LOW
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
            NORMAL
          </span>
        );
      case 'NOT_PROVIDED_IN_SOURCE':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
            <HelpCircle className="h-3 w-3 text-slate-500" />
            UNSTATED
          </span>
        );
    }
  };

  const renderChangeLabelBadge = (label: ComparisonChangeLabel) => {
    switch (label) {
      case 'CHANGED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
            CHANGED
          </span>
        );
      case 'UNCHANGED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            UNCHANGED
          </span>
        );
      case 'ONLY IN PREVIOUS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            ONLY IN PREVIOUS
          </span>
        );
      case 'ONLY IN CURRENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-800 border border-teal-200">
            ONLY IN CURRENT
          </span>
        );
      case 'NUMERICAL CHANGE UNAVAILABLE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
            NUMERICAL CHANGE UNAVAILABLE
          </span>
        );
      case 'UNITS DIFFER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            UNITS DIFFER
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-slate-50/90 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <GitCompare className="h-5 w-5 text-teal-700" />
              <h2 className="text-base font-bold text-slate-900">
                Current vs Previous Report Comparison
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-semibold">
                {reports.length} Processed {reports.length === 1 ? 'Report' : 'Reports'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Factual documentary & numerical differences between two already-processed clinical panels.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white text-slate-700 border border-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
              <span>Evidence-First Derived View</span>
            </span>
          </div>
        </div>

        {/* Evidence Pipeline Flow */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-white px-3 py-1.5 rounded-md border border-slate-200 mb-3 overflow-x-auto">
          <span className="font-bold text-slate-800 shrink-0">Pipeline:</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium whitespace-nowrap">
            1. Source Reports
          </span>
          <span className="text-slate-400">→</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium whitespace-nowrap">
            2. Structured Findings
          </span>
          <span className="text-slate-400">→</span>
          <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-bold whitespace-nowrap">
            3. Numerical Comparison
          </span>
          <span className="text-slate-400">→</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium whitespace-nowrap">
            4. Human Verification
          </span>
        </div>

        {/* Mandatory Clinical Disclaimer Banner */}
        <div className="flex items-start gap-2 p-3 bg-amber-50/80 border border-amber-200 text-amber-900 text-xs rounded-md">
          <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">
              Numerical comparison only — not a clinical interpretation.
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Clinical significance is not determined by this comparison. Reference ranges shown are those documented exclusively in each source report.
            </p>
          </div>
        </div>
      </div>

      {/* Report Selector Controls */}
      <div className="p-6 border-b border-slate-200 bg-white">
        {reports.length < 2 ? (
          <div className="p-6 text-center bg-slate-50 rounded-lg border border-slate-200">
            <GitCompare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-800 mb-1">
              Process at least two reports to compare results.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Currently {reports.length} report is loaded. Ingest a second laboratory report (via paste or upload above, or select another benchmark) to unlock factual report-to-report comparison.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Previous Report Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Previous Report (Baseline):
                </label>
                <select
                  value={previousReportId}
                  onChange={e => {
                    setPreviousReportId(e.target.value);
                    setComparisonSummary(null);
                  }}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-hidden bg-white text-slate-800"
                >
                  <option value="">-- Select Previous Report --</option>
                  {reports.map((r) => (
                    <option key={`prev-${r.id}`} value={r.id}>
                      {r.reportDate} • {r.title} ({r.facility})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Report Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Current Report (Latest):
                </label>
                <select
                  value={currentReportId}
                  onChange={e => {
                    setCurrentReportId(e.target.value);
                    setComparisonSummary(null);
                  }}
                  className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-hidden bg-white text-slate-800"
                >
                  <option value="">-- Select Current Report --</option>
                  {reports.map((r) => (
                    <option key={`curr-${r.id}`} value={r.id}>
                      {r.reportDate} • {r.title} ({r.facility})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isSameReportSelected && (
              <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Please select two different reports to perform a longitudinal comparison.</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                Comparing {reports.find(r => r.id === previousReportId)?.facility || 'Previous'} vs {reports.find(r => r.id === currentReportId)?.facility || 'Current'}
              </div>
              <button
                type="button"
                disabled={!canCompare}
                onClick={handleRunComparison}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-md text-xs font-bold text-white transition-all shadow-xs ${
                  canCompare
                    ? 'bg-teal-700 hover:bg-teal-800 cursor-pointer'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500'
                }`}
              >
                <GitCompare className="h-4 w-4" />
                <span>Compare Reports</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Results Section */}
      {comparisonSummary && (
        <div>
          {/* Summary Pills */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700">Compared Parameters:</span>
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 border border-teal-200">
                {comparisonSummary.matchingCount} in Both
              </span>
              {comparisonSummary.onlyPreviousCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full font-medium bg-slate-200 text-slate-700 border border-slate-300">
                  {comparisonSummary.onlyPreviousCount} Only in Previous
                </span>
              )}
              {comparisonSummary.onlyCurrentCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full font-medium bg-slate-200 text-slate-700 border border-slate-300">
                  {comparisonSummary.onlyCurrentCount} Only in Current
                </span>
              )}
            </div>

            <div className="text-slate-500 text-[11px]">
              Previous: <span className="font-semibold text-slate-700">{comparisonSummary.previousReport.reportDate}</span> → Current: <span className="font-semibold text-slate-700">{comparisonSummary.currentReport.reportDate}</span>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 min-w-[120px]" scope="col">Test</th>
                  <th className="py-3 px-4 min-w-[120px]" scope="col">Previous ({comparisonSummary.previousReport.reportDate})</th>
                  <th className="py-3 px-4 min-w-[120px]" scope="col">Current ({comparisonSummary.currentReport.reportDate})</th>
                  <th className="py-3 px-4 min-w-[100px]" scope="col">Change Label</th>
                  <th className="py-3 px-4 min-w-[120px]" scope="col">Numerical Change</th>
                  <th className="py-3 px-4 min-w-[100px]" scope="col">Previous Status</th>
                  <th className="py-3 px-4 min-w-[100px]" scope="col">Current Status</th>
                  <th className="py-3 px-4 text-right min-w-[100px]" scope="col">Inspect Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {comparisonSummary.results.map((res) => {
                  const isBoth = res.presence === 'BOTH';
                  const isOnlyPrev = res.presence === 'ONLY_PREVIOUS';
                  const isOnlyCurr = res.presence === 'ONLY_CURRENT';

                  return (
                    <tr key={res.normalizedKey} className="hover:bg-slate-50 transition-colors">
                      {/* Test Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div>
                          <span>{res.testName}</span>
                          {res.presence !== 'BOTH' && (
                            <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                              {isOnlyPrev ? 'Only in previous report' : 'Only in current report'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Previous Value */}
                      <td className="py-3 px-4 font-mono">
                        {isOnlyCurr ? (
                          <span className="text-slate-400 italic">Not in previous</span>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{res.previousValue}</span>{' '}
                            <span className="text-slate-500 text-xs">{res.previousUnit}</span>
                            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                              Ref: {res.previousRange}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Current Value */}
                      <td className="py-3 px-4 font-mono">
                        {isOnlyPrev ? (
                          <span className="text-slate-400 italic">Not in current</span>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{res.currentValue}</span>{' '}
                            <span className="text-slate-500 text-xs">{res.currentUnit}</span>
                            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                              Ref: {res.currentRange}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Change Label (Phase 3C) */}
                      <td className="py-3 px-4">
                        {renderChangeLabelBadge(res.changeLabel)}
                      </td>

                      {/* Numerical Change */}
                      <td className="py-3 px-4">
                        {isBoth ? (
                          res.comparisonNote ? (
                            <span className="text-[11px] text-slate-500 italic bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {res.comparisonNote}
                            </span>
                          ) : (
                            <div className="font-mono">
                              <span className={`font-bold text-xs ${
                                (res.absoluteChange ?? 0) > 0 ? 'text-amber-800' : (res.absoluteChange ?? 0) < 0 ? 'text-blue-800' : 'text-slate-700'
                              }`}>
                                {res.absoluteChangeDisplay}
                              </span>
                              {res.percentageChangeDisplay && (
                                <span className="ml-1.5 text-[11px] font-medium text-slate-600">
                                  ({res.percentageChangeDisplay})
                                </span>
                              )}
                            </div>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {res.comparisonNote}
                          </span>
                        )}
                      </td>

                      {/* Previous Status */}
                      <td className="py-3 px-4">
                        {renderStatusBadge(res.previousStatus)}
                      </td>

                      {/* Current Status */}
                      <td className="py-3 px-4">
                        {renderStatusBadge(res.currentStatus)}
                      </td>

                      {/* Inspect Evidence */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {res.currentResult && (
                            <button
                              type="button"
                              onClick={() => handleInspect(res.currentResult!, comparisonSummary.currentReport)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition-colors"
                              title="Inspect current result source snippet"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Current</span>
                            </button>
                          )}
                          {res.previousResult && (
                            <button
                              type="button"
                              onClick={() => handleInspect(res.previousResult!, comparisonSummary.previousReport)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                              title="Inspect previous result source snippet"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Previous</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              <strong>Note:</strong> Numerical comparison only — not a clinical interpretation. Clinical significance is not determined by this comparison.
            </span>
            <span className="text-slate-400">
              Showing {comparisonSummary.results.length} parameters
            </span>
          </div>
        </div>
      )}

      {/* Underlying Source Inspector Modal for evidence audit */}
      <SourceInspectorModal
        result={inspectedResult}
        auditLog={inspectedAuditLog}
        onClose={() => setInspectedResult(null)}
      />
    </div>
  );
};
