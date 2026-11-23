import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Lock, RotateCcw, Volume2, X, XCircle } from 'lucide-react';
import type { GradeResource, Lang, QuestionBankItem } from '../types';
import { t } from '../i18n';
import { speakEnglishText } from '../utils/englishSpeech';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  unitLabel?: string;
}

interface InteractiveQuizModalProps {
  resource: GradeResource | null;
  lang: Lang;
  academyName?: string;
  logoDataUrl?: string;
  questionBank?: QuestionBankItem[];
  onClose: () => void;
  onBuyFull: (resource: GradeResource) => void;
}

export function InteractiveQuizModal({
  resource,
  lang,
  academyName,
  logoDataUrl,
  questionBank = [],
  onClose,
  onBuyFull,
}: InteractiveQuizModalProps) {
  const labels = t(lang);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    setSelectedAnswers({});
  }, [resource?.id]);

  const { questions, sourceMode } = useMemo<{
    questions: QuizQuestion[];
    sourceMode: 'json' | 'bank' | 'sample';
  }>(() => {
    if (!resource) return { questions: [], sourceMode: 'sample' };

    try {
      const parsed = JSON.parse(resource.contentText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          questions: parsed.map((q) => ({
            question: String(q.question || q.prompt || ''),
            options: Array.isArray(q.options) ? q.options.map(String) : [],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.explanation ? String(q.explanation) : undefined,
            unitLabel: q.unitLabel ? String(q.unitLabel) : undefined,
          })),
          sourceMode: 'json',
        };
      }
    } catch {
      // Fallback to grade Question Bank items if resource contentText is plain prose
    }

    const gradeBankItems = questionBank.filter((q) => q.gradeId === resource.gradeId);
    if (gradeBankItems.length > 0) {
      return {
        questions: gradeBankItems.map((q) => ({
          question: q.prompt,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          unitLabel: q.unitLabel,
        })),
        sourceMode: 'bank',
      };
    }

    return {
      questions: [
        {
          question: 'Choose the correct verb: She ______ English stories every evening.',
          options: ['read', 'reads', 'reading', 'to read'],
          correctIndex: 1,
          explanation: 'With third-person singular "She" in Present Simple, add -s to the verb.',
        },
        {
          question: 'Identify the synonym of "brilliant" in academic English:',
          options: ['ordinary', 'outstanding', 'careless', 'quiet'],
          correctIndex: 1,
          explanation: '"Outstanding" means exceptionally good or brilliant.',
        },
      ],
      sourceMode: 'sample',
    };
  }, [resource, questionBank]);

  if (!resource) return null;

  const previewLimit = resource.isPaid ? Math.min(2, questions.length) : questions.length;
  const visibleQuestions = questions.slice(0, previewLimit);
  const answeredCount = Object.keys(selectedAnswers).length;
  const score = visibleQuestions.reduce((acc, q, idx) => {
    return acc + (selectedAnswers[idx] === q.correctIndex ? 1 : 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            {(logoDataUrl || academyName) && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {logoDataUrl && (
                  <img
                    src={logoDataUrl}
                    alt={academyName || ''}
                    referrerPolicy="no-referrer"
                    className="h-6 w-auto max-w-[80px] object-contain rounded"
                  />
                )}
                {academyName && <span className="font-semibold text-sky-900">{academyName}</span>}
              </div>
            )}
            <p className="text-xs font-semibold text-sky-900">
              {resource.id.startsWith('bank_quiz_') || sourceMode === 'bank'
                ? lang === 'ar'
                  ? 'أسئلة تفاعلية من بنك الصف الدراسي'
                  : 'Interactive Grade Question Bank Practice'
                : lang === 'ar'
                ? 'معاينة النشاط التفاعلي'
                : 'Interactive Activity Sandbox'}
            </p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              {lang === 'ar' ? resource.titleAr : resource.titleEn}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.closeBtn}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-slate-700 font-medium">
              {lang === 'ar' ? 'النتيجة الحالية:' : 'Current Score:'}{' '}
              <strong className="font-mono-num text-sky-900">
                {score} / {visibleQuestions.length}
              </strong>
            </span>
            <span className="text-xs text-slate-500 font-mono-num">
              {lang === 'ar'
                ? `تمت الإجابة على ${answeredCount} من ${visibleQuestions.length}`
                : `${answeredCount} / ${visibleQuestions.length} answered`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedAnswers({})}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'إعادة المحاولة' : 'Reset'}</span>
          </button>
        </div>

        <div className="space-y-5" dir="ltr">
          {visibleQuestions.map((q, qIdx) => {
            const picked = selectedAnswers[qIdx];
            const hasAnswered = picked !== undefined;
            return (
              <div key={qIdx} className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    {q.unitLabel && (
                      <p className="text-xs font-semibold text-sky-800">{q.unitLabel}</p>
                    )}
                    <p className="font-semibold text-slate-900 text-sm sm:text-base">
                      {qIdx + 1}. {q.question}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakEnglishText(q.question)}
                    title={lang === 'ar' ? 'استماع للسؤال بالإنجليزية' : 'Listen to question'}
                    aria-label={lang === 'ar' ? 'استماع للسؤال بالإنجليزية' : 'Listen to question'}
                    className="p-2 text-sky-900 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isPicked = picked === optIdx;
                    const isCorrect = optIdx === q.correctIndex;
                    let btnStyle = 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50';
                    if (hasAnswered) {
                      if (isCorrect) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                      } else if (isPicked) {
                        btnStyle = 'border-rose-400 bg-rose-50 text-rose-900';
                      }
                    }
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                        className={`text-left px-3.5 py-2.5 text-sm border rounded-lg transition-colors flex items-center justify-between gap-2 ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {hasAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                        {hasAnswered && isPicked && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {hasAnswered && q.explanation && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {resource.isPaid && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-950">
                <p className="font-semibold">
                  {lang === 'ar'
                    ? 'هذه معاينة مجانية للنشاط التفاعلي'
                    : 'Free Interactive Preview'}
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  {lang === 'ar'
                    ? `اطلب الحزمة التفاعلية كاملة للطلاب والسبورة مقابل ${resource.priceEgp} ج.م عبر إنستاباي وواتساب.`
                    : `Unlock the complete interactive pack for your classroom for ${resource.priceEgp} EGP via InstaPay & WhatsApp.`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onBuyFull(resource);
              }}
              className="px-4 py-2.5 bg-sky-900 text-white text-xs font-semibold rounded-lg hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0"
            >
              {labels.buyInstapayBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
