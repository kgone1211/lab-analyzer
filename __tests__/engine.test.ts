import { describe, it, expect } from 'vitest';
import { classify, analyzeSubmission } from '@/lib/analysis/engine';
import { Submission } from '@/lib/schemas';

describe('LabLens Analysis Engine', () => {
  describe('classify', () => {
    it('should classify normal values correctly', () => {
      expect(classify(75, 70, 100)).toBe('NORMAL');
      expect(classify(70, 70, 100)).toBe('NORMAL');
      expect(classify(100, 70, 100)).toBe('NORMAL');
    });

    it('should classify low values correctly', () => {
      expect(classify(65, 70, 100)).toBe('LOW');
    });

    it('should classify high values correctly', () => {
      expect(classify(105, 70, 100)).toBe('HIGH');
    });

    it('should classify critical low values correctly', () => {
      expect(classify(40, 70, 100, 50, 150)).toBe('CRITICAL_LOW');
    });

    it('should classify critical high values correctly', () => {
      expect(classify(160, 70, 100, 50, 150)).toBe('CRITICAL_HIGH');
    });
  });

  describe('A1c Analysis', () => {
    it('should identify normal A1c', () => {
      const submission: Submission = {
        panels: [
          {
            panelName: 'A1C',
            markers: [{ name: 'A1c', value: 5.4, unit: '%' }],
          },
        ],
      };

      const result = analyzeSubmission(submission);
      expect(result.overallSeverity).toBe('OK');
      expect(result.summaryBullets.some(b => b.includes('normal'))).toBe(true);
    });

    it('should identify prediabetes A1c', () => {
      const submission: Submission = {
        panels: [
          {
            panelName: 'A1C',
            markers: [{ name: 'A1c', value: 6.0, unit: '%' }],
          },
        ],
      };

      const result = analyzeSubmission(submission);
      expect(result.overallSeverity).toBe('MILD');
      expect(result.summaryBullets.some(b => b.includes('prediabetes'))).toBe(true);
    });

    it('should identify diabetes criteria A1c', () => {
      const submission: Submission = {
        panels: [
          {
            panelName: 'A1C',
            markers: [{ name: 'A1c', value: 7.0, unit: '%' }],
          },
        ],
      };

      const result = analyzeSubmission(submission);
      expect(result.overallSeverity).toBe('MILD');
      expect(result.summaryBullets.some(b => b.includes('diabetes'))).toBe(true);
    });
  });

  describe('BUN/Creatinine Ratio', () => {
    it('should flag elevated BUN/Cr ratio', () => {
      const submission: Submission = {
        panels: [
          {
            panelName: 'CMP',
            markers: [
              { name: 'BUN', value: 25, unit: 'mg/dL' },
              { name: 'Creatinine', value: 1.0, unit: 'mg/dL' },
            ],
          },
        ],
      };

      const result = analyzeSubmission(submission);
      const cmpPanel = result.panelFindings.find(p => p.panelName === 'CMP');
      expect(cmpPanel?.summary).toContain('ratio');
    });
  });

  describe('Thyroid Patterns', () => {
    it('should identify hypothyroid pattern', () => {
      const submission: Submission = {
        panels: [
          {
            panelName: 'THYROID',
            markers: [
              { name: 'TSH', value: 5.5, unit: 'µIU/mL' },
              { name: 'Free T4', value: 0.7, unit: 'ng/dL' },
            ],
          },
        ],
      };

      const result = analyzeSubmission(submission);
      const thyroidPanel = result.panelFindings.find(p => p.panelName === 'THYROID');
      expect(thyroidPanel?.summary).toContain('hypothyroid');
    });

    it('should identify hyperthyroid pattern', () => {
      const submission: Submission = {
        panels: [
          {
            panelName: 'THYROID',
            markers: [
              { name: 'TSH', value: 0.2, unit: 'µIU/mL' },
              { name: 'Free T4', value: 2.0, unit: 'ng/dL' },
            ],
          },
        ],
      };

      const result = analyzeSubmission(submission);
      const thyroidPanel = result.panelFindings.find(p => p.panelName === 'THYROID');
      expect(thyroidPanel?.summary).toContain('hyperthyroid');
    });
  });

  describe('Lipid Flags', () => {
    it('should flag adverse lipid profile', () => {
      const submission: Submission = {
        panels: [
          {
            panelName: 'LIPID',
            markers: [
              { name: 'Total Cholesterol', value: 220, unit: 'mg/dL' },
              { name: 'LDL', value: 150, unit: 'mg/dL' },
              { name: 'HDL', value: 35, unit: 'mg/dL' },
              { name: 'Triglycerides', value: 200, unit: 'mg/dL' },
            ],
          },
        ],
      };

      const result = analyzeSubmission(submission);
      const lipidPanel = result.panelFindings.find(p => p.panelName === 'LIPID');
      expect(lipidPanel?.summary).toContain('elevated');
    });
  });

  describe('Iron Deficiency', () => {
    it('should identify iron deficiency pattern', () => {
      const submission: Submission = {
        panels: [
          {
            panelName: 'IRON',
            markers: [
              { name: 'Ferritin', value: 15, unit: 'ng/mL' },
              { name: 'Transferrin Sat', value: 12, unit: '%' },
            ],
          },
        ],
      };

      const result = analyzeSubmission(submission);
      const ironPanel = result.panelFindings.find(p => p.panelName === 'IRON');
      expect(ironPanel?.summary).toContain('iron deficiency');
    });
  });

  describe('Overall Severity', () => {
    it('should mark SEVERE for critical values', () => {
      const submission: Submission = {
        panels: [
          {
            panelName: 'CBC',
            markers: [
              { name: 'Hemoglobin', value: 6.0, unit: 'g/dL' }, // Critical low
            ],
          },
        ],
      };

      const result = analyzeSubmission(submission);
      expect(result.overallSeverity).toBe('SEVERE');
    });

    it('should mark MODERATE for multiple abnormals', () => {
      const submission: Submission = {
        panels: [
          {
            panelName: 'CMP',
            markers: [
              { name: 'Sodium', value: 130, unit: 'mmol/L' },
              { name: 'Potassium', value: 5.5, unit: 'mmol/L' },
              { name: 'Glucose', value: 110, unit: 'mg/dL' },
              { name: 'BUN', value: 25, unit: 'mg/dL' },
              { name: 'Calcium', value: 11.0, unit: 'mg/dL' },
            ],
          },
        ],
      };

      const result = analyzeSubmission(submission);
      expect(result.overallSeverity).toBe('MODERATE');
    });

    it('should mark MILD for few abnormals', () => {
      const submission: Submission = {
        panels: [
          {
            panelName: 'VITD',
            markers: [
              { name: 'Vitamin D 25-OH', value: 25, unit: 'ng/mL' },
            ],
          },
        ],
      };

      const result = analyzeSubmission(submission);
      expect(result.overallSeverity).toBe('MILD');
    });

    it('should mark OK for all normal values', () => {
      const submission: Submission = {
        panels: [
          {
            panelName: 'A1C',
            markers: [
              { name: 'A1c', value: 5.2, unit: '%' },
            ],
          },
        ],
      };

      const result = analyzeSubmission(submission);
      expect(result.overallSeverity).toBe('OK');
    });
  });
});

