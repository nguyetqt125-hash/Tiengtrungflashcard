import { Flashcard, Lesson } from '../types';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string; // YYYY-MM-DD
  isStudiedToday: boolean;
}

export interface CardMasteryState {
  level: number; // 0: Box 1 (1 day), 1: Box 2 (3 days), 2: Box 3 (7 days)
  correctInRow: number;
  lastReviewedAt?: number;
}

export interface SrsStats {
  totalCards: number;
  dueCardsCount: number;
  box1Count: number;
  box2Count: number;
  box3Count: number;
  dueTodayCount: number;
  dueTomorrowCount: number;
  dueTodayCards: Flashcard[];
  dueTomorrowCards: Flashcard[];
  box1Cards: Flashcard[];
  masteredCards: Flashcard[];
}

const STREAK_KEY = 'chinese_study_streak';
const SRS_MASTERY_KEY = 'chinese_flashcard_mastery';

const getTodayString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getYesterdayString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getStreakInfo = (): StreakInfo => {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    const today = getTodayString();
    const yesterday = getYesterdayString();

    if (!raw) {
      return { currentStreak: 0, longestStreak: 0, lastStudyDate: '', isStudiedToday: false };
    }

    const data = JSON.parse(raw);
    const lastDate = data.lastStudyDate || '';
    let currentStreak = data.currentStreak || 0;
    const longestStreak = data.longestStreak || 0;

    const isStudiedToday = lastDate === today;

    // If last study was before yesterday and not today, streak has reset to 0
    if (lastDate !== today && lastDate !== yesterday) {
      currentStreak = 0;
    }

    return {
      currentStreak,
      longestStreak,
      lastStudyDate: lastDate,
      isStudiedToday,
    };
  } catch (e) {
    return { currentStreak: 0, longestStreak: 0, lastStudyDate: '', isStudiedToday: false };
  }
};

export const recordStudyActivity = (): StreakInfo => {
  try {
    const today = getTodayString();
    const yesterday = getYesterdayString();
    const current = getStreakInfo();

    if (current.lastStudyDate === today) {
      return current; // Already recorded today
    }

    let newStreak = 1;
    if (current.lastStudyDate === yesterday) {
      newStreak = current.currentStreak + 1;
    }

    const newLongest = Math.max(current.longestStreak, newStreak);

    const updated: StreakInfo = {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastStudyDate: today,
      isStudiedToday: true,
    };

    localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return getStreakInfo();
  }
};

