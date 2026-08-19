import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Check,
  Copy,
  Upload,
  Download,
  AlertCircle,
  Link,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { User, Course, Lesson, Flashcard } from '../types';
import { updatePersonalGoogleSheet } from '../utils/auth';
import { getCourses, getLessons, getCards, saveCourses, saveLessons, saveCards } from '../utils/storage';

interface PersonalSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdate: (updatedUser: User) => void;
  onRefreshData: () => void;
}

export const PersonalSheetModal: React.FC<PersonalSheetModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onRefreshData,
}) => {
  const [personalSheetUrl, setPersonalSheetUrl] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'connect' | 'guide'>('connect');
  const [isCopied, setIsCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  useEffect(() => {
    if (currentUser) {
      setPersonalSheetUrl(currentUser.googleSheetUrl || '');
      setGoogleEmail(currentUser.googleAccountEmail || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = updatePersonalGoogleSheet(currentUser, personalSheetUrl, googleEmail);
    onUserUpdate(updated);
    alert('Đã lưu thông tin Google Sheet cá nhân thành công!');
  };

  // Push user's local courses to their personal Google Sheet
  const handlePushToPersonalSheet = async () => {
    if (!personalSheetUrl.trim()) {
      alert('Vui lòng nhập Link / URL Google Apps Script Web App của bạn trước!');
      return;
    }

    setSyncStatus({ loading: true, message: 'Đang gửi dữ liệu lên Google Sheet của bạn...' });
    try {
      const payload = {
        action: 'syncAll',
        userId: currentUser.id,
        username: currentUser.username,
        courses: getCourses(),
        lessons: getLessons(),
        cards: getCards(),
      };

      await fetch(personalSheetUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      setSyncStatus({
        loading: false,
        success: true,
        message: 'Đã gửi yêu cầu lưu dữ liệu lên Google Sheet của bạn thành công!',
      });
    } catch (err: any) {
      setSyncStatus({
        loading: false,
        success: false,
        message: 'Lỗi khi gửi dữ liệu: ' + (err?.message || 'Kiểm tra lại URL'),
      });
    }
  };

  // Pull data from user's personal Google Sheet
  const handlePullFromPersonalSheet = async () => {
    if (!personalSheetUrl.trim()) {
      alert('Vui lòng nhập Link Web App Google Sheets của bạn trước!');
      return;
    }

    setSyncStatus({ loading: true, message: 'Đang tải dữ liệu từ Google Sheet của bạn về...' });
    try {
      const url = personalSheetUrl.trim().includes('?')
        ? `${personalSheetUrl.trim()}&action=getData`
        : `${personalSheetUrl.trim()}?action=getData`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.status === 'success' && json.data) {
        if (json.data.courses && json.data.courses.length > 0) saveCourses(json.data.courses);
        if (json.data.lessons && json.data.lessons.length > 0) saveLessons(json.data.lessons);
        if (json.data.cards && json.data.cards.length > 0) saveCards(json.data.cards);

        onRefreshData();
        setSyncStatus({
          loading: false,
          success: true,
          message: `Tải về thành công ${json.data.courses?.length || 0} khóa học và ${json.data.cards?.length || 0} từ vựng!`,
        });
      } else {
        setSyncStatus({
          loading: false,
          success: false,
          message: json.message || 'Không tìm thấy dữ liệu trên Google Sheet.',
        });
      }
    } catch (err: any) {
      setSyncStatus({
        loading: false,
        success: false,
        message: 'Không thể đọc dữ liệu trực tiếp qua GET. Hãy đảm bảo Script đã được triển khai với quyền "Bất kỳ ai (Anyone)".',
      });
    }
  };

  const copySampleScript = () => {
    const userScript = `// CODE GOOGLE APPS SCRIPT DÀNH CHO NGƯỜI DÙNG CÁ NHÂN
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Tạo sheet Từ Vựng nếu chưa có
    var sheet = ss.getSheetByName("TuVung") || ss.insertSheet("TuVung");
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["ID", "Bài Học", "Chữ Hán", "Pinyin", "Nghĩa", "Loại Từ", "Ví Dụ", "Mẹo Nhớ", "Ngày Tạo"]);
      sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#0D99FF").setFontColor("#FFFFFF");
    }
    
    if (data.cards && data.cards.length > 0) {
      sheet.clear();
      sheet.appendRow(["ID", "Bài Học", "Chữ Hán", "Pinyin", "Nghĩa", "Loại Từ", "Ví Dụ", "Mẹo Nhớ", "Ngày Tạo"]);
      sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#0D99FF").setFontColor("#FFFFFF");
      data.cards.forEach(function(c) {
        sheet.appendRow([c.id, c.lessonId, c.term, c.pinyin, c.definition, c.partOfSpeech||'', c.example||'', c.memoryTip||'', new Date(c.createdAt).toLocaleString('vi-VN')]);
      });
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("TuVung");
  var cards = [];
  if (sheet && sheet.getLastRow() > 1) {
    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      cards.push({ id: row[0], lessonId: row[1], term: row[2], pinyin: row[3], definition: row[4], partOfSpeech: row[5], example: row[6], memoryTip: row[7] });
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "success", data: { cards: cards } })).setMimeType(ContentService.MimeType.JSON);
}`;
    navigator.clipboard.writeText(userScript);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                ❖ Google Sheets Cá Nhân
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Tài khoản: <strong className="text-slate-800">{currentUser.displayName || currentUser.username}</strong>
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Lưu Dữ Liệu Vào Google Drive Của Bạn
            </h2>
          </div>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-5 font-semibold text-xs text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('connect')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'connect' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            1. Kết Nối & Đồng Bộ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'guide' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            2. Hướng Dẫn Tạo Sheet (30s)
          </button>
        </div>

        {/* Status Alerts */}
        {syncStatus.message && (
          <div
            className={`mb-4 p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${
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
            <div>
              <p className="font-bold">{syncStatus.message}</p>
            </div>
          </div>
        )}

        {activeTab === 'connect' ? (
          <div className="space-y-5">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                🔗 URL Google Apps Script Web App (Hoặc Link Google Sheet của bạn)
              </label>
              <input
                type="url"
                value={personalSheetUrl}
                onChange={(e) => setPersonalSheetUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0D99FF]"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Mỗi khi bạn thêm từ vựng, tạo khóa học hoặc làm bài ôn tập, dữ liệu sẽ tự động lưu thẳng vào file Google Sheet trên tài khoản Google của bạn!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2.5 bg-[#0D99FF] hover:bg-[#0088FF] text-white rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
              >
                Lưu Cấu Hình
              </button>

              <button
                type="button"
                onClick={handlePushToPersonalSheet}
                disabled={syncStatus.loading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Gửi Dữ Liệu Lên Sheet Của Tôi</span>
              </button>

              <button
                type="button"
                onClick={handlePullFromPersonalSheet}
                disabled={syncStatus.loading}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải Dữ Liệu Từ Sheet Về App</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-2">
              <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#0D99FF]" />
                3 Bước đơn giản để tạo Google Sheet cá nhân của bạn:
              </h4>
              <ol className="list-decimal pl-5 space-y-1.5 text-blue-950 leading-relaxed">
                <li>
                  Vào <strong>sheets.new</strong> trên trình duyệt của bạn để tạo 1 file Google Sheet mới trắng.
                </li>
                <li>
                  Trên thanh menu của Google Sheet, chọn: <strong>Tiện ích mở rộng (Extensions) ➔ Apps Script</strong>.
                </li>
                <li>
                  Xóa toàn bộ mã cũ trong Apps Script, bấm nút <strong>"Sao chép mã mẫu"</strong> bên dưới rồi dán vào.
                </li>
                <li>
                  Bấm nút <strong>Triển khai (Deploy) ➔ Triển khai mới (New deployment) ➔ Loại Web app</strong>.
                  <br />
                  <span className="text-[11px] text-blue-800">
                    * Lưu ý chọn mục <em>"Ai có quyền truy cập (Who has access)"</em> thành <strong>Bất kỳ ai (Anyone)</strong>.
                  </span>
                </li>
                <li>
                  Sao chép đường link <strong>Web app URL</strong> nhận được và dán vào ô ở tab <strong>1. Kết Nối & Đồng Bộ</strong>!
                </li>
              </ol>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="font-bold text-slate-800">Mã Google Apps Script cá nhân (Code.gs):</span>
              <button
                type="button"
                onClick={copySampleScript}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Đã sao chép mã!' : 'Sao chép mã mẫu'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Dữ liệu thuộc 100% quyền sở hữu của bạn trên Google Drive.</span>
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
