import React, { useState, useEffect } from 'react';
import { X, Copy, Check, FileSpreadsheet, RefreshCw, Upload, Download, AlertCircle, HelpCircle } from 'lucide-react';
import { Course, Lesson, Flashcard } from '../types';
import { getCourses, getLessons, getCards, saveCourses, saveLessons, saveCards } from '../utils/storage';
import { STORAGE_KEYS, GOOGLE_SCRIPT_URL } from '../constants';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

const CODE_GS_SCRIPT = `/**
 * GOOGLE APPS SCRIPT CODE
 * Copy toàn bộ nội dung file này vào editor tại script.google.com
 */

// CẤU HÌNH TÊN SHEET VÀ HEADERS (ĐẦY ĐỦ CÁC CỘT DỮ LIỆU APPS)
const SHEET_COURSES = "KhoaHoc";
const SHEET_LESSONS = "BaiHoc";

const COURSE_HEADERS = [
  "ID Khóa Học",
  "Tên Khóa Học",
  "Mô Tả",
  "Cấp Độ HSK",
  "Ngày Tạo"
];

const LESSON_HEADERS = [
  "ID Bài Học",
  "ID Khóa Học",
  "Tên Bài Học",
  "Mô Tả",
  "Ngày Tạo"
];

const CARD_HEADERS = [
  "ID Từ Vựng",
  "ID Bài Học",
  "Từ Hán Tự",
  "Phiên Âm (Pinyin)",
  "Định Nghĩa (Tiếng Việt)",
  "Loại Từ",
  "Ví Dụ Cụ Thể",
  "Từ Đồng Nghĩa",
  "Mẹo Ghi Nhớ",
  "Ngày Tạo"
];

/**
 * Hàm chọn chạy thủ công 'setup' trên trang script.google.com để tự động tạo cấu trúc bảng ngay lập tức
 */
function setup() {
  return setupSheetDatabase();
}

function setupSheetDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  getOrCreateFormattedSheet(ss, SHEET_COURSES, COURSE_HEADERS, "#047857");
  getOrCreateFormattedSheet(ss, SHEET_LESSONS, LESSON_HEADERS, "#9a3412");

  var sheets = ss.getSheets();
  var hasVocabSheet = false;
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (name === "TuVung" || name.indexOf("TuVung_") === 0 || name.indexOf("TuVung - ") === 0) {
      hasVocabSheet = true;
      break;
    }
  }
  if (!hasVocabSheet) {
    getOrCreateFormattedSheet(ss, "TuVung_Chung", CARD_HEADERS, "#4338ca");
  }

  var defaultSheet = ss.getSheetByName("Trang tính1") || ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  return { status: "success", message: "Khởi tạo thành công các trang tính Google Sheets (Khóa học, Bài học, Từ vựng phân theo từng khóa học)!" };
}

function sanitizeSheetName(name) {
  if (!name) return "Chung";
  var clean = String(name).replace(/[\\\\\\/?\\*:[\\]]/g, " ").trim();
  if (clean.length > 50) clean = clean.substring(0, 50);
  return clean || "Chung";
}

/**
 * Hàm xử lý khi nhận request POST từ Web App
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var contents = e.postData ? JSON.parse(e.postData.contents) : {};
    var action = contents.action || 'syncAll';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'setup') {
      return responseJSON(setupSheetDatabase());
    }

    if (action === 'addCard' || action === 'addCards') {
      var cards = Array.isArray(contents.cards) ? contents.cards : [contents.card];
      var lessons = contents.lessons || getLessonsFromSheet(ss);
      var courses = contents.courses || getCoursesFromSheet(ss);
      appendCardsToSheet(ss, cards, lessons, courses);
      return responseJSON({ status: 'success', message: 'Đã thêm từ vựng mới thành công!', count: cards.length });
    }

    if (action === 'syncAll') {
      var lessons = contents.lessons || [];
      var courses = contents.courses || [];
      if (contents.courses) syncCoursesToSheet(ss, courses);
      if (contents.lessons) syncLessonsToSheet(ss, lessons);
      if (contents.cards) syncCardsToSheet(ss, contents.cards, lessons, courses);
      return responseJSON({ status: 'success', message: 'Đồng bộ toàn bộ dữ liệu lên Google Sheets thành công!' });
    }

    return responseJSON({ status: 'error', message: 'Hành động không hợp lệ: ' + action });
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * Hàm xử lý khi nhận request GET từ Web App
 */
function doGet(e) {
  try {
    var action = e && e.parameter ? e.parameter.action : 'getData';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'setup') {
      return responseJSON(setupSheetDatabase());
    }

    var data = {
      courses: getCoursesFromSheet(ss),
      lessons: getLessonsFromSheet(ss),
      cards: getCardsFromSheet(ss),
    };

    return responseJSON({ status: 'success', data: data });
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function getOrCreateFormattedSheet(ss, sheetName, headers, bgColor) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
    sheet.appendRow(headers);
  }

  if (headers && headers.length > 0) {
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold")
      .setBackground(bgColor || "#4338ca")
      .setFontColor("#FFFFFF")
      .setVerticalAlignment("middle")
      .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 35);
  }

  return sheet;
}

function buildLessonAndCourseMaps(lessons, courses) {
  var lessonToCourseIdMap = {};
  var courseMap = {};

  (lessons || []).forEach(function(l) {
    if (l && l.id) lessonToCourseIdMap[l.id] = l.courseId;
  });

  (courses || []).forEach(function(c) {
    if (c && c.id) courseMap[c.id] = c;
  });

  return {
    lessonToCourseIdMap: lessonToCourseIdMap,
    courseMap: courseMap
  };
}

function getCourseSheetNameForCard(card, lessonToCourseIdMap, courseMap) {
  if (!card || !card.lessonId) return "TuVung_Chung";
  var courseId = lessonToCourseIdMap[card.lessonId];
  if (!courseId || !courseMap[courseId]) return "TuVung_Chung";
  var course = courseMap[courseId];
  return "TuVung_" + sanitizeSheetName(course.name);
}

function appendCardsToSheet(ss, cards, lessons, courses) {
  var maps = buildLessonAndCourseMaps(lessons, courses);
  var groupedCards = {};

  cards.forEach(function(card) {
    var sheetName = getCourseSheetNameForCard(card, maps.lessonToCourseIdMap, maps.courseMap);
    if (!groupedCards[sheetName]) groupedCards[sheetName] = [];
    groupedCards[sheetName].push(card);
  });

  Object.keys(groupedCards).forEach(function(sheetName) {
    var sheet = getOrCreateFormattedSheet(ss, sheetName, CARD_HEADERS, "#4338ca");
    groupedCards[sheetName].forEach(function(card) {
      sheet.appendRow([
        card.id || '',
        card.lessonId || '',
        card.term || '',
        card.pinyin || '',
        card.definition || '',
        card.partOfSpeech || '',
        card.example || '',
        card.synonyms || '',
        card.memoryTip || '',
        card.createdAt ? new Date(card.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')
      ]);
    });
  });
}

function syncCardsToSheet(ss, cards, lessons, courses) {
  var maps = buildLessonAndCourseMaps(lessons, courses);
  var sheets = ss.getSheets();

  var validVocabSheetNames = {
    "TuVung_Chung": true
  };
  (courses || []).forEach(function(c) {
    if (c && c.name) {
      validVocabSheetNames["TuVung_" + sanitizeSheetName(c.name)] = true;
    }
  });

  sheets.forEach(function(s) {
    var sName = s.getName();
    if (sName === "TuVung" || sName.indexOf("TuVung_") === 0 || sName.indexOf("TuVung - ") === 0) {
      if (!validVocabSheetNames[sName]) {
        try {
          if (ss.getSheets().length > 1) {
            ss.deleteSheet(s);
          } else {
            s.clear();
          }
        } catch (e) {
          s.clear();
        }
      } else {
        s.clear();
      }
    }
  });

  var groupedCards = {};

  (courses || []).forEach(function(c) {
    if (c && c.name) {
      var sName = "TuVung_" + sanitizeSheetName(c.name);
      groupedCards[sName] = [];
    }
  });

  cards.forEach(function(card) {
    var sheetName = getCourseSheetNameForCard(card, maps.lessonToCourseIdMap, maps.courseMap);
    if (!groupedCards[sheetName]) groupedCards[sheetName] = [];
    groupedCards[sheetName].push(card);
  });

  Object.keys(groupedCards).forEach(function(sheetName) {
    var sheet = getOrCreateFormattedSheet(ss, sheetName, CARD_HEADERS, "#4338ca");
    groupedCards[sheetName].forEach(function(card) {
      sheet.appendRow([
        card.id || '',
        card.lessonId || '',
        card.term || '',
        card.pinyin || '',
        card.definition || '',
        card.partOfSpeech || '',
        card.example || '',
        card.synonyms || '',
        card.memoryTip || '',
        card.createdAt ? new Date(card.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')
      ]);
    });
  });
}

function getCardsFromSheet(ss) {
  var sheets = ss.getSheets();
  var allCards = [];
  var cardIdsSeen = {};

  sheets.forEach(function(sheet) {
    var name = sheet.getName();
    if (name === "TuVung" || name.indexOf("TuVung_") === 0 || name.indexOf("TuVung - ") === 0) {
      var values = sheet.getDataRange().getValues();
      if (values.length > 1) {
        for (var i = 1; i < values.length; i++) {
          var row = values[i];
          if (!row[0] && !row[2]) continue;
          var cardId = String(row[0] || 'card_' + Date.now() + '_' + i);
          if (!cardIdsSeen[cardId]) {
            cardIdsSeen[cardId] = true;
            allCards.push({
              id: cardId,
              lessonId: String(row[1] || ''),
              term: String(row[2] || ''),
              pinyin: String(row[3] || ''),
              definition: String(row[4] || ''),
              partOfSpeech: String(row[5] || ''),
              example: String(row[6] || ''),
              synonyms: String(row[7] || ''),
              memoryTip: String(row[8] || ''),
              createdAt: row[9] ? new Date(row[9]).getTime() : Date.now(),
            });
          }
        }
      }
    }
  });

  return allCards;
}

function syncLessonsToSheet(ss, lessons) {
  var sheet = ss.getSheetByName(SHEET_LESSONS);
  if (sheet) sheet.clear();
  sheet = getOrCreateFormattedSheet(ss, SHEET_LESSONS, LESSON_HEADERS, "#9a3412");
  lessons.forEach(function(l) {
    sheet.appendRow([
      l.id, 
      l.courseId, 
      l.name, 
      l.description || '', 
      l.createdAt ? new Date(l.createdAt).toLocaleString('vi-VN') : ''
    ]);
  });
}

function getLessonsFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_LESSONS);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var lessons = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;
    lessons.push({
      id: String(row[0]),
      courseId: String(row[1]),
      name: String(row[2]),
      description: String(row[3] || ''),
      createdAt: row[4] ? new Date(row[4]).getTime() : Date.now(),
    });
  }
  return lessons;
}

function syncCoursesToSheet(ss, courses) {
  var sheet = ss.getSheetByName(SHEET_COURSES);
  if (sheet) sheet.clear();
  sheet = getOrCreateFormattedSheet(ss, SHEET_COURSES, COURSE_HEADERS, "#047857");
  courses.forEach(function(c) {
    sheet.appendRow([
      c.id, 
      c.name, 
      c.description || '', 
      c.level || '', 
      c.createdAt ? new Date(c.createdAt).toLocaleString('vi-VN') : ''
    ]);
  });
}

function getCoursesFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_COURSES);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var courses = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;
    courses.push({
      id: String(row[0]),
      name: String(row[1]),
      description: String(row[2] || ''),
      level: String(row[3] || ''),
      createdAt: row[4] ? new Date(row[4]).getTime() : Date.now(),
    });
  }
  return courses;
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({ isOpen, onClose, onRefreshData }) => {
  const [webAppUrl, setWebAppUrl] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'instructions' | 'code'>('settings');
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false,
  });

  useEffect(() => {
    const savedUrl = localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_WEBAPP_URL) || GOOGLE_SCRIPT_URL || '';
    const savedAutoSync = localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_AUTO_SYNC) !== 'false';
    setWebAppUrl(savedUrl);
    setAutoSync(savedAutoSync);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_SHEET_WEBAPP_URL, webAppUrl.trim());
    localStorage.setItem(STORAGE_KEYS.GOOGLE_SHEET_AUTO_SYNC, String(autoSync));
    alert('Đã lưu cấu hình Google Sheets thành công!');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODE_GS_SCRIPT);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Push local data to Google Sheet
  const handlePushToSheet = async () => {
    if (!webAppUrl.trim()) {
      alert('Vui lòng nhập "URL Web App Google Apps Script" trước khi đồng bộ!');
      return;
    }

    setSyncStatus({ loading: true, message: 'Đang gửi dữ liệu lên Google Sheets...' });

    try {
      const payload = {
        action: 'syncAll',
        courses: getCourses(),
        lessons: getLessons(),
        cards: getCards(),
      };

      await fetch(webAppUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      setSyncStatus({
        loading: false,
        success: true,
        message: 'Đã gửi yêu cầu đồng bộ thành công! Kiểm tra trang tính Google Sheet của bạn.',
      });
    } catch (err: any) {
      console.error('Push error:', err);
      setSyncStatus({
        loading: false,
        success: false,
        message: 'Đồng bộ thất bại. Vui lòng kiểm tra lại URL Web App và cài đặt quyền "Anyone" trong Apps Script.',
      });
    }
  };

  // Pull data from Google Sheet to app
  const handlePullFromSheet = async () => {
    if (!webAppUrl.trim()) {
      alert('Vui lòng nhập "URL Web App Google Apps Script" trước!');
      return;
    }

    setSyncStatus({ loading: true, message: 'Đang tải dữ liệu từ Google Sheets về App...' });

    try {
      const res = await fetch(webAppUrl.trim());
      const data = await res.json();

      if (data.status === 'success' && data.data) {
        const { courses, lessons, cards } = data.data;

        if (courses && courses.length > 0) saveCourses(courses);
        if (lessons && lessons.length > 0) saveLessons(lessons);
        if (cards && cards.length > 0) saveCards(cards);

        onRefreshData();
        setSyncStatus({
          loading: false,
          success: true,
          message: `Thành công! Đã tải về ${courses?.length || 0} khóa học, ${lessons?.length || 0} bài học, ${cards?.length || 0} từ vựng từ Google Sheet.`,
        });
      } else {
        setSyncStatus({
          loading: false,
          success: false,
          message: data.message || 'Không thể lấy dữ liệu từ Google Sheets.',
        });
      }
    } catch (err: any) {
      console.error('Pull error:', err);
      setSyncStatus({
        loading: false,
        success: false,
        message: 'Lỗi tải dữ liệu. Hãy đảm bảo bạn đã triển khai Web App với quyền "Anyone" (Bất kỳ ai).',
      });
    }
  };

  // Trigger setup on Google Sheet to create sample tabs and headers
  const handleSetupSheet = async () => {
    if (!webAppUrl.trim()) {
      alert('Vui lòng nhập "URL Web App Google Apps Script" trước!');
      return;
    }

    setSyncStatus({ loading: true, message: 'Đang gửi yêu cầu khởi tạo Bảng tính Google Sheet mẫu (Setup)...' });

    try {
      const url = webAppUrl.trim() + (webAppUrl.includes('?') ? '&' : '?') + 'action=setup';
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'success' || data.message) {
        setSyncStatus({
          loading: false,
          success: true,
          message: data.message || 'Khởi tạo thành công các Trang tính Google Sheets mẫu!',
        });
      } else {
        setSyncStatus({
          loading: false,
          success: false,
          message: data.message || 'Không thể khởi tạo sheet mẫu. Kiểm tra lại script code.gs.',
        });
      }
    } catch (err: any) {
      console.error('Setup error:', err);
      try {
        await fetch(webAppUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'setup' }),
        });
        setSyncStatus({
          loading: false,
          success: true,
          message: 'Đã gửi lệnh Setup thành công! Kiểm tra file Google Sheet của bạn.',
        });
      } catch (postErr) {
        setSyncStatus({
          loading: false,
          success: false,
          message: 'Lỗi khởi tạo sheet mẫu. Vui lòng kiểm tra lại URL Web App và quyền "Anyone".',
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 text-slate-800 space-y-6 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl border border-emerald-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Kết Nối Google Sheets (code.gs)</h2>
              <p className="text-xs text-slate-500">Tự động lưu và đồng bộ toàn bộ dữ liệu từ vựng với Google Sheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            1. Cấu Hình Link Google Sheet
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'instructions'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            2. Hướng Dẫn Cài Đặt (Apps Script)
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            3. Mã Nguồn code.gs
          </button>
        </div>

        {/* TAB 1: SETTINGS & SYNC */}
        {activeTab === 'settings' && (
          <div className="space-y-5 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3 text-emerald-900">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block mb-0.5">Khung mẫu code.gs đã được cập nhật sẵn!</strong>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  Bằng cách dán URL Web App Google Apps Script bên dưới, mọi dữ liệu bạn tạo mới (Khóa học, Bài học, Từ vựng) có thể được lưu trực tiếp vào Google Sheet của bạn.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-900 block text-xs">
                URL Ứng Dụng Web Google Apps Script (Web App URL):
              </label>
              <input
                type="url"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              />
              <p className="text-[11px] text-slate-500">
                Link này nhận được sau khi bạn nhấn <strong className="text-slate-800">Triển khai (Deploy) → Ứng dụng web (Web app)</strong> trong Google Apps Script.
              </p>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 block">Tự động đồng bộ liên tục:</span>
                <span className="text-[11px] text-slate-500">Tự gửi dữ liệu lên Google Sheets mỗi khi thêm/sửa từ vựng</span>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Lưu Cấu Hình Link Google Sheet
            </button>

            {/* Sync Status Banner */}
            {syncStatus.message && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
                  syncStatus.loading
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : syncStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {syncStatus.loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-600 flex-shrink-0" />
                ) : syncStatus.success ? (
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{syncStatus.message}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={handleSetupSheet}
                disabled={syncStatus.loading}
                className="py-3 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Khởi Tạo Sheet Mẫu</span>
              </button>

              <button
                onClick={handlePushToSheet}
                disabled={syncStatus.loading}
                className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>Đồng Bộ Lên Sheet</span>
              </button>

              <button
                onClick={handlePullFromSheet}
                disabled={syncStatus.loading}
                className="py-3 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Tải Dữ Liệu Về App</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: INSTRUCTIONS */}
        {activeTab === 'instructions' && (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              Các bước cài đặt file code.gs vào Google Sheets:
            </h3>

            <ol className="list-decimal list-inside space-y-3 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <li>
                Mở một trang tính <strong>Google Sheet</strong> mới hoặc sẵn có trên tài khoản Google của bạn.
              </li>
              <li>
                Trên thanh Menu hàng trên, bấm: <strong>Mở rộng (Extensions) → Apps Script</strong>.
              </li>
              <li>
                Xóa sạch các dòng mã mặc định <code>function myFunction()</code> trong Apps Script.
              </li>
              <li>
                Chuyển qua tab <strong>3. Mã Nguồn code.gs</strong> trong modal này, bấm nút <strong>"Sao Chép Mã code.gs"</strong> và DÁN vào cửa sổ Apps Script.
              </li>
              <li>
                Bấm biểu tượng <strong>Cái đĩa (Save / Ctrl + S)</strong> để lưu lại dự án.
              </li>
              <li>
                Bấm nút góc trên bên phải: <strong>Triển khai (Deploy) → Triển khai dưới dạng ứng dụng web (New deployment)</strong>.
              </li>
              <li className="bg-amber-100/70 p-2.5 rounded-xl text-amber-900 font-bold border border-amber-300/80">
                ⚠️ CHÚ Ý QUAN TRỌNG:
                <br />- Thực thi dưới dạng (Execute as): <strong>Tôi (Me)</strong>
                <br />- Ai có quyền truy cập (Who has access): <strong>Bất kỳ ai (Anyone)</strong>
              </li>
              <li>
                Bấm <strong>Triển khai (Deploy)</strong>, chấp nhận cấp quyền cho Google tài khoản của bạn.
              </li>
              <li>
                Sao chép <strong>URL ứng dụng web (Web App URL)</strong> và dán vào Tab 1 của modal này!
              </li>
            </ol>
          </div>
        )}

        {/* TAB 3: CODE VIEW */}
        {activeTab === 'code' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Mã nguồn file code.gs (Tự động lưu & phân loại trang tính):</span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Đã Sao Chép!' : 'Sao Chép Mã code.gs'}</span>
              </button>
            </div>

            <div className="relative max-h-80 overflow-y-auto bg-slate-950 text-slate-200 p-4 rounded-2xl text-[11px] font-mono border border-slate-800">
              <pre>{CODE_GS_SCRIPT}</pre>
            </div>
            <p className="text-[11px] text-slate-500">
              * File <code>code.gs</code> cũng đã được lưu sẵn tại thư mục gốc dự án của bạn (<code>/code.gs</code>) và thư mục <code>/public/code.gs</code>.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
