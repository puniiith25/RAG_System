import React from 'react';
import { Cpu, UploadCloud, FileText, Trash2, MessageSquare, Plus } from 'lucide-react';

const groupSessionsByDate = (sessions) => {
  const groups = {};
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  sessions.forEach(sess => {
    if (!sess.created_at) return;
    const sessDate = new Date(sess.created_at);
    let groupKey = "";

    if (sessDate.toDateString() === today.toDateString()) {
      groupKey = "Today";
    } else if (sessDate.toDateString() === yesterday.toDateString()) {
      groupKey = "Yesterday";
    } else {
      groupKey = sessDate.toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(sess);
  });

  return groups;
};

export default function Sidebar({
  backendOnline,
  dragActive,
  isUploading,
  uploadProgress,
  documents,
  fileInputRef,
  handleDrag,
  handleDrop,
  handleUpload,
  handleDelete,
  sessions = [],
  currentSessionId,
  handleSelectSession,
  handleDeleteSession,
  handleNewChat
}) {
  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <aside className="w-80 min-w-[20rem] h-full bg-bg-sidebar backdrop-blur-md border-r border-white/5 flex flex-col z-10">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
            <Cpu size={18} color="#fff" />
          </div>
          <div className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent">
            RAG SYSTEM
          </div>
          <span className="text-[9px] bg-white/5 text-accent-secondary px-1.5 py-0.5 rounded-full border border-accent-secondary/20 font-semibold">
            v1.0
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3.5 px-4 rounded-lg bg-white/[0.02] border border-white/5 text-xs">
          <span className="text-text-secondary">System Status</span>
          <div className="flex items-center gap-2 font-medium">
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse-glow' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
            <span className={backendOnline ? 'text-text-primary' : 'text-text-muted'}>
              {backendOnline ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>

        {/* File Upload Zone */}
        <div className="flex flex-col gap-2">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
            Document Manager
          </div>
          <div
            className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer bg-white/[0.01] transition-all duration-300 flex flex-col items-center gap-3 ${dragActive
                ? 'border-accent-primary bg-accent-primary/5'
                : 'border-white/10 hover:border-accent-primary hover:bg-accent-primary/5'
              }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files[0])}
            />
            <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center text-text-secondary transition-all">
              <UploadCloud size={20} />
            </div>
            <div className="text-xs text-text-secondary leading-normal">
              {isUploading ? 'Processing document...' : 'Upload PDF Document'}
              <p className="text-[10px] text-text-muted mt-1">Drag & drop or click to browse</p>
            </div>

            {isUploading && (
              <div className="w-full mt-2">
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300 shadow-[0_0_6px_#7c3aed]"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-text-muted mt-1">
                  <span>Embedding chunks...</span>
                  <span>{uploadProgress}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Documents List */}
        <div className="flex flex-col gap-3">
          <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
            Knowledge Library ({documents.length})
          </div>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[10rem] pr-0.5">
            {documents.length === 0 ? (
              <div className="text-xs text-text-muted text-center p-4 border border-dashed border-white/5 rounded-lg">
                No documents uploaded. Add a PDF to query the database.
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2.5 px-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText size={16} className="text-accent-secondary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate text-text-primary w-40" title={doc.filename}>
                        {doc.filename}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Local'}
                      </div>
                    </div>
                  </div>
                  <button
                    className="bg-transparent border-none text-text-muted cursor-pointer p-1 rounded hover:bg-red-500/10 hover:text-red-500 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id, doc.filename);
                    }}
                    title="Remove from knowledge base"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
              Chat History
            </div>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1 text-[10px] bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary font-semibold px-2 py-1 rounded border border-accent-primary/20 cursor-pointer transition-all"
              title="Start a new conversation"
            >
              <Plus size={11} />
              <span>New Chat</span>
            </button>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[16rem] pr-0.5">
            {sessions.length === 0 ? (
              <div className="text-xs text-text-muted text-center p-4 border border-dashed border-white/5 rounded-lg">
                No past conversations.
              </div>
            ) : (
              Object.keys(groupedSessions).map(groupName => (
                <div key={groupName} className="flex flex-col gap-1.5">
                  <div className="text-[9px] font-bold text-text-muted tracking-wider uppercase pl-1">
                    {groupName}
                  </div>
                  {groupedSessions[groupName].map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess.id)}
                      className={`flex items-center justify-between p-2.5 px-3 rounded-lg border cursor-pointer transition-all duration-300 ${
                        currentSessionId === sess.id
                          ? 'bg-accent-primary/10 border-accent-primary/30 text-text-primary'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10 text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MessageSquare size={14} className={currentSessionId === sess.id ? "text-accent-primary shrink-0" : "text-text-muted shrink-0"} />
                        <div className="text-xs font-medium truncate w-40" title={sess.title}>
                          {sess.title}
                        </div>
                      </div>
                      <button
                        className="bg-transparent border-none text-text-muted cursor-pointer p-1 rounded hover:bg-red-500/10 hover:text-red-500 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(sess.id);
                        }}
                        title="Delete conversation"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-4 px-6 border-t border-white/5 text-[10px] text-text-muted text-center">
        DeepMind Pair Programming
      </div>
    </aside>
  );
}
