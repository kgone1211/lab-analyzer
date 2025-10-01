# LabLens 🔬

**Lab result insights (informational, not medical advice)**

LabLens is a Next.js application that analyzes lab results against reference ranges using rule-based heuristics and provides human-readable summaries with flags and next-step suggestions.

## ⚠️ Important Disclaimer

**This tool is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your healthcare provider regarding lab results and health concerns.**

## Features

- ✅ **Guided Form Entry**: Manual input for common lab panels (CBC, CMP, Lipids, A1c, Thyroid, Vitamin D, Iron Panel)
- ✅ **JSON Upload**: Drag-and-drop or paste JSON data for bulk analysis
- 🆕 **PDF/Word Upload**: AI-powered extraction from lab result documents (requires OpenAI API key)
- ✅ **Rule-Based Analysis**: Transparent, testable logic for marker classification
- ✅ **Human-Readable Reports**: Clear summaries with prioritized findings
- ✅ **Panel-Specific Insights**: Specialized analysis for each lab panel type
- ✅ **Print/PDF Export**: Save or print analysis reports
- ✅ **AI Refinement (Optional)**: Convert technical findings to patient-friendly language with OpenAI
- ✅ **Privacy-First**: No tracking, no PII storage, no database (v1)
- ✅ **Accessible**: Proper labels, keyboard navigation, error states

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **UI**: Tailwind CSS
- **Validation**: Zod schemas
- **Testing**: Vitest + Testing Library
- **Quality**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 20+ (recommended 20.19.0 or higher)
- npm or pnpm

### Installation

```bash
# Clone or download the repository
cd lab-analyzer

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables (Optional)

Create a `.env.local` file for optional features:

```bash
# Optional: Enable AI refinement feature
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_AI_REFINE_ENABLED=true
```

## Usage

### Method 1: Guided Form Entry

1. Select the lab panels you want to analyze (CBC, CMP, LIPID, etc.)
2. Enter values for each marker
3. Click "Analyze Results"
4. Review the detailed analysis

### Method 2: JSON Upload

1. Switch to the "Upload JSON" tab
2. Drag and drop a JSON file or paste JSON directly
3. Click "Load Sample JSON" to see the expected format
4. Click "Analyze JSON"

### Sample JSON Format

```json
{
  "patientId": "demo-123",
  "collectedAt": "2025-09-01",
  "panels": [
    {
      "panelName": "A1C",
      "markers": [
        { "name": "A1c", "value": 6.1, "unit": "%" }
      ]
    },
    {
      "panelName": "LIPID",
      "markers": [
        { "name": "Total Cholesterol", "value": 215, "unit": "mg/dL" },
        { "name": "LDL", "value": 140, "unit": "mg/dL" },
        { "name": "HDL", "value": 42, "unit": "mg/dL" },
        { "name": "Triglycerides", "value": 180, "unit": "mg/dL" }
      ]
    }
  ]
}
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## Analysis Logic

LabLens uses **rule-based heuristics** to classify lab markers:

### Classification
- **NORMAL**: Within reference range
- **LOW**: Below reference range
- **HIGH**: Above reference range
- **CRITICAL_LOW**: Significantly below range (>20% in most cases)
- **CRITICAL_HIGH**: Significantly above range (>20% in most cases)

### Panel-Specific Analysis

1. **CBC**: Basic blood cell count assessment
2. **CMP**: Metabolic panel with BUN/Creatinine ratio analysis
3. **Lipid Panel**: Cardiovascular risk assessment
4. **A1c**: Diabetes/prediabetes classification (normal <5.7%, prediabetes 5.7-6.4%, diabetes ≥6.5%)
5. **Thyroid**: TSH/Free T4 pattern recognition (hypo/hyperthyroid)
6. **Vitamin D**: Deficiency, insufficiency, or sufficiency
7. **Iron Panel**: Iron deficiency pattern detection

### Severity Levels
- **OK**: All markers within normal ranges
- **MILD**: 1-4 markers outside normal range
- **MODERATE**: 5+ markers outside normal range
- **SEVERE**: One or more critical values detected

## Reference Ranges

Default reference ranges are defined in `lib/analysis/ranges.ts`. These are general adult ranges and can be overridden on a per-marker basis in the JSON input.

Key examples:
- Hemoglobin: 12-16 g/dL
- Glucose (fasting): 70-99 mg/dL
- A1c: 4.8-5.6%
- TSH: 0.4-4.0 µIU/mL
- LDL: <100 mg/dL (optimal)
- Vitamin D: 30-100 ng/mL

*Note: Reference ranges may vary by lab, population, and clinical context.*

## Project Structure

```
lab-analyzer/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts       # Main analysis endpoint
│   │   └── refine/route.ts        # AI refinement endpoint
│   ├── layout.tsx
│   └── page.tsx                   # Main homepage
├── components/
│   ├── PanelForm.tsx              # Guided form entry
│   ├── JsonDropzone.tsx           # JSON upload
│   └── ResultsDisplay.tsx         # Analysis results
├── lib/
│   ├── schemas.ts                 # Zod validation schemas
│   └── analysis/
│       ├── engine.ts              # Analysis logic
│       └── ranges.ts              # Reference ranges
├── fixtures/
│   └── sample.json                # Sample data
└── __tests__/
    └── engine.test.ts             # Unit tests
```

## Contributing

This is a production-ready v1 implementation. Future enhancements could include:

- [ ] Database integration for result history
- [ ] Multi-user authentication
- [ ] Trend analysis over time
- [ ] More lab panels (hormones, vitamins, etc.)
- [ ] Downloadable PDF reports (currently browser print)
- [ ] Multi-language support

## License

This project is for educational and informational purposes only.

## Support

For questions or issues, please consult the documentation or create an issue in the repository.

---

**Remember: Always discuss your lab results with a qualified healthcare provider. This tool does not provide medical advice.**
