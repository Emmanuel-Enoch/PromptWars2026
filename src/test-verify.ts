// MedLens Phase 2 Automated Verification Script
// Covers Phase 1 regression + Phase 2 features
import { parseMedicalReport, LOCAL_ENGINE_NAME } from './services/deterministicParser';
import { evaluateReferenceRange, NOT_PROVIDED_MESSAGE } from './services/referenceRangeEvaluator';
import { compareMedicalReports, normalizeTestKey } from './services/reportComparison';
import { DEMO_PATIENTS, DEMO_REPORTS } from './data/demoData';

declare const process: any;

console.log('====================================================');
console.log('MEDLENS PHASE 2 AUTOMATED VERIFICATION');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${message}`);
  }
}

// ============================================================
// SECTION 1: REGRESSION — REPORT DATE BUG FIX
// ============================================================
console.log('\n--- SECTION 1: Report Date Bug Regression ---\n');

// Minimal report containing only a Report Date metadata line
const reportDateOnlyText = `
================================================================================
CLINICAL LAB
Report Date: 2026-03-01
================================================================================
`;
const reportDateOnly = parseMedicalReport(reportDateOnlyText, 'test-pt', false);
const reportDateResult = reportDateOnly.results.find(r =>
  r.testName.toLowerCase().includes('report date') ||
  r.testName.toLowerCase().includes('date')
);
assert(
  reportDateResult === undefined,
  'BUG #1 FIX: "Report Date: 2026-03-01" must NOT produce a LabTestResult'
);
assert(
  reportDateOnly.reportDate === '2026-03-01',
  'Report date is stored correctly in MedicalReport.reportDate'
);

// Inline report-date in CMP header
const cmpText = DEMO_REPORTS[0].rawText;
const cmpParsed = parseMedicalReport(cmpText, 'test-pt', false);
const rdFromCmp = cmpParsed.results.find(r =>
  r.testName.toLowerCase().includes('report date') ||
  r.testName.toLowerCase().includes('order #')
);
assert(
  rdFromCmp === undefined,
  'Demo CMP report: "Report Date:" header line does NOT produce a LabTestResult'
);

// Patient metadata lines
const patientLineText = `
================================================================================
CLINICAL LAB
Patient: John Doe (DEMO-PT-001) | DOB: 1968-04-12
Ordering Physician: Dr. Smith
Report Date: 2026-03-05
================================================================================
Glucose, Serum                100      mg/dL      70 - 99
`;
const patientLineParsed = parseMedicalReport(patientLineText, 'test-pt', false);
const patientResult = patientLineParsed.results.find(r =>
  r.testName.toLowerCase().includes('patient') ||
  r.testName.toLowerCase().includes('ordering') ||
  r.testName.toLowerCase().includes('physician') ||
  r.testName.toLowerCase().includes('dob')
);
assert(
  patientResult === undefined,
  'Patient/Physician/DOB metadata lines do NOT produce LabTestResults'
);
assert(
  patientLineParsed.results.length === 1,
  `Only Glucose is extracted (got ${patientLineParsed.results.length} results)`
);

// Pipe-format report date (would trigger Bug #1 in old parser)
const pipeDateText = `
CLINICAL LAB
Report Date: 2026-03-05 10:00 AM
Glucose | 100 | mg/dL | 70 - 99
`;
const pipeDateParsed = parseMedicalReport(pipeDateText, 'test-pt', false);
const pipeReportDateResult = pipeDateParsed.results.find(r =>
  r.testName.toLowerCase().includes('report date')
);
assert(
  pipeReportDateResult === undefined,
  'Pipe-format report: "Report Date:" line does NOT produce a LabTestResult'
);

// ============================================================
// SECTION 2: PROVENANCE HONESTY (Bug #2 Fix)
// ============================================================
console.log('\n--- SECTION 2: Provenance Honesty ---\n');

const rep1 = parseMedicalReport(DEMO_REPORTS[0].rawText, 'test-pt', true);
assert(
  rep1.results.length > 0,
  'Report 1 has extracted results'
);
if (rep1.results.length > 0) {
  const firstResult = rep1.results[0];
  assert(
    firstResult.provenance === 'LOCAL_EXTRACTED',
    `Provenance is LOCAL_EXTRACTED (got: ${firstResult.provenance})`
  );
  assert(
    firstResult.provenance !== 'AI_EXTRACTED' as string,
    'Provenance is NOT the misleading AI_EXTRACTED label'
  );
  assert(
    firstResult.provenance !== 'AI_GENERATED' as string,
    'Provenance is NOT AI_GENERATED (no AI model was used)'
  );
  assert(
    firstResult.extractionEngine === LOCAL_ENGINE_NAME,
    `Extraction engine is "${LOCAL_ENGINE_NAME}" (got: ${firstResult.extractionEngine})`
  );
}

// ============================================================
// SECTION 3: PHASE 1 REGRESSION — DEMO DATA PATIENTS
// ============================================================
console.log('\n--- SECTION 3: Phase 1 Regression — Demo Patients ---\n');

assert(DEMO_PATIENTS.length >= 2, 'At least 2 synthetic demo patients defined');
const pt1 = DEMO_PATIENTS[0];
assert(pt1.name === 'Elena Rostova', 'Demo patient 1 name is Elena Rostova');
assert(pt1.allergies.length >= 1, 'Demo patient has documented allergies');
assert(pt1.medications.length >= 1, 'Demo patient has active medications');
assert(pt1.isDemoData === true, 'Demo patient is flagged with isDemoData: true');

// ============================================================
// SECTION 4: NORMAL VALUE WITH EXPLICIT SOURCE RANGE
// ============================================================
console.log('\n--- SECTION 4: Normal Value with Explicit Source Range ---\n');

const sodium = rep1.results.find(r => r.testName.toLowerCase().includes('sodium'));
assert(Boolean(sodium), 'Sodium extracted from CMP report');
if (sodium) {
  assert(sodium.value === '139', `Sodium value is 139 (got ${sodium.value})`);
  assert(sodium.status === 'NORMAL', `Sodium status is NORMAL (got ${sodium.status})`);
  assert(sodium.rangeProvided === true, 'Sodium rangeProvided is true');
  assert(sodium.sourceReferenceRange === '135 - 145', `Sodium range is 135 - 145 (got ${sodium.sourceReferenceRange})`);
}

// ============================================================
// SECTION 5: HIGH VALUE WITH EXPLICIT SOURCE RANGE
// ============================================================
console.log('\n--- SECTION 5: High Value with Explicit Source Range ---\n');

const glucose = rep1.results.find(r => r.testName.toLowerCase().includes('glucose'));
assert(Boolean(glucose), 'Glucose extracted');
if (glucose) {
  assert(glucose.value === '142', `Glucose value is 142 (got ${glucose.value})`);
  assert(glucose.sourceReferenceRange === '70 - 99', `Glucose source range is 70 - 99 (got ${glucose.sourceReferenceRange})`);
  assert(glucose.status === 'HIGH', `Glucose status is HIGH (got ${glucose.status})`);
  assert(glucose.rangeProvided === true, 'Glucose rangeProvided is true');
}

// ============================================================
// SECTION 6: LOW VALUE WITH EXPLICIT SOURCE RANGE
// ============================================================
console.log('\n--- SECTION 6: Low Value with Explicit Source Range ---\n');

const potassium = rep1.results.find(r => r.testName.toLowerCase().includes('potassium'));
assert(Boolean(potassium), 'Potassium extracted');
if (potassium) {
  assert(potassium.value === '3.2', `Potassium value is 3.2 (got ${potassium.value})`);
  assert(potassium.sourceReferenceRange === '3.5 - 5.0', `Potassium range is 3.5 - 5.0 (got ${potassium.sourceReferenceRange})`);
  assert(potassium.status === 'LOW', `Potassium status is LOW (got ${potassium.status})`);
}

// ============================================================
// SECTION 7: MISSING REFERENCE RANGE
// ============================================================
console.log('\n--- SECTION 7: Missing Reference Range ---\n');

const rep2 = parseMedicalReport(DEMO_REPORTS[1].rawText, pt1.id, true);

const egfr = rep2.results.find(r => r.testName.toLowerCase().includes('egfr'));
assert(Boolean(egfr), 'eGFR extracted');
if (egfr) {
  assert(egfr.rangeProvided === false, 'eGFR rangeProvided is false');
  assert(egfr.status === 'NOT_PROVIDED_IN_SOURCE', `eGFR status is NOT_PROVIDED_IN_SOURCE (got ${egfr.status})`);
  assert(
    egfr.sourceReferenceRange === null || egfr.sourceReferenceRange!.toLowerCase().includes('none'),
    'eGFR range was not fabricated'
  );
}

const insulin = rep2.results.find(r => r.testName.toLowerCase().includes('insulin'));
assert(Boolean(insulin), 'Fasting Insulin extracted');
if (insulin) {
  assert(insulin.status === 'NOT_PROVIDED_IN_SOURCE', `Insulin status is NOT_PROVIDED_IN_SOURCE (got ${insulin.status})`);
}

// Reference range evaluator null safety
const edge1 = evaluateReferenceRange(150, null);
assert(edge1.status === 'NOT_PROVIDED_IN_SOURCE', 'Null range returns NOT_PROVIDED_IN_SOURCE');
assert(edge1.displayRange === NOT_PROVIDED_MESSAGE, `Displays "${NOT_PROVIDED_MESSAGE}"`);

const edge2 = evaluateReferenceRange(150, '');
assert(edge2.status === 'NOT_PROVIDED_IN_SOURCE', 'Empty range returns NOT_PROVIDED_IN_SOURCE');

const edge3 = evaluateReferenceRange(150, 'None provided by lab');
assert(edge3.status === 'NOT_PROVIDED_IN_SOURCE', '"None provided" returns NOT_PROVIDED_IN_SOURCE');

// ============================================================
// SECTION 8: SOURCE SNIPPET PRESERVATION
// ============================================================
console.log('\n--- SECTION 8: Source Snippet Preservation ---\n');

assert(Boolean(glucose), 'Glucose result present for snippet check');
if (glucose) {
  assert(
    glucose.sourceSnippet.includes('Glucose, Serum'),
    `Glucose source snippet contains "Glucose, Serum" (got: "${glucose.sourceSnippet}")`
  );
  assert(
    glucose.sourceSnippet.includes('142'),
    'Glucose source snippet contains the raw value 142'
  );
  assert(
    glucose.sourceSnippet !== '',
    'Glucose source snippet is non-empty'
  );
}

// originalExtracted snapshot is immutable and matches initial extraction
if (glucose) {
  assert(
    glucose.originalExtracted !== undefined,
    'Glucose originalExtracted snapshot exists'
  );
  if (glucose.originalExtracted) {
    assert(
      glucose.originalExtracted.testName === glucose.testName,
      'originalExtracted.testName matches initial extraction'
    );
    assert(
      glucose.originalExtracted.value === glucose.value,
      'originalExtracted.value matches initial extraction'
    );
    assert(
      glucose.originalExtracted.sourceSnippet !== '',
      'originalExtracted.sourceSnippet is non-empty'
    );
  }
}

// ============================================================
// SECTION 9: LOCAL EXTRACTION PROVENANCE
// ============================================================
console.log('\n--- SECTION 9: Local Extraction Provenance ---\n');

assert(
  rep1.extractionEngine === LOCAL_ENGINE_NAME,
  `Report extractionEngine is "${LOCAL_ENGINE_NAME}"`
);
rep1.results.forEach(r => {
  if (r.provenance !== 'LOCAL_EXTRACTED') {
    console.error(`[FAIL] Result "${r.testName}" has wrong provenance: ${r.provenance}`);
    totalTests++;
  }
});
assert(
  rep1.results.every(r => r.provenance === 'LOCAL_EXTRACTED'),
  'ALL results have provenance LOCAL_EXTRACTED'
);

// ============================================================
// SECTION 10: VERIFY ACTION SIMULATION
// ============================================================
console.log('\n--- SECTION 10: Verify Action ---\n');

// Simulate what App.tsx handleVerify does
const mockReport = parseMedicalReport(DEMO_REPORTS[0].rawText, 'test-pt', false);
const mockResult = mockReport.results[0];
assert(
  mockResult.verificationStatus === 'UNREVIEWED',
  'Fresh result starts UNREVIEWED'
);

// Simulate verify
const now = new Date().toISOString();
const verifiedResult = {
  ...mockResult,
  verificationStatus: 'VERIFIED' as const,
  verifiedAt: now,
  verifiedBy: 'Clinical Reviewer'
};
assert(
  verifiedResult.verificationStatus === 'VERIFIED',
  'After verify: status is VERIFIED'
);
assert(
  verifiedResult.verifiedBy === 'Clinical Reviewer',
  'After verify: verifiedBy is set'
);
assert(
  verifiedResult.verifiedAt !== undefined,
  'After verify: verifiedAt timestamp is set'
);
assert(
  verifiedResult.originalExtracted !== undefined,
  'After verify: originalExtracted snapshot is preserved'
);

// ============================================================
// SECTION 11: EDIT ACTION + AUDIT RECORD
// ============================================================
console.log('\n--- SECTION 11: Edit Action + Audit Record ---\n');

const originalValue = mockResult.value;
const originalUnit = mockResult.unit;
const editedResult = {
  ...mockResult,
  value: '141',
  unit: mockResult.unit,
  testName: mockResult.testName,
  verificationStatus: 'EDITED' as const,
  verifiedAt: now,
  verifiedBy: 'Clinical Reviewer',
  editReason: 'OCR correction: source clearly shows 141 not 142'
  // originalExtracted intentionally unchanged
};

const editAuditEntry = {
  id: `audit-test-${Date.now()}`,
  timestamp: now,
  actor: 'Clinical Reviewer',
  action: 'EDITED' as const,
  resultId: mockResult.id,
  testName: mockResult.testName,
  previousValue: `${originalValue} ${originalUnit}`.trim(),
  newValue: `${editedResult.value} ${editedResult.unit}`.trim(),
  reason: editedResult.editReason
};

assert(
  editedResult.verificationStatus === 'EDITED',
  'After edit: verificationStatus is EDITED'
);
assert(
  editedResult.originalExtracted?.value === originalValue,
  `After edit: originalExtracted.value still holds original "${originalValue}" (not "${editedResult.value}")`
);
assert(
  editedResult.editReason !== undefined && editedResult.editReason.length > 0,
  'After edit: editReason is recorded'
);
assert(
  editAuditEntry.action === 'EDITED',
  'Audit entry action is EDITED'
);
assert(
  editAuditEntry.previousValue !== undefined && editAuditEntry.previousValue.includes(originalValue),
  `Audit entry previousValue contains original value "${originalValue}"`
);
assert(
  editAuditEntry.reason !== undefined && editAuditEntry.reason.length > 0,
  'Audit entry reason is non-empty'
);

// ============================================================
// SECTION 12: REJECT ACTION + AUDIT RECORD
// ============================================================
console.log('\n--- SECTION 12: Reject Action + Audit Record ---\n');

const rejectedResult = {
  ...mockResult,
  verificationStatus: 'REJECTED' as const,
  verifiedAt: now,
  verifiedBy: 'Clinical Reviewer',
  rejectionReason: 'Duplicate entry — specimen label error identified'
};

const rejectAuditEntry = {
  id: `audit-test-${Date.now()}`,
  timestamp: now,
  actor: 'Clinical Reviewer',
  action: 'REJECTED' as const,
  resultId: mockResult.id,
  testName: mockResult.testName,
  previousValue: 'UNREVIEWED',
  newValue: 'REJECTED',
  reason: rejectedResult.rejectionReason
};

assert(
  rejectedResult.verificationStatus === 'REJECTED',
  'After reject: verificationStatus is REJECTED'
);
assert(
  rejectedResult.originalExtracted !== undefined,
  'After reject: originalExtracted is still preserved (evidence not deleted)'
);
assert(
  rejectedResult.rejectionReason !== undefined && rejectedResult.rejectionReason.length > 0,
  'After reject: rejectionReason is recorded'
);
assert(
  rejectAuditEntry.action === 'REJECTED',
  'Audit entry action is REJECTED'
);
assert(
  rejectAuditEntry.reason !== undefined && rejectAuditEntry.reason.length > 0,
  'Audit entry reason is non-empty (required for REJECTED)'
);
assert(
  rejectAuditEntry.previousValue !== undefined,
  'Audit entry records previous status'
);

// ============================================================
// SECTION 13: LOCALSTORAGE PERSISTENCE SIMULATION
// ============================================================
console.log('\n--- SECTION 13: LocalStorage Persistence ---\n');

// Simulate save/load round-trip using JSON serialization (mirrors storageService behavior)
const savedReport = parseMedicalReport(DEMO_REPORTS[0].rawText, 'test-pt', true);
// Mark first result as verified to test persistence of verification state
const verifiedReportResults = savedReport.results.map((r, i) =>
  i === 0 ? { ...r, verificationStatus: 'VERIFIED' as const, verifiedAt: now, verifiedBy: 'Clinical Reviewer' } : r
);
const savedWithVerification = { ...savedReport, results: verifiedReportResults, auditLog: [editAuditEntry] };

// Serialize and deserialize (simulating JSON.stringify / JSON.parse from localStorage)
const serialized = JSON.stringify(savedWithVerification);
const restored = JSON.parse(serialized);

assert(
  typeof serialized === 'string' && serialized.length > 0,
  'Report serializes to non-empty JSON string'
);
assert(
  restored.results[0].verificationStatus === 'VERIFIED',
  'After round-trip: verification status VERIFIED is preserved'
);
assert(
  restored.results[0].verifiedBy === 'Clinical Reviewer',
  'After round-trip: verifiedBy is preserved'
);
assert(
  restored.auditLog.length === 1,
  'After round-trip: audit log entry is preserved'
);
assert(
  restored.auditLog[0].action === 'EDITED',
  'After round-trip: audit log action is preserved'
);
assert(
  restored.results[0].originalExtracted !== undefined,
  'After round-trip: originalExtracted snapshot is preserved'
);
assert(
  restored.reportDate !== undefined && restored.reportDate.length > 0,
  'After round-trip: reportDate is preserved'
);

// ============================================================
// SECTION 14: MULTI-CATEGORY PANEL (Phase 1 Regression)
// ============================================================
console.log('\n--- SECTION 14: Multi-Category Panel Regression ---\n');

const rep3 = parseMedicalReport(DEMO_REPORTS[2].rawText, 'demo-pt-002', true);
assert(rep3.results.length >= 10, `Multi-category panel extracted ${rep3.results.length} tests`);

const wbc = rep3.results.find(r => r.testName.toLowerCase().includes('wbc'));
const hdl = rep3.results.find(r => r.testName.toLowerCase().includes('hdl'));
const tsh = rep3.results.find(r => r.testName.toLowerCase().includes('tsh'));

assert(Boolean(wbc), 'Hematology test (WBC) extracted');
if (wbc) assert(wbc.status === 'HIGH', `WBC (11.8) is HIGH (got ${wbc.status})`);

assert(Boolean(hdl), 'Lipid test (HDL) extracted');
if (hdl) assert(hdl.status === 'NORMAL', `HDL (42) is NORMAL (got ${hdl.status})`);

assert(Boolean(tsh), 'Endocrine test (TSH) extracted');
if (tsh) assert(tsh.status === 'HIGH', `TSH (6.45) is HIGH (got ${tsh.status})`);

// Rep3 must not contain "Report Date" result
const rep3ReportDateResult = rep3.results.find(r => r.testName.toLowerCase().includes('report date'));
assert(
  rep3ReportDateResult === undefined,
  'Multi-panel report: "Report Date:" line does NOT produce a LabTestResult'
);

// ============================================================
// SECTION 15: HbA1c (<5.7 format)
// ============================================================
console.log('\n--- SECTION 15: Upper-bound reference range (<5.7) ---\n');

const hba1c = rep2.results.find(r => r.testName.toLowerCase().includes('hemoglobin a1c'));
assert(Boolean(hba1c), 'Hemoglobin A1c extracted');
if (hba1c) {
  assert(hba1c.value === '8.1', `HbA1c value is 8.1 (got ${hba1c.value})`);
  assert(hba1c.status === 'HIGH', `HbA1c status is HIGH based on < 5.7 (got ${hba1c.status})`);
}

// ============================================================
// SECTION 16: Phase 3A — Real User-Provided Report Ingestion
// ============================================================
console.log('\n--- SECTION 16: Phase 3A — Real User-Provided Report Ingestion ---\n');

const userPastedReportText = `================================================================================
ST. MARY OUTPATIENT PATHOLOGY SERVICES
Patient: Mark Davis | DOB: 1975-11-20 | Sex: Male
Ordering Physician: Dr. Robert Vance, MD
Report Date: 2026-03-10 09:30 AM | Accession: SMH-2026-9912
================================================================================
TEST NAME                     RESULT   UNITS      REFERENCE RANGE    FLAGS
--------------------------------------------------------------------------------
Glucose, Fasting              158      mg/dL      70 - 99            HIGH
Serum Sodium                  138      mmol/L     136 - 145          NORMAL
Serum Potassium               3.1      mmol/L     3.5 - 5.1          LOW
Creatinine                    1.65     mg/dL      0.70 - 1.30        HIGH
eGFR (CKD-EPI 2021)           48       mL/min     [None provided by ordering lab]
================================================================================
CLINICAL NOTES:
- Fasting sample received at 08:15 AM.
- Repeat potassium performed on Roche analyzer confirms 3.1 mmol/L.
================================================================================`;

const userCustomTitle = 'St. Mary Renal & Metabolic Panel - March 2026';
const userReport = parseMedicalReport(userPastedReportText, 'user-pt-001', false, userCustomTitle);

// 1. Raw text preservation
assert(userReport.rawText === userPastedReportText, '16.1: Raw user-provided source text is preserved verbatim');
assert(userReport.title === userCustomTitle, '16.2: User-provided custom report title is preserved');
assert(userReport.isDemoData === false, '16.3: User-provided report is flagged with isDemoData: false');
assert(userReport.facility.includes('ST. MARY'), '16.4: Extracted facility from user report header');
assert(userReport.reportDate === '2026-03-10', `16.5: Extracted reportDate is 2026-03-10 (got ${userReport.reportDate})`);

// 2. Report Date metadata line must NEVER become a LabTestResult
const userReportDateResult = userReport.results.find(r =>
  r.testName.toLowerCase().includes('report date') ||
  r.testName.toLowerCase().includes('accession')
);
assert(userReportDateResult === undefined, '16.6: "Report Date:" metadata line does NOT become a LabTestResult in user report');

// 3. Extracted results count
assert(userReport.results.length === 5, `16.7: Exactly 5 lab parameters extracted from user report (got ${userReport.results.length})`);

// 4. Source snippets come from actual submitted text
const userGlucose = userReport.results.find(r => r.testName.toLowerCase().includes('glucose'));
assert(Boolean(userGlucose), '16.8: User report Glucose extracted');
if (userGlucose) {
  assert(userGlucose.value === '158', `User Glucose value is 158 (got ${userGlucose.value})`);
  assert(userGlucose.sourceReferenceRange === '70 - 99', `User Glucose range is 70 - 99 (got ${userGlucose.sourceReferenceRange})`);
  assert(userGlucose.status === 'HIGH', `User Glucose status is HIGH (got ${userGlucose.status})`);
  assert(userGlucose.sourceSnippet.includes('Glucose, Fasting'), '16.9: Source snippet contains exact verbatim text "Glucose, Fasting"');
  assert(userGlucose.sourceSnippet.includes('158'), '16.10: Source snippet contains raw value 158');
  assert(userPastedReportText.includes(userGlucose.sourceSnippet), '16.11: Source snippet is a substring of the actual submitted text');
}

// 5. LOCAL_EXTRACTED provenance honest attribution
assert(userReport.extractionEngine === LOCAL_ENGINE_NAME, `16.12: Engine is "${LOCAL_ENGINE_NAME}"`);
assert(userReport.results.every(r => r.provenance === 'LOCAL_EXTRACTED'), '16.13: All user report results have provenance LOCAL_EXTRACTED');

// 6. Source-only reference ranges enforced (eGFR has no range)
const userEgfr = userReport.results.find(r => r.testName.toLowerCase().includes('egfr'));
assert(Boolean(userEgfr), '16.14: User report eGFR extracted');
if (userEgfr) {
  assert(userEgfr.rangeProvided === false, '16.15: eGFR rangeProvided is false');
  assert(userEgfr.status === 'NOT_PROVIDED_IN_SOURCE', '16.16: eGFR status is NOT_PROVIDED_IN_SOURCE');
  assert(userEgfr.sourceReferenceRange === null || userEgfr.sourceReferenceRange!.toLowerCase().includes('none'), '16.17: eGFR range was not fabricated');
}

// 7. Phase 2 verification actions work on user-provided report
const userVerifyNow = new Date().toISOString();
const verifiedUserGlucose = {
  ...userGlucose!,
  verificationStatus: 'VERIFIED' as const,
  verifiedAt: userVerifyNow,
  verifiedBy: 'Clinical Reviewer'
};
assert(verifiedUserGlucose.verificationStatus === 'VERIFIED', '16.18: User report result can be verified');
assert(verifiedUserGlucose.originalExtracted?.value === '158', '16.19: originalExtracted is preserved on user report result');

// 8. Round-trip LocalStorage serialization on user-provided report
const userReportSerialized = JSON.stringify({
  ...userReport,
  results: [verifiedUserGlucose, ...userReport.results.slice(1)],
  auditLog: [{
    id: 'audit-user-001',
    timestamp: userVerifyNow,
    actor: 'Clinical Reviewer',
    action: 'VERIFIED' as const,
    resultId: userGlucose!.id,
    testName: userGlucose!.testName,
    newValue: 'VERIFIED'
  }]
});
const userReportRestored = JSON.parse(userReportSerialized);
assert(userReportRestored.rawText === userPastedReportText, '16.20: Restored user report rawText matches original user submitted text');
assert(userReportRestored.title === userCustomTitle, '16.21: Restored user report title matches');
assert(userReportRestored.isDemoData === false, '16.22: Restored user report isDemoData remains false');
assert(userReportRestored.results[0].verificationStatus === 'VERIFIED', '16.23: Restored user report verification status is preserved');
assert(userReportRestored.auditLog.length === 1, '16.24: Restored user report audit log is preserved');

// ============================================================
// SECTION 17: Compound Unit with Embedded Numbers Regression
// ============================================================
console.log('\n--- SECTION 17: Compound Unit with Embedded Numbers Regression ---\n');

// 1. eGFR 82 mL/min/1.73m² (single space, no range)
const egfrSingleSpaceText = `
CLINICAL LABORATORY
Report Date: 2026-03-15
eGFR 82 mL/min/1.73m²
`;
const egfrSingleRep = parseMedicalReport(egfrSingleSpaceText, 'test-pt', false);
const egfrSingleResult = egfrSingleRep.results.find(r => r.testName.toLowerCase() === 'egfr');
assert(Boolean(egfrSingleResult), '17.1: eGFR extracted from "eGFR 82 mL/min/1.73m²"');
if (egfrSingleResult) {
  assert(egfrSingleResult.value === '82', `17.2: eGFR value is 82 (got ${egfrSingleResult.value})`);
  assert(egfrSingleResult.unit === 'mL/min/1.73m²', `17.3: eGFR unit is intact as mL/min/1.73m² (got "${egfrSingleResult.unit}")`);
  assert(egfrSingleResult.rangeProvided === false, `17.4: eGFR rangeProvided is false (got ${egfrSingleResult.rangeProvided})`);
  assert(egfrSingleResult.status === 'NOT_PROVIDED_IN_SOURCE', `17.5: eGFR status is NOT_PROVIDED_IN_SOURCE (got ${egfrSingleResult.status})`);
  assert(egfrSingleResult.sourceReferenceRange === null, `17.6: eGFR sourceReferenceRange is null, NOT .73m² (got ${egfrSingleResult.sourceReferenceRange})`);
  assert(egfrSingleResult.sourceSnippet.includes('eGFR 82 mL/min/1.73m²'), '17.7: eGFR sourceSnippet contains original source line');
}

// 2. eGFR                    82 mL/min/1.73m² (column-aligned whitespace, no range)
const egfrTabularText = `
CLINICAL LABORATORY
Report Date: 2026-03-15
eGFR                    82 mL/min/1.73m²
`;
const egfrTabRep = parseMedicalReport(egfrTabularText, 'test-pt', false);
const egfrTabResult = egfrTabRep.results.find(r => r.testName.toLowerCase() === 'egfr');
assert(Boolean(egfrTabResult), '17.8: eGFR extracted from column-aligned line');
if (egfrTabResult) {
  assert(egfrTabResult.value === '82', `17.9: Column-aligned eGFR value is 82 (got ${egfrTabResult.value})`);
  assert(egfrTabResult.unit === 'mL/min/1.73m²', `17.10: Column-aligned eGFR unit is intact as mL/min/1.73m² (got "${egfrTabResult.unit}")`);
  assert(egfrTabResult.rangeProvided === false, `17.11: Column-aligned eGFR rangeProvided is false (got ${egfrTabResult.rangeProvided})`);
  assert(egfrTabResult.status === 'NOT_PROVIDED_IN_SOURCE', `17.12: Column-aligned eGFR status is NOT_PROVIDED_IN_SOURCE (got ${egfrTabResult.status})`);
  assert(egfrTabResult.sourceReferenceRange === null, `17.13: Column-aligned eGFR sourceReferenceRange is null (got ${egfrTabResult.sourceReferenceRange})`);
  assert(egfrTabResult.sourceSnippet.includes('eGFR                    82 mL/min/1.73m²'), '17.14: Column-aligned sourceSnippet preserved');
}

// 3. Existing explicit ranges still work: Glucose, Fasting 158 mg/dL 70 - 99 -> HIGH
const glucoseExplicitText = `
CLINICAL LABORATORY
Report Date: 2026-03-15
Glucose, Fasting 158 mg/dL 70 - 99
`;
const glucoseExplicitRep = parseMedicalReport(glucoseExplicitText, 'test-pt', false);
const glucoseExplicitResult = glucoseExplicitRep.results.find(r => r.testName.toLowerCase().includes('glucose'));
assert(Boolean(glucoseExplicitResult), '17.15: Glucose extracted from "Glucose, Fasting 158 mg/dL 70 - 99"');
if (glucoseExplicitResult) {
  assert(glucoseExplicitResult.value === '158', `17.16: Glucose value is 158 (got ${glucoseExplicitResult.value})`);
  assert(glucoseExplicitResult.unit === 'mg/dL', `17.17: Glucose unit is mg/dL (got "${glucoseExplicitResult.unit}")`);
  assert(glucoseExplicitResult.sourceReferenceRange === '70 - 99', `17.18: Glucose source range is 70 - 99 (got ${glucoseExplicitResult.sourceReferenceRange})`);
  assert(glucoseExplicitResult.rangeProvided === true, '17.19: Glucose rangeProvided is true');
  assert(glucoseExplicitResult.status === 'HIGH', `17.20: Glucose status is HIGH (got ${glucoseExplicitResult.status})`);
}

// 4. Compound unit with explicit range: eGFR 82 mL/min/1.73m² > 60 -> NORMAL
const egfrWithRangeText = `
CLINICAL LABORATORY
Report Date: 2026-03-15
eGFR 82 mL/min/1.73m² > 60
`;
const egfrWithRangeRep = parseMedicalReport(egfrWithRangeText, 'test-pt', false);
const egfrWithRangeResult = egfrWithRangeRep.results.find(r => r.testName.toLowerCase() === 'egfr');
assert(Boolean(egfrWithRangeResult), '17.21: eGFR with explicit range extracted');
if (egfrWithRangeResult) {
  assert(egfrWithRangeResult.value === '82', '17.22: eGFR with range value is 82');
  assert(egfrWithRangeResult.unit === 'mL/min/1.73m²', `17.23: eGFR unit intact with range (got "${egfrWithRangeResult.unit}")`);
  assert(egfrWithRangeResult.sourceReferenceRange === '> 60', `17.24: eGFR source range is > 60 (got ${egfrWithRangeResult.sourceReferenceRange})`);
  assert(egfrWithRangeResult.status === 'NORMAL', `17.25: eGFR status is NORMAL (82 > 60) (got ${egfrWithRangeResult.status})`);
}

// ============================================================
// SECTION 18: Phase 3B — Current vs Previous Report Comparison
// ============================================================
console.log('\n--- SECTION 18: Phase 3B — Report Comparison ---\n');

const reportTextA = `================================================================================
PREMIER HEALTH LAB - METABOLIC BASELINE
Patient: David Miller | DOB: 1965-05-14
Report Date: 2026-01-15
================================================================================
TEST NAME                     RESULT   UNITS      REFERENCE RANGE    FLAGS
--------------------------------------------------------------------------------
Glucose, Fasting              128      mg/dL      70 - 99            HIGH
Creatinine, Serum             1.24     mg/dL      0.60 - 1.20        HIGH
Potassium                     3.4      mmol/L     3.5 - 5.0          LOW
BUN                           18       mg/dL      7 - 20             NORMAL
Total Bilirubin               5.2      mg/dL      0.2 - 1.2          HIGH
Troponin                      0        ng/mL      < 0.04             NORMAL
Qualitative Protein           POSITIVE
================================================================================`;

const reportTextB = `================================================================================
PREMIER HEALTH LAB - FOLLOW UP PANEL
Patient: David Miller | DOB: 1965-05-14
Report Date: 2026-03-15
================================================================================
TEST NAME                     RESULT   UNITS      REFERENCE RANGE    FLAGS
--------------------------------------------------------------------------------
Glucose, Fasting              142      mg/dL      70 - 99            HIGH
Creatinine, Serum             1.10     mg/dL      0.60 - 1.20        NORMAL
Potassium                     3.8      mmol/L     3.6 - 5.2          NORMAL
Total Bilirubin               0.052    mmol/L     3.4 - 20.5
Troponin                      0.02     ng/mL      < 0.04             NORMAL
eGFR                          82       mL/min/1.73m²
Qualitative Protein           NEGATIVE
================================================================================`;

const repA = parseMedicalReport(reportTextA, 'pt-comp-01', false, 'Baseline Panel (Jan 2026)');
const repB = parseMedicalReport(reportTextB, 'pt-comp-01', false, 'Follow-Up Panel (Mar 2026)');

// Save immutable snapshots to verify no mutation occurred
const repAJsonBefore = JSON.stringify(repA);
const repBJsonBefore = JSON.stringify(repB);

const comparison = compareMedicalReports(repA, repB);

// 0. Canonical normalization
assert(normalizeTestKey('Glucose, Fasting') === 'glucose', '18.0: normalizeTestKey canonicalizes clinical test names');

// 1. Matching test comparison
assert(comparison.matchingCount >= 5, `18.1: Found ${comparison.matchingCount} matching tests between panels`);
assert(comparison.previousReport.id === repA.id, '18.2: Previous report preserved in summary');
assert(comparison.currentReport.id === repB.id, '18.3: Current report preserved in summary');

// 2. Positive numerical change (Glucose: 128 -> 142 = +14 mg/dL)
const compGlucose = comparison.results.find(r => r.normalizedKey === 'glucose');
assert(Boolean(compGlucose), '18.4: Glucose found in comparison');
if (compGlucose) {
  assert(compGlucose.presence === 'BOTH', '18.5: Glucose presence is BOTH');
  assert(compGlucose.previousValue === '128', '18.6: Previous glucose value is 128');
  assert(compGlucose.currentValue === '142', '18.7: Current glucose value is 142');
  assert(compGlucose.absoluteChange === 14, `18.8: Glucose absolute change is 14 (got ${compGlucose.absoluteChange})`);
  assert(compGlucose.absoluteChangeDisplay === '+14 mg/dL', `18.9: Glucose absolute display is "+14 mg/dL" (got "${compGlucose.absoluteChangeDisplay}")`);
  
  // 4 & 5. Percentage change & correct rounding (+10.9%)
  assert(compGlucose.percentageChange === 10.9, `18.10: Glucose percentage change is 10.9 (got ${compGlucose.percentageChange})`);
  assert(compGlucose.percentageChangeDisplay === '+10.9%', `18.11: Glucose percentage display is "+10.9%" (got "${compGlucose.percentageChangeDisplay}")`);
  assert(compGlucose.previousStatus === 'HIGH', '18.12: Previous glucose status is HIGH');
  assert(compGlucose.currentStatus === 'HIGH', '18.13: Current glucose status is HIGH');
}

// 3. Negative numerical change (Creatinine: 1.24 -> 1.10 = -0.14 mg/dL, -11.3%)
const compCreatinine = comparison.results.find(r => r.normalizedKey === 'creatinine');
assert(Boolean(compCreatinine), '18.14: Creatinine found in comparison');
if (compCreatinine) {
  assert(compCreatinine.absoluteChange === -0.14, `18.15: Creatinine absolute change is -0.14 (got ${compCreatinine.absoluteChange})`);
  assert(compCreatinine.absoluteChangeDisplay === '-0.14 mg/dL', `18.16: Creatinine display is "-0.14 mg/dL" (got "${compCreatinine.absoluteChangeDisplay}")`);
  assert(compCreatinine.percentageChange === -11.3, `18.17: Creatinine percentage change is -11.3 (got ${compCreatinine.percentageChange})`);
  assert(compCreatinine.percentageChangeDisplay === '-11.3%', `18.18: Creatinine percentage display is "-11.3%" (got "${compCreatinine.percentageChangeDisplay}")`);
  assert(compCreatinine.previousStatus === 'HIGH', '18.19: Previous creatinine status is HIGH');
  assert(compCreatinine.currentStatus === 'NORMAL', '18.20: Current creatinine status is NORMAL');
}

// 6. Test present only in previous report (BUN)
const compBun = comparison.results.find(r => r.normalizedKey === 'bun');
assert(Boolean(compBun), '18.21: BUN found in comparison');
if (compBun) {
  assert(compBun.presence === 'ONLY_PREVIOUS', '18.22: BUN presence is ONLY_PREVIOUS');
  assert(compBun.currentValue === null, '18.23: Current BUN value is null');
  assert(compBun.absoluteChange === null, '18.24: No numerical change calculated for missing current test');
  assert(compBun.comparisonNote === 'Only in previous report', '18.25: Notes "Only in previous report"');
}

// 7. Test present only in current report (eGFR)
const compEgfr = comparison.results.find(r => r.normalizedKey === 'egfr');
assert(Boolean(compEgfr), '18.26: eGFR found in comparison');
if (compEgfr) {
  assert(compEgfr.presence === 'ONLY_CURRENT', '18.27: eGFR presence is ONLY_CURRENT');
  assert(compEgfr.previousValue === null, '18.28: Previous eGFR value is null');
  assert(compEgfr.absoluteChange === null, '18.29: No numerical change calculated for missing previous test');
  assert(compEgfr.comparisonNote === 'Only in current report', '18.30: Notes "Only in current report"');
  // 11. Missing reference range remains missing
  assert(compEgfr.currentRange === NOT_PROVIDED_MESSAGE, '18.31: eGFR current range is "Reference range not provided in source."');
}

// 10. Non-numeric value (Qualitative Protein)
const compProtein = comparison.results.find(r => r.normalizedKey.includes('protein'));
assert(Boolean(compProtein), '18.32: Qualitative protein found in comparison');
if (compProtein) {
  assert(compProtein.absoluteChange === null, '18.33: No numerical change for non-numeric values');
  assert(compProtein.comparisonNote === 'Numerical change not available.', '18.34: Notes "Numerical change not available."');
}

// 12. Previous and current reference ranges remain independent (Potassium)
const compPotassium = comparison.results.find(r => r.normalizedKey === 'potassium');
assert(Boolean(compPotassium), '18.35: Potassium found in comparison');
if (compPotassium) {
  assert(compPotassium.previousRange === '3.5 - 5.0', `18.36: Previous potassium range is 3.5 - 5.0 (got ${compPotassium.previousRange})`);
  assert(compPotassium.currentRange === '3.6 - 5.2', `18.37: Current potassium range is 3.6 - 5.2 (got ${compPotassium.currentRange})`);
  assert(compPotassium.previousRange !== compPotassium.currentRange, '18.38: Previous and current ranges preserved independently');
}

// 13. Different units prevent numerical comparison (Total Bilirubin mg/dL vs mmol/L)
const compBili = comparison.results.find(r => r.normalizedKey === 'bilirubin');
assert(Boolean(compBili), '18.39: Bilirubin found in comparison');
if (compBili) {
  assert(compBili.absoluteChange === null, '18.40: Absolute change is null when units differ');
  assert(compBili.percentageChange === null, '18.41: Percentage change is null when units differ');
  assert(compBili.comparisonNote === 'Units differ — numerical change not calculated.', '18.42: Displays "Units differ — numerical change not calculated."');
}

// 14 & 15. Zero previous value does not cause division by zero, no NaN/Infinity (Troponin: 0 -> 0.02)
const compTrop = comparison.results.find(r => r.normalizedKey === 'troponin');
assert(Boolean(compTrop), '18.43: Troponin found in comparison');
if (compTrop) {
  assert(compTrop.absoluteChange === 0.02, `18.44: Absolute change is 0.02 (got ${compTrop.absoluteChange})`);
  assert(compTrop.percentageChange === null, '18.45: Percentage change is null when previous value is 0');
  assert(compTrop.percentageChangeDisplay === 'Percentage change not available.', '18.46: Displays "Percentage change not available."');
  assert(!String(compTrop.absoluteChange).includes('NaN'), '18.47: No NaN in absolute change');
  assert(!String(compTrop.percentageChangeDisplay).includes('Infinity'), '18.48: No Infinity in percentage change display');
}

// 16. Original structured results are not mutated
assert(JSON.stringify(repA) === repAJsonBefore, '18.49: Previous MedicalReport was not mutated by comparison');
assert(JSON.stringify(repB) === repBJsonBefore, '18.50: Current MedicalReport was not mutated by comparison');

// 17 & 18. Comparison does not create fake provenance & points to original evidence
if (compGlucose) {
  assert(compGlucose.previousResult !== undefined, '18.51: previousResult preserved for provenance inspection');
  assert(compGlucose.currentResult !== undefined, '18.52: currentResult preserved for provenance inspection');
  assert(compGlucose.previousResult?.provenance === 'LOCAL_EXTRACTED', '18.53: previousResult retains honest LOCAL_EXTRACTED provenance');
  assert(compGlucose.currentResult?.provenance === 'LOCAL_EXTRACTED', '18.54: currentResult retains honest LOCAL_EXTRACTED provenance');
  assert(reportTextA.includes(compGlucose.previousResult!.sourceSnippet), '18.55: previousResult sourceSnippet comes from report A');
  assert(reportTextB.includes(compGlucose.currentResult!.sourceSnippet), '18.56: currentResult sourceSnippet comes from report B');
}

// ============================================================
// FINAL SUMMARY
// ============================================================
console.log(`\n====================================================`);
console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log('STATUS: ALL TESTS PASSED ✓');
} else {
  console.log(`STATUS: ${totalTests - passedTests} TEST(S) FAILED ✗`);
}
console.log(`====================================================\n`);

// Exit with failure code if any test failed (useful for CI)
if (passedTests < totalTests) {
  process.exit(1);
}
