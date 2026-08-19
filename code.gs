/**
 * GOOGLE APPS SCRIPT CODE - HỆ THỐNG QUẢN TRỊ TOÀN DIỆN
 * Bao gồm: Quản lý Tài khoản người dùng (TaiKhoan), Khóa học (KhoaHoc), Bài học (BaiHoc), và Từ vựng (TuVung theo từng khóa)
 * 
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Mở file Google Sheet Quản Trị của bạn trên Google Drive.
 * 2. Chọn Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa toàn bộ mã cũ và dán toàn bộ nội dung file này vào editor.
 * 4. Nhấn Lưu (Ctrl + S), chọn hàm 'setup' ở thanh công cụ và nhấn 'Chạy' (Run) để tự động tạo tất cả các Sheet mẫu.
 * 5. Nhấn 'Triển khai' (Deploy) -> 'Tùy chọn triển khai mới' (New Deployment) -> chọn loại 'Ứng dụng web' (Web app).
 * 6. Mục 'Người có quyền truy cập' (Who has access) chọn 'Bất kỳ ai' (Anyone).
 * 7. Sao chép URL Web App và dán vào ứng dụng Flashcard.
 */

// CẤU HÌNH TÊN CÁC TRANG TÍNH (SHEETS)
const SHEET_USERS = "TaiKhoan";
const SHEET_COURSES = "KhoaHoc";
const SHEET_LESSONS = "BaiHoc";

// TIÊU ĐỀ CÁC CỘT (HEADERS) ĐẦY ĐỦ
const USER_HEADERS = [
  "ID Người Dùng",
  "Tên Đăng Nhập",
  "Mật Khẩu",
  "Tên Hiển Thị",
  "Vai Trò (Role)",
  "Link Google Sheet Cá Nhân",
  "Ngày Tạo"
];

const COURSE_HEADERS = [
  "ID Khóa Học",
  "Tên Khóa Học",
  "Mô Tả",
  "Cấp Độ HSK",
  "Tác Giả (Author ID)",
  "Khóa Chuẩn (isSystem)",
  "Ngày Tạo"
];

const LESSON_HEADERS = [
  "ID Bài Học",
  "ID Khóa Học",
  "Tên Bài Học",
  "Mô Tả",
  "Tác Giả (Author ID)",
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

  // 1. Khởi tạo bảng Quản lý Tài Khoản Người Dùng
  var userSheet = getOrCreateFormattedSheet(ss, SHEET_USERS, USER_HEADERS, "#0284c7");
  // Thêm tài khoản quản trị lannhi mặc định nếu sheet mới tinh
  if (userSheet.getLastRow() <= 1) {
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

  // 3. Kiểm tra và khởi tạo sheet Từ Vựng mặc định nếu chưa có
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

  // 4. Xóa Sheet1 mặc định nếu đã có các sheet chức năng
  var defaultSheet = ss.getSheetByName("Trang tính1") || ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  return {
    status: "success",
    message: "Khởi tạo thành công toàn bộ hệ thống Sheets (TaiKhoan, KhoaHoc, BaiHoc, và TuVung phân theo khóa học)!"
  };
}

function sanitizeSheetName(name) {
  if (!name) return "Chung";
  var clean = String(name).replace(/[\\\/?\*:\[\]]/g, " ").trim();
  if (clean.length > 50) clean = clean.substring(0, 50);
  return clean || "Chung";
}

/**
 * Hàm xử lý khi nhận request POST từ Web App
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Đợi tối đa 10 giây để tránh xung đột ghi dữ liệu

  try {
    var contents = e.postData ? JSON.parse(e.postData.contents) : {};
    var action = contents.action || 'syncAll';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'setup') {
      return responseJSON(setupSheetDatabase());
    }

    // 1. Đăng ký / Lưu thông tin tài khoản người dùng
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
          user.personalSheetUrl || user.googleSheetUrl || '',
          user.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')
        ];

        if (existingRowIndex > 0) {
          uSheet.getRange(existingRowIndex, 1, 1, rowData.length).setValues([rowData]);
        } else {
          uSheet.appendRow(rowData);
        }
        return responseJSON({ status: 'success', message: 'Đã lưu tài khoản người dùng vào Google Sheet TaiKhoan!' });
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

    // 3. Đồng bộ toàn bộ dữ liệu (Khóa học, Bài học, Từ vựng, Tài khoản)
    if (action === 'syncAll') {
      var lessons = contents.lessons || [];
      var courses = contents.courses || [];
      if (contents.courses) syncCoursesToSheet(ss, courses);
      if (contents.lessons) syncLessonsToSheet(ss, lessons);
      if (contents.cards) syncCardsToSheet(ss, contents.cards, lessons, courses);
      if (contents.users && Array.isArray(contents.users)) syncUsersToSheet(ss, contents.users);
      return responseJSON({ status: 'success', message: 'Đồng bộ toàn bộ dữ liệu lên Google Sheets thành công!' });
    }

    // 4. Đồng bộ danh sách tài khoản
    if (action === 'syncUsers' && contents.users) {
      syncUsersToSheet(ss, contents.users);
      return responseJSON({ status: 'success', message: 'Đồng bộ danh sách người dùng thành công!' });
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

// ==============================================================================
// CÁC HÀM XỬ LÝ ĐỌC / GHI / ĐỊNH DẠNG BẢNG TÍNH
// ==============================================================================

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

function syncUsersToSheet(ss, users) {
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (sheet) sheet.clear();
  sheet = getOrCreateFormattedSheet(ss, SHEET_USERS, USER_HEADERS, "#0284c7");
  (users || []).forEach(function(u) {
    sheet.appendRow([
      u.id || ('usr_' + Date.now()),
      u.username || '',
      u.password || '',
      u.displayName || u.username || '',
      u.role || 'user',
      u.personalSheetUrl || u.googleSheetUrl || '',
      u.createdAt ? new Date(u.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')
    ]);
  });
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
      password: String(row[2] || ''),
      displayName: String(row[3] || row[1]),
      role: String(row[4] || 'user'),
      personalSheetUrl: String(row[5] || ''),
      createdAt: row[6] ? new Date(row[6]).getTime() : Date.now()
    });
  }
  return users;
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

  // Danh sách tên Sheet từ vựng còn hợp lệ của các Khóa học hiện có
  var validVocabSheetNames = {
    "TuVung_Chung": true
  };
  (courses || []).forEach(function(c) {
    if (c && c.name) {
      validVocabSheetNames["TuVung_" + sanitizeSheetName(c.name)] = true;
    }
  });

  // Xóa bỏ hoàn toàn Tab Sheet từ vựng của khóa học ĐÃ BỊ XÓA
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

  // Khởi tạo trước sheet cho từng khóa học
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
      l.authorId || '',
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
      authorId: String(row[4] || ''),
      createdAt: row[5] ? new Date(row[5]).getTime() : Date.now(),
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
      c.authorId || '',
      c.isSystem ? 'true' : 'false',
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
      authorId: String(row[4] || ''),
      isSystem: String(row[5]).toLowerCase() === 'true',
      createdAt: row[6] ? new Date(row[6]).getTime() : Date.now(),
    });
  }
  return courses;
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
