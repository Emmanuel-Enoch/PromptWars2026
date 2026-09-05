// MedLens Deterministic Local Report Parser
// Accurately extracts structured lab results from common laboratory report formats.
// Honest Attribution: Labeled explicitly as "Local extraction engine" (not AI/Gemini).
// Preserves exact verbatim source snippets for complete auditability.

import type { LabTestResult, MedicalReport } from '../types';
import { evaluateReferenceRange } from './referenceRangeEvaluator';

export const LOCAL_ENGINE_NAME = 'Local extraction engine';

interface ExtractedRawResult {
  testName: string;
  valueStr: string;
  unitStr: string;
  refRangeStr: string | null;
  rawSnippet: string;
}

/**
 * Extracts metadata such as facility and report date from header lines.
 */
function extractReportMetadata(lines: string[]) {
  let facility = 'Clinical Laboratory Facility';
  let reportDate = new Date().toISOString().split('T')[0];

  for (const line of lines.slice(0, 15)) {
    // Facility detection
    if (/LABORATOR|HOSPITAL|CLINIC|DIAGNOSTIC|HEALTH/i.test(line) && !line.startsWith('=') && !line.startsWith('-')) {
      const cleaned = line.replace(/^[=\-\s*]+|[=\-\s*]+$/g, '').trim();
      if (cleaned.length > 5 && cleaned.length < 80) {
        facility = cleaned;
      }
    }

    // Report date detection (e.g. "Report Date: 2026-03-01" or "Date: 2026-03-01")
    const dateMatch = line.match(/(?:Report\s*Date|Specimen\s*Date|Date):\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4})/i);
    if (dateMatch) {
      reportDate = dateMatch[1];
    }
  }

  return { facility, reportDate };
}

/**
 * Parses an individual report line into structured fields.
 */
