import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, Volume2, Trophy, Brain, Sparkles, Send } from 'lucide-react';
import { Flashcard } from '../../types';
import { speakChinese } from '../../utils/speech';
import { recordCardReview } from '../../utils/srs';
import { GameCustomSettings, QuestionField } from './GameSettingsModal';
import { WrongAnswerModal } from './WrongAnswerModal';

interface SpeedQuizGameProps {
  cards: Flashcard[];
  settings: GameCustomSettings;
  onFinish: (score: number, seconds: number) => void;
}

export const SpeedQuizGame: React.FC<SpeedQuizGameProps> = ({
  cards,
  settings,
  onFinish,
}) => {
  const [pool, setPool] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const [activeQuestion, setActiveQuestion] = useState<{
    card: Flashcard;
    qType: QuestionField;
    promptText: string;
    correctOptionText: string;
    options: string[];
  } | null>(null);

  const [typedInput, setTypedInput] = useState('');

  const [wrongCardShow, setWrongCardShow] = useState<{
    card: Flashcard;
    userSelectedText: string;
    correctText: string;
  } | null>(null);

  useEffect(() => {
    const totalCount = Math.min(cards.length, settings.questionCount);
    const shuffled = [...cards].sort(() => 0.5 - Math.random()).slice(0, totalCount);
    setPool(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setSeconds(0);
    generateRound(0, shuffled);
  }, [cards, settings]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const generateRound = (index: number, currentPool: Flashcard[]) => {
    if (index >= currentPool.length) {
      onFinish(score, seconds);
      return;
    }

    const currentCard = currentPool[index];

    // Pick question prompt type from settings.questionTypes
    const validQTypes = settings.questionTypes.length > 0 ? settings.questionTypes : ['term' as QuestionField];
    const qType = validQTypes[Math.floor(Math.random() * validQTypes.length)];

    let promptText = '';
    if (qType === 'term') promptText = currentCard.term;
    else if (qType === 'pinyin') promptText = currentCard.pinyin || currentCard.term;
    else if (qType === 'definition') promptText = currentCard.definition;
    else if (qType === 'audio') promptText = '🔊 Bấm nghe & Chọn nhanh';

    if (settings.soundEnabled || qType === 'audio') {
      speakChinese(currentCard.term);
    }

    // Pick answer option type from settings.answerTypes EXCLUDING qType
    const nonMatchingAnswers = settings.answerTypes.filter((a) => a !== qType);
    const aType = nonMatchingAnswers.length > 0
      ? nonMatchingAnswers[Math.floor(Math.random() * nonMatchingAnswers.length)]
      : (qType === 'term' ? 'definition' : 'term');

    const getAnswerText = (c: Flashcard, type: QuestionField): string => {
      if (type === 'term') return c.term;
      if (type === 'pinyin') return c.pinyin || c.term;
      if (type === 'definition') return c.definition;
      return `🔊 ${c.term}`;
    };

    const correctOptionText = getAnswerText(currentCard, aType);

    const distractorCards = cards
      .filter((c) => c.id !== currentCard.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const allOptions = [currentCard, ...distractorCards]
      .map((c) => getAnswerText(c, aType))
      .sort(() => 0.5 - Math.random());

    setTypedInput('');
    setActiveQuestion({
      card: currentCard,
      qType,
      promptText,
      correctOptionText,
      options: allOptions,
    });
  };

  const checkTypedAnswer = (input: string, card: Flashcard): boolean => {
    const cleanInput = input.trim().toLowerCase();
    if (!cleanInput) return false;

    const cleanTerm = card.term.trim().toLowerCase();
    if (cleanInput === cleanTerm) return true;

    if (card.pinyin) {
      const cleanPinyin = card.pinyin.trim().toLowerCase();
      const asciiPinyin = cleanPinyin.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
      const asciiInput = cleanInput.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
      if (cleanInput === cleanPinyin || asciiInput === asciiPinyin) return true;
    }

    const cleanDef = card.definition.trim().toLowerCase();
    if (cleanInput === cleanDef) return true;

    return false;
  };

  const handleTypingSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeQuestion) return;

    const isRight = checkTypedAnswer(typedInput, activeQuestion.card);
    recordCardReview(activeQuestion.card.id, isRight);

    if (isRight) {
      setScore((s) => s + 200);
      speakChinese(activeQuestion.card.term);

      setTimeout(() => {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        generateRound(nextIdx, pool);
      }, 400);
    } else {
      setWrongCardShow({
        card: activeQuestion.card,
        userSelectedText: typedInput || '(Chưa nhập gì)',
        correctText: `${activeQuestion.card.term} (${activeQuestion.card.pinyin || ''}) - ${activeQuestion.card.definition}`,
      });
    }
  };

  const handleOptionClick = (optionText: string) => {
    if (!activeQuestion) return;

    const isRight = optionText === activeQuestion.correctOptionText;
    recordCardReview(activeQuestion.card.id, isRight);

    if (isRight) {
      setScore((s) => s + 150);
      speakChinese(activeQuestion.card.term);

      setTimeout(() => {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        generateRound(nextIdx, pool);
      }, 400);
    } else {
      setWrongCardShow({
        card: activeQuestion.card,
        userSelectedText: optionText,
        correctText: activeQuestion.correctOptionText,
      });
    }
  };

  const handleWrongModalNext = () => {
    setWrongCardShow(null);
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    generateRound(nextIdx, pool);
  };

  return (
    <div className="relative w-full h-[78vh] min-h-[500px] bg-slate-950 rounded-3xl border border-slate-800 p-4 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Bar Header */}
      <div className="z-10 bg-slate-900/90 border border-slate-800 backdrop-blur p-4 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
              Trắc Nghiệm Phản Xạ Nhanh (Câu {currentIndex + 1}/{pool.length})
            </span>
            <h2 className="text-base font-bold text-white">Chọn đáp án chính xác nhất trong thời gian ngắn nhất</h2>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-xl text-slate-300 font-bold text-xs flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{score} điểm</span>
        </div>
      </div>

      {/* Center Question Prompt Card */}
      <div className="my-auto max-w-xl mx-auto w-full space-y-6">
        <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-8 text-center shadow-2xl relative">
          <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest block mb-1">
            Đề bài câu hỏi:
          </span>
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-3xl font-black text-white font-serif">{activeQuestion?.promptText}</h3>
            <button
              onClick={() => speakChinese(activeQuestion?.card.term || '')}
              className="p-2 bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Input Options / Typing Form */}
        {settings.answerMode === 'typing' ? (
          <form onSubmit={handleTypingSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Nhập Chữ Hán, Pinyin hoặc Tiếng Việt..."
                className="w-full py-4 px-5 pr-14 bg-slate-900 border-2 border-amber-500/60 focus:border-amber-400 text-white font-bold text-base sm:text-lg rounded-2xl shadow-xl outline-none focus:ring-4 focus:ring-amber-500/20 placeholder:text-slate-500 placeholder:text-xs sm:placeholder:text-sm font-serif"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer active:scale-95"
                title="Gửi đáp án (Nút Enter)"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
              <span>⌨️ Nhấn <strong>Enter</strong> để kiểm tra kết quả</span>
              <span>Chấp nhận: Chữ Hán, Pinyin hoặc Tiếng Việt</span>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeQuestion?.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleOptionClick(opt)}
                className="p-4 bg-slate-900 hover:bg-slate-800 border-2 border-slate-800 hover:border-amber-400 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center gap-3 cursor-pointer group active:scale-98"
              >
                <span className="w-7 h-7 bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center transition-colors">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Wrong Answer Explanation Popup Modal */}
      {wrongCardShow && (
        <WrongAnswerModal
          card={wrongCardShow.card}
          userSelectedText={wrongCardShow.userSelectedText}
          correctAnswerText={wrongCardShow.correctText}
          onNext={handleWrongModalNext}
        />
      )}
    </div>
  );
};
