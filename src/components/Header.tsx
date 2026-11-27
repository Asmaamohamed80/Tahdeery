import type { User } from 'firebase/auth';
import type { Lang } from '../types';
import { t } from '../i18n';

interface HeaderProps {
  lang: Lang;
  user: User | null;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  onSignIn: () => void;
}

export function Header({ lang, user, isAdmin, onOpenAdmin, onSignIn }: HeaderProps) {
  const labels = t(lang);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 xl:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          {labels.brandName}
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-3 xl:gap-5 text-xs xl:text-sm font-medium text-slate-600">
          <a
            href="#grades"
            className="hover:text-sky-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {labels.navGrades}
          </a>
          <a
            href="#quiz-builder"
            className="hover:text-sky-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {labels.navQuizBank}
          </a>
          <a
            href="#courses"
            className="hover:text-sky-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {labels.navCourses}
          </a>
          <a
            href="#stories"
            className="hover:text-sky-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {labels.navStories}
          </a>
          <a
            href="#iq-tests"
            className="hover:text-sky-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {labels.navIqTests}
          </a>
          <a
            href="#coding-game"
            className="hover:text-sky-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {labels.navCodingGame}
          </a>
          <a
            href="#english-games"
            className="hover:text-sky-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {labels.navEnglishGames}
          </a>
          <a
            href="#decision-lab"
            className="hover:text-sky-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {labels.navDecisionLab}
          </a>
          <a
            href="#teacher-studio"
            className="hover:text-sky-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {labels.navTeacherStudio}
          </a>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          {isAdmin ? (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-900 rounded-lg shadow-[0_2px_0_0_rgba(12,74,110,0.45)] hover:bg-sky-800 active:translate-y-px transition-all whitespace-nowrap shrink-0"
            >
              {labels.adminControlBtn}
            </button>
          ) : user ? (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-900 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 active:translate-y-px transition-all whitespace-nowrap shrink-0 truncate max-w-[180px]"
            >
              {user.displayName || user.email}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-sky-900 rounded-lg shadow-[0_2px_0_0_rgba(12,74,110,0.45)] hover:bg-sky-800 active:translate-y-px transition-all whitespace-nowrap shrink-0"
            >
              {labels.signInBtn}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
