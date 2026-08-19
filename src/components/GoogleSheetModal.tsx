import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  FileSpreadsheet,
  RefreshCw,
  Upload,
  Download,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Users,
  Key,
} from 'lucide-react';
import { Course, Lesson, Flashcard, User } from '../types';
import { getCourses, getLessons, getCards, saveCourses, saveLessons, saveCards } from '../utils/storage';
import { STORAGE_KEYS, GOOGLE_SCRIPT_URL } from '../constants';
import { getAllUsers } from '../utils/auth';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
  currentUser?: User | null;
}

const CODE_GS_SCRIPT = `/**
 * GOOGLE APPS SCRIPT CODE - HỆ THỐNG QUẢN TRỊ TOÀN DIỆN (ADMIN & TÀI KHOẢN NGƯỜI DÙNG)
 * Tác giả: Lan Nhi (lannhi)
 * Copy toàn bộ nội dung file này vào editor tại script.google.com của file Google Sheet Quản Trị
 */

// CẤU HÌNH CÁC TRANG TÍNH (SHEETS)
const SHEET_USERS = "TaiKhoan";
const SHEET_COURSES = "KhoaHoc";
const SHEET_LESSONS = "BaiHoc";

const USER_HEADERS = [
  "ID Người Dùng",
  "Tên Đăng Nhập",
  "Mật Khẩu",
  "Tên Hiển Thị",
  "Vai Trò",
  "Link Google Sheet Cá Nhân",
  "Ngày Tạo"
];

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
 * Hàm khởi tạo cấu trúc các Sheet tự động
 */
function setup() {
  return setupSheetDatabase();
}

function setupSheetDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Khởi tạo bảng Người Dùng / Tài Khoản
  var userSheet = getOrCreateFormattedSheet(ss, SHEET_USERS, USER_HEADERS, "#0284c7");
  // Thêm tài khoản admin lannhi mặc định nếu chưa có
  if (userSheet.getLastRow() === 1) {
    userSheet.appendRow([
      "admin-lannhi",
      "lannhi",
      "123456",
      "Lan Nhi (Quản Trị Viên)",
      "admin",
      "",
      new Date().toLocaleString("vi-VN")
    ]);
  }

  // 2. Khởi tạo bảng Khóa Học & Bài Học
  getOrCreateFormattedSheet(ss, SHEET_COURSES, COURSE_HEADERS, "#047857");
  getOrCreateFormattedSheet(ss, SHEET_LESSONS, LESSON_HEADERS, "#9a3412");

  // 3. Khởi tạo bảng Từ Vựng
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

  return { 
    status: "success", 
    message: "Khởi tạo thành công các trang tính Google Sheets (Tài khoản, Khóa học, Bài học, Từ vựng)!" 
  };
}

function sanitizeSheetName(name) {
  if (!name) return "Chung";
  var clean = String(name).replace(/[\\\\\\/?\\*:[\\]]/g, " ").trim();
  if (clean.length > 50) clean = clean.substring(0, 50);
  return clean || "Chung";
}

/**
 * Xử lý POST request từ Web App
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

    // 1. Đăng ký / Lưu tài khoản người dùng
    if (action === 'registerUser' || action === 'saveUser') {
      var user = contents.user;
      if (user && user.username) {
        var uSheet = getOrCreateFormattedSheet(ss, SHEET_USERS, USER_HEADERS, "#0284c7");
        var values = uSheet.getDataRange().getValues();
        var existingRowIndex = -1;
        for (var r = 1; r < values.length; r++) {
          if (String(values[r][1]).toLowerCase() === String(user.username).toLowerCase()) {
            existingRowIndex = r + 1;
            break;
          }
        }

        var rowData = [
          user.id || ('usr_' + Date.now()),
          user.username,
          user.password || '',
          user.displayName || user.username,
          user.role || 'user',
          user.personalSheetUrl || '',
          user.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')
        ];

        if (existingRowIndex > 0) {
          uSheet.getRange(existingRowIndex, 1, 1, rowData.length).setValues([rowData]);
        } else {
          uSheet.appendRow(rowData);
        }
        return responseJSON({ status: 'success', message: 'Đã lưu tài khoản người dùng vào Google Sheet!' });
      }
    }

    // 2. Thêm từ vựng mới
    if (action === 'addCard' || action === 'addCards') {
      var cards = Array.isArray(contents.cards) ? contents.cards : [contents.card];
      var lessons = contents.lessons || getLessonsFromSheet(ss);
      var courses = contents.courses || getCoursesFromSheet(ss);
      appendCardsToSheet(ss, cards, lessons, courses);
      return responseJSON({ status: 'success', message: 'Đã thêm từ vựng mới thành công!', count: cards.length });
    }

    // 3. Đồng bộ toàn bộ dữ liệu (Khóa học, Bài học, Từ vựng)
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
 * Xử lý GET request từ Web App
 */
function doGet(e) {
  try {
    var action = e && e.parameter ? e.parameter.action : 'getData';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'setup') {
      return responseJSON(setupSheetDatabase());
    }

    if (action === 'getUsers') {
      return responseJSON({ status: 'success', data: getUsersFromSheet(ss) });
    }

    var data = {
      courses: getCoursesFromSheet(ss),
      lessons: getLessonsFromSheet(ss),
      cards: getCardsFromSheet(ss),
      users: getUsersFromSheet(ss),
    };

    return responseJSON({ status: 'success', data: data });
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function getUsersFromSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var users = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[1]) continue;
    users.push({
      id: String(row[0] || ''),
      username: String(row[1] || ''),
      displayName: String(row[3] || row[1]),
      role: String(row[4] || 'user'),
      personalSheetUrl: String(row[5] || ''),
      createdAt: row[6] ? new Date(row[6]).getTime() : Date.now()
    });
  }
  return users;
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

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  currentUser,
}) => {
  const [webAppUrl, setWebAppUrl] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'users' | 'instructions' | 'code'>('settings');
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false,
  });

  const registeredUsers = getAllUsers();

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
    alert('Đã lưu cấu hình Google Sheets Quản Trị thành công!');
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
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      setSyncStatus({
        loading: false,
        success: true,
        message: 'Đã gửi lệnh đồng bộ lên Google Sheets thành công! Dữ liệu đã được cập nhật.',
      });
    } catch (err: any) {
      setSyncStatus({
        loading: false,
        success: false,
        message: 'Lỗi khi gửi dữ liệu: ' + (err?.message || 'Vui lòng kiểm tra lại URL Web App.'),
      });
    }
  };

  // Pull data from Google Sheet to Local Storage
  const handlePullFromSheet = async () => {
    if (!webAppUrl.trim()) {
      alert('Vui lòng nhập "URL Web App Google Apps Script" trước!');
      return;
    }

    setSyncStatus({ loading: true, message: 'Đang tải dữ liệu từ Google Sheets về ứng dụng...' });

    try {
      const fetchUrl = webAppUrl.trim().includes('?')
        ? `${webAppUrl.trim()}&action=getData`
        : `${webAppUrl.trim()}?action=getData`;

      const res = await fetch(fetchUrl);
      const json = await res.json();

      if (json.status === 'success' && json.data) {
        if (json.data.courses && json.data.courses.length > 0) {
          saveCourses(json.data.courses);
        }
        if (json.data.lessons && json.data.lessons.length > 0) {
          saveLessons(json.data.lessons);
        }
        if (json.data.cards && json.data.cards.length > 0) {
          saveCards(json.data.cards);
        }

        onRefreshData();
        setSyncStatus({
          loading: false,
          success: true,
          message: `Đã tải về thành công ${json.data.courses?.length || 0} khóa học, ${json.data.lessons?.length || 0} bài học và ${json.data.cards?.length || 0} từ vựng!`,
        });
      } else {
        setSyncStatus({
          loading: false,
          success: false,
          message: json.message || 'Không thể lấy dữ liệu từ Google Sheets.',
        });
      }
    } catch (err: any) {
      setSyncStatus({
        loading: false,
        success: false,
        message: 'Lỗi tải dữ liệu. Hãy đảm bảo bạn đã triển khai Apps Script với quyền truy cập "Bất kỳ ai (Anyone)".',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                ❖ Quản Trị Hệ Thống
              </span>
              <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                👑 Admin: lannhi
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Cơ Sở Dữ Liệu Google Sheets & Tài Khoản
            </h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 p-1 bg-slate-100 rounded-2xl mb-6 font-semibold text-xs text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'settings' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            1. Cấu Hình
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            2. Tài Khoản ({registeredUsers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instructions')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'instructions' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            3. Hướng Dẫn
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'code' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            4. Mã Code.gs
          </button>
        </div>

        {/* Status Box */}
        {syncStatus.message && (
          <div
            className={`mb-5 p-4 rounded-2xl border flex items-start gap-3 text-xs ${
              syncStatus.loading
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : syncStatus.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {syncStatus.loading ? (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />
            ) : syncStatus.success ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="font-bold">{syncStatus.message}</p>
            </div>
          </div>
        )}

        {/* Tab 1: Settings & Sync */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                URL Web App Google Apps Script (Quản Trị Viên)
              </label>
              <input
                type="url"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <p className="text-[11px] text-slate-500">
                Dán URL nhận được sau khi Deploy Web App từ Google Sheets của Lan Nhi.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Tự động đồng bộ khi thay đổi</h4>
                <p className="text-[11px] text-slate-500">
                  Tự động lưu lên Google Sheets mỗi khi thêm/sửa/xóa từ vựng
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                Lưu Cấu Hình
              </button>

              <button
                type="button"
                onClick={handlePushToSheet}
                disabled={syncStatus.loading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>Gửi Lên Sheet Quản Trị</span>
              </button>

              <button
                type="button"
                onClick={handlePullFromSheet}
                disabled={syncStatus.loading}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Tải Từ Sheet Về Máy</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Users Management */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
              <span className="font-semibold">
                Tổng số tài khoản đã đăng ký: <strong>{registeredUsers.length}</strong>
              </span>
              <span className="text-[11px] text-blue-700">Tự động đồng bộ vào sheet <strong>TaiKhoan</strong></span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Tài Khoản</th>
                    <th className="p-3">Tên Hiển Thị</th>
                    <th className="p-3">Vai Trò</th>
                    <th className="p-3">Mật Khẩu</th>
                    <th className="p-3">Google Sheet Cá Nhân</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {registeredUsers.map((u) => (
                    <tr key={u.id} className={u.username === 'lannhi' ? 'bg-amber-50/50 font-semibold' : ''}>
                      <td className="p-3 font-mono font-bold text-indigo-600">{u.username}</td>
                      <td className="p-3">{u.displayName || '-'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {u.role === 'admin' ? 'Quản Trị' : 'Học Viên'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {u.username === 'lannhi' ? '123456' : '••••••'}
                      </td>
                      <td className="p-3 text-[11px] text-slate-400">
                        {u.personalSheetUrl ? (
                          <span className="text-emerald-600 font-semibold">Đã kết nối</span>
                        ) : (
                          'Chưa liên kết'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Instructions */}
        {activeTab === 'instructions' && (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2">
              <h4 className="font-bold text-indigo-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Hướng dẫn thiết lập Google Sheets cho Lan Nhi (Admin):
              </h4>
              <ol className="list-decimal pl-5 space-y-1.5 text-indigo-950">
                <li>
                  Tạo 1 Google Sheet mới trên tài khoản Google của Lan Nhi.
                </li>
                <li>
                  Chọn <strong>Tiện ích mở rộng (Extensions) ➔ Apps Script</strong>.
                </li>
                <li>
                  Xóa toàn bộ mã cũ và dán toàn bộ mã ở tab <strong>4. Mã Code.gs</strong> vào.
                </li>
                <li>
                  Chọn hàm <code>setup</code> trên thanh công cụ và bấm <strong>Run (Chạy)</strong> để tự động tạo 3 sheet (TaiKhoan, KhoaHoc, BaiHoc, TuVung_Chung).
                </li>
                <li>
                  Bấm <strong>Deploy (Triển khai) ➔ New deployment ➔ Loại Web app</strong>.
                  <br />
                  <span className="text-[11px] text-indigo-700">
                    * Quyền thực thi: <strong>Me (Tôi)</strong>.
                    <br />
                    * Ai có quyền truy cập: <strong>Anyone (Bất kỳ ai)</strong>.
                  </span>
                </li>
                <li>
                  Sao chép URL Web App và dán vào tab <strong>1. Cấu Hình</strong> của ứng dụng!
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 4: Code */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Mã nguồn Code.gs (Đầy đủ quản lý Tài Khoản & Từ Vựng)
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Đã Sao Chép!' : 'Sao Chép Toàn Bộ Mã'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono h-64 overflow-y-auto leading-relaxed">
              <code>{CODE_GS_SCRIPT}</code>
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Tài khoản Admin: <strong>lannhi</strong> (Mật khẩu: 123456)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
