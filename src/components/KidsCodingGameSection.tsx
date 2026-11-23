import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  Award,
  Bug,
  Code2,
  CornerUpLeft,
  CornerUpRight,
  Cpu,
  Download,
  Flag,
  HelpCircle,
  Play,
  Repeat,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import type { AcademySettings, Lang } from '../types';
import {
  CODING_LEVELS,
  LOGIC_LAB_MISSIONS,
  type AtomicCommand,
  type CodingDirection,
  type ProgramBlock,
} from '../data/codingLevels';
import { LogicLabGame } from './LogicLabGame';
import {
  downloadCodingCertificatePdf,
  renderCodingCertificateCanvas,
} from '../utils/codingCertificatePdf';

interface KidsCodingGameSectionProps {
  lang: Lang;
  settings: AcademySettings;
}

interface FlattenedStep {
  blockId: string;
  cmd: AtomicCommand;
}

type ActiveCodingGame = 'codequest' | 'logiclab';

const DR: Record<CodingDirection, number> = { 0: -1, 1: 0, 2: 1, 3: 0 };
const DC: Record<CodingDirection, number> = { 0: 0, 1: 1, 2: 0, 3: -1 };

function RobotLeoSvg({ dir, crashed }: { dir: CodingDirection; crashed: boolean }) {
  const angle = dir * 90;
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 64 64"
      className="transition-transform duration-300"
      style={{ transform: `rotate(${angle}deg)` }}
      aria-hidden="true"
    >
      <line x1="32" y1="6" x2="32" y2="16" stroke="#0c4a6e" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="32" cy="6" r="4.5" fill={crashed ? '#be123c' : '#f59e0b'} />
      <rect x="10" y="20" width="7" height="24" rx="3" fill="#334155" />
      <rect x="47" y="20" width="7" height="24" rx="3" fill="#334155" />
      <rect
        x="16"
        y="16"
        width="32"
        height="34"
        rx="10"
        fill={crashed ? '#ffe4e6' : '#0c4a6e'}
        stroke={crashed ? '#be123c' : '#0284c7'}
        strokeWidth="2.5"
      />
      <rect x="21" y="20" width="22" height="11" rx="5" fill="#e0f2fe" />
      <circle cx="27" cy="25.5" r="2.5" fill={crashed ? '#be123c' : '#0c4a6e'} />
      <circle cx="37" cy="25.5" r="2.5" fill={crashed ? '#be123c' : '#0c4a6e'} />
      <polygon points="32,35 26,43 38,43" fill="#34d399" />
    </svg>
  );
}

