import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type { AcademySettings, Lang, TeacherPrep } from '../types';
import { downloadTextOrHtmlFile } from '../utils/download';
import { t } from '../i18n';

interface SharedPrepViewerProps {
  prepId: string;
  lang: Lang;
  settings?: AcademySettings;
  onBackHome: () => void;
}

export function SharedPrepViewer({ prepId, lang, settings, onBackHome }: SharedPrepViewerProps) {
  const labels = t(lang);
  const [prep, setPrep] = useState<TeacherPrep | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'teacher_preps', prepId));
        if (!active) return;
        if (!snap.exists()) {
          setNotFound(true);
        } else {
          setPrep({ id: snap.id, ...(snap.data() as Omit<TeacherPrep, 'id'>) });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `teacher_preps/${prepId}`);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [prepId]);

  const currentUrl = window.location.href;

  return (
    <main className="min-h-[80vh] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-900 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'ar' ? 'العودة إلى الرئيسية' : 'Back to Academy Home'}</span>
        </button>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-600">
            {lang === 'ar' ? 'جاري تحميل التحضير الإلكتروني...' : 'Loading shared lesson preparation...'}
          </div>
        ) : notFound || !prep ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              {lang === 'ar' ? 'لم يتم العثور على التحضير' : 'Lesson Preparation Not Found'}
            </h2>
            <p className="text-sm text-slate-600">
              {lang === 'ar'
                ? 'تأكد من صحة رابط المشاركة أو عُد للصفحة الرئيسية.'
                : 'Please verify the shared link or return to the homepage.'}
            </p>
          </div>
        ) : (
          <article className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-6">
            {settings?.logoDataUrl && (
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <img
                  src={settings.logoDataUrl}
                  alt={lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
                  referrerPolicy="no-referrer"
                  className="h-8 w-auto max-w-[110px] object-contain rounded shrink-0"
                />
                <span className="text-xs font-semibold text-slate-700">
                  {lang === 'ar' ? settings.academyNameAr : settings.academyNameEn}
                </span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-6">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-sky-900">
                  {prep.gradeLabel} · {prep.unitTitle}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{prep.lessonTitle}</h1>
                <p className="text-sm text-slate-600">
                  {lang === 'ar' ? 'إعداد:' : 'Prepared by:'} <strong>{prep.teacherName}</strong>
                  {prep.schoolOrCenter ? ` · ${prep.schoolOrCenter}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-sky-900 text-white rounded-lg hover:bg-sky-800"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{labels.shareFacebookBtn}</span>
                </a>
                <button
                  type="button"
                  onClick={() =>
                    downloadTextOrHtmlFile({
                      fileName: `${prep.lessonTitle.replace(/[^a-zA-Z0-9]+/g, '_')}.html`,
                      title: prep.lessonTitle,
                      subtitle: `${prep.gradeLabel} · ${prep.unitTitle}`,
                      bodyText: `Teacher: ${prep.teacherName}\n\nOBJECTIVES:\n${prep.objectives}\n\nWARM-UP:\n${prep.warmUp || ''}\n\nVOCABULARY:\n${prep.vocabulary || ''}\n\nPROCEDURES:\n${prep.procedures}\n\nASSESSMENT:\n${prep.assessment || ''}\n\nHOMEWORK:\n${prep.homework || ''}`,
                      brandHeader:
                        prep.schoolOrCenter ||
                        (lang === 'ar' ? settings?.academyNameAr : settings?.academyNameEn) ||
                        prep.teacherName,
                      logoDataUrl: settings?.logoDataUrl,
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{labels.downloadPrepBtn}</span>
                </button>
              </div>
            </div>

            <div className="space-y-5 text-sm text-slate-800 leading-relaxed" dir="ltr">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900 mb-1.5">
                  Learning Objectives
                </h2>
                <p className="whitespace-pre-line">{prep.objectives}</p>
              </div>
              {prep.warmUp && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900 mb-1.5">
                    Warm-Up
                  </h2>
                  <p className="whitespace-pre-line">{prep.warmUp}</p>
                </div>
              )}
              {prep.vocabulary && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900 mb-1.5">
                    Target Vocabulary
                  </h2>
                  <p className="whitespace-pre-line">{prep.vocabulary}</p>
                </div>
              )}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900 mb-1.5">
                  Procedures & Practice
                </h2>
                <p className="whitespace-pre-line">{prep.procedures}</p>
              </div>
              {prep.assessment && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900 mb-1.5">
                    Formative Assessment
                  </h2>
                  <p className="whitespace-pre-line">{prep.assessment}</p>
                </div>
              )}
              {prep.homework && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-sky-900 mb-1.5">
                    Homework
                  </h2>
                  <p className="whitespace-pre-line">{prep.homework}</p>
                </div>
              )}
            </div>
          </article>
        )}
      </div>
    </main>
  );
}
