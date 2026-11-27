import { useEffect, useId, useMemo, useState } from 'react';
import {
  Award,
  Brain,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Grid3X3,
  HeartHandshake,
  HelpCircle,
  RotateCcw,
  Trophy,
  X,
  XCircle,
} from 'lucide-react';
import type { AcademySettings, Lang } from '../types';
import {
  IQ_QUESTIONS,
  type IqAgeGroup,
  type IqCognitiveDomain,
  type IqPuzzleKind,
  type IqQuestion,
  type VisualGlyph,
} from '../data/iqTests';
import { PSYCH_ASSESSMENTS, type PsychAssessment } from '../data/psychTests';
import {
  downloadIqCertificatePdf,
  renderIqCertificateCanvas,
  type IqCertificateData,
} from '../utils/iqCertificatePdf';

interface IqChallengeSectionProps {
  lang: Lang;
  settings: AcademySettings;
}

type LabMode = 'iq' | 'psych' | 'memory';

function IqGlyphSvg({ glyph, size = 76 }: { glyph: VisualGlyph; size?: number }) {
  const color = glyph.color || '#0c4a6e';
  const rawId = useId();
  const patternId = `stripe-${rawId.replace(/:/g, '')}`;

  if (glyph.label) {
    return (
      <div
        style={{ width: size, height: size, color }}
        className="flex items-center justify-center font-bold font-mono-num text-2xl sm:text-3xl select-none"
      >
        {glyph.label}
      </div>
    );
  }

  if (glyph.clock) {
    const { hour, minute } = glyph.clock;
    const minAngle = minute * 6;
    const hourAngle = ((hour % 12) + minute / 60) * 30;
    return (
      <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="32" fill="#ffffff" stroke={color} strokeWidth="3.5" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <line
            key={deg}
            x1="40"
            y1="11"
            x2="40"
            y2={deg % 90 === 0 ? '16' : '13.5'}
            stroke={color}
            strokeWidth={deg % 90 === 0 ? '2.5' : '1.4'}
            strokeLinecap="round"
            transform={`rotate(${deg} 40 40)`}
          />
        ))}
        <line
          x1="40"
          y1="40"
          x2="40"
          y2="22"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          transform={`rotate(${hourAngle} 40 40)`}
        />
        <line
          x1="40"
          y1="40"
          x2="40"
          y2="15"
          stroke="#b45309"
          strokeWidth="2.4"
          strokeLinecap="round"
          transform={`rotate(${minAngle} 40 40)`}
        />
        <circle cx="40" cy="40" r="3" fill={color} />
      </svg>
    );
  }

  if (glyph.gridDots) {
    const activeSet = new Set(glyph.gridDots);
    const coords = [18, 40, 62];
    return (
      <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
        <rect x="6" y="6" width="68" height="68" rx="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => {
            const idx = r * 3 + c;
            const isActive = activeSet.has(idx);
            return (
              <circle
                key={idx}
                cx={coords[c]}
                cy={coords[r]}
                r={isActive ? 7.5 : 3.5}
                fill={isActive ? color : '#cbd5e1'}
              />
            );
          })
        )}
      </svg>
    );
  }

  const count = glyph.count || 1;
  const fillMode = glyph.fill || 'solid';
  const fillAttr =
    fillMode === 'solid' ? color : fillMode === 'striped' ? `url(#${patternId})` : '#ffffff';
  const strokeWidth = fillMode === 'outline' ? 3.5 : 2.5;
  const rotation = glyph.rotation || 0;

  const renderShapeAt = (cx: number, cy: number, scale: number, keyIdx: number) => {
    const transform = `translate(${cx}, ${cy}) rotate(${rotation}) scale(${scale})`;
    switch (glyph.shape) {
      case 'circle':
        return (
          <circle
            key={keyIdx}
            cx={0}
            cy={0}
            r={24}
            fill={fillAttr}
            stroke={color}
            strokeWidth={strokeWidth}
            transform={transform}
          />
        );
      case 'square':
        return (
          <rect
            key={keyIdx}
            x={-21}
            y={-21}
            width={42}
            height={42}
            rx={5}
            fill={fillAttr}
            stroke={color}
            strokeWidth={strokeWidth}
            transform={transform}
          />
        );
      case 'triangle':
        return (
          <polygon
            key={keyIdx}
            points="0,-24 22,19 -22,19"
            fill={fillAttr}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            transform={transform}
          />
        );
      case 'diamond':
        return (
          <polygon
            key={keyIdx}
            points="0,-25 23,0 0,25 -23,0"
            fill={fillAttr}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            transform={transform}
          />
        );
      case 'hexagon':
        return (
          <polygon
            key={keyIdx}
            points="0,-25 22,-12 22,12 0,25 -22,12 -22,-12"
            fill={fillAttr}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            transform={transform}
          />
        );
      case 'star':
        return (
          <polygon
            key={keyIdx}
            points="0,-25 7,-9 24,-8 11,4 15,21 0,12 -15,21 -11,4 -24,-8 -7,-9"
            fill={fillAttr}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            transform={transform}
          />
        );
      case 'arrow':
        return (
          <polygon
            key={keyIdx}
            points="0,-26 20,-4 9,-4 9,24 -9,24 -9,-4 -20,-4"
            fill={fillAttr}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            transform={transform}
          />
        );
      default:
        return null;
    }
  };

  const positions: Record<number, Array<[number, number, number]>> = {
    1: [[40, 40, 1]],
    2: [
      [23, 40, 0.56],
      [57, 40, 0.56],
    ],
    3: [
      [40, 21, 0.46],
      [22, 56, 0.46],
      [58, 56, 0.46],
    ],
    4: [
      [23, 23, 0.44],
      [57, 23, 0.44],
      [23, 57, 0.44],
      [57, 57, 0.44],
    ],
  };

  const innerDotCoords: Record<number, Array<[number, number]>> = {
    1: [[40, 42]],
    2: [
      [33, 40],
      [47, 40],
    ],
    3: [
      [40, 35],
      [33, 48],
      [47, 48],
    ],
    4: [
      [33, 33],
      [47, 33],
      [33, 47],
      [47, 47],
    ],
  };

  const dotFill = fillMode === 'outline' ? color : '#ffffff';

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <defs>
        <pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="#ffffff" />
          <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="3" />
        </pattern>
      </defs>
      {(positions[count] || positions[1]).map(([cx, cy, sc], idx) => renderShapeAt(cx, cy, sc, idx))}
      {glyph.innerDots &&
        (innerDotCoords[glyph.innerDots] || []).map(([dx, dy], idx) => (
          <circle key={`dot-${idx}`} cx={dx} cy={dy} r="3.4" fill={dotFill} />
        ))}
    </svg>
  );
}

