import { NextResponse } from 'next/server';

type FeedbackPayload = {
  feedback: string;
  preloaded?: {
    correct: string;
    incorrect: string;
  };
};

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function questionSnippet(question: string) {
  const cleaned = normalizeWhitespace(question);
  return cleaned.length > 120 ? `${cleaned.slice(0, 117)}...` : cleaned;
}

function buildFallbackFeedback(input: {
  question: string;
  correctAnswer: string;
  userAnswer?: string;
  isCorrect: boolean;
}) {
  const snippet = questionSnippet(input.question);
  if (input.isCorrect) {
    return `On the question "${snippet}", you chose ${input.correctAnswer}, and that’s right. What I want you to notice is why that answer fits the question: it matches the main idea the question was testing. As you study, try to name the clue in the question that led you to ${input.correctAnswer}, because that will help you solve similar problems on your own next time.`;
  }

  const studentAnswer = input.userAnswer?.trim() || 'your answer';
  return `On the question "${snippet}", the better answer was ${input.correctAnswer}, not ${studentAnswer}. The key thing to learn here is why ${input.correctAnswer} matches what the question is asking. When you review this one, slow down and ask yourself what idea or rule the question is really testing, then check which answer actually fits that idea best.`;
}

function buildPrompt(input: {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
}) {
  const correctness = input.isCorrect ? 'correct' : 'incorrect';
  return (
    'You are a teacher giving short, helpful feedback to a student after a question.\n' +
    'Write 3-5 sentences.\n' +
    'Sound like a real teacher: clear, calm, and supportive.\n' +
    'Do not sound robotic, overly excited, or generic.\n' +
    'Be specific to this exact question.\n' +
    'Reference the question topic or wording naturally.\n' +
    'Explain why the correct answer fits.\n' +
    'If the student was wrong, briefly explain what they should notice or think about next time.\n' +
    'Focus on helping the student learn, not just praising or correcting them.\n' +
    `Question: ${input.question}\n` +
    `Student answer: ${input.userAnswer || '(no answer)'}\n` +
    `Correct answer: ${input.correctAnswer}\n` +
    `The student was ${correctness}.`
  );
}

function buildPreloadPrompt(input: {
  question: string;
  correctAnswer: string;
}) {
  return (
    'You are a teacher giving short, helpful feedback to a student. Return strict JSON only.\n' +
    'The JSON must have exactly two string fields: "correct" and "incorrect".\n' +
    'Each field must be 3-5 sentences.\n' +
    'Each field must sound like a real teacher, not an AI assistant.\n' +
    'Each field must be specific to this exact question.\n' +
    '"correct" should explain why the correct answer fits this question and reinforce the idea the student should remember.\n' +
    '"incorrect" should explain why the correct answer fits this question and guide the student toward the thinking they should use next time.\n' +
    'Both responses must mention the question topic or wording naturally.\n' +
    'Do not use phrases like "great job", "nice work", "quick tip", or anything that sounds generic.\n' +
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

  const fencedJsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedJsonMatch?.[1]) {
    try {
      const parsed = JSON.parse(fencedJsonMatch[1]);
      if (typeof parsed?.correct === 'string' && typeof parsed?.incorrect === 'string') {
        return {
          correct: parsed.correct.trim(),
          incorrect: parsed.incorrect.trim(),
        };
      }
    } catch {}
  }

  const correctMatch = text.match(/"correct"\s*:\s*"([\s\S]*?)"/i);
  const incorrectMatch = text.match(/"incorrect"\s*:\s*"([\s\S]*?)"/i);
  if (correctMatch?.[1] && incorrectMatch?.[1]) {
    return {
      correct: correctMatch[1].replace(/\\"/g, '"').trim(),
      incorrect: incorrectMatch[1].replace(/\\"/g, '"').trim(),
    };
  }

  return null;
}

async function fetchGeminiText(
  prompt: string,
  options?: {
    responseMimeType?: string;
    responseSchema?: Record<string, unknown>;
  }
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('[study-feedback] Gemini skipped: missing GEMINI_API_KEY');
    return null;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
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
        ],
        generationConfig: {
          temperature: 0.4,
          ...(options?.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
          ...(options?.responseSchema ? { responseSchema: options.responseSchema } : {}),
        },
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`[study-feedback] Gemini request failed (${response.status}): ${errorText.slice(0, 300)}`);
    return null;
  }

  const data = await response.json();
  const text = extractText(data) || null;
  if (!text) {
    console.warn('[study-feedback] Gemini returned no text content');
  } else {
    console.log(`[study-feedback] Gemini response received (${text.length} chars)`);
  }
  return text;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { question, correctAnswer, userAnswer, isCorrect, preload } = body || {};

  if (!question || !correctAnswer) {
    return NextResponse.json({ feedback: 'Missing question data.' }, { status: 400 });
  }

  if (preload) {
    const fallback = {
      correct: buildFallbackFeedback({
        question,
        correctAnswer,
        isCorrect: true,
      }),
      incorrect: buildFallbackFeedback({
        question,
        correctAnswer,
        isCorrect: false,
      })
    };

    const text = await fetchGeminiText(
      buildPreloadPrompt({
        question,
        correctAnswer
      }),
      {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            correct: { type: 'string' },
            incorrect: { type: 'string' },
          },
          required: ['correct', 'incorrect'],
        },
      }
    );

    const preloaded = text ? parsePreloadedFeedback(text) : null;
    if (text && !preloaded) {
      console.warn(`[study-feedback] Preload parse failed. Raw Gemini text: ${text.slice(0, 500)}`);
    }
    const payload: FeedbackPayload = {
      feedback: '',
      preloaded: preloaded || fallback
    };
    console.log(`[study-feedback] Preload mode using ${preloaded ? 'Gemini' : 'fallback'} feedback`);
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
    const fallback = buildFallbackFeedback({
      question,
      correctAnswer,
      userAnswer,
      isCorrect,
    });
    console.log('[study-feedback] Answer mode using fallback feedback');
    return NextResponse.json({ feedback: fallback }, { status: 200 });
  }

  console.log('[study-feedback] Answer mode using Gemini feedback');
  const feedback = text || 'AI feedback unavailable right now.';
  return NextResponse.json({ feedback });
}
