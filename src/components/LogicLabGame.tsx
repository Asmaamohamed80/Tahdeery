import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BatteryCharging,
  Bug,
  CheckCircle2,
  Gem,
  HelpCircle,
  Package,
  Play,
  Plus,
  Recycle,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { Lang } from '../types';
import {
  ACTION_LABELS,
  CONDITION_LABELS,
  LOGIC_LAB_MISSIONS,
  type ConveyorParcel,
  type LogicActionKey,
  type LogicConditionKey,
  type LogicRuleBlock,
} from '../data/codingLevels';

interface LogicLabGameProps {
  lang: Lang;
  solvedMissions: number[];
  onMissionSolved: (missionId: number) => void;
}

function playSynthTone(type: 'scan' | 'ok' | 'bug' | 'win', enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'scan') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'ok') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.setValueAtTime(880, now + 0.07);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.17);
    } else if (type === 'bug') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(165, now + 0.12);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.26);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.09);
      osc.frequency.setValueAtTime(783.99, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc.start(now);
      osc.stop(now + 0.37);
    }
    setTimeout(() => {
      void ctx.close().catch(() => undefined);
    }, 450);
  } catch {
    // Ignore audio errors on restricted devices
  }
}

function ParcelVisual({ parcel, active }: { parcel: ConveyorParcel; active: boolean }) {
  const baseClass = `w-14 h-14 sm:w-16 sm:h-16 rounded-xl border flex flex-col items-center justify-center transition-transform duration-200 ${
    active ? 'scale-110 ring-2 ring-amber-400 shadow-md' : ''
  }`;

  if (parcel.kind === 'apple') {
    return (
      <div className={`${baseClass} bg-emerald-50 border-emerald-300 text-emerald-900`}>
        <span className="text-lg font-bold leading-none">A</span>
        <span className="text-[10px] font-mono-num font-semibold mt-0.5">apple</span>
      </div>
    );
  }
  if (parcel.kind === 'gem') {
    return (
      <div className={`${baseClass} bg-sky-50 border-sky-300 text-sky-900`}>
        <Gem className="w-5 h-5 text-sky-700" />
        <span className="text-[10px] font-mono-num font-semibold mt-0.5">gem</span>
      </div>
    );
  }
  if (parcel.kind === 'battery') {
    return (
      <div className={`${baseClass} bg-amber-50 border-amber-300 text-amber-900`}>
        <BatteryCharging className="w-5 h-5 text-amber-700" />
        <span className="text-[10px] font-mono-num font-semibold mt-0.5">battery</span>
      </div>
    );
  }
  if (parcel.kind === 'hazard') {
    return (
      <div className={`${baseClass} bg-rose-50 border-rose-300 text-rose-900`}>
        <AlertTriangle className="w-5 h-5 text-rose-700" />
        <span className="text-[10px] font-mono-num font-semibold mt-0.5">hazard</span>
      </div>
    );
  }
  if (parcel.kind === 'number') {
    return (
      <div className={`${baseClass} bg-slate-900 border-slate-700 text-white`}>
        <span className="text-base font-mono-num font-bold">{parcel.numValue}</span>
        <span className="text-[9px] font-mono-num text-slate-300">number</span>
      </div>
    );
  }
  return (
    <div className={`${baseClass} bg-slate-100 border-slate-300 text-slate-700`}>
      <Recycle className="w-5 h-5 text-slate-600" />
      <span className="text-[10px] font-mono-num font-semibold mt-0.5">trash</span>
    </div>
  );
}

function matchesCondition(parcel: ConveyorParcel, cond: LogicConditionKey): boolean {
  if (cond === 'else') return true;
  if (cond === 'isApple') return parcel.kind === 'apple';
  if (cond === 'isGem') return parcel.kind === 'gem';
  if (cond === 'isBattery') return parcel.kind === 'battery';
  if (cond === 'isHazard') return parcel.kind === 'hazard';
  if (cond === 'isEven') return typeof parcel.numValue === 'number' && parcel.numValue % 2 === 0;
  return false;
}

