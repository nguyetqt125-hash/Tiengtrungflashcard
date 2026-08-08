import React, { useState, useEffect } from 'react';
import HanziWriter from 'hanzi-writer';
import {
  X,
  Printer,
  FileText,
  RefreshCw,
  BookOpen,
  Layers,
  Check,
  ChevronRight,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { Course, Lesson, Flashcard } from '../types';

interface HanziWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses?: Course[];
  lessons?: Lesson[];
  cards?: Flashcard[];
  initialCourseId?: string | null;
  initialLessonId?: string | null;
  lessonTitle?: string;
}

type GridStyle = 'tianzige' | 'mizige' | 'jiugongge' | 'box';
type GridColor = 'green' | 'red' | 'slate';

interface CharacterWorksheetItem {
  char: string;
  pinyin: string;
  definition: string;
  strokes?: string[];
  strokeCount?: number;
}

export const HanziWorksheetModal: React.FC<HanziWorksheetModalProps> = ({
  isOpen,
  onClose,
  courses = [],
  lessons = [],
  cards = [],
  initialCourseId,
  initialLessonId,
  lessonTitle = 'Vở Tập Viết Chữ Hán',
}) => {
  // Navigation & Selection State (Khóa học -> Bài học)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'cards' | 'custom'>('cards');
  const [customText, setCustomText] = useState('你好 谢谢 学习 中文 汉字');
  const [worksheetTitle, setWorksheetTitle] = useState(lessonTitle);

  // Grid & Paper Settings (Matching User Sample Image)
  const [gridStyle, setGridStyle] = useState<GridStyle>('tianzige');
  const [gridColor, setGridColor] = useState<GridColor>('green'); // Emerald Green as in user screenshot!
  const [practiceMode, setPracticeMode] = useState<'first_1_faint' | 'first_5_faint' | 'all_faint' | 'blank'>('first_1_faint'); // Mờ 1 dòng / Mờ 5 dòng / Mờ tất cả / Không mờ
  const [showPinyinLines, setShowPinyinLines] = useState<boolean>(true); // Top 2 dashed lines for Pinyin above grid
  const [showStrokeOrder, setShowStrokeOrder] = useState<boolean>(true);
  const [pagesPerChar, setPagesPerChar] = useState<number>(0); // 0 = Liền mạch (Nhiều chữ/trang), 1 = 1 trang/chữ, 2 = 2 trang/chữ, 3 = 3 trang/chữ
  const [boxesPerRow, setBoxesPerRow] = useState<number>(11); // 11 ô / dòng A4

  // Character Data State
  const [charItems, setCharItems] = useState<CharacterWorksheetItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize selected Course & Lesson on open
  useEffect(() => {
    if (!isOpen) return;

    if (initialCourseId) {
      setSelectedCourseId(initialCourseId);
    } else if (courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }

    if (initialLessonId) {
      setSelectedLessonId(initialLessonId);
    } else if (lessons.length > 0) {
      const filteredLessons = initialCourseId
        ? lessons.filter((l) => l.courseId === initialCourseId)
        : lessons;
      if (filteredLessons.length > 0) {
        setSelectedLessonId(filteredLessons[0].id);
      }
    }
  }, [isOpen, initialCourseId, initialLessonId, courses, lessons]);

  // Available lessons for current course
  const availableLessons = selectedCourseId
    ? lessons.filter((l) => l.courseId === selectedCourseId)
    : lessons;

  // Available cards for current lesson
  const availableCards = selectedLessonId
    ? cards.filter((c) => c.lessonId === selectedLessonId)
    : selectedCourseId
    ? cards.filter((c) => {
        const lesson = lessons.find((l) => l.id === c.lessonId);
        return lesson?.courseId === selectedCourseId;
      })
    : cards;

  // Update selected card IDs whenever availableCards changes
  useEffect(() => {
    if (availableCards.length > 0) {
      setSelectedCardIds(availableCards.map((c) => c.id));
    } else {
      setSelectedCardIds([]);
    }

    const currentLessonObj = lessons.find((l) => l.id === selectedLessonId);
    if (currentLessonObj) {
      setWorksheetTitle(`Vở Tập Viết: ${currentLessonObj.name}`);
    } else {
      setWorksheetTitle(lessonTitle || 'Vở Tập Viết Chữ Hán');
    }
  }, [selectedLessonId, selectedCourseId]);

  // Extract unique CJK Chinese characters from selection or custom text
  const getSelectedCharacters = (): { char: string; pinyin: string; definition: string }[] => {
    const list: { char: string; pinyin: string; definition: string }[] = [];
    const seen = new Set<string>();

    if (activeTab === 'cards') {
      const selectedCards = cards.filter((c) => selectedCardIds.includes(c.id));
      for (const card of selectedCards) {
        const chars = card.term.replace(/[^\u4e00-\u9fa5]/g, '').split('');
        for (const ch of chars) {
          if (!seen.has(ch)) {
            seen.add(ch);
            list.push({
              char: ch,
              pinyin: card.pinyin || '',
              definition: card.definition || '',
            });
          }
        }
      }
    } else {
      const chars = customText.replace(/[^\u4e00-\u9fa5]/g, '').split('');
      for (const ch of chars) {
        if (!seen.has(ch)) {
          seen.add(ch);
          list.push({
            char: ch,
            pinyin: '',
            definition: '',
          });
        }
      }
    }

    return list;
  };

  // Load stroke data for selected characters
  useEffect(() => {
    if (!isOpen) return;

    const rawChars = getSelectedCharacters();
    if (rawChars.length === 0) {
      setCharItems([]);
      return;
    }

    setIsLoading(true);

    let isMounted = true;
    const fetchAllData = async () => {
      const results: CharacterWorksheetItem[] = [];

      for (const item of rawChars) {
        try {
          const data = (await HanziWriter.loadCharacterData(item.char)) as any;
          results.push({
            char: item.char,
            pinyin: item.pinyin,
            definition: item.definition,
            strokes: data && data.strokes ? data.strokes : [],
            strokeCount: data && data.strokes ? data.strokes.length : 0,
          });
        } catch {
          results.push({
            char: item.char,
            pinyin: item.pinyin,
            definition: item.definition,
            strokes: [],
            strokeCount: 0,
          });
        }
      }

      if (isMounted) {
        setCharItems(results);
        setIsLoading(false);
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTab, selectedCardIds, customText, selectedLessonId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const toggleSelectAll = () => {
    if (selectedCardIds.length === availableCards.length) {
      setSelectedCardIds([]);
    } else {
      setSelectedCardIds(availableCards.map((c) => c.id));
    }
  };

  // Get CSS Grid Colors according to selected theme
  const getGridColorHex = () => {
    if (gridColor === 'green') return { main: '#16a34a', light: '#86efac', faint: '#bbf7d0' };
    if (gridColor === 'red') return { main: '#dc2626', light: '#fca5a5', faint: '#fecdd3' };
    return { main: '#475569', light: '#cbd5e1', faint: '#e2e8f0' };
  };

  const hexColors = getGridColorHex();

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-vietnamese print-modal-bg">
      {/* Printable CSS Rules (A4 Paper Print Format) */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          html, body, #root {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            position: static !important;
            font-family: 'Inter', 'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-modal-bg {
            position: static !important;
            top: auto !important;
            left: auto !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            background: white !important;
            overflow: visible !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-main-content {
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-canvas-area {
            display: block !important;
            position: static !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .a4-page {
            position: relative !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 auto !important;
            padding: 10mm 12mm 8mm 12mm !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .a4-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .grid-line-solid {
            border-color: ${hexColors.main} !important;
          }
          .grid-line-dashed {
            border-color: ${hexColors.light} !important;
          }
          .faint-char {
            color: #cbd5e1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bold-sample-char {
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Header Toolbar (Hidden during print) */}
      <div className="no-print bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 rounded-2xl shadow-md font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Tạo Vở Tập Viết Chữ Hán A4</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Mẫu Dòng Kẻ Giấy Giấy Tập Viết
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Xuất file PDF A4 chuẩn giấy kẻ ô tập viết chữ Hán có pinyin & nét mờ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>In / Xuất File PDF A4</span>
          </button>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="print-main-content flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Control Panel */}
        <div className="no-print w-full lg:w-80 bg-slate-900 border-r border-slate-800 p-5 overflow-y-auto space-y-5 shrink-0">
          {/* Section 1: Course & Lesson Selectors */}
          <div className="space-y-3">
            <label className="text-xs font-black text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>1. Chọn Khóa Học & Bài Học</span>
            </label>

            {/* Course Selector */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-bold block">Khóa học:</span>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  const firstL = lessons.find((l) => l.courseId === e.target.value);
                  setSelectedLessonId(firstL ? firstL.id : '');
                }}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs font-bold outline-none cursor-pointer"
              >
                <option value="">-- Tất cả khóa học --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lesson Selector */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-bold block">Bài học (để tập viết):</span>
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs font-bold outline-none cursor-pointer"
              >
                <option value="">-- Chọn bài học --</option>
                {availableLessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Card Selection Mode Tabs */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold pt-1">
              <button
                onClick={() => setActiveTab('cards')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'cards'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Từ vựng bài này ({availableCards.length})
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'custom'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Nhập chữ tự do
              </button>
            </div>

            {activeTab === 'cards' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Đã chọn: {selectedCardIds.length}/{availableCards.length} từ</span>
                  <button
                    onClick={toggleSelectAll}
                    className="text-emerald-400 hover:underline cursor-pointer font-bold"
                  >
                    {selectedCardIds.length === availableCards.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                  </button>
                </div>
                <div className="max-h-44 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950 p-2 space-y-1">
                  {availableCards.length === 0 ? (
                    <p className="text-xs text-slate-500 p-2 text-center">Không có từ vựng nào trong bài học này</p>
                  ) : (
                    availableCards.map((card) => {
                      const isSelected = selectedCardIds.includes(card.id);
                      return (
                        <button
                          key={card.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCardIds(selectedCardIds.filter((id) => id !== card.id));
                            } else {
                              setSelectedCardIds([...selectedCardIds, card.id]);
                            }
                          }}
                          className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'hover:bg-slate-900 text-slate-300 border border-transparent'
                          }`}
                        >
                          <span className="font-chinese font-bold text-sm">{card.term}</span>
                          <span className="text-[11px] text-slate-400 max-w-[110px] truncate">
                            {card.pinyin || card.definition}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 block">Nhập danh sách Chữ Hán:</label>
                <textarea
                  rows={3}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Gõ chữ Hán vào đây..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white font-chinese text-base outline-none font-bold"
                />
              </div>
            )}
          </div>

          {/* Title Header */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              2. Tiêu Đề Vở Tập Viết
            </label>
            <input
              type="text"
              value={worksheetTitle}
              onChange={(e) => setWorksheetTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-white text-xs font-bold"
            />
          </div>

          {/* Grid & Line Style Settings */}
          <div className="space-y-4 border-t border-slate-800 pt-4">
            <label className="text-xs font-black text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              <span>3. Tùy Chỉnh Giấy Tập Viết</span>
            </label>

            {/* Option: Số trang tập viết cho 1 chữ */}
            <div className="space-y-1">
              <span className="text-xs text-slate-300 font-bold block">Số Trang Tập Viết Cho 1 Chữ:</span>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                {[
                  { id: 0, label: '📄 Liền Mạch (Tự do)' },
                  { id: 1, label: '📄 1 Trang / 1 Chữ' },
                  { id: 2, label: '📄 2 Trang / 1 Chữ' },
                  { id: 3, label: '📄 3 Trang / 1 Chữ' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPagesPerChar(p.id)}
                    className={`py-2 px-2 rounded-xl text-[11px] border text-center transition-all cursor-pointer ${
                      pagesPerChar === p.id
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Color */}
            <div className="space-y-1">
              <span className="text-xs text-slate-300 font-bold block">Màu Đường Kẻ Giấy:</span>
              <div className="flex gap-2">
                {[
                  { id: 'green', label: 'Xanh Lá (Như Mẫu)', bg: 'bg-emerald-600' },
                  { id: 'red', label: 'Đỏ Đô', bg: 'bg-rose-600' },
                  { id: 'slate', label: 'Xám Đen', bg: 'bg-slate-500' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setGridColor(c.id as GridColor)}
                    className={`flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      gridColor === c.id
                        ? 'bg-slate-800 text-white border-emerald-400 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${c.bg}`} />
                    <span>{c.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Box Type */}
            <div className="space-y-1">
              <span className="text-xs text-slate-300 font-bold block">Loại Ô Vuông:</span>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                {[
                  { id: 'tianzige', label: '田字格 (Tianzige)' },
                  { id: 'mizige', label: '米字格 (Mizige)' },
                  { id: 'box', label: 'Ô Vuông Đơn' },
                  { id: 'jiugongge', label: '九宫格 (Jiugong)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setGridStyle(item.id as GridStyle)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] border text-center transition-all cursor-pointer ${
                      gridStyle === item.id
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Practice Line Faint Style */}
            <div className="space-y-1">
              <span className="text-xs text-slate-300 font-bold block">Chế Độ Nét Mờ Dòng Tập Viết:</span>
              <div className="space-y-1 text-xs font-medium">
                {[
                  { id: 'first_1_faint', label: '1. In nét mờ 1 dòng đầu (Các dòng sau ô trống)' },
                  { id: 'first_5_faint', label: '2. In nét mờ 5 dòng đầu (Các dòng sau ô trống)' },
                  { id: 'all_faint', label: '3. In nét mờ tất cả các dòng (In đồ toàn bộ)' },
                  { id: 'blank', label: '4. Không in nét mờ (Dòng kẻ ô trống)' },
                ].map((mode) => (
                  <label
                    key={mode.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${
                      practiceMode === mode.id
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/50 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="practiceMode"
                      checked={practiceMode === mode.id}
                      onChange={() => setPracticeMode(mode.id as any)}
                      className="accent-emerald-500 cursor-pointer"
                    />
                    <span>{mode.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span>Dòng Kẻ Đứt Pinyin Phía Trên Ô</span>
                <input
                  type="checkbox"
                  checked={showPinyinLines}
                  onChange={(e) => setShowPinyinLines(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span>Hiện Các Nét Viết Mẫu Từng Bước</span>
                <input
                  type="checkbox"
                  checked={showStrokeOrder}
                  onChange={(e) => setShowStrokeOrder(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Preview Canvas: Authentic Paper Sheet (A4 Format) */}
        <div className="print-canvas-area flex-1 bg-slate-950 p-4 sm:p-8 overflow-y-auto flex flex-col items-center justify-start space-y-8">
          {isLoading && (
            <div className="w-full max-w-[210mm] bg-white rounded-2xl p-12 text-center space-y-3 shadow-2xl my-auto">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Đang tải dữ liệu nét chữ Hán...</p>
            </div>
          )}

          {!isLoading && charItems.length === 0 && (
            <div className="w-full max-w-[210mm] bg-white rounded-2xl p-16 text-center text-slate-400 space-y-2 shadow-2xl my-auto">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">Chưa chọn chữ Hán nào để tập viết</p>
              <p className="text-xs text-slate-500">Hãy chọn Khóa học & Bài học ở bảng điều khiển bên trái.</p>
            </div>
          )}

          {!isLoading && (() => {
            // Build A4 Page chunks
            interface PageBlock {
              item: CharacterWorksheetItem;
              charGlobalIndex: number;
              pageIdxForChar: number;
              totalPagesForChar: number;
              rowCountForBlock: number;
            }

            interface A4Page {
              pageIndex: number;
              blocks: PageBlock[];
            }

            const pages: A4Page[] = [];

            if (pagesPerChar > 0) {
              let pageCounter = 1;
              charItems.forEach((item, charIdx) => {
                for (let p = 0; p < pagesPerChar; p++) {
                  const hasStrokes = showStrokeOrder && item.strokes && item.strokes.length > 0;
                  const rows = p === 0 ? (hasStrokes ? 10 : 12) : 13;

                  pages.push({
                    pageIndex: pageCounter++,
                    blocks: [
                      {
                        item,
                        charGlobalIndex: charIdx + 1,
                        pageIdxForChar: p,
                        totalPagesForChar: pagesPerChar,
                        rowCountForBlock: rows,
                      },
                    ],
                  });
                }
              });
            } else {
              const charsPerPage = 2;
              let pageCounter = 1;

              for (let i = 0; i < charItems.length; i += charsPerPage) {
                const chunk = charItems.slice(i, i + charsPerPage);
                const blocks: PageBlock[] = chunk.map((item, offset) => ({
                  item,
                  charGlobalIndex: i + offset + 1,
                  pageIdxForChar: 0,
                  totalPagesForChar: 1,
                  rowCountForBlock: 5,
                }));

                pages.push({
                  pageIndex: pageCounter++,
                  blocks,
                });
              }
            }

            const totalPageCount = pages.length;

            return pages.map((page) => (
              <div
                key={`a4-page-${page.pageIndex}`}
                className="a4-page w-full max-w-[210mm] w-[210mm] min-h-[297mm] h-auto sm:h-[297mm] bg-white text-slate-900 rounded-sm p-[10mm] sm:p-[12mm] shadow-2xl flex flex-col justify-between box-border overflow-hidden select-none"
              >
                {/* 1. Page Top Header */}
                <div className="border-b-2 border-slate-900 pb-2 mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                      {worksheetTitle || 'VỞ TẬP VIẾT CHỮ HÁN'}
                    </h1>
                    <p className="text-[11px] text-slate-600 font-bold mt-0.5">
                      Giấy Kẻ Ô Luyện Viết Chữ Hán A4 • 田字格 (Tianzige Worksheet)
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-800 space-y-0.5 font-bold border-l-2 border-slate-300 pl-3">
                    <div>Họ & Tên: .............................................................</div>
                    <div>Lớp / Bài: ...... / ...... • Ngày: ...... / ...... / 20......</div>
                  </div>
                </div>

                {/* 2. Character Blocks inside this A4 Page */}
                <div className="flex-1 space-y-4 overflow-hidden my-auto">
                  {page.blocks.map((block) => {
                    const { item, charGlobalIndex, pageIdxForChar, totalPagesForChar, rowCountForBlock } = block;
                    const isFirstPage = pageIdxForChar === 0;

                    return (
                      <div key={`block-${charGlobalIndex}-${pageIdxForChar}`} className="space-y-2">
                        {/* Character Info Pill */}
                        {isFirstPage ? (
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                                #{charGlobalIndex}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-black font-chinese text-slate-900">{item.char}</span>
                                {item.pinyin && (
                                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    [{item.pinyin}]
                                  </span>
                                )}
                                {item.definition && (
                                  <span className="text-xs text-slate-600 font-medium ml-1">{item.definition}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {pagesPerChar > 0 && (
                                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
                                  Trang {pageIdxForChar + 1}/{totalPagesForChar}
                                </span>
                              )}
                              <div className="text-xs text-slate-600 font-bold bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                                Tổng số nét: <span className="text-emerald-700 font-black">{item.strokeCount || '?'}</span> nét
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-slate-100/80 p-2 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                              <span>Tập viết chữ:</span>
                              <span className="text-xl font-chinese font-black text-slate-900">{item.char}</span>
                              {item.pinyin && <span className="text-emerald-700">[{item.pinyin}]</span>}
                            </div>
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                              Trang {pageIdxForChar + 1}/{totalPagesForChar}
                            </span>
                          </div>
                        )}

                        {/* Step-by-step Stroke Order */}
                        {isFirstPage && showStrokeOrder && item.strokes && item.strokes.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              ✦ THỨ TỰ NẾT VIẾT MẪU TỪNG BƯỚC:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {item.strokes.map((_, strokeIdx) => (
                                <div
                                  key={strokeIdx}
                                  className="flex flex-col items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs"
                                >
                                  <div className="relative w-8 h-8 border border-slate-300 rounded overflow-hidden flex items-center justify-center">
                                    <svg className="absolute inset-0 w-full h-full text-slate-200" viewBox="0 0 1024 1024">
                                      <line x1="512" y1="0" x2="512" y2="1024" stroke="currentColor" strokeDasharray="40 40" strokeWidth="20" />
                                      <line x1="0" y1="512" x2="1024" y2="512" stroke="currentColor" strokeDasharray="40 40" strokeWidth="20" />
                                    </svg>
                                    <svg className="w-full h-full text-slate-900" viewBox="0 0 1024 1024">
                                      <g transform="scale(1, -1) translate(0, -900)">
                                        {item.strokes?.slice(0, strokeIdx + 1).map((pathD, pIdx) => (
                                          <path
                                            key={pIdx}
                                            d={pathD}
                                            fill={pIdx === strokeIdx ? hexColors.main : '#1e293b'}
                                          />
                                        ))}
                                      </g>
                                    </svg>
                                  </div>
                                  <span className="text-[8px] font-bold text-slate-500">Nét {strokeIdx + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Practice Grid Rows */}
                        <div className="space-y-1 pt-0.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            ✦ DÒNG TẬP VIẾT ({rowCountForBlock} DÒNG):
                          </span>

                          {Array.from({ length: rowCountForBlock }).map((_, rowIdx) => {
                            let renderMode: 'faint' | 'blank' = 'blank';
                            if (practiceMode === 'all_faint') {
                              renderMode = 'faint';
                            } else if (practiceMode === 'first_1_faint') {
                              renderMode = (isFirstPage && rowIdx === 0) ? 'faint' : 'blank';
                            } else if (practiceMode === 'first_5_faint') {
                              renderMode = (isFirstPage && rowIdx < 5) ? 'faint' : 'blank';
                            } else {
                              renderMode = 'blank';
                            }

                            return (
                              <PaperRow
                                key={rowIdx}
                                char={item.char}
                                strokes={item.strokes}
                                boxesCount={boxesPerRow}
                                gridStyle={gridStyle}
                                hexColors={hexColors}
                                showPinyinLines={showPinyinLines}
                                renderMode={renderMode}
                                rowIndex={rowIdx}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 3. Page Bottom Footer */}
                <div className="border-t border-slate-200 pt-2 mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium shrink-0">
                  <span className="truncate max-w-[60%] font-semibold">
                    {worksheetTitle || 'Vở Tập Viết: Bài Tập'}
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    <span>Trang</span>
                    <span className="text-emerald-700 font-black">{page.pageIndex}</span>
                    <span className="text-slate-400">/</span>
                    <span>{totalPageCount}</span>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};

/* Component rendering one continuous Chinese Paper Grid Line (exactly as user screenshot) */
interface PaperRowProps {
  char: string;
  strokes?: string[];
  boxesCount: number;
  gridStyle: GridStyle;
  hexColors: { main: string; light: string; faint: string };
  showPinyinLines: boolean;
  renderMode?: 'faint' | 'blank';
  rowIndex?: number;
}

const PaperRow: React.FC<PaperRowProps> = ({
  char,
  strokes,
  boxesCount = 11,
  gridStyle,
  hexColors,
  showPinyinLines,
  renderMode = 'blank',
  rowIndex = 0,
}) => {
  return (
    <div className="w-full flex flex-col my-1 select-none">
      {/* 1. Top Double Dashed Guidelines for Pinyin (matching sample image!) */}
      {showPinyinLines && (
        <div className="w-full flex flex-col justify-between py-0.5 h-3">
          <div
            className="w-full border-b border-dashed"
            style={{ borderColor: hexColors.light }}
          />
          <div
            className="w-full border-b border-dashed"
            style={{ borderColor: hexColors.light }}
          />
        </div>
      )}

      {/* 2. Main Row of Connected Tianzige / Mizige Square Boxes spanning paper width */}
      <div
        className="w-full flex border-t-2 border-b-2 overflow-hidden"
        style={{ borderColor: hexColors.main }}
      >
        {Array.from({ length: boxesCount }).map((_, boxIdx) => {
          let showChar = false;
          let isBold = false;
          let isFaint = false;

          if (renderMode === 'faint') {
            showChar = true;
            if (boxIdx === 0 && rowIndex === 0) {
              isBold = true;
            } else {
              isFaint = true;
            }
          } else {
            if (boxIdx === 0 && rowIndex === 0) {
              showChar = true;
              isBold = true;
            } else {
              showChar = false;
            }
          }

          return (
            <div
              key={boxIdx}
              className="relative flex-1 aspect-square border-r last:border-r-0 flex items-center justify-center overflow-hidden bg-white p-0.5"
              style={{ borderRightColor: hexColors.main }}
            >
              {/* Inner Grid Guidelines (Cross / Plus / X) */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                {gridStyle === 'mizige' && (
                  <>
                    <line x1="0" y1="0" x2="100" y2="100" stroke={hexColors.light} strokeDasharray="3 3" strokeWidth="1" />
                    <line x1="100" y1="0" x2="0" y2="100" stroke={hexColors.light} strokeDasharray="3 3" strokeWidth="1" />
                  </>
                )}
                {(gridStyle === 'tianzige' || gridStyle === 'mizige') && (
                  <>
                    <line x1="50" y1="0" x2="50" y2="100" stroke={hexColors.light} strokeDasharray="3.5 3.5" strokeWidth="1.2" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke={hexColors.light} strokeDasharray="3.5 3.5" strokeWidth="1.2" />
                  </>
                )}
                {gridStyle === 'jiugongge' && (
                  <>
                    <line x1="33" y1="0" x2="33" y2="100" stroke={hexColors.light} strokeDasharray="3 3" strokeWidth="1" />
                    <line x1="66" y1="0" x2="66" y2="100" stroke={hexColors.light} strokeDasharray="3 3" strokeWidth="1" />
                    <line x1="0" y1="33" x2="100" y2="33" stroke={hexColors.light} strokeDasharray="3 3" strokeWidth="1" />
                    <line x1="0" y1="66" x2="100" y2="66" stroke={hexColors.light} strokeDasharray="3 3" strokeWidth="1" />
                  </>
                )}
              </svg>

              {/* Character Overlay - Render SVG stroke paths from HanziWriter if available */}
              {showChar && (
                strokes && strokes.length > 0 ? (
                  <svg
                    className={`relative z-10 w-[85%] h-[85%] select-none ${
                      isBold
                        ? 'bold-sample-char text-slate-900 font-black'
                        : 'faint-char text-slate-300 opacity-30'
                    }`}
                    viewBox="0 0 1024 1024"
                  >
                    <g transform="scale(1, -1) translate(0, -900)">
                      {strokes.map((pathD, pIdx) => (
                        <path key={pIdx} d={pathD} fill="currentColor" />
                      ))}
                    </g>
                  </svg>
                ) : (
                  <span
                    className={`relative z-10 font-chinese text-2xl font-bold select-none ${
                      isBold
                        ? 'bold-sample-char text-slate-900 font-black'
                        : 'faint-char text-slate-300 opacity-40 font-bold'
                    }`}
                  >
                    {char}
                  </span>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Margin Separator */}
      <div
        className="w-full border-b my-0.5"
        style={{ borderColor: hexColors.light }}
      />
    </div>
  );
};
