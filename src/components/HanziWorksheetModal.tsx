import React, { useState, useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import {
  X,
  Printer,
  Sparkles,
  Grid,
  FileText,
  Check,
  Settings2,
  RefreshCw,
  Search,
  BookOpen,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Flashcard } from '../types';

interface HanziWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards?: Flashcard[];
  lessonTitle?: string;
}

type GridStyle = 'tianzige' | 'mizige' | 'jiugongge' | 'box';
type GridColor = 'red' | 'slate' | 'emerald';

interface CharacterWorksheetItem {
  char: string;
  pinyin: string;
  definition: string;
  strokes?: string[]; // SVG paths
  strokeCount?: number;
}

export const HanziWorksheetModal: React.FC<HanziWorksheetModalProps> = ({
  isOpen,
  onClose,
  cards = [],
  lessonTitle = 'Bài Học Vở Tập Viết',
}) => {
  // Custom text or selected cards
  const [activeTab, setActiveTab] = useState<'cards' | 'custom'>('cards');
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [customText, setCustomText] = useState('你好 谢谢 学习 中文 汉字');
  const [worksheetTitle, setWorksheetTitle] = useState(lessonTitle);

  // Settings
  const [gridStyle, setGridStyle] = useState<GridStyle>('tianzige');
  const [gridColor, setGridColor] = useState<GridColor>('red');
  const [rowCount, setRowCount] = useState<number>(5); // Số dòng tập viết tự chọn
  const [showSampleRow, setShowSampleRow] = useState<boolean>(true); // Dòng mẫu in đậm
  const [practiceMode, setPracticeMode] = useState<'faint' | 'blank' | 'first_faint'>('first_faint'); // In nét mờ / Không in nét mờ / Mờ dòng đầu
  const [printLayout, setPrintLayout] = useState<'continuous' | 'single_page'>('continuous'); // In 2 mặt (liền mạch) hay In 1 mặt (mỗi chữ 1 trang)
  const [showStrokeOrder, setShowStrokeOrder] = useState<boolean>(true);
  const [charsPerRow, setCharsPerRow] = useState<number>(8); // 8 ô/dòng chuẩn A4

  // Character Data State
  const [charItems, setCharItems] = useState<CharacterWorksheetItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize selected card IDs when cards prop changes
  useEffect(() => {
    if (cards.length > 0) {
      setSelectedCardIds(cards.slice(0, 10).map((c) => c.id));
    }
    if (lessonTitle) {
      setWorksheetTitle(lessonTitle);
    }
  }, [cards, lessonTitle]);

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

  // Load stroke data for characters
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
  }, [isOpen, activeTab, selectedCardIds, customText]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const toggleSelectAll = () => {
    if (selectedCardIds.length === cards.length) {
      setSelectedCardIds([]);
    } else {
      setSelectedCardIds(cards.map((c) => c.id));
    }
  };

  // Helper grid border/dashed color classes
  const getGridColorClasses = () => {
    if (gridColor === 'red') {
      return {
        outerBorder: 'border-rose-500/80',
        innerLine: 'border-rose-300/60',
        textFaint: 'text-rose-200/50',
      };
    }
    if (gridColor === 'emerald') {
      return {
        outerBorder: 'border-emerald-600/80',
        innerLine: 'border-emerald-300/60',
        textFaint: 'text-emerald-200/50',
      };
    }
    return {
      outerBorder: 'border-slate-400',
      innerLine: 'border-slate-300/70',
      textFaint: 'text-slate-300',
    };
  };

  const gridColors = getGridColorClasses();

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-vietnamese">
      {/* Printable CSS Rules */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
          }
          body {
            background: white !important;
            color: black !important;
            font-family: 'Be Vietnam Pro', 'Plus Jakarta Sans', sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .print-card-block {
            ${printLayout === 'single_page' ? 'page-break-after: always !important; break-after: page !important;' : 'page-break-inside: avoid !important; break-inside: avoid !important;'}
            margin-bottom: 24px !important;
          }
          .tianzige-box {
            border-color: ${gridColor === 'red' ? '#dc2626' : gridColor === 'emerald' ? '#16a34a' : '#475569'} !important;
          }
          .tianzige-line {
            border-color: ${gridColor === 'red' ? '#fca5a5' : gridColor === 'emerald' ? '#86efac' : '#cbd5e1'} !important;
          }
          .faint-char {
            color: #d1d5db !important;
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

      {/* Top Navbar / Toolbar Controls (Hidden when printing) */}
      <div className="no-print bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950 rounded-2xl shadow-md font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Tạo Vở Tập Viết Chữ Hán (PDF)</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Tianzige 田字格
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Xuất file in A4 kèm nét mẫu từng bước & 5 dòng trống luyện viết tay
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
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

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar: Controls & Customization Panel (Hidden in print) */}
        <div className="no-print w-full lg:w-80 bg-slate-900 border-r border-slate-800 p-5 overflow-y-auto space-y-6 shrink-0">
          {/* Source Selection Tabs */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              1. Chọn Nguồn Từ Vựng
            </label>
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setActiveTab('cards')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'cards'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Bài Học ({cards.length})
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'custom'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Nhập Tự Do
              </button>
            </div>

            {activeTab === 'cards' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Đã chọn: {selectedCardIds.length}/{cards.length} từ</span>
                  <button
                    onClick={toggleSelectAll}
                    className="text-amber-400 hover:underline cursor-pointer font-bold"
                  >
                    {selectedCardIds.length === cards.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950 p-2 space-y-1">
                  {cards.length === 0 ? (
                    <p className="text-xs text-slate-500 p-2 text-center">Không có từ vựng trong bài học này</p>
                  ) : (
                    cards.map((card) => {
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
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
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
              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">Nhập danh sách Chữ Hán:</label>
                <textarea
                  rows={3}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Gõ hoặc dán chữ Hán vào đây..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white font-chinese text-base outline-none font-bold"
                />
              </div>
            )}
          </div>

          {/* Worksheet Title Header Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              2. Tiêu Đề Vở Tập Viết
            </label>
            <input
              type="text"
              value={worksheetTitle}
              onChange={(e) => setWorksheetTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-xs font-bold"
            />
          </div>

          {/* Grid Layout & Style Settings */}
          <div className="space-y-4 border-t border-slate-800 pt-4">
            <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              3. Tùy Chỉnh Khung & Dòng Trống
            </label>

            {/* Print Layout Mode: 1 mặt vs 2 mặt */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-300 block">Chế Độ Bố Cục Trang (In PDF):</span>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
                <button
                  onClick={() => setPrintLayout('continuous')}
                  className={`py-2 px-2 rounded-xl text-[11px] border text-center transition-all cursor-pointer ${
                    printLayout === 'continuous'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-xs'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  📄 In 2 Mặt (Liền mạch)
                </button>
                <button
                  onClick={() => setPrintLayout('single_page')}
                  className={`py-2 px-2 rounded-xl text-[11px] border text-center transition-all cursor-pointer ${
                    printLayout === 'single_page'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-xs'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  📄 In 1 Mặt (Mỗi chữ/trang)
                </button>
              </div>
            </div>

            {/* Grid Type */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-300 block">Loại Ô Lưới:</span>
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
                    className={`py-2 px-2 rounded-xl text-[11px] border text-center transition-all cursor-pointer ${
                      gridStyle === item.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Color */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-300 block">Màu Đường Kẻ Lưới:</span>
              <div className="flex gap-2">
                {[
                  { id: 'red', label: 'Đỏ Đô', bg: 'bg-rose-600' },
                  { id: 'slate', label: 'Xám Đen', bg: 'bg-slate-500' },
                  { id: 'emerald', label: 'Xanh Lá', bg: 'bg-emerald-600' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setGridColor(c.id as GridColor)}
                    className={`flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      gridColor === c.id
                        ? 'bg-slate-800 text-white border-amber-400 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${c.bg}`} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Practice Rows Count - Tự chọn số lượng */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 block">Số Dòng Tập Viết (Mỗi chữ):</span>
                <span className="text-xs font-black text-amber-400">{rowCount} dòng</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex gap-1">
                  {[2, 3, 5, 8, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => setRowCount(num)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        rowCount === num
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={rowCount}
                  onChange={(e) => setRowCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  className="w-14 p-1.5 bg-slate-950 border border-slate-800 text-amber-300 rounded-lg text-center text-xs font-bold focus:border-amber-500"
                  title="Nhập số dòng tùy chỉnh"
                />
              </div>
            </div>

            {/* Practice Rows Style: In nét mờ vs Không in nét mờ */}
            <div className="space-y-1.5">
              <span className="text-xs text-slate-300 block">Kiểu Dòng Tập Viết:</span>
              <div className="space-y-1 text-xs">
                {[
                  { id: 'first_faint', label: '1. Mờ dòng 1 (Các dòng sau trống)' },
                  { id: 'faint', label: '2. In nét mờ tất cả dòng (Đồ chữ)' },
                  { id: 'blank', label: '3. Trống hoàn toàn (Không in nét mờ)' },
                ].map((mode) => (
                  <label
                    key={mode.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${
                      practiceMode === mode.id
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="practiceMode"
                      checked={practiceMode === mode.id}
                      onChange={() => setPracticeMode(mode.id as any)}
                      className="accent-amber-500 cursor-pointer"
                    />
                    <span>{mode.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span>In Dòng Mẫu Chữ In Đậm (Dòng Mẫu)</span>
                <input
                  type="checkbox"
                  checked={showSampleRow}
                  onChange={(e) => setShowSampleRow(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span>Hiện Các Nét Viết Mẫu Từng Bước</span>
                <input
                  type="checkbox"
                  checked={showStrokeOrder}
                  onChange={(e) => setShowStrokeOrder(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Preview Canvas (Represents A4 Printable Sheet) */}
        <div className="flex-1 bg-slate-950 p-4 sm:p-8 overflow-y-auto flex justify-center items-start">
          <div className="print-container w-full max-w-[210mm] bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-8 min-h-[297mm]">
            {/* Sheet Print Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  {worksheetTitle || 'VỞ TẬP VIẾT CHỮ HÁN'}
                </h1>
                <p className="text-xs text-slate-600 font-semibold mt-1">
                  Bảng Luyện Viết Theo Nét Mẫu • 田字格 Line Grid Worksheet
                </p>
              </div>

              <div className="text-xs text-slate-700 space-y-1 font-semibold border-l-2 border-slate-300 pl-4">
                <div>Họ và tên: .................................................</div>
                <div>Ngày học: ...... / ...... / 20...... • Điểm: ......</div>
              </div>
            </div>

            {/* Loading Indicator */}
            {isLoading && (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-600">Đang tải dữ liệu nét chữ Hán...</p>
              </div>
            )}

            {!isLoading && charItems.length === 0 && (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-600">Chưa chọn chữ Hán nào để luyện viết</p>
                <p className="text-xs text-slate-500">Hãy chọn các từ vựng từ danh sách ở cột bên trái.</p>
              </div>
            )}

            {/* Character Worksheet Cards List */}
            {!isLoading &&
              charItems.map((item, idx) => (
                <div key={`${item.char}-${idx}`} className="print-card-block space-y-3 border-b border-slate-200 pb-6 last:border-none">
                  {/* Top Character Info Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black font-chinese text-slate-900">{item.char}</span>
                          {item.pinyin && (
                            <span className="text-sm font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              [{item.pinyin}]
                            </span>
                          )}
                        </div>
                        {item.definition && (
                          <p className="text-xs text-slate-600 font-medium">{item.definition}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      Tổng số nét: <span className="text-indigo-600 font-black">{item.strokeCount || '?'}</span> nét
                    </div>
                  </div>

                  {/* Stroke Order Demonstration Boxes */}
                  {showStrokeOrder && item.strokes && item.strokes.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        ✦ Thứ Tự Các Nét Viết Mẫu (Stroke Order Sequence):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {item.strokes.map((_, strokeIdx) => (
                          <div
                            key={strokeIdx}
                            className="flex flex-col items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs"
                          >
                            <div className="relative w-10 h-10 border border-slate-300 rounded-lg overflow-hidden flex items-center justify-center">
                              {/* Background Tianzige Grid */}
                              <svg className="absolute inset-0 w-full h-full text-slate-200" viewBox="0 0 1024 1024">
                                <line x1="512" y1="0" x2="512" y2="1024" stroke="currentColor" strokeDasharray="40 40" strokeWidth="20" />
                                <line x1="0" y1="512" x2="1024" y2="512" stroke="currentColor" strokeDasharray="40 40" strokeWidth="20" />
                              </svg>
                              {/* Render Strokes up to strokeIdx */}
                              <svg className="w-full h-full text-slate-900" viewBox="0 0 1024 1024">
                                <g transform="scale(1, -1) translate(0, -900)">
                                  {item.strokes?.slice(0, strokeIdx + 1).map((pathD, pIdx) => (
                                    <path
                                      key={pIdx}
                                      d={pathD}
                                      fill={pIdx === strokeIdx ? '#dc2626' : '#1e293b'}
                                    />
                                  ))}
                                </g>
                              </svg>
                            </div>
                            <span className="text-[9px] font-black text-slate-500">Nét {strokeIdx + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dòng Mẫu (Sample Row with bold Chinese characters) */}
                  {showSampleRow && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                        ✦ Dòng Mẫu (Chữ Mẫu In Đậm):
                      </span>
                      <div className="flex gap-1.5 items-center">
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded text-center shrink-0">
                          Mẫu
                        </span>
                        <div className="flex-1 flex gap-1.5 overflow-hidden">
                          {Array.from({ length: charsPerRow }).map((_, boxIdx) => (
                            <div
                              key={boxIdx}
                              className={`tianzige-box relative w-11 h-11 border-2 rounded-lg bg-white shrink-0 flex items-center justify-center overflow-hidden ${gridColors.outerBorder}`}
                            >
                              {/* Grid Pattern Inner Lines */}
                              <svg className="absolute inset-0 w-full h-full text-slate-300" viewBox="0 0 100 100">
                                {gridStyle === 'mizige' && (
                                  <>
                                    <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" />
                                    <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" />
                                  </>
                                )}
                                {(gridStyle === 'tianzige' || gridStyle === 'mizige') && (
                                  <>
                                    <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.2" />
                                    <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.2" />
                                  </>
                                )}
                                {gridStyle === 'jiugongge' && (
                                  <>
                                    <line x1="33" y1="0" x2="33" y2="100" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" />
                                    <line x1="66" y1="0" x2="66" y2="100" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" />
                                    <line x1="0" y1="33" x2="100" y2="33" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" />
                                    <line x1="0" y1="66" x2="100" y2="66" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" />
                                  </>
                                )}
                              </svg>

                              {/* Bold Sample Character Overlay */}
                              <span className="relative z-10 font-chinese text-2xl font-black text-slate-900 select-none bold-sample-char">
                                {item.char}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tianzige Practice Rows (Dòng Tập Viết) */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      ✦ Dòng Tập Viết ({rowCount} Dòng Tianzige):
                    </span>

                    {Array.from({ length: rowCount }).map((_, rowIdx) => (
                      <div key={rowIdx} className="flex gap-1.5 items-center">
                        <span className="text-[10px] font-bold text-slate-400 w-6 text-right shrink-0">
                          D{rowIdx + 1}
                        </span>
                        <div className="flex-1 flex gap-1.5 overflow-hidden">
                          {Array.from({ length: charsPerRow }).map((_, boxIdx) => {
                            // Determine text overlay based on practiceMode
                            let showText = false;
                            let isFaintText = true;
                            let isFullGuide = false;

                            if (practiceMode === 'faint') {
                              showText = true;
                              isFaintText = true;
                            } else if (practiceMode === 'first_faint') {
                              if (rowIdx === 0) {
                                showText = true;
                                if (boxIdx === 0) {
                                  isFullGuide = true;
                                  isFaintText = false;
                                } else {
                                  isFaintText = true;
                                }
                              }
                            } else if (practiceMode === 'blank') {
                              showText = false;
                            }

                            return (
                              <div
                                key={boxIdx}
                                className={`tianzige-box relative w-11 h-11 border-2 rounded-lg bg-white shrink-0 flex items-center justify-center overflow-hidden ${gridColors.outerBorder}`}
                              >
                                {/* Grid Pattern Inner Lines */}
                                <svg className="absolute inset-0 w-full h-full text-slate-300" viewBox="0 0 100 100">
                                  {gridStyle === 'mizige' && (
                                    <>
                                      <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" />
                                      <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" />
                                    </>
                                  )}
                                  {(gridStyle === 'tianzige' || gridStyle === 'mizige') && (
                                    <>
                                      <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.2" />
                                      <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.2" />
                                    </>
                                  )}
                                  {gridStyle === 'jiugongge' && (
                                    <>
                                      <line x1="33" y1="0" x2="33" y2="100" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" />
                                      <line x1="66" y1="0" x2="66" y2="100" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" />
                                      <line x1="0" y1="33" x2="100" y2="33" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" />
                                      <line x1="0" y1="66" x2="100" y2="66" stroke="currentColor" strokeDasharray="3 3" strokeWidth="1" />
                                    </>
                                  )}
                                </svg>

                                {/* Character overlay if guide box */}
                                {showText && (
                                  <span
                                    className={`relative z-10 font-chinese text-2xl select-none ${
                                      isFullGuide
                                        ? 'font-black text-slate-900'
                                        : isFaintText
                                        ? 'faint-char text-slate-300 font-bold opacity-40'
                                        : 'font-bold text-slate-900'
                                    }`}
                                  >
                                    {item.char}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