export function KidsCodingGameSection({ lang, settings }: KidsCodingGameSectionProps) {
  const [activeGame, setActiveGame] = useState<ActiveCodingGame>('codequest');

  // Unified achievement state across both games
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [solvedLogicMissions, setSolvedLogicMissions] = useState<number[]>([]);

  // Certificate Modal & Student Name state
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [certPreviewUrl, setCertPreviewUrl] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // CodeQuest Game 1 State
  const [levelIdx, setLevelIdx] = useState(0);
  const level = CODING_LEVELS[levelIdx] || CODING_LEVELS[0];

  const [program, setProgram] = useState<ProgramBlock[]>([]);
  const [showRealCode, setShowRealCode] = useState(true);
  const [showHint, setShowHint] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [leoPos, setLeoPos] = useState<{ row: number; col: number; dir: CodingDirection }>(
    level.start
  );
  const [collectedStars, setCollectedStars] = useState<string[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'idle' | 'win' | 'bug';
    textAr: string;
    textEn: string;
  }>({ type: 'idle', textAr: '', textEn: '' });

  const [loopTimes, setLoopTimes] = useState<2 | 3 | 4>(3);
  const [loopPreset, setLoopPreset] = useState<'move' | 'jump' | 'stair'>('move');

  const runTokenRef = useRef(0);

  const totalSolved = completedLevels.length + solvedLogicMissions.length;
  const totalMissions = CODING_LEVELS.length + LOGIC_LAB_MISSIONS.length;

  // Render crisp live preview when certificate modal is open
  useEffect(() => {
    if (!certModalOpen) return;
    let active = true;
    void renderCodingCertificateCanvas({
      studentName: studentName.trim() || (lang === 'ar' ? 'بطل البرمجة' : 'Young Coder'),
      academyName: settings.academyNameEn || 'LinguaCraft English Academy',
      logoDataUrl: settings.logoDataUrl,
      codeQuestSolved: completedLevels.length,
      codeQuestTotal: CODING_LEVELS.length,
      logicLabSolved: solvedLogicMissions.length,
      logicLabTotal: LOGIC_LAB_MISSIONS.length,
      lang,
    })
      .then((canvas) => {
        if (active) setCertPreviewUrl(canvas.toDataURL('image/png'));
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [
    certModalOpen,
    studentName,
    settings.academyNameEn,
    settings.logoDataUrl,
    completedLevels.length,
    solvedLogicMissions.length,
    lang,
  ]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadCodingCertificatePdf({
        studentName: studentName.trim() || 'Young Coder',
        academyName: settings.academyNameEn || 'LinguaCraft English Academy',
        logoDataUrl: settings.logoDataUrl,
        codeQuestSolved: completedLevels.length,
        codeQuestTotal: CODING_LEVELS.length,
        logicLabSolved: solvedLogicMissions.length,
        logicLabTotal: LOGIC_LAB_MISSIONS.length,
        lang,
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const resetBoardOnly = (targetLevel = level) => {
    runTokenRef.current += 1;
    setIsRunning(false);
    setLeoPos(targetLevel.start);
    setCollectedStars([]);
    setActiveBlockId(null);
    setStatusMsg({ type: 'idle', textAr: '', textEn: '' });
  };

  const handleSelectLevel = (nextIdx: number) => {
    const nextLvl = CODING_LEVELS[nextIdx];
    setLevelIdx(nextIdx);
    setProgram([]);
    setShowHint(false);
    resetBoardOnly(nextLvl);
  };

  useEffect(() => {
    return () => {
      runTokenRef.current += 1;
    };
  }, []);

  const addSimpleCommand = (cmd: AtomicCommand) => {
    if (isRunning || program.length >= 20) return;
    setProgram((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind: 'simple', cmd },
    ]);
    if (statusMsg.type !== 'idle') resetBoardOnly();
  };

  const addLoopBlock = () => {
    if (isRunning || program.length >= 20) return;
    const pattern: AtomicCommand[] =
      loopPreset === 'move'
        ? ['move']
        : loopPreset === 'jump'
        ? ['jump']
        : ['move', 'right', 'move', 'left'];

    const presetLabelEn =
      loopPreset === 'move'
        ? 'moveForward()'
        : loopPreset === 'jump'
        ? 'jumpOver()'
        : 'stairStep()';

    setProgram((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'loop',
        times: loopTimes,
        pattern,
        presetLabelAr: presetLabelEn,
        presetLabelEn,
      },
    ]);
    if (statusMsg.type !== 'idle') resetBoardOnly();
  };

  const removeBlock = (id: string) => {
    if (isRunning) return;
    setProgram((prev) => prev.filter((b) => b.id !== id));
    if (statusMsg.type !== 'idle') resetBoardOnly();
  };

  const rockSet = useMemo(() => new Set(level.rocks.map(([r, c]) => `${r},${c}`)), [level.rocks]);
  const starSet = useMemo(() => new Set(level.stars.map(([r, c]) => `${r},${c}`)), [level.stars]);

  const flattenedSteps: FlattenedStep[] = useMemo(() => {
    const out: FlattenedStep[] = [];
    program.forEach((blk) => {
      if (blk.kind === 'simple') {
        out.push({ blockId: blk.id, cmd: blk.cmd });
      } else {
        for (let i = 0; i < blk.times; i += 1) {
          blk.pattern.forEach((pCmd) => out.push({ blockId: blk.id, cmd: pCmd }));
        }
      }
    });
    return out;
  }, [program]);

  const runProgram = async () => {
    if (isRunning || flattenedSteps.length === 0) return;
    const myToken = runTokenRef.current + 1;
    runTokenRef.current = myToken;

    setIsRunning(true);
    setLeoPos(level.start);
    setCollectedStars([]);
    setActiveBlockId(null);
    setStatusMsg({ type: 'idle', textAr: '', textEn: '' });

    let cur = { ...level.start };
    const starsHit = new Set<string>();

    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
    await sleep(220);

    for (let i = 0; i < flattenedSteps.length; i += 1) {
      if (runTokenRef.current !== myToken) return;
      const step = flattenedSteps[i];
      setActiveBlockId(step.blockId);

      if (step.cmd === 'left') {
        cur = { ...cur, dir: (((cur.dir + 3) % 4) as CodingDirection) };
      } else if (step.cmd === 'right') {
        cur = { ...cur, dir: (((cur.dir + 1) % 4) as CodingDirection) };
      } else if (step.cmd === 'move' || step.cmd === 'jump') {
        const dist = step.cmd === 'jump' ? 2 : 1;
        const nr = cur.row + DR[cur.dir] * dist;
        const nc = cur.col + DC[cur.dir] * dist;

        if (nr < 0 || nr >= level.gridSize || nc < 0 || nc >= level.gridSize) {
          setIsRunning(false);
          setStatusMsg({
            type: 'bug',
            textAr: `خطأ برمجي (Bug): خرج الروبوت ليو خارج حدود الشبكة عند الخطوة ${i + 1}! عدّل الكود وجرّب تاني.`,
            textEn: `Bug at step ${i + 1}: Leo stepped outside the grid! Edit your commands and retry.`,
          });
          return;
        }
        if (rockSet.has(`${nr},${nc}`)) {
          setIsRunning(false);
          setStatusMsg({
            type: 'bug',
            textAr: `خطأ برمجي (Bug): اصطدم ليو بصخرة عند الخطوة ${i + 1}! استخدم turnRight / turnLeft أو jumpOver لتجنبها.`,
            textEn: `Bug at step ${i + 1}: Leo bumped into a rock! Try turnLeft(), turnRight(), or jumpOver().`,
          });
          return;
        }
        cur = { ...cur, row: nr, col: nc };
      }

      const key = `${cur.row},${cur.col}`;
      if (starSet.has(key)) {
        starsHit.add(key);
        setCollectedStars(Array.from(starsHit));
      }

      setLeoPos({ ...cur });
      await sleep(390);
      if (runTokenRef.current !== myToken) return;

      if (cur.row === level.goal.row && cur.col === level.goal.col) {
        setIsRunning(false);
        setActiveBlockId(null);
        const gotAllStars = starsHit.size === level.stars.length;
        setCompletedLevels((prev) => (prev.includes(level.id) ? prev : [...prev, level.id]));
        setStatusMsg({
          type: 'win',
          textAr: gotAllStars
            ? `رائع يا بطل البرمجة! نجح كودك وجمعت كل النجوم (${starsHit.size}/${level.stars.length}) في ${program.length} أمر!`
            : `ممتاز! وصل ليو للعلم، وحصدت ${starsHit.size} من ${level.stars.length} نجمة. هل يمكنك جمع كل النجوم؟`,
          textEn: gotAllStars
            ? `Awesome Coder! Leo reached the flag & collected all ${starsHit.size}/${level.stars.length} stars!`
            : `Goal reached! Collected ${starsHit.size}/${level.stars.length} stars—try grabbing every star too!`,
        });
        return;
      }
    }

    setIsRunning(false);
    setActiveBlockId(null);
    setStatusMsg({
      type: 'bug',
      textAr: 'توقف الروبوت قبل الوصول إلى العلم الأخضر! أضف أوامر إضافية وأعد التشغيل.',
      textEn: 'Leo stopped before reaching the green flag! Add more commands and run again.',
    });
  };

  const generatedCodePreview = useMemo(() => {
    if (program.length === 0) {
      return '// Click English command blocks to build your program...';
    }
    const mapCmd = (c: AtomicCommand) =>
      c === 'move'
        ? 'leo.moveForward();'
        : c === 'right'
        ? 'leo.turnRight();'
        : c === 'left'
        ? 'leo.turnLeft();'
        : 'leo.jumpOver();';

    return program
      .map((blk) => {
        if (blk.kind === 'simple') return mapCmd(blk.cmd);
        const inner = blk.pattern.map((c) => `  ${mapCmd(c)}`).join('\n');
        return `for (let i = 0; i < ${blk.times}; i++) {\n${inner}\n}`;
      })
      .join('\n');
  }, [program]);

  // Pure English command block display!
  const commandBadge = (cmd: AtomicCommand) => {
    if (cmd === 'move') return 'moveForward()';
    if (cmd === 'right') return 'turnRight()';
    if (cmd === 'left') return 'turnLeft()';
    return 'jumpOver()';
  };

  return (
    <section id="coding-game" className="py-16 sm:py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Heading + Progress & PDF Certificate Button */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <Code2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'مجاني 100% · الألعاب + التصحيح الفوري + شهادة المبرمج الصغير PDF مجاناً'
                  : '100% Free · Interactive Coding Games + Results & PDF Certificate Included Free'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              {lang === 'ar'
                ? 'ألعاب البرمجة للأطفال بالإنجليزية (مجاناً بالنتيجة والشهادة)'
                : 'Free Kids Coding Games in English (With Free PDF Certificate)'}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              {lang === 'ar'
                ? 'مفتوحة مجاناً بالكامل بدون اشتراك: لعبتان لتعلّم أوامر البرمجة الحقيقية بالإنجليزية (تحريك الروبوت ليو + مصنع الشروط وصائد الأخطاء If/Else)، مع تصحيح فوري وشهادة PDF باسم الطفل مجاناً!'
                : '100% free with zero sign-up: two interactive worlds teaching real English programming commands (Robot Leo & Loops + Smart Conveyor If/Else & Bug Hunter), with instant feedback and a free personalized A4 PDF Certificate!'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-950 font-mono-num flex items-center gap-2 whitespace-nowrap">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>
                {totalSolved} / {totalMissions} {lang === 'ar' ? 'مهام مكتملة' : 'Solved'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCertModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 transition-colors whitespace-nowrap shrink-0"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>
                {lang === 'ar' ? 'شهادة البرمجة PDF مجاناً باسم الطفل' : 'Free PDF Certificate'}
              </span>
            </button>
          </div>
        </div>

        {/* 2-Game Selector Switcher */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveGame('codequest')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
              activeGame === 'codequest'
                ? 'bg-white text-sky-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4 text-sky-800" />
            <span>
              {lang === 'ar'
                ? `1. مغامرة الروبوت ليو (${completedLevels.length}/${CODING_LEVELS.length})`
                : `1. CodeQuest: Robot Leo (${completedLevels.length}/${CODING_LEVELS.length})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGame('logiclab')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
              activeGame === 'logiclab'
                ? 'bg-white text-sky-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4 text-emerald-700" />
            <span>
              {lang === 'ar'
                ? `2. مصنع المنطق وصائد الأخطاء If/Else (${solvedLogicMissions.length}/${LOGIC_LAB_MISSIONS.length})`
                : `2. LogicLab: If/Else & Bug Hunter (${solvedLogicMissions.length}/${LOGIC_LAB_MISSIONS.length})`}
            </span>
          </button>
        </div>

        {/* GAME 1: CodeQuest Robot Leo */}
        {activeGame === 'codequest' && (
          <div className="space-y-6">
            {/* 6 Level Selector Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {CODING_LEVELS.map((lvl, idx) => {
                const isActive = idx === levelIdx;
                const isSolved = completedLevels.includes(lvl.id);
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => handleSelectLevel(idx)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-sky-900 text-white border-sky-900 shadow-sm'
                        : isSolved
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-mono-num">#{lvl.id}</span>
                    <span>
                      {lvl.titleEn.replace(/^Level \d+:\s*/, '').replace(/\s*\(.*\)$/, '')}
                    </span>
                    {isSolved && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                  </button>
                );
              })}
            </div>

            {/* Main Game Workspace: Left Grid Arena + Right English Coding Blocks */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT: 5x5 Visual Playground */}
              <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-sky-900">
                      {lang === 'ar' ? level.conceptAr : level.conceptEn}
                    </p>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {lang === 'ar' ? level.titleAr : level.titleEn}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {lang === 'ar' ? level.goalSummaryAr : level.goalSummaryEn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHint((h) => !h)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-900 bg-white border border-slate-200 rounded-lg hover:bg-sky-50 whitespace-nowrap shrink-0"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تلميح' : 'Hint'}</span>
                  </button>
                </div>

                {showHint && (
                  <p className="text-xs text-sky-950 bg-sky-50 border border-sky-200 rounded-xl px-4 py-2.5">
                    {lang === 'ar' ? level.starterHintAr : level.starterHintEn}
                  </p>
                )}

                {/* 5x5 Grid Board */}
                <div dir="ltr" className="flex justify-center">
                  <div className="grid grid-cols-5 gap-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    {Array.from({ length: level.gridSize * level.gridSize }, (_, idx) => {
                      const r = Math.floor(idx / level.gridSize);
                      const c = idx % level.gridSize;
                      const key = `${r},${c}`;
                      const isLeo = leoPos.row === r && leoPos.col === c;
                      const isGoal = level.goal.row === r && level.goal.col === c;
                      const isRock = rockSet.has(key);
                      const hasStar = starSet.has(key) && !collectedStars.includes(key);

                      return (
                        <div
                          key={key}
                          className={`w-13 h-13 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center relative border transition-colors ${
                            isRock
                              ? 'bg-slate-700 border-slate-800'
                              : isGoal
                              ? 'bg-emerald-50 border-emerald-300'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          {isRock && (
                            <div className="w-8 h-8 rounded-lg bg-slate-500 border-b-4 border-slate-900 flex items-center justify-center">
                              <span className="w-3 h-1.5 rounded-full bg-slate-300/60" />
                            </div>
                          )}
                          {isGoal && !isLeo && (
                            <Flag className="w-7 h-7 text-emerald-600 fill-emerald-200" />
                          )}
                          {hasStar && !isLeo && (
                            <Star className="w-7 h-7 text-amber-500 fill-amber-400" />
                          )}
                          {isLeo && (
                            <div className="z-10">
                              <RobotLeoSvg dir={leoPos.dir} crashed={statusMsg.type === 'bug'} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Win / Bug Feedback Banner */}
                {statusMsg.type !== 'idle' && (
                  <div
                    className={`p-4 rounded-xl border text-xs sm:text-sm font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      statusMsg.type === 'win'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {statusMsg.type === 'win' ? (
                        <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      ) : (
                        <Bug className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                      )}
                      <span>{lang === 'ar' ? statusMsg.textAr : statusMsg.textEn}</span>
                    </div>

                    {statusMsg.type === 'win' && levelIdx + 1 < CODING_LEVELS.length && (
                      <button
                        type="button"
                        onClick={() => handleSelectLevel(levelIdx + 1)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-600 whitespace-nowrap shrink-0"
                      >
                        {lang === 'ar' ? 'المستوى التالي' : 'Next Level'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT: Pure English Command Block Palette + Code Queue + Real JS Preview */}
              <div className="lg:col-span-6 space-y-5">
                {/* Step 1: Pure English Command Palette */}
                <div dir="ltr" className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">
                      1. Add English Coding Commands:
                    </h4>
                    <span className="text-xs font-mono-num text-slate-500">
                      {program.length} / 20
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={() => addSimpleCommand('move')}
                      className="p-3 bg-sky-900 text-white rounded-xl hover:bg-sky-800 disabled:opacity-50 flex flex-col items-center gap-1 text-xs font-semibold transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                      <span>Move</span>
                      <span className="text-[10px] text-sky-200 font-mono-num">moveForward()</span>
                    </button>

                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={() => addSimpleCommand('left')}
                      className="p-3 bg-white text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-100 disabled:opacity-50 flex flex-col items-center gap-1 text-xs font-semibold transition-colors"
                    >
                      <CornerUpLeft className="w-4 h-4 text-sky-900" />
                      <span>Turn Left</span>
                      <span className="text-[10px] text-slate-500 font-mono-num">turnLeft()</span>
                    </button>

                    <button
                      type="button"
                      disabled={isRunning}
                      onClick={() => addSimpleCommand('right')}
                      className="p-3 bg-white text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-100 disabled:opacity-50 flex flex-col items-center gap-1 text-xs font-semibold transition-colors"
                    >
                      <CornerUpRight className="w-4 h-4 text-sky-900" />
                      <span>Turn Right</span>
                      <span className="text-[10px] text-slate-500 font-mono-num">turnRight()</span>
                    </button>

                    <button
                      type="button"
                      disabled={isRunning || !level.allowJump}
                      onClick={() => addSimpleCommand('jump')}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
                        level.allowJump
                          ? 'bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Jump</span>
                      <span
                        className={`text-[10px] font-mono-num ${
                          level.allowJump ? 'text-amber-100' : 'text-slate-400'
                        }`}
                      >
                        jumpOver()
                      </span>
                    </button>
                  </div>

                  {/* Loop Builder Card (English-only commands) */}
                  {level.allowLoop && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <Repeat className="w-4 h-4 text-emerald-700" />
                          <span>Loop Block (repeat):</span>
                        </span>
                        <div className="flex items-center gap-1">
                          {([2, 3, 4] as const).map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setLoopTimes(n)}
                              className={`px-2.5 py-1 text-xs font-mono-num font-bold rounded-lg ${
                                loopTimes === n
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-white text-emerald-900 border border-emerald-200'
                              }`}
                            >
                              {n}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={loopPreset}
                          onChange={(e) =>
                            setLoopPreset(e.target.value as 'move' | 'jump' | 'stair')
                          }
                          className="flex-1 px-3 py-2 text-xs font-mono-num bg-white border border-emerald-300 rounded-lg"
                        >
                          <option value="move">moveForward()</option>
                          {level.allowJump && <option value="jump">jumpOver()</option>}
                          <option value="stair">stairStep() [move, right, move, left]</option>
                        </select>
                        <button
                          type="button"
                          disabled={isRunning}
                          onClick={addLoopBlock}
                          className="px-4 py-2 text-xs font-semibold font-mono-num text-white bg-emerald-700 rounded-lg hover:bg-emerald-600 disabled:opacity-50 whitespace-nowrap"
                        >
                          + repeat({loopTimes})
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Program Workspace Queue (Pure English blocks) */}
                <div dir="ltr" className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900">2. Your Code Sequence:</h4>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowRealCode((s) => !s)}
                        className="text-xs font-semibold text-sky-900 hover:underline whitespace-nowrap"
                      >
                        {showRealCode ? 'Hide JS Code' : 'Show JS Code'}
                      </button>
                      <button
                        type="button"
                        disabled={isRunning || program.length === 0}
                        onClick={() => {
                          setProgram([]);
                          resetBoardOnly();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100 disabled:opacity-40 whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>

                  {program.length === 0 ? (
                    <div className="p-6 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
                      Click the command blocks above to stack instructions for Robot Leo.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {program.map((blk, i) => {
                        const isActiveStep = activeBlockId === blk.id;
                        return (
                          <div
                            key={blk.id}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono-num font-semibold transition-all ${
                              isActiveStep
                                ? 'bg-amber-100 border-amber-500 text-amber-950 scale-105 shadow-sm'
                                : blk.kind === 'loop'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <span className="text-slate-400">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span>
                              {blk.kind === 'simple'
                                ? commandBadge(blk.cmd)
                                : `repeat(${blk.times}) -> ${blk.presetLabelEn}`}
                            </span>
                            {!isRunning && (
                              <button
                                type="button"
                                onClick={() => removeBlock(blk.id)}
                                className="text-slate-400 hover:text-rose-600 font-bold"
                                aria-label="Remove step"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Run / Reset Controls */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isRunning || program.length === 0}
                      onClick={runProgram}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => resetBoardOnly()}
                      className="inline-flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 whitespace-nowrap"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset Leo</span>
                    </button>
                  </div>

                  {/* Real JavaScript Code View */}
                  {showRealCode && (
                    <div className="bg-slate-900 text-emerald-300 rounded-xl p-4 font-mono-num text-xs overflow-x-auto leading-relaxed">
                      <pre className="whitespace-pre-wrap">{generatedCodePreview}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GAME 2: LogicLab (If / Else Conditionals, Modulo & Bug Hunter) */}
        {activeGame === 'logiclab' && (
          <LogicLabGame
            lang={lang}
            solvedMissions={solvedLogicMissions}
            onMissionSolved={(id) =>
              setSolvedLogicMissions((prev) => (prev.includes(id) ? prev : [...prev, id]))
            }
          />
        )}
      </div>

      {/* Personalized Junior Coder PDF Certificate Preview & Download Modal */}
      {certModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-5 sm:p-7 space-y-5 shadow-xl my-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-900">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>{lang === 'ar' ? 'شهادة إنجاز رسمية جاهزة للطباعة (A4 PDF)' : 'Official Printable A4 PDF Certificate'}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {lang === 'ar'
                    ? 'اكتب اسم الطفل وحمّل شهادة البرمجة كملف PDF'
                    : 'Enter Student Name & Download PDF Certificate'}
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

            {/* Student Name Input + Action */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex-1 space-y-1.5">
                <label
                  htmlFor="coding-cert-student-name"
                  className="block text-xs font-semibold text-slate-700"
                >
                  {lang === 'ar' ? 'اسم الطفل / الطالب على الشهادة:' : 'Student Full Name on Certificate:'}
                </label>
                <input
                  id="coding-cert-student-name"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: Youssef Ahmed أو يوسف أحمد' : 'e.g. Youssef Ahmed'}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>

              <button
                type="button"
                disabled={downloadingPdf}
                onClick={handleDownloadPdf}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloadingPdf
                    ? lang === 'ar'
                      ? 'جاري تجهيز ملف PDF...'
                      : 'Building PDF...'
                    : lang === 'ar'
                    ? 'تنزيل الشهادة كـ PDF'
                    : 'Download PDF Certificate'}
                </span>
              </button>
            </div>

            {/* Live High-Res A4 Certificate Preview */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center justify-center">
              {certPreviewUrl ? (
                <img
                  src={certPreviewUrl}
                  alt={lang === 'ar' ? 'معاينة شهادة البرمجة' : 'Coding Certificate Preview'}
                  className="w-full max-h-[58vh] object-contain rounded-lg shadow-sm border border-slate-200 bg-white"
                />
              ) : (
                <div className="py-16 text-xs text-slate-500">
                  {lang === 'ar' ? 'جاري رسم معاينة الشهادة...' : 'Rendering certificate preview...'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
