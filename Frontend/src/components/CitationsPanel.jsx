import React from 'react';
import { Layers, X } from 'lucide-react';

export default function CitationsPanel({
  citationsPanelOpen,
  selectedMessage,
  setCitationsPanelOpen
}) {
  if (!citationsPanelOpen || !selectedMessage) return null;

  return (
    <aside className="w-90 min-w-[22.5rem] h-full bg-slate-950/95 backdrop-blur-md border-l border-white/5 flex flex-col z-10 animate-[slideIn_0.3s_cubic-bezier(0.4,0,0.2,1)]">
      <div className="h-18 p-6 flex items-center justify-between border-b border-white/5">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-text-primary">
          <Layers size={16} className="text-accent-secondary" />
          <span>Reference Inspector</span>
        </h3>
        <button 
          className="bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded-lg hover:bg-white/5 hover:text-text-primary transition-all" 
          onClick={() => setCitationsPanelOpen(false)}
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        <div className="text-xs text-text-muted mb-2">
          Below are the top relevant vector matches fetched from the PostgreSQL `pgvector` store used to formulate the response.
        </div>
        {selectedMessage.sources.map((source, index) => (
          <div key={index} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs leading-relaxed text-text-secondary">
            <div className="flex justify-between text-[10px] font-bold text-accent-secondary mb-2.5 pb-2 border-b border-dashed border-white/5">
              <span>MATCH BLOCK #{index + 1}</span>
              <span>COSINE SIMILARITY</span>
            </div>
            <div className="whitespace-pre-wrap">
              {source}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
