import React from 'react';
import { Plus, ChevronRight, BookOpen, GraduationCap, Sun, Moon } from 'lucide-react';
import { ThemeMode } from '../utils/theme';

interface NavbarProps {
  currentCourseId?: string | null;
  currentCourseName?: string;
  currentLessonId?: string | null;
  currentLessonName?: string;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onNavigateHome: () => void;
  onNavigateCourse: (courseId: string) => void;
  onOpenAddCourse?: () => void;
  onOpenGoogleSheets?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCourseId,
  currentCourseName,
  currentLessonId,
  currentLessonName,
  theme = 'light',
  onToggleTheme,
  onNavigateHome,
  onNavigateCourse,
  onOpenAddCourse,
  onOpenGoogleSheets,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={onNavigateHome}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
              学
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight tracking-tight">
                Hán Ngữ Flashcard
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">Học & Quản lý từ vựng tiếng Trung</p>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
            <button
              onClick={onNavigateHome}
              className={`hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer ${
                !currentCourseId ? 'text-indigo-600 font-bold' : ''
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Khóa Học</span>
            </button>

            {currentCourseId && currentCourseName && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <button
                  onClick={() => onNavigateCourse(currentCourseId)}
                  className={`hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer ${
                    !currentLessonId ? 'text-indigo-600 font-bold' : ''
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="max-w-[160px] truncate">{currentCourseName}</span>
                </button>
              </>
            )}

            {currentLessonId && currentLessonName && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="text-indigo-600 font-bold max-w-[160px] truncate">
                  {currentLessonName}
                </span>
              </>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title={theme === 'dark' ? 'Đổi sang giao diện Sáng' : 'Đổi sang giao diện Tối'}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Giao diện Sáng</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Giao diện Tối</span>
                  </>
                )}
              </button>
            )}

            {onOpenAddCourse && (
              <button
                onClick={onOpenAddCourse}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tạo Khóa Học</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
