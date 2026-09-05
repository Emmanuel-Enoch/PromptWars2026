// MedLens Synthetic Demo Data
// Clearly marked as synthetic clinical scenarios for hackathon demonstration.

import type { PatientProfile } from '../types';

export const DEMO_PATIENTS: PatientProfile[] = [
  {
    id: 'demo-pt-001',
    name: 'Elena Rostova',
    age: 58,
    sex: 'Female',
    symptoms: ['Mild fatigue', 'Polydipsia (excessive thirst)', 'Intermittent dizziness'],
    existingConditions: ['Type 2 Diabetes Mellitus (diagnosed 2019)', 'Essential Hypertension'],
    allergies: [
      { allergen: 'Penicillin', reaction: 'Urticaria (Hives)' },
      { allergen: 'Sulfa drugs', reaction: 'Mild rash' }
    ],
    medications: [
      { name: 'Metformin', dosage: '1000 mg', frequency: 'Twice daily' },
      { name: 'Lisinopril', dosage: '20 mg', frequency: 'Once daily in morning' },
      { name: 'Atorvastatin', dosage: '40 mg', frequency: 'Nightly' }
    ],
    otherNotes: 'Patient scheduled for routine semi-annual diabetic and renal monitoring.',
    isDemoData: true,
    createdAt: '2026-03-01T08:30:00Z'
  },
  {
    id: 'demo-pt-002',
    name: 'David Chen',
    age: 42,
    sex: 'Male',
    symptoms: ['Annual physical exam', 'Occasional morning fatigue'],
    existingConditions: ['No known chronic conditions'],
    allergies: [
      { allergen: 'Tree nuts', reaction: 'Anaphylaxis risk (carries EpiPen)' }
    ],
    medications: [
      { name: 'Multivitamin', dosage: 'Standard', frequency: 'Daily' }
    ],
    otherNotes: 'No prior hospitalizations or major surgical history.',
    isDemoData: true,
    createdAt: '2026-03-02T10:15:00Z'
  }
];

export interface DemoReportDefinition {
  id: string;
  name: string;
  categoryTag: string;
  description: string;
  facility: string;
  reportDate: string;
  rawText: string;
}

