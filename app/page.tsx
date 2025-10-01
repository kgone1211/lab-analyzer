'use client';

import { useState } from 'react';
import { Panel } from '@/lib/schemas';
import PanelForm from '@/components/PanelForm';
import JsonDropzone from '@/components/JsonDropzone';
import ResultsDisplay from '@/components/ResultsDisplay';
import { AnalysisResult } from '@/lib/analysis/engine';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('json');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (submissionData: unknown) => {
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
        let errorMsg = data.error || 'Analysis failed';
        
        // Include validation details if available
        if (data.details && Array.isArray(data.details)) {
          const detailsMsg = data.details.map((d: { path: string[]; message: string }) => 
            `${d.path.join('.')}: ${d.message}`
          ).join('\n');
          errorMsg += `\n\nValidation errors:\n${detailsMsg}`;
          
          // Also log the full data to help debug
          console.error('Validation failed for data:', submissionData);
          console.error('Validation errors:', data.details);
        }
        
        throw new Error(errorMsg);
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
      {/* Header */}
      <header style={{background: 'var(--card)', borderBottom: '1px solid #2a2f3a', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'}}>
        <div className="max-w-7xl mx-auto px-6 py-6 relative">
          <div style={{position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)'}}>
            <div style={{
              width: '52px',
              height: '52px',
              background: 'linear-gradient(135deg, var(--acc) 0%, #7bc5e8 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              boxShadow: '0 4px 12px rgba(143, 214, 255, 0.3)'
            }}>
              🔬
            </div>
          </div>
          <div className="text-center" style={{paddingTop: '8px'}}>
            <h1 className="text-3xl font-bold" style={{color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: '4px'}}>
              LabLens
            </h1>
            <p className="text-sm" style={{color: 'var(--muted)'}}>
              Lab result insights
            </p>
          </div>
        </div>
      </header>

      {/* Disclaimer Banner */}
      <div style={{background: '#4a3a2a', borderBottom: '1px solid #5a4a3a', padding: '4px 0'}}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center">
            <svg style={{width: '11px', height: '11px', minWidth: '11px', minHeight: '11px', marginRight: '5px', color: 'var(--warning)', flexShrink: 0}} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p style={{fontSize: '10px', color: 'var(--warning)', lineHeight: '1.2'}}>
              <strong>Disclaimer:</strong> Educational only. Not medical advice.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 pb-24">
        <div className="card" style={{padding: '32px'}}>
          {/* Tabs */}
          <div style={{borderBottom: '2px solid #2a2f3a', marginBottom: '28px'}}>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('form')}
                className="px-6 py-3 font-semibold transition-all relative"
                style={{
                  background: activeTab === 'form' 
                    ? 'linear-gradient(to bottom, rgba(143, 214, 255, 0.2), rgba(143, 214, 255, 0.1))'
                    : 'transparent',
                  color: activeTab === 'form' ? 'var(--acc)' : 'var(--muted)',
                  fontSize: '15px',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px',
                  borderBottom: activeTab === 'form' ? '3px solid var(--acc)' : '3px solid transparent',
                  marginBottom: '-2px',
                  boxShadow: activeTab === 'form' ? '0 -2px 8px rgba(143, 214, 255, 0.2)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'form') {
                    e.currentTarget.style.color = 'var(--ink)';
                    e.currentTarget.style.background = 'rgba(143, 214, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'form') {
                    e.currentTarget.style.color = 'var(--muted)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                📝 Guided Form Entry
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className="px-6 py-3 font-semibold transition-all relative"
                style={{
                  background: activeTab === 'json' 
                    ? 'linear-gradient(to bottom, rgba(143, 214, 255, 0.2), rgba(143, 214, 255, 0.1))'
                    : 'transparent',
                  color: activeTab === 'json' ? 'var(--acc)' : 'var(--muted)',
                  fontSize: '15px',
                  borderTopLeftRadius: '10px',
                  borderTopRightRadius: '10px',
                  borderBottom: activeTab === 'json' ? '3px solid var(--acc)' : '3px solid transparent',
                  marginBottom: '-2px',
                  boxShadow: activeTab === 'json' ? '0 -2px 8px rgba(143, 214, 255, 0.2)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'json') {
                    e.currentTarget.style.color = 'var(--ink)';
                    e.currentTarget.style.background = 'rgba(143, 214, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'json') {
                    e.currentTarget.style.color = 'var(--muted)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                📄 Upload Document
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error mb-6" style={{maxHeight: '400px', overflow: 'auto'}}>
              <div className="flex">
                <svg className="h-5 w-5 mt-0.5 mr-2" style={{color: 'var(--danger)', flexShrink: 0}} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="text-sm whitespace-pre-wrap flex-1" style={{wordBreak: 'break-word'}}>{error}</div>
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

      {/* Footer Disclaimer - Fixed at bottom */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--card)', 
        borderTop: '1px solid #2a2f3a',
        zIndex: 10,
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center" style={{color: 'var(--ink)', fontSize: '13px', opacity: 0.8, lineHeight: '1.6'}}>
            © 2025 LabLens. This tool provides informational analysis only and does not constitute medical advice. 
            All lab results should be reviewed with a qualified healthcare provider.
          </p>
        </div>
      </footer>
    </div>
  );
}
