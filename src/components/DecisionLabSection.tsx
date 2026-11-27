import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Bot,
  CheckCircle2,
  Compass,
  Download,
  Hammer,
  Lightbulb,
  Medal,
  RotateCcw,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import type { AcademySettings, Lang } from '../types';
import {
  DECISION_AGE_GROUPS,
  DECISION_SCENARIOS,
  OFFSCREEN_MISSIONS,
  ROBOT_BUGS,
  type DecisionAgeGroup,
} from '../data/decisionLabData';
import {
  downloadDecisionCertificatePdf,
  renderDecisionCertificateCanvas,
} from '../utils/decisionCertificatePdf';

interface DecisionLabSectionProps {
  lang: Lang;
  settings: AcademySettings;
}

type LabTrack = 'decisions' | 'robot' | 'offscreen';

export function DecisionLabSection({ lang, settings }: DecisionLabSectionProps) {
  const [ageGroup, setAgeGroup] = useState<DecisionAgeGroup>('6-8');
  const [activeTrack, setActiveTrack] = useState<LabTrack>('decisions');

  // Track 1: Decision Simulator state
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selectedChoiceByScenario, setSelectedChoiceByScenario] = useState<
    Record<string, 'a' | 'b' | 'c'>
  >({});

  // Track 2: Spot the Bot's Bug state
  const [botIdx, setBotIdx] = useState(0);
  const [botChoiceByChallenge, setBotChoiceByChallenge] = useState<Record<string, number>>({});
  const [botCustomFixByChallenge, setBotCustomFixByChallenge] = useState<Record<string, string>>(
    {}
  );
  const [botRevealedByChallenge, setBotRevealedByChallenge] = useState<Record<string, boolean>>(
    {}
  );

  // Track 3: Off-Screen Creator Mission state
  const [missionIdx, setMissionIdx] = useState(0);
  const [reflectionAnswers, setReflectionAnswers] = useState<
    Record<string, { q1: string; q2: string }>
  >({});
  const [completedMissions, setCompletedMissions] = useState<Record<string, boolean>>({});

  // Certificate Modal state
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [certPreviewUrl, setCertPreviewUrl] = useState('');
  const [downloadingCert, setDownloadingCert] = useState(false);

  // Filtered by selected age level
  const ageScenarios = useMemo(
    () => DECISION_SCENARIOS.filter((s) => s.ageGroup === ageGroup),
    [ageGroup]
  );
  const ageBotChallenges = useMemo(
    () => ROBOT_BUGS.filter((b) => b.ageGroup === ageGroup),
    [ageGroup]
  );
  const ageMissions = useMemo(
    () => OFFSCREEN_MISSIONS.filter((m) => m.ageGroup === ageGroup),
    [ageGroup]
  );

  const currentScenario = ageScenarios[scenarioIdx] || ageScenarios[0];
  const currentBot = ageBotChallenges[botIdx] || ageBotChallenges[0];
  const currentMission = ageMissions[missionIdx] || ageMissions[0];

  const activeAgeMeta =
    DECISION_AGE_GROUPS.find((g) => g.id === ageGroup) || DECISION_AGE_GROUPS[0];

  const handleAgeSwitch = (nextAge: DecisionAgeGroup) => {
    setAgeGroup(nextAge);
    setScenarioIdx(0);
    setBotIdx(0);
    setMissionIdx(0);
  };

  // Progress counts across all age scenarios
  const decisionsCompletedCount = Object.keys(selectedChoiceByScenario).length;
  const bugsFixedCount = Object.keys(botRevealedByChallenge).filter(
    (k) => botRevealedByChallenge[k]
  ).length;
  const missionsCompletedCount = Object.keys(completedMissions).filter(
    (k) => completedMissions[k]
  ).length;

  const badges = useMemo(
    () => [
      {
        id: 'decision_maker',
        titleEn: 'Decision Maker',
        titleAr: 'صانع القرار الذكي',
        unlocked: decisionsCompletedCount >= 1,
      },
      {
        id: 'bot_debugger',
        titleEn: 'Logic Bug Hunter',
        titleAr: 'كاشف أخطاء الروبوت',
        unlocked: bugsFixedCount >= 1,
      },
      {
        id: 'offscreen_creator',
        titleEn: 'Screen-Free Innovator',
        titleAr: 'المبتكر برا الشاشة',
        unlocked: missionsCompletedCount >= 1,
      },
    ],
    [decisionsCompletedCount, bugsFixedCount, missionsCompletedCount]
  );

  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;

  const academyName =
    (lang === 'ar' ? settings.academyNameAr : settings.academyNameEn) ||
    'LinguaCraft Academy';

  // Render live A4 certificate preview when modal opens or name/progress updates
  useEffect(() => {
    if (!certModalOpen) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const canvas = await renderDecisionCertificateCanvas({
          studentName: studentName.trim() || (lang === 'ar' ? 'المبتكر الصغير' : 'Young Creator'),
          ageGroupLabel: activeAgeMeta.labelEn,
          academyName,
          logoDataUrl: settings.logoDataUrl,
          decisionsCompleted: decisionsCompletedCount,
          decisionsTotal: DECISION_SCENARIOS.length,
          bugsFixed: bugsFixedCount,
          bugsTotal: ROBOT_BUGS.length,
          missionsCompleted: missionsCompletedCount,
          missionsTotal: OFFSCREEN_MISSIONS.length,
          badges: badges.map((b) => ({ title: b.titleEn, unlocked: b.unlocked })),
        });
        if (active) {
          setCertPreviewUrl(canvas.toDataURL('image/png'));
        }
      } catch {
        // Ignore transient preview errors
      }
    }, 120);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    certModalOpen,
    studentName,
    activeAgeMeta.labelEn,
    academyName,
    settings.logoDataUrl,
    decisionsCompletedCount,
    bugsFixedCount,
    missionsCompletedCount,
    badges,
    lang,
  ]);

  const handleDownloadPdf = async () => {
    setDownloadingCert(true);
    try {
      await downloadDecisionCertificatePdf({
        studentName: studentName.trim() || (lang === 'ar' ? 'المبتكر الصغير' : 'Young Creator'),
        ageGroupLabel: activeAgeMeta.labelEn,
        academyName,
        logoDataUrl: settings.logoDataUrl,
        decisionsCompleted: decisionsCompletedCount,
        decisionsTotal: DECISION_SCENARIOS.length,
        bugsFixed: bugsFixedCount,
        bugsTotal: ROBOT_BUGS.length,
        missionsCompleted: missionsCompletedCount,
        missionsTotal: OFFSCREEN_MISSIONS.length,
        badges: badges.map((b) => ({ title: b.titleEn, unlocked: b.unlocked })),
      });
    } finally {
      setDownloadingCert(false);
    }
  };

  return (
    <section id="decision-lab" className="py-16 sm:py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Heading + Earned Medals Summary + Free Certificate CTA */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-sky-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'مجاني 100% · أمان تام (بدون كهرباء أو أدوات حادة) · 3 مستويات عمرية + شهادة PDF'
                  : '100% Free · Kid-Safe Home Challenges (Zero Electricity/Blades) · 3 Age Tiers'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              {lang === 'ar'
                ? 'مختبر صنّاع القرار والمبدعين: فكّر، اكتشف، وابتكر'
                : 'Decision Makers & Creators Lab: Think, Debug & Build'}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              {lang === 'ar'
                ? '18 نشاطاً عملياً تنمّي التفكير النقدي والقيادة والإبداع من عمر 6 إلى 14 سنة: مواقف محاكاة القرار، اكتشاف أخطاء الروبوت المنطقية، وتحديات إبداعية برا الشاشة بأدوات البيت المجانية.'
                : '18 interactive challenges across ages 6–14 to grow critical thinking, leadership, and creativity: story decision sims, robot logic bug hunts, and screen-free household builds.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 font-mono-num flex items-center gap-1.5 whitespace-nowrap">
              <Medal className="w-4 h-4 text-amber-600" />
              <span>
                {unlockedBadgesCount} / {badges.length}{' '}
                {lang === 'ar' ? 'أوسمة' : 'Medals'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCertModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>
                {lang === 'ar'
                  ? 'شهادة صانع القرار PDF مجاناً'
                  : 'Free Creator Certificate PDF'}
              </span>
            </button>
          </div>
        </div>

        {/* Controls Card: Row 1 Age Tier Selector + Row 2 Track Tabs */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
          {/* Age Tier Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900">
                {lang === 'ar' ? 'اختر المستوى العمري:' : 'Choose Age Level:'}
              </p>
              <p className="text-xs text-slate-600">
                {lang === 'ar' ? activeAgeMeta.focusAr : activeAgeMeta.focusEn}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DECISION_AGE_GROUPS.map((tier) => {
                const isSelected = ageGroup === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => handleAgeSwitch(tier.id)}
                    className={`px-3.5 py-2 rounded-xl border text-start transition-colors ${
                      isSelected
                        ? 'bg-sky-900 text-white border-sky-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold whitespace-nowrap">
                      {lang === 'ar' ? tier.shortAr : tier.shortEn}
                    </p>
                    <p
                      className={`text-[11px] truncate ${
                        isSelected ? 'text-sky-100' : 'text-slate-500'
                      }`}
                    >
                      {lang === 'ar' ? tier.focusAr : tier.focusEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between gap-3">
            {/* 3 Activity Mode Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
              {(
                [
                  {
                    id: 'decisions' as const,
                    ar: '1. محاكاة القرار',
                    en: '1. Decision Sim',
                    icon: Compass,
                  },
                  {
                    id: 'robot' as const,
                    ar: '2. اكشف غلطة الروبوت',
                    en: '2. Robot Bug Hunt',
                    icon: Bot,
                  },
                  {
                    id: 'offscreen' as const,
                    ar: '3. مهمة برا الشاشة',
                    en: '3. Off-Screen Build',
                    icon: Hammer,
                  },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = activeTrack === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTrack(tab.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-white text-sky-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? tab.ar : tab.en}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-600 font-medium font-mono-num">
              {lang === 'ar'
                ? `إنجازاتك: ${decisionsCompletedCount} قرار · ${bugsFixedCount} تصحيح روبوت · ${missionsCompletedCount} مهمة عملية`
                : `Done: ${decisionsCompletedCount} decisions · ${bugsFixedCount} bugs fixed · ${missionsCompletedCount} builds`}
            </div>
          </div>
        </div>

        {/* TRACK 1: DECISION SIMULATOR */}
        {activeTrack === 'decisions' && currentScenario && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">
                  {lang === 'ar' ? activeAgeMeta.labelAr : activeAgeMeta.labelEn} ·{' '}
                  {lang === 'ar' ? 'تحدي اتخاذ القرار' : 'Decision Challenge'}
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  {lang === 'ar' ? currentScenario.titleAr : currentScenario.titleEn}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                {ageScenarios.map((sc, i) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setScenarioIdx(i)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                      scenarioIdx === i
                        ? 'bg-sky-900 text-white border-sky-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'ar' ? `موقف ${i + 1}` : `Story ${i + 1}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Situation Prompt */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
              <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
                {lang === 'ar' ? currentScenario.situationAr : currentScenario.situationEn}
              </p>
            </div>

            {/* 3 Interactive Decisions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentScenario.choices.map((ch) => {
                const pickedKey = selectedChoiceByScenario[currentScenario.id];
                const isPicked = pickedKey === ch.key;
                const keyArabic = ch.key === 'a' ? 'أ' : ch.key === 'b' ? 'ب' : 'ج';

                let cardStyle = 'border-slate-200 bg-white hover:border-sky-400';
                if (isPicked) {
                  cardStyle = ch.isSmartest
                    ? 'border-emerald-500 bg-emerald-50/70'
                    : 'border-amber-500 bg-amber-50/70';
                }

                return (
                  <button
                    key={ch.key}
                    type="button"
                    onClick={() =>
                      setSelectedChoiceByScenario((prev) => ({
                        ...prev,
                        [currentScenario.id]: ch.key,
                      }))
                    }
                    className={`text-start border rounded-2xl p-5 transition-colors flex flex-col justify-between gap-3 ${cardStyle}`}
                  >
                    <div className="space-y-2">
                      <span className="inline-block text-xs font-bold text-sky-900 font-mono-num">
                        {lang === 'ar' ? `قرار (${keyArabic})` : `Option (${ch.key.toUpperCase()})`}
                      </span>
                      <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                        {lang === 'ar' ? ch.labelAr : ch.labelEn}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-sky-800">
                      {isPicked
                        ? lang === 'ar'
                          ? 'تم اختيار هذا القرار ✓'
                          : 'Selected ✓'
                        : lang === 'ar'
                        ? 'اضغط لتجربة النتيجة'
                        : 'Tap to see what happens'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Instant Outcome Display (No Preaching, Natural Curiosity Result) */}
            {selectedChoiceByScenario[currentScenario.id] && (() => {
              const chosen = currentScenario.choices.find(
                (c) => c.key === selectedChoiceByScenario[currentScenario.id]
              );
              if (!chosen) return null;
              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    {chosen.isSmartest ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-500">
                        {lang === 'ar' ? 'ماذا حدث فوراً؟' : 'What Happened Right Away?'}
                      </p>
                      <p className="text-base font-bold text-slate-900 leading-relaxed">
                        {lang === 'ar' ? chosen.outcomeAr : chosen.outcomeEn}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-sky-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        {lang === 'ar' ? 'المهارة المكتسبة:' : 'Skill Unlocked:'}{' '}
                        <strong className="text-slate-900">
                          {lang === 'ar' ? currentScenario.skillAr : currentScenario.skillEn}
                        </strong>
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedChoiceByScenario((prev) => {
                          const copy = { ...prev };
                          delete copy[currentScenario.id];
                          return copy;
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'ar' ? 'جرّب قراراً آخر لترى الفرق' : 'Try Another Decision'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TRACK 2: SPOT THE BOT'S BUG */}
        {activeTrack === 'robot' && currentBot && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">
                  {lang === 'ar' ? activeAgeMeta.labelAr : activeAgeMeta.labelEn} ·{' '}
                  {lang === 'ar' ? 'فحص منطق الروبوت زيكو' : "Debug Robot Ziko's Plan"}
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  {lang === 'ar' ? currentBot.titleAr : currentBot.titleEn}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                {ageBotChallenges.map((botItem, i) => (
                  <button
                    key={botItem.id}
                    type="button"
                    onClick={() => setBotIdx(i)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                      botIdx === i
                        ? 'bg-sky-900 text-white border-sky-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'ar' ? `خطة ${i + 1}` : `Plan ${i + 1}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Robot Ziko's 3-Step Plan */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                  <Bot className="w-4 h-4" />
                  <span>
                    {lang === 'ar'
                      ? 'خطة الروبوت «زيكو» المقترحة:'
                      : "Robot Ziko's Proposed Steps:"}
                  </span>
                </div>

                <ol className="space-y-3">
                  {(lang === 'ar' ? currentBot.stepsAr : currentBot.stepsEn).map((stepText, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed"
                    >
                      <span className="font-bold text-sky-900 font-mono-num shrink-0">
                        {idx + 1}.
                      </span>
                      <span>{stepText}</span>
                    </li>
                  ))}
                </ol>

                <p className="text-sm font-semibold text-slate-900 pt-1">
                  {lang === 'ar' ? currentBot.promptAr : currentBot.promptEn}
                </p>
              </div>

              {/* Child's Diagnosis & Smarter Fix Box */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-slate-700">
                    {lang === 'ar'
                      ? 'الخطوة 1: حدّد أين الغلطة المنطقية:'
                      : 'Step 1: Pinpoint the logical flaw:'}
                  </p>
                  <div className="space-y-2">
                    {(lang === 'ar' ? currentBot.bugOptionsAr : currentBot.bugOptionsEn).map(
                      (optText, optIdx) => {
                        const picked = botChoiceByChallenge[currentBot.id] === optIdx;
                        const revealed = Boolean(botRevealedByChallenge[currentBot.id]);
                        const isRight = optIdx === currentBot.correctBugIndex;

                        let style = 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100';
                        if (revealed) {
                          if (isRight) {
                            style = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                          } else if (picked) {
                            style = 'border-rose-400 bg-rose-50 text-rose-900';
                          }
                        } else if (picked) {
                          style = 'border-sky-900 bg-sky-50 text-sky-950 font-semibold';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() =>
                              setBotChoiceByChallenge((prev) => ({
                                ...prev,
                                [currentBot.id]: optIdx,
                              }))
                            }
                            className={`w-full text-start px-3.5 py-2.5 text-xs sm:text-sm border rounded-xl transition-colors flex items-center justify-between gap-2 ${style}`}
                          >
                            <span>{optText}</span>
                            {revealed && isRight && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            {revealed && picked && !isRight && (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    {lang === 'ar'
                      ? 'الخطوة 2: اكتب فكرتك للبديل الأذكى (اختياري):'
                      : 'Step 2: Suggest your smarter alternative (optional):'}
                  </label>
                  <textarea
                    rows={2}
                    value={botCustomFixByChallenge[currentBot.id] || ''}
                    onChange={(e) =>
                      setBotCustomFixByChallenge((prev) => ({
                        ...prev,
                        [currentBot.id]: e.target.value,
                      }))
                    }
                    placeholder={
                      lang === 'ar'
                        ? 'اكتب كيف ستصلح خطة الروبوت...'
                        : 'Write your smarter fix...'
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-800"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setBotRevealedByChallenge((prev) => ({
                      ...prev,
                      [currentBot.id]: true,
                    }))
                  }
                  className="w-full py-3 px-4 text-xs sm:text-sm font-bold text-white bg-sky-900 rounded-xl hover:bg-sky-800 transition-colors"
                >
                  {lang === 'ar'
                    ? 'اكشف غلطة الروبوت والحلول الذكية'
                    : "Reveal Bot's Bug & Smart Alternatives"}
                </button>

                {botRevealedByChallenge[currentBot.id] && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2.5">
                    <p className="text-xs font-bold text-emerald-900">
                      {lang === 'ar' ? currentBot.revealBugAr : currentBot.revealBugEn}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-700">
                        {lang === 'ar' ? 'بدائل ذكية مقترحة:' : 'Smart Alternatives:'}
                      </p>
                      <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                        {(lang === 'ar' ? currentBot.smartFixesAr : currentBot.smartFixesEn).map(
                          (fix, fIdx) => (
                            <li key={fIdx}>{fix}</li>
                          )
                        )}
                      </ul>
                    </div>
                    <p className="text-xs font-semibold text-sky-900 pt-1 border-t border-emerald-200">
                      {lang === 'ar' ? 'المهارة:' : 'Skill:'}{' '}
                      {lang === 'ar' ? currentBot.skillAr : currentBot.skillEn}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TRACK 3: OFF-SCREEN CREATOR MISSION */}
        {activeTrack === 'offscreen' && currentMission && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">
                  {lang === 'ar' ? activeAgeMeta.labelAr : activeAgeMeta.labelEn} ·{' '}
                  {lang === 'ar' ? 'تحدي عملي مجاني في البيت' : 'Free Home Hands-On Mission'}
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  {lang === 'ar' ? currentMission.titleAr : currentMission.titleEn}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                {ageMissions.map((mItem, i) => (
                  <button
                    key={mItem.id}
                    type="button"
                    onClick={() => setMissionIdx(i)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                      missionIdx === i
                        ? 'bg-sky-900 text-white border-sky-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'ar' ? `مهمة ${i + 1}` : `Mission ${i + 1}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Free Tools + Safety Rule + Steps */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                  <p className="text-xs font-bold text-sky-900">
                    {lang === 'ar'
                      ? 'أدوات مجانية تماماً من البيت:'
                      : '100% Free Household Materials:'}
                  </p>
                  <ul className="space-y-1.5 text-sm text-slate-800 list-disc list-inside">
                    {(lang === 'ar' ? currentMission.toolsAr : currentMission.toolsEn).map(
                      (tool, tIdx) => (
                        <li key={tIdx}>{tool}</li>
                      )
                    )}
                  </ul>

                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs font-semibold text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      {lang === 'ar' ? currentMission.safetyRuleAr : currentMission.safetyRuleEn}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                  <p className="text-xs font-bold text-slate-900">
                    {lang === 'ar' ? 'خطوات التنفيذ برا الشاشة:' : 'Off-Screen Steps:'}
                  </p>
                  <ol className="space-y-2.5 text-sm text-slate-700 leading-relaxed">
                    {(lang === 'ar' ? currentMission.stepsAr : currentMission.stepsEn).map(
                      (step, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2.5">
                          <span className="font-bold text-sky-900 font-mono-num shrink-0">
                            {sIdx + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      )
                    )}
                  </ol>
                </div>
              </div>

              {/* Right: Return to App & Explain Design Reflection */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-sky-900">
                    {lang === 'ar'
                      ? 'بعد ما تخلّص التجربة في البيت — ارجع احكيلنا:'
                      : 'Back From Building? Share Your Design Thinking:'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lang === 'ar'
                      ? 'اشرح فكرتك وسبب تصميمك لتحصل على وسام المبتكر وتُضاف لشهادتك!'
                      : 'Explain what happened and why your design worked to unlock your Innovator Medal!'}
                  </p>
                </div>

                {(lang === 'ar'
                  ? currentMission.reflectionPromptsAr
                  : currentMission.reflectionPromptsEn
                ).map((promptText, qIdx) => {
                  const fieldKey = qIdx === 0 ? 'q1' : 'q2';
                  const currentVal =
                    reflectionAnswers[currentMission.id]?.[fieldKey] || '';
                  return (
                    <div key={qIdx} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-800">
                        {qIdx + 1}. {promptText}
                      </label>
                      <textarea
                        rows={2}
                        value={currentVal}
                        onChange={(e) =>
                          setReflectionAnswers((prev) => ({
                            ...prev,
                            [currentMission.id]: {
                              q1:
                                fieldKey === 'q1'
                                  ? e.target.value
                                  : prev[currentMission.id]?.q1 || '',
                              q2:
                                fieldKey === 'q2'
                                  ? e.target.value
                                  : prev[currentMission.id]?.q2 || '',
                            },
                          }))
                        }
                        placeholder={
                          lang === 'ar'
                            ? 'اكتب فكرتك هنا بكلماتك البسيطة...'
                            : 'Write your explanation here...'
                        }
                        className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-800"
                      />
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() =>
                    setCompletedMissions((prev) => ({
                      ...prev,
                      [currentMission.id]: true,
                    }))
                  }
                  className="w-full py-3 px-4 text-xs sm:text-sm font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Medal className="w-4 h-4 text-amber-300" />
                  <span>
                    {completedMissions[currentMission.id]
                      ? lang === 'ar'
                        ? 'تم تثبيت الإنجاز واستلام الوسام ✓'
                        : 'Mission Completed & Medal Unlocked ✓'
                      : lang === 'ar'
                      ? 'تم التنفيذ! ثبّت الإنجاز واستلم الوسام'
                      : 'Completed Off-Screen! Claim Medal'}
                  </span>
                </button>

                {completedMissions[currentMission.id] && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
                    <p className="text-xs font-bold text-amber-950">
                      {lang === 'ar'
                        ? `مبروك! حصلت على وسام: «${currentMission.badgeTitleAr}»`
                        : `Awesome! Unlocked: "${currentMission.badgeTitleEn}"`}
                    </p>
                    <p className="text-xs text-amber-900">
                      {lang === 'ar' ? 'المهارة المكتسبة:' : 'Skill Unlocked:'}{' '}
                      {lang === 'ar' ? currentMission.skillAr : currentMission.skillEn}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Free Personalized PDF Certificate Modal */}
      {certModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-700">
                  {lang === 'ar' ? 'مجانية 100% للتحميل والطباعة' : '100% Free Printable Award'}
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  {lang === 'ar'
                    ? 'شهادة صانع القرار والمبتكر الصغير (PDF)'
                    : 'Young Decision Maker & Creator Certificate (PDF)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCertModalOpen(false)}
                aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                {lang === 'ar'
                  ? 'اكتب اسم الطفل ليُطبع على الشهادة:'
                  : "Enter the child's name to print on the certificate:"}
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: سلمى محمد / Salma Mohamed' : 'e.g. Adam Karim'}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-sky-900"
              />
            </div>

            {certPreviewUrl && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <img
                  src={certPreviewUrl}
                  alt={lang === 'ar' ? 'معاينة الشهادة' : 'Certificate preview'}
                  className="w-full h-auto block"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCertModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                disabled={downloadingCert}
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-sky-900 rounded-xl hover:bg-sky-800 disabled:opacity-60 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloadingCert
                    ? lang === 'ar'
                      ? 'جاري تجهيز الـ PDF...'
                      : 'Preparing PDF...'
                    : lang === 'ar'
                    ? 'تحميل الشهادة PDF مجاناً'
                    : 'Download Free PDF Certificate'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
