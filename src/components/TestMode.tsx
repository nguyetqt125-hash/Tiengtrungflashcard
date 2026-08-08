import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Settings,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  X,
  Timer,
  RotateCw,
  Sparkles,
  HelpCircle,
  Award,
  Volume2,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Flashcard,
  Lesson,
  TestSettings,
  TestQuestion,
  UserAnswer,
  TestResult,
  TestQuestionType,
  TestFormatType,
} from '../types';
import { speakChinese } from '../utils/speech';
import { saveTestResult } from '../utils/storage';
import { recordCardReview } from '../utils/srs';
import { HanziWriterModal } from './HanziWriterModal';
import { PenTool } from 'lucide-react';

interface TestModeProps {
  lesson: Lesson;
  cards: Flashcard[];
  onClose: () => void;
}

export const TestMode: React.FC<TestModeProps> = ({ lesson, cards, onClose }) => {
  // Test Phase: 'settings' | 'testing' | 'results'
  const [phase, setPhase] = useState<'settings' | 'testing' | 'results'>('settings');
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  // Test Settings State
  const [settings, setSettings] = useState<TestSettings>({
    questionTypes: ['term', 'pinyin', 'definition'],
    formatTypes: ['mcq', 'typing'],
    questionCount: Math.min(cards.length, 10),
    timeLimitMinutes: 0, // unlimited
    showHints: true,
  });

  // Test Execution State
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [typedAnswer, setTypedAnswer] = useState('');
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [finalResult, setFinalResult] = useState<TestResult | null>(null);
  const [writingCard, setWritingCard] = useState<Flashcard | null>(null);
  const [isTestSettingsOpen, setIsTestSettingsOpen] = useState(false);

  // Generate Questions based on Settings
  const generateQuestions = () => {
    if (cards.length === 0) return;

    // Shuffle and pick cards up to questionCount
    const selectedCards = [...cards]
      .sort(() => 0.5 - Math.random())
      .slice(0, settings.questionCount);

    const generated: TestQuestion[] = [];

    selectedCards.forEach((card, idx) => {
      // Pick random question type from enabled types
      const qType: TestQuestionType =
        settings.questionTypes[Math.floor(Math.random() * settings.questionTypes.length)] || 'term';

      // Pick random format from enabled formats
      const fType: TestFormatType =
        settings.formatTypes[Math.floor(Math.random() * settings.formatTypes.length)] || 'mcq';

      let promptText = '';
      let promptSubtext = '';
      let correctAnswer = '';

      if (qType === 'term') {
        promptText = card.term;
        promptSubtext = 'Hãy cho biết nghĩa hoặc Pinyin của từ vựng trên';
        correctAnswer = `${card.definition} (${card.pinyin || ''})`.trim();
      } else if (qType === 'pinyin') {
        promptText = card.pinyin || card.term;
        promptSubtext = 'Hãy cho biết Hán tự hoặc nghĩa tiếng Việt tương ứng';
        correctAnswer = card.term;
      } else {
        // definition
        promptText = card.definition;
        promptSubtext = 'Hãy chọn Hán tự đúng cho định nghĩa trên';
        correctAnswer = card.term;
      }

      // Generate MCQ options if format is MCQ
      let options: string[] | undefined = undefined;
      let isTrueFalseTargetMatch: boolean | undefined = undefined;
      let tfDisplayedAnswer: string | undefined = undefined;

      if (fType === 'mcq') {
        // Distractors from other cards
        const otherCards = cards.filter((c) => c.id !== card.id);
        const distractors: string[] = [];

        otherCards.forEach((c) => {
          if (qType === 'term') distractors.push(`${c.definition} (${c.pinyin || ''})`.trim());
          else distractors.push(c.term);
        });

        const shuffledDistractors = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
        options = [correctAnswer, ...shuffledDistractors].sort(() => 0.5 - Math.random());
      } else if (fType === 'tf') {
        // 50% chance true statement, 50% false statement
        isTrueFalseTargetMatch = Math.random() > 0.5;
        if (isTrueFalseTargetMatch) {
          tfDisplayedAnswer = correctAnswer;
        } else {
          const otherCards = cards.filter((c) => c.id !== card.id);
          const wrongCard = otherCards[Math.floor(Math.random() * otherCards.length)] || card;
          tfDisplayedAnswer = qType === 'term' ? wrongCard.definition : wrongCard.term;
        }
      }

      generated.push({
        id: `q-${idx}-${card.id}`,
        card,
        questionType: qType,
        formatType: fType,
        promptText,
        promptSubtext,
        correctAnswer,
        options,
        isTrueFalseTargetMatch,
        tfDisplayedAnswer,
      });
    });

    setQuestions(generated);
    setCurrentQIndex(0);
    setUserAnswers({});
    setTypedAnswer('');
    setTimeSpent(0);

    if (settings.timeLimitMinutes > 0) {
      setSecondsLeft(settings.timeLimitMinutes * 60);
    } else {
      setSecondsLeft(0);
    }

    setPhase('testing');
  };

  // Timer countdown
  useEffect(() => {
    if (phase !== 'testing') return;

    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);

      if (settings.timeLimitMinutes > 0) {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, settings.timeLimitMinutes]);

  const currentQ = questions[currentQIndex];

  const handleSelectOption = (answer: string) => {
    if (!currentQ) return;
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: answer }));

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setTypedAnswer('');
    } else {
      finishTest({ ...userAnswers, [currentQ.id]: answer });
    }
  };

  const handleNextTyped = () => {
    if (!currentQ) return;
    const ans = typedAnswer.trim();
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: ans }));

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
      setTypedAnswer('');
    } else {
      finishTest({ ...userAnswers, [currentQ.id]: ans });
    }
  };

  // Normalize string comparison for strict matching without AI
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .trim();

  const finishTest = (finalAnswers = userAnswers) => {
    let correctCount = 0;
    const evaluatedAnswers: UserAnswer[] = [];

    questions.forEach((q) => {
      const uAns = finalAnswers[q.id] || '';
      let isCorrect = false;

      if (q.formatType === 'tf') {
        const expected = q.isTrueFalseTargetMatch ? 'ĐÚNG' : 'SAI';
        isCorrect = uAns === expected;
      } else {
        const normUser = normalize(uAns);
        const normCorrect = normalize(q.correctAnswer);
        const normTerm = normalize(q.card.term);
        const normDef = normalize(q.card.definition);
        const normPinyin = normalize(q.card.pinyin || '');

        // Match against exact correct answer or card attributes
        isCorrect =
          normUser === normCorrect ||
          normUser === normTerm ||
          normUser === normDef ||
          (normPinyin.length > 0 && normUser === normPinyin);
      }

      if (isCorrect) correctCount++;

      // Link test result to SRS mastery state
      recordCardReview(q.card.id, isCorrect);

      evaluatedAnswers.push({
        questionId: q.id,
        cardId: q.card.id,
        userAnswer: uAns || '(Chưa trả lời)',
        correctAnswer: q.formatType === 'tf' ? (q.isTrueFalseTargetMatch ? 'ĐÚNG' : 'SAI') : q.correctAnswer,
        isCorrect,
        questionPrompt: `${q.promptText} (${q.promptSubtext})`,
      });
    });

    const scorePercent = Math.round((correctCount / questions.length) * 100) || 0;

    const result: TestResult = {
      id: `test-${Date.now()}`,
      lessonId: lesson.id,
      lessonName: lesson.name,
      date: Date.now(),
      scorePercent,
      correctCount,
      totalQuestions: questions.length,
      timeSpentSeconds: timeSpent,
      answers: evaluatedAnswers,
    };

    saveTestResult(result);
    setFinalResult(result);
    setPhase('results');

    if (scorePercent >= 80) {
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
  };

  // Render Phase 1: Test Settings
  if (phase === 'settings') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-slate-100 overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Thoát</span>
          </button>
          <div className="font-bold text-white">
            <span>Cài Đặt Bài Kiểm Tra Từ Vựng</span>
          </div>
          <div className="w-16" />
        </div>

        <div className="flex-1 max-w-2xl w-full mx-auto p-6 space-y-6 my-auto">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-6 shadow-xl">
            {/* Header info */}
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Bài học:</span>
              <h2 className="text-xl font-black text-white mt-0.5">{lesson.name}</h2>
              <p className="text-xs text-slate-400 mt-1">Tùy chỉnh cấu trúc bài kiểm tra theo ý muốn của bạn</p>
            </div>

            {/* Question Types */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                1. Kiểu câu hỏi (Chọn ít nhất 1):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'term', label: 'Hỏi Hán tự' },
                  { id: 'pinyin', label: 'Hỏi Pinyin' },
                  { id: 'definition', label: 'Hỏi Nghĩa Tiếng Việt' },
                ].map((type) => {
                  const active = settings.questionTypes.includes(type.id as TestQuestionType);
                  return (
                    <button
                      type="button"
                      key={type.id}
                      onClick={() => {
                        let updated = [...settings.questionTypes];
                        if (active) {
                          if (updated.length > 1) updated = updated.filter((t) => t !== type.id);
                        } else {
                          updated.push(type.id as TestQuestionType);
                        }
                        setSettings({ ...settings, questionTypes: updated });
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Formats */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                2. Dạng bài tập (Chọn ít nhất 1):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'mcq', label: 'Trắc nghiệm 4 đáp án' },
                  { id: 'typing', label: 'Tự luận (Nhập đáp án)' },
                  { id: 'tf', label: 'Đúng / Sai' },
                ].map((format) => {
                  const active = settings.formatTypes.includes(format.id as TestFormatType);
                  return (
                    <button
                      type="button"
                      key={format.id}
                      onClick={() => {
                        let updated = [...settings.formatTypes];
                        if (active) {
                          if (updated.length > 1) updated = updated.filter((f) => f !== format.id);
                        } else {
                          updated.push(format.id as TestFormatType);
                        }
                        setSettings({ ...settings, formatTypes: updated });
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {format.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Question Count & Time Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">3. Số lượng câu hỏi:</label>
                <select
                  value={settings.questionCount}
                  onChange={(e) => setSettings({ ...settings, questionCount: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={Math.min(cards.length, 5)}>5 câu hỏi</option>
                  <option value={Math.min(cards.length, 10)}>10 câu hỏi</option>
                  <option value={Math.min(cards.length, 15)}>15 câu hỏi</option>
                  <option value={cards.length}>Tất cả ({cards.length} câu)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">4. Giới hạn thời gian:</label>
                <select
                  value={settings.timeLimitMinutes}
                  onChange={(e) => setSettings({ ...settings, timeLimitMinutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0}>Không giới hạn thời gian</option>
                  <option value={3}>3 Phút</option>
                  <option value={5}>5 Phút</option>
                  <option value={10}>10 Phút</option>
                </select>
              </div>
            </div>

            {/* Hint Toggle */}
            <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-xs font-semibold text-slate-300">Hiển thị gợi ý Mẹo nhớ / Ví dụ trong lúc thi</span>
              <input
                type="checkbox"
                checked={settings.showHints}
                onChange={(e) => setSettings({ ...settings, showHints: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Start Button */}
            <button
              onClick={generateQuestions}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>Bắt Đầu Làm Bài Kiểm Tra</span>
            </button>
          </div>

          {/* Hanzi Writer Practice Modal */}
          {writingCard && (
            <HanziWriterModal
              isOpen={!!writingCard}
              term={writingCard.term}
              pinyin={writingCard.pinyin}
              definition={writingCard.definition}
              onClose={() => setWritingCard(null)}
            />
          )}
        </div>
      </div>
    );
  }

  // Render Phase 2: Testing Execution
  if (phase === 'testing' && currentQ) {
    const minutes = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <button
            onClick={() => setIsExitConfirmOpen(true)}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thoát thi</span>
          </button>

          <div className="text-center flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400">
              Câu {currentQIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {settings.timeLimitMinutes > 0 && (
              <div className="flex items-center gap-1.5 text-amber-400 font-mono text-xs font-bold bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                <Timer className="w-4 h-4" />
                <span>
                  {minutes}:{secs < 10 ? `0${secs}` : secs}
                </span>
              </div>
            )}
            <button
              onClick={() => setIsTestSettingsOpen(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 cursor-pointer"
              title="Cài đặt nhanh"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center my-auto">
          {/* Question Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-center space-y-4 shadow-xl mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Dạng bài: {currentQ.formatType === 'mcq' ? 'Trắc nghiệm' : currentQ.formatType === 'tf' ? 'Đúng / Sai' : 'Tự luận'}
            </span>

            <div className="space-y-2">
              <h2 className={`text-4xl md:text-5xl font-black text-amber-200 tracking-wide ${currentQ.questionType === 'term' ? 'font-chinese' : ''}`}>
                {currentQ.promptText}
              </h2>
              <p className="text-xs text-slate-400">{currentQ.promptSubtext}</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => speakChinese(currentQ.card.term)}
                  className="p-2 text-indigo-400 hover:text-indigo-200 rounded-full hover:bg-indigo-900/30"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-5 h-5 mx-auto" />
                </button>
                <button
                  onClick={() => setWritingCard(currentQ.card)}
                  className="px-2.5 py-1 text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 rounded-xl border border-rose-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Tập viết nét Hán tự"
                >
                  <PenTool className="w-3.5 h-3.5 text-rose-400" />
                  <span>Viết</span>
                </button>
              </div>
            </div>

            {/* Display hint if enabled */}
            {settings.showHints && currentQ.card.memoryTip && (
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 text-xs text-amber-300 flex items-center justify-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Gợi ý: {currentQ.card.memoryTip}</span>
              </div>
            )}
          </div>

          {/* Answer Inputs based on Format */}
          {currentQ.formatType === 'mcq' && currentQ.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectOption(opt)}
                  className="p-4 bg-slate-900 hover:bg-indigo-900/60 border border-slate-800 hover:border-indigo-500 rounded-2xl text-sm font-semibold text-slate-100 transition-all text-left flex items-center gap-3 cursor-pointer"
                >
                  <span className="w-7 h-7 rounded-xl bg-slate-800 text-indigo-400 font-bold flex items-center justify-center text-xs border border-slate-700">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-chinese">{opt}</span>
                </button>
              ))}
            </div>
          )}

          {currentQ.formatType === 'tf' && (
            <div className="space-y-4 text-center">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Cặp từ ghép:</p>
                <p className="text-lg font-bold text-white">
                  "{currentQ.promptText}" = "{currentQ.tfDisplayedAnswer}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSelectOption('ĐÚNG')}
                  className="py-4 bg-emerald-950/60 hover:bg-emerald-800/80 border border-emerald-700 text-emerald-200 font-bold text-sm rounded-2xl transition-all cursor-pointer"
                >
                  👍 ĐÚNG
                </button>
                <button
                  onClick={() => handleSelectOption('SAI')}
                  className="py-4 bg-rose-950/60 hover:bg-rose-800/80 border border-rose-700 text-rose-200 font-bold text-sm rounded-2xl transition-all cursor-pointer"
                >
                  👎 SAI
                </button>
              </div>
            </div>
          )}

          {currentQ.formatType === 'typing' && (
            <div className="space-y-3">
              <input
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNextTyped()}
                placeholder="Nhập câu trả lời của bạn..."
                className="w-full p-4 bg-slate-900 border border-slate-700 rounded-2xl text-base text-white focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <button
                onClick={handleNextTyped}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Trả lời / Câu tiếp theo ➡️
              </button>
            </div>
          )}
        </div>

        {/* QUICK SETTINGS MODAL */}
        {isTestSettingsOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="font-bold text-white text-sm">
                  <span>Cài Đặt Nhanh Bài Thi</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTestSettingsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                  <span className="font-semibold text-slate-200">Hiển thị gợi ý mẹo nhớ</span>
                  <input
                    type="checkbox"
                    checked={settings.showHints}
                    onChange={(e) => setSettings({ ...settings, showHints: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={() => setIsTestSettingsOpen(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Đóng & Tiếp Tục Làm Bài
              </button>
            </div>
          </div>
        )}

        {/* POPUP XÁC NHẬN HỦY BÀI KIỂM TRA */}
        {isExitConfirmOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
              <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Hủy Bài Kiểm Tra?</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Bạn có muốn hủy làm bài kiểm tra không? Kết quả lượt thi này sẽ không được ghi nhận.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsExitConfirmOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Tiếp Tục Thi
                </button>
                <button
                  onClick={() => {
                    setIsExitConfirmOpen(false);
                    setPhase('settings');
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  Hủy & Thoát
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hanzi Writer Practice Modal */}
        {writingCard && (
          <HanziWriterModal
            isOpen={!!writingCard}
            term={writingCard.term}
            pinyin={writingCard.pinyin}
            definition={writingCard.definition}
            onClose={() => setWritingCard(null)}
          />
        )}
      </div>
    );
  }

  // Render Phase 3: Detailed Results Review
  if (phase === 'results' && finalResult) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Thoát bài kiểm tra</span>
          </button>
          <span className="font-bold text-white text-sm">Kết Quả Bài Kiểm Tra</span>
          <div className="w-16" />
        </div>

        <div className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-6 my-auto">
          {/* Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-center space-y-4 shadow-xl">
            <div className="inline-flex p-4 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
              <Award className="w-12 h-12" />
            </div>

            <div>
              <h2 className="text-3xl font-black text-white">
                Điểm số: <span className="text-emerald-400">{finalResult.scorePercent}%</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Đúng {finalResult.correctCount} / {finalResult.totalQuestions} câu hỏi • Thời gian làm bài:{' '}
                {finalResult.timeSpentSeconds} giây
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPhase('settings')}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>Làm lại bài test</span>
              </button>
              <button
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Quay lại bài học
              </button>
            </div>
          </div>

          {/* Detailed Answers Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-400" />
              <span>Chi tiết đáp án từng câu hỏi:</span>
            </h3>

            <div className="space-y-3">
              {finalResult.answers.map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                    ans.isCorrect
                      ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-100'
                      : 'bg-rose-950/30 border-rose-800/50 text-rose-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-200">
                      Câu {idx + 1}: {ans.questionPrompt}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const matchedCard = cards.find(
                            (c) => c.term === ans.cardTerm || c.id === ans.cardId
                          ) || cards[idx % cards.length];
                          if (matchedCard) setWritingCard(matchedCard);
                        }}
                        className="px-2 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white rounded-lg border border-rose-500/40 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Tập viết từ này"
                      >
                        <PenTool className="w-3 h-3" />
                        <span>Viết</span>
                      </button>
                      {ans.isCorrect ? (
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đúng
                        </span>
                      ) : (
                        <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Sai
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400">Bạn chọn: </span>
                      <strong className={ans.isCorrect ? 'text-emerald-300' : 'text-rose-300'}>
                        {ans.userAnswer}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Đáp án chuẩn: </span>
                      <strong className="text-emerald-300">{ans.correctAnswer}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hanzi Writer Practice Modal */}
        {writingCard && (
          <HanziWriterModal
            isOpen={!!writingCard}
            term={writingCard.term}
            pinyin={writingCard.pinyin}
            definition={writingCard.definition}
            onClose={() => setWritingCard(null)}
          />
        )}
      </div>
    );
  }

  return null;
};
