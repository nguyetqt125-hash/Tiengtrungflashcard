import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Crown, Volume2, Trophy, Milestone, Sparkles, Scroll } from 'lucide-react';
import { Flashcard } from '../../types';
import { speakChinese } from '../../utils/speech';
import { recordCardReview } from '../../utils/srs';
import { GameCustomSettings, QuestionField } from './GameSettingsModal';
import { WrongAnswerModal } from './WrongAnswerModal';

interface WuxiaAdventureGameProps {
  cards: Flashcard[];
  settings: GameCustomSettings;
  onFinish: (score: number, seconds: number) => void;
}

export const WuxiaAdventureGame: React.FC<WuxiaAdventureGameProps> = ({
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

  const [wrongCardShow, setWrongCardShow] = useState<{
    card: Flashcard;
    userSelectedText: string;
    correctText: string;
  } | null>(null);

  const gateNames = [
    'Ải 1: Cổng Nam Thiên Môn',
    'Ải 2: Tàng Kinh Cát Thiếu Lâm',
    'Ải 3: Võ Lâm Trấn Môn',
    'Ải 4: Tử Cấm Thanh Điện',
    'Ải 5: Ngai Vàng Hoàng Gia',
  ];

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
    else if (qType === 'audio') promptText = '🔊 Bấm nghe Lệnh Mật Vượt Ải';

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

    setActiveQuestion({
      card: currentCard,
      qType,
      promptText,
      correctOptionText,
      options: allOptions,
    });
  };

  const handleOptionClick = (optionText: string) => {
    if (!activeQuestion) return;

    const isRight = optionText === activeQuestion.correctOptionText;
    recordCardReview(activeQuestion.card.id, isRight);

    if (isRight) {
      setScore((s) => s + 250);
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

  const currentGateTitle = gateNames[currentIndex % gateNames.length];

  return (
    <div className="relative w-full h-[78vh] min-h-[500px] bg-gradient-to-b from-red-950 via-slate-950 to-amber-950 rounded-3xl border border-rose-900/60 p-4 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Bar Header */}
      <div className="z-10 bg-slate-900/90 border border-amber-900/50 backdrop-blur p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl">
            <Crown className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block flex items-center gap-1">
              <Milestone className="w-3.5 h-3.5" />
              {currentGateTitle} (Thử thách {currentIndex + 1}/{pool.length})
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-amber-200 font-serif">
                {activeQuestion?.promptText}
              </h2>
              <button
                onClick={() => speakChinese(activeQuestion?.card.term || '')}
                className="p-1.5 bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Nghe lệnh mật"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-amber-950/90 border border-amber-700 px-3.5 py-1.5 rounded-xl text-amber-200 font-bold flex items-center gap-2 shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{score} Công Lực</span>
          </div>
        </div>
      </div>

      {/* Ancient Gate Pass Visual Banner */}
      <div className="my-auto max-w-2xl mx-auto w-full space-y-5">
        <div className="bg-gradient-to-r from-amber-950/80 via-red-950/90 to-amber-950/80 border-2 border-amber-500/50 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-2 right-3 text-[10px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1 opacity-80">
            <Scroll className="w-3.5 h-3.5" />
            Võ Lâm Mật Lệnh
          </div>

          <span className="text-xs font-extrabold text-amber-300 uppercase tracking-widest block mb-1">
            ⛩️ Mật Lệnh Cổng Tướng
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-white font-serif tracking-wide drop-shadow-md">
            "{activeQuestion?.promptText}"
          </h3>
        </div>

        {/* Answer Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeQuestion?.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleOptionClick(opt)}
              className="p-4 bg-slate-900/90 hover:bg-amber-950/80 border-2 border-amber-800/60 hover:border-amber-400 text-white font-bold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-between text-left group cursor-pointer active:scale-98"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-amber-600/20 text-amber-300 group-hover:bg-amber-500 group-hover:text-slate-950 rounded-xl font-extrabold text-xs flex items-center justify-center transition-colors border border-amber-500/40">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="group-hover:text-amber-200 transition-colors">{opt}</span>
              </div>
              <Shield className="w-4 h-4 text-amber-600/60 group-hover:text-amber-400 transition-colors" />
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
