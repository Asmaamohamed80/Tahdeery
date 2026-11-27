import { PDFDocument } from 'pdf-lib';

export interface PdfChunkPayload {
  label: string;
  base64: string;
  pageStart: number;
  pageEnd: number;
}

export interface ExtractedMcqDraft {
  unitLabel: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

function uint8ToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const sub = bytes.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode(...sub);
  }
  return btoa(binary);
}

/**
 * Splits any PDF (small or large) into Vercel-safe base64 sub-PDFs (~1.5MB max raw per chunk)
 * so teachers/admins never have to split large question bank PDFs manually.
 */
export async function splitPdfIntoBase64Chunks(
  file: File,
  maxRawBytes = 1.5 * 1024 * 1024
): Promise<{
  totalPages: number;
  chunks: PdfChunkPayload[];
  skippedOversizedPages: number[];
}> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Fast path for small PDFs
  if (bytes.length <= maxRawBytes) {
    let totalPages = 1;
    try {
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      totalPages = Math.max(1, doc.getPageCount());
    } catch {
      // keep 1 if encrypted/non-standard header
    }
    return {
      totalPages,
      chunks: [
        {
          label: `1–${totalPages}`,
          base64: uint8ToBase64(bytes),
          pageStart: 1,
          pageEnd: totalPages,
        },
      ],
      skippedOversizedPages: [],
    };
  }

  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const chunks: PdfChunkPayload[] = [];
  const skippedOversizedPages: number[] = [];

  // Target up to 4 pages per chunk so each AI call runs quickly (<10s) and stays under payload caps
  const MAX_PAGES_PER_CHUNK = 4;
  let cursor = 0;

  while (cursor < totalPages) {
    let batchCount = Math.min(MAX_PAGES_PER_CHUNK, totalPages - cursor);
    let builtBytes: Uint8Array | null = null;

    while (batchCount >= 1) {
      const subDoc = await PDFDocument.create();
      const indices = Array.from({ length: batchCount }, (_, i) => cursor + i);
      const copiedPages = await subDoc.copyPages(srcDoc, indices);
      copiedPages.forEach((page) => subDoc.addPage(page));
      const candidate = await subDoc.save();

      if (candidate.length <= maxRawBytes) {
        builtBytes = candidate;
        break;
      }
      batchCount -= 1;
    }

    if (!builtBytes) {
      // Even 1 page exceeded maxRawBytes; try slightly higher hard cap (2.6MB raw ~ 3.5MB base64)
      const singleDoc = await PDFDocument.create();
      const [singlePage] = await singleDoc.copyPages(srcDoc, [cursor]);
      singleDoc.addPage(singlePage);
      const singleBytes = await singleDoc.save();
      if (singleBytes.length <= 2.6 * 1024 * 1024) {
        chunks.push({
          label: `${cursor + 1}`,
          base64: uint8ToBase64(singleBytes),
          pageStart: cursor + 1,
          pageEnd: cursor + 1,
        });
      } else {
        skippedOversizedPages.push(cursor + 1);
      }
      cursor += 1;
    } else {
      const startPage = cursor + 1;
      const endPage = cursor + batchCount;
      chunks.push({
        label: startPage === endPage ? `${startPage}` : `${startPage}–${endPage}`,
        base64: uint8ToBase64(builtBytes),
        pageStart: startPage,
        pageEnd: endPage,
      });
      cursor += batchCount;
    }
  }

  return { totalPages, chunks, skippedOversizedPages };
}

/**
 * Splits large pasted text into clean line-aligned chunks so extraction stays fast and within request limits.
 */
