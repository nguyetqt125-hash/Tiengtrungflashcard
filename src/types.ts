export interface Flashcard {
  id: string;
  lessonId: string;
  term: string;          // 1. Từ 1 / Thuật ngữ (e.g. 学习)
  definition: string;    // 2. Định nghĩa 1 (e.g. Học tập)
  pinyin: string;        // 3. Phát âm (nếu có) / Pinyin (e.g. xué xí)
  partOfSpeech?: string; // 4. Loại từ (nếu có) (Danh từ, Động từ, Tính từ...)
  example?: string;      // 5. Ví dụ (nếu có) (e.g. 我在学习汉语。)
  synonyms?: string;     // 6. Từ đồng nghĩa (nếu có) (e.g. 研习, 学)
  memoryTip?: string;    // 7. Mẹo ghi nhớ (nếu có) (e.g. Bộ Tử ở dưới mái nhà...)
  createdAt: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  level?: string; // e.g. HSK 1, HSK 2, Giao tiếp...
  createdAt: number;
}

export type CardMasteryStatus = 'unlearned' | 'learning' | 'mastered';

export interface CardProgress {
  cardId: string;
  status: CardMasteryStatus;
  reviewCount: number;
  lastReviewedAt?: number;
}

export type TestQuestionType = 'term' | 'pinyin' | 'definition';
export type TestFormatType = 'mcq' | 'typing' | 'tf';

export interface TestSettings {
  questionTypes: TestQuestionType[]; // e.g. ['term', 'pinyin', 'definition']
  formatTypes: TestFormatType[];     // e.g. ['mcq', 'typing', 'tf']
  questionCount: number;             // e.g. 5, 10, 15, or all
  timeLimitMinutes: number;          // 0 = unlimited, or 3, 5, 10
  showHints: boolean;                // show memory tips / example hints during test
}

export interface TestQuestion {
  id: string;
  card: Flashcard;
  questionType: TestQuestionType;
  formatType: TestFormatType;
  promptText: string;
  promptSubtext?: string;
  correctAnswer: string;
  options?: string[]; // for MCQ
  isTrueFalseTargetMatch?: boolean; // for TF
  tfDisplayedAnswer?: string;       // for TF
}

export interface UserAnswer {
  questionId: string;
  cardId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  questionPrompt: string;
}

export interface TestResult {
  id: string;
  lessonId: string;
  lessonName: string;
  date: number;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  answers: UserAnswer[];
}

export interface ImportOptions {
  fieldDelimiter: '\t' | ',' | '|' | '-' | string;
  cardDelimiter: '\n' | ';' | '||' | string;
  hasHeader: boolean;
}
