import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  RotateCw,
  Trophy,
  Gamepad2,
  Timer,
  Sparkles,
  Settings,
  Swords,
  Castle,
  Crown,
  BookOpen,
  Grid,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Flashcard, Lesson } from '../types';
import { GameSettingsModal, GameCustomSettings } from './games/GameSettingsModal';
import { HanziSlashGame } from './games/HanziSlashGame';
import { TowerClimbGame } from './games/TowerClimbGame';
import { WuxiaAdventureGame } from './games/WuxiaAdventureGame';
import { SentenceFillGame } from './games/SentenceFillGame';
import { TileMatchGame } from './games/TileMatchGame';
import { SpeedQuizGame } from './games/SpeedQuizGame';

export type GameModeType =
  | 'hanzi_slash'
  | 'tower_climb'
  | 'wuxia_adventure'
  | 'sentence_fill'
  | 'matching'
  | 'speed_quiz'
  | null;

interface MatchingGameProps {
  lesson: Lesson;
  cards: Flashcard[];
  onClose: () => void;
}

export const MatchingGame: React.FC<MatchingGameProps> = ({ lesson, cards, onClose }) => {
  const [activeGame, setActiveGame] = useState<GameModeType>(null);
  const [activeSettingsModal, setActiveSettingsModal] = useState<GameModeType>(null);

  // Common Settings State for Games
  const [gameSettings, setGameSettings] = useState<Record<string, GameCustomSettings>>({
    hanzi_slash: {
      questionCount: Math.min(cards.length, 10),
      questionTypes: ['term', 'definition'],
      answerTypes: ['definition', 'pinyin'],
      soundEnabled: true,
    },
    tower_climb: {
      questionCount: Math.min(cards.length, 8),
      questionTypes: ['term', 'pinyin'],
      answerTypes: ['definition'],
      soundEnabled: true,
    },
    wuxia_adventure: {
      questionCount: Math.min(cards.length, 10),
      questionTypes: ['definition', 'pinyin'],
      answerTypes: ['term', 'pinyin'],
      soundEnabled: true,
    },
    sentence_fill: {
      questionCount: Math.min(cards.length, 10),
      questionTypes: ['definition', 'term'],
      answerTypes: ['term'],
      answerMode: 'typing',
      soundEnabled: true,
    },
    matching: {
      questionCount: Math.min(cards.length, 8),
      questionTypes: ['term'],
      answerTypes: ['definition'],
      soundEnabled: true,
    },
    speed_quiz: {
      questionCount: Math.min(cards.length, 10),
      questionTypes: ['term', 'pinyin', 'definition'],
      answerTypes: ['definition', 'pinyin', 'term'],
      soundEnabled: true,
    },
  });

  // Finish State
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalSeconds, setFinalSeconds] = useState(0);

  const startGame = (mode: GameModeType) => {
    setActiveGame(mode);
    setIsCompleted(false);
    setFinalScore(0);
    setFinalSeconds(0);
  };

  const handleGameFinish = (score: number, seconds: number) => {
    setFinalScore(score);
    setFinalSeconds(seconds);
    setIsCompleted(true);
    triggerWinConfetti();
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

  const getGameTitle = (mode: GameModeType): string => {
    switch (mode) {
      case 'hanzi_slash':
        return 'Chém Chữ Hán';
      case 'tower_climb':
        return 'Tháp Chữ Hán';
      case 'wuxia_adventure':
        return 'Vượt Ải Cổ Trang';
      case 'sentence_fill':
        return 'Điền Từ Vào Câu';
      case 'matching':
        return 'Ghép Thẻ Nối Từ';
      case 'speed_quiz':
        return 'Trắc Nghiệm Phản Xạ Nhanh';
      default:
        return 'Trò Chơi';
    }
  };

  // Render Game Hub Menu when activeGame is null
  if (activeGame === null) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-y-auto">
        {/* Hub Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10 backdrop-blur">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-300 hover:text-white px-3.5 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thoát Trò Chơi</span>
          </button>

          <div className="text-center">
            <h1 className="text-base sm:text-lg font-black text-white flex items-center justify-center gap-2">
              <Gamepad2 className="w-5 h-5 text-indigo-400" />
              <span>Trung Tâm Trò Chơi Hán Ngữ</span>
            </h1>
            <p className="text-xs text-slate-400">
              Bài học: <strong className="text-indigo-300">{lesson.name}</strong> ({cards.length} từ vựng)
            </p>
          </div>

          <div className="w-28" />
        </div>

        {/* 6 Mini-Games Hub Grid */}
        <div className="max-w-6xl mx-auto w-full p-6 space-y-8 my-auto">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30">
              6 Chế Độ Trò Chơi Học Từ Vựng
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Lựa Chọn Trò Chơi Luyện Tập</h2>
            <p className="text-xs text-slate-400">
              Tùy chỉnh linh hoạt câu hỏi (Chữ Hán, Pinyin, Tiếng Việt, Âm thanh) và dạng câu trả lời riêng cho từng game!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Game 1: Chém Chữ Hán */}
            <div className="bg-slate-900 border border-slate-800 hover:border-red-500/60 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-red-600/20 text-red-400 rounded-2xl border border-red-500/30 group-hover:scale-110 transition-transform">
                    <Swords className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => setActiveSettingsModal('hanzi_slash')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-red-400" />
                    <span>Cài Đặt</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-red-300 transition-colors">
                    1. Chém Chữ Hán
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Trảm và vuốt nhanh bóng từ vựng bay trên màn hình ứng với đề bài đưa ra.
                  </p>
                </div>
              </div>

              <button
                onClick={() => startGame('hanzi_slash')}
                className="w-full mt-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Swords className="w-4 h-4" />
                <span>Bắt Đầu Chém Chữ</span>
              </button>
            </div>

            {/* Game 2: Tháp Chữ Hán */}
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-amber-600/20 text-amber-400 rounded-2xl border border-amber-500/30 group-hover:scale-110 transition-transform">
                    <Castle className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => setActiveSettingsModal('tower_climb')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-amber-400" />
                    <span>Cài Đặt</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    2. Tháp Chữ Hán
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Chọn đúng gạch đá từ vựng để xếp từng tầng tháp cổ cao chọc trời.
                  </p>
                </div>
              </div>

              <button
                onClick={() => startGame('tower_climb')}
                className="w-full mt-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-slate-950 text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Castle className="w-4 h-4" />
                <span>Bắt Đầu Xây Tháp</span>
              </button>
            </div>

            {/* Game 3: Vượt Ải Cổ Trang */}
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-400/60 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-rose-600/20 text-rose-400 rounded-2xl border border-rose-500/30 group-hover:scale-110 transition-transform">
                    <Crown className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => setActiveSettingsModal('wuxia_adventure')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-rose-400" />
                    <span>Cài Đặt</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                    3. Vượt Ải Cổ Trang
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Nhập vai hiệp khách phiêu lưu qua các cửa ải hoàng gia & tướng gatekeeper.
                  </p>
                </div>
              </div>

              <button
                onClick={() => startGame('wuxia_adventure')}
                className="w-full mt-6 py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-90 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Crown className="w-4 h-4" />
                <span>Bắt Đầu Vượt Ải</span>
              </button>
            </div>

            {/* Game 4: Điền Từ Vào Câu */}
            <div className="bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => setActiveSettingsModal('sentence_fill')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-indigo-400" />
                    <span>Cài Đặt</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    4. Điền Từ Vào Câu
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Tìm từ Hán tự chính xác còn thiếu dựa trên ngữ cảnh câu ví dụ thực tế.
                  </p>
                </div>
              </div>

              <button
                onClick={() => startGame('sentence_fill')}
                className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <BookOpen className="w-4 h-4" />
                <span>Luyện Điền Từ Ví Dụ</span>
              </button>
            </div>

            {/* Game 5: Ghép Thẻ Nối Từ */}
            <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/60 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-purple-600/20 text-purple-400 rounded-2xl border border-purple-500/30 group-hover:scale-110 transition-transform">
                    <Grid className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => setActiveSettingsModal('matching')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-purple-400" />
                    <span>Cài Đặt</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    5. Ghép Thẻ Nối Từ
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Lật ghép cặp thẻ Hán tự và nghĩa tiếng Việt tương ứng trên bàn chơi.
                  </p>
                </div>
              </div>

              <button
                onClick={() => startGame('matching')}
                className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Grid className="w-4 h-4" />
                <span>Bắt Đầu Ghép Cặp</span>
              </button>
            </div>

            {/* Game 6: Trắc Nghiệm Phản Xạ */}
            <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/30 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => setActiveSettingsModal('speed_quiz')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span>Cài Đặt</span>
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    6. Phản Xạ Nhanh
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Trắc nghiệm tính thời gian rèn luyện phản xạ đọc hiểu và dịch từ tức thì.
                  </p>
                </div>
              </div>

              <button
                onClick={() => startGame('speed_quiz')}
                className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Zap className="w-4 h-4" />
                <span>Bắt Đầu Phản Xạ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Config Modal */}
        {activeSettingsModal && (
          <GameSettingsModal
            title={getGameTitle(activeSettingsModal)}
            settings={gameSettings[activeSettingsModal]}
            totalCardsCount={cards.length}
            onClose={() => setActiveSettingsModal(null)}
            onSave={(newSet) => {
              setGameSettings((prev) => ({ ...prev, [activeSettingsModal]: newSet }));
            }}
          />
        )}
      </div>
    );
  }

  // Active Game Screen Header & Runner
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20 backdrop-blur">
        <button
          onClick={() => setActiveGame(null)}
          className="flex items-center gap-2 text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Menu Game</span>
        </button>

        <span className="text-sm font-extrabold text-indigo-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{getGameTitle(activeGame)}</span>
        </span>

        <button
          onClick={() => setActiveSettingsModal(activeGame)}
          className="p-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 rounded-xl border border-indigo-500/40 transition-colors cursor-pointer"
          title="Cài đặt game này"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Main View Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col justify-center">
        {isCompleted ? (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-auto animate-in zoom-in-95 duration-300">
            <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-full mb-4 border border-emerald-500/30">
              <Trophy className="w-16 h-16" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">🏆 Hoàn Thành Xuất Sắc!</h2>
            <p className="text-slate-300 text-sm mb-6">
              Bạn đã hoàn thành ván đấu <strong className="text-indigo-300">{getGameTitle(activeGame)}</strong> trong bài <span className="text-indigo-300">"{lesson.name}"</span>.
            </p>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full mb-6 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Thời gian thực hiện:</span>
                <span className="font-bold text-indigo-400 text-sm">{finalSeconds} giây</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Tổng điểm số:</span>
                <span className="font-bold text-amber-400 text-sm">{finalScore} điểm</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => startGame(activeGame)}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>Chơi Lại</span>
              </button>
              <button
                onClick={() => setActiveGame(null)}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Chọn Game Khác
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeGame === 'hanzi_slash' && (
              <HanziSlashGame
                cards={cards}
                settings={gameSettings.hanzi_slash}
                onFinish={handleGameFinish}
              />
            )}

            {activeGame === 'tower_climb' && (
              <TowerClimbGame
                cards={cards}
                settings={gameSettings.tower_climb}
                onFinish={handleGameFinish}
              />
            )}

            {activeGame === 'wuxia_adventure' && (
              <WuxiaAdventureGame
                cards={cards}
                settings={gameSettings.wuxia_adventure}
                onFinish={handleGameFinish}
              />
            )}

            {activeGame === 'sentence_fill' && (
              <SentenceFillGame
                cards={cards}
                settings={gameSettings.sentence_fill}
                onFinish={handleGameFinish}
              />
            )}

            {activeGame === 'matching' && (
              <TileMatchGame
                cards={cards}
                settings={gameSettings.matching}
                onFinish={handleGameFinish}
              />
            )}

            {activeGame === 'speed_quiz' && (
              <SpeedQuizGame
                cards={cards}
                settings={gameSettings.speed_quiz}
                onFinish={handleGameFinish}
              />
            )}
          </>
        )}
      </div>

      {/* Global Config Modal */}
      {activeSettingsModal && (
        <GameSettingsModal
          title={getGameTitle(activeSettingsModal)}
          settings={gameSettings[activeSettingsModal]}
          totalCardsCount={cards.length}
          onClose={() => setActiveSettingsModal(null)}
          onSave={(newSet) => {
            setGameSettings((prev) => ({ ...prev, [activeSettingsModal]: newSet }));
          }}
        />
      )}
    </div>
  );
};
