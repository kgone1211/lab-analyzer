'use client';

import { useState } from 'react';
import { Panel } from '@/lib/schemas';
import PanelForm from '@/components/PanelForm';
import JsonDropzone from '@/components/JsonDropzone';
import ResultsDisplay from '@/components/ResultsDisplay';
import { AnalysisResult } from '@/lib/analysis/engine';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panels, setPanels] = useState<Panel[]>([]);

  const handleAnalyze = async (submissionData: any) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }
      
      setAnalysisResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setError(null);
    setPanels([]);
  };

  if (analysisResult) {
    return (
      <ResultsDisplay 
        result={analysisResult} 
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'var(--bg)'}}>
      {/* Header with Disclaimer */}
      <header style={{background: 'var(--card)', borderBottom: '1px solid #2a2f3a'}}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold" style={{color: 'var(--ink)'}}>
            🔬 LabLens
          </h1>
          <p className="text-sm mt-1" style={{color: 'var(--muted)'}}>
            Lab result insights (informational, not medical advice)
          </p>
        </div>
      </header>

      {/* Disclaimer Banner */}
      <div style={{background: '#4a3a2a', borderBottom: '1px solid #5a4a3a'}}>
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-2 flex-shrink-0" style={{color: 'var(--warning)'}} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs" style={{color: 'var(--warning)'}}>
              <strong>Important:</strong> Educational purposes only. Not medical advice. Consult your healthcare provider.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="card">
          {/* Tabs */}
          <div style={{borderBottom: '1px solid #2a2f3a'}} className="mb-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('form')}
                className="pb-4 px-1 border-b-2 font-medium text-sm transition-colors"
                style={{
                  borderColor: activeTab === 'form' ? 'var(--acc)' : 'transparent',
                  color: activeTab === 'form' ? 'var(--acc)' : 'var(--muted)'
                }}
              >
                Guided Form Entry
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className="pb-4 px-1 border-b-2 font-medium text-sm transition-colors"
                style={{
                  borderColor: activeTab === 'json' ? 'var(--acc)' : 'transparent',
                  color: activeTab === 'json' ? 'var(--acc)' : 'var(--muted)'
                }}
              >
                Upload JSON
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error mb-6">
              <div className="flex">
                <svg className="h-5 w-5 mt-0.5 mr-2" style={{color: 'var(--danger)'}} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {activeTab === 'form' ? (
            <PanelForm onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
          ) : (
            <JsonDropzone onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
          )}
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer style={{background: 'var(--card)', borderTop: '1px solid #2a2f3a'}} className="mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-xs text-center" style={{color: 'var(--muted)'}}>
            © 2025 LabLens. This tool provides informational analysis only and does not constitute medical advice. 
            All lab results should be reviewed with a qualified healthcare provider.
          </p>
        </div>
      </footer>
    </div>
  );
}
