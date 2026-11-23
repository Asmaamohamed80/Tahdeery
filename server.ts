import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_EMAIL = 'lailafarag210@gmail.com';

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZipBuffer(entries: Array<{ name: string; data: Buffer }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name.replace(/\\/g, '/'), 'utf8');
    const uncompressed = entry.data;
    const compressed = zlib.deflateRawSync(uncompressed);
    const crc = crc32(uncompressed);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
    localHeader.writeUInt16LE(8, 8); // Deflate
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(uncompressed.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(uncompressed.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

function collectProjectFiles(rootDir: string, currentDir = rootDir): Array<{ name: string; data: Buffer }> {
  const excludedDirs = new Set(['node_modules', 'dist', 'build', '.git', 'coverage', '.aistudio']);
  const results: Array<{ name: string; data: Buffer }> = [];
  const items = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const item of items) {
    if (item.name.startsWith('.env') && item.name !== '.env.example') continue;
    if (item.name.endsWith('.log')) continue;

    const fullPath = path.join(currentDir, item.name);
    const relPath = path.relative(rootDir, fullPath);
    const normalizedRel = relPath.replace(/\\/g, '/');

    if (item.isDirectory()) {
      if (excludedDirs.has(item.name)) continue;
      if (normalizedRel === 'public/assets/aistudio') continue;
      results.push(...collectProjectFiles(rootDir, fullPath));
    } else if (item.isFile()) {
      results.push({ name: relPath, data: fs.readFileSync(fullPath) });
    }
  }
  return results;
}

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isTransientAiOverloadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error || '');
  return (
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('429')
  );
}

