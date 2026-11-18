import { useMemo, useState } from 'react';
import { CheckCircle2, Lock, RotateCcw, X, XCircle } from 'lucide-react';
import type { GradeResource, Lang } from '../types';
import { t } from '../i18n';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface InteractiveQuizModalProps {
  resource: GradeResource | null;
  lang: Lang;
  onClose: () => void;
  onBuyFull: (resource: GradeResource) => void;
}

export function InteractiveQuizModal({
  resource,
  lang,
  onClose,
  onBuyFull,
}: InteractiveQuizModalProps) {
  const labels = t(lang);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const questions: QuizQuestion[] = useMemo(() => {
    if (!resource) return [];
    try {
      const parsed = JSON.parse(resource.contentText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback sample interactive questions if resource contentText is plain prose
    }
    return [
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
    ];
  }, [resource]);

  if (!resource) return null;

  const previewLimit = resource.isPaid ? Math.min(2, questions.length) : questions.length;
  const visibleQuestions = questions.slice(0, previewLimit);
  const score = visibleQuestions.reduce((acc, q, idx) => {
    return acc + (selectedAnswers[idx] === q.correctIndex ? 1 : 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-sky-900">
              {lang === 'ar' ? 'معاينة النشاط التفاعلي' : 'Interactive Activity Sandbox'}
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

        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
          <span className="text-slate-700 font-medium">
            {lang === 'ar' ? 'النتيجة الحالية:' : 'Current Score:'}{' '}
            <strong className="font-mono-num text-sky-900">
              {score} / {visibleQuestions.length}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => setSelectedAnswers({})}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
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
                <p className="font-semibold text-slate-900 text-sm sm:text-base">
                  {qIdx + 1}. {q.question}
                </p>
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
