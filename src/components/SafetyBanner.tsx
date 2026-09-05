import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const SafetyBanner: React.FC = () => {
  return (
    <div className="bg-amber-50/70 border-y border-amber-200/80 px-4 py-2.5 text-xs text-amber-900">
      <div className="max-w-7xl mx-auto flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-amber-950">CLINICAL SAFETY NOTICE: </strong>
          MedLens is a structured clinical information intelligence aid. It does <strong>NOT</strong> diagnose medical conditions, prescribe treatments, or recommend dosage adjustments.
          Reference ranges and test statuses are evaluated <strong>strictly from source report documentation</strong>. If a reference range is absent from the source, no reference range is presumed or invented.
        </div>
      </div>
    </div>
  );
};