function parseReportLine(line: string): ExtractedRawResult | null {
  const trimmed = line.trim();

  // Skip headers, horizontal rules, page borders, empty lines
  if (!trimmed || trimmed.startsWith('=') || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('#')) {
    return null;
  }

  // Skip obvious non-test lines
  if (/^(TEST NAME|PATIENT|ORDERING|PHYSICIAN|DOB|SPECIMEN|REQUISITION|PANEL:|CLINICAL NOTES|LABORATORY OBSERVATIONS|PATHOLOGIST)/i.test(trimmed)) {
    return null;
  }

  // Format A: Whitespace/Tabular alignment with possible trailing flags
  // e.g. "Glucose, Serum                142      mg/dL      70 - 99            HIGH"
  // e.g. "Creatinine, Serum             1.42     mg/dL      0.60 - 1.20        HIGH"
  // e.g. "Hemoglobin A1c                8.1      %          < 5.7"
  // e.g. "eGFR (Estimated GFR)          54       mL/min     [None provided by ordering lab]"
  // e.g. "Fasting Insulin               14.5     uIU/mL"
  
  // Try Pattern A: TestName ... Number ... Unit ... ReferenceRange
  // We use regex that looks for a test name, followed by numeric value, unit, and optional reference range
  const tabularRegex = /^([A-Za-z0-9\s,/\-()'.+]+?)\s{2,}([<>]?[0-9.]+)\s+([A-Za-z0-9/%^]+(?:\/[A-Za-z0-9.]+)?)\s*(.*?)$/;
  const tabMatch = trimmed.match(tabularRegex);

  if (tabMatch) {
    const rawName = tabMatch[1].trim();
    const rawVal = tabMatch[2].trim();
    const rawUnit = tabMatch[3].trim();
    let rawRange: string | null = tabMatch[4].trim();

    // Clean up trailing flags (HIGH, LOW, NORMAL, ABNORMAL, CRITICAL, *) from reference range column if present
    if (rawRange) {
      rawRange = rawRange.replace(/\s+(HIGH|LOW|NORMAL|ABNORMAL|CRITICAL|\*)\s*$/i, '').trim();
      if (rawRange === '' || rawRange === '-' || rawRange === '--') {
        rawRange = null;
      }
    } else {
      rawRange = null;
    }

    // Guard against picking up section headers or numbers
    if (rawName.length >= 2 && !/^(PANEL|TEST|NOTE|TOTAL)/i.test(rawName)) {
      return {
        testName: rawName,
        valueStr: rawVal,
        unitStr: rawUnit,
        refRangeStr: rawRange,
        rawSnippet: line
      };
    }
  }

  // Format B: Key-Value format
  // e.g. "Potassium: 3.2 mmol/L (Reference: 3.5 - 5.0)"
  // e.g. "Calcium: 9.3 mg/dL [8.6 - 10.2]"
  const kvRegex = /^([A-Za-z0-9\s,/\-()'.+]+?):\s*([<>]?[0-9.]+)\s*([A-Za-z0-9/%^]+(?:\/[A-Za-z0-9.]+)?)\s*(?:\((?:Ref|Reference)?\s*:?\s*([^)]+)\)|\[([^\]]+)\])?/i;
  const kvMatch = trimmed.match(kvRegex);

  if (kvMatch) {
    const rawName = kvMatch[1].trim();
    const rawVal = kvMatch[2].trim();
    const rawUnit = kvMatch[3] ? kvMatch[3].trim() : '';
    const rawRange = kvMatch[4]?.trim() || kvMatch[5]?.trim() || null;

    if (rawName.length >= 2) {
      return {
        testName: rawName,
        valueStr: rawVal,
        unitStr: rawUnit,
        refRangeStr: rawRange,
        rawSnippet: line
      };
    }
  }

  // Format C: Pipe-delimited row
  // e.g. "Glucose | 142 | mg/dL | 70 - 99"
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((s) => s.trim());
    if (parts.length >= 3) {
      const rawName = parts[0];
      const rawVal = parts[1];
      const rawUnit = parts[2] || '';
      const rawRange = parts[3] || null;

      if (!isNaN(parseFloat(rawVal))) {
        return {
          testName: rawName,
          valueStr: rawVal,
          unitStr: rawUnit,
          refRangeStr: rawRange,
          rawSnippet: line
        };
      }
    }
  }

  return null;
}

/**
 * Deterministically parses clinical text report into structured MedicalReport object.
 */
export function parseMedicalReport(
  rawReportText: string,
  patientId: string,
  isDemoData: boolean = false
): MedicalReport {
  const lines = rawReportText.split(/\r?\n/);
  const { facility, reportDate } = extractReportMetadata(lines);

  const results: LabTestResult[] = [];
  const unparsedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parsed = parseReportLine(line);

    if (parsed) {
      const numericVal = parseFloat(parsed.valueStr.replace(/[<>]/g, ''));
      const evaluated = evaluateReferenceRange(
        isNaN(numericVal) ? null : numericVal,
        parsed.refRangeStr
      );

      // Confidence computation:
      // High if test name, numeric value, unit, and valid explicit range parsed
      // Medium if test name & value parsed, but unit or range missing/unstructured
      const hasExplicitValidRange = evaluated.rangeProvided && evaluated.status !== 'NOT_PROVIDED_IN_SOURCE';
      const confidence = hasExplicitValidRange ? 'HIGH' : 'MEDIUM';
      const confidenceScore = hasExplicitValidRange ? 0.95 : 0.82;

      const resultItem: LabTestResult = {
        id: `res-${Date.now()}-${results.length + 1}`,
        testName: parsed.testName,
        value: parsed.valueStr,
        numericValue: isNaN(numericVal) ? null : numericVal,
        unit: parsed.unitStr,
        sourceReferenceRange: evaluated.sourceReferenceRange,
        rangeProvided: evaluated.rangeProvided,
        status: evaluated.status,
        testDate: reportDate,
        sourceSnippet: parsed.rawSnippet.trim(),
        provenance: 'AI_EXTRACTED',
        extractionEngine: LOCAL_ENGINE_NAME,
        confidence,
        confidenceScore,
        verificationStatus: 'UNREVIEWED'
      };

      results.push(resultItem);
    } else {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('=') && !trimmed.startsWith('-')) {
        unparsedLines.push(trimmed);
      }
    }
  }

  return {
    id: `rep-${Date.now()}`,
    patientId,
    title: 'Laboratory Findings & Clinical Diagnostic Panel',
    facility,
    reportDate,
    rawText: rawReportText,
    results,
    unparsedLines,
    extractionEngine: LOCAL_ENGINE_NAME,
    processedAt: new Date().toISOString(),
    isDemoData
  };
}
