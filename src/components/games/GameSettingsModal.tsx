import React from 'react';
import { X, CheckSquare, Square } from 'lucide-react';

export type QuestionField = 'term' | 'pinyin' | 'definition' | 'audio';

export interface GameCustomSettings {
  questionCount: number;
  questionTypes: QuestionField[]; // Checkboxes for prompt types
  answerTypes: QuestionField[];   // Checkboxes for option types
  answerMode?: 'choice' | 'typing'; // 'choice' (multiple choice) or 'typing' (keyboard input)
  soundEnabled: boolean;
  timeLimitSeconds?: number;
  showSentenceTranslation?: boolean;
}

interface GameSettingsModalProps {
  title: string;
  settings: GameCustomSettings;
  totalCardsCount: number;
  onSave: (newSettings: GameCustomSettings) => void;
  onClose: () => void;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  title,
  settings,
  totalCardsCount,
  onSave,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = React.useState<GameCustomSettings>({ ...settings });

  const toggleQuestionType = (type: QuestionField) => {
    setLocalSettings((prev) => {
      const exists = prev.questionTypes.includes(type);
      let updated = exists
        ? prev.questionTypes.filter((t) => t !== type)
        : [...prev.questionTypes, type];
      
      if (updated.length === 0) updated = [type];
      return { ...prev, questionTypes: updated };
    });
  };

  const toggleAnswerType = (type: QuestionField) => {
    setLocalSettings((prev) => {
      const exists = prev.answerTypes.includes(type);
      let updated = exists
        ? prev.answerTypes.filter((t) => t !== type)
        : [...prev.answerTypes, type];
      
      if (updated.length === 0) updated = [type];
      return { ...prev, answerTypes: updated };
    });
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Cài Đặt Trò Chơi</h3>
            <p className="text-xs text-slate-400 mt-0.5">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Question Count Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200 block text-xs">
              Số lượng câu hỏi mỗi ván
            </label>
            <select
              value={localSettings.questionCount}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, questionCount: Number(e.target.value) })
              }
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium cursor-pointer outline-none focus:border-indigo-500 transition-colors"
            >
              <option value={5}>5 câu hỏi (Nhanh)</option>
              <option value={10}>10 câu hỏi (Tiêu chuẩn)</option>
              <option value={15}>15 câu hỏi (Nâng cao)</option>
              <option value={totalCardsCount}>Tất cả từ vựng ({totalCardsCount} từ)</option>
            </select>
          </div>

          {/* Answer Mode (Choice vs Typing) */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 block text-xs">
              Hình thức làm bài
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, answerMode: 'choice' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  (localSettings.answerMode || 'choice') === 'choice'
                    ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500 font-semibold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-bold text-xs text-white">Trắc nghiệm</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Chọn 1 trong các phương án</div>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, answerMode: 'typing' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  localSettings.answerMode === 'typing'
                    ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500 font-semibold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-bold text-xs text-white">Tự gõ / Đánh máy</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Nhập trực tiếp từ bàn phím</div>
              </button>
            </div>
          </div>

          {/* Question Prompt Checkboxes */}
          <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 text-xs">
                Nội dung câu hỏi (Đề bài)
              </span>
              <span className="text-[10px] text-slate-500">Chọn 1 hoặc nhiều</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { id: 'term' as QuestionField, label: 'Chữ Hán' },
                { id: 'pinyin' as QuestionField, label: 'Phiên âm (Pinyin)' },
                { id: 'definition' as QuestionField, label: 'Nghĩa Tiếng Việt' },
                { id: 'audio' as QuestionField, label: 'Phát âm (Audio)' },
              ].map((item) => {
                const selected = localSettings.questionTypes.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => toggleQuestionType(item.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      selected
                        ? 'bg-indigo-950/60 text-indigo-200 border-indigo-500/80 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {selected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Answer Option Checkboxes */}
          <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 text-xs">
                Nội dung đáp án lựa chọn
              </span>
              <span className="text-[10px] text-slate-500">Chọn 1 hoặc nhiều</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { id: 'term' as QuestionField, label: 'Chữ Hán' },
                { id: 'pinyin' as QuestionField, label: 'Phiên âm (Pinyin)' },
                { id: 'definition' as QuestionField, label: 'Nghĩa Tiếng Việt' },
                { id: 'audio' as QuestionField, label: 'Phát âm (Audio)' },
              ].map((item) => {
                const selected = localSettings.answerTypes.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => toggleAnswerType(item.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      selected
                        ? 'bg-indigo-950/60 text-indigo-200 border-indigo-500/80 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {selected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound toggle */}
          <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <span className="font-semibold text-slate-200 block">Tự động đọc phát âm</span>
              <span className="text-[11px] text-slate-400">Đọc Hán tự khi hiển thị câu hỏi mới</span>
            </div>
            <input
              type="checkbox"
              checked={localSettings.soundEnabled}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, soundEnabled: e.target.checked })
              }
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};
