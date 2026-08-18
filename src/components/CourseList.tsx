import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Plus, Edit3, Trash2, ArrowRight, FileSpreadsheet, Flame, Brain, CheckCircle2, AlertCircle } from 'lucide-react';
import { Course, Lesson, Flashcard } from '../types';
import { getStreakInfo, getSrsStats, getCourseSrsStats } from '../utils/srs';

interface CourseListProps {
  courses: Course[];
  lessons: Lesson[];
  cards: Flashcard[];
  onSelectCourse: (courseId: string) => void;
  onAddCourse: () => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (course: Course) => void;
  onAddLesson: (courseId: string) => void;
  onOpenGoogleSheets?: () => void;
  onOpenSrsModal?: (filter?: 'due' | 'box1' | 'box2' | 'box3' | 'all') => void;
  onOpenTour?: () => void;
}

export const CourseList: React.FC<CourseListProps> = ({
  courses,
  lessons,
  cards,
  onSelectCourse,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onAddLesson,
  onOpenGoogleSheets,
  onOpenSrsModal,
  onOpenTour,
}) => {
  const [, setSrsTick] = useState(0);

  useEffect(() => {
    const handleSrsUpdated = () => setSrsTick((t) => t + 1);
    window.addEventListener('srs-updated', handleSrsUpdated);
    window.addEventListener('storage', handleSrsUpdated);
    return () => {
      window.removeEventListener('srs-updated', handleSrsUpdated);
      window.removeEventListener('storage', handleSrsUpdated);
    };
  }, []);

  const streakInfo = getStreakInfo();
  const srsStats = getSrsStats(cards);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl font-bold">
              <GraduationCap className="w-6 h-6" />
            </span>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Ứng Dụng Học Từ Vựng HSK
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Danh Sách Khóa Học ({courses.length})</h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Quản lý và học từ vựng theo từng Khóa học. Nhấp vào khóa học để xem bài học, làm bài kiểm tra hoặc chơi trò chơi ô chữ.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onOpenTour && (
            <button
              id="tour-banner-guide-btn"
              onClick={onOpenTour}
              className="px-4 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Xem hướng dẫn từng bước cách sử dụng"
            >
              <Brain className="w-4 h-4 text-indigo-600" />
              <span>💡 Hướng Dẫn Từng Bước</span>
            </button>
          )}
          <button
            id="tour-add-course-btn"
            onClick={onAddCourse}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo Khóa Học Mới</span>
          </button>
        </div>
      </div>

      {/* Streak & SRS (Lặp lại ngắt quãng) Stats Widget */}
      <div id="tour-srs-streak" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Box 1: Chuỗi Học Tập (Streak) */}
        <div id="tour-streak-box" className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white">
                <Flame className="w-4 h-4 text-amber-200 fill-amber-200" />
                <span>Chuỗi Học Tập</span>
              </span>
              <span className="text-xs font-medium text-amber-100">
                Kỷ lục: <strong className="text-white">{streakInfo.longestStreak} ngày</strong>
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-4xl font-black">{streakInfo.currentStreak}</span>
              <span className="text-lg font-bold text-amber-100">ngày liên tiếp</span>
            </div>

            <p className="text-xs text-amber-100/90 font-medium leading-relaxed mt-2">
              {streakInfo.isStudiedToday ? (
                <span className="flex items-center gap-1.5 text-amber-100 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Tuyệt vời! Bạn đã duy trì chuỗi học hôm nay.
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-100 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-200" /> Chưa học hôm nay. Học ngay để giữ chuỗi!
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Box 2 & 3: Lặp Lại Ngắt Quãng (SRS / Leitner System Overview) */}
        <div 
          id="tour-srs-box"
          onClick={() => onOpenSrsModal && onOpenSrsModal('due')}
          className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    <span>Lặp Lại Ngắt Quãng (Spaced Repetition System)</span>
                    <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Ấn để xem danh sách</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Tự động phân lịch ôn tập từ vựng theo trí nhớ ngắn & dài hạn</p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSrsModal && onOpenSrsModal('due');
                }}
                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-full text-xs font-bold transition-colors cursor-pointer"
              >
                {srsStats.dueCardsCount} từ cần ôn hôm nay
              </button>
            </div>

            {/* SRS Box Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSrsModal && onOpenSrsModal('box1');
                }}
                className="bg-slate-50 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-300 rounded-2xl p-3 text-center transition-all cursor-pointer"
              >
                <span className="text-xs text-slate-500 font-bold block mb-1">Hộp 1 (1 ngày)</span>
                <span className="text-xl font-black text-amber-600">{srsStats.box1Count}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Từ mới / Chưa thuộc</span>
              </div>

              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSrsModal && onOpenSrsModal('box2');
                }}
                className="bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-300 rounded-2xl p-3 text-center transition-all cursor-pointer"
              >
                <span className="text-xs text-slate-500 font-bold block mb-1">Hộp 2 (3 ngày)</span>
                <span className="text-xl font-black text-indigo-600">{srsStats.box2Count}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Đang học tập</span>
              </div>

              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSrsModal && onOpenSrsModal('box3');
                }}
                className="bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-3 text-center transition-all cursor-pointer"
              >
                <span className="text-xs text-slate-500 font-bold block mb-1">Hộp 3 (7 ngày)</span>
                <span className="text-xl font-black text-emerald-600">{srsStats.box3Count}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Đã thành thục</span>
              </div>
            </div>
          </div>

          {/* Memory Bar Progress */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tổng số từ vựng: <strong className="text-slate-800">{srsStats.totalCards}</strong></span>
            <span>Hôm nay cần ôn: <strong className="text-rose-600">{srsStats.dueTodayCount}</strong> | Ngày mai: <strong className="text-slate-700">{srsStats.dueTomorrowCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>Tất Cả Khóa Học ({courses.length})</span>
        </h2>

        {courses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center shadow-2xs">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">Chưa có khóa học nào</h3>
            <p className="text-xs text-slate-500 mb-5">Bắt đầu bằng cách tạo khóa học tiếng Trung đầu tiên của bạn!</p>
            <button
              onClick={onAddCourse}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              + Tạo Khóa Học Mới
            </button>
          </div>
        ) : (
          <div id="tour-course-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course, index) => {
              const courseLessons = lessons.filter((l) => l.courseId === course.id);
              const lessonIds = courseLessons.map((l) => l.id);
              const courseCards = cards.filter((card) => lessonIds.includes(card.lessonId));
              const courseSrs = getCourseSrsStats(cards, lessons, course.id);

              return (
                <div
                  key={course.id}
                  id={index === 0 ? 'tour-first-course' : undefined}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-full border border-indigo-100">
                        {course.level || 'HSK'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCourse(course);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Sửa khóa học"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCourse(course);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Xóa khóa học"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                      {course.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                      {course.description || 'Không có mô tả cho khóa học này.'}
                    </p>

                    {/* SRS Box breakdown badges for Course */}
                    {courseCards.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold mb-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded" title="Hộp 1 (1 ngày)">
                          H1: {courseSrs.box1Count}
                        </span>
                        <span className="text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded" title="Hộp 2 (3 ngày)">
                          H2: {courseSrs.box2Count}
                        </span>
                        <span className="text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded" title="Hộp 3 (7 ngày)">
                          H3: {courseSrs.box3Count}
                        </span>
                        {courseSrs.dueCardsCount > 0 && (
                          <span className="text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 ml-auto">
                            🔥 {courseSrs.dueCardsCount} cần ôn
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 py-2 border-t border-slate-100 mb-3 font-medium">
                      <span>{courseLessons.length} bài học</span>
                      <span className="font-bold text-emerald-600">{courseCards.length} từ vựng</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAddLesson(course.id)}
                        className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                      >
                        + Bài Học
                      </button>

                      <button
                        onClick={() => onSelectCourse(course.id)}
                        className="flex-1 py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Xem Bài Học</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
