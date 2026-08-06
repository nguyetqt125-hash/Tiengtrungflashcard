import React, { useState, useEffect } from 'react';
import { X, Layers, Sparkles, Volume2 } from 'lucide-react';
import { Flashcard } from '../types';
import { speakChinese } from '../utils/speech';

interface FlashcardModalProps {
  isOpen: boolean;
  lessonId: string;
  cardToEdit?: Flashcard | null;
  onClose: () => void;
  onSave: (cardData: Omit<Flashcard, 'id' | 'createdAt'> | Flashcard) => void;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  isOpen,
  lessonId,
  cardToEdit,
  onClose,
  onSave,
}) => {
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('Danh từ');
  const [example, setExample] = useState('');
  const [synonyms, setSynonyms] = useState('');
  const [memoryTip, setMemoryTip] = useState('');

  useEffect(() => {
    if (cardToEdit) {
      setTerm(cardToEdit.term || '');
      setDefinition(cardToEdit.definition || '');
      setPinyin(cardToEdit.pinyin || '');
      setPartOfSpeech(cardToEdit.partOfSpeech || 'Danh từ');
      setExample(cardToEdit.example || '');
      setSynonyms(cardToEdit.synonyms || '');
      setMemoryTip(cardToEdit.memoryTip || '');
    } else {
      setTerm('');
      setDefinition('');
      setPinyin('');
      setPartOfSpeech('Danh từ');
      setExample('');
      setSynonyms('');
      setMemoryTip('');
    }
  }, [cardToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) return;

    if (cardToEdit) {
      onSave({
        ...cardToEdit,
        term: term.trim(),
        definition: definition.trim(),
        pinyin: pinyin.trim(),
        partOfSpeech: partOfSpeech.trim(),
        example: example.trim(),
        synonyms: synonyms.trim(),
        memoryTip: memoryTip.trim(),
      });
    } else {
      onSave({
        lessonId,
        term: term.trim(),
        definition: definition.trim(),
        pinyin: pinyin.trim(),
        partOfSpeech: partOfSpeech.trim(),
        example: example.trim(),
        synonyms: synonyms.trim(),
        memoryTip: memoryTip.trim(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-xl w-full p-6 my-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {cardToEdit ? 'Chỉnh sửa thẻ từ vựng' : 'Tạo mới thẻ từ vựng'}
            </h2>
            <p className="text-xs text-slate-500">Thẻ flashcard với đầy đủ 7 trường thông tin hỗ trợ ghi nhớ</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Term & Definition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                1. Từ 1 / Thuật ngữ (Hán tự) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="VD: 学习"
                  className="w-full px-3.5 py-2.5 text-base bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 font-chinese font-semibold"
                />
                {term.trim() && (
                  <button
                    type="button"
                    onClick={() => speakChinese(term)}
                    className="absolute right-2.5 top-2.5 p-1 text-indigo-600 hover:text-indigo-800 rounded-md hover:bg-indigo-50"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                2. Định nghĩa 1 (Nghĩa) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
                placeholder="VD: Học tập"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
          </div>

          {/* Row 2: Pinyin & Part of Speech */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                3. Phát âm (nếu có) / Pinyin
              </label>
              <input
                type="text"
                value={pinyin}
                onChange={(e) => setPinyin(e.target.value)}
                placeholder="VD: xué xí"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                4. Loại từ (nếu có)
              </label>
              <input
                type="text"
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                placeholder="VD: Động từ, Danh từ, Tính từ..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
          </div>

          {/* Field 5: Example */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              5. Ví dụ (nếu có)
            </label>
            <textarea
              rows={2}
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="VD: 我在学习汉语。(Tôi đang học tiếng Trung.)"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          {/* Row 3: Synonyms & Memory Tip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                6. Từ đồng nghĩa (nếu có)
              </label>
              <input
                type="text"
                value={synonyms}
                onChange={(e) => setSynonyms(e.target.value)}
                placeholder="VD: 研习, 学"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                7. Mẹo ghi nhớ (nếu có)
              </label>
              <input
                type="text"
                value={memoryTip}
                onChange={(e) => setMemoryTip(e.target.value)}
                placeholder="VD: Bộ Mịch che mái trường, bộ Vũ cánh chim"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{cardToEdit ? 'Cập nhật Thẻ' : 'Lưu Flashcard'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
