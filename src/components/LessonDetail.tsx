import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Layers,
  ArrowLeft,
  Plus,
  FileText,
  Gamepad2,
  FileCheck2,
  Sparkles,
  Volume2,
  Edit3,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Brain,
  PenTool,
  CheckCircle2,
  CheckCheck,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Course, Lesson, Flashcard } from '../types';
import { speakChinese } from '../utils/speech';
import { getCardMasteryMap, setCardMasteryLevel, setBatchCardMasteryLevel, getLessonSrsStats } from '../utils/srs';
import { HanziWriterModal } from './HanziWriterModal';

interface LessonDetailProps {
  currentCourse: Course;
  lessons: Lesson[];
  cards: Flashcard[];
  selectedLessonId: string | null;
  onSelectLesson: (lessonId: string | null) => void;
  onBackToCourseList: () => void;
  onAddLesson: (courseId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lesson: Lesson) => void;
  onOpenBatchImport: (lessonId: string, lessonName: string) => void;
  onAddSingleCard: (lessonId: string) => void;
  onEditCard: (card: Flashcard) => void;
  onDeleteCard: (card: Flashcard) => void;
  onStartStudy: (lesson: Lesson, cards: Flashcard[]) => void;
  onStartGame: (lesson: Lesson, cards: Flashcard[]) => void;
  onStartTest: (lesson: Lesson, cards: Flashcard[]) => void;
}