interface MemoryRoundConfig {
  gridSize: 3 | 4;
  targetCount: number;
  previewMs: number;
}

const MEMORY_ROUNDS: MemoryRoundConfig[] = [
  { gridSize: 3, targetCount: 3, previewMs: 1800 },
  { gridSize: 3, targetCount: 4, previewMs: 2000 },
  { gridSize: 4, targetCount: 5, previewMs: 2200 },
  { gridSize: 4, targetCount: 6, previewMs: 2400 },
];

function generateRandomTiles(gridSize: number, count: number): number[] {
  const pool = Array.from({ length: gridSize * gridSize }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function IqChallengeSection({ lang, settings }: IqChallengeSectionProps) {
  const [labMode, setLabMode] = useState<LabMode>('iq');
  const [participantName, setParticipantName] = useState('');
  const [certModalMode, setCertModalMode] = useState<LabMode | null>(null);
  const [certPreviewUrl, setCertPreviewUrl] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // --- Mode 1: IQ & Logic Tests State ---
  const [ageGroup, setAgeGroup] = useState<IqAgeGroup>('kids');
  const [styleFilter, setStyleFilter] = useState<'all' | IqPuzzleKind>('all');
  const [timedMode, setTimedMode] = useState(false);

  const activeQuestions: IqQuestion[] = useMemo(() => {
    const byAge = IQ_QUESTIONS.filter((q) => q.ageGroup === ageGroup);
    if (styleFilter === 'all') return byAge;
    return byAge.filter((q) => q.kind === styleFilter);
  }, [ageGroup, styleFilter]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (!timerActive || finished || labMode !== 'iq') return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerActive, finished, labMode]);

  const resetTest = (nextAge?: IqAgeGroup, nextStyle?: 'all' | IqPuzzleKind) => {
    if (nextAge) setAgeGroup(nextAge);
    if (nextStyle) setStyleFilter(nextStyle);
    setCurrentIdx(0);
    setAnswers({});
    setShowHint(false);
    setFinished(false);
    setElapsedSeconds(0);
    setTimerActive(false);
    setShowReview(false);
  };

  const currentQuestion = activeQuestions[currentIdx] || activeQuestions[0];
  const selectedForCurrent = currentQuestion ? answers[currentQuestion.id] : undefined;
  const answeredCount = activeQuestions.filter((q) => answers[q.id] !== undefined).length;

  const handleSelectOption = (optionIdx: number) => {
    if (!currentQuestion || finished) return;
    if (!timerActive) setTimerActive(true);
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIdx }));
  };

  const handleNextOrFinish = () => {
    if (currentIdx + 1 < activeQuestions.length) {
      setCurrentIdx((i) => i + 1);
      setShowHint(false);
    } else {
      setFinished(true);
      setTimerActive(false);
    }
  };

  const scoreMetrics = useMemo(() => {
    const total = activeQuestions.length || 1;
    let correct = 0;
    const domains: Record<IqCognitiveDomain, { correct: number; total: number }> = {
      pattern: { correct: 0, total: 0 },
      logic: { correct: 0, total: 0 },
      numerical: { correct: 0, total: 0 },
      spatial: { correct: 0, total: 0 },
    };

    activeQuestions.forEach((q) => {
      domains[q.domain].total += 1;
      if (answers[q.id] === q.correctIndex) {
        correct += 1;
        domains[q.domain].correct += 1;
      }
    });

    const pct = Math.round((correct / total) * 100);
    const speedBonus = timedMode && elapsedSeconds < total * 20 && pct >= 75 ? 4 : 0;
    const estimatedIq = Math.min(142, Math.max(82, Math.round(82 + pct * 0.56 + speedBonus)));

    let bandAr = 'بداية رائعة للتدريب والتفكير';
    let bandEn = 'Great Starting Warm-Up';
    if (pct >= 88) {
      bandAr = 'أداء استثنائي · تفكير تحليلي متفوق';
      bandEn = 'Exceptional Analytical Score';
    } else if (pct >= 70) {
      bandAr = 'ذكاء مرتفع · ملاحظة منطقية قوية';
      bandEn = 'High Cognitive Reasoning';
    } else if (pct >= 50) {
      bandAr = 'مستوى متوازن وجيد جداً';
      bandEn = 'Solid Balanced Reasoning';
    }

    return { total, correct, pct, estimatedIq, domains, bandAr, bandEn };
  }, [activeQuestions, answers, timedMode, elapsedSeconds]);

  // --- Mode 2: Psychological & Educational Tests State ---
  const [selectedPsychId, setSelectedPsychId] = useState<PsychAssessment['id']>('learning_style');
  const activePsych = useMemo(
    () => PSYCH_ASSESSMENTS.find((p) => p.id === selectedPsychId) || PSYCH_ASSESSMENTS[0],
    [selectedPsychId]
  );
  const [psychIdx, setPsychIdx] = useState(0);
  const [psychAnswers, setPsychAnswers] = useState<Record<string, number>>({});
  const [psychFinished, setPsychFinished] = useState(false);

  const resetPsych = (nextId?: PsychAssessment['id']) => {
    if (nextId) setSelectedPsychId(nextId);
    setPsychIdx(0);
    setPsychAnswers({});
    setPsychFinished(false);
  };

  const currentPsychQ = activePsych.questions[psychIdx] || activePsych.questions[0];
  const selectedPsychOpt = currentPsychQ ? psychAnswers[currentPsychQ.id] : undefined;

  const psychResult = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(activePsych.traits).forEach((k) => {
      counts[k] = 0;
    });
    let totalPicked = 0;
    activePsych.questions.forEach((q) => {
      const optIdx = psychAnswers[q.id];
      if (optIdx !== undefined && q.options[optIdx]) {
        const tId = q.options[optIdx].traitId;
        counts[tId] = (counts[tId] || 0) + (q.options[optIdx].points ?? 1);
        totalPicked += q.options[optIdx].points ?? 1;
      }
    });
    const sorted = Object.keys(activePsych.traits)
      .map((id) => ({
        trait: activePsych.traits[id],
        score: counts[id] || 0,
        pct: totalPicked > 0 ? Math.round(((counts[id] || 0) / totalPicked) * 100) : 0,
      }))
      .sort((a, b) => b.score - a.score);

    return { top: sorted[0], breakdown: sorted };
  }, [activePsych, psychAnswers]);

  const handleDownloadPsychReport = () => {
    setCertModalMode('psych');
  };

  // --- Mode 3: Visual Memory & Focus Challenge State ---
  const [memRoundIdx, setMemRoundIdx] = useState(0);
  const [memPhase, setMemPhase] = useState<'ready' | 'memorize' | 'recall' | 'round_done' | 'all_done'>('ready');
  const [memTargets, setMemTargets] = useState<number[]>([]);
  const [memPicked, setMemPicked] = useState<number[]>([]);
  const [memTotalHits, setMemTotalHits] = useState(0);
  const [memTotalTargets, setMemTotalTargets] = useState(0);

  const startMemoryRound = (idx: number) => {
    const cfg = MEMORY_ROUNDS[idx];
    const generated = generateRandomTiles(cfg.gridSize, cfg.targetCount);
    setMemRoundIdx(idx);
    setMemTargets(generated);
    setMemPicked([]);
    setMemPhase('memorize');
  };

  useEffect(() => {
    if (memPhase !== 'memorize') return;
    const cfg = MEMORY_ROUNDS[memRoundIdx];
    const tId = setTimeout(() => setMemPhase('recall'), cfg.previewMs);
    return () => clearTimeout(tId);
  }, [memPhase, memRoundIdx]);

  const handleMemoryTileClick = (tileIdx: number) => {
    if (memPhase !== 'recall') return;
    if (memPicked.includes(tileIdx)) return;
    const nextPicked = [...memPicked, tileIdx];
    setMemPicked(nextPicked);

    const cfg = MEMORY_ROUNDS[memRoundIdx];
    if (nextPicked.length >= cfg.targetCount) {
      const hits = nextPicked.filter((t) => memTargets.includes(t)).length;
      setMemTotalHits((prev) => prev + hits);
      setMemTotalTargets((prev) => prev + cfg.targetCount);
      if (memRoundIdx + 1 < MEMORY_ROUNDS.length) {
        setMemPhase('round_done');
      } else {
        setMemPhase('all_done');
      }
    }
  };

  const resetMemoryChallenge = () => {
    setMemRoundIdx(0);
    setMemPhase('ready');
    setMemTargets([]);
    setMemPicked([]);
    setMemTotalHits(0);
    setMemTotalTargets(0);
  };

  const kindLabel = (kind: IqPuzzleKind) => {
    if (lang === 'ar') {
      return kind === 'matrix'
        ? 'المصفوفات البصرية'
        : kind === 'odd'
        ? 'استخراج المختلف'
        : kind === 'sequence'
        ? 'المتتاليات والأنماط'
        : kind === 'spatial'
        ? 'التفكير المكاني والتدوير'
        : 'الاستنتاج والمنطق';
    }
    return kind === 'matrix'
      ? 'Visual Matrix'
      : kind === 'odd'
      ? 'Odd One Out'
      : kind === 'sequence'
      ? 'Sequences'
      : kind === 'spatial'
      ? 'Spatial & Rotation'
      : 'Logic Deduction';
  };

  const ageLabel = (ag: IqAgeGroup) => {
    if (lang === 'ar') {
      return ag === 'kids'
        ? 'الأطفال (5 – 9 سنوات)'
        : ag === 'juniors'
        ? 'الناشئين (10 – 14 سنة)'
        : 'الكبار والمعلمين (15+ سنة)';
    }
    return ag === 'kids'
      ? 'Kids (Ages 5–9)'
      : ag === 'juniors'
      ? 'Juniors (Ages 10–14)'
      : 'Adults & Teachers (15+)';
  };

  const domainLabel = (d: IqCognitiveDomain) => {
    if (lang === 'ar') {
      return d === 'pattern'
        ? 'الأنماط البصرية'
        : d === 'logic'
        ? 'الاستنتاج المنطقي'
        : d === 'numerical'
        ? 'الأرقام والتسلسل'
        : 'الإدراك المكاني';
    }
    return d === 'pattern'
      ? 'Visual Patterns'
      : d === 'logic'
      ? 'Logical Deduction'
      : d === 'numerical'
      ? 'Numerical Series'
      : 'Spatial Thinking';
  };

  const handleDownloadScoreReport = () => {
    setCertModalMode('iq');
  };

  const buildCertificatePayload = (mode: LabMode): IqCertificateData => {
    const cleanName =
      participantName.trim() || (lang === 'ar' ? 'بطل الذكاء والتركيز' : 'Brilliant Achiever');
    const brandName = settings.academyNameEn || 'LinguaCraft English Academy';

    if (mode === 'psych' && psychResult.top) {
      const tr = psychResult.top.trait;
      return {
        mode: 'psych',
        participantName: cleanName,
        academyName: brandName,
        logoDataUrl: settings.logoDataUrl,
        categoryBanner: `${activePsych.titleEn} · Educational Profile`,
        certificateTitle: 'Learning & Strengths Certificate',
        primaryHeadline: tr.labelEn,
        accentTheme: 'emerald',
        heroStats: [
          { label: 'PRIMARY MATCH', value: `${psychResult.top.pct}%` },
          {
            label: 'SECONDARY TRAIT',
            value: psychResult.breakdown[1]
              ? `${psychResult.breakdown[1].trait.labelEn.split(' ')[0]} (${psychResult.breakdown[1].pct}%)`
              : 'Balanced',
          },
        ],
        highlightsTitle: 'TOP PERSONALIZED RECOMMENDATIONS',
        highlights: tr.tipsEn.slice(0, 4).map((tip, i) => `${i + 1}. ${tip}`),
      };
    }

    if (mode === 'memory') {
      const memPct = Math.round((memTotalHits / Math.max(1, memTotalTargets)) * 100);
      return {
        mode: 'memory',
        participantName: cleanName,
        academyName: brandName,
        logoDataUrl: settings.logoDataUrl,
        categoryBanner: 'Visual Working Memory & Focus Lab',
        certificateTitle: 'Visual Memory Certificate',
        primaryHeadline:
          memTotalHits >= 15
            ? 'Exceptional Focus & Rapid Visual Recall'
            : memTotalHits >= 11
            ? 'Strong Working Memory & Attention'
            : 'Active Memory Training Milestone',
        accentTheme: 'amber',
        heroStats: [
          { label: 'TILES RECALLED', value: `${memTotalHits} / ${memTotalTargets || 18}` },
          { label: 'ACCURACY', value: `${memPct}%` },
          { label: 'PEAK GRID', value: '4 x 4 Matrix' },
        ],
        highlightsTitle: 'COGNITIVE MEMORY MILESTONES',
        highlights: [
          '• Level 1: 3x3 Matrix Quick Flash Recall (3 Tiles)',
          '• Level 2: 3x3 Pattern Retention (4 Tiles)',
          '• Level 3: 4x4 Spatial Working Memory (5 Tiles)',
          '• Level 4: 4x4 High-Focus Recall (6 Tiles)',
        ],
      };
    }

    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const ageEn =
      ageGroup === 'kids'
        ? 'Kids (Ages 5-9)'
        : ageGroup === 'juniors'
        ? 'Juniors (Ages 10-14)'
        : 'Adults & Educators (15+)';

    return {
      mode: 'iq',
      participantName: cleanName,
      academyName: brandName,
      logoDataUrl: settings.logoDataUrl,
      categoryBanner: `${ageEn} · Free IQ & Brain Challenge`,
      certificateTitle: 'Certificate of Cognitive Excellence',
      primaryHeadline: scoreMetrics.bandEn,
      accentTheme: 'navy',
      heroStats: [
        { label: 'PUZZLES SOLVED', value: `${scoreMetrics.correct} / ${scoreMetrics.total}` },
        { label: 'ACCURACY', value: `${scoreMetrics.pct}%` },
        {
          label: 'COGNITIVE INDEX',
          value: `${scoreMetrics.estimatedIq}${timedMode ? ` (${mins}:${String(secs).padStart(2, '0')})` : ''}`,
        },
      ],
      highlightsTitle: 'COGNITIVE DOMAIN BREAKDOWN',
      highlights: [
        `• Visual Patterns: ${scoreMetrics.domains.pattern.correct} / ${scoreMetrics.domains.pattern.total}`,
        `• Logical Deduction: ${scoreMetrics.domains.logic.correct} / ${scoreMetrics.domains.logic.total}`,
        `• Numerical Series: ${scoreMetrics.domains.numerical.correct} / ${scoreMetrics.domains.numerical.total}`,
        `• Spatial Thinking: ${scoreMetrics.domains.spatial.correct} / ${scoreMetrics.domains.spatial.total}`,
      ],
    };
  };

  useEffect(() => {
    if (!certModalMode) return;
    let active = true;
    const payload = buildCertificatePayload(certModalMode);
    void renderIqCertificateCanvas(payload)
      .then((canvas) => {
        if (active) setCertPreviewUrl(canvas.toDataURL('image/png'));
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [
    certModalMode,
    participantName,
    settings.academyNameEn,
    settings.logoDataUrl,
    ageGroup,
    scoreMetrics.correct,
    scoreMetrics.total,
    scoreMetrics.pct,
    scoreMetrics.estimatedIq,
    psychResult.top?.pct,
    memTotalHits,
    memTotalTargets,
  ]);

  const handleDownloadPdfCertificate = async () => {
    if (!certModalMode) return;
    setDownloadingPdf(true);
    try {
      await downloadIqCertificatePdf(buildCertificatePayload(certModalMode));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <section id="iq-tests" className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Heading */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <Brain className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'مجاني 100% · الاختبار + النتيجة الفورية + شهادة PDF باسم الطفل مجاناً بالكامل'
                  : '100% Free · Test + Instant Result + Printable PDF Certificate Included Free'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              {lang === 'ar'
                ? 'مختبر اختبارات الذكاء والاختبارات النفسية والذاكرة (مجاناً بالنتيجة والشهادة)'
                : 'Free IQ, Psychological & Visual Memory Lab (Free Instant Results & PDF)'}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              {lang === 'ar'
                ? 'جرّب مجاناً بدون تسجيل أو اشتراك: 36 لغز ذكاء بصري ومنطقي، و4 اختبارات نفسية وتربوية، وتحدي الذاكرة البصرية — وتظهر النتيجة والتقرير وشهادة PDF باسم الطفل فوراً ومجاناً!'
                : 'Try completely free with zero sign-up: 36 visual & logic IQ puzzles, 4 educational personality profiles, and a live visual memory game—unlock instant analysis and your PDF certificate free!'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder={lang === 'ar' ? 'اكتب اسم الطفل أو المتدرب للشهادة...' : 'Student name for certificate...'}
              aria-label={lang === 'ar' ? 'اسم الطفل للشهادة' : 'Student name for certificate'}
              className="px-3.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-sky-900"
            />
            {labMode === 'iq' && (
              <button
                type="button"
                onClick={() => setTimedMode((v) => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 ${
                  timedMode
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>
                  {timedMode
                    ? lang === 'ar'
                      ? 'مؤقت السرعة: مفعّل'
                      : 'Speed Timer: ON'
                    : lang === 'ar'
                    ? 'تفعيل مؤقت السرعة (اختياري)'
                    : 'Enable Speed Timer'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Main Lab Mode Switcher (3 Distinct Test Suites) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setLabMode('iq')}
            className={`p-4 rounded-2xl border text-start flex items-start gap-3 transition-all ${
              labMode === 'iq'
                ? 'bg-sky-900 text-white border-sky-900 shadow-sm'
                : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300'
            }`}
          >
            <Brain className={`w-5 h-5 mt-0.5 shrink-0 ${labMode === 'iq' ? 'text-amber-300' : 'text-sky-900'}`} />
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm font-bold">
                {lang === 'ar' ? '1. اختبارات الذكاء والمنطق (مجاني بالنتيجة)' : '1. Visual & Logic IQ (Free)'}
              </p>
              <p className={`text-xs ${labMode === 'iq' ? 'text-sky-100' : 'text-slate-500'}`}>
                {lang === 'ar'
                  ? '36 لغزاً · أطفال وناشئين وكبار · نتيجة فورية + شهادة مجانية'
                  : '36 puzzles · Kids, Juniors, Adults · Free result & PDF'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLabMode('psych')}
            className={`p-4 rounded-2xl border text-start flex items-start gap-3 transition-all ${
              labMode === 'psych'
                ? 'bg-sky-900 text-white border-sky-900 shadow-sm'
                : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300'
            }`}
          >
            <HeartHandshake className={`w-5 h-5 mt-0.5 shrink-0 ${labMode === 'psych' ? 'text-emerald-300' : 'text-emerald-700'}`} />
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm font-bold">
                {lang === 'ar' ? '2. الاختبارات النفسية والتربوية (مجاني)' : '2. Psychological Profiles (Free)'}
              </p>
              <p className={`text-xs ${labMode === 'psych' ? 'text-sky-100' : 'text-slate-500'}`}>
                {lang === 'ar'
                  ? '4 اختبارات · تحليل وتوصيات فورية + شهادة PDF مجاناً'
                  : '4 profiles · Instant analysis & recommendations PDF free'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLabMode('memory')}
            className={`p-4 rounded-2xl border text-start flex items-start gap-3 transition-all ${
              labMode === 'memory'
                ? 'bg-sky-900 text-white border-sky-900 shadow-sm'
                : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300'
            }`}
          >
            <Grid3X3 className={`w-5 h-5 mt-0.5 shrink-0 ${labMode === 'memory' ? 'text-amber-300' : 'text-amber-700'}`} />
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm font-bold">
                {lang === 'ar' ? '3. تحدي الذاكرة والتركيز (مجاني)' : '3. Visual Memory Game (Free)'}
              </p>
              <p className={`text-xs ${labMode === 'memory' ? 'text-sky-100' : 'text-slate-500'}`}>
                {lang === 'ar'
                  ? '4 مستويات · درجة فورية + شهادة مجانية باسم الطفل'
                  : '4 rounds · Instant score & free PDF certificate'}
              </p>
            </div>
          </button>
        </div>

        {/* ============================================================= */}
        {/* LAB MODE 1: VISUAL & LOGIC IQ PUZZLES                         */}
        {/* ============================================================= */}
        {labMode === 'iq' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
                {(['kids', 'juniors', 'adults'] as IqAgeGroup[]).map((ag) => (
                  <button
                    key={ag}
                    type="button"
                    onClick={() => resetTest(ag, 'all')}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      ageGroup === ag
                        ? 'bg-sky-900 text-white shadow-sm'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {ageLabel(ag)}
                  </button>
                ))}
              </div>

              <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => resetTest(undefined, 'all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    styleFilter === 'all'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {lang === 'ar' ? 'اختبار كامل (12 لغز)' : 'Full Mix (12)'}
                </button>
                {(['matrix', 'odd', 'sequence', 'spatial', 'logic'] as IqPuzzleKind[]).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => resetTest(undefined, kind)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      styleFilter === kind
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {kindLabel(kind)}
                  </button>
                ))}
              </div>
            </div>

            {!finished && currentQuestion ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-semibold text-sky-900">{ageLabel(ageGroup)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{kindLabel(currentQuestion.kind)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num font-semibold text-slate-900">
                      {currentIdx + 1} / {activeQuestions.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    {timedMode && (
                      <span className="font-mono-num font-semibold text-amber-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimer(elapsedSeconds)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowHint((h) => !h)}
                      className="inline-flex items-center gap-1.5 text-sky-900 font-semibold hover:underline"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'تلميح' : 'Hint'}</span>
                    </button>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{
                      width: `${Math.round(((currentIdx + 1) / Math.max(1, activeQuestions.length)) * 100)}%`,
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                    {lang === 'ar' ? currentQuestion.titleAr : currentQuestion.titleEn}
                  </h3>
                  {showHint && (
                    <p className="text-xs sm:text-sm text-sky-950 bg-sky-50 border border-sky-200 rounded-xl px-4 py-2.5">
                      {lang === 'ar' ? currentQuestion.hintAr : currentQuestion.hintEn}
                    </p>
                  )}
                </div>

                {currentQuestion.matrixCells && (
                  <div className="flex justify-center py-2">
                    <div
                      className={`grid gap-2.5 sm:gap-3 p-3 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl ${
                        currentQuestion.matrixCols === 2 ? 'grid-cols-2' : 'grid-cols-3'
                      }`}
                    >
                      {currentQuestion.matrixCells.map((cell, idx) => (
                        <div
                          key={idx}
                          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center ${
                            cell
                              ? 'bg-white border border-slate-200'
                              : 'bg-amber-50 border-2 border-dashed border-amber-400 text-amber-800 font-bold text-2xl font-mono-num'
                          }`}
                        >
                          {cell ? <IqGlyphSvg glyph={cell} size={74} /> : '?'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentQuestion.sequenceItems && (
                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 py-2">
                    {currentQuestion.sequenceItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white border border-slate-200 rounded-xl flex items-center justify-center">
                          <IqGlyphSvg glyph={item} size={72} />
                        </div>
                        <span className="text-slate-400 font-bold text-lg" aria-hidden="true">
                          →
                        </span>
                      </div>
                    ))}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-50 border-2 border-dashed border-amber-400 rounded-xl flex items-center justify-center text-amber-800 font-bold text-2xl font-mono-num">
                      ?
                    </div>
                  </div>
                )}

                {currentQuestion.targetGlyph && (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <span className="text-xs font-medium text-slate-500">
                      {lang === 'ar' ? 'الشكل المرجعي' : 'Reference Figure'}
                    </span>
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-50 border-2 border-sky-200 rounded-2xl flex items-center justify-center">
                      <IqGlyphSvg glyph={currentQuestion.targetGlyph} size={86} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
                  {currentQuestion.options.map((opt, oIdx) => {
                    const isSelected = selectedForCurrent === oIdx;
                    const letter = ['A', 'B', 'C', 'D'][oIdx];
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectOption(oIdx)}
                        className={`group relative min-h-[108px] p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                          isSelected
                            ? 'border-sky-900 bg-sky-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-sky-400 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`text-xs font-mono-num font-bold ${
                            isSelected ? 'text-sky-900' : 'text-slate-400 group-hover:text-sky-700'
                          }`}
                        >
                          {letter}
                        </span>
                        {opt.glyph ? (
                          <IqGlyphSvg glyph={opt.glyph} size={74} />
                        ) : (
                          <span className="text-sm sm:text-base font-bold text-slate-900 text-center">
                            {lang === 'ar' ? opt.labelAr : opt.labelEn}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentIdx === 0}
                      onClick={() => {
                        setCurrentIdx((i) => Math.max(0, i - 1));
                        setShowHint(false);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-40"
                    >
                      {lang === 'ar' ? 'السابق' : 'Previous'}
                    </button>
                    <button
                      type="button"
                      onClick={() => resetTest()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'إعادة' : 'Reset'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {answeredCount === activeQuestions.length && currentIdx + 1 < activeQuestions.length && (
                      <button
                        type="button"
                        onClick={() => {
                          setFinished(true);
                          setTimerActive(false);
                        }}
                        className="px-4 py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100"
                      >
                        {lang === 'ar' ? 'عرض النتيجة الآن' : 'Show Results Now'}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={selectedForCurrent === undefined}
                      onClick={handleNextOrFinish}
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 disabled:opacity-50 transition-colors"
                    >
                      <span>
                        {currentIdx + 1 < activeQuestions.length
                          ? lang === 'ar'
                            ? 'السؤال التالي'
                            : 'Next Puzzle'
                          : lang === 'ar'
                          ? 'اعرض نتيجتي فوراً'
                          : 'Show Instant Result'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                      <Trophy className="w-4 h-4" />
                      <span>{ageLabel(ageGroup)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">{formatTimer(elapsedSeconds)}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      {lang === 'ar' ? scoreMetrics.bandAr : scoreMetrics.bandEn}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {lang === 'ar'
                        ? `أجبت إجابة صحيحة على ${scoreMetrics.correct} من أصل ${scoreMetrics.total} لغز ذكاء (${scoreMetrics.pct}%). المؤشر تقديري للتدريب وتنمية المهارات.`
                        : `You solved ${scoreMetrics.correct} of ${scoreMetrics.total} puzzles (${scoreMetrics.pct}%). Cognitive index is a motivational educational estimate.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">{lang === 'ar' ? 'الدرجة' : 'Score'}</p>
                      <p className="text-2xl sm:text-3xl font-bold font-mono-num text-emerald-700">
                        {scoreMetrics.correct}/{scoreMetrics.total}
                      </p>
                    </div>
                    <div className="w-px h-10 bg-slate-200" aria-hidden="true" />
                    <div className="text-center">
                      <p className="text-xs text-slate-500">{lang === 'ar' ? 'مؤشر الذكاء' : 'IQ Index'}</p>
                      <p className="text-2xl sm:text-3xl font-bold font-mono-num text-sky-900">
                        {scoreMetrics.estimatedIq}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(['pattern', 'logic', 'numerical', 'spatial'] as IqCognitiveDomain[]).map((d) => {
                    const stat = scoreMetrics.domains[d];
                    if (stat.total === 0) return null;
                    const dPct = Math.round((stat.correct / stat.total) * 100);
                    return (
                      <div key={d} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{domainLabel(d)}</span>
                          <span className="font-mono-num font-bold text-sky-900">
                            {stat.correct}/{stat.total}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-900" style={{ width: `${dPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadScoreReport}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 transition-colors"
                    >
                      <Award className="w-4 h-4 text-amber-300" />
                      <span>
                        {lang === 'ar' ? 'معاينة وتحميل شهادة الذكاء PDF مجاناً' : 'Download Free PDF Certificate'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReview((r) => !r)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100"
                    >
                      <Eye className="w-4 h-4" />
                      <span>
                        {showReview
                          ? lang === 'ar'
                            ? 'إخفاء شرح الإجابات'
                            : 'Hide Explanations'
                          : lang === 'ar'
                          ? 'مراجعة الإجابات والشرح'
                          : 'Review Answers & Logic'}
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => resetTest()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-xl hover:bg-slate-200"
                  >
                    <RotateCcw className="w-4 h-4 text-sky-900" />
                    <span>{lang === 'ar' ? 'إعادة الاختبار أو تجربة فئة أخرى' : 'Retake / Try Another Level'}</span>
                  </button>
                </div>

                {showReview && (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                    {activeQuestions.map((q, idx) => {
                      const userChoice = answers[q.id];
                      const isCorrect = userChoice === q.correctIndex;
                      const correctOpt = q.options[q.correctIndex];
                      return (
                        <div key={q.id} className="p-4 sm:p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 text-xs">
                              {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              )}
                              <span className="font-mono-num font-bold text-slate-500">#{idx + 1}</span>
                              <span className="font-semibold text-slate-900">
                                {lang === 'ar' ? q.titleAr : q.titleEn}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed ps-6">
                              {lang === 'ar' ? q.explanationAr : q.explanationEn}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ps-6 sm:ps-0">
                            <span className="text-[11px] text-slate-500">
                              {lang === 'ar' ? 'الإجابة الصحيحة:' : 'Correct:'}
                            </span>
                            {correctOpt.glyph ? (
                              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center">
                                <IqGlyphSvg glyph={correctOpt.glyph} size={42} />
                              </div>
                            ) : (
                              <span className="px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
                                {lang === 'ar' ? correctOpt.labelAr : correctOpt.labelEn}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* LAB MODE 2: PSYCHOLOGICAL & PERSONALITY PROFILERS (4 TESTS)   */}
        {/* ============================================================= */}
        {labMode === 'psych' && (
          <div className="space-y-6">
            {/* 4 Assessment Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PSYCH_ASSESSMENTS.map((item) => {
                const active = item.id === selectedPsychId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => resetPsych(item.id)}
                    className={`p-4 rounded-2xl border text-start space-y-1.5 transition-all ${
                      active
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <p className={`text-[11px] font-semibold ${active ? 'text-emerald-100' : 'text-emerald-700'}`}>
                      {lang === 'ar' ? item.audienceAr : item.audienceEn}
                    </p>
                    <p className="text-xs sm:text-sm font-bold leading-snug">
                      {lang === 'ar' ? item.titleAr : item.titleEn}
                    </p>
                  </button>
                );
              })}
            </div>

            {!psychFinished && currentPsychQ ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-emerald-700">
                      {lang === 'ar' ? activePsych.audienceAr : activePsych.audienceEn} ·{' '}
                      <span className="font-mono-num">
                        {psychIdx + 1} / {activePsych.questions.length}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {lang === 'ar' ? activePsych.subtitleAr : activePsych.subtitleEn}
                    </p>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{
                      width: `${Math.round(((psychIdx + 1) / activePsych.questions.length) * 100)}%`,
                    }}
                  />
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {lang === 'ar' ? currentPsychQ.promptAr : currentPsychQ.promptEn}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentPsychQ.options.map((opt, idx) => {
                    const isPicked = selectedPsychOpt === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setPsychAnswers((prev) => ({ ...prev, [currentPsychQ.id]: idx }))
                        }
                        className={`p-4 rounded-2xl border-2 text-start text-sm font-medium transition-all ${
                          isPicked
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-slate-50'
                        }`}
                      >
                        {lang === 'ar' ? opt.textAr : opt.textEn}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={psychIdx === 0}
                      onClick={() => setPsychIdx((i) => Math.max(0, i - 1))}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-40"
                    >
                      {lang === 'ar' ? 'السابق' : 'Previous'}
                    </button>
                    <button
                      type="button"
                      onClick={() => resetPsych()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'إعادة' : 'Reset'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={selectedPsychOpt === undefined}
                    onClick={() => {
                      if (psychIdx + 1 < activePsych.questions.length) {
                        setPsychIdx((i) => i + 1);
                      } else {
                        setPsychFinished(true);
                      }
                    }}
                    className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    {psychIdx + 1 < activePsych.questions.length
                      ? lang === 'ar'
                        ? 'الموقف التالي'
                        : 'Next Question'
                      : lang === 'ar'
                      ? 'اعرض التحليل النفسي فوراً'
                      : 'Show Instant Profile'}
                  </button>
                </div>
              </div>
            ) : (
              psychResult.top && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                    <div className="space-y-2 max-w-2xl">
                      <p className="text-xs font-semibold text-emerald-700">
                        {lang === 'ar' ? activePsych.titleAr : activePsych.titleEn}
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {lang === 'ar' ? psychResult.top.trait.labelAr : psychResult.top.trait.labelEn}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        {lang === 'ar' ? psychResult.top.trait.summaryAr : psychResult.top.trait.summaryEn}
                      </p>
                    </div>

                    <div className="shrink-0 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 text-center">
                      <p className="text-xs text-emerald-800">
                        {lang === 'ar' ? 'نسبة السمة الغالبة' : 'Primary Match'}
                      </p>
                      <p className="text-3xl font-bold font-mono-num text-emerald-700">
                        {psychResult.top.pct}%
                      </p>
                    </div>
                  </div>

                  {/* Trait Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {psychResult.breakdown.map((b) => (
                      <div key={b.trait.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">
                            {lang === 'ar' ? b.trait.labelAr : b.trait.labelEn}
                          </span>
                          <span className="font-mono-num font-bold text-slate-900">{b.pct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{ width: `${b.pct}%`, backgroundColor: b.trait.accentColor }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Practical Educational Recommendations */}
                  <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 space-y-3">
                    <h4 className="text-sm font-bold text-sky-950">
                      {lang === 'ar' ? 'توصيات تربوية وعملية مخصصة لك:' : 'Personalized Educational Recommendations:'}
                    </h4>
                    <ul className="space-y-2 text-xs sm:text-sm text-slate-700 list-disc ps-5">
                      {(lang === 'ar' ? psychResult.top.trait.tipsAr : psychResult.top.trait.tipsEn).map(
                        (tip, i) => (
                          <li key={i}>{tip}</li>
                        )
                      )}
                    </ul>
                    <p className="text-[11px] text-slate-500 pt-1">
                      {lang === 'ar'
                        ? '* هذا الاختبار تربوي استرشادي للتطوير الذاتي ولا يُعد تشخيصاً طبياً أو إكلينيكياً.'
                        : '* Educational self-discovery tool for learning & personal growth, not a medical diagnosis.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadPsychReport}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800"
                    >
                      <Award className="w-4 h-4 text-amber-300" />
                      <span>
                        {lang === 'ar'
                          ? 'معاينة وتحميل الشهادة والتقرير PDF مجاناً'
                          : 'Download Free PDF Certificate'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => resetPsych()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-xl hover:bg-slate-200"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'إعادة الاختبار أو اختيار اختبار آخر' : 'Retake Assessment'}</span>
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* LAB MODE 3: VISUAL MEMORY & FOCUS CHALLENGE                   */}
        {/* ============================================================= */}
        {labMode === 'memory' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {lang === 'ar'
                    ? 'اختبار الذاكرة البصرية وسرعة التركيز (4 مستويات متدرجة)'
                    : 'Visual Working Memory & Focus Test (4 Progressive Levels)'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  {lang === 'ar'
                    ? 'ستضيء مجموعة مربعات لمدة ثانيتين ثم تختفي؛ اضغط على نفس أماكن المربعات من ذاكرتك!'
                    : 'Glowing tiles flash briefly for ~2 seconds, then vanish—tap the exact spots from memory!'}
                </p>
              </div>
              <span className="text-xs font-mono-num font-bold text-sky-900 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-lg">
                {lang === 'ar' ? 'المستوى' : 'Level'} {memRoundIdx + 1} / {MEMORY_ROUNDS.length}
              </span>
            </div>

            {memPhase === 'ready' && (
              <div className="py-10 text-center space-y-5">
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  {lang === 'ar'
                    ? 'مناسب للأطفال من سن 5 سنوات والكبار لتقوية الذاكرة العاملة والانتباه البصري.'
                    : 'Great for ages 5+ and adults to sharpen working memory and visual attention.'}
                </p>
                <button
                  type="button"
                  onClick={() => startMemoryRound(0)}
                  className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 transition-colors"
                >
                  <Brain className="w-4 h-4 text-amber-300" />
                  <span>{lang === 'ar' ? 'ابدأ تحدي الذاكرة الآن' : 'Start Memory Challenge'}</span>
                </button>
              </div>
            )}

            {(memPhase === 'memorize' || memPhase === 'recall' || memPhase === 'round_done') && (
              <div className="flex flex-col items-center space-y-5">
                <p className="text-sm font-bold text-sky-900">
                  {memPhase === 'memorize'
                    ? lang === 'ar'
                      ? 'ركز جيداً واحفظ أماكن المربعات المضيئة...'
                      : 'Memorize the highlighted squares...'
                    : memPhase === 'recall'
                    ? lang === 'ar'
                      ? `اضغط على المربعات (${memPicked.length} / ${MEMORY_ROUNDS[memRoundIdx].targetCount})`
                      : `Tap the squares from memory (${memPicked.length} / ${MEMORY_ROUNDS[memRoundIdx].targetCount})`
                    : lang === 'ar'
                    ? `أحسنت! أصبت ${memPicked.filter((t) => memTargets.includes(t)).length} من ${MEMORY_ROUNDS[memRoundIdx].targetCount}`
                    : `Nice! Matched ${memPicked.filter((t) => memTargets.includes(t)).length} of ${MEMORY_ROUNDS[memRoundIdx].targetCount}`}
                </p>

                <div
                  className={`grid gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl ${
                    MEMORY_ROUNDS[memRoundIdx].gridSize === 3 ? 'grid-cols-3' : 'grid-cols-4'
                  }`}
                >
                  {Array.from(
                    { length: MEMORY_ROUNDS[memRoundIdx].gridSize * MEMORY_ROUNDS[memRoundIdx].gridSize },
                    (_, tileIdx) => {
                      const isTarget = memTargets.includes(tileIdx);
                      const isPicked = memPicked.includes(tileIdx);

                      let tileStyle = 'bg-white border-slate-300 hover:border-sky-400';
                      if (memPhase === 'memorize' && isTarget) {
                        tileStyle = 'bg-sky-900 border-sky-900 scale-95';
                      } else if (memPhase === 'recall' && isPicked) {
                        tileStyle = isTarget
                          ? 'bg-emerald-600 border-emerald-700'
                          : 'bg-rose-500 border-rose-600';
                      } else if (memPhase === 'round_done') {
                        if (isTarget && isPicked) tileStyle = 'bg-emerald-600 border-emerald-700';
                        else if (isTarget) tileStyle = 'bg-amber-400 border-amber-500';
                        else if (isPicked) tileStyle = 'bg-rose-500 border-rose-600';
                      }

                      return (
                        <button
                          key={tileIdx}
                          type="button"
                          disabled={memPhase !== 'recall' || isPicked}
                          onClick={() => handleMemoryTileClick(tileIdx)}
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 transition-all ${tileStyle}`}
                          aria-label={`Tile ${tileIdx + 1}`}
                        />
                      );
                    }
                  )}
                </div>

                {memPhase === 'round_done' && (
                  <button
                    type="button"
                    onClick={() => startMemoryRound(memRoundIdx + 1)}
                    className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600"
                  >
                    {lang === 'ar'
                      ? `الانتقال للمستوى ${memRoundIdx + 2}`
                      : `Next: Level ${memRoundIdx + 2}`}
                  </button>
                )}
              </div>
            )}

            {memPhase === 'all_done' && (
              <div className="py-6 text-center space-y-5">
                <div className="inline-flex flex-col items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-8 py-5">
                  <Trophy className="w-8 h-8 text-amber-600" />
                  <p className="text-xs font-semibold text-emerald-800">
                    {lang === 'ar' ? 'نتيجة الذاكرة البصرية الفورية' : 'Instant Visual Memory Score'}
                  </p>
                  <p className="text-3xl font-bold font-mono-num text-slate-900">
                    {memTotalHits} / {memTotalTargets} (
                    {Math.round((memTotalHits / Math.max(1, memTotalTargets)) * 100)}%)
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {memTotalHits >= 15
                      ? lang === 'ar'
                        ? 'تركيز استثنائي وذاكرة بصرية قوية جداً!'
                        : 'Exceptional focus and sharp working memory!'
                      : memTotalHits >= 11
                      ? lang === 'ar'
                        ? 'ذاكرة جيدة جداً ومستوى انتباه ممتاز!'
                        : 'Strong visual recall and solid attention!'
                      : lang === 'ar'
                      ? 'تمرين ممتاز! جرب مرة ثانية لرفع سرعة التركيز.'
                      : 'Nice warm-up! Play again to sharpen visual recall.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCertModalMode('memory')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600"
                  >
                    <Award className="w-4 h-4 text-amber-300" />
                    <span>
                      {lang === 'ar'
                        ? 'تحميل شهادة الذاكرة PDF مجاناً باسم الطفل'
                        : 'Free Memory Certificate (PDF)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={resetMemoryChallenge}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'العب تحدي الذاكرة مرة أخرى' : 'Play Memory Challenge Again'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shared High-Res A4 PDF Certificate Preview & Download Modal */}
      {certModalMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-5 sm:p-7 space-y-5 shadow-xl my-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-900">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>
                    {lang === 'ar'
                      ? 'شهادة تقدير فاخرة جاهزة للطباعة (A4 PDF)'
                      : 'Official Printable A4 PDF Certificate'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {lang === 'ar'
                    ? 'اكتب اسم الطفل أو الطالب وحمّل الشهادة بصيغة PDF'
                    : 'Enter Student Name & Download PDF Certificate'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCertModalMode(null)}
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex-1 space-y-1.5">
                <label
                  htmlFor="iq-cert-participant-name"
                  className="block text-xs font-semibold text-slate-700"
                >
                  {lang === 'ar' ? 'اسم الطفل / المتدرب على الشهادة:' : 'Name Printed on Certificate:'}
                </label>
                <input
                  id="iq-cert-participant-name"
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: Youssef Ahmed أو يوسف أحمد' : 'e.g. Youssef Ahmed'}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>

              <button
                type="button"
                disabled={downloadingPdf}
                onClick={handleDownloadPdfCertificate}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloadingPdf
                    ? lang === 'ar'
                      ? 'جاري إنشاء ملف PDF...'
                      : 'Building PDF...'
                    : lang === 'ar'
                    ? 'تنزيل الشهادة كـ PDF'
                    : 'Download PDF Certificate'}
                </span>
              </button>
            </div>

            <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center justify-center">
              {certPreviewUrl ? (
                <img
                  src={certPreviewUrl}
                  alt={lang === 'ar' ? 'معاينة شهادة الذكاء' : 'IQ Certificate Preview'}
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
