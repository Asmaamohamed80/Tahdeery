import { useMemo, useState } from 'react';
import { ExternalLink, GraduationCap, SlidersHorizontal } from 'lucide-react';
import type { AffiliateCourse, CourseTrack, Lang } from '../types';
import { t } from '../i18n';

interface CoursesAffiliateSectionProps {
  lang: Lang;
  courses: AffiliateCourse[];
  isAdmin: boolean;
  onOpenAdminCourses: () => void;
}

export function CoursesAffiliateSection({
  lang,
  courses,
  isAdmin,
  onOpenAdminCourses,
}: CoursesAffiliateSectionProps) {
  const labels = t(lang);
  const [trackFilter, setTrackFilter] = useState<'all' | CourseTrack>('all');

  const trackLabel = (track: CourseTrack) => {
    const map: Record<CourseTrack, { ar: string; en: string }> = {
      phonics: { ar: 'الصوتيات والتأسيس', en: 'Phonics & Early Reading' },
      methodology: { ar: 'طرق التدريس الحديثة', en: 'Teaching Methodology' },
      ai_teaching: { ar: 'الذكاء الاصطناعي للمعلمين', en: 'AI for Teachers' },
      career: { ar: 'التدريس الأونلاين وبناء المسار', en: 'Online Teaching Career' },
    };
    return lang === 'ar' ? map[track].ar : map[track].en;
  };

  const filteredCourses = useMemo(() => {
    if (trackFilter === 'all') return courses;
    return courses.filter((c) => c.track === trackFilter);
  }, [courses, trackFilter]);

  return (
    <section id="courses" className="py-16 sm:py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-3xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <GraduationCap className="w-4 h-4" />
              <span>{labels.coursesFreeNote}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              {labels.coursesTitle}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">{labels.coursesLead}</p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdminCourses}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة / تعديل الكورسات' : 'Manage Affiliate Courses'}</span>
            </button>
          )}
        </div>

        {/* Transparent Affiliate Disclosure Notice */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p>
            <strong className="text-slate-900">
              {lang === 'ar' ? 'شفافية الشراكات (Affiliate Disclosure): ' : 'Affiliate Disclosure: '}
            </strong>
            {lang === 'ar'
              ? 'بعض روابط الكورسات الموصى بها أدناه هي روابط شراكة تعليمية (بما في ذلك برامج Impact)، وقد نحصل على عمولة بسيطة عند التسجيل من خلالها دون أي تكلفة إضافية عليك.'
              : 'Some course links below are affiliate partner links (including Impact partner programs). If you enroll through them, we may earn a commission at no extra cost to you.'}
          </p>
          <a
            href="#about"
            className="text-sky-900 font-semibold hover:underline underline-offset-4 whitespace-nowrap shrink-0"
          >
            {lang === 'ar' ? 'اقرأ المزيد عنا' : 'About Our Policy'}
          </a>
        </div>

        {/* Track Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
          {(
            [
              ['all', lang === 'ar' ? 'كل المسارات' : 'All Tracks'],
              ['phonics', lang === 'ar' ? 'الصوتيات والتأسيس' : 'Phonics'],
              ['methodology', lang === 'ar' ? 'طرق التدريس' : 'Methodology'],
              ['ai_teaching', lang === 'ar' ? 'الذكاء الاصطناعي للمعلمين' : 'AI for Teachers'],
              ['career', lang === 'ar' ? 'التدريس الأونلاين' : 'Online Teaching'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTrackFilter(key)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                trackFilter === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredCourses.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
            {labels.emptyItems}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <article
                key={course.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-sky-900">{course.provider}</span>
                    <span aria-hidden="true">·</span>
                    <span>{trackLabel(course.track)}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {lang === 'ar' ? course.titleAr : course.titleEn}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {lang === 'ar' ? course.descriptionAr : course.descriptionEn}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-500">
                    {course.durationLabel} ·{' '}
                    <span className="font-semibold text-emerald-700">{labels.freeLabel}</span>
                  </p>
                  <a
                    href={course.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-900 rounded-xl hover:bg-sky-800 transition-colors whitespace-nowrap"
                  >
                    <span>{labels.courseEnrollBtn}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
