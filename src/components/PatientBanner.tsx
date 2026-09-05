import React from 'react';
import { User, AlertCircle, Pill, HeartPulse, Edit3 } from 'lucide-react';
import type { PatientProfile } from '../types';

interface PatientBannerProps {
  patient: PatientProfile;
  onEditIntake: () => void;
}

export const PatientBanner: React.FC<PatientBannerProps> = ({ patient, onEditIntake }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        {/* Patient Identity */}
        <div className="flex items-center space-x-3">
          <div className="h-11 w-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold">
            <User className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">{patient.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-sm bg-slate-100 font-medium text-slate-600">
                {patient.age} yrs • {patient.sex}
              </span>
              <span className="text-xs text-slate-400">ID: {patient.id}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Record Intake: {new Date(patient.createdAt).toLocaleDateString()}
              {patient.isDemoData && (
                <span className="ml-2 font-medium text-amber-700">(Synthetic Clinical Scenario)</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={onEditIntake}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-teal-700 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Patient Intake</span>
          </button>
        </div>
      </div>

      {/* Clinical Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 pt-1 text-xs">
        {/* Allergies */}
        <div className="flex items-start gap-2 bg-rose-50/60 p-2.5 rounded-md border border-rose-100">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-rose-900 block">Allergies:</span>
            {patient.allergies.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {patient.allergies.map((a, i) => (
                  <span key={i} className="inline-block px-1.5 py-0.5 bg-rose-100/80 text-rose-800 rounded text-[11px] font-medium">
                    {a.allergen} {a.reaction ? `(${a.reaction})` : ''}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-slate-500 italic">No known allergies (NKDA)</span>
            )}
          </div>
        </div>

        {/* Existing Conditions */}
        <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-md border border-slate-200">
          <HeartPulse className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800 block">Known Conditions:</span>
            {patient.existingConditions.length > 0 ? (
              <p className="text-slate-700 mt-0.5 font-medium leading-tight">
                {patient.existingConditions.join(', ')}
              </p>
            ) : (
              <span className="text-slate-500 italic">None reported</span>
            )}
          </div>
        </div>

        {/* Current Medications */}
        <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-md border border-slate-200">
          <Pill className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800 block">Active Medications:</span>
            {patient.medications.length > 0 ? (
              <div className="mt-0.5 text-slate-700 font-medium">
                {patient.medications.map((m, idx) => (
                  <span key={idx} className="block text-[11px] leading-snug">
                    • {m.name} {m.dosage ? `(${m.dosage})` : ''}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-slate-500 italic">None reported</span>
            )}
          </div>
        </div>

        {/* Reported Symptoms */}
        <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-md border border-slate-200">
          <div className="h-4 w-4 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
            S
          </div>
          <div>
            <span className="font-semibold text-slate-800 block">Reported Symptoms:</span>
            {patient.symptoms.length > 0 ? (
              <p className="text-slate-700 mt-0.5 font-medium leading-tight">
                {patient.symptoms.join(', ')}
              </p>
            ) : (
              <span className="text-slate-500 italic">None reported</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
