import { useEffect, useState } from 'react';
import { Check, Copy, Download, Share2, Sparkles } from 'lucide-react';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { AcademySettings, Lang, TeacherPrep } from '../types';
import { downloadTextOrHtmlFile } from '../utils/download';
import { t } from '../i18n';

interface TeacherPrepStudioProps {
  lang: Lang;
  user: User | null;
  settings?: AcademySettings;
  onRequireSignIn: () => void;
}

export function TeacherPrepStudio({ lang, user, settings, onRequireSignIn }: TeacherPrepStudioProps) {
  const labels = t(lang);

  const [teacherName, setTeacherName] = useState(user?.displayName || '');
  const [schoolOrCenter, setSchoolOrCenter] = useState('');
  const [gradeLabel, setGradeLabel] = useState('Primary 5');
  const [unitTitle, setUnitTitle] = useState('Unit 2: Around Town');
  const [lessonTitle, setLessonTitle] = useState('Giving Directions & Places in the City');
  const [objectives, setObjectives] = useState(
    'By the end of the lesson, students will be able to identify 8 city places and give simple directions using imperative verbs.'
  );
  const [warmUp, setWarmUp] = useState(
    'Display a quick map of a local neighborhood and ask students where they buy books or bread.'
  );
  const [vocabulary, setVocabulary] = useState(
    'bakery, post office, library, turn left, go straight, across from'
  );
  const [procedures, setProcedures] = useState(
    '1. Model pronunciation with flashcards.\n2. Pair dialogue practice asking "Excuse me, where is the...?"\n3. Interactive map tracing game.'
  );
  const [assessment, setAssessment] = useState(
    'Students guide a classmate to a target place on the board map in 2 sentences.'
  );
  const [homework, setHomework] = useState(
    'Draw a mini-map from home to school and label 4 places in English.'
  );

  const [draftingAi, setDraftingAi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [myPreps, setMyPreps] = useState<TeacherPrep[]>([]);

  useEffect(() => {
    if (!user || !user.emailVerified) {
      setMyPreps([]);
      return;
    }
    const q = query(
      collection(db, 'teacher_preps'),
      where('ownerUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMyPreps(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<TeacherPrep, 'id'>),
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'teacher_preps')
    );
    return unsub;
  }, [user]);

  const handleAiDraft = async () => {
    setDraftingAi(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/ai/lesson-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gradeLabel, unitTitle, lessonTitle }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not draft lesson prep');
      if (data.objectives) setObjectives(data.objectives);
      if (data.warmUp) setWarmUp(data.warmUp);
      if (data.vocabulary) setVocabulary(data.vocabulary);
      if (data.procedures) setProcedures(data.procedures);
      if (data.assessment) setAssessment(data.assessment);
      if (data.homework) setHomework(data.homework);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'AI draft error');
    } finally {
      setDraftingAi(false);
    }
  };

  const handleSaveAndShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!user || !user.emailVerified) {
      onRequireSignIn();
      return;
    }

    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'teacher_preps'), {
        teacherName: (teacherName || user.displayName || 'English Teacher').slice(0, 100),
        ...(schoolOrCenter ? { schoolOrCenter: schoolOrCenter.slice(0, 120) } : {}),
        gradeLabel: gradeLabel.slice(0, 60),
        unitTitle: unitTitle.slice(0, 120),
        lessonTitle: lessonTitle.slice(0, 160),
        objectives: objectives.slice(0, 2500),
        ...(warmUp ? { warmUp: warmUp.slice(0, 1500) } : {}),
        ...(vocabulary ? { vocabulary: vocabulary.slice(0, 1500) } : {}),
        procedures: procedures.slice(0, 5000),
        ...(assessment ? { assessment: assessment.slice(0, 2000) } : {}),
        ...(homework ? { homework: homework.slice(0, 1500) } : {}),
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      });
      const generatedUrl = `${window.location.origin}/?prep=${docRef.id}`;
      setShareUrl(generatedUrl);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'teacher_preps');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyShareLink = async (urlToCopy: string) => {
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleDownloadPrep = () => {
    const body = `Teacher: ${teacherName || 'English Teacher'}
${schoolOrCenter ? `School / Center: ${schoolOrCenter}\n` : ''}Grade: ${gradeLabel}
Unit: ${unitTitle}
Lesson: ${lessonTitle}

LEARNING OBJECTIVES:
${objectives}

WARM-UP:
${warmUp}

KEY VOCABULARY:
${vocabulary}

PROCEDURES:
${procedures}

ASSESSMENT:
${assessment}

HOMEWORK:
${homework}`;

    downloadTextOrHtmlFile({
      fileName: `${lessonTitle.replace(/[^a-zA-Z0-9]+/g, '_')}_Prep.html`,
      title: lessonTitle,
      subtitle: `${gradeLabel} · ${unitTitle}`,
      bodyText: body,
      brandHeader:
        schoolOrCenter ||
        (lang === 'ar' ? settings?.academyNameAr : settings?.academyNameEn) ||
        teacherName ||
        'Teacher Lesson Preparation',
      logoDataUrl: settings?.logoDataUrl,
    });
  };

  return (
    <section id="teacher-studio" className="py-16 sm:py-20 border-t border-slate-200 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold text-sky-900">
              {lang === 'ar'
                ? 'تحضير المعلم الإلكتروني · مشاركة رابط مباشر على فيسبوك'
                : 'Teacher Prep Builder · Direct Facebook Link Publishing'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              {labels.teacherStudioTitle}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">{labels.teacherStudioLead}</p>
          </div>
          <button
            type="button"
            disabled={draftingAi}
            onClick={handleAiDraft}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-sky-900 bg-white border border-sky-200 rounded-xl hover:bg-sky-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{draftingAi ? labels.generating : labels.aiDraftBtn}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleSaveAndShare}
            className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5"
          >
            {settings?.logoDataUrl && (
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={settings.logoDataUrl}
                    alt={lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
                    referrerPolicy="no-referrer"
                    className="h-7 w-auto max-w-[96px] object-contain rounded shrink-0"
                  />
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    {lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {lang === 'ar' ? 'يُضاف تلقائياً أعلى التحضير' : 'Auto-added to top header'}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {lang === 'ar' ? 'اسم المعلم' : 'Teacher Name'}
                </label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مستر / مس...' : 'Mr. / Ms. ...'}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {lang === 'ar' ? 'المدرسة أو السنتر (اختياري)' : 'School or Center (Optional)'}
                </label>
                <input
                  type="text"
                  value={schoolOrCenter}
                  onChange={(e) => setSchoolOrCenter(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {labels.gradeLabel}
                </label>
                <input
                  type="text"
                  required
                  value={gradeLabel}
                  onChange={(e) => setGradeLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {lang === 'ar' ? 'اسم الوحدة (Unit)' : 'Unit Title'}
                </label>
                <input
                  type="text"
                  required
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {lang === 'ar' ? 'عنوان الدرس' : 'Lesson Title'}
                </label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" dir="ltr">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Learning Objectives
                </label>
                <textarea
                  rows={3}
                  required
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Warm-Up & Key Vocabulary
                </label>
                <textarea
                  rows={3}
                  value={`${warmUp}\nVocabulary: ${vocabulary}`}
                  onChange={(e) => {
                    const [w, ...rest] = e.target.value.split('\nVocabulary:');
                    setWarmUp(w || '');
                    if (rest.length) setVocabulary(rest.join('\nVocabulary:').trim());
                  }}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>
            </div>

            <div dir="ltr">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Presentation & Teaching Procedures
              </label>
              <textarea
                rows={4}
                required
                value={procedures}
                onChange={(e) => setProcedures(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" dir="ltr">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Formative Assessment
                </label>
                <input
                  type="text"
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Homework
                </label>
                <input
                  type="text"
                  value={homework}
                  onChange={(e) => setHomework(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-900"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 transition-colors disabled:opacity-60"
              >
                <Share2 className="w-4 h-4" />
                <span>
                  {user
                    ? labels.saveAndShareBtn
                    : lang === 'ar'
                    ? 'سجل الدخول لحفظ وإنشاء رابط المشاركة'
                    : 'Sign In to Publish & Share Link'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPrep}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{labels.downloadPrepBtn}</span>
              </button>
            </div>
          </form>

          {/* Share Link Output & Saved Preps */}
          <div className="lg:col-span-4 space-y-5">
            {shareUrl && (
              <div className="bg-sky-950 text-white rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold">
                  {lang === 'ar' ? 'رابط التحضير جاهز للنشر!' : 'Your Share Link is Ready'}
                </h3>
                <p className="text-xs text-sky-100 break-all font-mono bg-sky-900/80 rounded-lg p-3">
                  {shareUrl}
                </p>
                <div className="flex flex-col gap-2.5">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-white text-sky-950 rounded-xl hover:bg-sky-50 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{labels.shareFacebookBtn}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyShareLink(shareUrl)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-sky-800 text-white rounded-xl hover:bg-sky-700 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? labels.copied : labels.copyLinkBtn}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'ar' ? 'تحضيراتك المنشورة' : 'Your Published Lesson Preps'}
              </h3>
              {!user ? (
                <p className="text-sm text-slate-600 leading-relaxed">
                  {lang === 'ar'
                    ? 'سجّل الدخول بحساب جوجل لحفظ تحضيراتك والحصول على روابط مشاركة دائمة لفيسبوك.'
                    : 'Sign in with Google to save your lesson preps and generate permanent Facebook share links.'}
                </p>
              ) : myPreps.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {lang === 'ar'
                    ? 'لم تقم بحفظ أي تحضير بعد. املأ النموذج واضغط حفظ لإنشاء الرابط.'
                    : 'No saved preps yet. Fill out the studio form to publish your first link.'}
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myPreps.map((prep) => {
                    const prepUrl = `${window.location.origin}/?prep=${prep.id}`;
                    return (
                      <div key={prep.id} className="py-3 space-y-2">
                        <p className="text-sm font-semibold text-slate-900">{prep.lessonTitle}</p>
                        <p className="text-xs text-slate-500">
                          {prep.gradeLabel} · {prep.unitTitle}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(prepUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-sky-900 hover:underline"
                          >
                            {labels.shareFacebookBtn}
                          </a>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <button
                            type="button"
                            onClick={() => handleCopyShareLink(prepUrl)}
                            className="text-xs font-medium text-slate-600 hover:text-slate-900"
                          >
                            {labels.copyLinkBtn}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
