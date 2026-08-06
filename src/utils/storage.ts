import { Course, Lesson, Flashcard, CardProgress, TestResult } from '../types';
import { INITIAL_COURSES, INITIAL_LESSONS, INITIAL_FLASHCARDS } from '../data/initialData';
import { STORAGE_KEYS } from '../constants';
import { triggerAutoSync } from './googleSheetSync';

const KEYS = STORAGE_KEYS;

// Initialize default storage if empty
export const initializeStorage = () => {
  if (localStorage.getItem(KEYS.COURSES) === null) {
    localStorage.setItem(KEYS.COURSES, JSON.stringify(INITIAL_COURSES));
  }
  if (localStorage.getItem(KEYS.LESSONS) === null) {
    localStorage.setItem(KEYS.LESSONS, JSON.stringify(INITIAL_LESSONS));
  }
  if (localStorage.getItem(KEYS.CARDS) === null) {
    localStorage.setItem(KEYS.CARDS, JSON.stringify(INITIAL_FLASHCARDS));
  }
};

// Courses CRUD
export const getCourses = (): Course[] => {
  initializeStorage();
  try {
    const data = localStorage.getItem(KEYS.COURSES);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveCourses = (courses: Course[]) => {
  localStorage.setItem(KEYS.COURSES, JSON.stringify(courses));
  triggerAutoSync();
};

export const deleteCourse = (courseId: string) => {
  const courses = getCourses().filter((c) => c.id !== courseId);
  const lessons = getLessons();
  const deletedLessonIds = lessons.filter((l) => l.courseId === courseId).map((l) => l.id);
  const remainingLessons = lessons.filter((l) => l.courseId !== courseId);

  const cards = getCards();
  const remainingCards = cards.filter((card) => !deletedLessonIds.includes(card.lessonId));

  localStorage.setItem(KEYS.COURSES, JSON.stringify(courses));
  localStorage.setItem(KEYS.LESSONS, JSON.stringify(remainingLessons));
  localStorage.setItem(KEYS.CARDS, JSON.stringify(remainingCards));

  triggerAutoSync();
};

// Lessons CRUD
export const getLessons = (): Lesson[] => {
  initializeStorage();
  try {
    const data = localStorage.getItem(KEYS.LESSONS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveLessons = (lessons: Lesson[]) => {
  localStorage.setItem(KEYS.LESSONS, JSON.stringify(lessons));
  triggerAutoSync();
};

export const deleteLesson = (lessonId: string) => {
  const lessons = getLessons().filter((l) => l.id !== lessonId);
  const cards = getCards();
  const remainingCards = cards.filter((card) => card.lessonId !== lessonId);

  localStorage.setItem(KEYS.LESSONS, JSON.stringify(lessons));
  localStorage.setItem(KEYS.CARDS, JSON.stringify(remainingCards));

  triggerAutoSync();
};

// Cards CRUD
export const getCards = (): Flashcard[] => {
  initializeStorage();
  try {
    const data = localStorage.getItem(KEYS.CARDS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveCards = (cards: Flashcard[]) => {
  localStorage.setItem(KEYS.CARDS, JSON.stringify(cards));
  triggerAutoSync();
};

export const addCardsBatch = (newCards: Flashcard[]) => {
  const existingCards = getCards();
  const updated = [...existingCards, ...newCards];
  saveCards(updated);
};

export const deleteCard = (cardId: string) => {
  const cards = getCards().filter((c) => c.id !== cardId);
  saveCards(cards);
};

export const deleteCardsBatch = (cardIds: string[]) => {
  const set = new Set(cardIds);
  const cards = getCards().filter((c) => !set.has(c.id));
  saveCards(cards);
};

// Progress
export const getProgress = (): Record<string, CardProgress> => {
  try {
    const data = localStorage.getItem(KEYS.PROGRESS);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

export const saveCardProgress = (cardId: string, status: 'unlearned' | 'learning' | 'mastered') => {
  const current = getProgress();
  const prev = current[cardId] || { cardId, status: 'unlearned', reviewCount: 0 };
  current[cardId] = {
    cardId,
    status,
    reviewCount: prev.reviewCount + 1,
    lastReviewedAt: Date.now(),
  };
  localStorage.setItem(KEYS.PROGRESS, JSON.stringify(current));

  // Keep SRS mastery map in sync
  try {
    const level = status === 'mastered' ? 2 : status === 'learning' ? 1 : 0;
    const rawMastery = localStorage.getItem('chinese_flashcard_mastery');
    const mastery = rawMastery ? JSON.parse(rawMastery) : {};
    mastery[cardId] = {
      level,
      correctInRow: level,
      lastReviewedAt: Date.now(),
    };
    localStorage.setItem('chinese_flashcard_mastery', JSON.stringify(mastery));
    window.dispatchEvent(new CustomEvent('srs-updated', { detail: { cardId, level } }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error(e);
  }
};

// Test Results History
export const getTestResults = (): TestResult[] => {
  try {
    const data = localStorage.getItem(KEYS.TEST_RESULTS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveTestResult = (result: TestResult) => {
  const current = getTestResults();
  current.unshift(result);
  localStorage.setItem(KEYS.TEST_RESULTS, JSON.stringify(current));
};

// Backup & Restore Data
export const exportDataJSON = () => {
  const data = {
    courses: getCourses(),
    lessons: getLessons(),
    cards: getCards(),
    progress: getProgress(),
    testResults: getTestResults(),
    exportDate: new Date().toISOString(),
  };
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `chinese_vocab_backup_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const importDataJSON = (jsonString: string): boolean => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.cards && parsed.lessons) {
      localStorage.setItem(KEYS.COURSES, JSON.stringify(parsed.courses || []));
      localStorage.setItem(KEYS.LESSONS, JSON.stringify(parsed.lessons));
      localStorage.setItem(KEYS.CARDS, JSON.stringify(parsed.cards));
      if (parsed.progress) localStorage.setItem(KEYS.PROGRESS, JSON.stringify(parsed.progress));
      if (parsed.testResults) localStorage.setItem(KEYS.TEST_RESULTS, JSON.stringify(parsed.testResults));
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to parse backup JSON:', e);
    return false;
  }
};
