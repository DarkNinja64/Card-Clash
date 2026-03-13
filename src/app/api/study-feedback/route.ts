import { NextResponse } from 'next/server';

function buildPrompt(input: {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
}) {
  const correctness = input.isCorrect ? 'correct' : 'incorrect';
  return (
    'You are a concise, encouraging tutor. The student answered a multiple-choice question.\n' +
    `Question: ${input.question}\n` +
    `Student answer: ${input.userAnswer || '(no answer)'}\n` +
    `Correct answer: ${input.correctAnswer}\n` +
    `The student was ${correctness}. Provide a short explanation and one quick tip.`
  );
}

function extractText(response: any): string {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  return parts.map((part: any) => part?.text).filter(Boolean).join('\n').trim();
}

export async function POST(req: Request) {
  const body = await req.json();
  const { question, correctAnswer, userAnswer, isCorrect } = body || {};

  if (!question || !correctAnswer) {
    return NextResponse.json({ feedback: 'Missing question data.' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const fallback = isCorrect
      ? 'Nice work. Keep noticing key words that point to the right concept.'
      : 'Not quite. Re-read the question and focus on the core concept, then try again.';
    return NextResponse.json({ feedback: fallback });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const prompt = buildPrompt({ question, correctAnswer, userAnswer, isCorrect });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    return NextResponse.json({ feedback: 'AI feedback unavailable right now.' }, { status: 200 });
  }

  const data = await response.json();
  const feedback = extractText(data) || 'AI feedback unavailable right now.';
  return NextResponse.json({ feedback });
}
