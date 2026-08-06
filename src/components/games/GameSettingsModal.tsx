import React from 'react';
import { Settings, X, CheckSquare, Square, Volume2, Sparkles } from 'lucide-react';

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
      
      // Ensure at least 1 question type is selected
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
      
      // Ensure at least 1 answer type is selected
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 font-extrabold text-white">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cài Đặt Trò Chơi</h3>
              <p className="text-xs text-slate-400 font-normal">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 text-xs">
          {/* Question Count Selection */}
          <div>
            <label className="font-bold text-slate-200 block mb-1.5 text-xs">
              🎯 Số lượng câu hỏi mỗi ván:
            </label>
            <select
              value={localSettings.questionCount}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, questionCount: Number(e.target.value) })
              }
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-2xl text-white font-bold cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={5}>5 câu hỏi (Nhanh)</option>
              <option value={10}>10 câu hỏi (Tiêu chuẩn)</option>
              <option value={15}>15 câu hỏi (Thử thách)</option>
              <option value={totalCardsCount}>Tất cả từ vựng ({totalCardsCount} từ)</option>
            </select>
          </div>

          {/* Question Prompt Checkboxes */}
          <div className="space-y-2 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Nội dung ĐỀ BÀI (Chọn 1 hoặc nhiều):
              </span>
              <span className="text-[10px] text-slate-400">Hệ thống sẽ xáo trộn</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Tùy chỉnh thông tin hiển thị ở phần câu hỏi cho người chơi:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => toggleQuestionType('term')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  localSettings.questionTypes.includes('term')
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/60 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {localSettings.questionTypes.includes('term') ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>🔤 Chữ Hán (term)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleQuestionType('pinyin')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  localSettings.questionTypes.includes('pinyin')
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/60 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {localSettings.questionTypes.includes('pinyin') ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>🗣️ Phiên âm (pinyin)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleQuestionType('definition')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  localSettings.questionTypes.includes('definition')
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/60 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {localSettings.questionTypes.includes('definition') ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>📖 Tiếng Việt (Nghĩa)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleQuestionType('audio')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  localSettings.questionTypes.includes('audio')
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/60 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {localSettings.questionTypes.includes('audio') ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>🔊 Âm thanh phát âm</span>
              </button>
            </div>
          </div>

          {/* Answer Option Checkboxes */}
          <div className="space-y-2 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Nội dung CÂU TRẢ LỜI (Chọn 1 hoặc nhiều):
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Hệ thống sẽ tự động lọc đảm bảo câu hỏi và câu trả lời KHÔNG bị trùng loại với nhau!
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => toggleAnswerType('term')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  localSettings.answerTypes.includes('term')
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {localSettings.answerTypes.includes('term') ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>🔤 Chữ Hán (term)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleAnswerType('pinyin')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  localSettings.answerTypes.includes('pinyin')
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {localSettings.answerTypes.includes('pinyin') ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>🗣️ Phiên âm (pinyin)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleAnswerType('definition')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  localSettings.answerTypes.includes('definition')
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {localSettings.answerTypes.includes('definition') ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>📖 Tiếng Việt (Nghĩa)</span>
              </button>

              <button
                type="button"
                onClick={() => toggleAnswerType('audio')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  localSettings.answerTypes.includes('audio')
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {localSettings.answerTypes.includes('audio') ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span>🔊 Nút nghe âm thanh</span>
              </button>
            </div>
          </div>

          {/* Answer Mode (Choice vs Typing) */}
          <div className="space-y-2 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <label className="font-bold text-emerald-300 text-xs uppercase tracking-wider block mb-1">
              ⌨️ Chế độ làm bài (Trắc nghiệm vs Tự gõ):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, answerMode: 'choice' })}
                className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  (localSettings.answerMode || 'choice') === 'choice'
                    ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/60 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                { (localSettings.answerMode || 'choice') === 'choice' ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <div>
                  <span className="block font-bold text-xs">Trắc nghiệm</span>
                  <span className="text-[10px] text-slate-400">Chọn 1 trong 4 phương án</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, answerMode: 'typing' })}
                className={`p-3 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  localSettings.answerMode === 'typing'
                    ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/60 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                }`}
              >
                { localSettings.answerMode === 'typing' ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <div>
                  <span className="block font-bold text-xs">Tự gõ / Đánh máy</span>
                  <span className="text-[10px] text-slate-400">Nhập đáp án trực tiếp</span>
                </div>
              </button>
            </div>
          </div>

          {/* Sound toggle */}
          <div className="flex items-center justify-between bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="font-bold text-white block">Phát âm giọng đọc tự động:</span>
                <span className="text-[11px] text-slate-400">Tự động đọc Hán tự khi xuất hiện câu hỏi mới</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.soundEnabled}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, soundEnabled: e.target.checked })
              }
              className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Lưu & Áp Dụng
          </button>
        </div>
      </div>
    </div>
  );
};
