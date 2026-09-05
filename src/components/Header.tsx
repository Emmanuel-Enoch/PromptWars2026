import React from 'react';
import { Activity, RotateCcw, ShieldCheck, Database } from 'lucide-react';
import { LOCAL_ENGINE_NAME } from '../services/deterministicParser';

interface HeaderProps {
  isDemoData: boolean;
  hasActiveRecord: boolean;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDemoData,
  hasActiveRecord,
  onReset
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-sm">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Med<span className="text-teal-700">Lens</span>
                </span>
                <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Clinical Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Structured clinical information intake & report extraction engine
              </p>
            </div>
          </div>

          {/* Engine & Status Badges */}
          <div className="flex items-center space-x-3">
            {/* Active Engine Badge */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
              <span>Engine: <strong className="text-slate-900 font-semibold">{LOCAL_ENGINE_NAME}</strong></span>
            </div>

            {/* Demo vs Live Badge */}
            {hasActiveRecord && (
              <div className="flex items-center">
                {isDemoData ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <Database className="h-3.5 w-3.5 text-amber-600" />
                    SYNTHETIC DEMO DATA
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    USER INTAKE RECORD
                  </span>
                )}
              </div>
            )}

            {/* Reset / Start Over */}
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 border border-slate-200 transition-colors focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              title="Reset current session and clear local storage"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Reset Session</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
