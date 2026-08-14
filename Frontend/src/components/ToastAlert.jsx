import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ToastAlert({ errorMessage, successMessage }) {
  return (
    <>
      {errorMessage && (
        <div className="glass-panel fixed top-6 right-6 z-[1000] p-4 px-5 flex items-center gap-3 border-l-4 border-l-red-500 bg-slate-950/95 animate-[fadeIn_0.3s_ease]">
          <AlertCircle size={20} className="text-red-500" />
          <span className="text-xs font-semibold text-slate-100">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="glass-panel fixed top-6 right-6 z-[1000] p-4 px-5 flex items-center gap-3 border-l-4 border-l-emerald-500 bg-slate-950/95 animate-[fadeIn_0.3s_ease]">
          <CheckCircle2 size={20} className="text-emerald-500" />
          <span className="text-xs font-semibold text-slate-100">{successMessage}</span>
        </div>
      )}
    </>
  );
}
