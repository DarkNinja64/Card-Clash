import { NextResponse } from 'next/server';

type FeedbackPayload = {
  feedback: string;
  preloaded?: {
    correct: string;
    incorrect: string;
  };
};

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

function buildPreloadPrompt(input: {
  question: string;
  correctAnswer: string;
}) {
  return (
    'You are a concise, encouraging tutor. Return strict JSON only.\n' +
    'The JSON must have exactly two string fields: "correct" and "incorrect".\n' +
    '"correct" should be a short explanation plus one quick tip for when the student answered correctly.\n' +
    '"incorrect" should be a short explanation plus one quick tip for when the student answered incorrectly.\n' +
    `Question: ${input.question}\n` +
    `Correct answer: ${input.correctAnswer}\n`
  );
}

function extractText(response: any): string {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  return parts.map((part: any) => part?.text).filter(Boolean).join('\n').trim();
}

function parsePreloadedFeedback(text: string): { correct: string; incorrect: string } | null {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed?.correct === 'string' && typeof parsed?.incorrect === 'string') {
      return {
        correct: parsed.correct.trim(),
        incorrect: parsed.incorrect.trim(),
      };
    }
  } catch {}
  return null;
}

async function fetchGeminiText(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
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
    return null;
  }

  const data = await response.json();
  return extractText(data) || null;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { question, correctAnswer, userAnswer, isCorrect, preload } = body || {};

  if (!question || !correctAnswer) {
    return NextResponse.json({ feedback: 'Missing question data.' }, { status: 400 });
  }

  if (preload) {
    const fallback = {
      correct: 'Nice work. Keep noticing key words that point to the right concept.',
      incorrect: 'Not quite. Re-read the question and focus on the core concept, then try again.'
    };

    const text = await fetchGeminiText(
      buildPreloadPrompt({
        question,
        correctAnswer
      })
    );

    const preloaded = text ? parsePreloadedFeedback(text) : null;
    const payload: FeedbackPayload = {
      feedback: '',
      preloaded: preloaded || fallback
    };
    return NextResponse.json(payload);
  }

  const text = await fetchGeminiText(
    buildPrompt({
      question,
      correctAnswer,
      userAnswer,
      isCorrect
    })
  );

  if (!text) {
    const fallback = isCorrect
      ? 'Nice work. Keep noticing key words that point to the right concept.'
      : 'Not quite. Re-read the question and focus on the core concept, then try again.';
    return NextResponse.json({ feedback: fallback }, { status: 200 });
  }

  const feedback = text || 'AI feedback unavailable right now.';
  return NextResponse.json({ feedback });
}
