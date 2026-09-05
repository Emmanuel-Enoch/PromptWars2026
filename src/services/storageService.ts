// MedLens LocalStorage Persistence Service
// Ensures data survives browser refreshes while providing clean reset controls.

import type { PatientProfile, MedicalReport } from '../types';

const STORAGE_KEYS = {
  PATIENT: 'medlens_v1_patient',
  REPORT: 'medlens_v1_report'
};

export interface PersistedState {
  patient: PatientProfile | null;
  report: MedicalReport | null;
}

export function savePersistedState(patient: PatientProfile | null, report: MedicalReport | null): void {
  try {
    if (patient) {
      localStorage.setItem(STORAGE_KEYS.PATIENT, JSON.stringify(patient));
    } else {
      localStorage.removeItem(STORAGE_KEYS.PATIENT);
    }

    if (report) {
      localStorage.setItem(STORAGE_KEYS.REPORT, JSON.stringify(report));
    } else {
      localStorage.removeItem(STORAGE_KEYS.REPORT);
    }
  } catch (err) {
    console.error('Failed to save MedLens state to localStorage:', err);
  }
}

export function loadPersistedState(): PersistedState {
  let patient: PatientProfile | null = null;
  let report: MedicalReport | null = null;

  try {
    const rawPatient = localStorage.getItem(STORAGE_KEYS.PATIENT);
    if (rawPatient) {
      patient = JSON.parse(rawPatient);
    }

    const rawReport = localStorage.getItem(STORAGE_KEYS.REPORT);
    if (rawReport) {
      report = JSON.parse(rawReport);
    }
  } catch (err) {
    console.error('Failed to load MedLens state from localStorage:', err);
  }

  return { patient, report };
}

export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PATIENT);
    localStorage.removeItem(STORAGE_KEYS.REPORT);
  } catch (err) {
    console.error('Failed to clear MedLens state:', err);
  }
}
