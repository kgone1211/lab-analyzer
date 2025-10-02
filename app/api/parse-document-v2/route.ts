import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI document parsing is not configured. Please add OPENAI_API_KEY to your environment.' },
        { status: 503 }
      );
    }

    const fileType = file.type;
    const buffer = await file.arrayBuffer();

    // For PDFs, convert to base64 and use OpenAI Vision API
    if (fileType === 'application/pdf') {
      try {
        // Convert PDF to base64
        const base64 = Buffer.from(buffer).toString('base64');
        
        // Use OpenAI Vision API to extract text from PDF
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Extract all lab results from this PDF document and convert them to JSON format. Look for any lab values, reference ranges, and panel information.

The JSON must follow this exact schema:
{
  "panels": [
    {
      "panelName": "CBC" | "CMP" | "LIPID" | "A1C" | "THYROID" | "VITD" | "IRON" | "TESTOSTERONE" | "HORMONE" | "REPRODUCTIVE" | "LIVER" | "KIDNEY" | "CARDIO",
      "markers": [
        {
          "name": "marker name",
          "value": number,
          "unit": "unit string",
          "refLow": number (optional),
          "refHigh": number (optional)
        }
      ]
    }
  ]
}

CRITICAL: The "value" field must ALWAYS be a number. If you see "<0.1" or ">100" or similar, convert it:
- "<0.1" → use 0.1 (or 0 if referring to detection limit)
- ">100" → use 100
- "Negative" → use 0
- "Positive" → use 1
Never use strings for values.

Panel types:
- CBC: Hemoglobin, Hematocrit, WBC, Platelets, RBC, MCV, MCH, MCHC
- CMP: Sodium, Potassium, Chloride, CO2, BUN, Creatinine, Glucose, Calcium, AST, ALT, Alk Phos, Albumin, Total Bilirubin
- LIPID: Total Cholesterol, LDL, HDL, Triglycerides
- A1C: A1c
- THYROID: TSH, Free T4, Free T3
- VITD: Vitamin D 25-OH
- IRON: Ferritin, Serum Iron, TIBC, Transferrin Saturation

Extract ALL markers you can find. If reference ranges are provided in the document, include them as refLow/refHigh.
Only return valid JSON, no explanatory text.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:application/pdf;base64,${base64}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        });

        const resultText = completion.choices[0]?.message?.content;
        if (!resultText) {
          return NextResponse.json(
            { error: 'AI failed to parse the PDF. Please try again or use JSON upload.' },
            { status: 500 }
          );
        }

        // Parse and validate the JSON
        let parsedResult;
        try {
          parsedResult = JSON.parse(resultText);
        } catch {
          return NextResponse.json(
            { error: 'AI returned invalid JSON. Please try again or use manual entry.' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: parsedResult,
          extractedText: 'PDF parsed using AI Vision API'
        });

      } catch (error) {
        console.error('PDF Vision API error:', error);
        return NextResponse.json(
          { error: 'Failed to parse PDF using AI. Please try a different file or use manual entry.' },
          { status: 400 }
        );
      }
    }

    // For Word documents, use mammoth
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword'
    ) {
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.default.extractRawText({ buffer: Buffer.from(buffer) });
        const extractedText = result.value;

        if (!extractedText || extractedText.trim().length === 0) {
          return NextResponse.json(
            { error: 'Could not extract text from Word document. The document may be empty or unreadable.' },
            { status: 400 }
          );
        }

        // Use OpenAI to parse the lab results
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a medical lab result parser. Extract lab results from the provided text and convert them to JSON format.

The JSON must follow this exact schema:
{
  "panels": [
    {
      "panelName": "CBC" | "CMP" | "LIPID" | "A1C" | "THYROID" | "VITD" | "IRON" | "TESTOSTERONE" | "HORMONE" | "REPRODUCTIVE" | "LIVER" | "KIDNEY" | "CARDIO",
      "markers": [
        {
          "name": "marker name",
          "value": number,
          "unit": "unit string",
          "refLow": number (optional),
          "refHigh": number (optional)
        }
      ]
    }
  ]
}

CRITICAL: The "value" field must ALWAYS be a number. If you see "<0.1" or ">100" or similar, convert it:
- "<0.1" → use 0.1 (or 0 if referring to detection limit)
- ">100" → use 100
- "Negative" → use 0
- "Positive" → use 1
Never use strings for values.

Panel types:
- CBC: Hemoglobin, Hematocrit, WBC, Platelets, RBC, MCV, MCH, MCHC
- CMP: Sodium, Potassium, Chloride, CO2, BUN, Creatinine, Glucose, Calcium, AST, ALT, Alk Phos, Albumin, Total Bilirubin
- LIPID: Total Cholesterol, LDL, HDL, Triglycerides
- A1C: A1c
- THYROID: TSH, Free T4, Free T3
- VITD: Vitamin D 25-OH
- IRON: Ferritin, Serum Iron, TIBC, Transferrin Saturation

Extract ALL markers you can find. If reference ranges are provided in the document, include them as refLow/refHigh.
Only return valid JSON, no explanatory text.`,
            },
            {
              role: 'user',
              content: `Extract lab results from this document:\n\n${extractedText}`,
            },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        });

        const resultText = completion.choices[0]?.message?.content;
        if (!resultText) {
          return NextResponse.json(
            { error: 'AI failed to parse the document. Please try again or use JSON upload.' },
            { status: 500 }
          );
        }

        // Parse and validate the JSON
        let parsedResult;
        try {
          parsedResult = JSON.parse(resultText);
        } catch {
          return NextResponse.json(
            { error: 'AI returned invalid JSON. Please try again or use manual entry.' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: parsedResult,
          extractedText: extractedText.substring(0, 500) + '...'
        });

      } catch (error) {
        console.error('Word document parsing error:', error);
        return NextResponse.json(
          { error: 'Failed to parse Word document. Please try a different file or use manual entry.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Unsupported file type. Please upload a PDF or Word document.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Document parsing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse document';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
