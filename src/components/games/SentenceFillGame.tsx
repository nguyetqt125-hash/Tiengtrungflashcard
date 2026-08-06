import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Volume2, Trophy, HelpCircle, CheckCircle2, Sparkles, Send } from 'lucide-react';
import { Flashcard } from '../../types';
import { speakChinese } from '../../utils/speech';
import { recordCardReview } from '../../utils/srs';
import { GameCustomSettings } from './GameSettingsModal';
import { WrongAnswerModal } from './WrongAnswerModal';

interface SentenceFillGameProps {
  cards: Flashcard[];
  settings: GameCustomSettings;
  onFinish: (score: number, seconds: number) => void;
}

export const SentenceFillGame: React.FC<SentenceFillGameProps> = ({
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
    sentenceWithBlank: string;
    translation?: string;
    correctTerm: string;
    options: string[];
  } | null>(null);

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
    const targetTerm = currentCard.term;

    let sentenceWithBlank = '';
    let translation = '';

    if (currentCard.example && currentCard.example.includes(targetTerm)) {
      sentenceWithBlank = currentCard.example.replace(targetTerm, ' [ ___ ] ');
      translation = `Nghĩa của từ: ${currentCard.definition}`;
    } else if (currentCard.example) {
      sentenceWithBlank = `Ví dụ: ${currentCard.example} ➔ [ ___ ] (${currentCard.pinyin || ''})`;
      translation = `Định nghĩa: ${currentCard.definition}`;
    } else {
      sentenceWithBlank = `Từ nào có nghĩa là "${currentCard.definition}"? [ ___ ] (${currentCard.pinyin || 'pinyin'})`;
      translation = `Nghĩa tiếng Việt: ${currentCard.definition}`;
    }

    if (settings.soundEnabled) {
      speakChinese(currentCard.term);
    }

    // Distractor terms
    const distractorCards = cards
      .filter((c) => c.id !== currentCard.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const options = [currentCard.term, ...distractorCards.map((c) => c.term)].sort(
      () => 0.5 - Math.random()
    );

    setActiveQuestion({
      card: currentCard,
      sentenceWithBlank,
      translation,
      correctTerm: targetTerm,
      options,
    });
  };

  const handleOptionClick = (optionText: string) => {
    if (!activeQuestion) return;

    const isRight = optionText === activeQuestion.correctTerm;
    recordCardReview(activeQuestion.card.id, isRight);

    if (isRight) {
      setScore((s) => s + 200);
      speakChinese(activeQuestion.card.term);

      setTimeout(() => {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        generateRound(nextIdx, pool);
      }, 500);
    } else {
      setWrongCardShow({
        card: activeQuestion.card,
        userSelectedText: optionText,
        correctText: activeQuestion.correctTerm,
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
      <div className="z-10 bg-slate-900/90 border border-slate-800 backdrop-blur p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
              Điền Từ Vào Câu (Câu {currentIndex + 1}/{pool.length})
            </span>
            <h2 className="text-base font-bold text-white">
              Chọn từ còn thiếu phù hợp nhất để hoàn thành câu
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-indigo-950/80 border border-indigo-800 px-3.5 py-1.5 rounded-xl text-indigo-200 font-bold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{score} điểm</span>
          </div>
        </div>
      </div>

      {/* Sentence Calligraphy Display Board */}
      <div className="my-auto max-w-2xl mx-auto w-full space-y-6">
        <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4 border-b border-slate-800 pb-2">
            <span className="font-bold text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Câu ví dụ minh họa:
            </span>
            <button
              onClick={() => speakChinese(activeQuestion?.card.term || '')}
              className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg transition-colors font-bold flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>Phát âm từ</span>
            </button>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-amber-200 font-serif leading-relaxed tracking-wide">
            {activeQuestion?.sentenceWithBlank}
          </h3>

          {activeQuestion?.translation && (
            <p className="text-xs text-slate-400 mt-4 italic bg-slate-950 p-3 rounded-2xl border border-slate-800">
              💡 {activeQuestion.translation}
            </p>
          )}
        </div>

        {/* Word Options Grid */}
        <div className="grid grid-cols-2 gap-3">
          {activeQuestion?.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleOptionClick(opt)}
              className="p-4 bg-slate-900 hover:bg-indigo-950/80 border-2 border-slate-800 hover:border-indigo-400 text-white font-black text-lg font-serif rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
            >
              <span className="text-amber-300 group-hover:scale-110 transition-transform">{opt}</span>
            </button>
          ))}
        </div>
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
