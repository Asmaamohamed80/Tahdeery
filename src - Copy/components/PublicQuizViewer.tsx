import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Send, XCircle } from 'lucide-react';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { DEMO_STUDENT_QUIZ } from '../data/starterCatalog';
import type { AcademySettings, Lang, TeacherQuiz } from '../types';

interface PublicQuizViewerProps {
  quizId: string;
  lang: Lang;
  settings: AcademySettings;
  onBackHome: () => void;
}

export function PublicQuizViewer({ quizId, lang, settings, onBackHome }: PublicQuizViewerProps) {
  const [quiz, setQuiz] = useState<TeacherQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [studentGroup, setStudentGroup] = useState('');
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    score: number;
    total: number;
    percentage: number;
  } | null>(null);
  const [submitError, setSubmitError] = useState('');

  const isDemo = quizId === 'demo_preview';

  useEffect(() => {
    let active = true;
    async function load() {
      if (isDemo) {
        setQuiz(DEMO_STUDENT_QUIZ);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'teacher_quizzes', quizId));
        if (!active) return;
        if (!snap.exists()) {
          setNotFound(true);
        } else {
          const data = snap.data() as Omit<TeacherQuiz, 'id'>;
          if (!data.isPublished) {
            setNotFound(true);
          } else {
            setQuiz({ id: snap.id, ...data });
          }
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [quizId, isDemo]);

  const submitQuiz = async () => {
    if (!quiz || submitting || submittedResult) return;
    setSubmitting(true);
    setSubmitError('');

    const total = quiz.questions.length;
    const answerArray = quiz.questions.map((_, idx) =>
      typeof answers[idx] === 'number' ? answers[idx] : -1
    );
    const score = quiz.questions.reduce((acc, q, idx) => {
      return acc + (answerArray[idx] === q.correctIndex ? 1 : 0);
    }, 0);
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    try {
      if (!isDemo) {
        await addDoc(collection(db, 'quiz_attempts'), {
          quizId: quiz.id,
          quizOwnerUid: quiz.ownerUid,
          studentName: studentName.trim().slice(0, 100),
          ...(studentGroup.trim() ? { studentGroup: studentGroup.trim().slice(0, 80) } : {}),
          score,
          totalQuestions: total,
          percentage,
          answers: answerArray,
          submittedAt: serverTimestamp(),
        });
      }
      setSubmittedResult({ score, total, percentage });
    } catch {
      setSubmitError(
        lang === 'ar'
          ? 'حدث خطأ أثناء إرسال الإجابات، يرجى المحاولة مرة أخرى.'
          : 'Could not save your submission. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!started || submittedResult || !quiz || quiz.timeLimitMinutes <= 0) return;
    setSecondsLeft(quiz.timeLimitMinutes * 60);
  }, [started, submittedResult, quiz]);

  useEffect(() => {
    if (!started || submittedResult || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      void submitQuiz();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, submittedResult, secondsLeft]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentName.trim().length < 2) return;
    setStarted(true);
  };

  return (
    <main className="min-h-[82vh] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 text-sm font-semibold text-sky-900 hover:underline whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'ar' ? 'العودة إلى الرئيسية' : 'Back to Home'}</span>
          </button>

          {settings.logoDataUrl && (
            <div className="flex items-center gap-2">
              <img
                src={settings.logoDataUrl}
                alt={lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
                referrerPolicy="no-referrer"
                className="h-7 w-auto max-w-[96px] object-contain rounded"
              />
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                {lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-600">
            {lang === 'ar' ? 'جاري تحميل الاختبار...' : 'Loading quiz...'}
          </div>
        ) : notFound || !quiz ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              {lang === 'ar' ? 'الاختبار غير متاح حالياً' : 'Quiz Not Available'}
            </h2>
            <p className="text-sm text-slate-600">
              {lang === 'ar'
                ? 'تأكد من صحة الرابط مع معلمك أو عُد للصفحة الرئيسية.'
                : 'Please verify the link with your teacher or return home.'}
            </p>
          </div>
        ) : !started ? (
          <form
            onSubmit={handleStart}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6"
          >
            <div className="space-y-2 border-b border-slate-200 pb-5">
              <p className="text-xs font-semibold text-sky-900">
                {quiz.gradeLabel} · {quiz.teacherName}
                {quiz.schoolOrCenter ? ` · ${quiz.schoolOrCenter}` : ''}
              </p>
              <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
              <p className="text-xs text-slate-500 font-mono-num">
                {quiz.questions.length} {lang === 'ar' ? 'سؤال اختيار من متعدد' : 'questions'}
                {quiz.timeLimitMinutes > 0
                  ? ` · ${quiz.timeLimitMinutes} ${lang === 'ar' ? 'دقيقة' : 'min'}`
                  : ` · ${lang === 'ar' ? 'بدون وقت محدد' : 'Untimed'}`}
              </p>
            </div>

            {isDemo && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
                {lang === 'ar'
                  ? 'هذا نموذج تجريبي لاستعراض شكل الاختبار أمام الطالب وتصحيحه التلقائي.'
                  : 'Preview mode: experience how your students enter their name, answer questions, and receive instant scores.'}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {lang === 'ar' ? 'اسم الطالب بالكامل *' : 'Student Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: سيف الدين محمد' : 'e.g. Seif Mohamed'}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {lang === 'ar' ? 'المجموعة أو الفصل (اختياري)' : 'Class / Group (Optional)'}
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={studentGroup}
                  onChange={(e) => setStudentGroup(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: مجموعة 4 ب' : 'e.g. Group B'}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 transition-colors"
            >
              {lang === 'ar' ? 'ابدأ الاختبار الآن' : 'Start Quiz Now'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Active Quiz Header */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-bold text-slate-900">{quiz.title}</h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  {studentName}
                  {studentGroup ? ` · ${studentGroup}` : ''}
                </p>
              </div>
              {secondsLeft !== null && !submittedResult && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono-num bg-amber-50 text-amber-900 border border-amber-200 rounded-lg">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimer(secondsLeft)}</span>
                </div>
              )}
            </div>

            {/* Score Summary Card after Submission */}
            {submittedResult && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700">
                      {isDemo
                        ? lang === 'ar'
                          ? 'نتيجة النموذج التجريبي'
                          : 'Sample Quiz Result'
                        : lang === 'ar'
                        ? 'تم تسجيل درجتك لدى المعلم بنجاح'
                        : 'Your score has been recorded for your teacher'}
                    </p>
                    <h2 className="text-2xl font-bold text-slate-900 mt-1 font-mono-num">
                      {submittedResult.score} / {submittedResult.total} ({submittedResult.percentage}%)
                    </h2>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg ${
                      submittedResult.percentage >= 50
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {submittedResult.percentage >= 50 ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>
                      {submittedResult.percentage >= 50
                        ? lang === 'ar'
                          ? 'ناجح — أحسنت!'
                          : 'Passed — Great Job!'
                        : lang === 'ar'
                        ? 'يحتاج مراجعة إضافية'
                        : 'Needs Review'}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {quiz.questions.map((q, qIdx) => {
                const chosen = answers[qIdx];
                return (
                  <div
                    key={q.id}
                    dir="ltr"
                    className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4"
                  >
                    <p className="text-sm sm:text-base font-semibold text-slate-900">
                      <span className="font-mono-num text-sky-900 mr-2">Q{qIdx + 1}.</span>
                      {q.prompt}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = chosen === oIdx;
                        const isCorrect = q.correctIndex === oIdx;
                        let style =
                          'border-slate-200 bg-slate-50 text-slate-800 hover:border-sky-800';
                        if (submittedResult) {
                          if (isCorrect) {
                            style = 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold';
                          } else if (isSelected && !isCorrect) {
                            style = 'border-rose-600 bg-rose-50 text-rose-900';
                          }
                        } else if (isSelected) {
                          style = 'border-sky-900 bg-sky-50 text-sky-950 font-semibold';
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={Boolean(submittedResult)}
                            onClick={() => setAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))}
                            className={`text-left px-4 py-3 text-sm rounded-xl border transition-colors min-h-[44px] flex items-center justify-between gap-2 ${style}`}
                          >
                            <span>{opt}</span>
                            {submittedResult && isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            )}
                            {submittedResult && isSelected && !isCorrect && (
                              <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {submittedResult && q.explanation && (
                      <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {submitError && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                {submitError}
              </p>
            )}

            {!submittedResult && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitQuiz()}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting
                    ? lang === 'ar'
                      ? 'جاري تسجيل النتيجة...'
                      : 'Submitting...'
                    : lang === 'ar'
                    ? 'تسليم الإجابات وعرض النتيجة'
                    : 'Submit Answers & See Score'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