export function LogicLabGame({ lang, solvedMissions, onMissionSolved }: LogicLabGameProps) {
  const [missionIdx, setMissionIdx] = useState(0);
  const mission = LOGIC_LAB_MISSIONS[missionIdx] || LOGIC_LAB_MISSIONS[0];

  const [rules, setRules] = useState<LogicRuleBlock[]>(() =>
    mission.starterRules.map((r) => ({ ...r }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [activeParcelIdx, setActiveParcelIdx] = useState<number | null>(null);
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [processedOkCount, setProcessedOkCount] = useState(0);
  const [lastDockLabel, setLastDockLabel] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: 'idle' | 'win' | 'bug';
    textAr: string;
    textEn: string;
  }>({ type: 'idle', textAr: '', textEn: '' });

  const runTokenRef = useRef(0);

  const resetRunState = () => {
    runTokenRef.current += 1;
    setIsRunning(false);
    setActiveParcelIdx(null);
    setActiveRuleId(null);
    setProcessedOkCount(0);
    setLastDockLabel('');
    setFeedback({ type: 'idle', textAr: '', textEn: '' });
  };

  const selectMission = (nextIdx: number) => {
    const target = LOGIC_LAB_MISSIONS[nextIdx] || LOGIC_LAB_MISSIONS[0];
    setMissionIdx(nextIdx);
    setRules(target.starterRules.map((r) => ({ ...r })));
    setShowHint(false);
    resetRunState();
  };

  useEffect(() => {
    return () => {
      runTokenRef.current += 1;
    };
  }, []);

  const addRule = () => {
    if (isRunning || rules.length >= 6) return;
    const defaultCond =
      mission.allowedConditions.find((c) => !rules.some((r) => r.condition === c)) ||
      mission.allowedConditions[0];
    const defaultAct = mission.allowedActions[0];
    setRules((prev) => [
      ...prev,
      {
        id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        condition: defaultCond,
        action: defaultAct,
      },
    ]);
    if (feedback.type !== 'idle') resetRunState();
  };

  const updateRule = (
    id: string,
    field: 'condition' | 'action',
    value: LogicConditionKey | LogicActionKey
  ) => {
    if (isRunning) return;
    setRules((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              [field]: value,
            }
          : r
      )
    );
    if (feedback.type !== 'idle') resetRunState();
  };

  const moveRule = (index: number, dir: -1 | 1) => {
    if (isRunning) return;
    const nextIndex = index + dir;
    if (nextIndex < 0 || nextIndex >= rules.length) return;
    setRules((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = temp;
      return copy;
    });
    if (feedback.type !== 'idle') resetRunState();
  };

  const deleteRule = (id: string) => {
    if (isRunning) return;
    setRules((prev) => prev.filter((r) => r.id !== id));
    if (feedback.type !== 'idle') resetRunState();
  };

  const runConveyor = async () => {
    if (isRunning || rules.length === 0) return;
    const token = runTokenRef.current + 1;
    runTokenRef.current = token;

    setIsRunning(true);
    setActiveParcelIdx(null);
    setActiveRuleId(null);
    setProcessedOkCount(0);
    setLastDockLabel('');
    setFeedback({ type: 'idle', textAr: '', textEn: '' });

    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
    await sleep(180);

    for (let i = 0; i < mission.items.length; i += 1) {
      if (runTokenRef.current !== token) return;
      const parcel = mission.items[i];
      setActiveParcelIdx(i);
      playSynthTone('scan', soundEnabled);

      let matchedRule: LogicRuleBlock | undefined;
      for (const rule of rules) {
        if (matchesCondition(parcel, rule.condition)) {
          matchedRule = rule;
          break;
        }
      }

      if (!matchedRule) {
        setIsRunning(false);
        setActiveRuleId(null);
        playSynthTone('bug', soundEnabled);
        setFeedback({
          type: 'bug',
          textAr: `توقّف الخط عند العنصر (${parcel.labelEn})! لا يوجد شرط يطابقه — أضف فرع else في النهاية.`,
          textEn: `Belt halted at "${parcel.labelEn}"! No condition matched it—add a fallback "else" rule.`,
        });
        return;
      }

      setActiveRuleId(matchedRule.id);
      setLastDockLabel(ACTION_LABELS[matchedRule.action]);
      await sleep(520);
      if (runTokenRef.current !== token) return;

      if (matchedRule.action !== parcel.expectedAction) {
        setIsRunning(false);
        playSynthTone('bug', soundEnabled);
        setFeedback({
          type: 'bug',
          textAr: `خطأ برمجي (Bug): عند فحص (${parcel.labelEn}) نفّذ الكود ${ACTION_LABELS[matchedRule.action]} بدلاً من ${ACTION_LABELS[parcel.expectedAction]}! عدّل القاعدة وأعد التشغيل.`,
          textEn: `Bug caught! For "${parcel.labelEn}", your code ran ${ACTION_LABELS[matchedRule.action]} instead of ${ACTION_LABELS[parcel.expectedAction]}. Fix that branch!`,
        });
        return;
      }

      playSynthTone('ok', soundEnabled);
      setProcessedOkCount(i + 1);
      await sleep(220);
    }

    if (runTokenRef.current !== token) return;
    setIsRunning(false);
    setActiveRuleId(null);
    playSynthTone('win', soundEnabled);
    onMissionSolved(mission.id);
    setFeedback({
      type: 'win',
      textAr: `عمل رائع! اجتازت كل الشحنات (${mission.items.length}/${mission.items.length}) بوابة الفحص بنجاح تام!`,
      textEn: `Mission Accomplished! All ${mission.items.length}/${mission.items.length} parcels routed cleanly with zero bugs!`,
    });
  };

  const generatedJsCode = useMemo(() => {
    if (rules.length === 0) {
      return '// Add if / else rules to control the factory scanner...';
    }
    return rules
      .map((rule, idx) => {
        const keyword =
          rule.condition === 'else'
            ? 'else'
            : idx === 0
            ? `if (${CONDITION_LABELS[rule.condition]})`
            : `else if (${CONDITION_LABELS[rule.condition]})`;
        return `${keyword} {\n  ${ACTION_LABELS[rule.action]};\n}`;
      })
      .join(' ');
  }, [rules]);

  const dockTargetBadge = (action: LogicActionKey) => {
    switch (action) {
      case 'packBox':
        return { label: 'packBox()', icon: Package, tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'vaultGem':
        return { label: 'storeInVault()', icon: Gem, tone: 'text-sky-800 bg-sky-50 border-sky-200' };
      case 'chargeBot':
        return { label: 'chargeBattery()', icon: BatteryCharging, tone: 'text-amber-800 bg-amber-50 border-amber-200' };
      case 'activateShield':
        return { label: 'activateShield()', icon: ShieldAlert, tone: 'text-rose-800 bg-rose-50 border-rose-200' };
      default:
        return { label: 'recycleTrash()', icon: Recycle, tone: 'text-slate-700 bg-slate-100 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* 5 Mission Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {LOGIC_LAB_MISSIONS.map((m, idx) => {
            const isActive = idx === missionIdx;
            const isSolved = solvedMissions.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => selectMission(idx)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-900 text-white border-sky-900'
                    : isSolved
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono-num">M{m.id}</span>
                <span>{m.isBugHunter ? 'Bug Hunter' : `Gate ${m.id}`}</span>
                {isSolved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled((s) => !s)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap shrink-0"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-900" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          <span>{soundEnabled ? (lang === 'ar' ? 'الصوت مُفعّل' : 'SFX On') : (lang === 'ar' ? 'صامت' : 'Muted')}</span>
        </button>
      </div>

      {/* Main Split Workspace: Left Conveyor Scanner + Right English If/Else Code Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Interactive Conveyor Belt & Laser Scanner Stage */}
        <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-sky-900">
                {lang === 'ar' ? mission.conceptAr : mission.conceptEn}
              </p>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {lang === 'ar' ? mission.titleAr : mission.titleEn}
              </h3>
              <p className="text-xs text-slate-600">
                {lang === 'ar' ? mission.goalAr : mission.goalEn}
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
              {lang === 'ar' ? mission.hintAr : mission.hintEn}
            </p>
          )}

          {/* Belt Stage */}
          <div dir="ltr" className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between text-xs font-mono-num text-slate-500">
              <span>SCANNER BELT</span>
              <span>
                PROCESSED: <strong className="text-slate-900">{processedOkCount}</strong> / {mission.items.length}
              </span>
            </div>

            {/* Cargo Row */}
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
              <div className="flex items-center justify-center gap-3 min-w-max">
                {mission.items.map((parcel, idx) => {
                  const isCurrent = activeParcelIdx === idx;
                  const isDone = idx < processedOkCount;
                  return (
                    <div
                      key={parcel.id}
                      className={`relative transition-opacity duration-200 ${
                        isDone ? 'opacity-35' : 'opacity-100'
                      }`}
                    >
                      {isCurrent && (
                        <div className="text-[10px] font-mono-num font-bold text-amber-300 text-center mb-1">
                          SCANNING
                        </div>
                      )}
                      <ParcelVisual parcel={parcel} active={isCurrent} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Action Output Docks */}
            <div className="space-y-2">
              <p className="text-[11px] font-mono-num font-semibold text-slate-500">
                OUTPUT DISPATCH DOCKS:
              </p>
              <div className="flex flex-wrap gap-2">
                {mission.allowedActions.map((act) => {
                  const info = dockTargetBadge(act);
                  const Icon = info.icon;
                  const isHit = lastDockLabel === info.label;
                  return (
                    <div
                      key={act}
                      className={`px-3 py-2 rounded-xl border text-xs font-mono-num font-semibold flex items-center gap-1.5 transition-transform duration-200 ${
                        info.tone
                      } ${isHit ? 'scale-105 ring-2 ring-amber-400' : ''}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{info.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Win / Bug Banner */}
          {feedback.type !== 'idle' && (
            <div
              className={`p-4 rounded-xl border text-xs sm:text-sm font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                feedback.type === 'win'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {feedback.type === 'win' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <Bug className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                )}
                <span>{lang === 'ar' ? feedback.textAr : feedback.textEn}</span>
              </div>
              {feedback.type === 'win' && missionIdx + 1 < LOGIC_LAB_MISSIONS.length && (
                <button
                  type="button"
                  onClick={() => selectMission(missionIdx + 1)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-600 whitespace-nowrap shrink-0"
                >
                  {lang === 'ar' ? 'المهمة التالية' : 'Next Mission'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Pure English If/Else Rule Stack & Live JS Preview */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {lang === 'ar'
                  ? 'رتّب شروط البرمجة بالإنجليزية (If / Else Rules):'
                  : 'Build Conditional Rules (If / Else):'}
              </h4>
              <p className="text-xs text-slate-500">
                {lang === 'ar'
                  ? 'يفحص الكمبيوتر القواعد بالترتيب من أعلى إلى أسفل.'
                  : 'Rules are evaluated top-to-bottom for each parcel.'}
              </p>
            </div>
            <button
              type="button"
              disabled={isRunning || rules.length >= 6}
              onClick={addRule}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-sky-900 rounded-lg hover:bg-sky-800 disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{rules.length === 0 ? 'Add if ()' : 'Add else if / else'}</span>
            </button>
          </div>

          {rules.length === 0 ? (
            <div className="p-6 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
              {lang === 'ar'
                ? 'اضغط على "Add if ()" لإنشاء أول قاعدة منطقية للماسح الضوئي!'
                : 'Click "Add if ()" above to create your first conditional branch!'}
            </div>
          ) : (
            <div dir="ltr" className="space-y-2.5">
              {rules.map((rule, idx) => {
                const isFiring = activeRuleId === rule.id;
                const branchWord =
                  rule.condition === 'else' ? 'else' : idx === 0 ? 'if' : 'else if';
                return (
                  <div
                    key={rule.id}
                    className={`p-3 rounded-xl border flex flex-wrap items-center gap-2 transition-colors ${
                      isFiring
                        ? 'bg-amber-50 border-amber-400'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="px-2 py-1 text-xs font-mono-num font-bold text-sky-900 bg-sky-100 rounded-md">
                      {branchWord}
                    </span>

                    <select
                      disabled={isRunning}
                      value={rule.condition}
                      onChange={(e) =>
                        updateRule(rule.id, 'condition', e.target.value as LogicConditionKey)
                      }
                      className="px-2.5 py-1.5 text-xs font-mono-num font-semibold bg-white border border-slate-300 rounded-lg text-slate-900"
                    >
                      {mission.allowedConditions.map((c) => (
                        <option key={c} value={c}>
                          {CONDITION_LABELS[c]}
                        </option>
                      ))}
                    </select>

                    <span className="text-xs font-mono-num text-slate-500">-&gt;</span>

                    <select
                      disabled={isRunning}
                      value={rule.action}
                      onChange={(e) =>
                        updateRule(rule.id, 'action', e.target.value as LogicActionKey)
                      }
                      className="px-2.5 py-1.5 text-xs font-mono-num font-semibold bg-white border border-emerald-300 rounded-lg text-emerald-950"
                    >
                      {mission.allowedActions.map((a) => (
                        <option key={a} value={a}>
                          {ACTION_LABELS[a]}
                        </option>
                      ))}
                    </select>

                    <div className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isRunning || idx === 0}
                        onClick={() => moveRule(idx, -1)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                        aria-label="Move rule up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isRunning || idx === rules.length - 1}
                        onClick={() => moveRule(idx, 1)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                        aria-label="Move rule down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isRunning}
                        onClick={() => deleteRule(rule.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 disabled:opacity-30"
                        aria-label="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={isRunning || rules.length === 0}
              onClick={runConveyor}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>
                {isRunning
                  ? lang === 'ar'
                    ? 'جاري تشغيل السير...'
                    : 'Scanning Belt...'
                  : 'Run Code'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => selectMission(missionIdx)}
              className="inline-flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>

          {/* Live JavaScript Preview */}
          <div dir="ltr" className="bg-slate-900 text-emerald-300 rounded-xl p-4 font-mono-num text-xs overflow-x-auto leading-relaxed">
            <pre className="whitespace-pre-wrap">{generatedJsCode}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
