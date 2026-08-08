import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Crown, Volume2, Trophy, Milestone, Sparkles, Scroll, Heart, HeartOff, Swords, Flame, Send } from 'lucide-react';
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
  const [hp, setHp] = useState(3); // 3 Hearts HP

  // Animation states: 'running' | 'attacking' | 'hurt' | 'victory'
  const [heroState, setHeroState] = useState<'running' | 'attacking' | 'hurt' | 'victory'>('running');
  const [typedInput, setTypedInput] = useState('');

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

  const obstacles = ['⛩️ Cổng Cổ Trấn', '👹 Quái Tướng Khắc', '🧱 Chướng Ngại Đá', '🐉 Môn Phái Rồng', '⚔️ Trấn Môn Tướng'];

  useEffect(() => {
    const totalCount = Math.min(cards.length, settings.questionCount);
    const shuffled = [...cards].sort(() => 0.5 - Math.random()).slice(0, totalCount);
    setPool(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setSeconds(0);
    setHp(3);
    setHeroState('running');
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
      setHeroState('victory');
      setTimeout(() => onFinish(score, seconds), 1000);
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

    setTypedInput('');
    setHeroState('running');

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

  const handleCorrectAnswer = () => {
    setHeroState('attacking');
    setScore((s) => s + 250);
    if (activeQuestion) speakChinese(activeQuestion.card.term);

    setTimeout(() => {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      generateRound(nextIdx, pool);
    }, 700);
  };

  const handleWrongAnswer = (userText: string) => {
    setHeroState('hurt');
    setHp((prevHp) => Math.max(0, prevHp - 1));

    setTimeout(() => {
      if (activeQuestion) {
        setWrongCardShow({
          card: activeQuestion.card,
          userSelectedText: userText || '(Chưa nhập gì)',
          correctText: `${activeQuestion.card.term} (${activeQuestion.card.pinyin || ''}) - ${activeQuestion.card.definition}`,
        });
      }
    }, 400);
  };

  const handleTypingSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeQuestion) return;

    const isRight = checkTypedAnswer(typedInput, activeQuestion.card);
    recordCardReview(activeQuestion.card.id, isRight);

    if (isRight) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer(typedInput);
    }
  };

  const handleOptionClick = (optionText: string) => {
    if (!activeQuestion) return;

    const isRight = optionText === activeQuestion.correctOptionText;
    recordCardReview(activeQuestion.card.id, isRight);

    if (isRight) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer(optionText);
    }
  };

  const handleWrongModalNext = () => {
    setWrongCardShow(null);
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    generateRound(nextIdx, pool);
  };

  const currentGateTitle = gateNames[currentIndex % gateNames.length];
  const currentObstacleIcon = obstacles[currentIndex % obstacles.length];

  return (
    <div className={`relative w-full h-[78vh] min-h-[500px] bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/60 rounded-3xl border border-rose-900/60 p-4 flex flex-col justify-between overflow-hidden select-none ${heroState === 'hurt' ? 'animate-shake' : ''}`}>
      {/* Red Hurt Screen Flash */}
      {heroState === 'hurt' && (
        <div className="absolute inset-0 z-40 bg-red-600/30 backdrop-blur-xs pointer-events-none animate-pulse" />
      )}

      {/* Top Bar Header */}
      <div className="z-10 bg-slate-900/90 border border-amber-900/50 backdrop-blur p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl">
            <Crown className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block flex items-center gap-1">
              <Milestone className="w-3.5 h-3.5" />
              {currentGateTitle} (Ải {currentIndex + 1}/{pool.length})
            </span>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-black text-amber-200 ${activeQuestion?.questionField === 'term' ? 'font-chinese' : 'font-vietnamese'}`}>
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
          {/* Health Hearts */}
          <div className="bg-slate-950 border border-rose-900 px-3.5 py-1.5 rounded-xl text-rose-400 font-bold flex items-center gap-1.5 shadow-lg">
            {[1, 2, 3].map((heartIndex) => (
              <span key={heartIndex}>
                {heartIndex <= hp ? (
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
                ) : (
                  <HeartOff className="w-4 h-4 text-slate-600" />
                )}
              </span>
            ))}
            <span className="text-[11px] text-rose-200 font-extrabold ml-1">{hp * 33}% Máu</span>
          </div>

          <div className="bg-amber-950/90 border border-amber-700 px-3.5 py-1.5 rounded-xl text-amber-200 font-bold flex items-center gap-2 shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{score} Công Lực</span>
          </div>
        </div>
      </div>

      {/* Mario / Wuxia Runner Stage Canvas */}
      <div className="relative flex-1 my-3 bg-gradient-to-b from-slate-900/80 via-amber-950/20 to-amber-950/80 rounded-2xl border border-amber-900/40 p-4 flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Background Scrolling Clouds & Pagodas */}
        <div className="absolute inset-0 opacity-20 pointer-events-none flex justify-between items-start p-6">
          <div className="text-6xl animate-pulse">☁️</div>
          <div className="text-7xl">⛩️</div>
          <div className="text-6xl animate-pulse">☁️</div>
        </div>

        {/* Question Bubble floating above the obstacle */}
        <div className="z-10 max-w-lg mx-auto w-full text-center">
          <div className="bg-slate-950/90 border-2 border-amber-500/60 rounded-2xl p-3 shadow-2xl backdrop-blur relative">
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">
              📜 Thử Thách Vượt Ải Chướng Ngại
            </span>
            <span className={`text-base sm:text-lg font-black text-white ${activeQuestion?.qType === 'term' || activeQuestion?.qType === 'audio' ? 'font-chinese' : 'font-vietnamese'}`}>
              "{activeQuestion?.promptText}"
            </span>
            {settings.showHint !== false && activeQuestion?.card.memoryTip && (
              <span className="text-[11px] text-amber-300/90 block mt-1 italic">
                💡 Gợi ý: {activeQuestion.card.memoryTip}
              </span>
            )}
          </div>
        </div>

        {/* Mario Runner Track Floor with Hero & Obstacle */}
        <div className="relative w-full h-32 border-b-4 border-amber-800 bg-amber-950/40 flex items-end justify-between px-8 sm:px-16 overflow-hidden rounded-b-xl">
          {/* Ground Brick Texture */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 border-t border-amber-700 opacity-80" />

          {/* Running Hero Avatar (Mario Wuxia Style) */}
          <motion.div
            animate={
              heroState === 'attacking'
                ? { x: [0, 120, 0], y: [0, -40, 0], rotate: [0, 20, 0] }
                : heroState === 'hurt'
                ? { x: [0, -20, 0], opacity: [1, 0.4, 1] }
                : { y: [0, -6, 0] }
            }
            transition={{
              duration: heroState === 'attacking' ? 0.6 : 0.4,
              repeat: heroState === 'running' ? Infinity : 0,
            }}
            className="z-10 flex flex-col items-center mb-2"
          >
            {/* Kungfu Hero Emoji & Attack Trail */}
            <div className="relative text-5xl sm:text-6xl filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
              {heroState === 'attacking' ? '🤺' : heroState === 'hurt' ? '😵' : '🥷'}
              {heroState === 'attacking' && (
                <span className="absolute -right-6 top-0 text-3xl animate-ping text-amber-400">⚡⚔️</span>
              )}
            </div>
            <span className="text-[10px] font-black text-amber-300 bg-slate-900/80 px-2 py-0.5 rounded-full border border-amber-500/40 mt-1">
              Hiệp Khách
            </span>
          </motion.div>

          {/* Scrolling Gate / Enemy Obstacle */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="z-10 flex flex-col items-center mb-2"
          >
            <div className="text-5xl sm:text-6xl filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
              {currentObstacleIcon.split(' ')[0]}
            </div>
            <span className="text-[10px] font-black text-rose-300 bg-slate-900/80 px-2 py-0.5 rounded-full border border-rose-500/40 mt-1">
              {currentObstacleIcon.split(' ').slice(1).join(' ')}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Answer Area: Typing vs Choice */}
      <div className="z-10 max-w-2xl mx-auto w-full">
        {settings.answerMode === 'typing' ? (
          <form onSubmit={handleTypingSubmit} className="space-y-2">
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Gõ Chữ Hán, Pinyin hoặc Tiếng Việt để vượt ải..."
                className="w-full py-4 px-5 pr-14 bg-slate-900/95 border-2 border-amber-500/60 focus:border-amber-400 text-white font-bold text-base sm:text-lg rounded-2xl shadow-xl outline-none focus:ring-4 focus:ring-amber-500/20 placeholder:text-slate-500 placeholder:text-xs font-serif"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-slate-950 font-black rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer active:scale-95"
                title="Gửi đáp án (Enter)"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-amber-200/80 px-2">
              <span>⌨️ Nhấn <strong>Enter</strong> để tung chưởng vượt ải!</span>
              <span>Chấp nhận: Chữ Hán, Pinyin hoặc Tiếng Việt</span>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activeQuestion?.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleOptionClick(opt)}
                className="p-3.5 bg-slate-900/90 hover:bg-amber-950/80 border-2 border-amber-800/60 hover:border-amber-400 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xl transition-all flex items-center justify-between text-left group cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 bg-amber-600/20 text-amber-300 group-hover:bg-amber-500 group-hover:text-slate-950 rounded-xl font-extrabold text-xs flex items-center justify-center transition-colors border border-amber-500/40">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="group-hover:text-amber-200 transition-colors font-chinese">{opt}</span>
                </div>
                <Shield className="w-4 h-4 text-amber-600/60 group-hover:text-amber-400 transition-colors" />
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

