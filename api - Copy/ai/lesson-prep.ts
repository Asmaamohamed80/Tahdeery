import { GoogleGenAI, Type } from '@google/genai';

interface Req {
  method?: string;
  body?: Record<string, unknown>;
}

interface Res {
  status: (code: number) => { json: (data: unknown) => void };
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body ?? {};
    const gradeLabel = typeof body.gradeLabel === 'string' ? body.gradeLabel : 'Primary 4';
    const unitTitle = typeof body.unitTitle === 'string' ? body.unitTitle : 'Unit 1';
    const lessonTitle = typeof body.lessonTitle === 'string' ? body.lessonTitle : '';

    if (!lessonTitle) {
      return res.status(400).json({ error: 'Lesson title is required.' });
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

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Create a structured, classroom-ready English Language electronic lesson preparation plan for an Egyptian/Arab school teacher.
Grade: ${gradeLabel}
Unit: ${unitTitle}
Lesson Topic: ${lessonTitle}

Keep each section practical, concise, and written in clear pedagogical English.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            objectives: { type: Type.STRING },
            warmUp: { type: Type.STRING },
            vocabulary: { type: Type.STRING },
            procedures: { type: Type.STRING },
            assessment: { type: Type.STRING },
            homework: { type: Type.STRING },
          },
          required: ['objectives', 'warmUp', 'vocabulary', 'procedures', 'assessment', 'homework'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Vercel AI lesson prep error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to draft lesson prep.',
    });
  }
}