export function chunkRawText(rawText: string, maxChars = 10000): string[] {
  const clean = rawText.trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  const lines = clean.split(/\r?\n/);
  const chunks: string[] = [];
  let current = '';

  for (const line of lines) {
    if (current.length + line.length + 1 > maxChars && current.trim().length > 0) {
      chunks.push(current.trim());
      current = '';
    }
    if (line.length > maxChars) {
      for (let i = 0; i < line.length; i += maxChars) {
        chunks.push(line.slice(i, i + maxChars));
      }
    } else {
      current += (current ? '\n' : '') + line;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }
  return chunks;
}

/**
 * Instant local parser for JSON arrays or structured MCQ text (numbered questions + A/B/C/D options + optional Answer line).
 * Works completely offline without requiring AI capacity.
 */
export function parseStructuredMcqsLocally(
  rawText: string,
  defaultUnit = 'General'
): ExtractedMcqDraft[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // 1) JSON array / object support
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const arr = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { questions?: unknown[] })?.questions)
        ? (parsed as { questions: unknown[] }).questions
        : [];
      const fromJson = arr
        .map((item): ExtractedMcqDraft | null => {
          if (!item || typeof item !== 'object') return null;
          const rec = item as Record<string, unknown>;
          const prompt = String(rec.prompt || rec.question || '').trim().slice(0, 600);
          const rawOpts = Array.isArray(rec.options) ? rec.options : [];
          const options = rawOpts.map((o) => String(o || '').trim().slice(0, 200)).filter(Boolean).slice(0, 4);
          if (prompt.length < 3 || options.length < 2) return null;
          const idx = typeof rec.correctIndex === 'number' ? Math.round(rec.correctIndex) : 0;
          const explanation = typeof rec.explanation === 'string' ? rec.explanation.trim().slice(0, 500) : '';
          return {
            unitLabel: String(rec.unitLabel || defaultUnit).trim().slice(0, 100) || defaultUnit,
            prompt,
            options,
            correctIndex: Math.max(0, Math.min(options.length - 1, idx)),
            ...(explanation ? { explanation } : {}),
          };
        })
        .filter((x): x is ExtractedMcqDraft => x !== null);
      if (fromJson.length > 0) return fromJson;
    } catch {
      // fall through to text parser
    }
  }

  // 2) Structured text MCQ parser
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const results: ExtractedMcqDraft[] = [];
  let activeUnit = defaultUnit || 'General';
  let currentPrompt = '';
  let currentOptions: string[] = [];
  let explicitAnswerIdx: number | null = null;

  const letterToIdx = (ch: string): number => {
    const upper = ch.toUpperCase();
    if (upper === 'A' || ch === 'أ') return 0;
    if (upper === 'B' || ch === 'ب') return 1;
    if (upper === 'C' || ch === 'ج') return 2;
    if (upper === 'D' || ch === 'د') return 3;
    const num = Number(ch);
    if (!Number.isNaN(num) && num >= 1 && num <= 4) return num - 1;
    return -1;
  };

  const flushCurrent = () => {
    if (currentPrompt.length >= 3 && currentOptions.length >= 2) {
      const cleanOpts = currentOptions.slice(0, 4).map((o) => o.slice(0, 200));
      const idx =
        explicitAnswerIdx !== null
          ? Math.max(0, Math.min(cleanOpts.length - 1, explicitAnswerIdx))
          : 0;
      results.push({
        unitLabel: activeUnit.slice(0, 100) || 'General',
        prompt: currentPrompt.slice(0, 600),
        options: cleanOpts,
        correctIndex: idx,
      });
    }
    currentPrompt = '';
    currentOptions = [];
    explicitAnswerIdx = null;
  };

  const inlineOptsRegex =
    /(?:^|\s)([A-Da-d])\s*[).:\-]\s*([^A-Da-d\n]+?)(?=\s+[A-Da-d]\s*[).:\-]|$)/g;

  for (const line of lines) {
    // Unit header detection
    if (/^(Unit|Lesson|Topic|Module|Chapter)\s+\d+/i.test(line) && line.length <= 80 && !/[?؟]/.test(line)) {
      flushCurrent();
      activeUnit = line;
      continue;
    }

    // Explicit Answer line
    const ansMatch = line.match(/^(?:Answer|Ans|Correct|الإجابة|الحل)\s*[:\-]?\s*([A-Da-d1-4])/i);
    if (ansMatch) {
      const idx = letterToIdx(ansMatch[1]);
      if (idx >= 0) explicitAnswerIdx = idx;
      continue;
    }

    // Question line: "1. ...", "1) ...", "Q1: ...", or ending with '?' when no options yet
    const qMatch = line.match(/^(?:Q\s*)?(\d+)\s*[).:\-]\s+(.+)$/i);
    if (qMatch) {
      flushCurrent();
      let qBody = qMatch[2].trim();
      // Check if options are inline on the same line: "1. She ___ here. a) go b) goes c) going d) went"
      const firstInline = qBody.search(/\s+[A-Da-d]\s*[).:\-]\s+/);
      if (firstInline > 4) {
        const optPart = qBody.slice(firstInline).trim();
        qBody = qBody.slice(0, firstInline).trim();
        let m: RegExpExecArray | null;
        inlineOptsRegex.lastIndex = 0;
        while ((m = inlineOptsRegex.exec(optPart)) !== null) {
          let optText = m[2].trim();
          if (optText.endsWith('*') || optText.includes('✓')) {
            explicitAnswerIdx = currentOptions.length;
            optText = optText.replace(/[*✓]/g, '').trim();
          }
          if (optText) currentOptions.push(optText);
        }
      }
      currentPrompt = qBody;
      continue;
    }

    // Single option line: "a) ...", "A. ...", "- option"
    const optMatch = line.match(/^([A-Da-d])\s*[).:\-]\s+(.+)$/);
    if (optMatch && currentPrompt) {
      let optText = optMatch[2].trim();
      if (optText.startsWith('*') || optText.endsWith('*') || optText.includes('✓')) {
        explicitAnswerIdx = currentOptions.length;
        optText = optText.replace(/[*✓]/g, '').trim();
      }
      if (optText) currentOptions.push(optText);
      continue;
    }

    // Multi-inline options line: "a) play   b) plays   c) played   d) playing"
    if (currentPrompt && /^[A-Da-d]\s*[).:\-]/.test(line)) {
      let m: RegExpExecArray | null;
      inlineOptsRegex.lastIndex = 0;
      const extracted: string[] = [];
      while ((m = inlineOptsRegex.exec(line)) !== null) {
        let optText = m[2].trim();
        if (optText.endsWith('*') || optText.includes('✓')) {
          explicitAnswerIdx = currentOptions.length + extracted.length;
          optText = optText.replace(/[*✓]/g, '').trim();
        }
        if (optText) extracted.push(optText);
      }
      if (extracted.length >= 2) {
        currentOptions.push(...extracted);
        continue;
      }
    }

    // Continuation of prompt if options haven't started yet
    if (currentPrompt && currentOptions.length === 0) {
      currentPrompt = `${currentPrompt} ${line}`.trim();
    }
  }

  flushCurrent();
  return results;
}
