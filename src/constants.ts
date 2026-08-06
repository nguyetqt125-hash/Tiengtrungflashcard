// Cấu hình URL WEB APP
// Bước 1: Deploy Google Apps Script.
// Bước 2: Copy URL "Web App URL" (kết thúc bằng /exec).
// Bước 3: Dán vào biến bên dưới.
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby4IsgtF243-gW4yKTFgf82ipuI60QBRKF0hiYOFVTxvBh079eRynvm5r15gCUeBGqBgg/exec";

export const STORAGE_KEYS = {
  COURSES: 'hsk_app_courses_v1',
  LESSONS: 'hsk_app_lessons_v1',
  CARDS: 'hsk_app_cards_v1',
  PROGRESS: 'hsk_app_progress_v1',
  TEST_RESULTS: 'hsk_app_test_results_v1',
  GOOGLE_SHEET_WEBAPP_URL: 'google_sheet_webapp_url',
  GOOGLE_SHEET_AUTO_SYNC: 'google_sheet_auto_sync',
  STUDY_SETTINGS: 'hsk_app_study_settings_v1',
};

export const APP_CONFIG = {
  APP_NAME: 'Hán Ngữ Flashcard',
  VERSION: '1.0.0',
  DEFAULT_LANG: 'vi-VN',
  MASTERY_SUCCESS_THRESHOLD: 2,
};

export const FLASHCARD_FRONT_MODES = [
  { id: 'hanzi', name: 'Chữ Hán ➔ Nghĩa Tiếng Việt & Pinyin', description: 'Mặt trước hiện Chữ Hán, lật xem Nghĩa + Pinyin' },
  { id: 'pinyin', name: 'Pinyin ➔ Chữ Hán & Nghĩa Tiếng Việt', description: 'Mặt trước hiện Phiên âm Pinyin, lật xem Chữ Hán + Nghĩa' },
  { id: 'vietnamese', name: 'Tiếng Việt ➔ Chữ Hán & Pinyin', description: 'Mặt trước hiện Nghĩa Tiếng Việt, lật xem Chữ Hán + Pinyin' },
  { id: 'hanzi_pinyin', name: 'Chữ Hán + Pinyin ➔ Nghĩa Tiếng Việt', description: 'Mặt trước hiện Chữ Hán kèm Pinyin, lật xem Nghĩa' },
] as const;

export const SMART_LEARN_QUESTION_TYPES = [
  { id: 'term_to_def', label: 'Chữ Hán ➔ Tiếng Việt', desc: 'Hiển thị Chữ Hán, chọn Nghĩa Tiếng Việt' },
  { id: 'def_to_term', label: 'Tiếng Việt ➔ Chữ Hán', desc: 'Hiển thị Nghĩa Tiếng Việt, chọn Chữ Hán' },
  { id: 'pinyin_to_term', label: 'Pinyin ➔ Chữ Hán', desc: 'Hiển thị Pinyin, chọn Chữ Hán tương ứng' },
  { id: 'term_to_pinyin', label: 'Chữ Hán ➔ Pinyin', desc: 'Hiển thị Chữ Hán, chọn Pinyin đúng' },
  { id: 'pinyin_to_def', label: 'Pinyin ➔ Tiếng Việt', desc: 'Hiển thị Pinyin, chọn Nghĩa Tiếng Việt' },
  { id: 'audio_to_term', label: 'Nghe Âm Thanh ➔ Chữ Hán', desc: 'Nghe giọng đọc tiếng Trung, chọn Chữ Hán' },
] as const;


