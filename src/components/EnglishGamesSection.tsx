import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  GraduationCap,
  HelpCircle,
  Medal,
  Mic,
  MicOff,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
  Square,
  Star,
  Store,
  Volume2,
  X,
  XCircle,
} from 'lucide-react';
import type { AcademySettings, Lang } from '../types';
import {
  DETECTIVE_CASES,
  ENGLISH_AGE_GROUPS,
  ROLEPLAY_CUSTOMERS,
  ROLEPLAY_MENU,
  SENTENCE_PUZZLES,
  STORY_TEMPLATES,
  type EnglishAgeGroup,
  type StoryOption,
} from '../data/englishGamesData';
import {
  downloadEnglishCertificatePdf,
  renderEnglishCertificateCanvas,
} from '../utils/englishCertificatePdf';
import {
  evaluateSpokenEnglish,
  getSpeechRecognitionCtor,
  pickBestTranscriptMatch,
  playSoftFeedbackTone,
  primeEnglishVoices,
  speakEnglishText,
  stopEnglishSpeech,
  type BrowserSpeechRecognition,
  type PronunciationEvaluation,
} from '../utils/englishSpeech';

interface EnglishGamesSectionProps {
  lang: Lang;
  settings: AcademySettings;
}

type EnglishMiniGame = 'story' | 'detective' | 'scramble' | 'roleplay';

function shuffleWordsDeterministic(
  words: string[],
  seedIdx: number
): Array<{ id: string; word: string }> {
  const indexed = words.map((word, idx) => ({ id: `${seedIdx}-${idx}-${word}`, word }));
  for (let i = indexed.length - 1; i > 0; i -= 1) {
    const j = (i * 7 + seedIdx * 3 + 1) % (i + 1);
    const tmp = indexed[i];
    indexed[i] = indexed[j];
    indexed[j] = tmp;
  }
  if (indexed.every((item, idx) => item.word === words[idx]) && indexed.length > 1) {
    const first = indexed[0];
    indexed[0] = indexed[indexed.length - 1];
    indexed[indexed.length - 1] = first;
  }
  return indexed;
}

