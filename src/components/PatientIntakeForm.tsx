import React, { useState } from 'react';
import { UserPlus, Sparkles, Check, Trash2, ShieldAlert } from 'lucide-react';
import type { PatientProfile, Sex } from '../types';
import { DEMO_PATIENTS } from '../data/demoData';

interface PatientIntakeFormProps {
  initialData: PatientProfile | null;
  onSave: (patient: PatientProfile) => void;
  onCancel?: () => void;
}

export const PatientIntakeForm: React.FC<PatientIntakeFormProps> = ({
  initialData,
  onSave,
  onCancel
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [age, setAge] = useState<number | ''>(initialData?.age ?? '');
  const [sex, setSex] = useState<Sex>(initialData?.sex || 'Female');
  const [symptoms, setSymptoms] = useState(initialData?.symptoms.join(', ') || '');
  const [conditions, setConditions] = useState(initialData?.existingConditions.join(', ') || '');
  const [allergies, setAllergies] = useState(
    initialData?.allergies.map(a => `${a.allergen}${a.reaction ? ` (${a.reaction})` : ''}`).join(', ') || ''
  );
  const [medications, setMedications] = useState(
    initialData?.medications.map(m => `${m.name}${m.dosage ? ` ${m.dosage}` : ''}${m.frequency ? ` ${m.frequency}` : ''}`).join('\n') || ''
  );
  const [notes, setNotes] = useState(initialData?.otherNotes || '');
  const [isDemo, setIsDemo] = useState(initialData?.isDemoData ?? false);

  const handleLoadDemo = (index: number = 0) => {
    const demo = DEMO_PATIENTS[index];
    if (!demo) return;
    setName(demo.name);
    setAge(demo.age);
    setSex(demo.sex);
    setSymptoms(demo.symptoms.join(', '));
    setConditions(demo.existingConditions.join(', '));
    setAllergies(demo.allergies.map(a => `${a.allergen}${a.reaction ? ` (${a.reaction})` : ''}`).join(', '));
    setMedications(demo.medications.map(m => `${m.name}${m.dosage ? ` ${m.dosage}` : ''}${m.frequency ? ` ${m.frequency}` : ''}`).join('\n'));
    setNotes(demo.otherNotes);
    setIsDemo(true);
  };

  const handleClear = () => {
    setName('');
    setAge('');
    setSex('Female');
    setSymptoms('');
    setConditions('');
    setAllergies('');
    setMedications('');
    setNotes('');
    setIsDemo(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Validate age
    const ageNum = age === '' ? 45 : Number(age);
    if (ageNum < 0 || ageNum > 130) {
      alert('Please enter a valid age between 0 and 130');
      return;
    }

    // Parse symptoms
    const parsedSymptoms = symptoms
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Parse conditions
    const parsedConditions = conditions
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    // Parse allergies
    const parsedAllergies = allergies
      .split(',')
      .map(a => a.trim())
      .filter(Boolean)
      .map(str => {
        const match = str.match(/^([^(]+)(?:\(([^)]+)\))?$/);
        return {
          allergen: match ? match[1].trim() : str,
          reaction: match && match[2] ? match[2].trim() : undefined
        };
      });

    // Parse medications (line by line or comma)
    const parsedMedications = medications
      .split(/\r?\n|,/)
      .map(m => m.trim())
      .filter(Boolean)
      .map(str => ({
        name: str
      }));

    const patientProfile: PatientProfile = {
      id: initialData?.id || `pt-${Date.now().toString(36)}`,
      name: name.trim(),
      age: ageNum,
      sex,
      symptoms: parsedSymptoms,
      existingConditions: parsedConditions,
      allergies: parsedAllergies,
      medications: parsedMedications,
      otherNotes: notes.trim(),
      isDemoData: isDemo,
      createdAt: initialData?.createdAt || new Date().toISOString()
    };

    onSave(patientProfile);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Form Header */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5 text-teal-700" />
          <h2 className="text-base font-bold text-slate-900">Patient Information Intake</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
            Clinical Demographic & Medical History
          </span>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleLoadDemo(0)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors"
            aria-label="Load demo patient Elena Rostova"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
            <span>Load Demo Patient (Elena Rostova, 58F)</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadDemo(1)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors"
            aria-label="Load demo patient David Chen"
          >
            <span>Load Demo (David Chen, 42M)</span>
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Core Demographics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="patient-name" className="block text-xs font-semibold text-slate-800 mb-1">
              Patient Full Name <span className="text-rose-600">*</span>
            </label>
            <input
              id="patient-name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Elena Rostova"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="patient-age" className="block text-xs font-semibold text-slate-800 mb-1">
              Age <span className="text-rose-600">*</span>
            </label>
            <input
              id="patient-age"
              type="number"
              min="0"
              max="130"
              required
              value={age}
              onChange={e => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              placeholder="e.g. 58"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
              aria-describedby="age-help"
            />
            <span id="age-help" className="text-[11px] text-slate-500">Valid range: 0-130 years</span>
          </div>

          <div>
            <label htmlFor="patient-sex" className="block text-xs font-semibold text-slate-800 mb-1">
              Biological Sex <span className="text-rose-600">*</span>
            </label>
            <select
              id="patient-sex"
              value={sex}
              onChange={e => setSex(e.target.value as Sex)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden bg-white"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
              <option value="Undisclosed">Undisclosed</option>
            </select>
          </div>
        </div>

        {/* Symptoms & Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="patient-symptoms" className="block text-xs font-semibold text-slate-800 mb-1">
              Current Symptoms <span className="text-slate-400 font-normal">(comma-separated)</span>
            </label>
            <input
              id="patient-symptoms"
              type="text"
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
              placeholder="e.g. Mild fatigue, excessive thirst, intermittent dizziness"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="patient-conditions" className="block text-xs font-semibold text-slate-800 mb-1">
              Existing Conditions / Diagnoses <span className="text-slate-400 font-normal">(comma-separated)</span>
            </label>
            <input
              id="patient-conditions"
              type="text"
              value={conditions}
              onChange={e => setConditions(e.target.value)}
              placeholder="e.g. Type 2 Diabetes, Essential Hypertension"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
            />
          </div>
        </div>

        {/* Allergies & Medications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="patient-allergies" className="block text-xs font-semibold text-slate-800 mb-1">
              Known Allergies & Reactions <span className="text-slate-400 font-normal">(e.g. Penicillin (Hives), Sulfa)</span>
            </label>
            <input
              id="patient-allergies"
              type="text"
              value={allergies}
              onChange={e => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin (Hives), Sulfa (Rash)"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="patient-medications" className="block text-xs font-semibold text-slate-800 mb-1">
              Current Medications <span className="text-slate-400 font-normal">(one per line or comma-separated)</span>
            </label>
            <textarea
              id="patient-medications"
              rows={2}
              value={medications}
              onChange={e => setMedications(e.target.value)}
              placeholder="e.g. Metformin 1000mg twice daily&#10;Lisinopril 20mg daily&#10;Atorvastatin 40mg nightly"
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden font-mono text-xs"
            />
          </div>
        </div>

        {/* Other Clinical Notes */}
        <div>
          <label htmlFor="patient-notes" className="block text-xs font-semibold text-slate-800 mb-1">
            Other Relevant Clinical Information / Intake Notes
          </label>
          <textarea
            id="patient-notes"
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Patient is presenting for routine semi-annual monitoring. History of compliance with oral medications."
            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
          />
        </div>

        {/* Provenance note */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-md border border-slate-200">
          <ShieldAlert className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            Intake information is tagged with origin: <strong className="text-slate-800 font-semibold">USER_PROVIDED</strong>.
            All clinical data entered here is strictly attributed to the intake respondent.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-md transition-colors"
            aria-label="Clear all form fields"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear Form</span>
          </button>

          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md shadow-xs transition-colors focus:ring-2 focus:ring-teal-500"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>Save Patient Profile</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
