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
    const studentName = typeof body.studentName === 'string' ? body.studentName : '';
    const grade = typeof body.grade === 'string' ? body.grade : '';
    const achievement = typeof body.achievement === 'string' ? body.achievement : '';
    const teacherName = typeof body.teacherName === 'string' ? body.teacherName : '';
    const theme = typeof body.theme === 'string' ? body.theme : '';
    const photoBase64 = typeof body.photoBase64 === 'string' ? body.photoBase64 : '';
    const photoMimeType = typeof body.photoMimeType === 'string' ? body.photoMimeType : '';

    if (!studentName || !achievement) {
      return res.status(400).json({ error: 'Student name and achievement are required.' });
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
    if (photoBase64 && photoMimeType) {
      parts.push({
        inlineData: {
          data: photoBase64,
          mimeType: photoMimeType,
        },
      });
    }

    parts.push({
      text: `You are an experienced English Language Academic Director crafting a formal, warm, and inspiring Appreciation Certificate for a student.
Student Name: ${studentName}
Grade Level: ${grade || 'English Learner'}
Achievement: ${achievement}
Teacher / School: ${teacherName || 'LinguaCraft Academy'}
Certificate Theme: ${theme || 'Royal Sapphire'}
${photoBase64 ? 'A portrait photo of the student is attached. Briefly note how to crop/frame it warmly (e.g. centered head-and-shoulders oval frame) and tailor the tone positively.' : 'No photo attached yet.'}

Return a JSON object with:
- honorTitle: Short prestigious English title (3-6 words, e.g. "Certificate of Outstanding English Excellence")
- citationEn: Inspiring 2-sentence English certificate body mentioning the student's name and achievement naturally.
- citationAr: Natural, warm Arabic translation of the citation.
- portraitFramingNote: Short helpful tip (1 sentence) for how the student photo integrates into the certificate seal frame.
- badgeMotto: Short 2-4 word English motto (e.g. "Fluency & Bright Minds").`,
    });

    const attempts = [
      { model: 'gemini-4-hydrogen', delayMs: 0 },
      { model: 'gemini-3.1-flash-lite', delayMs: 600 },
      { model: 'gemini-4-hydrogen', delayMs: 1400 },
    ];

    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | undefined;
    let lastError: unknown;
    for (const step of attempts) {
      if (step.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, step.delayMs));
      }
      try {
        response = await ai.models.generateContent({
          model: step.model,
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                honorTitle: { type: Type.STRING },
                citationEn: { type: Type.STRING },
                citationAr: { type: Type.STRING },
                portraitFramingNote: { type: Type.STRING },
                badgeMotto: { type: Type.STRING },
              },
              required: ['honorTitle', 'citationEn', 'citationAr', 'portraitFramingNote', 'badgeMotto'],
            },
          },
        });
        break;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err || '');
        const transient =
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('high demand') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('404') ||
          msg.includes('NOT_FOUND');
        if (!transient) throw err;
      }
    }

    if (!response) {
      throw lastError;
    }

    const parsed = JSON.parse((response.text ?? '{}').trim());
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Vercel AI certificate error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate AI certificate.',
    });
  }
}
