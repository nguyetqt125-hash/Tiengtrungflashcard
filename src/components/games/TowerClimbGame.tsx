import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Castle, Volume2, Trophy, ArrowUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { Flashcard } from '../../types';
import { speakChinese } from '../../utils/speech';
import { recordCardReview } from '../../utils/srs';
import { GameCustomSettings, QuestionField } from './GameSettingsModal';
import { WrongAnswerModal } from './WrongAnswerModal';

interface TowerClimbGameProps {
  cards: Flashcard[];
  settings: GameCustomSettings;
  onFinish: (score: number, seconds: number) => void;
}

export const TowerClimbGame: React.FC<TowerClimbGameProps> = ({
  cards,
  settings,
  onFinish,
}) => {
  const [pool, setPool] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [towerFloors, setTowerFloors] = useState<{ id: number; term: string; pinyin: string }[]>([]);

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

  useEffect(() => {
    const totalCount = Math.min(cards.length, settings.questionCount);
    const shuffled = [...cards].sort(() => 0.5 - Math.random()).slice(0, totalCount);
    setPool(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setSeconds(0);
    setTowerFloors([]);
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
    else if (qType === 'audio') promptText = '🔊 Nghe âm thanh & Xây tháp';

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

    // Generate 3 distractors
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
      setScore((s) => s + 200);
      speakChinese(activeQuestion.card.term);

      // Stack a floor onto tower
      setTowerFloors((prev) => [
        {
          id: currentIndex + 1,
          term: activeQuestion.card.term,
          pinyin: activeQuestion.card.pinyin || '',
        },
        ...prev,
      ]);

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

  return (
    <div className="relative w-full h-[78vh] min-h-[500px] bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/40 rounded-3xl border border-slate-800 p-4 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Bar Header */}
      <div className="z-10 bg-slate-900/90 border border-slate-800 backdrop-blur p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl">
            <Castle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
              Tháp Chữ Hán (Độ cao: {towerFloors.length} Tầng)
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white font-serif">
                {activeQuestion?.promptText}
              </h2>
              <button
                onClick={() => speakChinese(activeQuestion?.card.term || '')}
                className="p-1.5 bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Nghe phát âm"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-amber-950/80 border border-amber-800 px-3.5 py-1.5 rounded-xl text-amber-200 font-bold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{score} điểm</span>
          </div>
        </div>
      </div>

      {/* Main Tower Visualization & Options Stack */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 my-3 overflow-hidden">
        {/* Left Side: Pagoda Tower Stack */}
        <div className="bg-slate-950/80 rounded-2xl border border-slate-800/80 p-4 flex flex-col items-center justify-end overflow-y-auto relative min-h-[220px]">
          <div className="absolute top-3 left-3 text-[10px] font-bold text-amber-400/80 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tháp Hán Tự Đã Xây:</span>
          </div>

          <div className="w-full max-w-xs space-y-2 flex flex-col items-center">
            <AnimatePresence>
              {towerFloors.map((floor) => (
                <motion.div
                  key={floor.id}
                  initial={{ y: -40, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  className="w-full bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 border-2 border-amber-400/60 rounded-xl p-2.5 text-center text-white shadow-lg flex items-center justify-between px-4 relative overflow-hidden"
                >
                  <span className="px-2 py-0.5 bg-amber-950 text-amber-300 text-[10px] font-extrabold rounded-lg border border-amber-600/50">
                    Tầng {floor.id}
                  </span>
                  <span className="text-base font-black font-serif text-amber-100">{floor.term}</span>
                  <span className="text-xs font-bold text-amber-200/80 font-mono">{floor.pinyin}</span>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Base of Pagoda */}
            <div className="w-full h-8 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-t-2 border-slate-600 rounded-t-xl text-center text-[10px] font-bold text-slate-400 flex items-center justify-center">
              🏛️ Nền Móng Tháp Cổ
            </div>
          </div>
        </div>

        {/* Right Side: Multiple Choice Bricks */}
        <div className="flex flex-col justify-center space-y-3">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <ArrowUp className="w-4 h-4 text-amber-400" />
            <span>Chọn đúng gạch đá để đặt lên tầng tháp tiếp theo:</span>
          </span>

          <div className="grid grid-cols-1 gap-2.5">
            {activeQuestion?.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleOptionClick(opt)}
                className="w-full p-4 bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-between text-left group cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center transition-colors border border-amber-500/30">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </div>
                <Sparkles className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </button>
            ))}
          </div>
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
