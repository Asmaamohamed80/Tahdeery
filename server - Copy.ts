import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

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
  const excludedDirs = new Set(['node_modules', 'dist', 'build', '.git', 'coverage']);
  const results: Array<{ name: string; data: Buffer }> = [];
  const items = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const item of items) {
    if (item.name.startsWith('.env') && item.name !== '.env.example') continue;
    if (item.name.endsWith('.log')) continue;

    const fullPath = path.join(currentDir, item.name);
    const relPath = path.relative(rootDir, fullPath);

    if (item.isDirectory()) {
      if (excludedDirs.has(item.name)) continue;
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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '6mb' }));

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

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
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

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
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
