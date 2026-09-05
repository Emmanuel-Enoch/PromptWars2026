// MedLens Core Type Definitions — Phase 1 + Phase 2

export type Sex = 'Male' | 'Female' | 'Other' | 'Undisclosed';

export interface Allergy {
  allergen: string;
  reaction?: string;
}

export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number | '';
  sex: Sex;
  symptoms: string[];
  existingConditions: string[];
  allergies: Allergy[];
  medications: Medication[];
  otherNotes: string;
  isDemoData: boolean;
  createdAt: string;
}

export type ReferenceRangeStatus =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'NOT_PROVIDED_IN_SOURCE';

/**
 * Provenance origin of a structured result:
 *   USER_PROVIDED    — information directly entered by the user
 *   LOCAL_EXTRACTED  — extracted by the deterministic local parser (NOT an AI model)
 *   AI_GENERATED     — only used when an actual AI/LLM model generated the information
 */
export type ProvenanceOrigin =
  | 'USER_PROVIDED'
  | 'LOCAL_EXTRACTED'
  | 'AI_GENERATED';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type VerificationStatus = 'UNREVIEWED' | 'VERIFIED' | 'EDITED' | 'REJECTED';

// ─── Phase 2: Audit & Verification ────────────────────────────────────────────

export type AuditAction = 'EXTRACTED' | 'VERIFIED' | 'EDITED' | 'REJECTED' | 'REJECTION_LIFTED';

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;          // e.g. "Clinical Reviewer"
  action: AuditAction;
  resultId: string;
  testName: string;
  previousValue?: string; // "value unit" before the edit, or status before change
  newValue?: string;
  reason?: string;        // required for EDITED and REJECTED
}

/**
 * Immutable snapshot of what the extraction engine originally produced.
 * Human edits update the parent LabTestResult fields but never this record.
 */
export interface OriginalExtracted {
  testName: string;
  value: string;
  unit: string;
  sourceReferenceRange: string | null;
  sourceSnippet: string;
}

export interface LabTestResult {
  id: string;
  testName: string;
  value: string;
  numericValue: number | null;
  unit: string;
  sourceReferenceRange: string | null;
  rangeProvided: boolean;
  status: ReferenceRangeStatus;
  testDate?: string;
  sourceSnippet: string;
  provenance: ProvenanceOrigin;
  extractionEngine: string;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  verificationStatus: VerificationStatus;
  // Phase 2 additions (optional so existing persisted Phase 1 data loads fine)
  originalExtracted?: OriginalExtracted;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  editReason?: string;
}

export interface MedicalReport {
  id: string;
  patientId: string;
  title: string;
  facility: string;
  reportDate: string;
  rawText: string;
  results: LabTestResult[];
  unparsedLines: string[];
  extractionEngine: string;
  processedAt: string;
  isDemoData: boolean;
  auditLog?: AuditEntry[];  // Phase 2: per-report audit trail
}
