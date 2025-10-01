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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Disclaimer */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-900">
            LabLens
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Lab result insights (informational, not medical advice)
          </p>
        </div>
      </header>

      {/* Disclaimer Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> This tool is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your healthcare provider.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('form')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'form'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Guided Form Entry
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'json'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upload JSON
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="ml-3 text-sm text-red-800">{error}</p>
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
      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-xs text-gray-600 text-center">
            © 2025 LabLens. This tool provides informational analysis only and does not constitute medical advice. 
            All lab results should be reviewed with a qualified healthcare provider.
          </p>
        </div>
      </footer>
    </div>
  );
}
