import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, AlertCircle, Trash2, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { Flashcard, ImportOptions } from '../types';

interface BatchImportModalProps {
  isOpen: boolean;
  lessonId: string;
  lessonName: string;
  onClose: () => void;
  onImport: (newCards: Flashcard[]) => void;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  lessonId,
  lessonName,
  onClose,
  onImport,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [fieldDelimiter, setFieldDelimiter] = useState<string>('\t'); // Tab by default
  const [customFieldDelim, setCustomFieldDelim] = useState<string>('::');
  const [cardDelimiter, setCardDelimiter] = useState<string>('\n'); // Newline by default
  const [customCardDelim, setCustomCardDelim] = useState<string>(';');
  const [parsedCards, setParsedCards] = useState<Omit<Flashcard, 'id' | 'lessonId' | 'createdAt'>[]>([]);

  // Default sample template text
  const sampleTemplate = `你好\tXin chào\tnǐ hǎo\tThán từ\t你好！很高兴认识你。\t您好\tNǐ (Bạn) + Hảo (Tốt)
谢谢\tCảm ơn\txiè xie\tĐộng từ\t谢谢你的帮助！\t感谢\tBộ Ngôn (言) + Thân (身) + Thốn (寸)
再见\tTạm biệt\tzài jiàn\tThán từ\t明天见，再见！\t拜拜\tZài (Lại) + Jiàn (Gặp)
苹果\tQuả táo\tpíng guǒ\tDanh từ\t这个苹果很甜。\t-\tChữ 苹 (Bình) có bộ Thảo (艹) ở trên
高兴\tVui vẻ\tgāo xìng\tTính từ\t今天我很高兴。\t开心, 快乐\tGāo (Cao) + Xìng (Hứng)
学习\tHọc tập\txué xí\tĐộng từ\t我在学习汉语。\t研习\tBộ Mịch che mái trường, bộ Vũ cánh chim`;

  useEffect(() => {
    if (!isOpen) return;
    // Set initial sample if empty
    if (!inputText) {
      setInputText(sampleTemplate);
    }
  }, [isOpen]);

  // Parse text whenever inputText or delimiters change
  useEffect(() => {
    if (!inputText.trim()) {
      setParsedCards([]);
      return;
    }

    const actualFieldDelim = fieldDelimiter === 'custom' ? customFieldDelim : fieldDelimiter;
    const actualCardDelim = cardDelimiter === 'custom' ? customCardDelim : cardDelimiter;

    let cardBlocks: string[] = [];
    if (actualCardDelim === '\n') {
      cardBlocks = inputText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    } else {
      cardBlocks = inputText.split(actualCardDelim).filter((block) => block.trim().length > 0);
    }

    const parsed: Omit<Flashcard, 'id' | 'lessonId' | 'createdAt'>[] = [];

    cardBlocks.forEach((block) => {
      const fields = block.split(actualFieldDelim).map((f) => f.trim());
      // Skip empty lines
      if (fields.length === 0 || (fields.length === 1 && !fields[0])) return;

      // 7 Fields according to user requirement:
      // 1. Từ 1 / Thuật ngữ
      // 2. Định nghĩa 1
      // 3. Phát âm (Pinyin)
      // 4. Loại từ
      // 5. Ví dụ
      // 6. Từ đồng nghĩa
      // 7. Mẹo ghi nhớ
      const term = fields[0] || '';
      const definition = fields[1] || '';
      const pinyin = fields[2] || '';
      const partOfSpeech = fields[3] || '';
      const example = fields[4] || '';
      const synonyms = fields[5] || '';
      const memoryTip = fields[6] || '';

      if (term || definition) {
        parsed.push({
          term,
          definition,
          pinyin,
          partOfSpeech: partOfSpeech !== '-' ? partOfSpeech : '',
          example: example !== '-' ? example : '',
          synonyms: synonyms !== '-' ? synonyms : '',
          memoryTip: memoryTip !== '-' ? memoryTip : '',
        });
      }
    });

    setParsedCards(parsed);
  }, [inputText, fieldDelimiter, customFieldDelim, cardDelimiter, customCardDelim]);

  if (!isOpen) return null;

  const handlePasteSample = () => {
    setFieldDelimiter('\t');
    setCardDelimiter('\n');
    setInputText(sampleTemplate);
  };

  const handleDeleteParsedRow = (index: number) => {
    const updated = [...parsedCards];
    updated.splice(index, 1);
    setParsedCards(updated);
  };

