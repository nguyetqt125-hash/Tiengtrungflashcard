import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import {
  X,
  Play,
  RotateCcw,
  PenTool,
  Eye,
  Volume2,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Grid,
  Lightbulb,
  Repeat,
  Pause,
} from 'lucide-react';
import { speakChinese } from '../utils/speech';

interface HanziWriterModalProps {
  isOpen: boolean;
  term: string; // e.g. "你好" or "学"
  pinyin?: string;
  definition?: string;
  onClose: () => void;
}

export const HanziWriterModal: React.FC<HanziWriterModalProps> = ({
  isOpen,
  term,
  pinyin,
  definition,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);

  // Extract CJK Chinese characters from term
  const chineseChars = React.useMemo(() => {
    return (term || '').replace(/[^\u4e00-\u9fa5]/g, '').split('');
  }, [term]);

  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [mode, setMode] = useState<'animate' | 'quiz'>('quiz'); // Default to Quiz practice mode
  const modeRef = useRef<'animate' | 'quiz'>('quiz');
  const [showOutline, setShowOutline] = useState(false); // Default BLANK canvas (trắng tinh)
  const [showGrid, setShowGrid] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [quizScore, setQuizScore] = useState<{ mistakes: number; isCompleted: boolean }>({
    mistakes: 0,
    isCompleted: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const currentChar = chineseChars[selectedCharIndex] || '';

  // Keep modeRef in sync with mode state
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Reset outline to false whenever term or selectedCharIndex changes
  useEffect(() => {
    setShowOutline(false);
  }, [term, selectedCharIndex]);

  // Start quiz mode helper
  const startQuizMode = (writerInstance?: any) => {
    const w = writerInstance || writerRef.current;
    if (!w) return;

    try {
      try { w.cancelAnimation(); } catch (e) {}
      try { w.cancelQuiz(); } catch (e) {}

      setIsAnimating(false);
      setIsLooping(false);
      setIsPaused(false);
      w.hideCharacter();
      
      if (showOutline) {
        w.showOutline();
      } else {
        w.hideOutline();
      }

      setQuizScore({ mistakes: 0, isCompleted: false });

      w.quiz({
        showOutline: showOutline,
        showHintAfterMisses: 1, // Immediately highlight guided stroke after 1 mistake
        highlightColor: '#8b5cf6', // Violet guided stroke highlight
        drawingColor: '#6366f1', // Indigo active drawing line
        drawingWidth: 16,
        onMistake: () => {
          setQuizScore((prev) => ({ ...prev, mistakes: prev.mistakes + 1 }));
        },
        onCorrectStroke: () => {
          // Correct stroke drawn
        },
        onComplete: () => {
          setQuizScore((prev) => ({ ...prev, isCompleted: true }));
        },
      });
    } catch (e) {
      console.error('Error starting quiz mode:', e);
    }
  };

  // Play single animation helper
  const handlePlayOnce = () => {
    setMode('animate');
    modeRef.current = 'animate';
    setIsLooping(false);
    setIsPaused(false);

    const w = writerRef.current;
    if (!w) return;

    try {
      try { w.cancelAnimation(); } catch (e) {}
      try { w.cancelQuiz(); } catch (e) {}

      w.hideCharacter();
      if (showOutline) {
        w.showOutline();
      } else {
        w.hideOutline();
      }

      setIsAnimating(true);
      w.animateCharacter({
        onComplete: () => setIsAnimating(false),
      });
    } catch (e) {
      console.error('Animation error:', e);
      setIsAnimating(false);
    }
  };

  // Loop animation helper
  const handleLoopAnimation = () => {
    setMode('animate');
    modeRef.current = 'animate';
    setIsLooping(true);
    setIsPaused(false);

    const w = writerRef.current;
    if (!w) return;

    try {
      try { w.cancelAnimation(); } catch (e) {}
      try { w.cancelQuiz(); } catch (e) {}

      w.hideCharacter();
      if (showOutline) {
        w.showOutline();
      } else {
        w.hideOutline();
      }

      setIsAnimating(true);
      w.loopCharacterAnimation();
    } catch (e) {
      console.error('Loop animation error:', e);
      setIsAnimating(false);
    }
  };

  // Toggle pause/resume animation
  const handleTogglePause = () => {
    const w = writerRef.current;
    if (!w) return;

    if (isPaused) {
      try { w.resumeAnimation(); } catch (e) {}
      setIsPaused(false);
    } else {
      try { w.pauseAnimation(); } catch (e) {}
      setIsPaused(true);
    }
  };

  // Initialize Hanzi Writer instance when current character changes
  useEffect(() => {
    if (!isOpen || !currentChar || !containerRef.current) return;

    setIsLoading(true);
    setHasError(false);
    setQuizScore({ mistakes: 0, isCompleted: false });

    // Cancel old instance if exists
    if (writerRef.current) {
      try { writerRef.current.cancelAnimation(); } catch (e) {}
      try { writerRef.current.cancelQuiz(); } catch (e) {}
    }

    // Clear previous container content
    containerRef.current.innerHTML = '';

    try {
      const writer = HanziWriter.create(containerRef.current, currentChar, {
        width: 260,
        height: 260,
        padding: 15,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 200,
        delayBetweenLoops: 1000,
        strokeColor: '#0f172a', // slate-900 (dark crisp stroke)
        outlineColor: '#94a3b8', // slate-400 (guide outline)
        drawingColor: '#6366f1', // indigo-500 (user drawing stroke)
        drawingWidth: 16,
        highlightColor: '#8b5cf6', // violet-500 (guided hint stroke)
        showCharacter: false, // MANDATORY: Start 100% BLANK canvas
        showOutline: false, // MANDATORY: Start 100% BLANK canvas
        showHintAfterMisses: 1, // Flash hint after 1 mistake
        highlightOnComplete: true,
        highlightCompleteColor: '#10b981', // emerald-500
        charDataLoader: (char, onComplete, onError) => {
          const encoded = encodeURIComponent(char);
          const cdnUrls = [
            `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encoded}.json`,
            `https://cdn.jsdelivr.net/gh/chanind/hanzi-writer-data@2.0/${encoded}.json`,
            `https://unpkg.com/hanzi-writer-data@2.0/${encoded}.json`,
            `https://raw.githubusercontent.com/chanind/hanzi-writer-data/master/data/${encoded}.json`,
          ];

          let attempt = 0;
          const tryFetch = () => {
            if (attempt >= cdnUrls.length) {
              if (onError) onError(new Error(`Failed to load char data for ${char}`));
              return;
            }
            fetch(cdnUrls[attempt])
              .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
              })
              .then((data) => {
                if (onComplete) onComplete(data);
              })
              .catch(() => {
                attempt++;
                tryFetch();
              });
          };
          tryFetch();
        },
      });

      writerRef.current = writer;

      // Wait until character data is loaded
      const dataPromise = (writer as any)._withDataPromise || Promise.resolve();
      dataPromise
        .then(() => {
          setIsLoading(false);
          if (modeRef.current === 'animate') {
            handlePlayOnce();
          } else {
            startQuizMode(writer);
          }
        })
        .catch((err: any) => {
          console.error('Failed to load character data:', err);
          setIsLoading(false);
          setHasError(true);
        });
    } catch (e) {
      console.error('Failed to create HanziWriter:', e);
      setIsLoading(false);
      setHasError(true);
    }

    return () => {
      if (writerRef.current) {
        try { writerRef.current.cancelAnimation(); } catch (e) {}
        try { writerRef.current.cancelQuiz(); } catch (e) {}
      }
    };
  }, [isOpen, currentChar, resetKey]);

  const handleStartQuizTab = () => {
    setMode('quiz');
    modeRef.current = 'quiz';
    startQuizMode();
  };

  const handleStartAnimateTab = () => {
    setMode('animate');
    modeRef.current = 'animate';
    handlePlayOnce();
  };

  const handleResetQuiz = () => {
    setMode('quiz');
    modeRef.current = 'quiz';
    if (writerRef.current) {
      startQuizMode(writerRef.current);
    } else {
      setResetKey((prev) => prev + 1);
    }
  };

  const handleShowHint = () => {
    const w = writerRef.current;
    if (!w) return;
    try {
      if (w._quiz && typeof w._quiz._currentStrokeIndex === 'number') {
        w.highlightStroke(w._quiz._currentStrokeIndex);
      } else {
        w.highlightStroke(0);
      }
    } catch (e) {
      console.error('Hint error:', e);
    }
  };

  const handleToggleOutline = () => {
    setShowOutline((prev) => {
      const next = !prev;
      const w = writerRef.current;
      if (w) {
        if (next) {
          w.showOutline();
        } else {
          w.hideOutline();
        }
        if (modeRef.current === 'quiz') {
          try {
            w.quiz({
              showOutline: next,
              showHintAfterMisses: 1,
              highlightColor: '#8b5cf6',
              drawingColor: '#6366f1',
              drawingWidth: 16,
              onMistake: () => {
                setQuizScore((s) => ({ ...s, mistakes: s.mistakes + 1 }));
              },
              onComplete: () => {
                setQuizScore((s) => ({ ...s, isCompleted: true }));
              },
            });
          } catch (e) {
            // ignore
          }
        }
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col items-center text-center animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer z-10"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Information */}
        <div className="space-y-1 mb-3 w-full pr-8">
          <div className="flex items-center justify-center gap-1.5 text-indigo-600 mb-1">
            <PenTool className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide">
              Tập Viết Chữ Hán
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
            <span>{term}</span>
            <button
              onClick={() => speakChinese(term)}
              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
              title="Nghe phát âm"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </h2>
          {pinyin && <p className="text-xs font-mono font-bold text-amber-600">{pinyin}</p>}
          {definition && <p className="text-xs text-slate-500 line-clamp-1">{definition}</p>}
        </div>

        {/* Multi-Character Selector Tab */}
        {chineseChars.length > 1 && (
          <div className="flex items-center gap-2 mb-3 bg-slate-100/80 p-1.5 rounded-2xl w-full justify-center">
            <span className="text-xs font-bold text-slate-500">Chọn chữ:</span>
            <div className="flex items-center gap-1.5">
              {chineseChars.map((char, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCharIndex(index)}
                  className={`px-3.5 py-1 rounded-xl font-chinese font-black text-lg transition-all cursor-pointer ${
                    selectedCharIndex === index
                      ? 'bg-indigo-600 text-white shadow-sm scale-105'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Mode Tabs: Tự Tập Viết vs Xem Nét Mẫu */}
        <div className="grid grid-cols-2 gap-1.5 w-full mb-3 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={handleStartQuizTab}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'quiz'
                ? 'bg-white text-indigo-600 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tự tập viết (Quiz)</span>
          </button>
          <button
            onClick={handleStartAnimateTab}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'animate'
                ? 'bg-white text-indigo-600 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-indigo-600" />
            <span>Xem nét mẫu</span>
          </button>
        </div>

        {/* Guidance Tip Box */}
        <div className="w-full mb-3 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-[11px] text-indigo-900 text-left flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-snug">
            {mode === 'quiz' ? (
              <>
                <strong>Cách tập viết:</strong> Rê chuột/ngón tay lên ô mễ để <u>tự viết nét</u>. Nếu viết sai, hệ thống sẽ nhấp nháy <strong>nét hướng dẫn màu tím</strong>!
              </>
            ) : (
              <>
                <strong>Cách xem mẫu:</strong> Quan sát thứ tự và chiều của từng nét chữ Hán. Nhấn <u>Phát lặp lại</u> để xem liên tục.
              </>
            )}
          </div>
        </div>

        {/* Tianzige Grid Canvas Box */}
        <div className="relative my-1 flex items-center justify-center">
          <div
            className={`relative rounded-3xl p-2 border-2 transition-all select-none ${
              showGrid ? 'bg-tianzige border-rose-300 shadow-inner' : 'bg-white border-slate-200'
            }`}
            style={{ width: '276px', height: '276px' }}
          >
            {/* Tianzige Grid Background Lines */}
            {showGrid && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-25 stroke-rose-400"
                viewBox="0 0 100 100"
              >
                <rect x="0" y="0" width="100" height="100" fill="none" strokeWidth="2" />
                <line x1="0" y1="50" x2="100" y2="50" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="50" y1="0" x2="50" y2="100" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="0" x2="100" y2="100" strokeDasharray="2 2" strokeWidth="0.5" />
                <line x1="100" y1="0" x2="0" y2="100" strokeDasharray="2 2" strokeWidth="0.5" />
              </svg>
            )}

            {/* Hanzi Writer Mount Node */}
            <div
              ref={containerRef}
              className="relative z-10 cursor-crosshair touch-none select-none flex items-center justify-center w-[260px] h-[260px]"
            />

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-3xl z-20 space-y-2 pointer-events-none">
                <Sparkles className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs font-bold text-slate-600">Đang tải nét chữ...</span>
              </div>
            )}

            {/* Error Overlay */}
            {hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-50/95 rounded-3xl p-4 text-center z-20 space-y-2 border border-rose-200">
                <p className="text-xs font-bold text-rose-700">
                  Không tìm thấy dữ liệu nét vẽ cho chữ '{currentChar}'.
                </p>
                <p className="text-[11px] text-slate-500">
                  Thử chọn từ khác hoặc nghe phát âm.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Completion Success Banner */}
        {mode === 'quiz' && quizScore.isCompleted && (
          <div className="mt-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 w-full flex items-center justify-between text-xs font-bold animate-in zoom-in-95 gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-left leading-tight">
                Hoàn thành chữ <strong className="font-chinese text-base">{currentChar}</strong>!
                {quizScore.mistakes > 0 ? ` (${quizScore.mistakes} lần viết chưa chuẩn)` : ' (Tuyệt đối chuẩn!)'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleResetQuiz}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95"
                title="Viết lại"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Viết lại</span>
              </button>
            </div>
          </div>
        )}

        {/* Controls Section */}
        <div className="mt-4 w-full border-t border-slate-100 pt-3 space-y-2">
          {/* Primary Actions Row */}
          <div className="flex items-center justify-center gap-2 w-full">
            {mode === 'animate' ? (
              <>
                <button
                  onClick={handlePlayOnce}
                  className={`py-2 px-4 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    !isLooping
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="Xem nét vẽ 1 lần"
                >
                  <Play className="w-4 h-4" />
                  <span>Phát 1 lần</span>
                </button>

                <button
                  onClick={handleLoopAnimation}
                  className={`py-2 px-4 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    isLooping
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                  title="Phát lặp đi lặp lại liên tục"
                >
                  <Repeat className="w-4 h-4" />
                  <span>Phát lặp lại</span>
                </button>

                {isAnimating && (
                  <button
                    onClick={handleTogglePause}
                    className="py-2 px-3 bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Tạm dừng hoặc tiếp tục"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4 text-amber-600" />
                        <span>Tiếp tục</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 text-amber-600" />
                        <span>Tạm dừng</span>
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleResetQuiz}
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Xóa trắng canvas để tập viết lại từ đầu"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Xóa & Viết lại</span>
                </button>

                <button
                  onClick={handleShowHint}
                  className="py-2.5 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Gợi ý nét tiếp theo"
                >
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Gợi ý nét</span>
                </button>
              </>
            )}
          </div>

          {/* Secondary Toggles Row (Nét mờ & Ô Mễ) */}
          <div className="flex items-center justify-center gap-2 w-full pt-1">
            <button
              onClick={handleToggleOutline}
              className={`py-1.5 px-3 border text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                showOutline
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              title="Bật/Tắt nét mờ mờ hướng dẫn"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showOutline ? 'Nét mờ: Bật' : 'Nét mờ: Tắt'}</span>
            </button>

            <button
              onClick={() => setShowGrid((prev) => !prev)}
              className={`py-1.5 px-3 border text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                showGrid
                  ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              title="Bật/Tắt khung ô mễ"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>{showGrid ? 'Ô Mễ: Bật' : 'Ô Mễ: Tắt'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
