/**
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

  // Kiểm tra nếu chưa có sheet từ vựng nào, tạo mặc định TuVung_Chung
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
}
