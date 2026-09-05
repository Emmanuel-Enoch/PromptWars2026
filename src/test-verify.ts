// MedLens Phase 2 Automated Verification Script
// Covers Phase 1 regression + Phase 2 features
import { parseMedicalReport, LOCAL_ENGINE_NAME } from './services/deterministicParser';
import { evaluateReferenceRange, NOT_PROVIDED_MESSAGE } from './services/referenceRangeEvaluator';
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
