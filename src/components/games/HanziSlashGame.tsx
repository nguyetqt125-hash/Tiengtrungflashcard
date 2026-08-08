import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Volume2, Sparkles, Flame, RefreshCw, Trophy } from 'lucide-react';
import { Flashcard } from '../../types';
import { speakChinese } from '../../utils/speech';
import { recordCardReview } from '../../utils/srs';
import { GameCustomSettings, QuestionField } from './GameSettingsModal';
import { WrongAnswerModal } from './WrongAnswerModal';

interface FloatingTarget {
  id: string;
  card: Flashcard;
  optionText: string;
  optionType: QuestionField;
  isCorrect: boolean;
  xPct: number; // 10% to 80%
  yPct: number; // 10% to 80%
  speedX: number;
  speedY: number;
  scale: number;
  colorBg: string;
}

interface HanziSlashGameProps {
  cards: Flashcard[];
  settings: GameCustomSettings;
  onFinish: (score: number, seconds: number) => void;
}

export const HanziSlashGame: React.FC<HanziSlashGameProps> = ({
  cards,
  settings,
  onFinish,
}) => {
  const [pool, setPool] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<{
    card: Flashcard;
    qType: QuestionField;
    promptText: string;
    correctAnswerText: string;
  } | null>(null);

  const [targets, setTargets] = useState<FloatingTarget[]>([]);
  const [wrongCardShow, setWrongCardShow] = useState<{
    card: Flashcard;
    userSelectedText: string;
    correctText: string;
  } | null>(null);

  const [slashEffect, setSlashEffect] = useState<{ x: number; y: number } | null>(null);

  // Initialize pool
  useEffect(() => {
    const totalCount = Math.min(cards.length, settings.questionCount);
    const shuffled = [...cards].sort(() => 0.5 - Math.random()).slice(0, totalCount);
    setPool(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setCombo(0);
    setSeconds(0);
    generateRound(0, shuffled);
  }, [cards, settings]);

  // Game timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Floating movement loop
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setTargets((prevTargets) =>
        prevTargets.map((t) => {
          let newX = t.xPct + t.speedX;
          let newY = t.yPct + t.speedY;
          let newSpeedX = t.speedX;
          let newSpeedY = t.speedY;

          if (newX < 10 || newX > 82) newSpeedX = -newSpeedX;
          if (newY < 15 || newY > 75) newSpeedY = -newSpeedY;

          return {
            ...t,
            xPct: Math.max(10, Math.min(82, newX)),
            yPct: Math.max(15, Math.min(75, newY)),
            speedX: newSpeedX,
            speedY: newSpeedY,
          };
        })
      );
    }, 60);

    return () => clearInterval(moveInterval);
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
    else if (qType === 'audio') promptText = '🔊 Bấm nghe & chém đáp án đúng';

    // Auto play audio if enabled or qType === 'audio'
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

    const correctAnswerText = getAnswerText(currentCard, aType);

    setActiveQuestion({
      card: currentCard,
      qType,
      promptText,
      correctAnswerText,
    });

    // Generate 3 or 4 floating targets
    const distractorCards = cards
      .filter((c) => c.id !== currentCard.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const allCardsInRound = [currentCard, ...distractorCards].sort(() => 0.5 - Math.random());

    const bgGradients = [
      'from-rose-500 to-red-600',
      'from-indigo-500 to-purple-600',
      'from-amber-500 to-orange-600',
      'from-emerald-500 to-teal-600',
    ];

    const newTargets: FloatingTarget[] = allCardsInRound.map((c, i) => {
      const isCorrect = c.id === currentCard.id;
      return {
        id: `target-${index}-${c.id}-${i}`,
        card: c,
        optionText: getAnswerText(c, aType),
        optionType: aType,
        isCorrect,
        xPct: 15 + (i % 2) * 45 + (Math.random() * 10 - 5),
        yPct: 20 + Math.floor(i / 2) * 30 + (Math.random() * 10 - 5),
        speedX: (Math.random() - 0.5) * 1.2,
        speedY: (Math.random() - 0.5) * 1.2,
        scale: 1,
        colorBg: bgGradients[i % bgGradients.length],
      };
    });

    setTargets(newTargets);
  };

  const handleSlashTarget = (target: FloatingTarget, e: React.MouseEvent) => {
    // Record slash line animation position
    const rect = e.currentTarget.getBoundingClientRect();
    setSlashEffect({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setTimeout(() => setSlashEffect(null), 400);

    const isRight = target.isCorrect;
    recordCardReview(activeQuestion!.card.id, isRight);

    if (isRight) {
      const addedPoints = 150 + combo * 30;
      setScore((s) => s + addedPoints);
      setCombo((c) => c + 1);
      speakChinese(target.card.term);

      // Move to next target
      setTimeout(() => {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        generateRound(nextIdx, pool);
      }, 500);
    } else {
      setCombo(0);
      setWrongCardShow({
        card: activeQuestion!.card,
        userSelectedText: target.optionText,
        correctText: activeQuestion!.correctAnswerText,
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
      {/* Ninja Slash Trail Visual FX overlay */}
      {slashEffect && (
        <div
          className="fixed pointer-events-none z-50 w-24 h-2 bg-gradient-to-r from-cyan-400 via-white to-amber-300 blur-2xs rounded-full shadow-[0_0_20px_#38bdf8] animate-ping"
          style={{ left: slashEffect.x - 48, top: slashEffect.y - 4 }}
        />
      )}

      {/* Top Bar: Round & Prompt */}
      <div className="z-10 bg-slate-900/90 border border-slate-800 backdrop-blur p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl">
            <Swords className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Chém Chữ Hán (Câu {currentIndex + 1}/{pool.length})
            </span>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-black text-amber-300 ${activeQuestion?.questionField === 'term' ? 'font-chinese' : 'font-vietnamese'}`}>
                {activeQuestion?.promptText}
              </h2>
              <button
                onClick={() => speakChinese(activeQuestion?.card.term || '')}
                className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Nghe phát âm"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {combo > 1 && (
            <div className="flex items-center gap-1 text-amber-400 font-black bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl animate-bounce">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Combo x{combo}!</span>
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-xl text-slate-300 font-bold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{score} điểm</span>
          </div>
        </div>
      </div>

      {/* Main Slash Game Arena with Floating Targets */}
      <div className="relative flex-1 w-full h-full my-2">
        <AnimatePresence>
          {targets.map((t) => (
            <motion.div
              key={t.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{
                left: `${t.xPct}%`,
                top: `${t.yPct}%`,
              }}
              className="absolute transition-transform duration-75 cursor-pointer touch-none"
              onClick={(e) => handleSlashTarget(t, e)}
            >
              <div
                className={`px-5 py-4 bg-gradient-to-br ${t.colorBg} border-2 border-white/40 shadow-2xl rounded-3xl flex flex-col items-center justify-center text-center hover:scale-110 active:scale-90 transition-all group hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-white/80">
                  <Swords className="w-4 h-4 text-white group-hover:rotate-45 transition-transform" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest">Chém</span>
                </div>

                <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md font-chinese">
                  {t.optionText}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom Slash Instructions */}
      <div className="z-10 text-center text-xs text-slate-400 bg-slate-900/60 py-2.5 px-4 rounded-xl border border-slate-800/80">
        ⚔️ <strong>Hướng dẫn:</strong> Nhấp hoặc vuốt nhanh (chém) vào bóng chứa đáp án chính xác ứng với đề bài bên trên!
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
