// PatientSummary — deterministic patient-friendly summary of the structured record.
// STRICT SAFETY CONTRACT (checked programmatically below):
//   ✗ Never diagnoses
//   ✗ Never prescribes treatment
//   ✗ Never recommends medication changes
//   ✗ Never recommends dosage changes
//   ✗ Never claims a disease is worsening
//   ✗ Never infers a condition from a lab result
//   ✓ Reports only what is in the source document
//   ✓ Uses "may be worth discussing" language for out-of-range items
//   ✓ Includes mandatory disclaimer

import React, { useState } from 'react';
import {
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Info
} from 'lucide-react';
import type { MedicalReport, PatientProfile, LabTestResult } from '../types';

interface PatientSummaryProps {
  report: MedicalReport;
  patient: PatientProfile | null;
}

// Deterministic patient-friendly name mapping for common test abbreviations.
// Only descriptive names used — no diagnostic interpretation.
const TEST_PLAIN_NAMES: Record<string, string> = {
  'glucose': 'Blood Sugar (Glucose)',
  'bun': 'Blood Urea Nitrogen (kidney waste product)',
  'creatinine': 'Creatinine (kidney filtration marker)',
  'sodium': 'Sodium (electrolyte)',
  'potassium': 'Potassium (electrolyte)',
  'chloride': 'Chloride (electrolyte)',
  'carbon dioxide': 'Carbon Dioxide / Bicarbonate (acid-base balance)',
  'calcium': 'Calcium',
  'albumin': 'Albumin (blood protein)',
  'bilirubin': 'Bilirubin (liver processing marker)',
  'alkaline phosphatase': 'Alkaline Phosphatase (liver/bone marker)',
  'ast': 'AST (liver enzyme)',
  'alt': 'ALT (liver enzyme)',
  'hemoglobin a1c': 'HbA1c (average blood sugar over ~3 months)',
  'wbc': 'White Blood Cells (infection fighters)',
  'rbc': 'Red Blood Cells (oxygen carriers)',
  'hemoglobin': 'Hemoglobin (oxygen-carrying protein in red cells)',
  'hematocrit': 'Hematocrit (proportion of red blood cells in blood)',
  'platelet': 'Platelets (clotting cells)',
  'tsh': 'TSH (Thyroid Stimulating Hormone)',
  'free t4': 'Free T4 (thyroid hormone)',
  'total cholesterol': 'Total Cholesterol',
  'triglycerides': 'Triglycerides (blood fats)',
  'hdl': 'HDL Cholesterol (often called good cholesterol)',
  'ldl': 'LDL Cholesterol (often called bad cholesterol)',
  'egfr': 'eGFR (estimated kidney filtration rate)',
  'uric acid': 'Uric Acid',
  'magnesium': 'Magnesium',
  'mcv': 'MCV (average red blood cell size)',
  'cystatin': 'Cystatin C (kidney function marker)',
};

function getPlainName(testName: string): string {
  const lower = testName.toLowerCase();
  for (const [key, label] of Object.entries(TEST_PLAIN_NAMES)) {
    if (lower.includes(key)) return label;
  }
  return testName; // fallback to original name
}

function pluralise(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural;
}

interface SummaryData {
  total: number;
  normal: LabTestResult[];
  high: LabTestResult[];
  low: LabTestResult[];
  noRange: LabTestResult[];
  verified: number;
  unreviewed: number;
}

function buildSummary(report: MedicalReport): SummaryData {
  const results = report.results;
  return {
    total: results.length,
    normal: results.filter(r => r.status === 'NORMAL'),
    high: results.filter(r => r.status === 'HIGH'),
    low: results.filter(r => r.status === 'LOW'),
    noRange: results.filter(r => r.status === 'NOT_PROVIDED_IN_SOURCE'),
    verified: results.filter(r => r.verificationStatus === 'VERIFIED' || r.verificationStatus === 'EDITED').length,
    unreviewed: results.filter(r => r.verificationStatus === 'UNREVIEWED').length,
  };
}

// Generate doctor questions based only on structural facts — never diagnoses.
function generateDoctorQuestions(summary: SummaryData, report: MedicalReport): string[] {
  const questions: string[] = [];

  // Generic opener
  questions.push(
    `Can you walk me through the results on this report dated ${report.reportDate}?`
  );

  // For each HIGH result — ask about the source range, not a condition
  summary.high.forEach(r => {
    questions.push(
      `The report shows that ${getPlainName(r.testName)} (${r.value} ${r.unit}) is above the reference range listed in the report (${r.sourceReferenceRange}). What does this mean for me, and do I need any follow-up?`
    );
  });

  // For each LOW result
  summary.low.forEach(r => {
    questions.push(
      `The report shows that ${getPlainName(r.testName)} (${r.value} ${r.unit}) is below the reference range listed in the report (${r.sourceReferenceRange}). Is this something I need to be concerned about?`
    );
  });

  // For results without ranges
  if (summary.noRange.length > 0) {
    const names = summary.noRange.slice(0, 3).map(r => getPlainName(r.testName)).join(', ');
    questions.push(
      `The report did not include a reference range for ${names}${summary.noRange.length > 3 ? ` and ${summary.noRange.length - 3} other(s)` : ''}. Can you tell me whether these values are expected for me?`
    );
  }

  // Generic follow-up
  questions.push(
    'Are there any results in this report that you would like to monitor more frequently?'
  );
  questions.push(
    'Is there anything in this report that would change my current care plan?'
  );

  return questions;
}

