'use client';

import { useState } from 'react';
import { Panel } from '@/lib/schemas';
import sampleData from '@/fixtures/sample.json';

interface PanelFormProps {
  onAnalyze: (data: any) => void;
  isAnalyzing: boolean;
}

type PanelName = "CBC" | "CMP" | "LIPID" | "A1C" | "THYROID" | "VITD" | "IRON";

const PANEL_MARKERS: Record<PanelName, string[]> = {
  CBC: ['Hemoglobin', 'Hematocrit', 'WBC', 'Platelets'],
  CMP: ['Sodium', 'Potassium', 'Chloride', 'CO2', 'BUN', 'Creatinine', 'Glucose', 'Calcium'],
  LIPID: ['Total Cholesterol', 'LDL', 'HDL', 'Triglycerides'],
  A1C: ['A1c'],
  THYROID: ['TSH', 'Free T4'],
  VITD: ['Vitamin D 25-OH'],
  IRON: ['Ferritin', 'Serum Iron', 'TIBC', 'Transferrin Sat'],
};

const MARKER_UNITS: Record<string, string> = {
  'Hemoglobin': 'g/dL',
  'Hematocrit': '%',
  'WBC': '×10^3/µL',
  'Platelets': '×10^3/µL',
  'Sodium': 'mmol/L',
  'Potassium': 'mmol/L',
  'Chloride': 'mmol/L',
  'CO2': 'mmol/L',
  'BUN': 'mg/dL',
  'Creatinine': 'mg/dL',
  'Glucose': 'mg/dL',
  'Calcium': 'mg/dL',
  'Total Cholesterol': 'mg/dL',
  'LDL': 'mg/dL',
  'HDL': 'mg/dL',
  'Triglycerides': 'mg/dL',
  'A1c': '%',
  'TSH': 'µIU/mL',
  'Free T4': 'ng/dL',
  'Vitamin D 25-OH': 'ng/mL',
  'Ferritin': 'ng/mL',
  'Serum Iron': 'µg/dL',
  'TIBC': 'µg/dL',
  'Transferrin Sat': '%',
};

export default function PanelForm({ onAnalyze, isAnalyzing }: PanelFormProps) {
  const [selectedPanels, setSelectedPanels] = useState<PanelName[]>([]);
  const [markerValues, setMarkerValues] = useState<Record<string, string>>({});

  const togglePanel = (panel: PanelName) => {
    if (selectedPanels.includes(panel)) {
      setSelectedPanels(selectedPanels.filter(p => p !== panel));
    } else {
      setSelectedPanels([...selectedPanels, panel]);
    }
  };

  const handleMarkerChange = (marker: string, value: string) => {
    setMarkerValues({ ...markerValues, [marker]: value });
  };

  const handleLoadSample = () => {
    // Load sample data
    const samplePanels = sampleData.panels.map(p => p.panelName as PanelName);
    setSelectedPanels(samplePanels);
    
    const values: Record<string, string> = {};
    sampleData.panels.forEach(panel => {
      panel.markers.forEach(marker => {
        values[marker.name] = marker.value.toString();
      });
    });
    setMarkerValues(values);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const panels: Panel[] = selectedPanels.map(panelName => ({
      panelName,
      markers: PANEL_MARKERS[panelName]
        .filter(marker => markerValues[marker] && markerValues[marker].trim() !== '')
        .map(marker => ({
          name: marker,
          value: parseFloat(markerValues[marker]),
          unit: MARKER_UNITS[marker],
        })),
    })).filter(panel => panel.markers.length > 0);

    onAnalyze({
      patientId: 'user-entry',
      collectedAt: new Date().toISOString(),
      panels,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Load Sample Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleLoadSample}
          className="text-sm font-medium"
          style={{color: 'var(--acc)'}}
        >
          Load Sample Data
        </button>
      </div>

      {/* Panel Selection */}
      <div>
        <h3 className="font-semibold mb-3" style={{color: 'var(--ink)', fontSize: '16px'}}>Select Lab Panels</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(PANEL_MARKERS) as PanelName[]).map(panel => (
            <button
              key={panel}
              type="button"
              onClick={() => togglePanel(panel)}
              className="px-4 py-2 rounded-lg font-medium transition-all"
              style={{
                border: selectedPanels.includes(panel) ? '1px solid var(--acc)' : '1px solid #2a2f3a',
                background: selectedPanels.includes(panel) ? 'rgba(143, 214, 255, 0.1)' : '#1f2633',
                color: selectedPanels.includes(panel) ? 'var(--acc)' : 'var(--ink)',
                fontSize: '14px'
              }}
            >
              {panel}
            </button>
          ))}
        </div>
      </div>

      {/* Marker Inputs */}
      {selectedPanels.length > 0 && (
        <div className="space-y-6">
          <h3 className="font-semibold" style={{color: 'var(--ink)', fontSize: '16px'}}>Enter Values</h3>
          
          {selectedPanels.map(panel => (
            <div key={panel} style={{background: '#1f2633', border: '1px solid #2a2f3a'}} className="rounded-lg p-4">
              <h4 className="font-semibold mb-3" style={{color: 'var(--ink)', fontSize: '15px'}}>{panel}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PANEL_MARKERS[panel].map(marker => (
                  <div key={marker} className="form-group">
                    <label className="form-label">
                      {marker}
                      <span style={{color: 'var(--muted)'}} className="ml-1">({MARKER_UNITS[marker]})</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={markerValues[marker] || ''}
                      onChange={(e) => handleMarkerChange(marker, e.target.value)}
                      className="form-input"
                      placeholder="Enter value"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isAnalyzing || selectedPanels.length === 0}
          className="btn-primary px-6 py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Results'}
        </button>
      </div>
    </form>
  );
}