export const LessonDetail: React.FC<LessonDetailProps> = ({
  currentCourse,
  lessons,
  cards,
  selectedLessonId,
  onSelectLesson,
  onBackToCourseList,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onOpenBatchImport,
  onAddSingleCard,
  onEditCard,
  onDeleteCard,
  onStartStudy,
  onStartGame,
  onStartTest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [writingCard, setWritingCard] = useState<Flashcard | null>(null);
  const [srsTick, setSrsTick] = useState(0);

  useEffect(() => {
    const handleSrsUpdated = () => setSrsTick((t) => t + 1);
    window.addEventListener('srs-updated', handleSrsUpdated);
    window.addEventListener('storage', handleSrsUpdated);
    return () => {
      window.removeEventListener('srs-updated', handleSrsUpdated);
      window.removeEventListener('storage', handleSrsUpdated);
    };
  }, []);

  const masteryMap = useMemo(() => getCardMasteryMap(), [cards, selectedLessonId, srsTick]);

  const courseLessons = lessons.filter((l) => l.courseId === currentCourse.id);
  const selectedLesson = lessons.find((l) => l.id === selectedLessonId);

  // VIEW 1: DEDICATED LESSON PAGE (Quizlet Style)
  if (selectedLesson) {
    const lessonCards = cards.filter((c) => c.lessonId === selectedLesson.id);
    const filteredCards = lessonCards.filter(
      (c) =>
        c.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.pinyin.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onSelectLesson(null)}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-600" />
            <span>← Quay lại Danh sách Bài Học</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenBatchImport(selectedLesson.id, selectedLesson.name)}
              className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200/60 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>📄 Nhập Hàng Loạt (Text)</span>
            </button>

            <button
              onClick={() => onAddSingleCard(selectedLesson.id)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm 1 Thẻ</span>
            </button>
          </div>
        </div>

        {/* Quizlet-Style Hero Banner for Selected Lesson */}
        {(() => {
          const lessonSrs = getLessonSrsStats(cards, selectedLesson.id);
          return (
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="relative z-10 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl font-bold">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      Trang Bài Học • {currentCourse.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">
                      {lessonCards.length} từ vựng
                    </span>
                    {/* Lesson SRS Box Breakdown Pill */}
                    {lessonCards.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs font-bold bg-slate-800/80 border border-slate-700/80 px-3 py-1 rounded-full">
                        <span className="text-amber-400">H1: {lessonSrs.box1Count}</span>
                        <span className="text-indigo-400">H2: {lessonSrs.box2Count}</span>
                        <span className="text-emerald-400">H3: {lessonSrs.box3Count}</span>
                        {lessonSrs.dueCardsCount > 0 && (
                          <span className="text-rose-400 font-extrabold ml-1">
                            🔥 {lessonSrs.dueCardsCount} cần ôn
                          </span>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => onEditLesson(selectedLesson)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="Sửa bài học"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteLesson(selectedLesson)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="Xóa bài học"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{selectedLesson.name}</h1>
                  {selectedLesson.description && (
                    <p className="text-sm text-slate-300 mt-1 max-w-2xl">{selectedLesson.description}</p>
                  )}
                </div>

                {/* Major Action Buttons Bar */}
                <div className="pt-2 flex flex-wrap items-center gap-3 border-t border-slate-800/80">
                  <button
                    disabled={lessonCards.length === 0}
                    onClick={() => onStartStudy(selectedLesson, lessonCards)}
                    className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>⚡ Học Tất Cả Từ Vựng</span>
                  </button>

                  <button
                    disabled={lessonCards.length === 0}
                    onClick={() => onStartGame(selectedLesson, lessonCards)}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Gamepad2 className="w-5 h-5 text-indigo-300" />
                    <span>🎮 Trò Chơi Ôn Tập</span>
                  </button>

                  <button
                    disabled={lessonCards.length === 0}
                    onClick={() => onStartTest(selectedLesson, lessonCards)}
                    className="px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <FileCheck2 className="w-5 h-5" />
                    <span>📝 Làm Bài Kiểm Tra</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm từ vựng, pinyin, định nghĩa..."
              className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {filteredCards.length > 0 && (
              <button
                onClick={() => {
                  const ids = filteredCards.map((c) => c.id);
                  setBatchCardMasteryLevel(ids, 2);
                }}
                className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Đánh dấu tất cả các từ đang hiển thị là đã thuộc (Chuyển sang Hộp 3 xa nhất)"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Thuộc Tất Cả ({filteredCards.length})</span>
              </button>
            )}

            <div className="text-xs text-slate-500 font-medium shrink-0">
              Hiển thị <strong className="text-slate-900">{filteredCards.length}</strong> / {lessonCards.length} thẻ
            </div>
          </div>
        </div>

        {/* Flashcards Grid */}
        {filteredCards.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center shadow-2xs">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {searchQuery ? 'Không tìm thấy từ vựng phù hợp' : 'Bài học này chưa có thẻ từ vựng nào'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">Thêm từ vựng để bắt đầu luyện tập theo phương pháp Quizlet!</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => onOpenBatchImport(selectedLesson.id, selectedLesson.name)}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 cursor-pointer"
              >
                📄 Nhập hàng loạt (Text)
              </button>
              <button
                onClick={() => onAddSingleCard(selectedLesson.id)}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 shadow-xs cursor-pointer"
              >
                + Thêm 1 Thẻ
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => {
              const cardMastery = masteryMap[card.id]?.level ?? 0;
              return (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Card Top Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors font-chinese">
                            {card.term}
                          </h4>
                          <button
                            onClick={() => speakChinese(card.term)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Phát âm tiếng Trung"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setWritingCard(card);
                            }}
                            className="px-2 py-1 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs hover:scale-105 active:scale-95 ml-1"
                            title="Tập viết nét Hán tự"
                          >
                            <PenTool className="w-3.5 h-3.5 text-rose-600" />
                            <span>Viết</span>
                          </button>
                        </div>
                        {card.pinyin && (
                          <span className="text-xs font-mono font-bold text-amber-600 block mt-0.5">
                            {card.pinyin}
                          </span>
                        )}

                        {/* Explicit Card SRS Status Pill */}
                        <div className="mt-1">
                          {cardMastery === 2 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Hộp 3 • Đã thuộc (7 ngày)
                            </span>
                          ) : cardMastery === 1 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold rounded-full">
                              <Brain className="w-3 h-3 text-indigo-600" />
                              Hộp 2 • Đang học (3 ngày)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-full">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Hộp 1 • Chưa thuộc (1 ngày)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditCard(card)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Sửa thẻ"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteCard(card)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Xóa thẻ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Card Details (7 Fields) */}
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Định nghĩa:</span>
                        <p className="font-bold text-slate-900 text-sm">{card.definition}</p>
                      </div>

                      {card.partOfSpeech && (
                        <span className="inline-block px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-md border border-purple-200/60">
                          {card.partOfSpeech}
                        </span>
                      )}

                      {card.example && (
                        <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-800 border border-slate-100 flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-indigo-600 block">Ví dụ:</span>
                            <p className="text-slate-900 font-medium leading-relaxed">{card.example}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => speakChinese(card.example)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 font-bold text-[11px]"
                            title="Nghe phát âm ví dụ"
                          >
                            <Volume2 className="w-4 h-4 text-indigo-600" />
                            <span className="sr-only">Nghe ví dụ</span>
                          </button>
                        </div>
                      )}

                      {card.synonym && (
                        <div className="text-[11px] text-slate-600">
                          <strong className="text-slate-500">Đồng nghĩa:</strong> {card.synonym}
                        </div>
                      )}

                      {card.memoryTip && (
                        <div className="bg-amber-50 p-2.5 rounded-xl text-xs text-amber-900 border border-amber-200/80">
                          <span className="font-bold text-amber-800 block text-[11px]">💡 Mẹo nhớ:</span>
                          {card.memoryTip}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interactive Card SRS Level Selector Badge */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Brain className="w-3.5 h-3.5 text-indigo-500" />
                        Trạng thái SRS:
                      </span>
                      <select
                        value={cardMastery}
                        onChange={(e) => setCardMasteryLevel(card.id, Number(e.target.value))}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 transition-colors ${
                          cardMastery === 2
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-500'
                            : cardMastery === 1
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-300 focus:ring-indigo-500'
                            : 'bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-500'
                        }`}
                      >
                        <option value={0}>📦 Hộp 1 (1 ngày) - Chưa thuộc</option>
                        <option value={1}>📦 Hộp 2 (3 ngày) - Đang học</option>
                        <option value={2}>📦 Hộp 3 (7 ngày) - Đã thuộc</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setCardMasteryLevel(card.id, cardMastery === 2 ? 0 : 2)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                        cardMastery === 2
                          ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-2xs'
                          : cardMastery === 1
                          ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-2xs'
                          : 'bg-amber-500 text-slate-950 border-amber-500 hover:bg-amber-400 shadow-2xs'
                      }`}
                      title={
                        cardMastery === 2
                          ? 'Đã thuộc (Hộp 3 - Ôn sau 7 ngày). Nhấn để chọn lại Hộp 1 (Chưa thuộc)'
                          : cardMastery === 1
                          ? 'Đang học (Hộp 2 - Ôn sau 3 ngày). Nhấn để chuyển thành Đã thuộc (Hộp 3)'
                          : 'Chưa thuộc (Hộp 1 - Ôn hàng ngày). Nhấn để chuyển thành Đã thuộc (Hộp 3)'
                      }
                    >
                      {cardMastery === 2 ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã thuộc</span>
                        </>
                      ) : cardMastery === 1 ? (
                        <>
                          <Brain className="w-3.5 h-3.5" />
                          <span>Đang học</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Chưa thuộc</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hanzi Writer Stroke Order & Interactive Writing Modal */}
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
  }

  // VIEW 2: VERTICAL LESSONS LIST (When no specific lesson is opened)
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBackToCourseList}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs hover:shadow transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Danh sách Khóa Học</span>
        </button>

        <button
          onClick={() => onAddLesson(currentCourse.id)}
          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tạo Bài Học Mới</span>
        </button>
      </div>

      {/* Course Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl font-bold">
            <GraduationCap className="w-6 h-6" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Khóa học hiện tại</span>
            <h1 className="text-xl font-black text-slate-900">{currentCourse.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{currentCourse.description || 'Không có mô tả'}</p>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-center shrink-0">
          <span className="text-xs font-bold text-indigo-900 block">Số lượng bài học</span>
          <span className="text-lg font-black text-indigo-600">{courseLessons.length} bài</span>
        </div>
      </div>

      {/* Vertical Lessons List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>Danh Sách Bài Học ({courseLessons.length})</span>
        </h2>

        {courseLessons.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">Khóa học này chưa có bài học nào</h3>
            <p className="text-xs text-slate-500 mb-4">Nhấn nút "+ Tạo Bài Học Mới" ở trên để bắt đầu tạo bài học!</p>
            <button
              onClick={() => onAddLesson(currentCourse.id)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              + Tạo Bài Học Mới
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {courseLessons.map((les) => {
              const lessonCards = cards.filter((c) => c.lessonId === les.id);
              const lesSrs = getLessonSrsStats(cards, les.id);

              return (
                <div
                  key={les.id}
                  onClick={() => onSelectLesson(les.id)}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-400 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {les.name}
                        </h3>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {lessonCards.length} từ vựng
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {les.description || 'Chạm để mở trang từ vựng & các chế độ ôn tập Quizlet'}
                      </p>

                      {/* Lesson SRS Box Breakdown Badges */}
                      {lessonCards.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold mt-2">
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                            H1: {lesSrs.box1Count}
                          </span>
                          <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                            H2: {lesSrs.box2Count}
                          </span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            H3: {lesSrs.box3Count}
                          </span>
                          {lesSrs.dueCardsCount > 0 && (
                            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              🔥 {lesSrs.dueCardsCount} cần ôn
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={lessonCards.length === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartStudy(les, lessonCards);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        title="Học từ vựng"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Học</span>
                      </button>

                      <button
                        disabled={lessonCards.length === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartGame(les, lessonCards);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        title="Game ghép từ"
                      >
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>Game</span>
                      </button>

                      <button
                        disabled={lessonCards.length === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartTest(les, lessonCards);
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        title="Kiểm tra"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Kiểm tra</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditLesson(les);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Sửa bài học"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLesson(les);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Xóa bài học"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl ml-1">
                        Xem Thẻ ➔
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hanzi Writer Stroke Order & Interactive Writing Modal */}
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
