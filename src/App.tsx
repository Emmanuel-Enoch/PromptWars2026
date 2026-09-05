import React, { useState, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  SafetyBanner 
} from './components/SafetyBanner';
import { 
  PatientBanner 
} from './components/PatientBanner';
import { 
  PatientIntakeForm 
} from './components/PatientIntakeForm';
import { 
  ReportIngestion 
} from './components/ReportIngestion';
import { 
  StructuredResultsTable 
} from './components/StructuredResultsTable';
import type { 
  PatientProfile, 
  MedicalReport 
} from './types';
import { 
  parseMedicalReport 
} from './services/deterministicParser';
import { 
  savePersistedState, 
  loadPersistedState, 
  clearPersistedState 
} from './services/storageService';
import { 
  DEMO_PATIENTS, 
  DEMO_REPORTS 
} from './data/demoData';
import { 
  ClipboardList, 
  FileCheck2, 
  Sparkles, 
  ArrowRight
} from 'lucide-react';

export const App: React.FC = () => {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [report, setReport] = useState<MedicalReport | null>(null);
  const [isEditingIntake, setIsEditingIntake] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load state from localStorage on initial render
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted.patient) {
      setPatient(persisted.patient);
    }
    if (persisted.report) {
      setReport(persisted.report);
    }
    setIsInitialized(true);
  }, []);

  // Sync state to localStorage when changes occur
  useEffect(() => {
    if (isInitialized) {
      savePersistedState(patient, report);
    }
  }, [patient, report, isInitialized]);

  // Handle patient save
  const handleSavePatient = (newPatient: PatientProfile) => {
    setPatient(newPatient);
    setIsEditingIntake(false);
  };

  // Process Report
  const handleProcessReport = (rawText: string, isDemoData: boolean) => {
    setIsProcessing(true);

    // Simulate brief realistic parsing latency for UX (300ms)
    setTimeout(() => {
      try {
        const patientId = patient?.id || 'unassigned-patient';
        const parsedReport = parseMedicalReport(rawText, patientId, isDemoData);
        setReport(parsedReport);
      } catch (err) {
        console.error('Report parsing error:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 300);
  };

  // Quick 1-click Happy Path demo loader
  const handleQuickDemoLoad = () => {
    const demoPt = DEMO_PATIENTS[0];
    const demoRep = DEMO_REPORTS[0];
    setPatient(demoPt);
    setIsEditingIntake(false);
    setIsProcessing(true);

    setTimeout(() => {
      const parsed = parseMedicalReport(demoRep.rawText, demoPt.id, true);
      setReport(parsed);
      setIsProcessing(false);
    }, 250);
  };

  // Reset Session
  const handleResetSession = () => {
    if (window.confirm('Reset current MedLens clinical session and clear local storage?')) {
      clearPersistedState();
      setPatient(null);
      setReport(null);
      setIsEditingIntake(false);
    }
  };

  const isDemoActive = Boolean(patient?.isDemoData || report?.isDemoData);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        isDemoData={isDemoActive}
        hasActiveRecord={Boolean(patient || report)}
        onReset={handleResetSession}
      />

      {/* Mandatory Clinical Safety Disclaimer Banner */}
      <SafetyBanner />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Quick Demo Hero Bar (Shown when nothing is loaded yet) */}
        {!patient && !report && (
          <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-md">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Phase 1 Ready: Core Deterministic Extraction</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-white">
                Clinical Intelligence & Structured Extraction
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                MedLens ingests unstructured clinical reports and standardizes them into structured, verifiable laboratory tables. 
                Reference ranges are evaluated <strong>strictly from source text</strong> with zero hallucination.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleQuickDemoLoad}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Run 1-Click Complete Demo (Elena Rostova + CMP Panel)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs text-slate-400">or fill in intake & ingest report below</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1: Patient Information Intake */}
        <section aria-label="Patient Intake">
          {patient && !isEditingIntake ? (
            <PatientBanner
              patient={patient}
              onEditIntake={() => setIsEditingIntake(true)}
            />
          ) : (
            <PatientIntakeForm
              initialData={patient}
              onSave={handleSavePatient}
              onCancel={patient ? () => setIsEditingIntake(false) : undefined}
            />
          )}
        </section>

        {/* SECTION 2: Medical Report Ingestion */}
        <section aria-label="Report Ingestion">
          <ReportIngestion
            onProcessReport={handleProcessReport}
            isProcessing={isProcessing}
          />
        </section>

        {/* SECTION 3: Structured Results & Audit Table */}
        <section aria-label="Structured Laboratory Results">
          {report ? (
            <StructuredResultsTable report={report} />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center shadow-xs">
              <div className="max-w-md mx-auto space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  No Report Processed Yet
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select a pre-loaded clinical benchmark scenario above or paste raw laboratory text and click 
                  <strong> "Extract & Structure Report"</strong> to generate the structured results table.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleQuickDemoLoad}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-md border border-teal-200"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Load Sample Report Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="h-4 w-4 text-teal-600" />
            <span className="font-semibold text-slate-700">MedLens v1.0 (Phase 1)</span>
            <span>• Traceability & Source-Only Reference Range Engine</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            PromptWars 2026 Clinical Intelligence Submission
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

