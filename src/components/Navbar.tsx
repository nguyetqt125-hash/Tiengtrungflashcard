import React from 'react';
import {
  Plus,
  ChevronRight,
  BookOpen,
  GraduationCap,
  FileText,
  User as UserIcon,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentCourseId?: string | null;
  currentCourseName?: string;
  currentLessonId?: string | null;
  currentLessonName?: string;
  currentUser?: User | null;
  onNavigateHome: () => void;
  onNavigateCourse: (courseId: string) => void;
  onOpenAddCourse?: () => void;
  onOpenGoogleSheets?: () => void;
  onOpenWorksheet?: () => void;
  onOpenTour?: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCourseId,
  currentCourseName,
  currentLessonId,
  currentLessonName,
  currentUser,
  onNavigateHome,
  onNavigateCourse,
  onOpenAddCourse,
  onOpenGoogleSheets,
  onOpenWorksheet,
  onOpenTour,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div id="tour-brand-logo" className="flex items-center gap-3 cursor-pointer" onClick={onNavigateHome}>
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
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
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
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Tour Button */}
            {onOpenTour && (
              <button
                id="tour-trigger-btn"
                onClick={onOpenTour}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#0D99FF] hover:bg-[#0088FF] text-white rounded-xl font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ring-2 ring-[#0D99FF]/20"
                title="Xem hướng dẫn từng bước 6 tính năng nổi bật"
              >
                <span className="font-mono text-xs opacity-90">❖</span>
                <span className="hidden sm:inline tracking-tight">Tour Hướng Dẫn</span>
                <span className="sm:hidden">Tour</span>
              </button>
            )}

            {/* Printable A4 Worksheet */}
            {onOpenWorksheet && (
              <button
                id="tour-worksheet-btn"
                onClick={onOpenWorksheet}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Tạo vở tập viết chữ Hán PDF"
              >
                <FileText className="w-4 h-4 text-slate-600" />
                <span className="hidden lg:inline">Vở Tập Viết (A4)</span>
              </button>
            )}

            {/* Account Status / Login */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-slate-200">
                <div
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                  title={currentUser.role === 'admin' ? 'Tài khoản Quản trị viên (Lan Nhi)' : 'Tài khoản Người dùng'}
                >
                  {currentUser.role === 'admin' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-[#0D99FF]" />
                  )}
                  <span className="max-w-[100px] truncate font-mono text-[11px]">
                    {currentUser.username}
                  </span>
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Đăng xuất tài khoản"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <button
                  onClick={() => onOpenAuth?.('login')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng Nhập</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