export const PatientSummary: React.FC<PatientSummaryProps> = ({ report, patient }) => {
  const [showQuestions, setShowQuestions] = useState(true);
  const [showAllNormal, setShowAllNormal] = useState(false);

  const summary = buildSummary(report);
  const doctorQuestions = generateDoctorQuestions(summary, report);

  const abnormalItems = [...summary.high, ...summary.low];

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Panel Header */}
      <div className="px-6 py-4 bg-teal-50 border-b border-teal-200 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-teal-100 flex items-center justify-center">
          <User className="h-5 w-5 text-teal-700" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Patient-Friendly Report Summary
          </h2>
          <p className="text-xs text-teal-800">
            Plain-language overview for {patient ? patient.name : 'the patient'} — based solely on the structured record
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5 text-sm">
        {/* Mandatory Disclaimer */}
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900">
          <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Important:</strong> This summary is for information and discussion purposes only.
            It does <strong>not</strong> provide a diagnosis, treatment recommendation, or any medical advice.
            Always discuss your results with a qualified healthcare professional.
          </span>
        </div>

        {/* Overview Narrative */}
        <div className="prose prose-sm text-slate-700 leading-relaxed space-y-2 text-sm">
          <p>
            <strong className="text-slate-900">
              <FileText className="h-4 w-4 inline text-teal-600 mr-1" />
              About This Report
            </strong>
          </p>
          <p>
            The report dated <strong>{report.reportDate}</strong> from{' '}
            <strong>{report.facility}</strong> contains{' '}
            <strong>{summary.total}</strong> laboratory{' '}
            {pluralise(summary.total, 'measurement', 'measurements')}.
          </p>

          {summary.normal.length > 0 && (
            <p>
              The report shows that{' '}
              <strong className="text-emerald-700">{summary.normal.length}</strong> of these{' '}
              {pluralise(summary.normal.length, 'result is', 'results are')} within the reference range provided in the source report.
            </p>
          )}

          {abnormalItems.length > 0 && (
            <p>
              The report shows that{' '}
              <strong className="text-amber-700">
                {summary.high.length + summary.low.length}
              </strong>{' '}
              {pluralise(summary.high.length + summary.low.length, 'result is', 'results are')} outside the reference range listed in the source report.
              These may be worth discussing with your healthcare professional.
            </p>
          )}

          {summary.noRange.length > 0 && (
            <p>
              For <strong>{summary.noRange.length}</strong> of the{' '}
              {pluralise(summary.noRange.length, 'measurement', 'measurements')}, the report did not include a reference range.
              MedLens has not made any assumption about what those values mean, as the source document did not provide a comparison range.
            </p>
          )}

          {summary.unreviewed > 0 && (
            <p className="text-slate-500 italic">
              Note: {summary.unreviewed} {pluralise(summary.unreviewed, 'result has', 'results have')} not yet been reviewed by a clinical reviewer.
            </p>
          )}
        </div>

        {/* Results Outside Source Range */}
        {abnormalItems.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              Results Outside Their Source Reference Range
            </h3>
            <div className="space-y-2">
              {abnormalItems.map(r => (
                <div
                  key={r.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${
                    r.status === 'HIGH'
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-blue-50/60 border-blue-200'
                  }`}
                >
                  {r.status === 'HIGH' ? (
                    <ArrowUpRight className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-900">{getPlainName(r.testName)}</span>
                    <span className="text-slate-600 ml-1.5 font-mono">
                      {r.value} {r.unit}
                    </span>
                    <p className="text-slate-600 mt-0.5">
                      The reported value is {r.status === 'HIGH' ? 'above' : 'below'} the reference range
                      provided in the source report ({r.sourceReferenceRange}).
                      This result may be worth discussing with a qualified healthcare professional.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Without Source Range */}
        {summary.noRange.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
              Results Without a Source Reference Range
            </h3>
            <div className="space-y-1.5">
              {summary.noRange.map(r => (
                <div key={r.id} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="font-semibold">{getPlainName(r.testName)}</span>
                  <span className="font-mono text-slate-600">{r.value} {r.unit}</span>
                  <span className="text-slate-400 italic">— The report does not provide a reference range for this result.</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Normal Results (collapsible) */}
        {summary.normal.length > 0 && (
          <div>
            <button
              onClick={() => setShowAllNormal(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 mb-2"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {showAllNormal ? 'Hide' : 'Show'} {summary.normal.length} results within source reference range
              {showAllNormal ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showAllNormal && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {summary.normal.map(r => (
                  <div key={r.id} className="flex items-center gap-2 text-xs text-slate-700 bg-emerald-50/60 p-2 rounded border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{getPlainName(r.testName)}</span>
                    <span className="font-mono text-slate-600">{r.value} {r.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Questions to Ask Your Doctor */}
        <div className="border-t border-slate-200 pt-4">
          <button
            onClick={() => setShowQuestions(v => !v)}
            className="flex w-full items-center justify-between text-left mb-2"
          >
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-teal-600" />
              Questions You Could Ask Your Healthcare Professional
            </h3>
            {showQuestions
              ? <ChevronUp className="h-4 w-4 text-slate-500" />
              : <ChevronDown className="h-4 w-4 text-slate-500" />
            }
          </button>

          {showQuestions && (
            <div className="space-y-2">
              {doctorQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-teal-50/50 border border-teal-100 p-2.5 rounded-md">
                  <span className="shrink-0 h-5 w-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px]">
                    {i + 1}
                  </span>
                  <span>{q}</span>
                </div>
              ))}
              <p className="text-[11px] text-slate-500 italic pt-1">
                These questions are based solely on information present in the source report.
                They are informational starting points, not medical advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
