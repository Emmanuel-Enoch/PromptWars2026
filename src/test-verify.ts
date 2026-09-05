// Automated Verification Script for MedLens Phase 1
import { parseMedicalReport, LOCAL_ENGINE_NAME } from './services/deterministicParser';
import { evaluateReferenceRange, NOT_PROVIDED_MESSAGE } from './services/referenceRangeEvaluator';
import { DEMO_PATIENTS, DEMO_REPORTS } from './data/demoData';

console.log('====================================================');
console.log('MEDLENS PHASE 1 AUTOMATED VERIFICATION');
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

// 1. Test Demo Patients
assert(DEMO_PATIENTS.length >= 2, 'At least 2 synthetic demo patients defined');
const pt1 = DEMO_PATIENTS[0];
assert(pt1.name === 'Elena Rostova', 'Demo patient 1 name is Elena Rostova');
assert(pt1.allergies.length >= 1, 'Demo patient has documented allergies');
assert(pt1.medications.length >= 1, 'Demo patient has active medications');
assert(pt1.isDemoData === true, 'Demo patient is flagged with isDemoData: true');

// 2. Test Report 1 Parsing (CMP - Normal, High, Low)
const rep1Def = DEMO_REPORTS[0];
const rep1 = parseMedicalReport(rep1Def.rawText, pt1.id, true);
assert(rep1.results.length >= 10, `Report 1 extracted ${rep1.results.length} parameters`);
assert(rep1.extractionEngine === LOCAL_ENGINE_NAME, 'Honest engine name: Local extraction engine');
assert(rep1.isDemoData === true, 'Report 1 flagged as isDemoData: true');

// Check Glucose (HIGH)
const glucose = rep1.results.find(r => r.testName.toLowerCase().includes('glucose'));
assert(Boolean(glucose), 'Glucose extracted');
if (glucose) {
  assert(glucose.value === '142', `Glucose value is 142 (got ${glucose.value})`);
  assert(glucose.sourceReferenceRange === '70 - 99', `Glucose source range is 70 - 99 (got ${glucose.sourceReferenceRange})`);
  assert(glucose.status === 'HIGH', `Glucose status is HIGH (got ${glucose.status})`);
  assert(glucose.sourceSnippet.includes('Glucose, Serum'), 'Glucose source snippet contains exact raw text');
}

// Check Potassium (LOW)
const potassium = rep1.results.find(r => r.testName.toLowerCase().includes('potassium'));
assert(Boolean(potassium), 'Potassium extracted');
if (potassium) {
  assert(potassium.value === '3.2', `Potassium value is 3.2 (got ${potassium.value})`);
  assert(potassium.sourceReferenceRange === '3.5 - 5.0', `Potassium range is 3.5 - 5.0 (got ${potassium.sourceReferenceRange})`);
  assert(potassium.status === 'LOW', `Potassium status is LOW (got ${potassium.status})`);
}

// Check Sodium (NORMAL)
const sodium = rep1.results.find(r => r.testName.toLowerCase().includes('sodium'));
assert(Boolean(sodium), 'Sodium extracted');
if (sodium) {
  assert(sodium.value === '139', `Sodium value is 139 (got ${sodium.value})`);
  assert(sodium.status === 'NORMAL', `Sodium status is NORMAL (got ${sodium.status})`);
}

// 3. Test Report 2 (Missing Reference Ranges)
const rep2Def = DEMO_REPORTS[1];
const rep2 = parseMedicalReport(rep2Def.rawText, pt1.id, true);

// Check eGFR (No reference range provided in source)
const egfr = rep2.results.find(r => r.testName.toLowerCase().includes('egfr'));
assert(Boolean(egfr), 'eGFR extracted');
if (egfr) {
  assert(egfr.rangeProvided === false, 'eGFR rangeProvided is false');
  assert(egfr.status === 'NOT_PROVIDED_IN_SOURCE', `eGFR status is NOT_PROVIDED_IN_SOURCE (got ${egfr.status})`);
  assert(egfr.sourceReferenceRange === null || egfr.sourceReferenceRange.includes('None provided'), 'eGFR range was not fabricated');
}

// Check Fasting Insulin (No range provided)
const insulin = rep2.results.find(r => r.testName.toLowerCase().includes('insulin'));
assert(Boolean(insulin), 'Fasting Insulin extracted');
if (insulin) {
  assert(insulin.status === 'NOT_PROVIDED_IN_SOURCE', `Insulin status is NOT_PROVIDED_IN_SOURCE (got ${insulin.status})`);
}

// Check HbA1c (< 5.7 format)
const hba1c = rep2.results.find(r => r.testName.toLowerCase().includes('hemoglobin a1c'));
assert(Boolean(hba1c), 'Hemoglobin A1c extracted');
if (hba1c) {
  assert(hba1c.value === '8.1', `HbA1c value is 8.1 (got ${hba1c.value})`);
  assert(hba1c.status === 'HIGH', `HbA1c status is HIGH based on < 5.7 (got ${hba1c.status})`);
}

// 4. Test Report 3 (Multi-Category Panel: CBC, Lipid, Thyroid)
const rep3Def = DEMO_REPORTS[2];
const rep3 = parseMedicalReport(rep3Def.rawText, 'demo-pt-002', true);
assert(rep3.results.length >= 10, `Multi-category panel extracted ${rep3.results.length} tests`);

const wbc = rep3.results.find(r => r.testName.toLowerCase().includes('wbc'));
const hdl = rep3.results.find(r => r.testName.toLowerCase().includes('hdl'));
const tsh = rep3.results.find(r => r.testName.toLowerCase().includes('tsh'));

assert(Boolean(wbc), 'Hematology test (WBC) extracted');
if (wbc) assert(wbc.status === 'HIGH', 'WBC (11.8) is HIGH (Ref: 4.5 - 11.0)');

assert(Boolean(hdl), 'Lipid test (HDL) extracted');
if (hdl) assert(hdl.status === 'NORMAL', 'HDL (42) is NORMAL (Ref: > 40)');

assert(Boolean(tsh), 'Endocrine test (TSH) extracted');
if (tsh) assert(tsh.status === 'HIGH', 'TSH (6.45) is HIGH (Ref: 0.45 - 4.50)');

// 5. Test Reference Range Evaluator Edge Cases
const edge1 = evaluateReferenceRange(150, null);
assert(edge1.status === 'NOT_PROVIDED_IN_SOURCE', 'Null range returns NOT_PROVIDED_IN_SOURCE');
assert(edge1.displayRange === NOT_PROVIDED_MESSAGE, 'Displays exact message: Reference range not provided in source.');

const edge2 = evaluateReferenceRange(150, '');
assert(edge2.status === 'NOT_PROVIDED_IN_SOURCE', 'Empty range returns NOT_PROVIDED_IN_SOURCE');

const edge3 = evaluateReferenceRange(150, 'None provided by lab');
assert(edge3.status === 'NOT_PROVIDED_IN_SOURCE', '"None provided" returns NOT_PROVIDED_IN_SOURCE');

console.log(`\n====================================================`);
console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log(`====================================================\n`);
