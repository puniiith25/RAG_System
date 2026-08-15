import React from 'react';
import { Send, MessageSquare, Layers, Search, Database, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatContainer({
  documents,
  messages,
  inputMessage,
  setInputMessage,
  isSearching,
  selectedMessage,
  handleSendMessage,
  openCitations,
  chatEndRef,
  handleClearChat
}) {
  return (
    <div className="flex-1 h-full flex flex-col relative">
      {/* Chat Header */}
      <header className="h-18 border-b border-white/5 px-8 flex items-center justify-between bg-bg-sidebar/45 backdrop-blur-md">
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-text-primary">RAG Assistant Chat</h2>
          <span className="text-[10px] text-text-muted">
            {documents.length > 0
              ? `Knowledge synced with ${documents.length} document(s)`
              : 'Awaiting knowledge base setup'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-red-400 bg-white/[0.02] hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 p-1.5 px-3 rounded-md cursor-pointer transition-all duration-300"
              title="Clear entire chat history"
            >
              <Trash2 size={13} />
              <span>Clear Chat</span>
            </button>
          )}
          {documents.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-text-secondary bg-white/[0.03] p-1.5 px-3 rounded-md border border-white/5">
              <Database size={13} className="text-accent-secondary" />
              <span>Vector Store Initialized</span>
            </div>
          )}
        </div>
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
        {messages.length === 0 ? (
          <div className="max-w-xl m-auto text-center flex flex-col items-center gap-4 animate-[fadeIn_0.6s_ease]">
            <div className="w-16 h-16 rounded-2xl bg-accent-primary-glow/20 text-accent-primary flex items-center justify-center mb-2">
              <MessageSquare size={28} />
            </div>
            <h3 className="text-xl font-bold tracking-tight">AI RAG Chat Assistant</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              Welcome! This application uses a Retrieval-Augmented Generation workflow to answer user questions using only content from uploaded documents.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full mt-4">
              <button
                className="p-3.5 text-left bg-bg-card border border-white/5 rounded-lg text-text-secondary text-xs cursor-pointer hover:bg-bg-card-hover hover:border-accent-primary hover:text-text-primary hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                onClick={() => setInputMessage("Summarize the main points of the uploaded document.")}
              >
                Summarize the uploaded PDF document
              </button>
              <button
                className="p-3.5 text-left bg-bg-card border border-white/5 rounded-lg text-text-secondary text-xs cursor-pointer hover:bg-bg-card-hover hover:border-accent-primary hover:text-text-primary hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                onClick={() => setInputMessage("What are the key terms or definitions found in this text?")}
              >
                Find key terms and definitions
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex w-full animate-message-slide ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-4 px-5 rounded-2xl text-sm leading-relaxed relative transition-all duration-300 ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-accent-primary to-violet-800 text-white rounded-br-sm shadow-[0_4px_12px_rgba(124,58,237,0.15)]' 
                  : `bg-bg-card border border-white/5 text-slate-100 rounded-bl-sm ${selectedMessage === msg ? 'border-accent-secondary/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]' : ''}`
              }`}>
                <div className="markdown-body">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-muted mt-2">
                  <span>{msg.timestamp}</span>
                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <button
                      className="flex items-center gap-1 text-accent-secondary font-semibold cursor-pointer p-0.5 px-1.5 rounded bg-accent-secondary-glow/10 border border-accent-secondary-glow/20 hover:bg-accent-secondary-glow/20 transition-all duration-300"
                      onClick={() => openCitations(msg)}
                    >
                      <Layers size={11} />
                      <span>{msg.sources.length} sources</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {isSearching && (
          <div className="flex w-full animate-message-slide justify-start">
            <div className="max-w-[75%] p-4 px-5 rounded-2xl text-sm leading-relaxed relative bg-white/[0.01] border border-dashed border-white/10 rounded-bl-sm">
              <div className="flex items-center gap-2.5 text-text-secondary">
                <Search size={16} className="animate-spin text-accent-secondary" />
                <div className="flex items-center gap-1 p-1">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 px-8 bg-gradient-to-t from-bg-app via-bg-app/90 to-transparent">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            className="w-full h-14 p-4 pr-16 pl-5 text-sm rounded-xl bg-slate-950/50 border border-white/5 text-text-primary outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.3)] transition-all duration-300"
            placeholder={
              documents.length === 0
                ? "Upload a PDF in the sidebar to begin querying..."
                : "Ask a question about your uploaded documents..."
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={documents.length === 0}
          />
          <button
            type="submit"
            className="absolute right-3 w-9 h-9 rounded-lg bg-accent-primary text-white border-none cursor-pointer flex items-center justify-center hover:bg-violet-700 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-300"
            disabled={!inputMessage.trim() || isSearching || documents.length === 0}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
