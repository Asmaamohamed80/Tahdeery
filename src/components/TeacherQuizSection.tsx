import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  Copy,
  Download,
  ExternalLink,
  Lock,
  Play,
  Plus,
  Share2,
  Trash2,
} from 'lucide-react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  GRADES,
  type AcademySettings,
  type Lang,
  type PaymentIntent,
  type QuestionBankItem,
  type QuizAttempt,
  type QuizQuestionItem,
  type TeacherQuiz,
  type TeacherSubscription,
} from '../types';
import { t } from '../i18n';
import { getRemainingDays } from '../utils/analyticsAndUnlock';

interface TeacherQuizSectionProps {
  lang: Lang;
  user: User | null;
  isAdmin: boolean;
  settings: AcademySettings;
  questionBank: QuestionBankItem[];
  myQuizzes: TeacherQuiz[];
  attempts: QuizAttempt[];
  subscription: TeacherSubscription | null;
  onRequireSignIn: () => void;
  onRequestPayment: (intent: PaymentIntent) => void;
  onPreviewStudentDemo: () => void;
}

export function TeacherQuizSection({
  lang,
  user,
  isAdmin,
  settings,
  questionBank,
  myQuizzes,
  attempts,
  subscription,
  onRequireSignIn,
  onRequestPayment,
  onPreviewStudentDemo,
}: TeacherQuizSectionProps) {
  const labels = t(lang);
  const termPrice = settings.quizTermPriceEgp ?? 120;
  const termDurationDays = settings.termPromoDurationDays ?? 120;

  const [subTab, setSubTab] = useState<'builder' | 'analytics'>('builder');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Builder form state
  const [quizTitle, setQuizTitle] = useState(
    lang === 'ar' ? 'اختبار قصير — الوحدة الأولى' : 'Quick Unit 1 Quiz'
  );
  const [gradeLabel, setGradeLabel] = useState('Primary 4');
  const [teacherName, setTeacherName] = useState(user?.displayName || '');
  const [schoolOrCenter, setSchoolOrCenter] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(10);
  const [selectedQuestions, setSelectedQuestions] = useState<QuizQuestionItem[]>([]);

  // Custom question composer state
  const [customPrompt, setCustomPrompt] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [customExplanation, setCustomExplanation] = useState('');

  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<string>('');

  const remainingSubDays = getRemainingDays(subscription?.expiresAtMs);
  const isSubExpired = Boolean(
    !isAdmin &&
      subscription?.active &&
      subscription.expiresAtMs &&
      subscription.expiresAtMs <= Date.now()
  );
  const hasActiveSub = Boolean(isAdmin || (subscription?.active && !isSubExpired));
  const hasUsedTrial = useMemo(
    () =>
      Boolean(
        user &&
          myQuizzes.some((q) => q.isTrial || q.id === `trial_${user.uid}`)
      ),
    [myQuizzes, user]
  );

  const filteredBank = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return questionBank.filter((item) => {
      if (gradeFilter !== 'all' && item.gradeId !== gradeFilter) return false;
      if (!q) return true;
      return (
        item.prompt.toLowerCase().includes(q) ||
        item.unitLabel.toLowerCase().includes(q)
      );
    });
  }, [questionBank, gradeFilter, searchTerm]);

  const selectedQuiz = useMemo(() => {
    if (activeQuizId) {
      const match = myQuizzes.find((q) => q.id === activeQuizId);
      if (match) return match;
    }
    return myQuizzes[0] || null;
  }, [myQuizzes, activeQuizId]);

  const selectedQuizAttempts = useMemo(() => {
    if (!selectedQuiz) return [];
    return attempts.filter((a) => a.quizId === selectedQuiz.id);
  }, [attempts, selectedQuiz]);

  const analyticsStats = useMemo(() => {
    if (!selectedQuiz || selectedQuizAttempts.length === 0) {
      return {
        totalSubmissions: 0,
        avgPct: 0,
        highestScore: 0,
        passRate: 0,
        questionStats: [] as {
          index: number;
          prompt: string;
          correctPct: number;
        }[],
        hardestQuestionIndex: -1,
      };
    }

    const totalSubmissions = selectedQuizAttempts.length;
    const avgPct = Math.round(
      selectedQuizAttempts.reduce((sum, a) => sum + a.percentage, 0) / totalSubmissions
    );
    const highestScore = Math.max(...selectedQuizAttempts.map((a) => a.score));
    const passedCount = selectedQuizAttempts.filter((a) => a.percentage >= 50).length;
    const passRate = Math.round((passedCount / totalSubmissions) * 100);

    const questionStats = selectedQuiz.questions.map((q, qIdx) => {
      const correctCount = selectedQuizAttempts.filter(
        (att) => att.answers[qIdx] === q.correctIndex
      ).length;
      return {
        index: qIdx,
        prompt: q.prompt,
        correctPct: Math.round((correctCount / totalSubmissions) * 100),
      };
    });

    let hardestQuestionIndex = -1;
    let lowestPct = 101;
    questionStats.forEach((st) => {
      if (st.correctPct < lowestPct) {
        lowestPct = st.correctPct;
        hardestQuestionIndex = st.index;
      }
    });

    return {
      totalSubmissions,
      avgPct,
      highestScore,
      passRate,
      questionStats,
      hardestQuestionIndex,
    };
  }, [selectedQuiz, selectedQuizAttempts]);

  const handleAddFromBank = (item: QuestionBankItem) => {
    if (selectedQuestions.length >= 40) {
      setFeedback(
        lang === 'ar' ? 'الحد الأقصى 40 سؤالاً في الاختبار الواحد.' : 'Max 40 questions per quiz.'
      );
      return;
    }
    if (selectedQuestions.some((q) => q.id === item.id)) return;
    setSelectedQuestions((prev) => [
      ...prev,
      {
        id: item.id,
        prompt: item.prompt,
        options: item.options,
        correctIndex: item.correctIndex,
        ...(item.explanation ? { explanation: item.explanation } : {}),
      },
    ]);
  };

  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestions.length >= 40) return;
    const cleanOptions = [opt0.trim(), opt1.trim(), opt2.trim(), opt3.trim()].filter(Boolean);
    if (customPrompt.trim().length < 3 || cleanOptions.length < 2) {
      setFeedback(
        lang === 'ar'
          ? 'اكتب نص السؤال وخيارين على الأقل.'
          : 'Enter a question prompt and at least 2 options.'
      );
      return;
    }
    const safeCorrectIdx = Math.min(correctIdx, cleanOptions.length - 1);
    setSelectedQuestions((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}_${prev.length}`,
        prompt: customPrompt.trim().slice(0, 600),
        options: cleanOptions.map((o) => o.slice(0, 200)),
        correctIndex: safeCorrectIdx,
        ...(customExplanation.trim() ? { explanation: customExplanation.trim().slice(0, 500) } : {}),
      },
    ]);
    setCustomPrompt('');
    setOpt0('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setCorrectIdx(0);
    setCustomExplanation('');
    setFeedback(lang === 'ar' ? 'تمت إضافة سؤالك للاختبار.' : 'Custom question added to quiz.');
  };

  const handlePublishQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');

    if (!user || !user.emailVerified) {
      onRequireSignIn();
      return;
    }

    if (selectedQuestions.length === 0) {
      setFeedback(
        lang === 'ar'
          ? 'اختر سؤالاً واحداً على الأقل من البنك أو اكتب سؤالاً لإصدار رابط الاختبار.'
          : 'Select or add at least one question before publishing.'
      );
      return;
    }

    if (!hasActiveSub && hasUsedTrial) {
      onRequestPayment({
        itemType: 'quiz_term',
        itemTitle:
          lang === 'ar'
            ? 'اشتراك الترم — منصة الكويزات وبنك الأسئلة'
            : 'Term Subscription — Quiz Bank & Analytics',
        amountEgp: termPrice,
        extraNote: `Teacher Email: ${user.email || ''} | Teacher UID: ${user.uid}`,
      });
      return;
    }

    setPublishing(true);
    try {
      const cleanQuestions = selectedQuestions.slice(0, 40).map((q) => ({
        id: q.id.slice(0, 80),
        prompt: q.prompt.slice(0, 600),
        options: q.options.slice(0, 4).map((o) => o.slice(0, 200)),
        correctIndex: q.correctIndex,
        ...(q.explanation ? { explanation: q.explanation.slice(0, 500) } : {}),
      }));

      const payload = {
        title: quizTitle.trim().slice(0, 160),
        gradeLabel: gradeLabel.trim().slice(0, 80),
        teacherName: (teacherName.trim() || user.displayName || 'Teacher').slice(0, 100),
        ...(schoolOrCenter.trim() ? { schoolOrCenter: schoolOrCenter.trim().slice(0, 120) } : {}),
        isTrial: !hasActiveSub,
        isPublished: true,
        timeLimitMinutes: Math.max(0, Math.min(180, Number(timeLimitMinutes) || 0)),
        questions: cleanQuestions,
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      };

      let createdId = '';
      if (!hasActiveSub) {
        createdId = `trial_${user.uid}`;
        await setDoc(doc(db, 'teacher_quizzes', createdId), payload);
      } else {
        const ref = await addDoc(collection(db, 'teacher_quizzes'), payload);
        createdId = ref.id;
      }

      setActiveQuizId(createdId);
      setSubTab('analytics');
      setFeedback(
        lang === 'ar'
          ? 'تم نشر الاختبار وإنشاء رابط الطلاب بنجاح!'
          : 'Quiz published! Student link is ready.'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'teacher_quizzes');
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await deleteDoc(doc(db, 'teacher_quizzes', quizId));
      if (activeQuizId === quizId) setActiveQuizId('');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `teacher_quizzes/${quizId}`);
    }
  };

  const handleCopyQuizUrl = async (quizId: string) => {
    const url = `${window.location.origin}/?quiz=${quizId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(quizId);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleExportCsv = () => {
    if (!selectedQuiz || selectedQuizAttempts.length === 0) return;
    const headers = ['Student Name', 'Class / Group', 'Score', 'Total', 'Percentage'];
    const rows = selectedQuizAttempts.map((a) => [
      `"${(a.studentName || '').replace(/"/g, '""')}"`,
      `"${(a.studentGroup || '').replace(/"/g, '""')}"`,
      String(a.score),
      String(a.totalQuestions),
      `${a.percentage}%`,
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedQuiz.title.replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g, '_')}_Results.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section id="quiz-builder" className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header + Pricing / Trial Strip */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2.5">
            <p className="text-xs font-semibold text-sky-900">
              {labels.quizFreeTrialTag} ·{' '}
              <span className="font-mono-num text-amber-700">
                {termPrice} {labels.egp} / {termDurationDays} {lang === 'ar' ? 'يوم' : 'Days'}
              </span>
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              {labels.quizSectionTitle}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">{labels.quizSectionLead}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onPreviewStudentDemo}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-sky-900 bg-white border border-sky-200 rounded-xl hover:bg-sky-50 whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تجربة شاشة الطالب الآن' : 'Preview Student View'}</span>
            </button>

            {!hasActiveSub && (
              <button
                type="button"
                onClick={() => {
                  if (!user || !user.emailVerified) {
                    onRequireSignIn();
                    return;
                  }
                  onRequestPayment({
                    itemType: 'quiz_term',
                    itemTitle:
                      lang === 'ar'
                        ? `باقة الترم الكاملة (${termDurationDays} يوم) — بنك الأسئلة والكويزات`
                        : `Full Term Pass (${termDurationDays} Days) — Quiz Bank & Analytics`,
                    amountEgp: termPrice,
                    extraNote: `Teacher Email: ${user.email || ''} | Teacher UID: ${user.uid} | Duration: ${termDurationDays} days`,
                  });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {isSubExpired
                    ? lang === 'ar'
                      ? `تجديد اشتراك الترم · ${termPrice} ${labels.egp}`
                      : `Renew Term Pass · ${termPrice} ${labels.egp}`
                    : `${labels.quizSubscribeTermBtn} · ${termPrice} ${labels.egp}`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Access Status Banner & Workspace Mode Switch */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-slate-700">
            {hasActiveSub ? (
              <span className="font-semibold text-emerald-700">
                {lang === 'ar'
                  ? `✓ اشتراك الترم مفعّل (${subscription?.termLabel || 'Active'})${
                      remainingSubDays !== null && subscription?.expiresAtMs
                        ? ` · متبقي ${remainingSubDays} يوم (ينتهي ${new Date(subscription.expiresAtMs).toLocaleDateString('ar-EG')})`
                        : ''
                    } — يمكنك نشر اختبارات غير محدودة وعرض تقارير الطلاب.`
                  : `✓ Term Subscription Active${
                      remainingSubDays !== null && subscription?.expiresAtMs
                        ? ` (${remainingSubDays} days left · ends ${new Date(subscription.expiresAtMs).toLocaleDateString('en-US')})`
                        : ''
                    } — Create unlimited quizzes & track live student analytics.`}
              </span>
            ) : isSubExpired ? (
              <span className="font-semibold text-rose-700">
                {lang === 'ar'
                  ? `انتهت مدة اشتراك الترم السابق تلقائياً (${subscription?.termLabel || ''}) — جدّدي الباقة بـ ${termPrice} ج.م لمدة ${termDurationDays} يوم لإعادة فتح النشر بلا حدود.`
                  : `Your previous Term Pass expired automatically — renew for ${termPrice} EGP (${termDurationDays} days) to resume unlimited quiz publishing.`}
              </span>
            ) : !user ? (
              <span>
                {lang === 'ar'
                  ? `سجّل الدخول بحساب Google لتجربة إنشاء امتحان تجريبي مجاني برابط حقيقي، أو اشترك بالترم بـ ${termPrice} ج.م (${termDurationDays} يوم).`
                  : `Sign in with Google to build 1 free trial quiz with live analytics, or subscribe for ${termPrice} EGP (${termDurationDays} days).`}
              </span>
            ) : !hasUsedTrial ? (
              <span className="font-semibold text-sky-900">
                {lang === 'ar'
                  ? 'متاح لك الآن إنشاء امتحان تجريبي مجاني (1 كويز) ترسله لطلابك وتجرب الإحصائيات قبل الاشتراك.'
                  : '1 Free Trial Quiz available — pick questions below and share a real student link!'}
              </span>
            ) : (
              <span className="font-semibold text-amber-800">
                {lang === 'ar'
                  ? `استخدمت الامتحان التجريبي المجاني. فعّل اشتراك الترم بـ ${termPrice} ج.م فقط (${termDurationDays} يوم) لإنشاء اختبارات بلا حدود.`
                  : `Free trial quiz used. Unlock unlimited term quizzes for ${termPrice} EGP (${termDurationDays} days).`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSubTab('builder')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                subTab === 'builder'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'ar' ? 'تصميم اختبار من البنك' : 'Quiz Builder & Bank'}
            </button>
            <button
              type="button"
              onClick={() => setSubTab('analytics')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                subTab === 'analytics'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'ar'
                ? `اختباراتي وإحصائيات الطلاب (${myQuizzes.length})`
                : `My Quizzes & Analytics (${myQuizzes.length})`}
            </button>
          </div>
        </div>

        {subTab === 'builder' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Zone: Curated Question Bank + Custom Question Composer */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ar'
                      ? '١. اختر أسئلة جاهزة من بنك الأسئلة'
                      : '1. Pick Ready Questions from Bank'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                    >
                      <option value="all">{lang === 'ar' ? 'كل الصفوف' : 'All Grades'}</option>
                      {GRADES.map((g) => (
                        <option key={g.id} value={g.id}>
                          {lang === 'ar' ? g.shortAr : g.shortEn}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={lang === 'ar' ? 'بحث في الأسئلة...' : 'Search bank...'}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg w-40"
                    />
                  </div>
                </div>

                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl max-h-80 overflow-y-auto">
                  {filteredBank.length === 0 ? (
                    <p className="p-6 text-xs text-slate-500 text-center">{labels.emptyItems}</p>
                  ) : (
                    filteredBank.map((item) => {
                      const alreadyAdded = selectedQuestions.some((q) => q.id === item.id);
                      const gradeMeta = GRADES.find((g) => g.id === item.gradeId);
                      return (
                        <div
                          key={item.id}
                          className="p-3.5 bg-white flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0" dir="ltr">
                            <p className="text-[11px] font-semibold text-sky-900">
                              {gradeMeta?.shortEn || item.gradeId} · {item.unitLabel}
                            </p>
                            <p className="text-xs sm:text-sm font-medium text-slate-900">
                              {item.prompt}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {item.options.join(' / ')}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={alreadyAdded}
                            onClick={() => handleAddFromBank(item)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
                              alreadyAdded
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-sky-900 text-white hover:bg-sky-800'
                            }`}
                          >
                            {alreadyAdded
                              ? lang === 'ar'
                                ? 'مضاف'
                                : 'Added'
                              : lang === 'ar'
                              ? '+ إضافة'
                              : '+ Add'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Custom Question Composer */}
              <form
                onSubmit={handleAddCustomQuestion}
                className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
              >
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'ar'
                    ? '٢. أو اكتب سؤالاً إضافياً من إعدادك'
                    : '2. Or Add Your Own Custom Question'}
                </h3>
                <input
                  type="text"
                  dir="ltr"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Write question sentence here (e.g. She ______ to school yesterday.)"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir="ltr">
                  <input
                    type="text"
                    value={opt0}
                    onChange={(e) => setOpt0(e.target.value)}
                    placeholder="Option 1"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={opt1}
                    onChange={(e) => setOpt1(e.target.value)}
                    placeholder="Option 2"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={opt2}
                    onChange={(e) => setOpt2(e.target.value)}
                    placeholder="Option 3 (optional)"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={opt3}
                    onChange={(e) => setOpt3(e.target.value)}
                    placeholder="Option 4 (optional)"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'ar' ? 'الإجابة الصحيحة هي:' : 'Correct Option:'}
                    </label>
                    <select
                      value={correctIdx}
                      onChange={(e) => setCorrectIdx(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value={0}>Option 1</option>
                      <option value={1}>Option 2</option>
                      <option value={2}>Option 3</option>
                      <option value={3}>Option 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'ar' ? 'شرح يظهر للطالب بعد الحل (اختياري)' : 'Explanation (optional)'}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={customExplanation}
                      onChange={(e) => setCustomExplanation(e.target.value)}
                      placeholder="Short grammar/vocab tip"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إضافة السؤال للاختبار' : 'Add Custom Question'}</span>
                </button>
              </form>
            </div>

            {/* Right Zone: Quiz Setup & Publish */}
            <form
              onSubmit={handlePublishQuiz}
              className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'ar' ? '٣. تجهيز الاختبار وإصدار الرابط' : '3. Quiz Details & Publish'}
                </h3>
                <span className="text-xs font-bold font-mono-num text-sky-900">
                  {selectedQuestions.length} {lang === 'ar' ? 'سؤال مختار' : 'selected'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'ar' ? 'عنوان الاختبار للطلاب' : 'Quiz Title'}
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={160}
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {labels.gradeLabel}
                    </label>
                    <input
                      type="text"
                      required
                      value={gradeLabel}
                      onChange={(e) => setGradeLabel(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'ar' ? 'الوقت بالدقائق (0 = مفتوح)' : 'Timer (mins, 0 = none)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={180}
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'ar' ? 'اسم المعلم' : 'Teacher Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder={lang === 'ar' ? 'مستر / مس...' : 'Mr. / Ms. ...'}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'ar' ? 'السنتر / المدرسة (اختياري)' : 'School / Center'}
                    </label>
                    <input
                      type="text"
                      value={schoolOrCenter}
                      onChange={(e) => setSchoolOrCenter(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Selected Questions Preview */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">
                  {lang === 'ar' ? 'الأسئلة المضافة للاختبار:' : 'Selected Questions:'}
                </p>
                {selectedQuestions.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center">
                    {lang === 'ar'
                      ? 'اضغط «+ إضافة» بجانب أي سؤال من البنك أو أضف سؤالاً من كتابتك.'
                      : 'Click + Add next to questions on the left to build your quiz.'}
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl max-h-56 overflow-y-auto">
                    {selectedQuestions.map((q, idx) => (
                      <div key={q.id} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-slate-800" dir="ltr">
                          {idx + 1}. {q.prompt}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedQuestions((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {feedback && (
                <p className="text-xs font-medium text-sky-900 bg-sky-50 border border-sky-200 rounded-xl px-3.5 py-2.5">
                  {feedback}
                </p>
              )}

              <button
                type="submit"
                disabled={publishing}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 transition-colors disabled:opacity-60"
              >
                <Share2 className="w-4 h-4" />
                <span>
                  {!user
                    ? lang === 'ar'
                      ? 'سجّل الدخول بجوجل لإصدار رابط الاختبار'
                      : 'Sign In to Publish Quiz Link'
                    : !hasActiveSub && !hasUsedTrial
                    ? lang === 'ar'
                      ? 'نشر الامتحان التجريبي المجاني وإصدار الرابط'
                      : 'Publish Free Trial Quiz & Get Link'
                    : !hasActiveSub && hasUsedTrial
                    ? lang === 'ar'
                      ? `اشترك بالترم (${termPrice} ج.م) لنشر اختبارات جديدة`
                      : `Subscribe (${termPrice} EGP/Term) for Unlimited Quizzes`
                    : lang === 'ar'
                    ? 'نشر الاختبار وإنشاء رابط الطلاب'
                    : 'Publish Quiz & Generate Student Link'}
                </span>
              </button>
            </form>
          </div>
        ) : (
          /* Analytics & My Quizzes View */
          <div className="space-y-6">
            {!user ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
                <p className="text-sm text-slate-600">
                  {lang === 'ar'
                    ? 'سجّل الدخول بحساب جوجل لعرض اختباراتك المنشورة وإحصائيات درجات الطلاب.'
                    : 'Sign in with Google to view your published quizzes and student analytics.'}
                </p>
                <button
                  type="button"
                  onClick={onRequireSignIn}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800"
                >
                  {labels.signInWithGoogle}
                </button>
              </div>
            ) : myQuizzes.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
                <p className="text-sm text-slate-600">
                  {lang === 'ar'
                    ? 'لم تنشئ أي اختبار بعد. انتقل لتبويب «تصميم اختبار من البنك» لإنشاء امتحانك التجريبي المجاني الأول.'
                    : 'No quizzes created yet. Use the Quiz Builder tab to create your first free trial quiz.'}
                </p>
                <button
                  type="button"
                  onClick={() => setSubTab('builder')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800"
                >
                  {lang === 'ar' ? 'ابدأ تصميم اختبار الآن' : 'Build Your First Quiz'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quiz Selector Strip */}
                <div className="flex flex-wrap gap-2">
                  {myQuizzes.map((qz) => (
                    <button
                      key={qz.id}
                      type="button"
                      onClick={() => setActiveQuizId(qz.id)}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                        selectedQuiz?.id === qz.id
                          ? 'bg-sky-900 text-white border-sky-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-sky-800'
                      }`}
                    >
                      {qz.title} {qz.isTrial ? (lang === 'ar' ? '(تجريبي)' : '(Trial)') : ''}
                    </button>
                  ))}
                </div>

                {selectedQuiz && (
                  <div className="space-y-6">
                    {/* Share Link & Quick Actions */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs text-slate-500">
                          {selectedQuiz.gradeLabel} · {selectedQuiz.questions.length}{' '}
                          {lang === 'ar' ? 'أسئلة' : 'questions'}
                        </p>
                        <p className="text-xs font-mono text-sky-900 truncate max-w-xl" dir="ltr">
                          {`${window.location.origin}/?quiz=${selectedQuiz.id}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleCopyQuizUrl(selectedQuiz.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800 whitespace-nowrap"
                        >
                          {copiedId === selectedQuiz.id ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {copiedId === selectedQuiz.id
                              ? labels.copied
                              : lang === 'ar'
                              ? 'نسخ رابط الطلاب'
                              : 'Copy Student Link'}
                          </span>
                        </button>
                        <a
                          href={`/?quiz=${selectedQuiz.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 whitespace-nowrap"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'فتح كطالب' : 'Open Student View'}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => void handleDeleteQuiz(selectedQuiz.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                          aria-label="Delete quiz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 4-Column Analytics KPI Strip */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-2xl font-bold text-slate-900 font-mono-num">
                          {analyticsStats.totalSubmissions}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {lang === 'ar' ? 'عدد الطلاب الممتحنين' : 'Total Submissions'}
                        </p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-2xl font-bold text-sky-900 font-mono-num">
                          {analyticsStats.avgPct}%
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {lang === 'ar' ? 'متوسط درجات الطلاب' : 'Average Score'}
                        </p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-2xl font-bold text-emerald-700 font-mono-num">
                          {analyticsStats.highestScore} / {selectedQuiz.questions.length}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {lang === 'ar' ? 'أعلى درجة' : 'Highest Score'}
                        </p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-2xl font-bold text-amber-700 font-mono-num">
                          {analyticsStats.passRate}%
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {lang === 'ar' ? 'نسبة النجاح (٥٠٪ فأكثر)' : 'Pass Rate (50%+)'}
                        </p>
                      </div>
                    </div>

                    {/* Question Difficulty Breakdown + Student Results Table */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <BarChart3 className="w-4 h-4 text-sky-900" />
                          <span>
                            {lang === 'ar' ? 'تحليل دقة الإجابات لكل سؤال' : 'Per-Question Accuracy'}
                          </span>
                        </div>
                        {analyticsStats.totalSubmissions === 0 ? (
                          <p className="text-xs text-slate-500">
                            {lang === 'ar'
                              ? 'سيظهر هنا تحليل كل سؤال بمجرد دخول أول طالب.'
                              : 'Question breakdown will appear once students submit answers.'}
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {analyticsStats.questionStats.map((st) => {
                              const isHardest = st.index === analyticsStats.hardestQuestionIndex;
                              return (
                                <div key={st.index} className="space-y-1">
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-slate-700 truncate" dir="ltr">
                                      Q{st.index + 1}. {st.prompt}
                                    </span>
                                    <span className="font-bold font-mono-num text-slate-900 shrink-0">
                                      {st.correctPct}%
                                    </span>
                                  </div>
                                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        st.correctPct >= 60 ? 'bg-emerald-600' : 'bg-amber-600'
                                      }`}
                                      style={{ width: `${st.correctPct}%` }}
                                    />
                                  </div>
                                  {isHardest && st.correctPct < 75 && (
                                    <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>
                                        {lang === 'ar'
                                          ? 'أكثر سؤال أخطأ فيه الطلاب — يُنصح بمراجعته'
                                          : 'Most missed question — review in class'}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h4 className="text-sm font-bold text-slate-900">
                            {lang === 'ar' ? 'سجل درجات الطلاب' : 'Student Results Log'}
                          </h4>
                          {selectedQuizAttempts.length > 0 && (
                            <button
                              type="button"
                              onClick={handleExportCsv}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-900 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 whitespace-nowrap"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{lang === 'ar' ? 'تصدير Excel / CSV' : 'Download CSV'}</span>
                            </button>
                          )}
                        </div>

                        {selectedQuizAttempts.length === 0 ? (
                          <p className="text-xs text-slate-500 py-8 text-center">
                            {lang === 'ar'
                              ? 'لا توجد إجابات مسجلة بعد — انسخ الرابط وأرسله لطلابك الآن.'
                              : 'No submissions yet — copy the quiz link above and share it with students.'}
                          </p>
                        ) : (
                          <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-xs text-start">
                              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <tr>
                                  <th className="py-2.5 px-3 font-semibold text-start">
                                    {lang === 'ar' ? 'الطالب' : 'Student'}
                                  </th>
                                  <th className="py-2.5 px-3 font-semibold text-start">
                                    {lang === 'ar' ? 'المجموعة' : 'Group'}
                                  </th>
                                  <th className="py-2.5 px-3 font-semibold text-start">
                                    {lang === 'ar' ? 'الدرجة' : 'Score'}
                                  </th>
                                  <th className="py-2.5 px-3 font-semibold text-start">
                                    {lang === 'ar' ? 'النسبة' : 'Pct'}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {selectedQuizAttempts.map((att) => (
                                  <tr key={att.id} className="bg-white">
                                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                                      {att.studentName}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-500">
                                      {att.studentGroup || '—'}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono-num text-slate-900">
                                      {att.score} / {att.totalQuestions}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono-num font-semibold text-sky-900">
                                      {att.percentage}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