export const getCardMasteryMap = (): Record<string, CardMasteryState> => {
  try {
    const raw = localStorage.getItem(SRS_MASTERY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

export const setCardMasteryLevel = (cardId: string, level: number) => {
  try {
    const map = getCardMasteryMap();
    const prev = map[cardId] || { level: 0, correctInRow: 0 };
    map[cardId] = {
      level,
      correctInRow: level,
      lastReviewedAt: Date.now(),
    };
    localStorage.setItem(SRS_MASTERY_KEY, JSON.stringify(map));

    // Also update chinese_card_progress for backward compatibility
    try {
      const rawProgress = localStorage.getItem('chinese_card_progress');
      const progress = rawProgress ? JSON.parse(rawProgress) : {};
      const status = level === 2 ? 'mastered' : level === 1 ? 'learning' : 'unlearned';
      const prevProg = progress[cardId] || { cardId, status: 'unlearned', reviewCount: 0 };
      progress[cardId] = {
        cardId,
        status,
        reviewCount: (prevProg.reviewCount || 0) + 1,
        lastReviewedAt: Date.now(),
      };
      localStorage.setItem('chinese_card_progress', JSON.stringify(progress));
    } catch (e) {
      console.error(e);
    }

    window.dispatchEvent(new CustomEvent('srs-updated', { detail: { cardId, level } }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed to set card mastery level:', e);
  }
};

export const setBatchCardMasteryLevel = (cardIds: string[], level: number) => {
  try {
    if (!cardIds || cardIds.length === 0) return;
    const map = getCardMasteryMap();
    const rawProgress = localStorage.getItem('chinese_card_progress');
    const progress = rawProgress ? JSON.parse(rawProgress) : {};
    const status = level === 2 ? 'mastered' : level === 1 ? 'learning' : 'unlearned';
    const now = Date.now();

    cardIds.forEach((cardId) => {
      map[cardId] = {
        level,
        correctInRow: level,
        lastReviewedAt: now,
      };

      const prevProg = progress[cardId] || { cardId, status: 'unlearned', reviewCount: 0 };
      progress[cardId] = {
        cardId,
        status,
        reviewCount: (prevProg.reviewCount || 0) + 1,
        lastReviewedAt: now,
      };
    });

    localStorage.setItem(SRS_MASTERY_KEY, JSON.stringify(map));
    localStorage.setItem('chinese_card_progress', JSON.stringify(progress));

    window.dispatchEvent(new CustomEvent('srs-updated', { detail: { cardIds, level } }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed to set batch card mastery level:', e);
  }
};

export const recordCardReview = (cardId: string, isCorrect: boolean) => {
  try {
    const map = getCardMasteryMap();
    const current = map[cardId] || { level: 0, correctInRow: 0 };
    let newLevel = current.level;
    if (isCorrect) {
      newLevel = Math.min(2, current.level + 1);
    } else {
      newLevel = 0;
    }
    setCardMasteryLevel(cardId, newLevel);
  } catch (e) {
    console.error('Failed to record card review:', e);
  }
};

// Box intervals in milliseconds
const INTERVALS = {
  0: 24 * 60 * 60 * 1000,      // Box 1: 1 day
  1: 3 * 24 * 60 * 60 * 1000,  // Box 2: 3 days
  2: 7 * 24 * 60 * 60 * 1000,  // Box 3: 7 days
};

export const getSrsStats = (cards: Flashcard[]): SrsStats => {
  const masteryMap = getCardMasteryMap();
  const now = Date.now();

  let box1Count = 0;
  let box2Count = 0;
  let box3Count = 0;
  let dueTodayCount = 0;
  let dueTomorrowCount = 0;

  const dueTodayCards: Flashcard[] = [];
  const dueTomorrowCards: Flashcard[] = [];
  const box1Cards: Flashcard[] = [];
  const masteredCards: Flashcard[] = [];

  cards.forEach((card) => {
    const m = masteryMap[card.id];
    const level = m?.level ?? 0;

    if (level === 0) {
      box1Count++;
      box1Cards.push(card);
    } else {
      if (level === 1) box2Count++;
      else if (level === 2) box3Count++;
      masteredCards.push(card);
    }

    const lastRev = m?.lastReviewedAt || 0;
    const interval = INTERVALS[level as 0 | 1 | 2] || INTERVALS[0];
    const nextDueTime = lastRev === 0 ? 0 : lastRev + interval;

    // Card is due if nextDueTime is now or past, OR never reviewed
    if (nextDueTime <= now) {
      dueTodayCount++;
      dueTodayCards.push(card);
    } else if (nextDueTime <= now + 24 * 60 * 60 * 1000) {
      dueTomorrowCount++;
      dueTomorrowCards.push(card);
    }
  });

  return {
    totalCards: cards.length,
    dueCardsCount: dueTodayCount,
    box1Count,
    box2Count,
    box3Count,
    dueTodayCount,
    dueTomorrowCount,
    dueTodayCards,
    dueTomorrowCards,
    box1Cards,
    masteredCards,
  };
};

export const getLessonSrsStats = (cards: Flashcard[], lessonId: string): SrsStats => {
  const lessonCards = cards.filter((c) => c.lessonId === lessonId);
  return getSrsStats(lessonCards);
};

export const getCourseSrsStats = (cards: Flashcard[], lessons: Lesson[], courseId: string): SrsStats => {
  const courseLessonIds = new Set(lessons.filter((l) => l.courseId === courseId).map((l) => l.id));
  const courseCards = cards.filter((c) => courseLessonIds.has(c.lessonId));
  return getSrsStats(courseCards);
};
