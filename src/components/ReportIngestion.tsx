import React, { useState } from 'react';
import { FileText, Upload, Sparkles, ArrowRight, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { DEMO_REPORTS, type DemoReportDefinition } from '../data/demoData';

interface ReportIngestionProps {
  onProcessReport: (rawText: string, isDemoData: boolean) => void;
  isProcessing: boolean;
}

export const ReportIngestion: React.FC<ReportIngestionProps> = ({
  onProcessReport,
  isProcessing
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'paste' | 'upload'>('preset');
  const [selectedDemoId, setSelectedDemoId] = useState<string>(DEMO_REPORTS[0].id);
  const [pastedText, setPastedText] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectDemo = (report: DemoReportDefinition) => {
    setSelectedDemoId(report.id);
    setPastedText(report.rawText);
    setErrorMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verify it's text-based
    if (!file.name.match(/\.(txt|csv|log|dat|text)$/i) && file.type && !file.type.includes('text')) {
      setErrorMessage('Please upload a plain text lab report (.txt, .log, or .csv).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedText(content);
        setUploadedFileName(file.name);
        setErrorMessage(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the uploaded file.');
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let textToProcess = '';
    let isDemo = false;

    if (activeTab === 'preset') {
      const demo = DEMO_REPORTS.find(r => r.id === selectedDemoId);
      if (!demo) {
        setErrorMessage('Please select a valid demo report.');
        return;
      }
      textToProcess = demo.rawText;
      isDemo = true;
    } else {
      textToProcess = pastedText.trim();
      isDemo = false;
    }

    if (!textToProcess) {
      setErrorMessage('Please provide or paste report text to process.');
      return;
    }

    onProcessReport(textToProcess, isDemo);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-teal-700" />
          <h2 className="text-base font-bold text-slate-900">Medical Report Ingestion</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">
            Local Deterministic Extraction Engine
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50/30 gap-4">
        <button
          type="button"
          onClick={() => { setActiveTab('preset'); setErrorMessage(null); }}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'preset'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Pre-Loaded Demo Reports (3 Scenarios)</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('paste'); setErrorMessage(null); }}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'paste'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Paste Custom Report Text</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('upload'); setErrorMessage(null); }}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'upload'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload Text File</span>
        </button>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Pre-loaded Demo Reports */}
        {activeTab === 'preset' && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select an Authentic Clinical Benchmark Scenario:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DEMO_REPORTS.map((report) => {
                const isSelected = selectedDemoId === report.id;
                return (
                  <div
                    key={report.id}
                    onClick={() => handleSelectDemo(report)}
                    className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {report.categoryTag}
                      </span>
                      {isSelected && (
                        <span className="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                          ✓ Selected
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 leading-snug mb-1">
                      {report.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Preview Box */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold text-slate-700">Source Report Text Preview:</span>
                <span className="font-mono text-[11px] text-amber-700 font-medium">Synthetic Clinical Dataset</span>
              </div>
              <textarea
                rows={7}
                readOnly
                value={DEMO_REPORTS.find(r => r.id === selectedDemoId)?.rawText || ''}
                className="w-full text-xs font-mono p-3 bg-slate-900 text-slate-100 rounded-md border border-slate-700 outline-hidden leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Paste Custom Report Text */}
        {activeTab === 'paste' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-800">
                Paste Laboratory or Clinical Document Text:
              </label>
              <button
                type="button"
                onClick={() => setPastedText('')}
                className="text-[11px] text-slate-500 hover:text-slate-800"
              >
                Clear Text
              </button>
            </div>
            <textarea
              rows={9}
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              placeholder={`Example text format:
METRO CLINICAL LAB
Date: 2026-03-01
Glucose, Serum        142   mg/dL   70 - 99
Potassium             3.2   mmol/L  3.5 - 5.0
Creatinine            1.4   mg/dL   0.6 - 1.2
eGFR                  54    mL/min`}
              className="w-full text-xs font-mono p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden leading-relaxed"
            />
            <p className="text-[11px] text-slate-500">
              The local parser handles standard whitespace tables, key-value colon lines, and pipe-delimited outputs.
            </p>
          </div>
        )}

        {/* Tab 3: Upload Text File */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-800">
              Upload Plain Text Lab Report (.txt, .csv, .log):
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-lg p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 text-white text-xs font-medium rounded-md hover:bg-teal-800 transition-colors">
                <span>Browse Local File</span>
                <input
                  type="file"
                  accept=".txt,.csv,.log,.text"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Supported formats: Plain Text (.txt), CSV (.csv), Log files (.log)
              </p>
              {uploadedFileName && (
                <div className="mt-3 inline-block bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-md text-xs font-semibold">
                  Loaded File: {uploadedFileName}
                </div>
              )}
            </div>

            {pastedText && (
              <div className="mt-2">
                <span className="text-xs font-semibold text-slate-700 block mb-1">File Contents:</span>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>
            )}
          </div>
        )}

        {/* Process Action Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            <span>
              Deterministic parser runs <strong>locally in browser</strong> (instant, zero network latency).
            </span>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-xs font-bold text-white transition-all shadow-xs ${
              isProcessing
                ? 'bg-teal-400 cursor-not-allowed'
                : 'bg-teal-700 hover:bg-teal-800 focus:ring-2 focus:ring-teal-500 focus:ring-offset-1'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing Report...</span>
              </>
            ) : (
              <>
                <span>Extract & Structure Report</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
