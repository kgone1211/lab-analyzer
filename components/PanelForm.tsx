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
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Load Sample Data
        </button>
      </div>

      {/* Panel Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Lab Panels</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(PANEL_MARKERS) as PanelName[]).map(panel => (
            <button
              key={panel}
              type="button"
              onClick={() => togglePanel(panel)}
              className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-colors ${
                selectedPanels.includes(panel)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {panel}
            </button>
          ))}
        </div>
      </div>

      {/* Marker Inputs */}
      {selectedPanels.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Enter Values</h3>
          
          {selectedPanels.map(panel => (
            <div key={panel} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{panel}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PANEL_MARKERS[panel].map(marker => (
                  <div key={marker}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {marker}
                      <span className="text-gray-500 ml-1">({MARKER_UNITS[marker]})</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={markerValues[marker] || ''}
                      onChange={(e) => handleMarkerChange(marker, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Results'}
        </button>
      </div>
    </form>
  );
}

