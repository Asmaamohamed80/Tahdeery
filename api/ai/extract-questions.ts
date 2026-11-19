import { GoogleGenAI, Type } from '@google/genai';

interface Req {
  method?: string;
  body?: Record<string, unknown>;
}

interface Res {
  status: (code: number) => { json: (data: unknown) => void };
}

interface ExtractedQuestion {
  unitLabel: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body ?? {};
    const pdfBase64 = typeof body.pdfBase64 === 'string' ? body.pdfBase64 : '';
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'application/pdf';
    const rawText = typeof body.rawText === 'string' ? body.rawText : '';
    const gradeLabel = typeof body.gradeLabel === 'string' ? body.gradeLabel : 'Primary 4';
    const defaultUnit = typeof body.defaultUnit === 'string' ? body.defaultUnit : 'General';
    const maxQuestions = Math.min(
      40,
      Math.max(1, typeof body.maxQuestions === 'number' ? body.maxQuestions : 25)
    );

    if (!pdfBase64 && !rawText.trim()) {
      return res.status(400).json({ error: 'Please attach a PDF file or paste question text.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(503).json({
        error: 'Gemini API key is not configured in Vercel Environment Variables.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];
    if (pdfBase64) {
      parts.push({
        inlineData: {
          data: pdfBase64,
          mimeType: mimeType || 'application/pdf',
        },
      });
    }

    parts.push({
      text: `You are an expert English curriculum specialist for Egyptian & Arab K-12 schools.
Extract up to ${maxQuestions} multiple-choice questions from the provided ${pdfBase64 ? 'PDF document' : 'text'} for grade "${gradeLabel}" (default unit/topic: "${defaultUnit}").

Rules:
1. Preserve the exact multiple-choice questions and options if they already exist in the document. If the source contains fill-in-the-blank, choose-the-correct-word, or grammar/vocabulary exercises without full options, convert them cleanly into 4-option MCQs.
2. Each question must have between 2 and 4 clear options (never empty strings).
3. Determine correctIndex (0-based integer) accurately using any answer key in the document or correct English grammar/meaning.
4. Keep unitLabel concise (e.g. "${defaultUnit}" or the unit/lesson header from the file, max 80 chars).
5. Provide a short 1-sentence explanation for why the answer is correct.${rawText.trim() ? `\n\nSource text:\n${rawText.slice(0, 30000)}` : ''}`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  unitLabel: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['unitLabel', 'prompt', 'options', 'correctIndex'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{"questions":[]}').trim()) as {
      questions?: ExtractedQuestion[];
    };

    const sanitized = (Array.isArray(parsed.questions) ? parsed.questions : [])
      .map((q) => {
        const cleanOptions = (Array.isArray(q.options) ? q.options : [])
          .map((o) => String(o || '').trim().slice(0, 200))
          .filter(Boolean)
          .slice(0, 4);
        const prompt = String(q.prompt || '').trim().slice(0, 600);
        if (prompt.length < 3 || cleanOptions.length < 2) return null;
        const rawIdx = typeof q.correctIndex === 'number' ? Math.round(q.correctIndex) : 0;
        const correctIndex = Math.max(0, Math.min(cleanOptions.length - 1, rawIdx));
        const unitLabel = String(q.unitLabel || defaultUnit || 'General')
          .trim()
          .slice(0, 100);
        const explanation = String(q.explanation || '').trim().slice(0, 500);
        return {
          unitLabel: unitLabel || defaultUnit || 'General',
          prompt,
          options: cleanOptions,
          correctIndex,
          ...(explanation ? { explanation } : {}),
        };
      })
      .filter((item): item is ExtractedQuestion => item !== null)
      .slice(0, 40);

    return res.status(200).json({ questions: sanitized });
  } catch (error) {
    console.error('Vercel AI extract-questions error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to extract questions from PDF/text.',
    });
  }
}
