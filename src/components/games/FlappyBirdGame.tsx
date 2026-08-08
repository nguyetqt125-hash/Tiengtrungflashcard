import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  Trophy,
  Heart,
  HeartOff,
  Gift,
  Zap,
  RotateCw,
  Flame,
  Send,
  Feather,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Flashcard } from '../../types';
import { speakChinese } from '../../utils/speech';
import { recordCardReview } from '../../utils/srs';
import { GameCustomSettings, QuestionField } from './GameSettingsModal';
import { WrongAnswerModal } from './WrongAnswerModal';

interface FlappyBirdGameProps {
  cards: Flashcard[];
  settings: GameCustomSettings;
  onFinish: (score: number, seconds: number) => void;
}

interface QuestionRound {
  card: Flashcard;
  qType: QuestionField;
  promptText: string;
  correctOptionText: string;
  options: string[];
  mode?: 'choice' | 'typing';
}

export const FlappyBirdGame: React.FC<FlappyBirdGameProps> = ({
  cards,
  settings,
  onFinish,
}) => {
  const [pool, setPool] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hp, setHp] = useState(3);
  const [seconds, setSeconds] = useState(0);

  // Game Status: 'idle' | 'flying' | 'question' | 'wrong_modal' | 'game_over' | 'victory'
  const [gameState, setGameState] = useState<'idle' | 'flying' | 'question' | 'wrong_modal' | 'game_over' | 'victory'>('idle');

  // Bird physics
  const [birdY, setBirdY] = useState(50); // percentage 0 - 100
  const [velocity, setVelocity] = useState(0);
  const [isFlapping, setIsFlapping] = useState(false);

  // Flight progress towards next gift checkpoint (0 to 100%)
  const [flightProgress, setFlightProgress] = useState(0);

  // Typing or option answer input
  const [typedInput, setTypedInput] = useState('');

  const [activeQuestion, setActiveQuestion] = useState<QuestionRound | null>(null);
  const [wrongCardShow, setWrongCardShow] = useState<{
    card: Flashcard;
    userSelectedText: string;
    correctText: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize questions pool
  useEffect(() => {
    const totalCount = Math.min(cards.length, settings.questionCount);
    const shuffled = [...cards].sort(() => 0.5 - Math.random()).slice(0, totalCount);
    setPool(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setCombo(0);
    setHp(3);
    setSeconds(0);
    setBirdY(45);
    setVelocity(0);
    setFlightProgress(0);
    setGameState('idle');
    if (shuffled.length > 0) {
      prepareQuestion(0, shuffled);
    }
  }, [cards, settings]);

  // Game timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Jump Sound
  const playJumpSound = useCallback(() => {
    if (settings.soundEnabled === false) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignore audio errors
    }
  }, [settings.soundEnabled]);

  // Web Audio Collect Gift Sound
  const playGiftSound = useCallback(() => {
    if (settings.soundEnabled === false) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.3);
    } catch {
      // Ignore audio errors
    }
  }, [settings.soundEnabled]);

  const prepareQuestion = (index: number, currentPool: Flashcard[]) => {
    if (index >= currentPool.length) return;
    const card = currentPool[index];

    // Pick Question Field
    const qTypeOptions = settings.questionTypes.length > 0 ? settings.questionTypes : ['term'];
    const qType = qTypeOptions[Math.floor(Math.random() * qTypeOptions.length)];

    let promptText = card.term;
    if (qType === 'definition') promptText = card.definition;
    else if (qType === 'pinyin') promptText = card.pinyin || card.term;

    // Pick Answer Field
    const aTypeOptions = settings.answerTypes.length > 0 ? settings.answerTypes : ['definition'];
    const aType = aTypeOptions[Math.floor(Math.random() * aTypeOptions.length)];

    const getAnswerText = (c: Flashcard) => {
      if (aType === 'term') return c.term;
      if (aType === 'pinyin') return c.pinyin || c.term;
      return c.definition;
    };

    const correctOptionText = getAnswerText(card);

    // Generate 3 wrong distractors
    const otherCards = cards.filter((c) => c.id !== card.id);
    const shuffledOthers = [...otherCards].sort(() => 0.5 - Math.random());
    const distractors: string[] = [];
    for (const other of shuffledOthers) {
      const txt = getAnswerText(other);
      if (txt !== correctOptionText && !distractors.includes(txt)) {
        distractors.push(txt);
      }
      if (distractors.length >= 3) break;
    }

    const options = [...distractors, correctOptionText].sort(() => 0.5 - Math.random());

    const roundMode: 'choice' | 'typing' =
      settings.answerMode === 'both'
        ? Math.random() < 0.5 ? 'choice' : 'typing'
        : settings.answerMode === 'typing' ? 'typing' : 'choice';

    setActiveQuestion({
      card,
      qType,
      promptText,
      correctOptionText,
      options,
      mode: roundMode,
    });
    setTypedInput('');
  };

  // Jump / Flap Wings action
  const flapWings = useCallback(() => {
    if (gameState === 'idle') {
      setGameState('flying');
    }
    if (gameState === 'idle' || gameState === 'flying') {
      setVelocity(-7.5);
      setIsFlapping(true);
      playJumpSound();
      setTimeout(() => setIsFlapping(false), 150);
    }
  }, [gameState, playJumpSound]);

  // Keyboard controls for Space & Tab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Tab') {
        // Prevent scrolling and default tab focus movement in game mode
        e.preventDefault();
        flapWings();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [flapWings]);

  // Main Flight Physics Loop
  useEffect(() => {
    if (gameState !== 'flying') return;

    const gravity = 0.42;
    const interval = setInterval(() => {
      // Apply gravity
      setBirdY((prevY) => {
        const nextVelocity = velocity + gravity;
        setVelocity(nextVelocity);
        let nextY = prevY + nextVelocity * 0.45;

        // Ground / Ceiling bounds
        if (nextY < 5) {
          nextY = 5;
          setVelocity(1);
        } else if (nextY > 88) {
          nextY = 88;
          // Auto bounce off soft grass ground
          setVelocity(-5);
        }

        return nextY;
      });

      // Advance flight progress towards next gift box
      setFlightProgress((prev) => {
        const next = prev + 1.2; // Speed of flight
        if (next >= 100) {
          // Reached Gift Checkpoint! Pause flight & open question
          setGameState('question');
          playGiftSound();
          return 0;
        }
        return next;
      });
    }, 24);

    return () => clearInterval(interval);
  }, [gameState, velocity, playGiftSound]);

  // Handle Question Answer Submission
  const handleAnswer = (selectedText: string) => {
    if (!activeQuestion) return;

    const isCorrect =
      selectedText.trim().toLowerCase() === activeQuestion.correctOptionText.trim().toLowerCase() ||
      (activeQuestion.card.pinyin &&
        selectedText.trim().toLowerCase() === activeQuestion.card.pinyin.trim().toLowerCase()) ||
      selectedText.trim().toLowerCase() === activeQuestion.card.term.trim().toLowerCase() ||
      selectedText.trim().toLowerCase() === activeQuestion.card.definition.trim().toLowerCase();

    if (isCorrect) {
      recordCardReview(activeQuestion.card.id, true);
      const newCombo = combo + 1;
      const earned = 100 + newCombo * 20;
      setScore((s) => s + earned);
      setCombo(newCombo);

      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.6 },
      });

      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);

      if (nextIdx >= pool.length) {
        setGameState('victory');
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      } else {
        prepareQuestion(nextIdx, pool);
        // Resume flight with boost upward!
        setVelocity(-8);
        setGameState('flying');
      }
    } else {
      recordCardReview(activeQuestion.card.id, false);
      setCombo(0);
      const nextHp = hp - 1;
      setHp(nextHp);

      setWrongCardShow({
        card: activeQuestion.card,
        userSelectedText: selectedText,
        correctText: activeQuestion.correctOptionText,
      });
      setGameState('wrong_modal');
    }
  };

  const handleWrongModalNext = () => {
    setWrongCardShow(null);
    if (hp <= 0) {
      setGameState('game_over');
    } else {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (nextIdx >= pool.length) {
        setGameState('victory');
      } else {
        prepareQuestion(nextIdx, pool);
        setVelocity(-6);
        setGameState('flying');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-4 animate-in fade-in duration-200">
      {/* Top Header Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-slate-100 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
            <Feather className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-vietnamese">
              Chim Bay Nhận Quà (Flappy Bird) • Hộp Quà {currentIndex + 1}/{pool.length}
            </span>
            <h2 className="text-base sm:text-lg font-black text-white font-vietnamese">
              Hán Ngữ Flappy Bird
            </h2>
          </div>
        </div>

        {/* Lives & Score */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-950 border border-rose-900 px-3.5 py-1.5 rounded-xl text-rose-400 font-bold flex items-center gap-1.5 shadow-lg">
            {[1, 2, 3].map((i) => (
              <span key={i}>
                {i <= hp ? (
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
                ) : (
                  <HeartOff className="w-4 h-4 text-slate-600" />
                )}
              </span>
            ))}
            <span className="text-[11px] text-rose-200 font-extrabold ml-1 font-vietnamese">{hp} Mạng</span>
          </div>

          <div className="bg-amber-950/90 border border-amber-700 px-3.5 py-1.5 rounded-xl text-amber-200 font-bold flex items-center gap-2 shadow-lg font-vietnamese">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{score} Điểm</span>
          </div>

          {combo > 1 && (
            <div className="hidden sm:flex items-center gap-1 text-amber-400 font-black bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl font-vietnamese">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Combo x{combo}!</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Flappy Bird Flight Screen Canvas */}
      <div
        ref={containerRef}
        onClick={flapWings}
        className="relative w-full h-[420px] bg-gradient-to-b from-sky-900 via-indigo-950 to-slate-950 rounded-3xl border-2 border-indigo-500/40 p-4 overflow-hidden shadow-2xl cursor-pointer select-none flex flex-col justify-between"
      >
        {/* Parallax Background Clouds & Decorative Mountains */}
        <div className="absolute inset-0 pointer-events-none opacity-25 flex justify-between items-start p-6">
          <div className="text-5xl animate-pulse">☁️</div>
          <div className="text-6xl">⛩️</div>
          <div className="text-5xl animate-pulse">☁️</div>
        </div>

        {/* Top Flight Progress Bar */}
        <div className="relative z-10 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between gap-3 text-xs font-vietnamese">
          <div className="flex items-center gap-2 text-indigo-300 font-bold shrink-0">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Tiến trình bay đến Hộp Quà:</span>
          </div>
          <div className="flex-1 h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-amber-400 transition-all duration-75"
              style={{ width: `${flightProgress}%` }}
            />
          </div>
          <span className="text-xs font-black text-amber-300 shrink-0">
            {Math.round(flightProgress)}%
          </span>
        </div>

        {/* Animated Flying Bird Sprite */}
        <div
          className="absolute z-20 left-[20%] transition-transform duration-75 flex items-center justify-center pointer-events-none"
          style={{
            top: `${birdY}%`,
            transform: `translate(-50%, -50%) rotate(${Math.min(Math.max(velocity * 3.5, -25), 60)}deg)`,
          }}
        >
          <div className="relative">
            {/* Flapping Wing Aura Effect */}
            <div
              className={`w-14 h-14 bg-amber-400/30 rounded-full blur-md absolute -inset-1 ${
                isFlapping ? 'scale-125 opacity-80' : 'opacity-40'
              }`}
            />
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-amber-200 rounded-2xl shadow-xl flex items-center justify-center text-slate-950 text-2xl font-bold">
              🐤
            </div>
            {/* Wing Indicator */}
            <div
              className={`absolute -left-2 top-3 text-xs transition-transform ${
                isFlapping ? '-rotate-45 scale-125' : 'rotate-12'
              }`}
            >
              🪶
            </div>
          </div>
        </div>

        {/* Floating Gift Box Checkpoint Node on Flight Path */}
        <div
          className="absolute z-20 transition-all duration-75 flex flex-col items-center pointer-events-none"
          style={{
            left: `${100 - flightProgress * 0.8}%`,
            top: '42%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="relative group">
            <div className="w-16 h-16 bg-gradient-to-tr from-rose-600 to-amber-400 rounded-2xl border-2 border-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-bounce flex items-center justify-center text-3xl">
              🎁
            </div>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-amber-300 bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-amber-500/40 whitespace-nowrap font-vietnamese">
              Hộp Quà Từ Vựng #{currentIndex + 1}
            </span>
          </div>
        </div>

        {/* Soft Grass Ground Line */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-emerald-900 to-emerald-800 border-t-2 border-emerald-500/60 flex items-center justify-center">
          <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest opacity-70 font-vietnamese">
            🍃 Bấm Space / Tab / Click Màn Hình Để Vỗ Cánh Bay Lên 🍃
          </span>
        </div>

        {/* Overlay 1: Idle Start Banner */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
            <div className="p-4 bg-amber-500/20 border-2 border-amber-400 rounded-3xl">
              <Feather className="w-10 h-10 text-amber-400 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-vietnamese">
                Sẵn Sàng Bay Nhận Quà?
              </h3>
              <p className="text-xs text-slate-300 max-w-md mt-1 leading-relaxed font-vietnamese">
                Nhiệm vụ: Bấm phím <strong className="text-amber-300">Space</strong>, <strong className="text-amber-300">Tab</strong> hoặc <strong className="text-amber-300">Nhấp Chuột / Cảm Ứng</strong> để giữ chú chim bay lượn và chạm tới các <strong className="text-amber-300">Hộp Quà Từ Vựng</strong>!
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                flapWings();
              }}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-2xl shadow-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95 font-vietnamese"
            >
              <span>🚀 Nhấn Để Bắt Đầu Phân Cảnh Bay</span>
            </button>
          </div>
        )}

        {/* Overlay 2: Question Modal Reached Gift Box */}
        {gameState === 'question' && activeQuestion && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95"
          >
            <div className="bg-slate-900 border-2 border-amber-400/80 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                    <Gift className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block font-vietnamese">
                      Mở Hộp Quà #{currentIndex + 1}/{pool.length}
                    </span>
                    <h4 className="text-xs text-slate-300 font-vietnamese">
                      Trả lời chính xác để nhận điểm thưởng & tiếp tục bay!
                    </h4>
                  </div>
                </div>
              </div>

              {/* Question Prompt */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-vietnamese">
                  Đề bài câu hỏi từ vựng:
                </span>
                <div className="flex items-center justify-center gap-2">
                  <h3
                    className={`text-2xl sm:text-3xl font-black text-amber-200 ${
                      activeQuestion.qType === 'term' ? 'font-chinese' : 'font-vietnamese'
                    }`}
                  >
                    {activeQuestion.promptText}
                  </h3>
                  <button
                    onClick={() => speakChinese(activeQuestion.card.term)}
                    className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                {settings.showHint !== false && activeQuestion.card.memoryTip && (
                  <p className="text-[11px] text-amber-300/90 italic bg-amber-950/40 p-2 rounded-xl border border-amber-800/40 font-vietnamese">
                    💡 Gợi ý: {activeQuestion.card.memoryTip}
                  </p>
                )}
              </div>

              {/* Multiple Choice Options vs Typing Form */}
              {activeQuestion.mode === 'typing' ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAnswer(typedInput);
                  }}
                  className="space-y-3"
                >
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      placeholder="Nhập Chữ Hán, Pinyin hoặc Tiếng Việt..."
                      className="w-full py-3.5 px-4 pr-12 bg-slate-950 border-2 border-amber-500/60 focus:border-amber-400 text-white font-bold text-base sm:text-xl rounded-xl outline-none focus:ring-4 focus:ring-amber-500/20 font-chinese"
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAnswer(opt)}
                      className="p-3.5 bg-slate-950 hover:bg-slate-800 border-2 border-slate-800 hover:border-amber-400 text-white font-bold text-sm sm:text-base rounded-2xl transition-all flex items-center gap-2.5 text-left cursor-pointer active:scale-98 group"
                    >
                      <span className="w-7 h-7 bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 rounded-lg font-bold text-xs flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="line-clamp-2 font-chinese text-base sm:text-lg font-bold">{opt}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overlay 3: Game Over Screen */}
        {gameState === 'game_over' && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 text-center animate-in zoom-in-95 font-vietnamese"
          >
            <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-6 space-y-4 text-slate-100 shadow-2xl">
              <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30 flex items-center justify-center mx-auto">
                <HeartOff className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-rose-400">Kết Thúc Chuyến Bay!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Bạn đã kiệt sức trên hành trình. Hãy thử lại để đạt điểm cao hơn nhé!
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-around text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Tổng Điểm:</span>
                  <span className="text-lg font-black text-amber-400">{score} điểm</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Thời gian:</span>
                  <span className="text-lg font-black text-indigo-400">{seconds}s</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const totalCount = Math.min(cards.length, settings.questionCount);
                    const shuffled = [...cards].sort(() => 0.5 - Math.random()).slice(0, totalCount);
                    setPool(shuffled);
                    setCurrentIndex(0);
                    setScore(0);
                    setCombo(0);
                    setHp(3);
                    setBirdY(45);
                    setVelocity(0);
                    setFlightProgress(0);
                    setGameState('idle');
                    if (shuffled.length > 0) prepareQuestion(0, shuffled);
                  }}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Bay Lại Từ Đầu</span>
                </button>
                <button
                  onClick={() => onFinish(score, seconds)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Kết Thúc Game
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overlay 4: Victory Win Screen */}
        {gameState === 'victory' && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 text-center animate-in zoom-in-95 font-vietnamese"
          >
            <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 space-y-4 text-slate-100 shadow-2xl">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-emerald-400">🏆 Hoàn Thành Xuất Sắc!</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Chúc mừng bạn đã xuất sắc vượt qua toàn bộ các Hộp Quà Từ Vựng!
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-around text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Tổng Điểm:</span>
                  <span className="text-lg font-black text-amber-400">{score} điểm</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Thời gian:</span>
                  <span className="text-lg font-black text-indigo-400">{seconds}s</span>
                </div>
              </div>

              <button
                onClick={() => onFinish(score, seconds)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs rounded-xl shadow-xl transition-all cursor-pointer"
              >
                Nhận Phần Thưởng & Quay Về Trung Tâm Game
              </button>
            </div>
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
