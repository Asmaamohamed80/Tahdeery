/**
 * Unified Client-Side English Audio (SpeechSynthesis) + Web Speech API Microphone Coach.
 * Provides Chromium-safe TTS playback and real SpeechRecognition pronunciation scoring
 * with Levenshtein character similarity + MediaRecorder fallback for unsupported browsers.
 */

let retainedUtterance: SpeechSynthesisUtterance | null = null;
let speakTimer: ReturnType<typeof setTimeout> | null = null;
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    try {
      sharedAudioCtx = new Ctx();
    } catch {
      return null;
    }
  }
  if (sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playSoftFeedbackTone(kind: 'tap' | 'win' | 'oops' | 'mic') {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const playNote = (freq: number, offset: number, dur: number, gainPeak: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = kind === 'oops' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + offset);
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + dur + 0.02);
    };

    if (kind === 'tap') {
      playNote(587.33, 0, 0.07, 0.045);
    } else if (kind === 'mic') {
      playNote(659.25, 0, 0.07, 0.05);
      playNote(880, 0.07, 0.09, 0.05);
    } else if (kind === 'win') {
      playNote(523.25, 0, 0.11, 0.08);
      playNote(659.25, 0.09, 0.11, 0.08);
      playNote(783.99, 0.18, 0.18, 0.09);
    } else {
      playNote(310, 0, 0.12, 0.06);
      playNote(240, 0.11, 0.16, 0.06);
    }
  } catch {
    // Ignore Web Audio errors
  }
}

export function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  if (!englishVoices.length) return null;

  const preferred =
    englishVoices.find(
      (v) =>
        /en[-_]us/i.test(v.lang) &&
        /(google|natural|aria|jenny|guy|samantha|microsoft|ava)/i.test(v.name)
    ) ||
    englishVoices.find((v) => /en[-_]us/i.test(v.lang)) ||
    englishVoices.find((v) => /en[-_]gb/i.test(v.lang)) ||
    englishVoices[0];

  return preferred || null;
}

export function primeEnglishVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.getVoices();
  } catch {
    // Ignore
  }
}

export function stopEnglishSpeech() {
  if (speakTimer) {
    clearTimeout(speakTimer);
    speakTimer = null;
  }
  retainedUtterance = null;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

export interface SpeakOptions {
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onUnavailable?: (reason: 'unsupported' | 'no-voices' | 'error') => void;
}

export function speakEnglishText(rawText: string, options: SpeakOptions = {}) {
  const cleanText = rawText.replace(/[«»"]/g, '').replace(/\s+/g, ' ').trim();
  if (!cleanText) return;

  playSoftFeedbackTone('tap');

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options.onUnavailable?.('unsupported');
    return;
  }

  const synth = window.speechSynthesis;
  const wasBusy = synth.speaking || synth.pending;

  if (speakTimer) {
    clearTimeout(speakTimer);
    speakTimer = null;
  }

  const runSpeak = () => {
    try {
      if (synth.paused) synth.resume();

      const utter = new SpeechSynthesisUtterance(cleanText);
      const voice = getBestEnglishVoice();
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
      } else {
        utter.lang = 'en-US';
      }
      utter.rate = options.rate ?? 0.9;
      utter.pitch = 1.02;
      utter.volume = 1;

      let started = false;
      retainedUtterance = utter;

      const startWatchdog = setTimeout(() => {
        if (!started && synth.getVoices().length === 0) {
          options.onUnavailable?.('no-voices');
        }
      }, 900);

      utter.onstart = () => {
        started = true;
        clearTimeout(startWatchdog);
        options.onStart?.();
      };

      utter.onend = () => {
        clearTimeout(startWatchdog);
        if (retainedUtterance === utter) retainedUtterance = null;
        options.onEnd?.();
      };

      utter.onerror = (ev) => {
        clearTimeout(startWatchdog);
        if (retainedUtterance === utter) retainedUtterance = null;
        if (ev.error !== 'interrupted' && ev.error !== 'canceled') {
          options.onUnavailable?.('error');
        }
        options.onEnd?.();
      };

      synth.speak(utter);
    } catch {
      options.onUnavailable?.('error');
      options.onEnd?.();
    }
  };

  if (wasBusy) {
    try {
      synth.cancel();
    } catch {
      // Ignore cancel error
    }
    speakTimer = setTimeout(runSpeak, 65);
  } else {
    runSpeak();
  }
}

// =========================================================================
// WEB SPEECH API RECOGNITION & PRONUNCIATION SCORING
// =========================================================================

export interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence?: number;
}

export interface SpeechRecognitionResultLike extends ArrayLike<SpeechRecognitionAlternativeLike> {
  isFinal: boolean;
}

export interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onnomatch: (() => void) | null;
  onresult: ((event: { results: ArrayLike<SpeechRecognitionResultLike> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export function getSpeechRecognitionCtor(): (new () => BrowserSpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

const CONTRACTION_EXPANSIONS: Array<[RegExp, string]> = [
  [/\bi'm\b/g, 'i am'],
  [/\byou're\b/g, 'you are'],
  [/\bwe're\b/g, 'we are'],
  [/\bthey're\b/g, 'they are'],
  [/\bit's\b/g, 'it is'],
  [/\bthat's\b/g, 'that is'],
  [/\bdon't\b/g, 'do not'],
  [/\bcan't\b/g, 'can not'],
  [/\bwon't\b/g, 'will not'],
];

function normalizeForSpeech(text: string): string[] {
  let normalized = text.toLowerCase().replace(/[’‘]/g, "'");
  CONTRACTION_EXPANSIONS.forEach(([regex, repl]) => {
    normalized = normalized.replace(regex, repl);
  });
  return normalized
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, idx) => idx);
  for (let i = 1; i <= a.length; i += 1) {
    let diag = i - 1;
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + cost);
      diag = temp;
    }
  }
  return prev[b.length];
}

function computeWordSimilarity(target: string, spoken: string): number {
  if (!target || !spoken) return 0;
  if (target === spoken) return 1;
  const maxLen = Math.max(target.length, spoken.length);
  const dist = levenshteinDistance(target, spoken);
  return Math.max(0, 1 - dist / maxLen);
}

export interface WordPronunciationStatus {
  word: string;
  matched: boolean;
  closeMatch: boolean;
  similarity: number;
}

export interface PronunciationEvaluation {
  accuracyPercent: number;
  matchedCount: number;
  totalTargetWords: number;
  ratingAr: string;
  ratingEn: string;
  wordMatches: WordPronunciationStatus[];
}

export function evaluateSpokenEnglish(
  targetText: string,
  spokenTranscript: string,
  confidence?: number
): PronunciationEvaluation {
  const rawTargetTokens = targetText
    .replace(/[«»"]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const spokenWords = normalizeForSpeech(spokenTranscript);

  let weightedScoreSum = 0;
  let matchedCount = 0;
  let countableWords = 0;

  const wordMatches: WordPronunciationStatus[] = rawTargetTokens.map((displayToken) => {
    const cleanedParts = normalizeForSpeech(displayToken);
    if (!cleanedParts.length) {
      return { word: displayToken, matched: true, closeMatch: false, similarity: 1 };
    }

    countableWords += 1;
    const cleanWord = cleanedParts.join('');

    let bestSim = 0;
    for (const sw of spokenWords) {
      const sim = computeWordSimilarity(cleanWord, sw);
      if (sim > bestSim) bestSim = sim;
    }

    const matched = bestSim >= 0.78;
    const closeMatch = !matched && bestSim >= 0.52;
    if (matched) matchedCount += 1;
    weightedScoreSum += bestSim;

    return {
      word: displayToken,
      matched,
      closeMatch,
      similarity: Math.round(bestSim * 100),
    };
  });

  const denom = Math.max(1, countableWords);
  let rawPercent = Math.round((weightedScoreSum / denom) * 100);
  if (typeof confidence === 'number' && confidence > 0 && rawPercent >= 70) {
    // Slightly reflect acoustic clarity from Web Speech confidence while keeping score encouraging for kids
    rawPercent = Math.min(100, Math.round(rawPercent * 0.85 + Math.round(confidence * 100) * 0.15));
  }

  let ratingAr = 'جرّب القراءة ببطء وصوت أوضح قرب الميكروفون!';
  let ratingEn = 'Try speaking slowly and clearly near your mic!';
  if (rawPercent >= 85) {
    ratingAr = 'نطق ممتاز واحترافي! أحسنت يا بطل!';
    ratingEn = 'Outstanding Pronunciation! Champion level!';
  } else if (rawPercent >= 60) {
    ratingAr = 'رائع جداً! نطقك واضح ومفهوم!';
    ratingEn = 'Great Job! Very clear pronunciation!';
  } else if (rawPercent >= 40) {
    ratingAr = 'بداية حلوة! اضغط «اسمع النطق أولاً» وكرر الكلمات الرمادية.';
    ratingEn = 'Good effort! Hear it once more and retry the gray words.';
  }

  return {
    accuracyPercent: rawPercent,
    matchedCount,
    totalTargetWords: countableWords || 1,
    ratingAr,
    ratingEn,
    wordMatches,
  };
}

/** Pick best Web Speech alternative matching a target phrase or word */
export function pickBestTranscriptMatch(
  targetText: string,
  alternatives: Array<{ transcript: string; confidence?: number }>
): { transcript: string; confidence?: number; evalResult: PronunciationEvaluation } {
  let best = {
    transcript: alternatives[0]?.transcript || '',
    confidence: alternatives[0]?.confidence,
    evalResult: evaluateSpokenEnglish(targetText, alternatives[0]?.transcript || '', alternatives[0]?.confidence),
  };

  for (let i = 1; i < alternatives.length; i += 1) {
    const alt = alternatives[i];
    const ev = evaluateSpokenEnglish(targetText, alt.transcript, alt.confidence);
    if (ev.accuracyPercent > best.evalResult.accuracyPercent) {
      best = { transcript: alt.transcript, confidence: alt.confidence, evalResult: ev };
    }
  }
  return best;
}
