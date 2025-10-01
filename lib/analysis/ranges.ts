export interface ReferenceRange {
  low: number;
  high: number;
  unit: string;
  criticalLow?: number;
  criticalHigh?: number;
}

export const REFERENCE_RANGES: Record<string, ReferenceRange> = {
  // CBC
  "Hemoglobin": { low: 12.0, high: 16.0, unit: "g/dL", criticalLow: 7.0, criticalHigh: 20.0 },
  "Hematocrit": { low: 36, high: 48, unit: "%", criticalLow: 20, criticalHigh: 60 },
  "WBC": { low: 4.0, high: 11.0, unit: "×10^3/µL", criticalLow: 2.0, criticalHigh: 30.0 },
  "Platelets": { low: 150, high: 400, unit: "×10^3/µL", criticalLow: 50, criticalHigh: 1000 },
  
  // CMP
  "Sodium": { low: 135, high: 145, unit: "mmol/L", criticalLow: 120, criticalHigh: 160 },
  "Potassium": { low: 3.5, high: 5.1, unit: "mmol/L", criticalLow: 2.5, criticalHigh: 6.5 },
  "Chloride": { low: 98, high: 107, unit: "mmol/L", criticalLow: 80, criticalHigh: 120 },
  "CO2": { low: 22, high: 29, unit: "mmol/L", criticalLow: 15, criticalHigh: 40 },
  "Bicarbonate": { low: 22, high: 29, unit: "mmol/L", criticalLow: 15, criticalHigh: 40 },
  "BUN": { low: 7, high: 20, unit: "mg/dL", criticalLow: 0, criticalHigh: 100 },
  "Creatinine": { low: 0.6, high: 1.3, unit: "mg/dL", criticalLow: 0, criticalHigh: 10 },
  "Glucose": { low: 70, high: 99, unit: "mg/dL", criticalLow: 40, criticalHigh: 400 },
  "Calcium": { low: 8.6, high: 10.2, unit: "mg/dL", criticalLow: 6.0, criticalHigh: 14.0 },
  "AST": { low: 0, high: 40, unit: "U/L", criticalLow: 0, criticalHigh: 500 },
  "ALT": { low: 0, high: 40, unit: "U/L", criticalLow: 0, criticalHigh: 500 },
  "Alk Phos": { low: 44, high: 147, unit: "U/L", criticalLow: 0, criticalHigh: 1000 },
  "Alkaline Phosphatase": { low: 44, high: 147, unit: "U/L", criticalLow: 0, criticalHigh: 1000 },
  "Albumin": { low: 3.5, high: 5.5, unit: "g/dL", criticalLow: 2.0, criticalHigh: 6.0 },
  "Total Bilirubin": { low: 0.1, high: 1.2, unit: "mg/dL", criticalLow: 0, criticalHigh: 20 },
  "Bilirubin": { low: 0.1, high: 1.2, unit: "mg/dL", criticalLow: 0, criticalHigh: 20 },
  
  // Lipid Panel
  "Total Cholesterol": { low: 0, high: 200, unit: "mg/dL", criticalHigh: 300 },
  "LDL": { low: 0, high: 100, unit: "mg/dL", criticalHigh: 190 },
  "HDL": { low: 50, high: 200, unit: "mg/dL", criticalLow: 20 },
  "Triglycerides": { low: 0, high: 150, unit: "mg/dL", criticalHigh: 500 },
  
  // A1c
  "A1c": { low: 4.8, high: 5.6, unit: "%", criticalHigh: 10.0 },
  "Hemoglobin A1c": { low: 4.8, high: 5.6, unit: "%", criticalHigh: 10.0 },
  
  // Thyroid
  "TSH": { low: 0.4, high: 4.0, unit: "µIU/mL", criticalLow: 0.01, criticalHigh: 20.0 },
  "Free T4": { low: 0.8, high: 1.8, unit: "ng/dL", criticalLow: 0.1, criticalHigh: 5.0 },
  "FT4": { low: 0.8, high: 1.8, unit: "ng/dL", criticalLow: 0.1, criticalHigh: 5.0 },
  
  // Vitamin D
  "Vitamin D 25-OH": { low: 30, high: 100, unit: "ng/mL", criticalLow: 10, criticalHigh: 150 },
  "Vitamin D": { low: 30, high: 100, unit: "ng/mL", criticalLow: 10, criticalHigh: 150 },
  
  // Iron Panel
  "Ferritin": { low: 30, high: 150, unit: "ng/mL", criticalLow: 5, criticalHigh: 500 },
  "Serum Iron": { low: 60, high: 170, unit: "µg/dL", criticalLow: 20, criticalHigh: 300 },
  "Iron": { low: 60, high: 170, unit: "µg/dL", criticalLow: 20, criticalHigh: 300 },
  "TIBC": { low: 240, high: 450, unit: "µg/dL", criticalLow: 100, criticalHigh: 600 },
  "Transferrin Saturation": { low: 20, high: 50, unit: "%", criticalLow: 5, criticalHigh: 100 },
  "Transferrin Sat": { low: 20, high: 50, unit: "%", criticalLow: 5, criticalHigh: 100 },
};

export function getReferenceRange(markerName: string): ReferenceRange | undefined {
  return REFERENCE_RANGES[markerName];
}

