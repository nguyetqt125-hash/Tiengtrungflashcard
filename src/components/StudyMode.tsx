import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Volume2,
  RotateCw,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Trophy,
  BookOpen,
  Settings,
  X,
  Layers,
  Brain,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Play,
  Pause,
  Check,
  Award,
  Eye,
  Sliders,
  Sparkles,
  Clock,
  RefreshCw,
  AlertTriangle,
  PenTool,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Flashcard, Lesson } from '../types';
import { speakChinese } from '../utils/speech';
import { saveCardProgress, getProgress } from '../utils/storage';
import { recordStudyActivity, getCardMasteryMap } from '../utils/srs';
import { STORAGE_KEYS } from '../constants';
import { HanziWriterModal } from './HanziWriterModal';
import { evaluateAnswer, EvaluationMode } from '../utils/answerChecker';

type MainStudyMode = 'learn' | 'flashcard';

export interface FlashcardSideFields {
  term: boolean;        // Chữ Hán
  pinyin: boolean;      // Phiên âm Pinyin
  definition: boolean;  // Định nghĩa Tiếng Việt
  partOfSpeech: boolean;// Loại từ
  example: boolean;     // Ví dụ ứng dụng
  synonyms: boolean;    // Từ đồng nghĩa
  memoryTip: boolean;   // Mẹo ghi nhớ
}

export type QuestionField = 'term' | 'definition' | 'pinyin' | 'audio';
export type AnswerField = 'term' | 'definition' | 'pinyin';

export type AnswerInputMode = 'multiple_choice' | 'type_input' | 'mixed';

interface StudyModeProps {
  lesson: Lesson;
  cards: Flashcard[];
  onClose: () => void;
}

interface CardMasteryState {
  level: number; // 0 = Chưa thuộc (Hộp 1 - 1 ngày), 1 = Đang học (Hộp 2 - 3 ngày), 2 = Đã thuộc (Hộp 3 - 7 ngày)
  correctInRow: number;
  lastReviewedAt?: number;
}