export function EnglishGamesSection({ lang, settings }: EnglishGamesSectionProps) {
  // Age Level & Tab State
  const [ageGroup, setAgeGroup] = useState<EnglishAgeGroup>('8-10');
  const [activeTab, setActiveTab] = useState<EnglishMiniGame>('story');

  // Audio Playback & Mic Speaking State
  const [speechRate, setSpeechRate] = useState<'normal' | 'slow'>('normal');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioWarningAr, setAudioWarningAr] = useState('');

  // Mic State (Web Speech API + MediaRecorder Playback Fallback)
  const [micListening, setMicListening] = useState(false);
  const [micSpeechActive, setMicSpeechActive] = useState(false);
  const [micMode, setMicMode] = useState<'idle' | 'speech-api' | 'recorder'>('idle');
  const [micTranscript, setMicTranscript] = useState('');
  const [micTargetText, setMicTargetText] = useState('');
  const [micEval, setMicEval] = useState<PronunciationEvaluation | null>(null);
  const [micErrorAr, setMicErrorAr] = useState('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState('');
  const [voiceStars, setVoiceStars] = useState(0);
  const [rewardedSpeechKeys, setRewardedSpeechKeys] = useState<string[]>([]);
  const [quickMicTestOpen, setQuickMicTestOpen] = useState(false);
  const speechApiSupported = useMemo(() => Boolean(getSpeechRecognitionCtor()), []);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Certificate Modal State
  const [studentName, setStudentName] = useState('');
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certPreviewUrl, setCertPreviewUrl] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Prime browser voices on mount & clean up audio/mic on unmount
  useEffect(() => {
    primeEnglishVoices();
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
    const handleVoices = () => primeEnglishVoices();
    if (synth && 'addEventListener' in synth) {
      synth.addEventListener('voiceschanged', handleVoices);
    }
    return () => {
      if (synth && 'removeEventListener' in synth) {
        synth.removeEventListener('voiceschanged', handleVoices);
      }
      stopEnglishSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try {
          recorderRef.current.stop();
        } catch {
          // Ignore
        }
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [recordedAudioUrl]);

  const activeAgeMeta = useMemo(
    () => ENGLISH_AGE_GROUPS.find((g) => g.id === ageGroup) || ENGLISH_AGE_GROUPS[1],
    [ageGroup]
  );

  // Filtered datasets by Age Level
  const ageStories = useMemo(
    () => STORY_TEMPLATES.filter((s) => s.ageGroup === ageGroup),
    [ageGroup]
  );
  const ageCases = useMemo(
    () => DETECTIVE_CASES.filter((c) => c.ageGroup === ageGroup),
    [ageGroup]
  );
  const ageSentences = useMemo(
    () => SENTENCE_PUZZLES.filter((s) => s.ageGroup === ageGroup),
    [ageGroup]
  );
  const ageCustomers = useMemo(
    () => ROLEPLAY_CUSTOMERS.filter((c) => c.ageGroup === ageGroup),
    [ageGroup]
  );

  const handleSpeak = (text: string) => {
    setAudioWarningAr('');
    speakEnglishText(text, {
      rate: speechRate === 'slow' ? 0.68 : 0.92,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onUnavailable: (reason) => {
        setIsSpeaking(false);
        if (reason === 'unsupported') {
          setAudioWarningAr(
            'متصفحك الحالي لا يدعم النطق التلقائي. جرّب فتح الموقع على Chrome أو Edge أو تأكد من تفعيل الصوت.'
          );
        } else if (reason === 'no-voices') {
          setAudioWarningAr(
            'لا توجد حزمة صوت إنجليزي مثبّتة على الجهاز حالياً. تأكد من إعدادات الصوت في الهاتف أو الكمبيوتر، أو استمع من Chrome.'
          );
        } else {
          setAudioWarningAr(
            'تعذّر تشغيل النطق التلقائي. تأكد أن صوت الجهاز غير صامت واضغط زر «استمع» مرة أخرى.'
          );
        }
      },
    });
  };

  const stopMicAll = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // Ignore
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((tr) => tr.stop());
      mediaStreamRef.current = null;
    }
    setMicListening(false);
    setMicSpeechActive(false);
  };

  const startSpeakingPractice = async (
    targetEnglish: string,
    speechKey: string,
    onFinalTranscript?: (spokenText: string) => void
  ) => {
    const cleanTarget = targetEnglish.replace(/[«»"]/g, '').trim();
    if (!cleanTarget) return;

    if (micListening) {
      stopMicAll();
      return;
    }

    stopEnglishSpeech();
    setIsSpeaking(false);
    setMicErrorAr('');
    setMicTranscript('');
    setMicEval(null);
    setMicSpeechActive(false);
    setMicTargetText(cleanTarget);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl('');
    }

    const SpeechCtor = getSpeechRecognitionCtor();

    const startRecorderFallback = async () => {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function' ||
        typeof MediaRecorder === 'undefined'
      ) {
        setMicErrorAr(
          'الميكروفون غير متاح في هذا المتصفح أو تم منع الإذن داخل الإطار. افتح المنصة في متصفح Chrome واضغط «السماح للميكروفون» من علامة القفل أعلى العنوان.'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;

        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) recordedChunksRef.current.push(ev.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          const nextUrl = URL.createObjectURL(blob);
          setRecordedAudioUrl(nextUrl);
          setMicListening(false);
          setMicSpeechActive(false);
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((tr) => tr.stop());
            mediaStreamRef.current = null;
          }
          if (!rewardedSpeechKeys.includes(speechKey)) {
            setRewardedSpeechKeys((prev) => [...prev, speechKey]);
            setVoiceStars((s) => s + 5);
            playSoftFeedbackTone('win');
          }
        };

        setMicMode('recorder');
        setMicListening(true);
        setMicSpeechActive(true);
        recorder.start();
      } catch {
        setMicListening(false);
        setMicSpeechActive(false);
        setMicErrorAr(
          'لم نتمكن من فتح الميكروفون. تأكد من توصيل ميكروفون والسماح للإذن من علامة القفل بجانب رابط الموقع.'
        );
      }
    };

    if (!SpeechCtor) {
      await startRecorderFallback();
      return;
    }

    try {
      const recog = new SpeechCtor();
      recognitionRef.current = recog;
      recog.lang = 'en-US';
      recog.continuous = false;
      recog.interimResults = true;
      recog.maxAlternatives = 5;

      let latestTranscript = '';
      let latestConfidence: number | undefined;

      recog.onstart = () => {
        setMicMode('speech-api');
        setMicListening(true);
      };

      recog.onaudiostart = () => {
        setMicListening(true);
      };

      recog.onspeechstart = () => {
        setMicSpeechActive(true);
      };

      recog.onspeechend = () => {
        setMicSpeechActive(false);
      };

      recog.onresult = (event) => {
        const alternativesPool: Array<{ transcript: string; confidence?: number }> = [];
        let primarySentence = '';
        let primaryConf: number | undefined;

        for (let i = 0; i < event.results.length; i += 1) {
          const res = event.results[i];
          primarySentence += `${res[0]?.transcript || ''} `;
          if (typeof res[0]?.confidence === 'number') primaryConf = res[0].confidence;
        }
        if (primarySentence.trim()) {
          alternativesPool.push({ transcript: primarySentence.trim(), confidence: primaryConf });
        }

        const lastIdx = event.results.length - 1;
        if (lastIdx >= 0 && event.results.length === 1) {
          const lastRes = event.results[lastIdx];
          for (let a = 1; a < lastRes.length; a += 1) {
            if (lastRes[a]?.transcript) {
              alternativesPool.push({
                transcript: lastRes[a].transcript.trim(),
                confidence: lastRes[a].confidence,
              });
            }
          }
        }

        const bestMatch = pickBestTranscriptMatch(cleanTarget, alternativesPool);
        latestTranscript = bestMatch.transcript;
        latestConfidence = bestMatch.confidence;
        setMicTranscript(bestMatch.transcript);
        setMicEval(bestMatch.evalResult);
      };

      recog.onnomatch = () => {
        setMicErrorAr(
          'سمعنا صوتك لكن الكلمة لم تكن واضحة بالإنجليزية — انطقها ببطء ووضوح مرة أخرى!'
        );
      };

      recog.onerror = (event) => {
        setMicListening(false);
        setMicSpeechActive(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicErrorAr(
            'صلاحية الميكروفون مرفوضة أو محجوبة. اضغط علامة القفل أعلى المتصفح واختر «السماح للميكروفون» (Allow Microphone) ثم جرّب مرة أخرى.'
          );
        } else if (event.error === 'no-speech') {
          setMicErrorAr(
            'لم نسمع صوتاً واضحاً! قرّب صوتك قليلاً من الميكروفون واضغط الزر واقرأ بصوت واضح.'
          );
        } else if (event.error === 'audio-capture') {
          setMicErrorAr(
            'لا يوجد ميكروفون متصل أو هناك تطبيق آخر يستخدمه. تأكد من توصيل الميكروفون وجرّب مجدداً.'
          );
        } else if (event.error === 'network') {
          void startRecorderFallback();
        } else if (event.error !== 'aborted') {
          setMicErrorAr('توقف الميكروفون مؤقتاً — اضغط «تحدّث بالميكروفون» للمحاولة من جديد.');
        }
      };

      recog.onend = () => {
        setMicListening(false);
        setMicSpeechActive(false);
        if (latestTranscript) {
          const finalEval = evaluateSpokenEnglish(cleanTarget, latestTranscript, latestConfidence);
          setMicEval(finalEval);
          if (finalEval.accuracyPercent >= 55 && !rewardedSpeechKeys.includes(speechKey)) {
            setRewardedSpeechKeys((prev) => [...prev, speechKey]);
            setVoiceStars((s) => s + 5);
            playSoftFeedbackTone('win');
          }
          onFinalTranscript?.(latestTranscript);
        }
      };

      recog.start();
    } catch {
      await startRecorderFallback();
    }
  };

  // =========================================================================
  // GAME 1: STORY BUILDER STATE
  // =========================================================================
  const [storyIdx, setStoryIdx] = useState(0);
  const activeStory = ageStories[storyIdx] || ageStories[0];
  const [pickedStorySlots, setPickedStorySlots] = useState<Record<string, StoryOption>>(() => {
    const firstStory = STORY_TEMPLATES.find((s) => s.ageGroup === '8-10') || STORY_TEMPLATES[0];
    const init: Record<string, StoryOption> = {};
    firstStory.slots.forEach((slot) => {
      init[slot.id] = slot.options[0];
    });
    return init;
  });
  const [showStoryAr, setShowStoryAr] = useState(true);
  const [savedStoryIds, setSavedStoryIds] = useState<string[]>([]);
  const [storyJustSaved, setStoryJustSaved] = useState(false);

  const selectStoryTemplate = (nextIdx: number, list = ageStories) => {
    const tmpl = list[nextIdx] || list[0];
    setStoryIdx(nextIdx);
    const init: Record<string, StoryOption> = {};
    tmpl.slots.forEach((slot) => {
      init[slot.id] = slot.options[0];
    });
    setPickedStorySlots(init);
    setStoryJustSaved(false);
  };

  const safePickedSlots = useMemo(() => {
    const resolved: Record<string, StoryOption> = {};
    activeStory.slots.forEach((slot) => {
      const candidate = pickedStorySlots[slot.id];
      resolved[slot.id] =
        candidate && slot.options.some((o) => o.en === candidate.en)
          ? candidate
          : slot.options[0];
    });
    return resolved;
  }, [activeStory, pickedStorySlots]);

  const builtStoryEn = useMemo(
    () => activeStory.buildEn(safePickedSlots),
    [activeStory, safePickedSlots]
  );
  const builtStoryAr = useMemo(
    () => activeStory.buildAr(safePickedSlots),
    [activeStory, safePickedSlots]
  );

  // =========================================================================
  // GAME 2: WORD & CLUE DETECTIVE STATE
  // =========================================================================
  const [caseIdx, setCaseIdx] = useState(0);
  const currentCase = ageCases[caseIdx] || ageCases[0];
  const [pickedCaseOption, setPickedCaseOption] = useState<number | null>(null);
  const [showCaseHint, setShowCaseHint] = useState(false);
  const [solvedCases, setSolvedCases] = useState<string[]>([]);

  const handleDetectivePick = (optIdx: number) => {
    if (pickedCaseOption !== null) return;
    setPickedCaseOption(optIdx);
    const targetWord = currentCase.options[currentCase.correctIndex].word;
    if (optIdx === currentCase.correctIndex) {
      playSoftFeedbackTone('win');
      setSolvedCases((prev) => (prev.includes(currentCase.id) ? prev : [...prev, currentCase.id]));
      handleSpeak(targetWord);
    } else {
      playSoftFeedbackTone('oops');
    }
  };

  const nextDetectiveCase = () => {
    setPickedCaseOption(null);
    setShowCaseHint(false);
    setCaseIdx((prev) => (prev + 1) % ageCases.length);
  };

  // =========================================================================
  // GAME 3: SENTENCE SCRAMBLE RACE STATE
  // =========================================================================
  const [sentIdx, setSentIdx] = useState(0);
  const currentSentence = ageSentences[sentIdx] || ageSentences[0];
  const [availableTokens, setAvailableTokens] = useState<Array<{ id: string; word: string }>>(() => {
    const firstSent = SENTENCE_PUZZLES.find((s) => s.ageGroup === '8-10') || SENTENCE_PUZZLES[0];
    return shuffleWordsDeterministic(firstSent.words, 0);
  });
  const [placedTokens, setPlacedTokens] = useState<Array<{ id: string; word: string }>>([]);
  const [scrambleFeedback, setScrambleFeedback] = useState<'idle' | 'ok' | 'wrong'>('idle');
  const [solvedSentences, setSolvedSentences] = useState<string[]>([]);
  const [scrambleTimerSec, setScrambleTimerSec] = useState(0);
  const [showGrammarTip, setShowGrammarTip] = useState(false);

  useEffect(() => {
    if (activeTab !== 'scramble' || scrambleFeedback === 'ok') return;
    const timer = window.setInterval(() => {
      setScrambleTimerSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeTab, scrambleFeedback, sentIdx, ageGroup]);

  const selectSentencePuzzle = (nextIdx: number, list = ageSentences) => {
    const puzzle = list[nextIdx] || list[0];
    setSentIdx(nextIdx);
    setAvailableTokens(shuffleWordsDeterministic(puzzle.words, nextIdx));
    setPlacedTokens([]);
    setScrambleFeedback('idle');
    setScrambleTimerSec(0);
    setShowGrammarTip(false);
  };

  const handlePlaceToken = (tokId: string) => {
    const tok = availableTokens.find((t) => t.id === tokId);
    if (!tok) return;
    playSoftFeedbackTone('tap');
    setAvailableTokens((prev) => prev.filter((t) => t.id !== tokId));
    setPlacedTokens((prev) => [...prev, tok]);
    setScrambleFeedback('idle');
  };

  const handleRemoveToken = (tokId: string) => {
    const tok = placedTokens.find((t) => t.id === tokId);
    if (!tok || scrambleFeedback === 'ok') return;
    playSoftFeedbackTone('tap');
    setPlacedTokens((prev) => prev.filter((t) => t.id !== tokId));
    setAvailableTokens((prev) => [...prev, tok]);
    setScrambleFeedback('idle');
  };

  const handleCheckSentence = () => {
    const built = placedTokens.map((t) => t.word).join(' ');
    const expected = currentSentence.words.join(' ');
    if (built === expected) {
      setScrambleFeedback('ok');
      playSoftFeedbackTone('win');
      setSolvedSentences((prev) =>
        prev.includes(currentSentence.id) ? prev : [...prev, currentSentence.id]
      );
      handleSpeak(expected);
    } else {
      playSoftFeedbackTone('oops');
      setScrambleFeedback('wrong');
    }
  };

  const handleHintNextWord = () => {
    const nextIdx = placedTokens.length;
    if (nextIdx >= currentSentence.words.length) return;
    const targetWord = currentSentence.words[nextIdx];
    const matchingTok = availableTokens.find((t) => t.word === targetWord);
    if (matchingTok) {
      handlePlaceToken(matchingTok.id);
    }
  };

  // =========================================================================
  // GAME 4: CAFE & SHOP ROLEPLAY STATE
  // =========================================================================
  const [custIdx, setCustIdx] = useState(0);
  const currentCustomer = ageCustomers[custIdx] || ageCustomers[0];
  const [trayCounts, setTrayCounts] = useState<Record<string, number>>({});
  const [pickedReplyIdx, setPickedReplyIdx] = useState<number | null>(null);
  const [servedCustomerIds, setServedCustomerIds] = useState<string[]>([]);
  const [roleplayFeedback, setRoleplayFeedback] = useState<{
    type: 'idle' | 'win' | 'fix';
    textAr: string;
    textEn: string;
  }>({ type: 'idle', textAr: '', textEn: '' });

  const traySubtotal = useMemo(
    () =>
      ROLEPLAY_MENU.reduce(
        (sum, prod) => sum + (trayCounts[prod.id] || 0) * prod.price,
        0
      ),
    [trayCounts]
  );

  const adjustTrayItem = (prodId: string, delta: number) => {
    if (roleplayFeedback.type === 'win') return;
    playSoftFeedbackTone('tap');
    setTrayCounts((prev) => {
      const next = Math.max(0, (prev[prodId] || 0) + delta);
      return { ...prev, [prodId]: next };
    });
    setRoleplayFeedback({ type: 'idle', textAr: '', textEn: '' });
  };

  const handleServeCustomer = () => {
    const itemsMatch = ROLEPLAY_MENU.every((prod) => {
      const want = currentCustomer.requiredCounts[prod.id] || 0;
      const have = trayCounts[prod.id] || 0;
      return want === have;
    });

    if (!itemsMatch) {
      playSoftFeedbackTone('oops');
      setRoleplayFeedback({
        type: 'fix',
        textAr: 'راجع الصينية! الطلب الموجود على الصينية لا يطابق طلب الزبون بدقة.',
        textEn: 'Check your serving tray! The items do not match what the customer ordered.',
      });
      return;
    }

    if (pickedReplyIdx === null) {
      playSoftFeedbackTone('oops');
      setRoleplayFeedback({
        type: 'fix',
        textAr: 'اختر الرد الإنجليزي المهذب مع السعر الصحيح قبل تسليم الطلب!',
        textEn: 'Please choose a polite English reply before serving!',
      });
      return;
    }

    const chosenReply = currentCustomer.replyChoices[pickedReplyIdx];
    if (!chosenReply.politeAndAccurate) {
      playSoftFeedbackTone('oops');
      setRoleplayFeedback({
        type: 'fix',
        textAr: chosenReply.feedbackAr,
        textEn: 'Oops! Double-check the total price and polite English phrasing.',
      });
      return;
    }

    playSoftFeedbackTone('win');
    setServedCustomerIds((prev) =>
      prev.includes(currentCustomer.id) ? prev : [...prev, currentCustomer.id]
    );
    setRoleplayFeedback({
      type: 'win',
      textAr: `${chosenReply.feedbackAr} (+10 نجوم للمتجر!)`,
      textEn: 'Perfect service, exact math & polite English! (+10 Store Stars)',
    });
    handleSpeak(chosenReply.textEn);
  };

  const selectCustomer = (nextIdx: number) => {
    setCustIdx(nextIdx);
    setTrayCounts({});
    setPickedReplyIdx(null);
    setRoleplayFeedback({ type: 'idle', textAr: '', textEn: '' });
  };

  // Switch Age Level smoothly
  const handleSelectAgeGroup = (nextAge: EnglishAgeGroup) => {
    stopMicAll();
    stopEnglishSpeech();
    setIsSpeaking(false);
    setMicTranscript('');
    setMicEval(null);
    setMicErrorAr('');
    setAgeGroup(nextAge);

    const nextStories = STORY_TEMPLATES.filter((s) => s.ageGroup === nextAge);
    const nextSentences = SENTENCE_PUZZLES.filter((s) => s.ageGroup === nextAge);

    selectStoryTemplate(0, nextStories);
    setCaseIdx(0);
    setPickedCaseOption(null);
    setShowCaseHint(false);

    selectSentencePuzzle(0, nextSentences);

    setCustIdx(0);
    setTrayCounts({});
    setPickedReplyIdx(null);
    setRoleplayFeedback({ type: 'idle', textAr: '', textEn: '' });
  };

  // =========================================================================
  // UNIFIED BADGES & PDF CERTIFICATE TRACKER
  // =========================================================================
  const solvedCasesForAge = useMemo(
    () => solvedCases.filter((id) => ageCases.some((c) => c.id === id)),
    [solvedCases, ageCases]
  );
  const solvedSentencesForAge = useMemo(
    () => solvedSentences.filter((id) => ageSentences.some((s) => s.id === id)),
    [solvedSentences, ageSentences]
  );
  const servedForAge = useMemo(
    () => servedCustomerIds.filter((id) => ageCustomers.some((c) => c.id === id)),
    [servedCustomerIds, ageCustomers]
  );

  const badges = useMemo(
    () => [
      {
        id: 'story',
        title: 'Story Creator',
        titleAr: 'مؤلف القصص',
        unlocked: savedStoryIds.length >= 1,
      },
      {
        id: 'detective',
        title: 'Word Detective',
        titleAr: 'المحقق اللغوي',
        unlocked: solvedCases.length >= 4,
      },
      {
        id: 'scramble',
        title: 'Sentence Champion',
        titleAr: 'بطل الجمل',
        unlocked: solvedSentences.length >= 4,
      },
      {
        id: 'roleplay',
        title: 'Polite Host',
        titleAr: 'المتحدث اللبق',
        unlocked: servedCustomerIds.length >= 3,
      },
    ],
    [savedStoryIds.length, solvedCases.length, solvedSentences.length, servedCustomerIds.length]
  );

  const earnedBadgesCount = badges.filter((b) => b.unlocked).length;

  useEffect(() => {
    if (!certModalOpen) return;
    let active = true;
    void renderEnglishCertificateCanvas({
      studentName: studentName.trim() || (lang === 'ar' ? 'نجم الإنجليزي' : 'English Star'),
      ageGroupLabel: activeAgeMeta.labelEn,
      academyName: settings.academyNameEn || 'LinguaCraft English Academy',
      logoDataUrl: settings.logoDataUrl,
      storiesBuilt: savedStoryIds.length,
      detectiveScore: solvedCases.length,
      detectiveTotal: DETECTIVE_CASES.length,
      sentencesSolved: solvedSentences.length,
      sentencesTotal: SENTENCE_PUZZLES.length,
      customersServed: servedCustomerIds.length,
      customersTotal: ROLEPLAY_CUSTOMERS.length,
      voiceStars,
      badges: badges.map((b) => ({ title: b.title, unlocked: b.unlocked })),
    }).then((canvas) => {
      if (active) setCertPreviewUrl(canvas.toDataURL('image/png'));
    });
    return () => {
      active = false;
    };
  }, [
    certModalOpen,
    studentName,
    activeAgeMeta.labelEn,
    lang,
    settings.academyNameEn,
    settings.logoDataUrl,
    savedStoryIds.length,
    solvedCases.length,
    solvedSentences.length,
    servedCustomerIds.length,
    voiceStars,
    badges,
  ]);

  const handleDownloadCertificate = async () => {
    setDownloadingPdf(true);
    try {
      await downloadEnglishCertificatePdf({
        studentName: studentName.trim() || 'English Star',
        ageGroupLabel: activeAgeMeta.labelEn,
        academyName: settings.academyNameEn || 'LinguaCraft English Academy',
        logoDataUrl: settings.logoDataUrl,
        storiesBuilt: savedStoryIds.length,
        detectiveScore: solvedCases.length,
        detectiveTotal: DETECTIVE_CASES.length,
        sentencesSolved: solvedSentences.length,
        sentencesTotal: SENTENCE_PUZZLES.length,
        customersServed: servedCustomerIds.length,
        customersTotal: ROLEPLAY_CUSTOMERS.length,
        voiceStars,
        badges: badges.map((b) => ({ title: b.title, unlocked: b.unlocked })),
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Reusable Speaking Coach Panel inside every mini-game
  const renderMicStudio = (
    targetText: string,
    speechKey: string,
    promptLabelAr: string,
    promptLabelEn: string,
    onFinalTranscript?: (spokenText: string) => void
  ) => {
    const cleanTarget = targetText.replace(/[«»"]/g, '').trim();
    const isThisTarget = micTargetText === cleanTarget;

    return (
      <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-sky-950 flex flex-wrap items-center gap-1.5">
              <Mic className="w-4 h-4 text-sky-800 shrink-0" />
              <span>{lang === 'ar' ? promptLabelAr : promptLabelEn}</span>
              <span className="text-[11px] font-medium text-sky-800/80">
                {speechApiSupported
                  ? lang === 'ar'
                    ? '(تقييم فوري لـ Web Speech API)'
                    : '(Live Web Speech API)'
                  : lang === 'ar'
                  ? '(تسجيل صوتي للمراجعة)'
                  : '(Voice Recorder)'}
              </span>
            </p>
            <p dir="ltr" className="text-xs text-sky-900/80 font-medium line-clamp-2">
              &ldquo;{cleanTarget}&rdquo;
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => (isSpeaking ? stopEnglishSpeech() : handleSpeak(cleanTarget))}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-950 bg-white border border-sky-300 rounded-xl hover:bg-sky-100 whitespace-nowrap"
            >
              {isSpeaking ? (
                <>
                  <Square className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                  <span>{lang === 'ar' ? 'إيقاف الصوت' : 'Stop'}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-sky-800" />
                  <span>{lang === 'ar' ? 'اسمع النطق أولاً' : 'Hear First'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void startSpeakingPractice(cleanTarget, speechKey, onFinalTranscript)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
                micListening && isThisTarget
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-emerald-700 text-white hover:bg-emerald-600'
              }`}
            >
              {micListening && isThisTarget ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>
                    {micSpeechActive
                      ? lang === 'ar'
                        ? 'نسمع صوتك الآن... اضغط للإنهاء'
                        : 'Hearing Voice... Tap to Finish'
                      : lang === 'ar'
                      ? 'الميكروفون مفتوح — ابدأ بالكلام...'
                      : 'Mic Ready — Speak Now...'}
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تحدّث بالميكروفون (+5 نجوم)' : 'Speak with Mic (+5 Stars)'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Transcript & Multi-Color Pronunciation Evaluation */}
        {isThisTarget && (micTranscript || micEval) && micMode === 'speech-api' && (
          <div className="bg-white border border-sky-200 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600">
                {lang === 'ar' ? 'ما التقطه الميكروفون:' : 'Mic Captured:'}{' '}
                <strong dir="ltr" className="text-slate-900">
                  {micTranscript}
                </strong>
              </span>
              {micEval && (
                <span
                  className={`font-mono-num font-bold ${
                    micEval.accuracyPercent >= 70
                      ? 'text-emerald-700'
                      : micEval.accuracyPercent >= 45
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}
                >
                  {micEval.accuracyPercent}% {lang === 'ar' ? 'دقة النطق' : 'Accuracy'} (
                  {micEval.matchedCount}/{micEval.totalTargetWords})
                </span>
              )}
            </div>

            {micEval && (
              <>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      micEval.accuracyPercent >= 70
                        ? 'bg-emerald-600'
                        : micEval.accuracyPercent >= 45
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${micEval.accuracyPercent}%` }}
                  />
                </div>

                <div dir="ltr" className="flex flex-wrap gap-1.5">
                  {micEval.wordMatches.map((wm, idx) => (
                    <span
                      key={`${wm.word}-${idx}`}
                      className={`px-2 py-0.5 text-xs font-semibold rounded-md ${
                        wm.matched
                          ? 'bg-emerald-100 text-emerald-900'
                          : wm.closeMatch
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {wm.word}
                    </span>
                  ))}
                </div>

                <p className="text-xs font-semibold text-sky-950">
                  {lang === 'ar' ? micEval.ratingAr : micEval.ratingEn}
                </p>
              </>
            )}
          </div>
        )}

        {/* Voice Recorder Playback Fallback (when SpeechRecognition API isn't on browser) */}
        {isThisTarget && recordedAudioUrl && micMode === 'recorder' && (
          <div className="bg-white border border-emerald-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-emerald-900">
              {lang === 'ar'
                ? 'تم تسجيل صوتك بنجاح! استمع لصوتك وقارنه بالنطق الصحيح:'
                : 'Voice recorded! Listen back and compare with native pronunciation:'}
            </span>
            <audio controls src={recordedAudioUrl} className="h-8 max-w-full" />
          </div>
        )}

        {micErrorAr && isThisTarget && (
          <p className="text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
            {micErrorAr}
          </p>
        )}
      </div>
    );
  };

  return (
    <section id="english-games" className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Heading + Earned Badges Summary + Free PDF Certificate CTA */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'مجاني 100% · 3 مستويات للسن · استماع وميكروفون نطق تفاعلي + شهادة PDF مجاناً'
                  : '100% Free · 3 Age Tiers · Audio & Mic Speaking Coach + Free PDF Certificate'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              {lang === 'ar'
                ? 'نادي ألعاب الإنجليزي التفاعلي حسب العمر (استماع + نطق بالميكروفون)'
                : 'English Play Zone by Age Level: Listen, Speak & Earn Badges'}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              {lang === 'ar'
                ? 'اختر الفئة العمرية المناسبة للطفل (من 5 إلى 14 سنة) واستمتع بـ 9 مغامرات قصصية، 24 قضية لغوية، 24 سباق جمل، و18 زبوناً في الكافيه والمتجر — مع زر استماع بسرعة واضحة وتحدي نطق بالميكروفون!'
                : 'Choose your age level (5–14 years) across 9 custom stories, 24 detective mysteries, 24 grammar races, and 18 roleplay customers—with clear voice playback, microphone pronunciation practice, and free printable A4 PDF certificate.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2.5 bg-sky-50 border border-sky-200 rounded-xl text-xs font-semibold text-sky-950 font-mono-num flex items-center gap-1.5 whitespace-nowrap">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>
                {voiceStars} {lang === 'ar' ? 'نجمة نطق' : 'Mic Stars'}
              </span>
            </div>

            <div className="px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-950 font-mono-num flex items-center gap-1.5 whitespace-nowrap">
              <Medal className="w-4 h-4 text-amber-600" />
              <span>
                {earnedBadgesCount} / {badges.length}{' '}
                {lang === 'ar' ? 'شارات' : 'Badges'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCertModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 transition-colors whitespace-nowrap shrink-0"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>
                {lang === 'ar'
                  ? 'شهادة الإنجليزي PDF مجاناً'
                  : 'Free PDF Certificate'}
              </span>
            </button>
          </div>
        </div>

        {/* AGE GROUP SELECTOR + AUDIO & MIC TOOLBAR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
              <GraduationCap className="w-4 h-4 text-sky-900 shrink-0" />
              <span>
                {lang === 'ar' ? 'اختر المستوى المناسب لعمر الطفل:' : 'Select Student Age Level:'}
              </span>
            </div>

            {/* Audio Speed & Direct Sound / Mic Test Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSpeechRate('normal')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    speechRate === 'normal'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'ar' ? 'سرعة عادية (1x)' : 'Normal Voice'}
                </button>
                <button
                  type="button"
                  onClick={() => setSpeechRate('slow')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    speechRate === 'slow'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'ar' ? 'نطق بطيء واضح' : 'Slow & Clear'}
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  isSpeaking
                    ? (stopEnglishSpeech(), setIsSpeaking(false))
                    : handleSpeak('Hello champion! Let us play and speak English together!')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 whitespace-nowrap"
              >
                {isSpeaking ? (
                  <>
                    <Square className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                    <span>{lang === 'ar' ? 'إيقاف الصوت' : 'Stop Audio'}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'اختبار الصوت الآن' : 'Test Audio'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setQuickMicTestOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 whitespace-nowrap"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-700" />
                <span>{lang === 'ar' ? 'اختبار الميكروفون' : 'Test Mic'}</span>
              </button>
            </div>
          </div>

          {quickMicTestOpen && (
            <div className="pt-1">
              {renderMicStudio(
                'I love learning English every day',
                'quick-mic-test',
                'تجربة سريعة للميكروفون — اضغط واقرأ الجملة:',
                'Quick Mic Check — Tap and say this sentence:'
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ENGLISH_AGE_GROUPS.map((grp) => {
              const selected = ageGroup === grp.id;
              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => handleSelectAgeGroup(grp.id)}
                  className={`p-3.5 rounded-xl border text-start transition-all ${
                    selected
                      ? 'bg-sky-900 text-white border-sky-900 shadow-sm'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <p className="text-xs sm:text-sm font-bold">
                    {lang === 'ar' ? grp.labelAr : grp.labelEn}
                  </p>
                  <p
                    className={`text-[11px] mt-1 leading-relaxed ${
                      selected ? 'text-sky-100' : 'text-slate-500'
                    }`}
                  >
                    {lang === 'ar' ? grp.descAr : grp.descEn}
                  </p>
                </button>
              );
            })}
          </div>

          {audioWarningAr && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs font-medium text-amber-950">
              {audioWarningAr}
            </div>
          )}
        </div>

        {/* 4 Badges Progress Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
                b.unlocked
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <Medal
                className={`w-5 h-5 shrink-0 ${
                  b.unlocked ? 'text-amber-500 fill-amber-300' : 'text-slate-300'
                }`}
              />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">
                  {lang === 'ar' ? b.titleAr : b.title}
                </p>
                <p className="text-[11px] opacity-80 truncate">
                  {b.unlocked
                    ? lang === 'ar'
                      ? 'تم الحصول عليها ✓'
                      : 'Unlocked'
                    : lang === 'ar'
                    ? 'قيد التحدي'
                    : 'In Progress'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 4-Game Selector Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            {
              id: 'story' as const,
              icon: BookOpen,
              titleAr: '1. اصنع قصتك بالإنجليزي',
              titleEn: '1. Story Builder',
              subAr: `${ageStories.length} مغامرات × 5 اختيارات`,
              subEn: `${ageStories.length} Multi-Slot Stories`,
            },
            {
              id: 'detective' as const,
              icon: Search,
              titleAr: '2. المحقق اللغوي',
              titleEn: '2. Word Detective',
              subAr: `${solvedCasesForAge.length}/${ageCases.length} ألغاز بالمستوى`,
              subEn: `${solvedCasesForAge.length}/${ageCases.length} Level Cases`,
            },
            {
              id: 'scramble' as const,
              icon: Shuffle,
              titleAr: '3. سباق تركيب الجمل',
              titleEn: '3. Sentence Race',
              subAr: `${solvedSentencesForAge.length}/${ageSentences.length} جمل بالمستوى`,
              subEn: `${solvedSentencesForAge.length}/${ageSentences.length} Level Races`,
            },
            {
              id: 'roleplay' as const,
              icon: Store,
              titleAr: '4. المتجر والمطعم التفاعلي',
              titleEn: '4. Cafe & Shop Host',
              subAr: `${servedForAge.length}/${ageCustomers.length} زبائن بالمستوى`,
              subEn: `${servedForAge.length}/${ageCustomers.length} Customers`,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`p-3.5 rounded-2xl border text-start flex items-center gap-3 transition-all ${
                  isActive
                    ? 'bg-sky-900 text-white border-sky-900 shadow-sm'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-amber-300' : 'text-sky-900'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold truncate">
                    {lang === 'ar' ? tab.titleAr : tab.titleEn}
                  </p>
                  <p
                    className={`text-[11px] font-mono-num truncate ${
                      isActive ? 'text-sky-100' : 'text-slate-500'
                    }`}
                  >
                    {lang === 'ar' ? tab.subAr : tab.subEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* GAME 1: STORY BUILDER                                             */}
        {/* ================================================================= */}
        {activeTab === 'story' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-sky-900">
                  {lang === 'ar' ? activeAgeMeta.labelAr : activeAgeMeta.labelEn}
                </p>
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'ar'
                    ? 'اختر مغامرتك ثم ركّب أحداث القصة من 5 عناصر:'
                    : 'Pick an Adventure & Build Your 5-Part English Story:'}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {ageStories.map((tItem, i) => (
                  <button
                    key={tItem.id}
                    type="button"
                    onClick={() => selectStoryTemplate(i)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                      storyIdx === i
                        ? 'bg-sky-900 text-white border-sky-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'ar' ? tItem.titleAr : tItem.titleEn}{' '}
                    {savedStoryIds.includes(tItem.id) ? '✓' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* 5 Story Slot Pickers */}
              <div className="lg:col-span-6 space-y-3.5">
                {activeStory.slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2"
                  >
                    <p className="text-xs font-bold text-sky-950">
                      {lang === 'ar' ? slot.labelAr : slot.labelEn}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {slot.options.map((opt) => {
                        const isPicked = safePickedSlots[slot.id]?.en === opt.en;
                        return (
                          <button
                            key={opt.en}
                            type="button"
                            onClick={() => {
                              setPickedStorySlots((prev) => ({ ...prev, [slot.id]: opt }));
                              setStoryJustSaved(false);
                              handleSpeak(opt.en);
                            }}
                            className={`p-2.5 rounded-xl border text-start transition-all ${
                              isPicked
                                ? 'bg-sky-900 text-white border-sky-900 shadow-sm'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300'
                            }`}
                          >
                            <p dir="ltr" className="text-xs font-bold leading-snug">
                              {opt.en}
                            </p>
                            <p
                              className={`text-[11px] mt-0.5 ${
                                isPicked ? 'text-sky-100' : 'text-slate-500'
                              }`}
                            >
                              {opt.ar}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Illustrated Story Output + Mic Speaking Coach */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-700">
                      {lang === 'ar' ? activeStory.titleAr : activeStory.titleEn}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowStoryAr((s) => !s)}
                      className="text-xs font-semibold text-sky-900 hover:underline"
                    >
                      {showStoryAr
                        ? lang === 'ar'
                          ? 'إخفاء الترجمة العربية'
                          : 'Hide Arabic Translation'
                        : lang === 'ar'
                        ? 'إظهار الترجمة العربية'
                        : 'Show Arabic Translation'}
                    </button>
                  </div>

                  <div
                    dir="ltr"
                    className="bg-white border border-slate-200 rounded-xl p-5 text-base font-medium text-slate-900 leading-relaxed"
                  >
                    {builtStoryEn}
                  </div>

                  {showStoryAr && (
                    <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 text-sm text-sky-950 leading-relaxed">
                      {builtStoryAr}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        isSpeaking
                          ? (stopEnglishSpeech(), setIsSpeaking(false))
                          : handleSpeak(builtStoryEn)
                      }
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 transition-colors"
                    >
                      {isSpeaking ? (
                        <>
                          <Square className="w-4 h-4 fill-white" />
                          <span>{lang === 'ar' ? 'إيقاف القراءة' : 'Stop Reading'}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          <span>
                            {lang === 'ar' ? 'استمع لقصتك بالإنجليزي' : 'Listen to Story'}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playSoftFeedbackTone('win');
                        setSavedStoryIds((prev) =>
                          prev.includes(activeStory.id) ? prev : [...prev, activeStory.id]
                        );
                        setStoryJustSaved(true);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 transition-colors"
                    >
                      <Award className="w-4 h-4 text-amber-300" />
                      <span>
                        {storyJustSaved
                          ? lang === 'ar'
                            ? 'تم اعتماد القصة ✓'
                            : 'Story Saved ✓'
                          : lang === 'ar'
                          ? 'اعتماد القصة وكسب الشارة'
                          : 'Save Story & Earn Badge'}
                      </span>
                    </button>
                  </div>
                </div>

                {renderMicStudio(
                  builtStoryEn,
                  `story-${activeStory.id}`,
                  'تحدّي القراءة بالميكروفون: اقرأ قصتك بصوتك واحصل على +5 نجوم!',
                  'Mic Reading Challenge: Read your story aloud for +5 Stars!'
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* GAME 2: WORD & CLUE DETECTIVE                                     */}
        {/* ================================================================= */}
        {activeTab === 'detective' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-sky-900">
                  {lang === 'ar' ? activeAgeMeta.labelAr : activeAgeMeta.labelEn} ·{' '}
                  {lang === 'ar' ? currentCase.categoryAr : currentCase.categoryEn} ·{' '}
                  <span className="font-mono-num">
                    {caseIdx + 1} / {ageCases.length}
                  </span>
                </p>
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'ar'
                    ? 'اقرأ واستمع للأدلة الإنجليزية الـ 3 واكتشف الكلمة المقصودة:'
                    : 'Read & Listen to the 3 Clues to Solve the Mystery Word:'}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSpeak(currentCase.cluesEn.join(' '))}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 whitespace-nowrap"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'استمع للأدلة كاملة' : 'Hear All Clues'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCaseHint((h) => !h)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100 whitespace-nowrap"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'مساعدة بالعربي' : 'Hint'}</span>
                </button>
              </div>
            </div>

            {/* Case Quick Jump Strip (1..8) */}
            <div className="flex flex-wrap gap-1.5">
              {ageCases.map((c, idx) => {
                const isSolved = solvedCases.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCaseIdx(idx);
                      setPickedCaseOption(null);
                      setShowCaseHint(false);
                    }}
                    className={`px-3 py-1 text-xs font-mono-num font-bold rounded-lg border transition-colors ${
                      caseIdx === idx
                        ? 'bg-sky-900 text-white border-sky-900'
                        : isSolved
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    #{idx + 1} {isSolved ? '✓' : ''}
                  </button>
                );
              })}
            </div>

            <div dir="ltr" className="space-y-2.5 bg-slate-900 text-slate-100 rounded-2xl p-5 sm:p-6">
              {currentCase.cluesEn.map((clue, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 text-sm sm:text-base">
                  <span>{clue}</span>
                  <button
                    type="button"
                    onClick={() => handleSpeak(clue)}
                    className="p-1.5 text-sky-300 hover:text-white shrink-0"
                    aria-label="Speak clue"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {showCaseHint && (
              <p className="text-xs sm:text-sm text-sky-950 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
                {currentCase.extraHintAr}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentCase.options.map((opt, idx) => {
                const isPicked = pickedCaseOption === idx;
                const isRight = idx === currentCase.correctIndex;
                let style = 'bg-slate-50 border-slate-200 text-slate-900 hover:border-sky-400';
                if (pickedCaseOption !== null) {
                  if (isRight) style = 'bg-emerald-50 border-emerald-500 text-emerald-950';
                  else if (isPicked) style = 'bg-rose-50 border-rose-500 text-rose-950';
                  else style = 'bg-slate-50 border-slate-200 text-slate-400';
                }
                return (
                  <button
                    key={opt.word}
                    type="button"
                    disabled={pickedCaseOption !== null}
                    onClick={() => handleDetectivePick(idx)}
                    className={`p-4 rounded-2xl border-2 text-center space-y-1 transition-all ${style}`}
                  >
                    <p dir="ltr" className="text-base sm:text-lg font-bold">
                      {opt.word}
                    </p>
                    <p dir="ltr" className="text-[11px] font-mono-num text-slate-500">
                      {opt.phonetic}
                    </p>
                    {pickedCaseOption !== null && (
                      <p className="text-xs font-semibold pt-1">{opt.ar}</p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Voice Guessing BEFORE clicking an option */}
            {pickedCaseOption === null && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-emerald-700" />
                      <span>
                        {lang === 'ar'
                          ? 'هل عرفت الكلمة؟ انطقها الآن بالميكروفون ليختارها النظام لك تلقائياً!'
                          : 'Know the word? Say it into the microphone to pick it by voice!'}
                      </span>
                    </p>
                    {micTranscript && micTargetText === currentCase.options[currentCase.correctIndex].word && (
                      <p className="text-xs text-emerald-800">
                        {lang === 'ar' ? 'ما سمعه الميكروفون:' : 'Mic Heard:'}{' '}
                        <strong dir="ltr">{micTranscript}</strong>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void startSpeakingPractice(
                        currentCase.options[currentCase.correctIndex].word,
                        `det-voice-guess-${currentCase.id}`,
                        (spokenText) => {
                          let bestOptionIdx = -1;
                          let bestScore = 0;
                          currentCase.options.forEach((opt, i) => {
                            const ev = evaluateSpokenEnglish(opt.word, spokenText);
                            if (ev.accuracyPercent > bestScore) {
                              bestScore = ev.accuracyPercent;
                              bestOptionIdx = i;
                            }
                          });
                          if (bestOptionIdx !== -1 && bestScore >= 60) {
                            handleDetectivePick(bestOptionIdx);
                          }
                        }
                      )
                    }
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                      micListening && micTargetText === currentCase.options[currentCase.correctIndex].word
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-emerald-700 text-white hover:bg-emerald-600'
                    }`}
                  >
                    {micListening && micTargetText === currentCase.options[currentCase.correctIndex].word ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'انطق الكلمة الآن...' : 'Speak Word Now...'}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span>{lang === 'ar' ? 'أجب بصوتك بالميكروفون' : 'Answer by Voice'}</span>
                      </>
                    )}
                  </button>
                </div>

                {micErrorAr && micTargetText === currentCase.options[currentCase.correctIndex].word && (
                  <p className="text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2">
                    {micErrorAr}
                  </p>
                )}
              </div>
            )}

            {pickedCaseOption !== null && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {pickedCaseOption === currentCase.correctIndex ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-emerald-800">
                          {lang === 'ar'
                            ? `محقق ذكي! الإجابة الصحيحة: ${currentCase.options[currentCase.correctIndex].word} (${currentCase.options[currentCase.correctIndex].ar})`
                            : `Case Solved! Answer: ${currentCase.options[currentCase.correctIndex].word}`}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-600" />
                        <span className="text-rose-800">
                          {lang === 'ar'
                            ? `الإجابة الصحيحة هي: ${currentCase.options[currentCase.correctIndex].word} (${currentCase.options[currentCase.correctIndex].ar})`
                            : `Correct answer: ${currentCase.options[currentCase.correctIndex].word}`}
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={nextDetectiveCase}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'القضية التالية' : 'Next Case'}</span>
                  </button>
                </div>

                {renderMicStudio(
                  currentCase.options[currentCase.correctIndex].word,
                  `det-mic-${currentCase.id}`,
                  'تحدّي نطق الكلمة الصحيحة بالميكروفون:',
                  'Practice Pronouncing the Mystery Word:'
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* GAME 3: SENTENCE SCRAMBLE RACE                                    */}
        {/* ================================================================= */}
        {activeTab === 'scramble' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-sky-900">
                  {lang === 'ar' ? activeAgeMeta.labelAr : activeAgeMeta.labelEn} ·{' '}
                  {currentSentence.levelLabelEn} ·{' '}
                  <span className="font-mono-num">
                    {sentIdx + 1} / {ageSentences.length}
                  </span>
                </p>
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'ar'
                    ? `رتّب الكلمات لتكوين الجملة الإنجليزية: «${currentSentence.meaningAr}»`
                    : `Build the English Sentence: "${currentSentence.meaningAr}"`}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-num font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{scrambleTimerSec}s</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleSpeak(currentSentence.words.join(' '))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-sky-900 rounded-lg hover:bg-sky-800"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'استمع للجملة' : 'Hear Sentence'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGrammarTip((g) => !g)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'قاعدة سريعة' : 'Grammar Tip'}</span>
                </button>
              </div>
            </div>

            {/* Sentence Quick Jump Strip (1..8) */}
            <div className="flex flex-wrap gap-1.5">
              {ageSentences.map((s, idx) => {
                const isSolved = solvedSentences.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectSentencePuzzle(idx)}
                    className={`px-3 py-1 text-xs font-mono-num font-bold rounded-lg border transition-colors ${
                      sentIdx === idx
                        ? 'bg-sky-900 text-white border-sky-900'
                        : isSolved
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    #{idx + 1} {isSolved ? '✓' : ''}
                  </button>
                );
              })}
            </div>

            {showGrammarTip && (
              <p
                dir="ltr"
                className="text-xs sm:text-sm text-sky-950 bg-sky-50 border border-sky-200 rounded-xl px-4 py-2.5 font-medium"
              >
                Tip: {currentSentence.grammarTipEn}
              </p>
            )}

            {/* Sentence Assembly Tray */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600">
                {lang === 'ar'
                  ? 'مساحة تركيب الجملة (اضغط على الكلمة لإزالتها):'
                  : 'Your Sentence (click a word to remove it):'}
              </p>
              <div
                dir="ltr"
                className={`min-h-[76px] p-4 rounded-2xl border-2 border-dashed flex flex-wrap items-center gap-2 transition-colors ${
                  scrambleFeedback === 'ok'
                    ? 'bg-emerald-50 border-emerald-400'
                    : scrambleFeedback === 'wrong'
                    ? 'bg-rose-50 border-rose-400'
                    : 'bg-slate-50 border-slate-300'
                }`}
              >
                {placedTokens.length === 0 ? (
                  <span className="text-xs text-slate-400">
                    Tap the English word tiles below in the right order...
                  </span>
                ) : (
                  placedTokens.map((tok) => (
                    <button
                      key={tok.id}
                      type="button"
                      onClick={() => handleRemoveToken(tok.id)}
                      className="px-3.5 py-2 text-sm font-bold bg-sky-900 text-white rounded-xl hover:bg-sky-800 transition-colors"
                    >
                      {tok.word}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Word Bank */}
            <div dir="ltr" className="flex flex-wrap items-center gap-2.5">
              {availableTokens.map((tok) => (
                <button
                  key={tok.id}
                  type="button"
                  onClick={() => handlePlaceToken(tok.id)}
                  className="px-4 py-2.5 text-sm font-bold bg-white text-slate-900 border border-slate-300 rounded-xl hover:border-sky-700 hover:bg-sky-50 transition-colors"
                >
                  {tok.word}
                </button>
              ))}
            </div>

            {/* Action Buttons & Feedback */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={placedTokens.length === 0 || scrambleFeedback === 'ok'}
                  onClick={handleCheckSentence}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 disabled:opacity-50"
                >
                  {lang === 'ar' ? 'تحقق من الجملة' : 'Check Sentence'}
                </button>
                <button
                  type="button"
                  onClick={handleHintNextWord}
                  className="px-4 py-2.5 text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100"
                >
                  {lang === 'ar' ? 'تلميح: الكلمة التالية' : 'Place Next Word'}
                </button>
                <button
                  type="button"
                  onClick={() => selectSentencePuzzle(sentIdx)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'إعادة' : 'Reset'}</span>
                </button>
              </div>

              {scrambleFeedback === 'ok' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-bold text-emerald-700">
                    {lang === 'ar' ? 'جملة صحيحة 100%!' : 'Perfect Sentence!'}
                  </span>
                  <button
                    type="button"
                    onClick={() => selectSentencePuzzle((sentIdx + 1) % ageSentences.length)}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800"
                  >
                    {lang === 'ar' ? 'الجملة التالية' : 'Next Sentence'}
                  </button>
                </div>
              )}

              {scrambleFeedback === 'wrong' && (
                <span className="text-xs font-semibold text-rose-700">
                  {lang === 'ar'
                    ? 'الترتيب يحتاج تعديلاً بسيطاً — اضغط على أي كلمة لإعادتها!'
                    : 'Not quite! Tap any word in the tray to adjust order.'}
                </span>
              )}
            </div>

            {renderMicStudio(
              currentSentence.words.join(' '),
              `sent-mic-${currentSentence.id}`,
              'اقرأ الجملة الإنجليزية بصوتك بالميكروفون:',
              'Speak This Full Sentence with Mic:'
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* GAME 4: CAFE & TOY SHOP ROLEPLAY MINI-GAME                        */}
        {/* ================================================================= */}
        {activeTab === 'roleplay' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-emerald-700">
                  {lang === 'ar' ? activeAgeMeta.labelAr : activeAgeMeta.labelEn} ·{' '}
                  {currentCustomer.customerRoleAr}
                </p>
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'ar'
                    ? 'جهّز طلب الزبون في الصينية واختر الرد الإنجليزي المهذب مع الحساب الصحيح:'
                    : 'Prepare the Tray & Pick the Polite English Reply:'}
                </h3>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {ageCustomers.map((cust, i) => {
                  const served = servedCustomerIds.includes(cust.id);
                  return (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => selectCustomer(i)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                        custIdx === i
                          ? 'bg-sky-900 text-white border-sky-900'
                          : served
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cust.customerName} {served ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer Dialogue Card */}
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <p dir="ltr" className="text-base sm:text-lg font-bold text-sky-950">
                  {currentCustomer.speechEn}
                </p>
                <p className="text-xs sm:text-sm text-sky-900/80">{currentCustomer.speechAr}</p>
              </div>
              <button
                type="button"
                onClick={() => handleSpeak(currentCustomer.speechEn)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 whitespace-nowrap shrink-0 self-start sm:self-center"
              >
                <Volume2 className="w-4 h-4" />
                <span>{lang === 'ar' ? 'اسمع طلب الزبون' : 'Hear Customer'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* 10-Item Shelf Menu + Tray Quantities */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    {lang === 'ar' ? '1. قائمة المتجر والكافيه:' : '1. Store & Cafe Menu:'}
                  </h4>
                  <span className="text-xs font-mono-num font-bold text-emerald-800">
                    {lang === 'ar' ? 'حساب الصينية:' : 'Tray Total:'} ${traySubtotal}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ROLEPLAY_MENU.map((prod) => {
                    const qty = trayCounts[prod.id] || 0;
                    return (
                      <div
                        key={prod.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                          qty > 0
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <p dir="ltr" className="text-xs font-bold text-slate-900 truncate">
                            {prod.nameEn}{' '}
                            <span className="font-mono-num text-emerald-700">${prod.price}</span>
                          </p>
                          <p className="text-[11px] text-slate-500">{prod.nameAr}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => adjustTrayItem(prod.id, -1)}
                            disabled={qty === 0 || roleplayFeedback.type === 'win'}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                            aria-label={`Remove ${prod.nameEn}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center text-xs font-mono-num font-bold text-slate-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustTrayItem(prod.id, 1)}
                            disabled={roleplayFeedback.type === 'win'}
                            className="w-7 h-7 rounded-lg bg-sky-900 text-white flex items-center justify-center hover:bg-sky-800 disabled:opacity-40"
                            aria-label={`Add ${prod.nameEn}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Polite English Reply Picker & Serve + Mic Speaking */}
              <div className="lg:col-span-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-900">
                  {lang === 'ar'
                    ? '2. اختر الرد الإنجليزي المهذب والسعر الصحيح:'
                    : '2. Choose the Polite English Reply & Price:'}
                </h4>

                <div dir="ltr" className="space-y-2.5">
                  {currentCustomer.replyChoices.map((reply, idx) => {
                    const isPicked = pickedReplyIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={roleplayFeedback.type === 'win'}
                        onClick={() => {
                          setPickedReplyIdx(idx);
                          setRoleplayFeedback({ type: 'idle', textAr: '', textEn: '' });
                          handleSpeak(reply.textEn);
                        }}
                        className={`w-full p-3.5 rounded-xl border-2 text-start text-xs sm:text-sm font-medium transition-all ${
                          isPicked
                            ? 'border-sky-900 bg-sky-50 text-sky-950 font-semibold'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300'
                        }`}
                      >
                        {reply.textEn}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={roleplayFeedback.type === 'win'}
                    onClick={handleServeCustomer}
                    className="flex-1 px-6 py-3 text-xs sm:text-sm font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    {lang === 'ar' ? 'تسليم الطلب للزبون' : 'Serve Customer'}
                  </button>

                  {roleplayFeedback.type === 'win' && (
                    <button
                      type="button"
                      onClick={() => selectCustomer((custIdx + 1) % ageCustomers.length)}
                      className="px-5 py-3 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800"
                    >
                      {lang === 'ar' ? 'الزبون التالي' : 'Next Customer'}
                    </button>
                  )}
                </div>

                {roleplayFeedback.type !== 'idle' && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium ${
                      roleplayFeedback.type === 'win'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    {lang === 'ar' ? roleplayFeedback.textAr : roleplayFeedback.textEn}
                  </div>
                )}

                {renderMicStudio(
                  pickedReplyIdx !== null
                    ? currentCustomer.replyChoices[pickedReplyIdx].textEn
                    : currentCustomer.speechEn,
                  `role-mic-${currentCustomer.id}`,
                  pickedReplyIdx !== null
                    ? 'انطق الرد الذي اخترته بصوتك بالميكروفون:'
                    : 'اقرأ طلب الزبون بالإنجليزي أو اختر ردك للتدريب بالميكروفون:',
                  pickedReplyIdx !== null
                    ? 'Speak Your Selected Reply with Mic:'
                    : 'Practice Reading Customer Dialogue or Pick a Reply First:'
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Personalized English Play Zone A4 PDF Certificate Modal */}
      {certModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-5 sm:p-7 space-y-5 shadow-xl my-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>
                    {lang === 'ar'
                      ? 'شهادة مجانية بالشارات والمستوى جاهزة للطباعة (A4 PDF)'
                      : 'Free Printable A4 PDF Certificate & Earned Badges'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {lang === 'ar'
                    ? 'اكتب اسم الطفل وحمّل شهادة ألعاب الإنجليزي كملف PDF مجاناً'
                    : 'Enter Student Name & Download Free PDF Certificate'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCertModalOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex-1 space-y-1.5">
                <label
                  htmlFor="english-cert-student-name"
                  className="block text-xs font-semibold text-slate-700"
                >
                  {lang === 'ar' ? 'اسم الطفل / الطالب على الشهادة:' : 'Name Printed on Certificate:'}
                </label>
                <input
                  id="english-cert-student-name"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: Youssef Ahmed أو يوسف أحمد' : 'e.g. Youssef Ahmed'}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <button
                type="button"
                disabled={downloadingPdf}
                onClick={handleDownloadCertificate}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloadingPdf
                    ? lang === 'ar'
                      ? 'جاري تجهيز PDF...'
                      : 'Building PDF...'
                    : lang === 'ar'
                    ? 'تنزيل الشهادة PDF مجاناً'
                    : 'Download Free PDF'}
                </span>
              </button>
            </div>

            <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center justify-center">
              {certPreviewUrl ? (
                <img
                  src={certPreviewUrl}
                  alt={lang === 'ar' ? 'معاينة شهادة ألعاب الإنجليزي' : 'English Games Certificate Preview'}
                  className="w-full max-h-[58vh] object-contain rounded-lg shadow-sm border border-slate-200 bg-white"
                />
              ) : (
                <div className="py-16 text-xs text-slate-500">
                  {lang === 'ar' ? 'جاري تصميم الشهادة...' : 'Rendering certificate preview...'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
