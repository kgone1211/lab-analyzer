'use client';

import { useState } from 'react';

interface JsonDropzoneProps {
  onAnalyze: (data: unknown) => void;
  isAnalyzing: boolean;
}

export default function JsonDropzone({ onAnalyze, isAnalyzing }: JsonDropzoneProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const json = JSON.parse(text);
          setJsonInput(JSON.stringify(json, null, 2));
        } catch {
          setError('Invalid JSON file');
        }
      };
      
      reader.readAsText(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type;
      
      // Check if it's a PDF or Word document
      if (fileType === 'application/pdf' || 
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          fileType === 'application/msword') {
        
        setIsParsing(true);
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('/api/parse-document-v2', {
            method: 'POST',
            body: formData,
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            // Show a more helpful error message for PDF parsing issues
            const errorMsg = result.error || 'Failed to parse document';
            setError(errorMsg);
            setIsParsing(false);
            return;
          }
          
          setJsonInput(JSON.stringify(result.data, null, 2));
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to parse document';
          setError(errorMessage);
        } finally {
          setIsParsing(false);
        }
      } else if (fileType === 'application/json') {
        // Handle JSON files as before
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            const text = event.target?.result as string;
          const json = JSON.parse(text);
          setJsonInput(JSON.stringify(json, null, 2));
        } catch {
          setError('Invalid JSON file');
          }
        };
        
        reader.readAsText(file);
      } else {
        setError('Unsupported file type. Please upload JSON, PDF, or Word document.');
      }
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const data = JSON.parse(jsonInput);
      onAnalyze(data);
    } catch {
      setError('Invalid JSON format. Please check your input.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="border-2 border-dashed rounded-lg p-8 text-center transition-all"
        style={{
          borderColor: dragActive ? 'var(--acc)' : '#2a2f3a',
          background: dragActive ? 'rgba(143, 214, 255, 0.1)' : '#1f2633',
          boxShadow: dragActive ? '0 4px 12px rgba(143, 214, 255, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.2)'
        }}
      >
        <svg
          style={{width: '32px', height: '32px', margin: '0 auto', color: 'var(--muted)'}}
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="mt-3">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="font-semibold" style={{color: 'var(--acc)', fontSize: '15px'}}>
              {isParsing ? 'Parsing document with AI...' : 'Upload lab results'}
            </span>
            <input
              id="file-upload"
              type="file"
              className="sr-only"
              accept=".json,.pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              onChange={handleFileInput}
              disabled={isParsing}
            />
          </label>
          <p className="mt-1" style={{color: 'var(--muted)', fontSize: '13px'}}>or drag and drop</p>
        </div>
        <p className="mt-2" style={{color: 'var(--muted)', fontSize: '12px'}}>
          {isParsing ? 'AI is extracting lab data...' : 'PDF, Word, or JSON files'}
        </p>
        <div className="mt-3 p-3 rounded-lg border" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)'}}>
          <p className="text-sm" style={{color: '#22c55e'}}>
            <strong>✓ AI-Powered:</strong> PDF and Word documents are parsed using advanced AI to extract lab results automatically.
          </p>
        </div>
      </div>

      {/* Manual JSON Input */}
      <div>
        <div className="mb-3">
          <label className="form-label" style={{fontSize: '14px', fontWeight: 600}}>
            Or paste JSON directly
          </label>
        </div>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          rows={15}
          className="form-textarea font-mono text-sm"
          placeholder='{\n  "panels": [\n    {\n      "panelName": "A1C",\n      "markers": [...]\n    }\n  ]\n}'
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="error">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isAnalyzing || isParsing || !jsonInput.trim()}
          className="btn-primary px-6 py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isParsing ? 'Parsing Document...' : isAnalyzing ? 'Analyzing...' : 'Analyze Results'}
        </button>
      </div>
    </form>
  );
}