export const StudyMode: React.FC<StudyModeProps> = ({ lesson, cards, onClose }) => {
  const [mainMode, setMainMode] = useState<MainStudyMode>('learn');

  // Confirmation modal on exit
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

  // ==========================================
  // SEPARATED PERSISTENT SETTINGS STATE
  // ==========================================
  const [isLearnSettingsOpen, setIsLearnSettingsOpen] = useState(false);
  const [isFlashcardSettingsOpen, setIsFlashcardSettingsOpen] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  // Spaced Repetition System (Lặp lại ngắt quãng) State
  const [isSrsEnabled, setIsSrsEnabled] = useState(true);
  const [srsFilter, setSrsFilter] = useState<'all' | 'due' | 'box1' | 'box2' | 'box3'>('all');

  // Flashcard Settings (Customizable Checkboxes for Front & Back sides)
  const [flashcardFrontFields, setFlashcardFrontFields] = useState<FlashcardSideFields>({
    term: true,
    pinyin: true,
    definition: false,
    partOfSpeech: true,
    example: false,
    synonyms: false,
    memoryTip: false,
  });

  const [flashcardBackFields, setFlashcardBackFields] = useState<FlashcardSideFields>({
    term: true,
    pinyin: true,
    definition: true,
    partOfSpeech: true,
    example: true,
    synonyms: true,
    memoryTip: true,
  });

  // Smart Learn Settings
  const [questionFields, setQuestionFields] = useState<Record<QuestionField, boolean>>({
    term: true,
    definition: true,
    pinyin: true,
    audio: true,
  });

  const [answerFields, setAnswerFields] = useState<Record<AnswerField, boolean>>({
    term: true,
    definition: true,
    pinyin: true,
  });

  const [answerInputMode, setAnswerInputMode] = useState<AnswerInputMode>('multiple_choice');
  const [evaluationMode, setEvaluationMode] = useState<EvaluationMode>('flexible');
  const [writingCard, setWritingCard] = useState<Flashcard | null>(null);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.flashcardFrontFields) setFlashcardFrontFields(parsed.flashcardFrontFields);
        if (parsed.flashcardBackFields) setFlashcardBackFields(parsed.flashcardBackFields);
        if (parsed.questionFields) setQuestionFields(parsed.questionFields);
        if (parsed.answerFields) setAnswerFields(parsed.answerFields);
        if (parsed.answerInputMode) setAnswerInputMode(parsed.answerInputMode);
        if (parsed.evaluationMode) setEvaluationMode(parsed.evaluationMode);
        if (typeof parsed.autoSpeak === 'boolean') setAutoSpeak(parsed.autoSpeak);
        if (typeof parsed.isSrsEnabled === 'boolean') setIsSrsEnabled(parsed.isSrsEnabled);
      }
    } catch (e) {
      console.error('Error loading study settings:', e);
    }
  }, []);

  // Save settings when changed
  const saveSettingsToStorage = (
    frontFields: FlashcardSideFields,
    backFields: FlashcardSideFields,
    qFields: Record<QuestionField, boolean>,
    aFields: Record<AnswerField, boolean>,
    ansMode: AnswerInputMode,
    speak: boolean,
    srs: boolean,
    evalMode: EvaluationMode = evaluationMode
  ) => {
    try {
      const payload = {
        flashcardFrontFields: frontFields,
        flashcardBackFields: backFields,
        questionFields: qFields,
        answerFields: aFields,
        answerInputMode: ansMode,
        evaluationMode: evalMode,
        autoSpeak: speak,
        isSrsEnabled: srs,
      };
      localStorage.setItem(STORAGE_KEYS.STUDY_SETTINGS, JSON.stringify(payload));
    } catch (e) {
      console.error('Error saving study settings:', e);
    }
  };

  // Field updates helpers
  const updateFrontField = (field: keyof FlashcardSideFields, value: boolean) => {
    const updated = { ...flashcardFrontFields, [field]: value };
    setFlashcardFrontFields(updated);
    saveSettingsToStorage(updated, flashcardBackFields, questionFields, answerFields, answerInputMode, autoSpeak, isSrsEnabled);
  };

  const updateBackField = (field: keyof FlashcardSideFields, value: boolean) => {
    const updated = { ...flashcardBackFields, [field]: value };
    setFlashcardBackFields(updated);
    saveSettingsToStorage(flashcardFrontFields, updated, questionFields, answerFields, answerInputMode, autoSpeak, isSrsEnabled);
  };

  const toggleAllSideFields = (side: 'front' | 'back', value: boolean) => {
    const allFields: FlashcardSideFields = {
      term: value,
      pinyin: value,
      definition: value,
      partOfSpeech: value,
      example: value,
      synonyms: value,
      memoryTip: value,
    };
    if (side === 'front') {
      setFlashcardFrontFields(allFields);
      saveSettingsToStorage(allFields, flashcardBackFields, questionFields, answerFields, answerInputMode, autoSpeak, isSrsEnabled);
    } else {
      setFlashcardBackFields(allFields);
      saveSettingsToStorage(flashcardFrontFields, allFields, questionFields, answerFields, answerInputMode, autoSpeak, isSrsEnabled);
    }
  };

  const applyPresetFlashcardFields = (preset: 'hanzi_to_vi' | 'pinyin_to_hanzi' | 'vi_to_hanzi' | 'show_all') => {
    let front: FlashcardSideFields;
    let back: FlashcardSideFields;

    if (preset === 'hanzi_to_vi') {
      front = { term: true, pinyin: false, definition: false, partOfSpeech: true, example: false, synonyms: false, memoryTip: false };
      back = { term: true, pinyin: true, definition: true, partOfSpeech: true, example: true, synonyms: true, memoryTip: true };
    } else if (preset === 'pinyin_to_hanzi') {
      front = { term: false, pinyin: true, definition: false, partOfSpeech: false, example: false, synonyms: false, memoryTip: false };
      back = { term: true, pinyin: true, definition: true, partOfSpeech: true, example: true, synonyms: true, memoryTip: true };
    } else if (preset === 'vi_to_hanzi') {
      front = { term: false, pinyin: false, definition: true, partOfSpeech: false, example: false, synonyms: false, memoryTip: false };
      back = { term: true, pinyin: true, definition: true, partOfSpeech: true, example: true, synonyms: true, memoryTip: true };
    } else {
      front = { term: true, pinyin: true, definition: true, partOfSpeech: true, example: true, synonyms: true, memoryTip: true };
      back = { term: true, pinyin: true, definition: true, partOfSpeech: true, example: true, synonyms: true, memoryTip: true };
    }

    setFlashcardFrontFields(front);
    setFlashcardBackFields(back);
    saveSettingsToStorage(front, back, questionFields, answerFields, answerInputMode, autoSpeak, isSrsEnabled);
  };

  // Smart Learn Field Helpers
  const toggleAllQuestionFields = (value: boolean) => {
    const updated: Record<QuestionField, boolean> = {
      term: value,
      definition: value,
      pinyin: value,
      audio: value,
    };
    setQuestionFields(updated);
    saveSettingsToStorage(flashcardFrontFields, flashcardBackFields, updated, answerFields, answerInputMode, autoSpeak, isSrsEnabled);
  };

  const toggleAllAnswerFields = (value: boolean) => {
    const updated: Record<AnswerField, boolean> = {
      term: value,
      definition: value,
      pinyin: value,
    };
    setAnswerFields(updated);
    saveSettingsToStorage(flashcardFrontFields, flashcardBackFields, questionFields, updated, answerInputMode, autoSpeak, isSrsEnabled);
  };

  const updateQuestionField = (field: QuestionField, value: boolean) => {
    const updated = { ...questionFields, [field]: value };
    if (!value && Object.values(updated).filter(Boolean).length === 0) return;
    setQuestionFields(updated);
    saveSettingsToStorage(flashcardFrontFields, flashcardBackFields, updated, answerFields, answerInputMode, autoSpeak, isSrsEnabled);
  };

  const updateAnswerField = (field: AnswerField, value: boolean) => {
    const updated = { ...answerFields, [field]: value };
    if (!value && Object.values(updated).filter(Boolean).length === 0) return;
    setAnswerFields(updated);
    saveSettingsToStorage(flashcardFrontFields, flashcardBackFields, questionFields, updated, answerInputMode, autoSpeak, isSrsEnabled);
  };

  // ==========================================
  // FLASHCARD MODE STATE
  // ==========================================
  const [fcIndex, setFcIndex] = useState(0);
  const [isFcFlipped, setIsFcFlipped] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // ==========================================
  // QUIZLET SMART LEARN MODE STATE
  // ==========================================
  const [cardMastery, setCardMastery] = useState<Record<string, CardMasteryState>>({});
  const [currentLearnCard, setCurrentLearnCard] = useState<Flashcard | null>(null);
  const [seenCardIds, setSeenCardIds] = useState<string[]>([]);
  const [lastShownCardId, setLastShownCardId] = useState<string | null>(null);
  const [currentQuestionField, setCurrentQuestionField] = useState<QuestionField>('term');
  const [currentAnswerField, setCurrentAnswerField] = useState<AnswerField>('definition');
  const [isTypeInputCurrent, setIsTypeInputCurrent] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);

  // Reset seen queue when cards prop changes
  useEffect(() => {
    setSeenCardIds([]);
    setLastShownCardId(null);
  }, [cards]);

  // Filtered Cards for Flashcards based on SRS filter
  const displayedCards = useMemo(() => {
    if (!isSrsEnabled || srsFilter === 'all') return cards;
    if (srsFilter === 'box1') return cards.filter((c) => (cardMastery[c.id]?.level ?? 0) === 0);
    if (srsFilter === 'box2') return cards.filter((c) => (cardMastery[c.id]?.level ?? 0) === 1);
    if (srsFilter === 'box3') return cards.filter((c) => (cardMastery[c.id]?.level ?? 0) === 2);
    if (srsFilter === 'due') return cards.filter((c) => (cardMastery[c.id]?.level ?? 0) < 2);
    return cards;
  }, [cards, isSrsEnabled, srsFilter, cardMastery]);

  useEffect(() => {
    if (fcIndex >= displayedCards.length) {
      setFcIndex(0);
    }
  }, [displayedCards.length, fcIndex]);

  // Handle Flashcard Spaced Repetition Rating
  const handleFlashcardSrsRate = (cardId: string, level: number) => {
    const updatedMastery = { ...cardMastery };
    updatedMastery[cardId] = {
      level,
      correctInRow: level,
      lastReviewedAt: Date.now(),
    };
    setCardMastery(updatedMastery);
    saveCardProgress(cardId, level === 2 ? 'mastered' : level === 1 ? 'learning' : 'unlearned');
    try {
      localStorage.setItem('chinese_flashcard_mastery', JSON.stringify(updatedMastery));
      window.dispatchEvent(new CustomEvent('srs-updated', { detail: { cardId, level } }));
    } catch (e) {
      console.error(e);
    }

    setIsFcFlipped(false);
    if (displayedCards.length > 0) {
      setFcIndex((idx) => (idx + 1) % displayedCards.length);
    }
  };
  // Initialize mastery & progress
  useEffect(() => {
    const refreshMastery = () => {
      const progressMap = getProgress();
      const srsMasteryMap = getCardMasteryMap();
      const initialMastery: Record<string, CardMasteryState> = {};

      cards.forEach((card) => {
        if (srsMasteryMap[card.id] !== undefined) {
          initialMastery[card.id] = srsMasteryMap[card.id];
        } else {
          const p = progressMap[card.id];
          if (p?.status === 'mastered') {
            initialMastery[card.id] = { level: 2, correctInRow: 2, lastReviewedAt: Date.now() };
          } else if (p?.status === 'learning') {
            initialMastery[card.id] = { level: 1, correctInRow: 1, lastReviewedAt: Date.now() };
          } else {
            initialMastery[card.id] = { level: 0, correctInRow: 0, lastReviewedAt: Date.now() };
          }
        }
      });

      setCardMastery(initialMastery);
    };

    refreshMastery();
    recordStudyActivity();

    window.addEventListener('srs-updated', refreshMastery);
    window.addEventListener('storage', refreshMastery);
    return () => {
      window.removeEventListener('srs-updated', refreshMastery);
      window.removeEventListener('storage', refreshMastery);
    };
  }, [cards]);

  // Flashcard auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlaying && cards.length > 0) {
      timer = setInterval(() => {
        setIsFcFlipped((prev) => {
          if (!prev) {
            return true;
          } else {
            setFcIndex((idx) => (idx + 1) % cards.length);
            return false;
          }
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, cards.length]);

  // Handle Speech when card changes in Flashcard mode
  useEffect(() => {
    if (mainMode === 'flashcard' && cards[fcIndex] && autoSpeak && !isFcFlipped) {
      speakChinese(cards[fcIndex].term);
    }
  }, [fcIndex, mainMode, autoSpeak, isFcFlipped, cards]);

  // ==========================================
  // QUIZLET LEARN ENGINE LOGIC
  // ==========================================
  const getFieldLabel = (field: QuestionField | AnswerField): string => {
    switch (field) {
      case 'term':
        return 'Chữ Hán';
      case 'definition':
        return 'Tiếng Việt';
      case 'pinyin':
        return 'Pinyin';
      case 'audio':
        return 'Âm thanh';
      default:
        return '';
    }
  };

  const getTargetAnswerValue = (card: Flashcard, aField: AnswerField): string => {
    if (aField === 'term') return card.term;
    if (aField === 'definition') return card.definition;
    if (aField === 'pinyin') return card.pinyin || card.definition;
    return card.term;
  };

  const generateNextLearnQuestion = (currentMasteryState?: Record<string, CardMasteryState>) => {
    if (cards.length === 0) return;

    const masteryToUse = currentMasteryState || cardMastery;
    const unmastered = cards.filter((c) => (masteryToUse[c.id]?.level || 0) < 2);

    if (unmastered.length === 0) {
      setCurrentLearnCard(null);
      triggerConfetti();
      return;
    }

    // Filter unmastered cards that have not been seen in the current cycle yet
    const unseenCards = unmastered.filter((c) => !seenCardIds.includes(c.id));

    let targetCard: Flashcard;

    if (unseenCards.length > 0) {
      // Prioritize new cards that haven't appeared yet!
      targetCard = unseenCards[Math.floor(Math.random() * unseenCards.length)];
    } else {
      // All cards have been presented at least once. Now review remaining unmastered cards.
      // Avoid repeating the exact last shown card if there are multiple unmastered cards available.
      const candidates = unmastered.filter((c) => unmastered.length <= 1 || c.id !== lastShownCardId);
      targetCard = candidates[Math.floor(Math.random() * candidates.length)];
    }

    setSeenCardIds((prev) => (prev.includes(targetCard.id) ? prev : [...prev, targetCard.id]));
    setLastShownCardId(targetCard.id);

    setCurrentLearnCard(targetCard);

    // Pick a random question field from enabled question fields
    const activeQFields = (Object.keys(questionFields) as QuestionField[]).filter((k) => questionFields[k]);
    const qField = activeQFields.length > 0
      ? activeQFields[Math.floor(Math.random() * activeQFields.length)]
      : 'term';

    // Pick a random answer field from enabled answer fields such that aField !== qField
    const activeAFields = (Object.keys(answerFields) as AnswerField[]).filter((k) => answerFields[k]);
    let candidateAFields = activeAFields.filter((a) => a !== (qField as unknown as AnswerField));

    // If no candidate available (e.g. user selected identical single fields), fallback to any different answer field
    if (candidateAFields.length === 0) {
      const allAFields: AnswerField[] = ['term', 'definition', 'pinyin'];
      candidateAFields = allAFields.filter((a) => a !== (qField as unknown as AnswerField));
    }

    const aField = candidateAFields[Math.floor(Math.random() * candidateAFields.length)];

    setCurrentQuestionField(qField);
    setCurrentAnswerField(aField);

    let useTypeInput = false;
    if (answerInputMode === 'type_input') {
      useTypeInput = true;
    } else if (answerInputMode === 'mixed') {
      useTypeInput = Math.random() > 0.5;
    }
    setIsTypeInputCurrent(useTypeInput);

    const correctAnswer = getTargetAnswerValue(targetCard, aField);

    const distractorPool: string[] = [];
    cards.forEach((c) => {
      if (c.id !== targetCard.id) {
        const val = getTargetAnswerValue(c, aField);
        if (val && !distractorPool.includes(val) && val !== correctAnswer) {
          distractorPool.push(val);
        }
      }
    });

    const fallbackDistractors =
      aField === 'term'
        ? ['你好', '谢谢', '再见', '学习', '朋友', '老师']
        : aField === 'pinyin'
        ? ['nǐ hǎo', 'xiè xie', 'zài jiàn', 'xué xí', 'péng you', 'lǎo shī']
        : ['Xin chào', 'Cảm ơn', 'Tạm biệt', 'Học tập', 'Bạn bè', 'Thầy giáo'];

    while (distractorPool.length < 3) {
      const fb = fallbackDistractors[Math.floor(Math.random() * fallbackDistractors.length)];
      if (!distractorPool.includes(fb) && fb !== correctAnswer) {
        distractorPool.push(fb);
      }
    }

    const shuffledDistractors = distractorPool.sort(() => 0.5 - Math.random()).slice(0, 3);
    const finalOptions = [...shuffledDistractors, correctAnswer].sort(() => 0.5 - Math.random());

    setOptions(finalOptions);
    setSelectedOption(null);
    setTypedAnswer('');
    setIsAnswerSubmitted(false);
    setIsCorrectAnswer(null);

    if (autoSpeak || qField === 'audio') {
      speakChinese(targetCard.term);
    }
  };

  useEffect(() => {
    if (mainMode === 'learn' && Object.keys(cardMastery).length > 0 && !currentLearnCard) {
      generateNextLearnQuestion(cardMastery);
    }
  }, [mainMode, cardMastery]);

  const handleEvaluateAnswer = (submittedVal: string) => {
    if (isAnswerSubmitted || !currentLearnCard) return;

    setIsAnswerSubmitted(true);

    const correctVal = getTargetAnswerValue(currentLearnCard, currentAnswerField);

    const isRight = evaluateAnswer(submittedVal, correctVal, evaluationMode, {
      term: currentLearnCard.term,
      pinyin: currentLearnCard.pinyin,
      definition: currentLearnCard.definition,
      synonyms: currentLearnCard.synonyms,
    });
    setIsCorrectAnswer(isRight);

    const currentCardState = cardMastery[currentLearnCard.id] || { level: 0, correctInRow: 0 };
    const updatedMastery = { ...cardMastery };

    if (isRight) {
      const newLevel = Math.min(2, currentCardState.level + 1);
      updatedMastery[currentLearnCard.id] = {
        level: newLevel,
        correctInRow: currentCardState.correctInRow + 1,
        lastReviewedAt: Date.now(),
      };
      saveCardProgress(currentLearnCard.id, newLevel === 2 ? 'mastered' : 'learning');
    } else {
      updatedMastery[currentLearnCard.id] = {
        level: 0,
        correctInRow: 0,
        lastReviewedAt: Date.now(),
      };
      saveCardProgress(currentLearnCard.id, 'unlearned');
    }

    setCardMastery(updatedMastery);
    try {
      localStorage.setItem('chinese_flashcard_mastery', JSON.stringify(updatedMastery));
      window.dispatchEvent(new CustomEvent('srs-updated', { detail: { cardId: currentLearnCard.id } }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleIDontKnow = () => {
    if (!currentLearnCard) return;
    setIsAnswerSubmitted(true);
    setIsCorrectAnswer(false);
    setSelectedOption('Tôi không biết');

    const updatedMastery = {
      ...cardMastery,
      [currentLearnCard.id]: {
        level: 0,
        correctInRow: 0,
        lastReviewedAt: Date.now(),
      },
    };
    setCardMastery(updatedMastery);
    saveCardProgress(currentLearnCard.id, 'unlearned');
    try {
      localStorage.setItem('chinese_flashcard_mastery', JSON.stringify(updatedMastery));
      window.dispatchEvent(new CustomEvent('srs-updated', { detail: { cardId: currentLearnCard.id } }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleIWasRight = () => {
    if (!currentLearnCard) return;
    setIsAnswerSubmitted(true);
    setIsCorrectAnswer(true);

    const currentCardState = cardMastery[currentLearnCard.id] || { level: 0, correctInRow: 0 };
    const newLevel = Math.min(2, currentCardState.level + 1);
    const updatedMastery = {
      ...cardMastery,
      [currentLearnCard.id]: {
        level: newLevel,
        correctInRow: currentCardState.correctInRow + 1,
        lastReviewedAt: Date.now(),
      },
    };
    setCardMastery(updatedMastery);
    saveCardProgress(currentLearnCard.id, newLevel === 2 ? 'mastered' : 'learning');
    try {
      localStorage.setItem('chinese_flashcard_mastery', JSON.stringify(updatedMastery));
      window.dispatchEvent(new CustomEvent('srs-updated', { detail: { cardId: currentLearnCard.id } }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
    handleEvaluateAnswer(option);
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedAnswer.trim()) return;
    handleEvaluateAnswer(typedAnswer);
  };

  const triggerConfetti = () => {
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

  const handleResetMastery = () => {
    const resetMastery: Record<string, CardMasteryState> = {};
    cards.forEach((card) => {
      resetMastery[card.id] = { level: 0, correctInRow: 0, lastReviewedAt: Date.now() };
      saveCardProgress(card.id, 'unlearned');
    });
    setSeenCardIds([]);
    setLastShownCardId(null);
    setCardMastery(resetMastery);
    try {
      localStorage.setItem('chinese_flashcard_mastery', JSON.stringify(resetMastery));
    } catch (e) {
      console.error(e);
    }
    generateNextLearnQuestion(resetMastery);
  };

  const stats = useMemo(() => {
    let unlearned = 0;
    let learning = 0;
    let mastered = 0;

    cards.forEach((c) => {
      const lvl = cardMastery[c.id]?.level || 0;
      if (lvl === 0) unlearned++;
      else if (lvl === 1) learning++;
      else if (lvl === 2) mastered++;
    });

    // Calculate real-time progress: Level 1 (learning) gives 50% credit, Level 2 (mastered) gives 100% credit
    const percent = cards.length > 0
      ? Math.round(((learning * 0.5 + mastered * 1.0) / cards.length) * 100)
      : 0;

    return { unlearned, learning, mastered, percent };
  }, [cards, cardMastery]);

  if (cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="text-center bg-slate-900 p-8 rounded-3xl border border-slate-800 max-w-md w-full space-y-4">
          <BookOpen className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold">Bài học chưa có từ vựng nào</h2>
          <p className="text-xs text-slate-400">Vui lòng thêm hoặc nhập từ vựng mới vào bài học này để bắt đầu học.</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Quay Lại Bảng Bài Học
          </button>
        </div>
      </div>
    );
  }

  const currentFc = cards[fcIndex];

  // RENDER DYNAMIC FLASHCARD SIDE BASED ON CHECKED FIELDS
  const renderFlashcardSide = (card: Flashcard, fields: FlashcardSideFields, isBack: boolean) => {
    const hasAnyFieldChecked = Object.values(fields).some(Boolean);

    if (!hasAnyFieldChecked) {
      return (
        <div className="text-center p-6 space-y-2 my-auto">
          <p className="text-amber-400 font-bold text-xs sm:text-sm">⚠️ Chưa chọn thông tin hiển thị cho mặt này</p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Vui lòng bấm nút <strong>Cài Đặt</strong> ở trên để chọn thông tin bạn muốn xem ở mặt này.
          </p>
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col items-center justify-center my-auto space-y-3.5 text-center overflow-y-auto max-h-[220px] sm:max-h-[250px] px-1 py-1">
        {/* Badge: Part of Speech */}
        {fields.partOfSpeech && card.partOfSpeech && (
          <span className="px-3 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold text-xs rounded-full border border-indigo-500/30 inline-block shrink-0">
            {card.partOfSpeech}
          </span>
        )}

        {/* Term (Chữ Hán) */}
        {fields.term && card.term && (
          <div className="flex items-center justify-center gap-2 shrink-0 flex-wrap">
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-wide font-chinese">
              {card.term}
            </h1>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setWritingCard(card);
              }}
              className="px-2.5 py-1 bg-rose-600/40 hover:bg-rose-600 text-rose-100 rounded-xl border border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Tập viết Hán tự"
            >
              <PenTool className="w-3.5 h-3.5 text-rose-300" />
              <span>Viết</span>
            </button>
          </div>
        )}

        {/* Pinyin */}
        {fields.pinyin && card.pinyin && (
          <p className="text-xl sm:text-2xl font-mono text-amber-300 font-bold tracking-wider shrink-0">
            [{card.pinyin}]
          </p>
        )}

        {/* Definition (Tiếng Việt) */}
        {fields.definition && card.definition && (
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 leading-tight shrink-0">
            {card.definition}
          </div>
        )}

        {/* Example Sentence */}
        {fields.example && card.example && (
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left w-full max-w-md space-y-1.5 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 block">
                Ví dụ ứng dụng:
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakChinese(card.example);
                }}
                className="px-2 py-0.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-200 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                title="Bấm để nghe đọc ví dụ"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Nghe ví dụ</span>
              </button>
            </div>
            <p className="text-xs text-slate-100 leading-relaxed font-medium font-chinese">{card.example}</p>
          </div>
        )}

        {/* Synonyms */}
        {fields.synonyms && card.synonyms && (
          <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-left w-full max-w-md text-xs shrink-0">
            <span className="text-slate-400 font-bold">Từ đồng nghĩa/liên quan: </span>
            <span className="text-amber-300 font-semibold font-chinese">{card.synonyms}</span>
          </div>
        )}

        {/* Memory Tip */}
        {fields.memoryTip && card.memoryTip && (
          <div className="bg-amber-950/60 border border-amber-800/60 p-2.5 rounded-xl text-left w-full max-w-md text-xs text-amber-200 flex items-start gap-2 shrink-0">
            <span className="shrink-0 text-amber-400 font-bold">💡 Mẹo nhớ:</span>
            <p className="leading-snug">{card.memoryTip}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 overflow-y-auto">
      {/* TOP NAVBAR */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/95 border-b border-slate-800 sticky top-0 z-30">
        <button
          onClick={() => setIsExitConfirmOpen(true)}
          className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát</span>
        </button>

        <div className="text-center">
          <h2 className="text-sm font-black text-white flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>{lesson.name}</span>
          </h2>
          <p className="text-[11px] text-slate-400">Tổng số {cards.length} từ vựng</p>
        </div>

        <div className="w-16 sm:w-20 flex justify-end"></div>
      </div>

      {/* MODE SWITCHER TABS */}
      <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-center gap-3">
        <button
          onClick={() => setMainMode('learn')}
          className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            mainMode === 'learn'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 ring-2 ring-emerald-400/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>1. Ôn Tập Thông Minh (Quizlet)</span>
        </button>

        <button
          onClick={() => setMainMode('flashcard')}
          className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            mainMode === 'flashcard'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 ring-2 ring-indigo-400/30'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Lật Thẻ Flashcard 3D</span>
        </button>
      </div>

      {/* PROGRESS TRACKER BAR */}
      <div className="bg-slate-900 px-6 py-2 border-b border-slate-800/60 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-4 font-bold">
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            Chưa thuộc: {stats.unlearned}
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Đang học: {stats.learning}
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Đã thuộc: {stats.mastered} / {cards.length}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:w-48 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
          <span className="font-extrabold text-emerald-400 text-xs shrink-0">{stats.percent}%</span>
        </div>
      </div>

      {/* ==========================================
          MAIN CONTENT AREA
      ========================================== */}
      <div className="flex-1 p-4 md:p-6 max-w-3xl w-full mx-auto flex flex-col justify-center">
        {/* ==========================================
            MODE 1: QUIZLET SMART LEARN MODE
        ========================================== */}
        {mainMode === 'learn' && (
          <div className="space-y-4">
            {/* Header with settings button inside Learn tab */}
            <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-xs sm:text-sm text-white">Chế Độ Ôn Tập Thông Minh</span>
              </div>
              <button
                onClick={() => setIsLearnSettingsOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 cursor-pointer flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Cài Đặt Ôn Tập</span>
              </button>
            </div>

            {stats.mastered === cards.length ? (
              /* VICTORY CELEBRATION */
              <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-8 text-center space-y-6 shadow-2xl my-auto animate-in zoom-in-95">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 shadow-inner">
                  <Trophy className="w-10 h-10 animate-bounce" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black text-white">🎉 Xuất Sắc! Bạn Đã Thuộc Hết 100%!</h2>
                  <p className="text-slate-300 text-xs md:text-sm max-w-md mx-auto leading-relaxed">
                    Bạn đã hoàn thành thuộc lòng tất cả <strong className="text-emerald-400">{cards.length}</strong> từ vựng trong bài <span className="text-amber-300 font-bold">"{lesson.name}"</span>.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Tổng từ vựng</span>
                    <span className="text-lg font-bold text-white">{cards.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Tỷ lệ thuộc</span>
                    <span className="text-lg font-bold text-emerald-400">100%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Trạng thái</span>
                    <span className="text-lg font-bold text-indigo-400">Thành Thạo</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={handleResetMastery}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Luyện Ôn Lại Bài Này</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Hoàn Thành & Thoát</span>
                  </button>
                </div>
              </div>
            ) : currentLearnCard ? (
              /* ACTIVE QUIZ QUESTION CARD */
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
                {/* Header Question Prompt */}
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Brain className="w-4 h-4" />
                    <span>Học Thông Minh Quizlet</span>
                  </span>
                  <span className="bg-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-300">
                    Thẻ này: {cardMastery[currentLearnCard.id]?.level === 1 ? '🟡 Đang học' : '🔴 Chưa thuộc'}
                  </span>
                </div>

                {/* QUESTION DISPLAY */}
                <div className="text-center py-3 space-y-3">
                  <span className="text-xs font-bold text-indigo-300 block uppercase tracking-wider">
                    Câu hỏi: {getFieldLabel(currentQuestionField)} ➔ Trả lời: {getFieldLabel(currentAnswerField)}
                  </span>

                  <div className="flex items-center justify-center gap-3">
                    {currentQuestionField === 'audio' ? (
                      <button
                        onClick={() => speakChinese(currentLearnCard.term)}
                        className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl border border-emerald-400 transition-all font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg animate-pulse"
                      >
                        <Volume2 className="w-6 h-6" />
                        <span>Bấm Để Nghe Âm Thanh 🔊</span>
                      </button>
                    ) : (
                      <>
                        <h1
                          className={`text-4xl sm:text-6xl font-bold text-white tracking-wide leading-tight ${
                            currentQuestionField === 'term' ? 'font-chinese' : ''
                          }`}
                        >
                          {currentQuestionField === 'definition'
                            ? currentLearnCard.definition
                            : currentQuestionField === 'pinyin'
                            ? currentLearnCard.pinyin || currentLearnCard.term
                            : currentLearnCard.term}
                        </h1>

                        <button
                          onClick={() => speakChinese(currentLearnCard.term)}
                          className="p-3 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-2xl border border-indigo-500/40 transition-colors cursor-pointer"
                          title="Phát âm tiếng Trung"
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setWritingCard(currentLearnCard)}
                          className="p-3 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white rounded-2xl border border-rose-500/40 transition-colors cursor-pointer flex items-center gap-1.5 font-bold text-xs"
                          title="Tập viết nét Hán tự"
                        >
                          <PenTool className="w-5 h-5" />
                          <span className="hidden sm:inline">✍️ Tập viết</span>
                        </button>
                      </>
                    )}
                  </div>

                  {currentQuestionField === 'term' && currentLearnCard.pinyin && (
                    <p className="text-lg font-mono text-amber-300 font-bold">[{currentLearnCard.pinyin}]</p>
                  )}
                </div>

                {/* ANSWER INPUT AREA */}
                {!isTypeInputCurrent ? (
                  /* Multiple Choice */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {options.map((opt, idx) => {
                      let btnStyle = 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700/80';
                      const correctVal = getTargetAnswerValue(currentLearnCard, currentAnswerField);

                      if (isAnswerSubmitted) {
                        if (opt === correctVal) {
                          btnStyle = 'bg-emerald-600 text-white border-emerald-400 font-bold ring-2 ring-emerald-400/50';
                        } else if (opt === selectedOption) {
                          btnStyle = 'bg-rose-600 text-white border-rose-400 font-bold';
                        } else {
                          btnStyle = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-50';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(opt)}
                          disabled={isAnswerSubmitted}
                          className={`p-4 rounded-2xl border text-left font-bold transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 shadow-xs ${
                            currentAnswerField === 'term' ? 'font-chinese text-xl sm:text-2xl' : 'text-base sm:text-lg'
                          } ${btnStyle}`}
                        >
                          <span className="leading-snug">{opt}</span>
                          {isAnswerSubmitted && opt === correctVal && (
                            <Check className="w-5 h-5 text-white shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Fill-in-the-blank */
                  <form onSubmit={handleTypedSubmit} className="space-y-3 pt-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        disabled={isAnswerSubmitted}
                        placeholder={`Gõ ${getFieldLabel(currentAnswerField)}...`}
                        className={`w-full p-4 bg-slate-950 border border-slate-700 rounded-2xl text-white font-bold text-base sm:text-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none ${
                          currentAnswerField === 'term' ? 'font-chinese text-2xl sm:text-3xl' : ''
                        }`}
                      />
                      {!isAnswerSubmitted && (
                        <button
                          type="submit"
                          disabled={!typedAnswer.trim()}
                          className="absolute right-2 top-2 bottom-2 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Gửi Đáp Án
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {/* Quick Action Buttons: Tôi không biết & Tôi đã trả lời đúng */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleIDontKnow}
                    disabled={isAnswerSubmitted}
                    className="flex-1 py-2 px-3 bg-slate-900/80 hover:bg-slate-800 disabled:opacity-50 border border-slate-700/80 hover:border-slate-600 text-slate-300 font-medium text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Tôi ko biết</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleIWasRight}
                    className="flex-1 py-2 px-3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/80 hover:border-emerald-600 text-emerald-300 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Tôi đã trả lời đúng</span>
                  </button>
                </div>

                {/* FEEDBACK & NEXT BUTTON */}
                {isAnswerSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border space-y-3 ${
                      isCorrectAnswer
                        ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                        : 'bg-rose-950/60 border-rose-700/60 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {isCorrectAnswer ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          <span>Chính xác! Bạn ghi nhớ rất tốt!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-400" />
                          <span>Chưa chính xác! Thẻ này sẽ được lặp lại để bạn luyện tập.</span>
                        </>
                      )}
                    </div>

                    <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 text-sm space-y-2 text-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-3xl sm:text-4xl text-amber-300 font-chinese">{currentLearnCard.term}</span>
                        {currentLearnCard.pinyin && (
                          <span className="font-mono text-amber-400 font-bold text-base sm:text-lg">[{currentLearnCard.pinyin}]</span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base">
                        <strong className="text-emerald-400">Nghĩa Tiếng Việt:</strong> {currentLearnCard.definition}
                      </p>
                      {currentLearnCard.example && (
                        <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-800/80">
                          <p className="text-sm sm:text-base text-slate-200 leading-relaxed flex-1 font-chinese">
                            <strong className="text-cyan-400">Ví dụ:</strong> {currentLearnCard.example}
                          </p>
                          <button
                            type="button"
                            onClick={() => speakChinese(currentLearnCard.example)}
                            className="p-1 px-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 text-[11px] font-bold"
                            title="Nghe phát âm ví dụ"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                            <span>Nghe ví dụ</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={generateNextLearnQuestion.bind(null, cardMastery)}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Câu Tiếp Theo ➔</span>
                    </button>
                  </motion.div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* ==========================================
            MODE 2: 3D FLASHCARD FLIP MODE
        ========================================== */}
        {mainMode === 'flashcard' && (displayedCards[fcIndex] || cards[0]) && (
          <div className="space-y-4">
            {/* Flashcard Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-xs sm:text-sm text-white">Lật Thẻ Flashcard 3D</span>
                {isSrsEnabled && (
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-extrabold text-[10px] rounded-full border border-amber-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    Lặp lại ngắt quãng (SRS)
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsFlashcardSettingsOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 cursor-pointer flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Cài Đặt Flashcard</span>
              </button>
            </div>

            {/* SPACED REPETITION FILTER BAR */}
            {isSrsEnabled && (
              <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    Bộ lọc Hộp Lặp Lại Ngắt Quãng (Leitner System):
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Hiển thị {displayedCards.length} / {cards.length} thẻ
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px] font-bold">
                  <button
                    onClick={() => setSrsFilter('all')}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                      srsFilter === 'all'
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Tất cả ({cards.length})
                  </button>
                  <button
                    onClick={() => setSrsFilter('due')}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                      srsFilter === 'due'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Cần ôn ({cards.filter((c) => (cardMastery[c.id]?.level ?? 0) < 2).length})
                  </button>
                  <button
                    onClick={() => setSrsFilter('box1')}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                      srsFilter === 'box1'
                        ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Hộp 1: 1 ngày ({cards.filter((c) => (cardMastery[c.id]?.level ?? 0) === 0).length})
                  </button>
                  <button
                    onClick={() => setSrsFilter('box2')}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                      srsFilter === 'box2'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Hộp 2: 3 ngày ({cards.filter((c) => (cardMastery[c.id]?.level ?? 0) === 1).length})
                  </button>
                  <button
                    onClick={() => setSrsFilter('box3')}
                    className={`p-2 rounded-xl border text-center cursor-pointer transition-all col-span-2 sm:col-span-1 ${
                      srsFilter === 'box3'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Hộp 3: 7 ngày ({cards.filter((c) => (cardMastery[c.id]?.level ?? 0) === 2).length})
                  </button>
                </div>
              </div>
            )}

            {/* Deck Controls */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
              <span>
                Thẻ {displayedCards.length > 0 ? fcIndex + 1 : 0} / {displayedCards.length}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    displayedCards.sort(() => Math.random() - 0.5);
                    setFcIndex(0);
                    setIsFcFlipped(false);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  title="Xáo trộn vị trí thẻ"
                >
                  <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Xáo trộn</span>
                </button>

                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold ${
                    isAutoPlaying ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Tự động lật và chuyển thẻ"
                >
                  {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isAutoPlaying ? 'Dừng Tự Động' : 'Tự Động Chạy'}</span>
                </button>
              </div>
            </div>

            {/* 3D FLIP CARD CANVAS */}
            {displayedCards.length > 0 ? (
              <div
                onClick={() => setIsFcFlipped(!isFcFlipped)}
                className="w-full h-88 sm:h-96 relative cursor-pointer select-none perspective-1000"
              >
                <div
                  className={`w-full h-full relative rounded-3xl transition-transform duration-500 transform-style-3d shadow-2xl ${
                    isFcFlipped ? '[transform:rotateY(180deg)]' : ''
                  }`}
                >
                  {/* FRONT SIDE */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between backface-hidden shadow-2xl">
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="text-indigo-300 font-bold text-xs bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800/80">
                        Mặt Trước
                      </span>
                      {isSrsEnabled && (
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                            (cardMastery[(displayedCards[fcIndex] || cards[0]).id]?.level ?? 0) === 0
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                              : (cardMastery[(displayedCards[fcIndex] || cards[0]).id]?.level ?? 0) === 1
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {(cardMastery[(displayedCards[fcIndex] || cards[0]).id]?.level ?? 0) === 0
                            ? '📦 Hộp 1: Ôn sau 1 ngày'
                            : (cardMastery[(displayedCards[fcIndex] || cards[0]).id]?.level ?? 0) === 1
                            ? '📦 Hộp 2: Ôn sau 3 ngày'
                            : '📦 Hộp 3: Ôn sau 7 ngày'}
                        </span>
                      )}
                      <span className="text-slate-400 text-[11px] font-medium bg-slate-800 px-2.5 py-1 rounded-lg">
                        Lật xem mặt sau 🔄
                      </span>
                    </div>

                    {renderFlashcardSide(displayedCards[fcIndex] || cards[0], flashcardFrontFields, false)}

                    <div className="w-full flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakChinese((displayedCards[fcIndex] || cards[0]).term);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/40 hover:bg-indigo-600 text-indigo-100 rounded-full text-xs font-bold border border-indigo-500/40 transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                          <span>Phát âm</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWritingCard(displayedCards[fcIndex] || cards[0]);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/40 hover:bg-rose-600 text-rose-100 rounded-full text-xs font-bold border border-rose-500/40 transition-colors cursor-pointer"
                          title="Tập viết Hán tự"
                        >
                          <PenTool className="w-3.5 h-3.5 text-rose-300" />
                          <span>Tập viết</span>
                        </button>
                      </div>

                      <span className="text-slate-400 text-[11px] italic">
                        Chạm thẻ để lật
                      </span>
                    </div>
                  </div>

                  {/* BACK SIDE (WITH ROTATE Y 180 DEG TO FIX TEXT MIRRORING) */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between backface-hidden shadow-2xl [transform:rotateY(180deg)]">
                    <div className="flex items-center justify-between w-full text-xs">
                      <span className="text-emerald-300 font-bold text-xs bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/80">
                        Mặt Sau (Đáp án)
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakChinese((displayedCards[fcIndex] || cards[0]).term);
                        }}
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md cursor-pointer transition-colors"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {renderFlashcardSide(displayedCards[fcIndex] || cards[0], flashcardBackFields, true)}

                    <p className="text-slate-400 text-xs italic text-center border-t border-indigo-900/60 pt-2">
                      Chạm thẻ để lật lại mặt trước 🔄
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
                <p className="text-amber-400 font-bold text-sm">Không tìm thấy thẻ nào trong bộ lọc này</p>
                <button
                  onClick={() => setSrsFilter('all')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Xem Tất Cả Thẻ
                </button>
              </div>
            )}

            {/* SPACED REPETITION RATING BUTTONS */}
            {isSrsEnabled && displayedCards.length > 0 && (
              <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-extrabold text-amber-300 block uppercase tracking-wider text-center">
                  Đánh giá mức độ nhớ thẻ này (Lặp lại ngắt quãng):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleFlashcardSrsRate((displayedCards[fcIndex] || cards[0]).id, 0)}
                    className="py-2.5 px-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-200 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer transition-all shadow-md"
                  >
                    <span>🔴 Chưa nhớ</span>
                    <span className="text-[10px] text-rose-400">(1 ngày)</span>
                  </button>
                  <button
                    onClick={() => handleFlashcardSrsRate((displayedCards[fcIndex] || cards[0]).id, 1)}
                    className="py-2.5 px-2 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/80 text-amber-200 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer transition-all shadow-md"
                  >
                    <span>🟡 Tạm nhớ</span>
                    <span className="text-[10px] text-amber-400">(3 ngày)</span>
                  </button>
                  <button
                    onClick={() => handleFlashcardSrsRate((displayedCards[fcIndex] || cards[0]).id, 2)}
                    className="py-2.5 px-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-200 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer transition-all shadow-md"
                  >
                    <span>🟢 Thành thạo</span>
                    <span className="text-[10px] text-emerald-400">(7 ngày)</span>
                  </button>
                </div>
              </div>
            )}

            {/* NAV PREV / NEXT BUTTONS */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <button
                onClick={() => {
                  setFcIndex((idx) => (idx > 0 ? idx - 1 : Math.max(0, displayedCards.length - 1)));
                  setIsFcFlipped(false);
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Thẻ Trước</span>
              </button>

              <button
                onClick={() => {
                  if (displayedCards.length > 0) {
                    setFcIndex((idx) => (idx + 1) % displayedCards.length);
                  }
                  setIsFcFlipped(false);
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
              >
                <span>Thẻ Tiếp Theo</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL 1: CÀI ĐẶT ÔN TẬP THÔNG MINH
      ========================================== */}
      {isLearnSettingsOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl text-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Cài Đặt Ôn Tập</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tùy chỉnh nội dung câu hỏi và đáp án</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLearnSettingsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                {/* HÌNH THỨC TRẢ LỜI */}
                <div className="space-y-1.5">
                  <span className="text-slate-200 font-semibold block text-xs">Hình thức trả lời:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAnswerInputMode('multiple_choice');
                        saveSettingsToStorage(flashcardFrontFields, flashcardBackFields, questionFields, answerFields, 'multiple_choice', autoSpeak, isSrsEnabled);
                      }}
                      className={`p-2.5 rounded-xl text-center border font-semibold text-xs cursor-pointer transition-colors ${
                        answerInputMode === 'multiple_choice'
                          ? 'bg-emerald-600/20 text-emerald-200 border-emerald-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Trắc nghiệm
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAnswerInputMode('type_input');
                        saveSettingsToStorage(flashcardFrontFields, flashcardBackFields, questionFields, answerFields, 'type_input', autoSpeak, isSrsEnabled);
                      }}
                      className={`p-2.5 rounded-xl text-center border font-semibold text-xs cursor-pointer transition-colors ${
                        answerInputMode === 'type_input'
                          ? 'bg-emerald-600/20 text-emerald-200 border-emerald-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Tự gõ từ
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAnswerInputMode('mixed');
                        saveSettingsToStorage(flashcardFrontFields, flashcardBackFields, questionFields, answerFields, 'mixed', autoSpeak, isSrsEnabled);
                      }}
                      className={`p-2.5 rounded-xl text-center border font-semibold text-xs cursor-pointer transition-colors ${
                        answerInputMode === 'mixed'
                          ? 'bg-emerald-600/20 text-emerald-200 border-emerald-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Chọn cả 2 (Xáo trộn)
                    </button>
                  </div>
                </div>

                {/* TÙY CHỌN TRẢ LỜI / ĐÁNH GIÁ ĐÁP ÁN */}
                <div className="space-y-1.5 pt-3 border-t border-slate-800">
                  <span className="text-slate-200 font-semibold block text-xs">Chế độ kiểm tra đáp án:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEvaluationMode('flexible');
                        saveSettingsToStorage(flashcardFrontFields, flashcardBackFields, questionFields, answerFields, answerInputMode, autoSpeak, isSrsEnabled, 'flexible');
                      }}
                      className={`p-2.5 rounded-xl text-left border cursor-pointer transition-colors ${
                        evaluationMode === 'flexible'
                          ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500 font-semibold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">Không cần chặt chẽ (Linh hoạt)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Bỏ qua dấu câu/khoảng trắng, đúng 1 từ chính vẫn tính đúng</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEvaluationMode('strict');
                        saveSettingsToStorage(flashcardFrontFields, flashcardBackFields, questionFields, answerFields, answerInputMode, autoSpeak, isSrsEnabled, 'strict');
                      }}
                      className={`p-2.5 rounded-xl text-left border cursor-pointer transition-colors ${
                        evaluationMode === 'strict'
                          ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500 font-semibold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">Trả lời chặt chẽ</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Yêu cầu khớp chính xác từng ký tự</div>
                    </button>
                  </div>
                </div>

                {/* CHỌN LOẠI CÂU HỎI */}
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200 font-semibold block text-xs">Nội dung đề bài:</span>
                    <label className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Object.values(questionFields).every(Boolean)}
                        onChange={(e) => toggleAllQuestionFields(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-indigo-600 cursor-pointer"
                      />
                      <span>Chọn tất cả</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={questionFields.term}
                        onChange={(e) => updateQuestionField('term', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                      />
                      <span>Chữ Hán</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={questionFields.definition}
                        onChange={(e) => updateQuestionField('definition', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                      />
                      <span>Tiếng Việt</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={questionFields.pinyin}
                        onChange={(e) => updateQuestionField('pinyin', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                      />
                      <span>Pinyin</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={questionFields.audio}
                        onChange={(e) => updateQuestionField('audio', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                      />
                      <span>Âm thanh</span>
                    </label>
                  </div>
                </div>

                {/* CHỌN CÂU TRẢ LỜI */}
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200 font-semibold block text-xs">Nội dung câu trả lời:</span>
                    <label className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Object.values(answerFields).every(Boolean)}
                        onChange={(e) => toggleAllAnswerFields(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-indigo-600 cursor-pointer"
                      />
                      <span>Chọn tất cả</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={answerFields.term}
                        onChange={(e) => updateAnswerField('term', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                      />
                      <span>Chữ Hán</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={answerFields.definition}
                        onChange={(e) => updateAnswerField('definition', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                      />
                      <span>Tiếng Việt</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700">
                      <input
                        type="checkbox"
                        checked={answerFields.pinyin}
                        onChange={(e) => updateAnswerField('pinyin', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                      />
                      <span>Pinyin</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* TÙY CHỌN PHÁT ÂM */}
              <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="font-semibold text-slate-200 block">Tự động đọc phát âm tiếng Trung</span>
                  <span className="text-[11px] text-slate-400">Đọc phát âm khi xuất hiện từ mới</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => {
                    setAutoSpeak(e.target.checked);
                    saveSettingsToStorage(flashcardFrontFields, flashcardBackFields, questionFields, answerFields, answerInputMode, e.target.checked, isSrsEnabled);
                  }}
                  className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => setIsLearnSettingsOpen(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
            >
              Lưu & Áp Dụng
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: CÀI ĐẶT LẬT THẺ FLASHCARD & LẶP LẠI NGẮT QUÃNG
      ========================================== */}
      {isFlashcardSettingsOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Cài Đặt Thẻ Flashcard</h3>
                <p className="text-xs text-slate-400 mt-0.5">Cấu hình lật thẻ và chu kỳ lặp lại ngắt quãng (SRS)</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFlashcardSettingsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* CHỨC NĂNG HỌC LẶP LẠI NGẮT QUÃNG (SPACED REPETITION) */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-semibold text-slate-200 text-xs">
                    Lặp lại ngắt quãng (Spaced Repetition / Leitner)
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSrsEnabled}
                      onChange={(e) => {
                        setIsSrsEnabled(e.target.checked);
                        saveSettingsToStorage(flashcardFrontFields, flashcardBackFields, questionFields, answerFields, answerInputMode, autoSpeak, e.target.checked);
                      }}
                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                    />
                    <span className="font-semibold text-indigo-300">Kích hoạt SRS</span>
                  </label>
                </div>

                <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
                  <p className="text-slate-400">
                    Hệ thống tự động phân loại thẻ theo 3 mức độ nhớ để tối ưu chu kỳ ôn tập:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-medium">
                    <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-300">
                      <span className="font-semibold block text-rose-400">Chưa nhớ (Hộp 1)</span>
                      <span className="text-slate-400 text-[10px]">Ôn lại sau 1 ngày</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-300">
                      <span className="font-semibold block text-amber-400">Tạm nhớ (Hộp 2)</span>
                      <span className="text-slate-400 text-[10px]">Ôn lại sau 3 ngày</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-300">
                      <span className="font-semibold block text-emerald-400">Thành thạo (Hộp 3)</span>
                      <span className="text-slate-400 text-[10px]">Ôn lại sau 7 ngày</span>
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetMastery}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-medium text-[11px] cursor-pointer transition-colors"
                  >
                    Đặt lại tất cả thẻ về Hộp 1
                  </button>
                </div>
              </div>

              {/* TÙY CHỌN MẶT TRƯỚC VÀ MẶT SAU THẺ FLASHCARD */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="border-b border-slate-800 pb-2">
                  <span className="font-semibold text-slate-200 text-xs block">
                    Nội dung hiển thị trên 2 mặt thẻ
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 block">Thiết lập nhanh:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPresetFlashcardFields('hanzi_to_vi')}
                      className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-medium text-slate-200 cursor-pointer text-center hover:border-slate-700 transition-colors"
                    >
                      Hán tự ➔ Nghĩa + Pinyin
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetFlashcardFields('pinyin_to_hanzi')}
                      className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-medium text-slate-200 cursor-pointer text-center hover:border-slate-700 transition-colors"
                    >
                      Pinyin ➔ Hán tự + Nghĩa
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetFlashcardFields('vi_to_hanzi')}
                      className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-medium text-slate-200 cursor-pointer text-center hover:border-slate-700 transition-colors"
                    >
                      Tiếng Việt ➔ Hán tự
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetFlashcardFields('show_all')}
                      className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-medium text-slate-200 cursor-pointer text-center hover:border-slate-700 transition-colors"
                    >
                      Hiển thị tất cả
                    </button>
                  </div>
                </div>

                {/* 2-COLUMN CHECKBOXES: FRONT & BACK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* FRONT SIDE PANEL */}
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-semibold text-indigo-300 text-xs">
                        Mặt trước thẻ:
                      </span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => toggleAllSideFields('front', true)}
                          className="text-indigo-300 hover:underline cursor-pointer"
                        >
                          Tất cả
                        </button>
                        <span className="text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={() => toggleAllSideFields('front', false)}
                          className="text-slate-400 hover:underline cursor-pointer"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={flashcardFrontFields.term}
                          onChange={(e) => updateFrontField('term', e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                        />
                        <span>Chữ Hán (Term)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={flashcardFrontFields.pinyin}
                          onChange={(e) => updateFrontField('pinyin', e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                        />
                        <span>Phiên Âm (Pinyin)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={flashcardFrontFields.definition}
                          onChange={(e) => updateFrontField('definition', e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                        />
                        <span>Định Nghĩa (Tiếng Việt)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={flashcardFrontFields.partOfSpeech}
                          onChange={(e) => updateFrontField('partOfSpeech', e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                        />
                        <span>Loại Từ (Part of Speech)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={flashcardFrontFields.example}
                          onChange={(e) => updateFrontField('example', e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                        />
                        <span>Ví Dụ Cụ Thể (Example)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={flashcardFrontFields.synonyms}
                          onChange={(e) => updateFrontField('synonyms', e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                        />
                        <span>Từ Đồng Nghĩa (Synonyms)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={flashcardFrontFields.memoryTip}
                          onChange={(e) => updateFrontField('memoryTip', e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                        />
                        <span>Mẹo Ghi Nhớ (Memory Tip)</span>
                      </label>
                    </div>
                  </div>

                  {/* BACK SIDE PANEL */}
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-semibold text-emerald-300 text-xs">
                        Mặt sau thẻ:
                      </span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => toggleAllSideFields('back', true)}
                          className="text-emerald-300 hover:underline cursor-pointer"
                        >
                          Tất cả
                        </button>
                        <span className="text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={() => toggleAllSideFields('back', false)}
                          className="text-slate-400 hover:underline cursor-pointer"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={flashcardBackFields.term}
                          onChange={(e) => updateBackField('term', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                        />
                        <span>Chữ Hán (Term)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={flashcardBackFields.pinyin}
                          onChange={(e) => updateBackField('pinyin', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                        />
                        <span>Phiên Âm (Pinyin)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={flashcardBackFields.definition}
                          onChange={(e) => updateBackField('definition', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                        />
                        <span>Định Nghĩa (Tiếng Việt)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={flashcardBackFields.partOfSpeech}
                          onChange={(e) => updateBackField('partOfSpeech', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                        />
                        <span>Loại Từ (Part of Speech)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={flashcardBackFields.example}
                          onChange={(e) => updateBackField('example', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                        />
                        <span>Ví Dụ Cụ Thể (Example)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={flashcardBackFields.synonyms}
                          onChange={(e) => updateBackField('synonyms', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                        />
                        <span>Từ Đồng Nghĩa (Synonyms)</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={flashcardBackFields.memoryTip}
                          onChange={(e) => updateBackField('memoryTip', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                        />
                        <span>Mẹo Ghi Nhớ (Memory Tip)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* TÙY CHỌN PHÁT ÂM */}
              <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <span className="font-bold text-white block">Tự động đọc phát âm khi lật hoặc chuyển thẻ</span>
                  <span className="text-[11px] text-slate-400">Đọc phát âm chuẩn giọng Trung Quốc</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => {
                    setAutoSpeak(e.target.checked);
                    saveSettingsToStorage(flashcardFrontFields, flashcardBackFields, questionFields, answerFields, answerInputMode, e.target.checked, isSrsEnabled);
                  }}
                  className="w-5 h-5 rounded text-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => setIsFlashcardSettingsOpen(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
            >
              Áp Dụng & Tiếp Tục Học Flashcard
            </button>
          </div>
        </div>
      )}

      {/* POPUP XÁC NHẬN THOÁT KHỎI CHẾ ĐỘ ÔN TẬP */}
      {isExitConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Xác Nhận Thoát Ôn Tập</h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Bạn có chắc chắn muốn thoát khỏi phiên học không? Tiến trình ôn tập của bạn đã được lưu tự động.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsExitConfirmOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                Tiếp Tục Học
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
              >
                Xác Nhận Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HANZI WRITER STROKE ORDER & INTERACTIVE QUIZ MODAL */}
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
};
