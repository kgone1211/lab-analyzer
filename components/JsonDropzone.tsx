'use client';

import { useState } from 'react';
import sampleData from '@/fixtures/sample.json';

interface JsonDropzoneProps {
  onAnalyze: (data: any) => void;
  isAnalyzing: boolean;
}

export default function JsonDropzone({ onAnalyze, isAnalyzing }: JsonDropzoneProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        } catch (err) {
          setError('Invalid JSON file');
        }
      };
      
      reader.readAsText(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const json = JSON.parse(text);
          setJsonInput(JSON.stringify(json, null, 2));
        } catch (err) {
          setError('Invalid JSON file');
        }
      };
      
      reader.readAsText(file);
    }
  };

  const handleLoadSample = () => {
    setJsonInput(JSON.stringify(sampleData, null, 2));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const data = JSON.parse(jsonInput);
      onAnalyze(data);
    } catch (err) {
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
        className="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
        style={{
          borderColor: dragActive ? 'var(--acc)' : '#2a2f3a',
          background: dragActive ? '#2a3a4a' : '#0b0d11'
        }}
      >
        <svg
          className="mx-auto h-12 w-12"
          style={{color: 'var(--muted)'}}
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
        <div className="mt-4">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="font-medium" style={{color: 'var(--acc)'}}>
              Upload a JSON file
            </span>
            <input
              id="file-upload"
              type="file"
              className="sr-only"
              accept=".json"
              onChange={handleFileInput}
            />
          </label>
          <p className="text-sm mt-1" style={{color: 'var(--muted)'}}>or drag and drop</p>
        </div>
        <p className="text-xs mt-2" style={{color: 'var(--muted)'}}>JSON files only</p>
      </div>

      {/* Manual JSON Input */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="form-label">
            Or paste JSON directly
          </label>
          <button
            type="button"
            onClick={handleLoadSample}
            className="text-sm font-medium"
            style={{color: 'var(--acc)'}}
          >
            Load Sample JSON
          </button>
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
          disabled={isAnalyzing || !jsonInput.trim()}
          className="btn-primary px-6 py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze JSON'}
        </button>
      </div>
    </form>
  );
}

