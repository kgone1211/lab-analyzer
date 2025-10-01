import { NextRequest, NextResponse } from 'next/server';
import { SubmissionSchema } from '@/lib/schemas';
import { analyzeSubmission } from '@/lib/analysis/engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the submission
    const parseResult = SubmissionSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: parseResult.error.errors 
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

