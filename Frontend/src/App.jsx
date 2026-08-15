import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import CitationsPanel from './components/CitationsPanel';
import ToastAlert from './components/ToastAlert';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function App() {
  const [backendOnline, setBackendOnline] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [citationsPanelOpen, setCitationsPanelOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Periodically check backend status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/`);
        if (res.ok) {
          setBackendOnline(true);
          fetchDocs();
        } else {
          setBackendOnline(false);
        }
      } catch (err) {
        setBackendOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch documents from backend
  const fetchDocs = async () => {
    try {
      const res = await fetch(`${API_URL}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSearching]);

  // Toast notification handlers
  const triggerToast = (type, message) => {
    if (type === 'success') {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  // Handle PDF upload using XMLHttpRequest for progress
  const handleUpload = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      triggerToast('error', 'Only PDF files are allowed.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/upload-pdf`, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(Math.min(percent, 90));
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      setUploadProgress(0);
      if (xhr.status >= 200 && xhr.status < 300) {
        triggerToast('success', `${file.name} uploaded & embedded successfully!`);
        fetchDocs();
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          triggerToast('error', errData.detail || 'Failed to process PDF.');
        } catch (e) {
          triggerToast('error', 'Upload failed. Check server status.');
        }
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setUploadProgress(0);
      triggerToast('error', 'Network error occurred during upload.');
    };

    xhr.send(formData);
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  // Delete document
  const handleDelete = async (id, filename) => {
    try {
      const res = await fetch(`${API_URL}/documents/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        triggerToast('success', `Deleted: ${filename}`);
        fetchDocs();
        if (selectedMessage && selectedMessage.sources) {
          setSelectedMessage(null);
          setCitationsPanelOpen(false);
        }
      } else {
        triggerToast('error', 'Failed to delete document.');
      }
    } catch (err) {
      triggerToast('error', 'Server error while deleting document.');
    }
  };

  // Send query
  // Send query
  const handleSendMessage = async (e) => {
    e?.preventDefault();

    if (!inputMessage.trim() || isSearching) return;

    const userQuery = inputMessage.trim();
    setInputMessage('');

    const userMsg = {
      role: 'user',
      text: userQuery,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsSearching(true);

    try {
      const res = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userQuery
        }),
      });

      const data = await res.json();

      if (res.ok) {

        // Make sure ReactMarkdown ALWAYS receives a string
        let answerText = '';

        if (typeof data.answer === 'string') {
          // Normal successful response
          answerText = data.answer;

        } else if (data.answer && typeof data.answer === 'object') {
          // Backend returned an error object
          if (data.answer.success === false) {
            answerText =
              `⚠️ ${data.answer.error || 'AI answer generation is currently unavailable.'}`;
          } else if (typeof data.answer.answer === 'string') {
            answerText = data.answer.answer;
          } else {
            answerText = '⚠️ Unable to generate an answer.';
          }

        } else {
          answerText = '⚠️ Unable to generate an answer.';
        }

        const assistantMsg = {
          role: 'assistant',
          text: answerText,
          sources: Array.isArray(data.sources)
            ? data.sources
            : [],
          geminiStatus: data.gemini_status || 'unknown',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        };

        setMessages(prev => [...prev, assistantMsg]);

      } else {

        triggerToast(
          'error',
          data.detail || 'Failed to retrieve answers.'
        );

        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: '⚠️ I encountered an error while searching the knowledge base.',
            sources: [],
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          }
        ]);
      }

    } catch (err) {

      console.error('RAG search error:', err);

      triggerToast(
        'error',
        'Could not communicate with RAG backend.'
      );

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Unable to connect to the RAG backend server. Please verify it is running at ${API_URL}.`,
          sources: [],
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      ]);

    } finally {
      setIsSearching(false);
    }
  };

  // Open citations side-panel
  const openCitations = (msg) => {
    setSelectedMessage(msg);
    setCitationsPanelOpen(true);
  };

  return (
    <div className="flex h-screen w-screen relative z-10 overflow-hidden bg-bg-app text-text-primary">
      <div className="app-bg-glow" />

      <ToastAlert
        errorMessage={errorMessage}
        successMessage={successMessage}
      />

      <Sidebar
        backendOnline={backendOnline}
        dragActive={dragActive}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        documents={documents}
        fileInputRef={fileInputRef}
        handleDrag={handleDrag}
        handleDrop={handleDrop}
        handleUpload={handleUpload}
        handleDelete={handleDelete}
      />

      <main className="flex-1 h-full flex z-5 bg-black/10">
        <ChatContainer
          documents={documents}
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          isSearching={isSearching}
          selectedMessage={selectedMessage}
          handleSendMessage={handleSendMessage}
          openCitations={openCitations}
          chatEndRef={chatEndRef}
        />

        <CitationsPanel
          citationsPanelOpen={citationsPanelOpen}
          selectedMessage={selectedMessage}
          setCitationsPanelOpen={setCitationsPanelOpen}
        />
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