async function generateWithRetryAndFallback(
  ai: GoogleGenAI,
  params: {
    contents: unknown;
    config: Record<string, unknown>;
    preferFastThinking?: boolean;
  }
) {
  const attempts: Array<{ model: string; delayMs: number; useLowThinking: boolean }> = [
    { model: 'gemini-4-hydrogen', delayMs: 0, useLowThinking: Boolean(params.preferFastThinking) },
    { model: 'gemini-4-hydrogen', delayMs: 1200, useLowThinking: Boolean(params.preferFastThinking) },
    { model: 'gemini-3.1-flash-lite', delayMs: 800, useLowThinking: false },
  ];

  let lastError: unknown;
  for (const step of attempts) {
    if (step.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, step.delayMs));
    }
    try {
      const stepConfig = step.useLowThinking
        ? {
            ...params.config,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          }
        : params.config;

      return await ai.models.generateContent({
        model: step.model,
        contents: params.contents as Parameters<typeof ai.models.generateContent>[0]['contents'],
        config: stepConfig as Parameters<typeof ai.models.generateContent>[0]['config'],
      });
    } catch (err) {
      lastError = err;
      if (!isTransientAiOverloadError(err)) {
        throw err;
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/admin/export-zip', async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!idToken) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');
      const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
      const verifyResp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );

      if (!verifyResp.ok) {
        return res.status(401).json({ error: 'Invalid authentication token.' });
      }
      const verifyData = (await verifyResp.json()) as {
        users?: Array<{ email?: string; emailVerified?: boolean }>;
      };
      const account = verifyData.users?.[0];
      if (!account || !account.emailVerified || account.email !== ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Admin privileges required.' });
      }

      const files = collectProjectFiles(__dirname);
      const zipBuf = buildZipBuffer(files);

      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="tahdeery-linguacraft.zip"');
      return res.send(zipBuf);
    } catch (error) {
      console.error('Export ZIP error:', error);
      return res.status(500).json({ error: 'Failed to build project ZIP archive.' });
    }
  });

  app.post('/api/ai/certificate', async (req, res) => {
    try {
      const {
        studentName,
        grade,
        achievement,
        teacherName,
        theme,
        photoBase64,
        photoMimeType,
      } = req.body ?? {};

      if (!studentName || !achievement) {
        return res.status(400).json({ error: 'Student name and achievement are required.' });
      }

      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
        });
      }

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

      const response = await generateWithRetryAndFallback(ai, {
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

      const text = (response.text ?? '{}').trim();
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch (error) {
      console.error('AI certificate generation error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate AI certificate details.',
      });
    }
  });

  app.post('/api/ai/lesson-prep', async (req, res) => {
    try {
      const { gradeLabel, unitTitle, lessonTitle } = req.body ?? {};
      if (!lessonTitle) {
        return res.status(400).json({ error: 'Lesson title is required.' });
      }

      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
        });
      }

      const response = await generateWithRetryAndFallback(ai, {
        contents: `Create a structured, classroom-ready English Language electronic lesson preparation plan for an Egyptian/Arab school teacher.
Grade: ${gradeLabel || 'Primary 4'}
Unit: ${unitTitle || 'Unit 1'}
Lesson Topic: ${lessonTitle}

Keep each section practical, concise, and written in clear pedagogical English.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              objectives: { type: Type.STRING, description: '3 measurable learning objectives (By the end of the lesson, students will be able to...)' },
              warmUp: { type: Type.STRING, description: '5-minute engaging warm-up activity' },
              vocabulary: { type: Type.STRING, description: 'Key target vocabulary and structures' },
              procedures: { type: Type.STRING, description: 'Step-by-step presentation and practice stages' },
              assessment: { type: Type.STRING, description: 'Quick formative assessment / exit ticket questions' },
              homework: { type: Type.STRING, description: 'Meaningful homework task' },
            },
            required: ['objectives', 'warmUp', 'vocabulary', 'procedures', 'assessment', 'homework'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json(parsed);
    } catch (error) {
      console.error('AI lesson prep error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to draft lesson prep.',
      });
    }
  });

  app.post('/api/ai/extract-questions', async (req, res) => {
    try {
      const { pdfBase64, mimeType, rawText, gradeLabel, defaultUnit, maxQuestions } = req.body ?? {};
      const cleanRawText = typeof rawText === 'string' ? rawText : '';
      const cleanPdfBase64 = typeof pdfBase64 === 'string' ? pdfBase64 : '';

      if (!cleanPdfBase64 && !cleanRawText.trim()) {
        return res.status(400).json({ error: 'Please attach a PDF file or paste question text.' });
      }

      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Gemini API key is not configured on the server.',
        });
      }

      const limit = Math.min(40, Math.max(1, typeof maxQuestions === 'number' ? maxQuestions : 25));
      const fallbackUnit = typeof defaultUnit === 'string' && defaultUnit.trim() ? defaultUnit.trim() : 'General';
      const targetGrade = typeof gradeLabel === 'string' && gradeLabel.trim() ? gradeLabel.trim() : 'Primary 4';

      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];
      if (cleanPdfBase64) {
        parts.push({
          inlineData: {
            data: cleanPdfBase64,
            mimeType: typeof mimeType === 'string' && mimeType ? mimeType : 'application/pdf',
          },
        });
      }

      parts.push({
        text: `You are an expert English curriculum specialist for Egyptian & Arab K-12 schools.
Extract up to ${limit} multiple-choice questions from the provided ${cleanPdfBase64 ? 'PDF document' : 'text'} for grade "${targetGrade}" (default unit/topic: "${fallbackUnit}").

Rules:
1. Preserve the exact multiple-choice questions and options if they already exist in the document. If the source contains fill-in-the-blank, choose-the-correct-word, or grammar/vocabulary exercises without full options, convert them cleanly into 4-option MCQs.
2. Each question must have between 2 and 4 clear options (never empty strings).
3. Determine correctIndex (0-based integer) accurately using any answer key in the document or correct English grammar/meaning.
4. Keep unitLabel concise (e.g. "${fallbackUnit}" or the unit/lesson header from the file, max 80 chars).
5. Provide a short 1-sentence explanation for why the answer is correct.${cleanRawText.trim() ? `\n\nSource text:\n${cleanRawText.slice(0, 30000)}` : ''}`,
      });

      const responseSchema = {
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
      };

      const response = await generateWithRetryAndFallback(ai, {
        contents: { parts },
        preferFastThinking: true,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const parsed = JSON.parse((response.text ?? '{"questions":[]}').trim()) as {
        questions?: Array<{
          unitLabel?: string;
          prompt?: string;
          options?: string[];
          correctIndex?: number;
          explanation?: string;
        }>;
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
          const unitLabel = String(q.unitLabel || fallbackUnit).trim().slice(0, 100);
          const explanation = String(q.explanation || '').trim().slice(0, 500);
          return {
            unitLabel: unitLabel || fallbackUnit,
            prompt,
            options: cleanOptions,
            correctIndex,
            ...(explanation ? { explanation } : {}),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .slice(0, 40);

      return res.json({ questions: sanitized });
    } catch (error) {
      console.error('AI extract-questions error:', error);
      const raw = error instanceof Error ? error.message : String(error || '');
      if (raw.includes('503') || raw.includes('UNAVAILABLE') || raw.includes('high demand')) {
        return res.status(503).json({
          error:
            'الذكاء الاصطناعي عليه ضغط مؤقت الآن، يرجى المحاولة مرة أخرى بعد لحظات (أو لصق الأسئلة نصياً).',
        });
      }
      if (raw.includes('400') || raw.includes('INVALID_ARGUMENT')) {
        return res.status(400).json({
          error:
            'تعذر قراءة هذا الملف مباشرة (قد يكون حجمه أو عدد صفحاته كبيراً). انسخي منه ٢٠–٣٠ سؤالاً والصقيهم في المربع بالأسفل.',
        });
      }
      return res.status(500).json({
        error: raw || 'Failed to extract questions from PDF/text.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
