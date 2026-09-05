// MedLens Core Type Definitions for Phase 1

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

export type ProvenanceOrigin = 
  | 'USER_PROVIDED' 
  | 'AI_EXTRACTED';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type VerificationStatus = 'UNREVIEWED' | 'VERIFIED' | 'EDITED' | 'REJECTED';

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
}
