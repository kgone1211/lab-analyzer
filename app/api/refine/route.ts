import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI refinement not available - OpenAI API key not configured' },
        { status: 503 }
      );
    }
    
    const { analysisResult } = await request.json();
    
    if (!analysisResult) {
      return NextResponse.json(
        { error: 'Analysis result required' },
        { status: 400 }
      );
    }
    
    // Call OpenAI to refine the analysis into patient-friendly language
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a medical communication assistant. Convert technical lab result analysis into clear, patient-friendly language. Do not add new medical claims or advice. Simply rephrase the existing findings in an accessible way. Always remind users to consult their healthcare provider.'
          },
          {
            role: 'user',
            content: `Please convert this lab analysis into patient-friendly language:\n\n${JSON.stringify(analysisResult, null, 2)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });
    
    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }
    
    const data = await response.json();
    const refinedText = data.choices[0]?.message?.content || '';
    
    return NextResponse.json({ refinedText });
  } catch (error) {
    console.error('Refine error:', error);
    return NextResponse.json(
      { error: 'Failed to refine analysis' },
      { status: 500 }
    );
  }
}

