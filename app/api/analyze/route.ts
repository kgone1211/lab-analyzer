import { NextRequest, NextResponse } from 'next/server';
import { SubmissionSchema } from '@/lib/schemas';
import { analyzeSubmission } from '@/lib/analysis/engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Received data for analysis:', JSON.stringify(body, null, 2));
    
    // Validate the submission
    const parseResult = SubmissionSchema.safeParse(body);
    
    if (!parseResult.success) {
      console.error('Validation errors:', parseResult.error.issues);
      return NextResponse.json(
        { 
          error: 'Validation failed for data:', 
          data: body,
          validationErrors: parseResult.error.issues,
          details: parseResult.error.issues 
        },
        { status: 400 }
      );
    }
    
    // Analyze the submission
    const result = analyzeSubmission(parseResult.data);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

