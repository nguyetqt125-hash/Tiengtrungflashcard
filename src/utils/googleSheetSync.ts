import { GOOGLE_SCRIPT_URL, STORAGE_KEYS } from '../constants';
import { getCourses, getLessons, getCards } from './storage';

export const getGoogleSheetUrl = (): string => {
  if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.trim().length > 0) {
    return GOOGLE_SCRIPT_URL.trim();
  }
  const stored = localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_WEBAPP_URL);
  return (stored && stored.trim()) ? stored.trim() : '';
};

export const triggerAutoSync = () => {
  setTimeout(async () => {
    try {
      const url = getGoogleSheetUrl();
      if (!url || !url.trim()) return;

      const isAutoSyncSetting = localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_AUTO_SYNC);
      // Default to true if auto sync setting is not explicitly disabled
      if (isAutoSyncSetting === 'false') return;

      const payload = {
        action: 'syncAll',
        courses: getCourses(),
        lessons: getLessons(),
        cards: getCards(),
      };

      await fetch(url.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });
      console.log('Tự động đồng bộ lên Google Sheets thành công!');
    } catch (err) {
      console.warn('Lỗi tự động đồng bộ Google Sheets:', err);
    }
  }, 0);
};
