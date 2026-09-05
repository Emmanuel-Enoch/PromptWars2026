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
 * Report-metadata line patterns that must NEVER become LabTestResults.
 * A line is metadata if it matches one of these patterns.
 */
const METADATA_LINE_REGEX = /^(?:Report\s*Date|Specimen\s*Date|Collection\s*Date|Date\s*Collected|Order\s*Date|Patient|Ordering|Physician|DOB|Date\s+of\s+Birth|Requisition|Order\s*#|Report\s*#|Accession|Received|Reported)[\s:]/i;

/**
 * Extracts metadata such as facility and report date from header lines.
 */
function extractReportMetadata(lines: string[]) {
  let facility = 'Clinical Laboratory Facility';
  let reportDate = new Date().toISOString().split('T')[0];

  for (const line of lines.slice(0, 20)) {
    // Facility detection (prefer first matching header line; exclude section titles like CLINICAL NOTES)
    if (
      facility === 'Clinical Laboratory Facility' &&
      /LABORATOR|HOSPITAL|CLINIC|DIAGNOSTIC|HEALTH|PATHOLOG|CENTER|MEDICAL/i.test(line) &&
      !line.startsWith('=') &&
      !line.startsWith('-') &&
      !/^(CLINICAL\s+NOTE|NOTE|OBSERVATION|TEST\s+NAME|PATIENT|ORDERING|PHYSICIAN)/i.test(line.trim())
    ) {
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
 * Returns null for metadata lines, headers, and non-test lines.
 */
function parseReportLine(line: string): ExtractedRawResult | null {
  const trimmed = line.trim();

  // Skip empty lines and horizontal rules
  if (!trimmed || trimmed.startsWith('=') || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('#')) {
    return null;
  }

  // Skip metadata lines FIRST — these must never become lab results
  // e.g. "Report Date: 2026-03-01", "Patient: John Doe", "Ordering Physician: Dr. Smith"
  if (METADATA_LINE_REGEX.test(trimmed)) {
    return null;
  }

  // Skip obvious non-test lines (section headers, notes, etc.)
  if (/^(TEST NAME|ORDERING|PHYSICIAN|DOB|SPECIMEN|REQUISITION|PANEL:|CLINICAL NOTES|LABORATORY OBSERVATIONS|PATHOLOGIST)/i.test(trimmed)) {
    return null;
  }

  // Format A: Whitespace/Tabular alignment with possible trailing flags
  // e.g. "Glucose, Serum                142      mg/dL      70 - 99            HIGH"
  // e.g. "Creatinine, Serum             1.42     mg/dL      0.60 - 1.20        HIGH"
  // e.g. "Hemoglobin A1c                8.1      %          < 5.7"
  // e.g. "eGFR (Estimated GFR)          54       mL/min     [None provided by ordering lab]"
  // e.g. "eGFR                          82       mL/min/1.73m²"
  // e.g. "Fasting Insulin               14.5     uIU/mL"
  
  // Unit pattern: accommodates compound units with embedded numbers/decimals/superscripts (e.g. mL/min/1.73m², x10^3/uL)
  const unitPattern = '([A-Za-z0-9/%^*.²³µμ\\-]+(?:\\s+m[²2])?)';

  // Try standard column alignment (\s{2,}) first, then single space (\s+)
  const tabularRegex = new RegExp(`^([A-Za-z0-9\\s,/\\-()'.+]+?)\\s{2,}([<>]?[0-9.]+)\\s+${unitPattern}(?:[\\t ]+(.*?))?$`);
  const singleSpaceRegex = new RegExp(`^([A-Za-z0-9\\s,/\\-()'.+]+?)\\s+([<>]?[0-9.]+)\\s+${unitPattern}(?:[\\t ]+(.*?))?$`);
  const tabMatch = trimmed.match(tabularRegex) || trimmed.match(singleSpaceRegex);

  if (tabMatch) {
    const rawName = tabMatch[1].trim();
    const rawVal = tabMatch[2].trim();
    const rawUnit = tabMatch[3].trim();
    let rawRange: string | null = tabMatch[4] ? tabMatch[4].trim() : null;

    // Clean up trailing flags (HIGH, LOW, NORMAL, ABNORMAL, CRITICAL, *) from reference range column if present
    if (rawRange) {
      rawRange = rawRange.replace(/\s+(HIGH|LOW|NORMAL|ABNORMAL|CRITICAL|\*)\s*$/i, '').trim();
      if (/^(HIGH|LOW|NORMAL|ABNORMAL|CRITICAL|\*)$/i.test(rawRange)) {
        rawRange = null;
      }
      if (rawRange === '' || rawRange === '-' || rawRange === '--') {
        rawRange = null;
      }
    } else {
      rawRange = null;
    }

    // Safety check: a reference range must never be a fragmented unit snippet like ".73m²"
    if (rawRange && /^\.[0-9]+[a-z²³]/i.test(rawRange)) {
      rawRange = null;
    }

    // Guard against picking up section headers or known metadata keyword names
    if (rawName.length >= 2 && !/^(PANEL|TEST\s+NAME|NOTE)\b/i.test(rawName) && !/^TOTAL\s*(?:TESTS?|RESULTS?)?\s*[:=0-9]/i.test(rawName)) {
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
  // NOTE: metadata lines are already filtered above so "Report Date: ..." never reaches here
  const kvRegex = new RegExp(`^([A-Za-z0-9\\s,/\\-()'.+]+?):\\s*([<>]?[0-9.]+)\\s*(?:${unitPattern})?\\s*(?:\\((?:Ref|Reference)?\\s*:?\\s*([^)]+)\\)|\\[([^\\]]+)\\])?`, 'i');
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

      // Value must be numeric, and name must not look like a metadata label
      if (!isNaN(parseFloat(rawVal)) && !METADATA_LINE_REGEX.test(rawName + ':')) {
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

  // Format D: Qualitative test row (e.g. "Qualitative Protein    POSITIVE")
  const qualRegex = /^([-A-Za-z0-9\s,/\\()'.+]+?)\s{2,}(POSITIVE|NEGATIVE|DETECTED|NOT DETECTED|REACTIVE|NON-REACTIVE|INDETERMINATE|EQUIVOCAL)(?:\s+(.*?))?$/i;
  const qualMatch = trimmed.match(qualRegex);
  if (qualMatch) {
    const rawName = qualMatch[1].trim();
    const rawVal = qualMatch[2].trim().toUpperCase();
    let rawRange: string | null = qualMatch[3] ? qualMatch[3].trim() : null;
    if (rawRange && /^(HIGH|LOW|NORMAL|ABNORMAL|CRITICAL|\*)$/i.test(rawRange)) {
      rawRange = null;
    }
    if (rawName.length >= 2 && !/^(PANEL|TEST\s+NAME|NOTE)\b/i.test(rawName) && !/^TOTAL\s*(?:TESTS?|RESULTS?)?\s*[:=0-9]/i.test(rawName)) {
      return {
        testName: rawName,
        valueStr: rawVal,
        unitStr: '',
        refRangeStr: rawRange,
        rawSnippet: line
      };
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
  isDemoData: boolean = false,
  customTitle?: string
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
        provenance: 'LOCAL_EXTRACTED',   // Honest: deterministic local parser, NOT an AI model
        extractionEngine: LOCAL_ENGINE_NAME,
        confidence,
        confidenceScore,
        verificationStatus: 'UNREVIEWED',
        // Phase 2: immutable snapshot — never altered by human edits
        originalExtracted: {
          testName: parsed.testName,
          value: parsed.valueStr,
          unit: parsed.unitStr,
          sourceReferenceRange: evaluated.sourceReferenceRange,
          sourceSnippet: parsed.rawSnippet.trim()
        }
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
    title: customTitle?.trim() || 'Laboratory Findings & Clinical Diagnostic Panel',
    facility,
    reportDate,
    rawText: rawReportText,
    results,
    unparsedLines,
    extractionEngine: LOCAL_ENGINE_NAME,
    processedAt: new Date().toISOString(),
    isDemoData,
    auditLog: []  // Phase 2: starts empty, populated by verification actions
  };
}