export const DEMO_REPORTS: DemoReportDefinition[] = [
  {
    id: 'demo-rep-001',
    name: 'Comprehensive Metabolic Panel (Normal, High, Low with Explicit Ranges)',
    categoryTag: 'CMP / Renal / Electrolytes',
    description: 'Demonstrates extraction of explicit reference ranges resulting in Low, Normal, and High classifications.',
    facility: 'MetroHealth Clinical Laboratories - Core Diagnostics',
    reportDate: '2026-03-01',
    rawText: `================================================================================
METROHEALTH CLINICAL LABORATORIES - OUTPATIENT SERVICES
Patient: Elena Rostova (DEMO-PT-001) | DOB: 1968-04-12 | Sex: Female
Ordering Physician: Dr. Sarah Jenkins, MD | Specimen Date: 2026-03-01 07:45 AM
Report Date: 2026-03-01 11:20 AM | Order #: MHL-8921-CMP
================================================================================
TEST NAME                     RESULT   UNITS      REFERENCE RANGE    FLAGS
--------------------------------------------------------------------------------
Glucose, Serum                142      mg/dL      70 - 99            HIGH
BUN (Blood Urea Nitrogen)     18       mg/dL      7 - 20             NORMAL
Creatinine, Serum             1.42     mg/dL      0.60 - 1.20        HIGH
Sodium                        139      mmol/L     135 - 145          NORMAL
Potassium                     3.2      mmol/L     3.5 - 5.0          LOW
Chloride                      102      mmol/L     96 - 106           NORMAL
Carbon Dioxide (CO2)          24       mmol/L     22 - 29            NORMAL
Calcium                       9.3      mg/dL      8.6 - 10.2         NORMAL
Total Protein                 7.1      g/dL       6.0 - 8.3          NORMAL
Albumin                       4.0      g/dL       3.5 - 5.0          NORMAL
Bilirubin, Total              0.7      mg/dL      0.2 - 1.2          NORMAL
Alkaline Phosphatase (ALP)    74       IU/L       44 - 121           NORMAL
AST (SGOT)                    28       U/L        10 - 40            NORMAL
ALT (SGPT)                    31       U/L        7 - 56             NORMAL
================================================================================
LABORATORY OBSERVATIONS & NOTES:
- Serum potassium confirmed by repeat spectrophotometric analysis.
- Elevated fasting glucose and creatinine noted; recommend correlation with baseline.
- All testing performed on Roche Cobas 8000 automated platform.
================================================================================`
  },
  {
    id: 'demo-rep-002',
    name: 'Specialty Renal & Glycemic Assessment (Contains Tests WITHOUT Reference Range)',
    categoryTag: 'Specialty / Missing Range Proof',
    description: 'Specifically tests the strict rule: if a reference range is absent from the source, the system flags NOT_PROVIDED_IN_SOURCE without inventing one.',
    facility: 'St. Jude Endocrine & Nephrology Specialty Core',
    reportDate: '2026-03-02',
    rawText: `================================================================================
ST. JUDE SPECIALTY PATHOLOGY CORE
Patient: Elena Rostova (DEMO-PT-001) | Collection: 2026-03-02 08:00 AM
Test Battery: Renal & Metabolic Biomarkers | Order #: SJC-44109
================================================================================
TEST NAME                     RESULT   UNITS      REFERENCE RANGE
--------------------------------------------------------------------------------
Hemoglobin A1c                8.1      %          < 5.7
Cystatin C                    1.28     mg/L       0.53 - 0.95
eGFR (Estimated GFR)          54       mL/min     [None provided by ordering lab]
Uric Acid                     6.8      mg/dL      2.7 - 7.3
Fasting Insulin               14.5     uIU/mL
Serum Magnesium               2.1      mg/dL      1.7 - 2.4
Urine Albumin/Creatinine      45       mg/g       < 30
================================================================================
CLINICAL NOTES:
- Estimated GFR calculated using 2021 CKD-EPI equation; laboratory protocol omits static reference interval due to age-dependent staging.
- Fasting insulin reported as quantitative absolute value; fasting duration unconfirmed by phlebotomy slip.
- Reference ranges above represent vendor specifications where listed.
================================================================================`
  },
  {
    id: 'demo-rep-003',
    name: 'Multi-Category Diagnostic Panel (Hematology CBC, Lipid Panel & Thyroid)',
    categoryTag: 'Multi-Category Comprehensive',
    description: 'Demonstrates multi-category clinical extractions spanning Hematology (CBC), Lipid Profiling, and Endocrine/Thyroid markers.',
    facility: 'Apex Diagnostic Health Network - Central Reference Lab',
    reportDate: '2026-03-03',
    rawText: `================================================================================
APEX DIAGNOSTIC HEALTH NETWORK - CENTRAL LAB
Patient: David Chen (DEMO-PT-002) | Specimen: Whole Blood / Serum
Report Date: 2026-03-03 | Requisition: ADH-77032-PANEL
================================================================================
PANEL: COMPLETE BLOOD COUNT (CBC) WITH DIFFERENTIAL
WBC (White Blood Cells)       11.8     x10^3/uL   4.5 - 11.0
RBC (Red Blood Cells)         4.45     x10^6/uL   4.20 - 5.80
Hemoglobin                    11.5     g/dL       12.0 - 16.0
Hematocrit                    35.2     %          37.0 - 48.0
Platelet Count                245      x10^3/uL   150 - 450
MCV                           79.1     fL         80.0 - 100.0

PANEL: LIPID PROFILE (FASTING)
Total Cholesterol             238      mg/dL      < 200
Triglycerides                 185      mg/dL      < 150
HDL Cholesterol               42       mg/dL      > 40
LDL Cholesterol (Calc)        159      mg/dL      < 100

PANEL: THYROID FUNCTION
TSH (Thyrotropin)             6.45     mIU/L      0.45 - 4.50
Free T4                       1.12     ng/dL      0.82 - 1.77
================================================================================
PATHOLOGIST REVIEW:
- Mild microcytic anemia picture (Low Hemoglobin, Low Hematocrit, borderline low MCV).
- Mixed dyslipidemia profile with elevated atherogenic lipoproteins.
- Subclinical hypothyroidism pattern suggested by isolated mild TSH elevation with normal FT4.
================================================================================`
  }
];
