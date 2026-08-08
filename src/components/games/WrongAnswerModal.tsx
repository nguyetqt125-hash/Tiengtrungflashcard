import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Volume2, ArrowRight, Lightbulb, BookOpen } from 'lucide-react';
import { Flashcard } from '../../types';
import { speakChinese } from '../../utils/speech';

interface WrongAnswerModalProps {
  card: Flashcard;
  userSelectedText?: string;
  correctAnswerText: string;
  onNext: () => void;
}

export const WrongAnswerModal: React.FC<WrongAnswerModalProps> = ({
  card,
  userSelectedText,
  correctAnswerText,
  onNext,
}) => {
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 border border-red-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-slate-100 relative overflow-hidden"
      >
        {/* Top Warning Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl border border-red-500/30 shrink-0">
            <AlertCircle className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-red-400">Trả Lời Chưa Chính Xác!</h3>
            <p className="text-xs text-slate-400">Dưới đây là chi tiết đáp án đúng để bạn ghi nhớ:</p>
          </div>
        </div>

        {/* Selected vs Correct Comparison */}
        <div className="space-y-2.5 text-xs">
          {userSelectedText && (
            <div className="bg-red-950/40 border border-red-900/60 p-3 rounded-xl flex items-start gap-2 text-red-300">
              <span className="font-bold text-red-400 shrink-0">Đã chọn sai:</span>
              <span className="line-through opacity-80 font-chinese text-base font-bold">{userSelectedText}</span>
            </div>
          )}

          <div className="bg-emerald-950/50 border border-emerald-800/80 p-3.5 rounded-2xl flex items-center justify-between text-emerald-200 shadow-inner">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Đáp án chính xác:
                </span>
                <span className="text-xl sm:text-2xl font-black text-white font-chinese">{correctAnswerText}</span>
              </div>
            </div>
            <button
              onClick={() => speakChinese(card.term)}
              className="p-2 bg-emerald-800/40 hover:bg-emerald-700/60 text-emerald-300 rounded-xl transition-colors cursor-pointer"
              title="Nghe phát âm"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Complete Card Knowledge Detail Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Thông tin chi tiết từ vựng:
            </span>
            <button
              onClick={() => speakChinese(card.term)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Đọc mẫu</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-semibold">Chữ Hán:</span>
              <span className="text-3xl sm:text-4xl font-black text-amber-300 font-chinese">{card.term}</span>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block font-semibold">Pinyin:</span>
              <span className="text-base font-bold text-indigo-300 font-mono">{card.pinyin || '—'}</span>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 sm:col-span-2">
              <span className="text-[10px] text-slate-500 block font-semibold">Nghĩa tiếng Việt:</span>
              <span className="text-sm font-bold text-white">{card.definition}</span>
            </div>
          </div>

          {card.example && (
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-500 block font-semibold">Ví dụ mẫu:</span>
              <p className="text-sm sm:text-base text-slate-200 font-semibold italic mt-0.5 font-chinese">{card.example}</p>
            </div>
          )}

          {card.memoryTip && (
            <div className="bg-amber-950/30 border border-amber-900/50 p-2.5 rounded-xl text-xs flex items-start gap-2 text-amber-200">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300 block text-[10px]">Mẹo ghi nhớ:</span>
                <span>{card.memoryTip}</span>
              </div>
            </div>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={onNext}
          className="w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <span>Đã hiểu, Tiếp tục ván đấu</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};
