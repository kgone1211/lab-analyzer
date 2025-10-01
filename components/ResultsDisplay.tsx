'use client';

import { useState, useRef } from 'react';
import { AnalysisResult, MarkerStatus } from '@/lib/analysis/engine';
import { useReactToPrint } from 'react-to-print';

interface ResultsDisplayProps {
  result: AnalysisResult;
  onReset: () => void;
}

const STATUS_COLORS: Record<MarkerStatus, { bg: string; text: string; border: string }> = {
  CRITICAL_LOW: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  LOW: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  NORMAL: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  CRITICAL_HIGH: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

const SEVERITY_COLORS = {
  OK: { bg: 'bg-green-100', text: 'text-green-800' },
  MILD: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  MODERATE: { bg: 'bg-orange-100', text: 'text-orange-800' },
  SEVERE: { bg: 'bg-red-100', text: 'text-red-800' },
};

export default function ResultsDisplay({ result, onReset }: ResultsDisplayProps) {
  const [refinedText, setRefinedText] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'LabLens-Analysis-Report',
  });

  const handleRefine = async () => {
    setIsRefining(true);
    setRefineError(null);
    
    try {
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisResult: result }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Refinement failed');
      }
      
      setRefinedText(data.refinedText);
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRefining(false);
    }
  };

  const aiRefineAvailable = process.env.NEXT_PUBLIC_AI_REFINE_ENABLED === 'true';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">LabLens Analysis Results</h1>
            <p className="text-sm text-gray-600 mt-1">Review your lab analysis below</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Print / Save PDF
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Analysis
            </button>
          </div>
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
              <strong>Important:</strong> This analysis is for informational purposes only. Please discuss these results with your healthcare provider.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div ref={printRef} className="space-y-6">
          {/* Overall Severity */}
          <div className={`rounded-lg p-6 ${SEVERITY_COLORS[result.overallSeverity].bg}`}>
            <h2 className={`text-xl font-bold ${SEVERITY_COLORS[result.overallSeverity].text}`}>
              Overall Assessment: {result.overallSeverity}
            </h2>
          </div>

          {/* Summary Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Summary</h2>
            <ul className="space-y-2">
              {result.summaryBullets.map((bullet, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span className="text-gray-700">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Refined Text */}
          {refinedText && (
            <div className="bg-blue-50 rounded-lg shadow-lg p-6 border-2 border-blue-200">
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h2 className="text-xl font-bold text-blue-900">AI-Refined Explanation (Beta)</h2>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{refinedText}</p>
            </div>
          )}

          {/* AI Refine Button */}
          {aiRefineAvailable && !refinedText && (
            <div className="flex justify-center">
              <button
                onClick={handleRefine}
                disabled={isRefining}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isRefining ? 'Refining with AI...' : 'Refine with AI (Beta)'}
              </button>
            </div>
          )}

          {refineError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{refineError}</p>
            </div>
          )}

          {/* Panel Findings */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Detailed Findings</h2>
            
            {result.panelFindings.map((panel, panelIndex) => (
              <div key={panelIndex} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{panel.panelName}</h3>
                {panel.summary && (
                  <p className="text-gray-600 mb-4 italic">{panel.summary}</p>
                )}
                
                <div className="space-y-3">
                  {panel.findings.map((finding, findingIndex) => {
                    const colors = STATUS_COLORS[finding.status];
                    return (
                      <div
                        key={findingIndex}
                        className={`border-l-4 ${colors.border} bg-gray-50 p-4 rounded-r-lg`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-semibold text-gray-900">{finding.marker}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {finding.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{finding.note}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-gray-900">{finding.value}</p>
                            <p className="text-sm text-gray-500">{finding.unit}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
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

