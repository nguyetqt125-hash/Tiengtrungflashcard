import React, { useState, useEffect, useMemo } from 'react';
import { X, Brain, Search, BookOpen, GraduationCap, Play, ChevronLeft, ChevronRight, CheckCircle2, CheckCheck, AlertCircle, ArrowRight, Sparkles, PenTool } from 'lucide-react';
import { Course, Lesson, Flashcard } from '../types';
import { getCardMasteryMap, getSrsStats, setCardMasteryLevel, setBatchCardMasteryLevel } from '../utils/srs';
import { HanziWriterModal } from './HanziWriterModal';

interface SrsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Flashcard[];
  lessons: Lesson[];
  courses: Course[];
  initialFilter?: 'due' | 'box1' | 'box2' | 'box3' | 'all';
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onStartStudySrsCards: (cards: Flashcard[], title: string) => void;
}

const ITEMS_PER_PAGE = 12;

export const SrsModal: React.FC<SrsModalProps> = ({
  isOpen,
  onClose,
  cards,
  lessons,
  courses,
  initialFilter = 'due',
  onNavigateToLesson,
  onStartStudySrsCards,
}) => {
  const [activeTab, setActiveTab] = useState<'due' | 'box1' | 'box2' | 'box3' | 'all'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [writingCard, setWritingCard] = useState<Flashcard | null>(null);
  const [srsTick, setSrsTick] = useState(0);

  useEffect(() => {
    const handleSrsUpdated = () => setSrsTick((t) => t + 1);
    window.addEventListener('srs-updated', handleSrsUpdated);
    return () => window.removeEventListener('srs-updated', handleSrsUpdated);
  }, []);

  const masteryMap = useMemo(() => getCardMasteryMap(), [isOpen, srsTick]);
  const srsStats = useMemo(() => getSrsStats(cards), [cards, isOpen, srsTick]);

  // Maps for fast lookup of Lesson and Course names
  const lessonMap = useMemo(() => {
    const map = new Map<string, Lesson>();
    lessons.forEach((l) => map.set(l.id, l));
    return map;
  }, [lessons]);

  const courseMap = useMemo(() => {
    const map = new Map<string, Course>();
    courses.forEach((c) => map.set(c.id, c));
    return map;
  }, [courses]);

  if (!isOpen) return null;

  // Filter cards based on activeTab, search query, and selected course
  const filteredCards = cards.filter((card) => {
    const mastery = masteryMap[card.id];
    const level = mastery?.level ?? 0;

    // Filter by Tab
    if (activeTab === 'due') {
      const isDue = srsStats.dueTodayCards.some((c) => c.id === card.id);
      if (!isDue) return false;
    } else if (activeTab === 'box1') {
      if (level !== 0) return false;
    } else if (activeTab === 'box2') {
      if (level !== 1) return false;
    } else if (activeTab === 'box3') {
      if (level !== 2) return false;
    }

    // Filter by Course
    if (selectedCourseId !== 'all') {
      const lesson = lessonMap.get(card.lessonId);
      if (!lesson || lesson.courseId !== selectedCourseId) return false;
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTerm = card.term.toLowerCase().includes(q);
      const matchPinyin = card.pinyin?.toLowerCase().includes(q) || false;
      const matchDef = card.definition.toLowerCase().includes(q);
      if (!matchTerm && !matchPinyin && !matchDef) return false;
    }

    return true;
  });

  // Reset page when filters change
  const handleTabChange = (tab: 'due' | 'box1' | 'box2' | 'box3' | 'all') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleCourseFilterChange = (val: string) => {
    setSelectedCourseId(val);
    setCurrentPage(1);
  };

  // Pagination slice (prevents DOM overload and lag)
  const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCards = filteredCards.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const getLevelBadge = (cardId: string) => {
    const mastery = masteryMap[cardId];
    const level = mastery?.level ?? 0;
    if (level === 2) {
      return (
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Hộp 3 • Đã thuộc (7 ngày)
        </span>
      );
    }
    if (level === 1) {
      return (
        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold rounded-full flex items-center gap-1">
          <Brain className="w-3 h-3 text-indigo-600" />
          Hộp 2 • Đang học (3 ngày)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-full flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-amber-600" />
        Hộp 1 • Chưa thuộc (1 ngày)
      </span>
    );
  };

  const handleJumpToLesson = (lessonId: string) => {
    const lesson = lessonMap.get(lessonId);
    if (lesson) {
      onNavigateToLesson(lesson.courseId, lesson.id);
      onClose();
    }
  };

  const handleStartReviewAll = () => {
    if (filteredCards.length === 0) return;
    let title = 'Ôn tập SRS';
    if (activeTab === 'due') title = `Ôn Tập ${filteredCards.length} Từ Cần Học Hôm Nay`;
    else if (activeTab === 'box1') title = `Ôn Tập ${filteredCards.length} Từ Hộp 1 (Từ mới/Chưa thuộc)`;
    else if (activeTab === 'box2') title = `Ôn Tập ${filteredCards.length} Từ Hộp 2`;
    else if (activeTab === 'box3') title = `Ôn Tập ${filteredCards.length} Từ Hộp 3`;

    onStartStudySrsCards(filteredCards, title);
    onClose();
  };

  const handleMarkAllAsMastered = () => {
    if (filteredCards.length === 0) return;
    const ids = filteredCards.map((c) => c.id);
    setBatchCardMasteryLevel(ids, 2); // 2 = Box 3 (furthest box / mastered)
  };

  const handleToggleCardMastered = (cardId: string, currentLevel: number) => {
    if (currentLevel === 2) {
      setCardMasteryLevel(cardId, 0); // Reset to Box 1 if user clicks again
    } else {
      setCardMasteryLevel(cardId, 2); // Move to Box 3 (furthest box)
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 text-slate-800 space-y-5 my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl border border-indigo-200">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Lặp Lại Ngắt Quãng (Spaced Repetition)</span>
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 font-bold text-xs rounded-full border border-rose-200">
                  {srsStats.dueCardsCount} từ cần ôn
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Nhấp vào bất kỳ từ vựng nào để đến trực tiếp bài học tương ứng hoặc bấm học ngay danh sách từ SRS.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Header & Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Tabs Filter */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => handleTabChange('due')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'due'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Cần Ôn Hôm Nay ({srsStats.dueCardsCount})
            </button>
            <button
              onClick={() => handleTabChange('box1')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'box1'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Hộp 1 ({srsStats.box1Count})
            </button>
            <button
              onClick={() => handleTabChange('box2')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'box2'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Hộp 2 ({srsStats.box2Count})
            </button>
            <button
              onClick={() => handleTabChange('box3')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'box3'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Hộp 3 ({srsStats.box3Count})
            </button>
            <button
              onClick={() => handleTabChange('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Tất Cả ({cards.length})
            </button>
          </div>

          {/* Action Buttons Header */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {filteredCards.length > 0 && (
              <button
                onClick={handleMarkAllAsMastered}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                title="Đánh dấu tất cả các từ đang hiển thị là đã thuộc (chuyển sang Hộp 3 xa nhất)"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Thuộc Tất Cả ({filteredCards.length})</span>
              </button>
            )}

            {filteredCards.length > 0 && (
              <button
                onClick={handleStartReviewAll}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Học Ngay {filteredCards.length} Từ Này</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Course Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm kiếm từ Hán tự, Pinyin, hoặc nghĩa..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            />
          </div>

          <div>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseFilterChange(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
            >
              <option value="all">Tất cả Khóa học ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Card List Container with Scrollable View & No Lag */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[280px]">
          {filteredCards.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Không tìm thấy từ vựng nào</h3>
              <p className="text-xs text-slate-500 mt-1">
                Thử đổi điều kiện lọc hoặc từ khóa tìm kiếm.
              </p>
            </div>
          ) : (
            paginatedCards.map((card) => {
              const lesson = lessonMap.get(card.lessonId);
              const course = lesson ? courseMap.get(lesson.courseId) : null;

              return (
                <div
                  key={card.id}
                  className="p-4 bg-white border border-slate-200/80 hover:border-indigo-300 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Word Information */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl font-black text-slate-900 font-serif">
                        {card.term}
                      </span>
                      {card.pinyin && (
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {card.pinyin}
                        </span>
                      )}
                      {card.partOfSpeech && (
                        <span className="text-[10px] text-slate-500 font-semibold italic">
                          ({card.partOfSpeech})
                        </span>
                      )}
                      {getLevelBadge(card.id)}
                    </div>

                    <p className="text-xs font-semibold text-slate-800">{card.definition}</p>

                    {/* Course & Lesson Location Info */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                        <strong className="text-slate-700">{course?.name || 'Khóa học'}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-slate-600">{lesson?.name || 'Bài học'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    {/* Direct SRS Box Selector */}
                    <select
                      value={masteryMap[card.id]?.level ?? 0}
                      onChange={(e) => setCardMasteryLevel(card.id, Number(e.target.value))}
                      className="text-xs font-bold px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    >
                      <option value={0}>📦 Hộp 1 (Chưa thuộc)</option>
                      <option value={1}>📦 Hộp 2 (Đang học)</option>
                      <option value={2}>📦 Hộp 3 (Đã thuộc)</option>
                    </select>

                    {/* Mark as Mastered (Box 3) Button */}
                    <button
                      onClick={() => handleToggleCardMastered(card.id, masteryMap[card.id]?.level ?? 0)}
                      className={`px-3 py-2 border font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                        (masteryMap[card.id]?.level ?? 0) === 2
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                      }`}
                      title={(masteryMap[card.id]?.level ?? 0) === 2 ? "Đã ở Hộp 3 (Xa nhất/Thành thục). Nhấn để chuyển lại Hộp 1" : "Đánh dấu là đã thuộc (Chuyển sang Hộp 3 xa nhất)"}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{(masteryMap[card.id]?.level ?? 0) === 2 ? 'Đã thuộc' : 'Thuộc'}</span>
                    </button>

                    <button
                      onClick={() => setWritingCard(card)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Tập viết nét Hán tự"
                    >
                      <PenTool className="w-3.5 h-3.5 text-rose-600" />
                      <span>Viết</span>
                    </button>

                    <button
                      onClick={() => handleJumpToLesson(card.lessonId)}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Chuyển đến thẳng bài học chứa từ này"
                    >
                      <span>Đến Bài Học</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Pagination & Info */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Hiển thị <strong className="text-slate-800">{filteredCards.length}</strong> từ vựng
            {totalPages > 1 && ` (Trang ${safePage}/${totalPages})`}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 px-2">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hanzi Writer Practice Modal */}
      {writingCard && (
        <HanziWriterModal
          isOpen={!!writingCard}
          term={writingCard.term}
          pinyin={writingCard.pinyin}
          definition={writingCard.definition}
          onClose={() => setWritingCard(null)}
        />
      )}
    </div>
  );
};