  const handleConfirmImport = () => {
    if (parsedCards.length === 0) return;

    const finalFlashcards: Flashcard[] = parsedCards.map((c, i) => ({
      ...c,
      id: `card-imp-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      lessonId,
      createdAt: Date.now() + i,
    }));

    onImport(finalFlashcards);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-5xl w-full max-h-[92vh] flex flex-col my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Nhập danh sách từ vựng (Import hàng loạt)</h2>
              <p className="text-xs text-slate-500">
                Thêm nhiều từ vựng vào bài học: <span className="font-semibold text-indigo-600">{lessonName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Instructions Box matching specs */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 text-xs text-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Khung cấu trúc chuẩn 7 trường thông tin hỗ trợ:</span>
              </div>
              <button
                type="button"
                onClick={handlePasteSample}
                className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Dán văn bản mẫu
              </button>
            </div>

            <div className="bg-white/90 p-3 rounded-lg border border-indigo-200 font-mono text-[11px] text-indigo-950 leading-relaxed overflow-x-auto shadow-2xs">
              <span className="font-bold text-indigo-700">Từ 1 / Thuật ngữ</span>
              <span className="text-slate-400 font-bold mx-1.5">[Phân cách]</span>
              <span className="font-bold text-emerald-700">Định nghĩa 1</span>
              <span className="text-slate-400 font-bold mx-1.5">[Phân cách]</span>
              <span className="font-bold text-amber-700">Phát âm (Pinyin)</span>
              <span className="text-slate-400 font-bold mx-1.5">[Phân cách]</span>
              <span className="font-bold text-purple-700">Loại từ</span>
              <span className="text-slate-400 font-bold mx-1.5">[Phân cách]</span>
              <span className="font-bold text-cyan-700">Ví dụ</span>
              <span className="text-slate-400 font-bold mx-1.5">[Phân cách]</span>
              <span className="font-bold text-rose-700">Từ đồng nghĩa</span>
              <span className="text-slate-400 font-bold mx-1.5">[Phân cách]</span>
              <span className="font-bold text-teal-700">Mẹo ghi nhớ</span>
            </div>

            <p className="text-slate-500 italic">
              💡 Mẹo: Bạn chỉ cần nhập Từ & Định nghĩa là tối thiểu. Các trường còn lại (Pinyin, Loại từ, Ví dụ, Từ đồng nghĩa, Mẹo ghi nhớ) có thể để trống hoặc dùng dấu "-" nếu chưa có.
            </p>
          </div>

          {/* Delimiter controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Field separator */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phân cách giữa Thuật ngữ & Định nghĩa (và các trường):
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={fieldDelimiter}
                  onChange={(e) => setFieldDelimiter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
                >
                  <option value="\t">Ký tự Tab (Phổ biến từ Excel / Google Sheets)</option>
                  <option value=",">Dấu phẩy (,)</option>
                  <option value="|">Dấu gạch đứng (|)</option>
                  <option value="-">Dấu gạch ngang (-)</option>
                  <option value="custom">Ký tự tùy chọn...</option>
                </select>
                {fieldDelimiter === 'custom' && (
                  <input
                    type="text"
                    value={customFieldDelim}
                    onChange={(e) => setCustomFieldDelim(e.target.value)}
                    placeholder="VD: ::"
                    className="w-20 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                )}
              </div>
            </div>

            {/* Card separator */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phân cách giữa các thẻ (Cards):
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={cardDelimiter}
                  onChange={(e) => setCardDelimiter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
                >
                  <option value="\n font-mono">Dòng mới (Xuống dòng \n)</option>
                  <option value=";">Dấu chấm phẩy (;)</option>
                  <option value="||">Dấu gạch đôi (||)</option>
                  <option value="custom">Ký tự tùy chọn...</option>
                </select>
                {cardDelimiter === 'custom' && (
                  <input
                    type="text"
                    value={customCardDelim}
                    onChange={(e) => setCustomCardDelim(e.target.value)}
                    placeholder="VD: ;"
                    className="w-20 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Dán văn bản danh sách từ vựng vào đây:
            </label>
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Dán nội dung văn bản từ vựng tại đây..."
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 leading-relaxed bg-slate-900/5 placeholder:text-slate-400"
            />
          </div>

          {/* Live Preview Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Xem trước kết quả phân tích ({parsedCards.length} thẻ hợp lệ):
              </h3>
              {parsedCards.length > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
                  Sẵn sàng nhập {parsedCards.length} từ
                </span>
              )}
            </div>

            {parsedCards.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Chưa tìm thấy từ vựng nào hợp lệ. Vui lòng nhập dữ liệu theo đúng cấu trúc.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-64 shadow-2xs">
                <table className="w-full text-left text-xs text-slate-700 border-collapse min-w-[700px]">
                  <thead className="bg-slate-100 text-slate-800 font-semibold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">STT</th>
                      <th className="px-3 py-2.5">Từ 1 (Thuật ngữ)</th>
                      <th className="px-3 py-2.5">Định nghĩa 1</th>
                      <th className="px-3 py-2.5">Pinyin</th>
                      <th className="px-3 py-2.5">Loại từ</th>
                      <th className="px-3 py-2.5">Ví dụ</th>
                      <th className="px-3 py-2.5">Đồng nghĩa</th>
                      <th className="px-3 py-2.5">Mẹo nhớ</th>
                      <th className="px-3 py-2.5 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedCards.map((card, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="px-3 py-2 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                        <td className="px-3 py-2 font-bold text-slate-900 text-sm font-serif">{card.term}</td>
                        <td className="px-3 py-2 font-medium text-emerald-800">{card.definition}</td>
                        <td className="px-3 py-2 font-mono text-amber-700">{card.pinyin || '-'}</td>
                        <td className="px-3 py-2">
                          {card.partOfSpeech ? (
                            <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-medium border border-purple-100">
                              {card.partOfSpeech}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-600 max-w-[150px] truncate" title={card.example}>
                          {card.example || '-'}
                        </td>
                        <td className="px-3 py-2 text-slate-500">{card.synonyms || '-'}</td>
                        <td className="px-3 py-2 text-slate-500 max-w-[150px] truncate" title={card.memoryTip}>
                          {card.memoryTip || '-'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteParsedRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Xóa dòng này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Tổng cộng: <strong className="text-slate-900">{parsedCards.length}</strong> từ vựng được phân tích
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={parsedCards.length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Nhập {parsedCards.length} Từ Vựng</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
