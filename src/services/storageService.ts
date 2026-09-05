// MedLens LocalStorage Persistence Service
// Ensures data survives browser refreshes while providing clean reset controls.

import type { PatientProfile, MedicalReport } from '../types';

const STORAGE_KEYS = {
  PATIENT: 'medlens_v1_patient',
  REPORT: 'medlens_v1_report',
  REPORTS: 'medlens_v1_reports'
};

export interface PersistedState {
  patient: PatientProfile | null;
  report: MedicalReport | null;
  reports: MedicalReport[];
}

export function savePersistedState(
  patient: PatientProfile | null,
  report: MedicalReport | null,
  reports?: MedicalReport[]
): void {
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

    if (reports && reports.length > 0) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    } else {
      localStorage.removeItem(STORAGE_KEYS.REPORTS);
    }
  } catch (err) {
    // Handle specific localStorage errors
    if (err instanceof Error) {
      if (err.name === 'QuotaExceededError' || err.message.includes('quota')) {
        console.warn('LocalStorage quota exceeded - data was not persisted but application state is preserved');
        // Don't crash the app, just warn
        return;
      }
      if (err.message.includes('security') || err.message.includes('access')) {
        console.warn('LocalStorage access denied - data was not persisted but application state is preserved');
        return;
      }
    }
    console.error('Failed to save MedLens state to localStorage:', err);
  }
}

export function loadPersistedState(): PersistedState {
  let patient: PatientProfile | null = null;
  let report: MedicalReport | null = null;
  let reports: MedicalReport[] = [];

  try {
    const rawPatient = localStorage.getItem(STORAGE_KEYS.PATIENT);
    if (rawPatient) {
      patient = JSON.parse(rawPatient);
    }

    const rawReport = localStorage.getItem(STORAGE_KEYS.REPORT);
    if (rawReport) {
      report = JSON.parse(rawReport);
    }

    const rawReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (rawReports) {
      reports = JSON.parse(rawReports);
    } else if (report) {
      reports = [report];
    }
  } catch (err) {
    console.error('Failed to load MedLens state from localStorage:', err);
  }

  return { patient, report, reports };
}

export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PATIENT);
    localStorage.removeItem(STORAGE_KEYS.REPORT);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
  } catch (err) {
    console.error('Failed to clear MedLens state:', err);
  }
}
