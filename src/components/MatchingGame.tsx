import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  RotateCw,
  Trophy,
  Gamepad2,
  Timer,
  Sparkles,
  CheckCircle2,
  Settings,
  X,
  Volume2,
  Zap,
  Grid,
  Brain,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Flashcard, Lesson } from '../types';
import { speakChinese } from '../utils/speech';
import { recordCardReview } from '../utils/srs';

export type GameType = 'matching' | 'speed_pinyin' | 'reflex' | 'hanzi_quiz' | null;

interface Tile {
  id: string;
  cardId: string;
  type: 'term' | 'meaning';
  text: string;
  subtext?: string;
  isMatched: boolean;
  isSelected: boolean;
  isWrong: boolean;
}

interface MatchingGameProps {
  lesson: Lesson;
  cards: Flashcard[];
  onClose: () => void;
}

export const MatchingGame: React.FC<MatchingGameProps> = ({ lesson, cards, onClose }) => {
  const [activeGameType, setActiveGameType] = useState<GameType>(null); // null = Game Hub Selection
  const [activeSettingsModal, setActiveSettingsModal] = useState<'matching' | 'speed_pinyin' | 'reflex' | 'hanzi_quiz' | null>(null);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  // Dedicated Settings for Game 1: Matching
  const [matchingSettings, setMatchingSettings] = useState({
    pairCount: 8,
    soundEnabled: true,
  });

  // Dedicated Settings for Game 2: Speed Pinyin
  const [pinyinSettings, setPinyinSettings] = useState({
    questionCount: 10,
    optionCount: 4,
    soundEnabled: true,
  });

  // Dedicated Settings for Game 3: Meaning Reflex
  const [reflexSettings, setReflexSettings] = useState({
    questionCount: 10,
    showPinyinHint: true,
    soundEnabled: true,
  });

  // Dedicated Settings for Game 4: Trắc Nghiệm Hán Tự & Pinyin
  const [hanziQuizSettings, setHanziQuizSettings] = useState({
    questionCount: 10,
    displayMode: 'mixed' as 'hanzi_to_pinyin' | 'pinyin_to_hanzi' | 'mixed',
    optionCount: 4,
    showMeaningHint: true,
    soundEnabled: true,
  });

  // Common Game Progress State
  const [score, setScore] = useState(0);
  const [secondsSpent, setSecondsSpent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Game 1 State
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [matchesCount, setMatchesCount] = useState(0);

  // Game 2, 3, 4 Common State
  const [activeQuizPool, setActiveQuizPool] = useState<Flashcard[]>([]);
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Game 4 Specific Question State
  const [hanziQuizQuestion, setHanziQuizQuestion] = useState<{
    promptText: string;
    promptSubtext?: string;
    promptType: 'hanzi' | 'pinyin';
    correctOption: string;
    options: string[];
    card: Flashcard;
  } | null>(null);

  // Start specific game
  const startGame = (type: GameType) => {
    setActiveGameType(type);
    setScore(0);
    setSecondsSpent(0);
    setIsPlaying(true);
    setIsCompleted(false);
    setSelectedAnswer(null);

    if (type === 'matching') {
      const maxPairs = Math.min(cards.length, matchingSettings.pairCount);
      const selectedCards = [...cards].sort(() => 0.5 - Math.random()).slice(0, maxPairs);

      const generatedTiles: Tile[] = [];
      selectedCards.forEach((card, idx) => {
        generatedTiles.push({
          id: `tile-term-${idx}-${card.id}`,
          cardId: card.id,
          type: 'term',
          text: card.term,
          subtext: card.pinyin,
          isMatched: false,
          isSelected: false,
          isWrong: false,
        });

        generatedTiles.push({
          id: `tile-meaning-${idx}-${card.id}`,
          cardId: card.id,
          type: 'meaning',
          text: card.definition,
          isMatched: false,
          isSelected: false,
          isWrong: false,
        });
      });
      setTiles(generatedTiles.sort(() => 0.5 - Math.random()));
      setMatchesCount(0);
      setSelectedTile(null);
    } else if (type === 'speed_pinyin') {
      const maxCount = Math.min(cards.length, pinyinSettings.questionCount);
      const pool = [...cards].sort(() => 0.5 - Math.random()).slice(0, maxCount);
      setActiveQuizPool(pool);
      setQuizQuestionIndex(0);
      generateQuizQuestion(0, pool, 'speed_pinyin');
    } else if (type === 'reflex') {
      const maxCount = Math.min(cards.length, reflexSettings.questionCount);
      const pool = [...cards].sort(() => 0.5 - Math.random()).slice(0, maxCount);
      setActiveQuizPool(pool);
      setQuizQuestionIndex(0);
      generateQuizQuestion(0, pool, 'reflex');
    } else if (type === 'hanzi_quiz') {
      const maxCount = Math.min(cards.length, hanziQuizSettings.questionCount);
      const pool = [...cards].sort(() => 0.5 - Math.random()).slice(0, maxCount);
      setActiveQuizPool(pool);
      setQuizQuestionIndex(0);
      generateHanziQuizQuestion(0, pool);
    }
  };

  const generateQuizQuestion = (idx: number, pool: Flashcard[], gameMode: 'speed_pinyin' | 'reflex') => {
    if (idx >= pool.length) {
      setIsCompleted(true);
      setIsPlaying(false);
      triggerWinConfetti();
      return;
    }
    const current = pool[idx];
    const otherCards = pool.filter((c) => c.id !== current.id);
    const distractorCount = (gameMode === 'speed_pinyin' ? pinyinSettings.optionCount : 4) - 1;
    const distractors = otherCards.sort(() => 0.5 - Math.random()).slice(0, distractorCount);

    let options: string[] = [];
    if (gameMode === 'speed_pinyin') {
      options = [current.pinyin || current.term, ...distractors.map((d) => d.pinyin || d.term)];
    } else {
      options = [current.definition, ...distractors.map((d) => d.definition)];
    }

    setQuizOptions(options.sort(() => 0.5 - Math.random()));
    setSelectedAnswer(null);

    const sound = gameMode === 'speed_pinyin' ? pinyinSettings.soundEnabled : reflexSettings.soundEnabled;
    if (sound) speakChinese(current.term);
  };

  const generateHanziQuizQuestion = (idx: number, pool: Flashcard[]) => {
    if (idx >= pool.length) {
      setIsCompleted(true);
      setIsPlaying(false);
      triggerWinConfetti();
      return;
    }
    const currentCard = pool[idx];
    const mode =
      hanziQuizSettings.displayMode === 'mixed'
        ? Math.random() > 0.5
          ? 'hanzi_to_pinyin'
          : 'pinyin_to_hanzi'
        : hanziQuizSettings.displayMode;

    let promptText = '';
    let promptType: 'hanzi' | 'pinyin' = 'hanzi';
    let correctAnswer = '';

    if (mode === 'hanzi_to_pinyin') {
      promptText = currentCard.term;
      promptType = 'hanzi';
      correctAnswer = currentCard.pinyin || currentCard.term;
    } else {
      promptText = currentCard.pinyin || currentCard.term;
      promptType = 'pinyin';
      correctAnswer = currentCard.term;
    }

    const otherCards = cards.filter((c) => c.id !== currentCard.id);
    const distractorCount = Math.max(1, hanziQuizSettings.optionCount - 1);
    const shuffledOthers = [...otherCards].sort(() => 0.5 - Math.random()).slice(0, distractorCount);

    let distractorValues: string[] = [];
    if (mode === 'hanzi_to_pinyin') {
      distractorValues = shuffledOthers.map((c) => c.pinyin || c.term);
    } else {
      distractorValues = shuffledOthers.map((c) => c.term);
    }

    const optionsSet = new Set<string>([correctAnswer]);
    distractorValues.forEach((val) => {
      if (val) optionsSet.add(val);
    });

    const finalOptions = Array.from(optionsSet).sort(() => 0.5 - Math.random());

    setHanziQuizQuestion({
      promptText,
      promptSubtext: hanziQuizSettings.showMeaningHint ? currentCard.definition : undefined,
      promptType,
      correctOption: correctAnswer,
      options: finalOptions,
      card: currentCard,
    });

    setSelectedAnswer(null);

    if (hanziQuizSettings.soundEnabled) {
      speakChinese(currentCard.term);
    }
  };

  const triggerWinConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  };

  const handleTileClick = (clickedTile: Tile) => {
    if (clickedTile.isMatched || clickedTile.isSelected || clickedTile.isWrong) return;

    if (matchingSettings.soundEnabled && clickedTile.type === 'term') {
      speakChinese(clickedTile.text);
    }

    if (!selectedTile) {
      setSelectedTile(clickedTile);
      setTiles((prev) => prev.map((t) => (t.id === clickedTile.id ? { ...t, isSelected: true } : t)));
      return;
    }

    if (selectedTile.id === clickedTile.id) return;

    if (selectedTile.cardId === clickedTile.cardId) {
      setTiles((prev) =>
        prev.map((t) =>
          t.cardId === clickedTile.cardId ? { ...t, isMatched: true, isSelected: false } : t
        )
      );
      setSelectedTile(null);
      setMatchesCount((prev) => {
        const nextCount = prev + 1;
        const totalPairsNeeded = Math.min(cards.length, matchingSettings.pairCount);
        if (nextCount >= totalPairsNeeded) {
          setIsCompleted(true);
          setIsPlaying(false);
          triggerWinConfetti();
        }
        return nextCount;
      });
      setScore((prev) => prev + 100);
      recordCardReview(clickedTile.cardId, true);
    } else {
      setTiles((prev) =>
        prev.map((t) =>
          t.id === clickedTile.id || t.id === selectedTile.id
            ? { ...t, isSelected: true, isWrong: true }
            : t
        )
      );
      recordCardReview(clickedTile.cardId, false);
      recordCardReview(selectedTile.cardId, false);
      setTimeout(() => {
        setTiles((prev) =>
          prev.map((t) =>
            t.id === clickedTile.id || t.id === selectedTile.id
              ? { ...t, isSelected: false, isWrong: false }
              : t
          )
        );
        setSelectedTile(null);
      }, 700);
    }
  };

  const handleAnswerClick = (option: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(option);

    const currentCard = activeQuizPool[quizQuestionIndex];
    if (!currentCard) return;

    const correctAnswer =
      activeGameType === 'speed_pinyin'
        ? currentCard.pinyin || currentCard.term
        : currentCard.definition;

    const isRight = option === correctAnswer;
    recordCardReview(currentCard.id, isRight);

    if (isRight) {
      setScore((prev) => prev + 120);
      setTimeout(() => {
        const nextIdx = quizQuestionIndex + 1;
        setQuizQuestionIndex(nextIdx);
        generateQuizQuestion(nextIdx, activeQuizPool, activeGameType as any);
      }, 700);
    } else {
      setTimeout(() => {
        const nextIdx = quizQuestionIndex + 1;
        setQuizQuestionIndex(nextIdx);
        generateQuizQuestion(nextIdx, activeQuizPool, activeGameType as any);
      }, 1000);
    }
  };

  const handleHanziQuizAnswerClick = (option: string) => {
    if (selectedAnswer !== null || !hanziQuizQuestion) return;
    setSelectedAnswer(option);

    const isRight = option === hanziQuizQuestion.correctOption;
    recordCardReview(hanziQuizQuestion.card.id, isRight);

    if (isRight) {
      setScore((prev) => prev + 150);
      setTimeout(() => {
        const nextIdx = quizQuestionIndex + 1;
        setQuizQuestionIndex(nextIdx);
        generateHanziQuizQuestion(nextIdx, activeQuizPool);
      }, 700);
    } else {
      setTimeout(() => {
        const nextIdx = quizQuestionIndex + 1;
        setQuizQuestionIndex(nextIdx);
        generateHanziQuizQuestion(nextIdx, activeQuizPool);
      }, 1000);
    }
  };

  // Render Game Hub when activeGameType is null
  if (activeGameType === null) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-y-auto">
        {/* Hub Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10 backdrop-blur">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Thoát Trò Chơi</span>
          </button>

          <div className="text-center">
            <h1 className="text-base font-extrabold text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-indigo-400" />
              <span>Trung Tâm Trò Chơi Ôn Tập</span>
            </h1>
            <p className="text-xs text-slate-400">Bài học: {lesson.name} ({cards.length} từ vựng)</p>
          </div>

          <div className="w-24" />
        </div>

        {/* 4 Games Grid */}
        <div className="max-w-5xl mx-auto w-full p-6 space-y-8 my-auto">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30">
              4 Chế Độ Trò Chơi Biến Hóa
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Chọn Trò Chơi Bạn Muốn Luyện Tập</h2>
            <p className="text-xs text-slate-400">Mỗi trò chơi được thiết kế riêng giúp bạn ghi nhớ sâu từ vựng, Pinyin và nghĩa tiếng Việt.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Game 1: Matching Pairs */}
            <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3.5 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30 group-hover:scale-110 transition-transform">
                    <Grid className="w-7 h-7" />
                  </div>
                  <button
                    onClick={() => setActiveSettingsModal('matching')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-indigo-400" />
                    <span>Cài Đặt</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">1. Ghép Thẻ Nối Từ (Matching)</h3>
                  <p className="text-xs text-slate-400 mt-1">Lật và ghép các thẻ Hán tự với Định nghĩa tiếng Việt tương ứng trên lưới bàn chơi.</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Số cặp từ: <strong className="text-indigo-300">{matchingSettings.pairCount} cặp</strong></span>
                  <span>Âm thanh: <strong className="text-indigo-300">{matchingSettings.soundEnabled ? 'Bật' : 'Tắt'}</strong></span>
                </div>
              </div>

              <button
                onClick={() => startGame('matching')}
                className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Bắt Đầu Ghép Thẻ</span>
              </button>
            </div>

            {/* Game 2: Speed Pinyin */}
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3.5 bg-amber-600/20 text-amber-400 rounded-2xl border border-amber-500/30 group-hover:scale-110 transition-transform">
                    <Zap className="w-7 h-7" />
                  </div>
                  <button
                    onClick={() => setActiveSettingsModal('speed_pinyin')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-amber-400" />
                    <span>Cài Đặt</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">2. Chọn Pinyin Nhanh (Speed Quiz)</h3>
                  <p className="text-xs text-slate-400 mt-1">Nhìn chữ Hán tự và phản xạ nhanh chọn đúng phiên âm Pinyin chính xác.</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Số câu: <strong className="text-amber-300">{pinyinSettings.questionCount} câu</strong></span>
                  <span>Số đáp án: <strong className="text-amber-300">{pinyinSettings.optionCount} lựa chọn</strong></span>
                </div>
              </div>

              <button
                onClick={() => startGame('speed_pinyin')}
                className="w-full mt-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Thử Thách Pinyin</span>
              </button>
            </div>

            {/* Game 3: Meaning Reflex */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3.5 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/30 group-hover:scale-110 transition-transform">
                    <Brain className="w-7 h-7" />
                  </div>
                  <button
                    onClick={() => setActiveSettingsModal('reflex')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span>Cài Đặt</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">3. Phản Xạ Tìm Nghĩa (Reflex)</h3>
                  <p className="text-xs text-slate-400 mt-1">Rèn luyện phản xạ dịch nghĩa tiếng Việt tức thì khi thấy mặt chữ tiếng Trung.</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Số câu: <strong className="text-emerald-300">{reflexSettings.questionCount} câu</strong></span>
                  <span>Gợi ý Pinyin: <strong className="text-emerald-300">{reflexSettings.showPinyinHint ? 'Bật' : 'Tắt'}</strong></span>
                </div>
              </div>

              <button
                onClick={() => startGame('reflex')}
                className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Brain className="w-4 h-4" />
                <span>Luyện Phản Xạ</span>
              </button>
            </div>

            {/* Game 4: Pinyin Scramble */}
            <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/60 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3.5 bg-purple-600/20 text-purple-400 rounded-2xl border border-purple-500/30 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <button
                    onClick={() => setActiveSettingsModal('scramble')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-purple-400" />
                    <span>Cài Đặt</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">4. Trắc Nghiệm Hán Tự & Pinyin</h3>
                  <p className="text-xs text-slate-400 mt-1">Hiển thị Hán tự hoặc Pinyin ở trên và chọn nhanh đáp án Pinyin hoặc Hán tự chính xác ở dưới.</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Số câu: <strong className="text-purple-300">{hanziQuizSettings.questionCount} câu</strong></span>
                  <span>Dạng: <strong className="text-purple-300">
                    {hanziQuizSettings.displayMode === 'hanzi_to_pinyin'
                      ? 'Hán ➔ Pinyin'
                      : hanziQuizSettings.displayMode === 'pinyin_to_hanzi'
                      ? 'Pinyin ➔ Hán'
                      : 'Xáo trộn'}
                  </strong></span>
                </div>
              </div>

              <button
                onClick={() => startGame('hanzi_quiz')}
                className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Bắt Đầu Trắc Nghiệm</span>
              </button>
            </div>
          </div>
        </div>

        {/* DEDICATED GAME SETTINGS MODALS */}
        {activeSettingsModal === 'matching' && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Grid className="w-5 h-5 text-indigo-400" />
                  <span>Cài Đặt: Ghép Thẻ Nối Từ</span>
                </div>
                <button onClick={() => setActiveSettingsModal(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-white block mb-1">Số lượng cặp thẻ trên bàn chơi:</label>
                  <select
                    value={matchingSettings.pairCount}
                    onChange={(e) => setMatchingSettings({ ...matchingSettings, pairCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value={4}>4 cặp (8 thẻ - Nhanh)</option>
                    <option value={8}>8 cặp (16 thẻ - Tiêu chuẩn)</option>
                    <option value={12}>12 cặp (24 thẻ - Thử thách)</option>
                    <option value={16}>16 cặp (32 thẻ - Chuyên gia)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                  <div>
                    <span className="font-bold text-white block">Âm thanh phát âm Hán tự:</span>
                    <span className="text-[11px] text-slate-400">Đọc tiếng Trung khi chạm vào thẻ từ</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={matchingSettings.soundEnabled}
                    onChange={(e) => setMatchingSettings({ ...matchingSettings, soundEnabled: e.target.checked })}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={() => setActiveSettingsModal(null)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Lưu Cài Đặt
              </button>
            </div>
          </div>
        )}

        {activeSettingsModal === 'speed_pinyin' && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>Cài Đặt: Chọn Pinyin Nhanh</span>
                </div>
                <button onClick={() => setActiveSettingsModal(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-white block mb-1">Số lượng câu hỏi trong mỗi ván:</label>
                  <select
                    value={pinyinSettings.questionCount}
                    onChange={(e) => setPinyinSettings({ ...pinyinSettings, questionCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value={5}>5 câu hỏi</option>
                    <option value={10}>10 câu hỏi</option>
                    <option value={15}>15 câu hỏi</option>
                    <option value={cards.length}>Tất cả từ vựng ({cards.length})</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-white block mb-1">Số lựa chọn đáp án Pinyin:</label>
                  <select
                    value={pinyinSettings.optionCount}
                    onChange={(e) => setPinyinSettings({ ...pinyinSettings, optionCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value={2}>2 đáp án (Dễ)</option>
                    <option value={4}>4 đáp án (Tiêu chuẩn)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                  <div>
                    <span className="font-bold text-white block">Tự động đọc Hán tự:</span>
                    <span className="text-[11px] text-slate-400">Phát âm khi bắt đầu mỗi câu</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={pinyinSettings.soundEnabled}
                    onChange={(e) => setPinyinSettings({ ...pinyinSettings, soundEnabled: e.target.checked })}
                    className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={() => setActiveSettingsModal(null)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Lưu Cài Đặt
              </button>
            </div>
          </div>
        )}

        {activeSettingsModal === 'reflex' && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Brain className="w-5 h-5 text-emerald-400" />
                  <span>Cài Đặt: Phản Xạ Tìm Nghĩa</span>
                </div>
                <button onClick={() => setActiveSettingsModal(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-white block mb-1">Số lượng câu hỏi trong mỗi ván:</label>
                  <select
                    value={reflexSettings.questionCount}
                    onChange={(e) => setReflexSettings({ ...reflexSettings, questionCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value={5}>5 câu hỏi</option>
                    <option value={10}>10 câu hỏi</option>
                    <option value={15}>15 câu hỏi</option>
                    <option value={cards.length}>Tất cả từ vựng ({cards.length})</option>
                  </select>
                </div>

                <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                  <div>
                    <span className="font-bold text-white block">Hiển thị Pinyin dưới Hán tự:</span>
                    <span className="text-[11px] text-slate-400">Gợi ý cách đọc để hỗ trợ phản xạ</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={reflexSettings.showPinyinHint}
                    onChange={(e) => setReflexSettings({ ...reflexSettings, showPinyinHint: e.target.checked })}
                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                  <div>
                    <span className="font-bold text-white block">Âm thanh giọng đọc:</span>
                    <span className="text-[11px] text-slate-400">Đọc tiếng Trung khi hiển thị câu</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={reflexSettings.soundEnabled}
                    onChange={(e) => setReflexSettings({ ...reflexSettings, soundEnabled: e.target.checked })}
                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={() => setActiveSettingsModal(null)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Lưu Cài Đặt
              </button>
            </div>
          </div>
        )}

        {activeSettingsModal === 'hanzi_quiz' && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span>Cài Đặt: Trắc Nghiệm Hán Tự & Pinyin</span>
                </div>
                <button onClick={() => setActiveSettingsModal(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-white block mb-1">Số lượng câu hỏi trong mỗi ván:</label>
                  <select
                    value={hanziQuizSettings.questionCount}
                    onChange={(e) => setHanziQuizSettings({ ...hanziQuizSettings, questionCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value={5}>5 câu hỏi</option>
                    <option value={10}>10 câu hỏi</option>
                    <option value={15}>15 câu hỏi</option>
                    <option value={cards.length}>Tất cả từ vựng ({cards.length})</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-white block mb-1">Chế độ trắc nghiệm:</label>
                  <select
                    value={hanziQuizSettings.displayMode}
                    onChange={(e) => setHanziQuizSettings({ ...hanziQuizSettings, displayMode: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="mixed">Xáo trộn (Hán ➔ Pinyin & Pinyin ➔ Hán)</option>
                    <option value="hanzi_to_pinyin">Cho Hán tự ➔ Chọn Pinyin</option>
                    <option value="pinyin_to_hanzi">Cho Pinyin ➔ Chọn Hán tự</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-white block mb-1">Số lượng đáp án lựa chọn:</label>
                  <select
                    value={hanziQuizSettings.optionCount}
                    onChange={(e) => setHanziQuizSettings({ ...hanziQuizSettings, optionCount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value={2}>2 đáp án (Dễ)</option>
                    <option value={4}>4 đáp án (Tiêu chuẩn)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                  <div>
                    <span className="font-bold text-white block">Hiển thị Nghĩa Tiếng Việt:</span>
                    <span className="text-[11px] text-slate-400">Gợi ý nghĩa từ bên dưới đề bài</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hanziQuizSettings.showMeaningHint}
                    onChange={(e) => setHanziQuizSettings({ ...hanziQuizSettings, showMeaningHint: e.target.checked })}
                    className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                  <div>
                    <span className="font-bold text-white block">Âm thanh phát âm:</span>
                    <span className="text-[11px] text-slate-400">Tự động đọc Hán tự khi bắt đầu câu</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hanziQuizSettings.soundEnabled}
                    onChange={(e) => setHanziQuizSettings({ ...hanziQuizSettings, soundEnabled: e.target.checked })}
                    className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={() => setActiveSettingsModal(null)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Lưu Cài Đặt
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active Game View Title
  const getGameTitle = () => {
    switch (activeGameType) {
      case 'matching':
        return '1. Ghép Thẻ Nối Từ';
      case 'speed_pinyin':
        return '2. Chọn Pinyin Nhanh';
      case 'reflex':
        return '3. Phản Xạ Tìm Nghĩa';
      case 'hanzi_quiz':
        return '4. Trắc Nghiệm Hán Tự & Pinyin';
      default:
        return 'Trò Chơi';
    }
  };

  const totalPairs =
    activeGameType === 'matching'
      ? Math.min(cards.length, matchingSettings.pairCount)
      : activeGameType === 'speed_pinyin'
      ? Math.min(cards.length, pinyinSettings.questionCount)
      : activeGameType === 'reflex'
      ? Math.min(cards.length, reflexSettings.questionCount)
      : Math.min(cards.length, hanziQuizSettings.questionCount);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-y-auto">
      {/* Active Game Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10 backdrop-blur">
        <button
          onClick={() => {
            if (isPlaying && !isCompleted) {
              setIsExitConfirmOpen(true);
            } else {
              setActiveGameType(null);
            }
          }}
          className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Về Hub Game</span>
        </button>

        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-indigo-300 hidden sm:inline-block">{getGameTitle()}</span>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            <Trophy className="w-4 h-4" />
            <span>Điểm: {score}</span>
          </div>

          <div className="flex items-center gap-2 text-indigo-300 font-mono text-sm bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
            <Timer className="w-4 h-4" />
            <span>{secondsSpent}s</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSettingsModal(activeGameType)}
            className="p-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 rounded-xl border border-indigo-500/40 transition-colors cursor-pointer"
            title="Cài đặt game này"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => startGame(activeGameType)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Chơi lại"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Active Game View */}
      {isCompleted ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-auto animate-in zoom-in-95 duration-300">
          <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-full mb-4 border border-emerald-500/30">
            <Trophy className="w-16 h-16" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">🏆 Thắng Cuộc Rực Rỡ!</h2>
          <p className="text-slate-300 text-sm mb-6">
            Bạn đã hoàn thành xuất sắc trò chơi <strong className="text-indigo-300">{getGameTitle()}</strong> trong bài <span className="text-indigo-300">"{lesson.name}"</span>.
          </p>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full mb-6 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Thời gian:</span>
              <span className="font-bold text-indigo-400 text-sm">{secondsSpent} giây</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Tổng số điểm:</span>
              <span className="font-bold text-amber-400 text-sm">{score} điểm</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => startGame(activeGameType)}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>Chơi lại</span>
            </button>
            <button
              onClick={() => setActiveGameType(null)}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Chọn Game Khác
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-4xl w-full mx-auto my-auto">
          {/* GAME 1: MATCHING PAIRS */}
          {activeGameType === 'matching' && (
            <div className="w-full space-y-4">
              <div className="text-center mb-2">
                <p className="text-xs text-slate-400">
                  Đã ghép chính xác: <strong className="text-emerald-400">{matchesCount}</strong> / {totalPairs} cặp
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 w-full">
                {tiles.map((tile) => {
                  if (tile.isMatched) {
                    return (
                      <div
                        key={tile.id}
                        className="h-24 sm:h-28 rounded-2xl border border-emerald-900/30 bg-emerald-950/20 opacity-30 flex items-center justify-center p-3"
                      >
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </div>
                    );
                  }

                  let stateClass = 'bg-slate-900 border-slate-800 hover:border-indigo-500/80 text-white';
                  if (tile.isWrong) {
                    stateClass = 'bg-rose-950 border-rose-600 text-rose-200 animate-shake';
                  } else if (tile.isSelected) {
                    stateClass =
                      'bg-indigo-900/80 border-indigo-500 text-white ring-2 ring-indigo-500 shadow-lg scale-102';
                  }

                  return (
                    <motion.button
                      key={tile.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleTileClick(tile)}
                      className={`h-24 sm:h-28 p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-md ${stateClass}`}
                    >
                      <span
                        className={`font-bold leading-tight ${
                          tile.type === 'term'
                            ? 'text-2xl sm:text-3xl font-serif text-amber-200'
                            : 'text-sm text-slate-100 font-medium'
                        }`}
                      >
                        {tile.text}
                      </span>
                      {tile.type === 'term' && tile.subtext && (
                        <span className="text-[11px] font-mono text-indigo-300 mt-1">{tile.subtext}</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* GAME 2 & 3: QUIZ / REFLEX */}
          {(activeGameType === 'speed_pinyin' || activeGameType === 'reflex') && (
            <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                <span>
                  Câu hỏi <strong className="text-indigo-400">{quizQuestionIndex + 1}</strong> / {totalPairs}
                </span>
                <button
                  onClick={() => speakChinese(cards[quizQuestionIndex]?.term || '')}
                  className="p-1.5 text-indigo-400 hover:text-white rounded border border-indigo-500/30 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Từ vựng Hán tự:</span>
                <h1 className="text-5xl font-serif font-black text-amber-200 mt-1">
                  {cards[quizQuestionIndex]?.term}
                </h1>
                {activeGameType === 'reflex' && reflexSettings.showPinyinHint && (
                  <span className="text-xs font-mono font-bold text-amber-500 block mt-1">
                    {cards[quizQuestionIndex]?.pinyin}
                  </span>
                )}
              </div>

              <div className={`grid gap-3 ${quizOptions.length > 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {quizOptions.map((option, idx) => {
                  const currentCard = cards[quizQuestionIndex];
                  const correctAnswer =
                    activeGameType === 'speed_pinyin'
                      ? currentCard?.pinyin || currentCard?.term
                      : currentCard?.definition;

                  let btnStyle = 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-white';
                  if (selectedAnswer !== null) {
                    if (option === correctAnswer) {
                      btnStyle = 'bg-emerald-600 border-emerald-500 text-white font-bold ring-2 ring-emerald-400';
                    } else if (option === selectedAnswer) {
                      btnStyle = 'bg-rose-600 border-rose-500 text-white font-bold';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerClick(option)}
                      className={`p-4 rounded-2xl border-2 text-sm font-semibold transition-all cursor-pointer shadow-sm text-center ${btnStyle}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* GAME 4: TRẮC NGHIỆM HÁN TỰ & PINYIN */}
          {activeGameType === 'hanzi_quiz' && hanziQuizQuestion && (
            <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl">
              <div className="text-xs text-slate-400">
                Câu <strong className="text-purple-400">{quizQuestionIndex + 1}</strong> / {totalPairs}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {hanziQuizQuestion.promptType === 'hanzi' ? 'Chữ Hán:' : 'Pinyin:'}
                </span>
                <h1 className="text-4xl sm:text-5xl font-serif font-black text-amber-200 mt-1">
                  {hanziQuizQuestion.promptText}
                </h1>
                {hanziQuizQuestion.promptSubtext && (
                  <p className="text-xs text-emerald-400 mt-2 font-bold">{hanziQuizQuestion.promptSubtext}</p>
                )}
              </div>

              <div className={`grid gap-3 ${hanziQuizQuestion.options.length > 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {hanziQuizQuestion.options.map((option, idx) => {
                  let btnStyle = 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-white';
                  if (selectedAnswer !== null) {
                    if (option === hanziQuizQuestion.correctOption) {
                      btnStyle = 'bg-emerald-600 border-emerald-500 text-white font-bold ring-2 ring-emerald-400';
                    } else if (option === selectedAnswer) {
                      btnStyle = 'bg-rose-600 border-rose-500 text-white font-bold';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleHanziQuizAnswerClick(option)}
                      className={`p-4 rounded-2xl border-2 text-base font-semibold transition-all cursor-pointer shadow-sm text-center ${btnStyle}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DEDICATED IN-GAME SETTINGS MODALS */}
      {activeSettingsModal === 'matching' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-white">
                <Grid className="w-5 h-5 text-indigo-400" />
                <span>Cài Đặt: Ghép Thẻ Nối Từ</span>
              </div>
              <button onClick={() => setActiveSettingsModal(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-white block mb-1">Số lượng cặp thẻ trên bàn chơi:</label>
                <select
                  value={matchingSettings.pairCount}
                  onChange={(e) => setMatchingSettings({ ...matchingSettings, pairCount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value={4}>4 cặp (8 thẻ - Nhanh)</option>
                  <option value={8}>8 cặp (16 thẻ - Tiêu chuẩn)</option>
                  <option value={12}>12 cặp (24 thẻ - Thử thách)</option>
                  <option value={16}>16 cặp (32 thẻ - Chuyên gia)</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                <div>
                  <span className="font-bold text-white block">Âm thanh phát âm Hán tự:</span>
                  <span className="text-[11px] text-slate-400">Đọc tiếng Trung khi chạm vào thẻ từ</span>
                </div>
                <input
                  type="checkbox"
                  checked={matchingSettings.soundEnabled}
                  onChange={(e) => setMatchingSettings({ ...matchingSettings, soundEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setActiveSettingsModal(null);
                startGame('matching');
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Áp Dụng & Chơi Lại
            </button>
          </div>
        </div>
      )}

      {activeSettingsModal === 'speed_pinyin' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-white">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Cài Đặt: Chọn Pinyin Nhanh</span>
              </div>
              <button onClick={() => setActiveSettingsModal(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-white block mb-1">Số lượng câu hỏi trong mỗi ván:</label>
                <select
                  value={pinyinSettings.questionCount}
                  onChange={(e) => setPinyinSettings({ ...pinyinSettings, questionCount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value={5}>5 câu hỏi</option>
                  <option value={10}>10 câu hỏi</option>
                  <option value={15}>15 câu hỏi</option>
                  <option value={cards.length}>Tất cả từ vựng ({cards.length})</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-white block mb-1">Số lựa chọn đáp án Pinyin:</label>
                <select
                  value={pinyinSettings.optionCount}
                  onChange={(e) => setPinyinSettings({ ...pinyinSettings, optionCount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value={2}>2 đáp án (Dễ)</option>
                  <option value={4}>4 đáp án (Tiêu chuẩn)</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                <div>
                  <span className="font-bold text-white block">Tự động đọc Hán tự:</span>
                  <span className="text-[11px] text-slate-400">Phát âm khi bắt đầu mỗi câu</span>
                </div>
                <input
                  type="checkbox"
                  checked={pinyinSettings.soundEnabled}
                  onChange={(e) => setPinyinSettings({ ...pinyinSettings, soundEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setActiveSettingsModal(null);
                startGame('speed_pinyin');
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Áp Dụng & Chơi Lại
            </button>
          </div>
        </div>
      )}

      {activeSettingsModal === 'reflex' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-white">
                <Brain className="w-5 h-5 text-emerald-400" />
                <span>Cài Đặt: Phản Xạ Tìm Nghĩa</span>
              </div>
              <button onClick={() => setActiveSettingsModal(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-white block mb-1">Số lượng câu hỏi trong mỗi ván:</label>
                <select
                  value={reflexSettings.questionCount}
                  onChange={(e) => setReflexSettings({ ...reflexSettings, questionCount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value={5}>5 câu hỏi</option>
                  <option value={10}>10 câu hỏi</option>
                  <option value={15}>15 câu hỏi</option>
                  <option value={cards.length}>Tất cả từ vựng ({cards.length})</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                <div>
                  <span className="font-bold text-white block">Hiển thị Pinyin dưới Hán tự:</span>
                  <span className="text-[11px] text-slate-400">Gợi ý cách đọc để hỗ trợ phản xạ</span>
                </div>
                <input
                  type="checkbox"
                  checked={reflexSettings.showPinyinHint}
                  onChange={(e) => setReflexSettings({ ...reflexSettings, showPinyinHint: e.target.checked })}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                <div>
                  <span className="font-bold text-white block">Âm thanh giọng đọc:</span>
                  <span className="text-[11px] text-slate-400">Đọc tiếng Trung khi hiển thị câu</span>
                </div>
                <input
                  type="checkbox"
                  checked={reflexSettings.soundEnabled}
                  onChange={(e) => setReflexSettings({ ...reflexSettings, soundEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setActiveSettingsModal(null);
                startGame('reflex');
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Áp Dụng & Chơi Lại
            </button>
          </div>
        </div>
      )}

      {activeSettingsModal === 'hanzi_quiz' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-white">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>Cài Đặt: Trắc Nghiệm Hán Tự & Pinyin</span>
              </div>
              <button onClick={() => setActiveSettingsModal(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-white block mb-1">Số lượng câu hỏi trong mỗi ván:</label>
                <select
                  value={hanziQuizSettings.questionCount}
                  onChange={(e) => setHanziQuizSettings({ ...hanziQuizSettings, questionCount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value={5}>5 câu hỏi</option>
                  <option value={10}>10 câu hỏi</option>
                  <option value={15}>15 câu hỏi</option>
                  <option value={cards.length}>Tất cả từ vựng ({cards.length})</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-white block mb-1">Chế độ trắc nghiệm:</label>
                <select
                  value={hanziQuizSettings.displayMode}
                  onChange={(e) => setHanziQuizSettings({ ...hanziQuizSettings, displayMode: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value="mixed">Xáo trộn (Hán ➔ Pinyin & Pinyin ➔ Hán)</option>
                  <option value="hanzi_to_pinyin">Cho Hán tự ➔ Chọn Pinyin</option>
                  <option value="pinyin_to_hanzi">Cho Pinyin ➔ Chọn Hán tự</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-white block mb-1">Số lượng đáp án lựa chọn:</label>
                <select
                  value={hanziQuizSettings.optionCount}
                  onChange={(e) => setHanziQuizSettings({ ...hanziQuizSettings, optionCount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                >
                  <option value={2}>2 đáp án (Dễ)</option>
                  <option value={4}>4 đáp án (Tiêu chuẩn)</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                <div>
                  <span className="font-bold text-white block">Hiển thị Nghĩa Tiếng Việt:</span>
                  <span className="text-[11px] text-slate-400">Gợi ý nghĩa từ bên dưới đề bài</span>
                </div>
                <input
                  type="checkbox"
                  checked={hanziQuizSettings.showMeaningHint}
                  onChange={(e) => setHanziQuizSettings({ ...hanziQuizSettings, showMeaningHint: e.target.checked })}
                  className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-2xl border border-slate-700">
                <div>
                  <span className="font-bold text-white block">Âm thanh phát âm:</span>
                  <span className="text-[11px] text-slate-400">Tự động đọc Hán tự khi bắt đầu câu</span>
                </div>
                <input
                  type="checkbox"
                  checked={hanziQuizSettings.soundEnabled}
                  onChange={(e) => setHanziQuizSettings({ ...hanziQuizSettings, soundEnabled: e.target.checked })}
                  className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setActiveSettingsModal(null);
                startGame('hanzi_quiz');
              }}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Áp Dụng & Chơi Lại
            </button>
          </div>
        </div>
      )}

      {/* POPUP XÁC NHẬN THOÁT TRÒ CHƠI */}
      {isExitConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Thoát Trò Chơi?</h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Bạn có chắc chắn muốn hủy lượt chơi đang dở không? Điểm số lượt chơi này sẽ không được ghi nhận.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsExitConfirmOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Tiếp Tục Chơi
              </button>
              <button
                onClick={() => {
                  setIsExitConfirmOpen(false);
                  setIsPlaying(false);
                  setActiveGameType(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
              >
                Xác Nhận Thoát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
