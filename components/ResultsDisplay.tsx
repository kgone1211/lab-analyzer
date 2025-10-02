'use client';

import { useState, useRef } from 'react';
import { AnalysisResult, MarkerStatus } from '@/lib/analysis/engine';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ResultsDisplayProps {
  result: AnalysisResult;
  onReset: () => void;
}

export default function ResultsDisplay({ result, onReset }: ResultsDisplayProps) {
  const [refinedText, setRefinedText] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'LabLens-Analysis-Report',
  });

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0f1115'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`LabLens-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try the Print option instead.');
    }
  };

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
            <h1 className="text-3xl font-bold" style={{color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: '4px'}}>LabLens</h1>
            <p className="text-sm" style={{color: 'var(--muted)'}}>Analysis Results</p>
          </div>
          <div className="flex gap-3" style={{position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)'}}>
            <button
              onClick={handleDownloadPDF}
              className="btn px-5 py-2.5 rounded-lg transition-all font-semibold"
              style={{fontSize: '14px'}}
              title="Download as PDF"
            >
              📥 Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="btn px-5 py-2.5 rounded-lg transition-all font-semibold"
              style={{fontSize: '14px'}}
              title="Print report"
            >
              🖨️ Print
            </button>
            <button
              onClick={onReset}
              className="btn-primary px-5 py-2.5 rounded-lg transition-all font-semibold"
              style={{fontSize: '14px'}}
            >
              New Analysis
            </button>
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
              <strong>Disclaimer:</strong> Informational only. Discuss with your healthcare provider.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 pb-24">
        <div ref={printRef} className="space-y-6">
          {/* Overall Severity */}
          <div className="card p-6" style={{
            background: result.overallSeverity === 'SEVERE' ? '#4a2c2a' : 
                       result.overallSeverity === 'MODERATE' ? '#4a3a2a' :
                       result.overallSeverity === 'MILD' ? '#2a3a4a' : '#2a4a2a',
            border: '1px solid #2a2f3a'
          }}>
            <h2 className="text-xl font-bold" style={{
              color: result.overallSeverity === 'SEVERE' ? 'var(--danger)' : 
                     result.overallSeverity === 'MODERATE' ? 'var(--warning)' :
                     result.overallSeverity === 'MILD' ? 'var(--acc)' : 'var(--success)'
            }}>
              Overall Assessment: {result.overallSeverity}
            </h2>
          </div>

          {/* Summary Section */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold mb-5" style={{color: 'var(--ink)', letterSpacing: '-0.02em'}}>Summary</h2>
            <ul className="space-y-3">
              {result.summaryBullets.map((bullet, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-3 mt-1" style={{
                    color: 'var(--acc)',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>•</span>
                  <span style={{color: 'var(--ink)', fontSize: '15px', lineHeight: '1.6'}}>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Symptom Findings */}
          {result.symptomFindings && result.symptomFindings.length > 0 && (
            <div className="card p-8">
              <h2 className="text-2xl font-bold mb-5" style={{color: 'var(--ink)', letterSpacing: '-0.02em'}}>Possible Symptoms & Clinical Findings</h2>
              <div className="space-y-6">
                {result.symptomFindings.map((finding, index) => (
                  <div key={index} className="border-l-4 pl-6" style={{
                    borderColor: finding.severity === 'severe' ? 'var(--danger)' : 
                               finding.severity === 'moderate' ? 'var(--warning)' : 'var(--acc)'
                  }}>
                    <div className="flex items-center mb-3">
                      <h3 className="text-lg font-semibold" style={{color: 'var(--ink)'}}>
                        {finding.category}
                      </h3>
                      <span className="ml-3 px-3 py-1 rounded-full text-xs font-medium" style={{
                        background: finding.severity === 'severe' ? 'rgba(239, 68, 68, 0.2)' : 
                                  finding.severity === 'moderate' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: finding.severity === 'severe' ? 'var(--danger)' : 
                              finding.severity === 'moderate' ? 'var(--warning)' : 'var(--acc)'
                      }}>
                        {finding.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="mb-4 text-sm" style={{color: 'var(--muted)', fontStyle: 'italic'}}>
                      {finding.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {finding.symptoms.map((symptom, symptomIndex) => (
                        <div key={symptomIndex} className="flex items-center">
                          <span className="mr-2" style={{color: 'var(--acc)', fontSize: '14px'}}>•</span>
                          <span style={{color: 'var(--ink)', fontSize: '14px'}}>{symptom}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg" style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)'}}>
                <p className="text-sm" style={{color: 'var(--acc)'}}>
                  <strong>Note:</strong> These are potential symptoms that may be associated with your lab findings. 
                  Not everyone will experience all symptoms, and symptoms can vary in severity. 
                  Always discuss any concerning symptoms with your healthcare provider.
                </p>
              </div>
            </div>
          )}

          {/* AI Refined Text */}
          {refinedText && (
            <div className="card p-6" style={{border: '2px solid var(--acc)'}}>
              <div className="flex items-center mb-4">
                <svg className="h-6 w-6 mr-2" style={{color: 'var(--acc)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h2 className="text-xl font-bold" style={{color: 'var(--acc)'}}>AI-Refined Explanation (Beta)</h2>
              </div>
              <p className="whitespace-pre-wrap" style={{color: 'var(--ink)'}}>{refinedText}</p>
            </div>
          )}

          {/* AI Refine Button */}
          {aiRefineAvailable && !refinedText && (
            <div className="flex justify-center">
              <button
                onClick={handleRefine}
                disabled={isRefining}
                className="btn-primary px-6 py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefining ? 'Refining with AI...' : 'Refine with AI (Beta)'}
              </button>
            </div>
          )}

          {refineError && (
            <div className="error">
              <p className="text-sm">{refineError}</p>
            </div>
          )}

          {/* Panel Findings */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold" style={{color: 'var(--ink)', letterSpacing: '-0.02em'}}>Detailed Findings</h2>
            
            {result.panelFindings.map((panel, panelIndex) => (
              <div key={panelIndex} className="card p-8">
                <h3 className="text-xl font-bold mb-3" style={{color: 'var(--ink)', letterSpacing: '-0.01em'}}>{panel.panelName}</h3>
                {panel.summary && (
                  <p className="mb-4 italic" style={{color: 'var(--muted)'}}>{panel.summary}</p>
                )}
                
                <div className="space-y-3">
                  {panel.findings.map((finding, findingIndex) => {
                    const getBorderColor = (status: MarkerStatus) => {
                      if (status.includes('CRITICAL')) return 'var(--danger)';
                      if (status === 'LOW') return 'var(--warning)';
                      if (status === 'NORMAL') return 'var(--success)';
                      if (status === 'HIGH') return 'var(--warning)';
                      return 'var(--muted)';
                    };
                    
                    const getStatusBg = (status: MarkerStatus) => {
                      if (status.includes('CRITICAL')) return '#4a2c2a';
                      if (status === 'LOW') return '#4a3a2a';
                      if (status === 'NORMAL') return '#2a4a2a';
                      if (status === 'HIGH') return '#4a3a2a';
                      return '#2a2f3a';
                    };
                    
                    return (
                      <div
                        key={findingIndex}
                        className="p-4 rounded-r-lg"
                        style={{
                          borderLeft: `4px solid ${getBorderColor(finding.status)}`,
                          background: '#0b0d11'
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-semibold" style={{color: 'var(--ink)'}}>{finding.marker}</h4>
                              <span 
                                className="px-2 py-1 rounded-full text-xs font-medium" 
                                style={{
                                  background: getStatusBg(finding.status),
                                  color: getBorderColor(finding.status)
                                }}
                              >
                                {finding.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-sm mt-1" style={{color: 'var(--muted)'}}>{finding.note}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold" style={{color: 'var(--ink)'}}>{finding.value}</p>
                            <p className="text-sm" style={{color: 'var(--muted)'}}>{finding.unit}</p>
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

