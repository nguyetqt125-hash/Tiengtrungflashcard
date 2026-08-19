import { User, UserAccountRecord, Course, Lesson, Flashcard } from '../types';
import { STORAGE_KEYS } from '../constants';
import { getGoogleSheetUrl } from './googleSheetSync';

const USERS_STORAGE_KEY = 'han_ngu_user_accounts_v2';
const CURRENT_USER_KEY = 'han_ngu_active_user_v2';

// Private Admin account definition
export const DEFAULT_ADMIN: UserAccountRecord = {
  id: 'admin-lannhi',
  username: 'lannhi',
  password: '123456',
  displayName: 'Lan Nhi (Quản Trị Viên)',
  role: 'admin',
  createdAt: Date.now(),
};

// Initialize default users if empty
export const initializeAuth = (): UserAccountRecord[] => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      const initialUsers: UserAccountRecord[] = [DEFAULT_ADMIN];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
      return initialUsers;
    }
    const parsed: UserAccountRecord[] = JSON.parse(raw);
    // Ensure admin lannhi always exists in database
    if (!parsed.some((u) => u.username.toLowerCase() === 'lannhi')) {
      parsed.unshift(DEFAULT_ADMIN);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    return [DEFAULT_ADMIN];
  }
};

// Get all registered accounts (local)
export const getAllUsers = (): UserAccountRecord[] => {
  return initializeAuth();
};

// Get current active user (null if not logged in)
export const getCurrentUser = (): User | null => {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    return null;
  } catch (e) {
    return null;
  }
};

// Set current active user
export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// Check if user is admin
export const isAdmin = (user?: User | null): boolean => {
  if (!user) return false;
  return user.role === 'admin' || user.username.toLowerCase() === 'lannhi';
};

// Check if a course can be edited/deleted by user
export const canEditCourse = (course?: Course | null, user?: User | null): boolean => {
  if (!course) return false;
  if (isAdmin(user)) return true;
  // If it's a system course or authored by Lan Nhi, regular users cannot edit or delete it
  if (course.isSystem || course.authorId === 'admin-lannhi' || course.authorUsername === 'lannhi') {
    return false;
  }
  // If user is logged in and is the author
  if (user && (course.authorId === user.id || course.authorUsername === user.username)) {
    return true;
  }
  return false;
};

// Check if a lesson can be edited/deleted by user
export const canEditLesson = (course?: Course | null, lesson?: Lesson | null, user?: User | null): boolean => {
  if (!course || !lesson) return false;
  if (isAdmin(user)) return true;
  // If parent course is system course or lesson is marked system
  if (course.isSystem || course.authorId === 'admin-lannhi' || lesson.isSystem || lesson.authorId === 'admin-lannhi') {
    return false;
  }
  if (user && (lesson.authorId === user.id || course.authorId === user.id)) {
    return true;
  }
  return false;
};

// Register a new user
export const registerUser = async (
  username: string,
  password: string,
  displayName?: string
): Promise<{ success: boolean; message: string; user?: User }> => {
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự.' };
  }
  if (!cleanPassword || cleanPassword.length < 4) {
    return { success: false, message: 'Mật khẩu phải có ít nhất 4 ký tự.' };
  }

  const users = getAllUsers();
  if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, message: `Tên tài khoản "${cleanUsername}" đã tồn tại. Vui lòng chọn tên khác hoặc đăng nhập.` };
  }

  const isNewAdmin = cleanUsername === 'lannhi';
  const newUserRecord: UserAccountRecord = {
    id: isNewAdmin ? DEFAULT_ADMIN.id : 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    username: cleanUsername,
    password: cleanPassword,
    displayName: displayName?.trim() || cleanUsername,
    role: isNewAdmin ? 'admin' : 'user',
    createdAt: Date.now(),
  };

  users.push(newUserRecord);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

  const newUser: User = {
    id: newUserRecord.id,
    username: newUserRecord.username,
    displayName: newUserRecord.displayName,
    role: newUserRecord.role,
    createdAt: newUserRecord.createdAt,
  };

  setCurrentUser(newUser);

  // Sync new user registration to Admin's Google Sheet Webhook if available
  try {
    const adminSheetUrl = getGoogleSheetUrl();
    if (adminSheetUrl && adminSheetUrl.trim()) {
      fetch(adminSheetUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'registerUser',
          user: {
            id: newUserRecord.id,
            username: newUserRecord.username,
            password: newUserRecord.password,
            displayName: newUserRecord.displayName,
            role: newUserRecord.role,
            createdAt: newUserRecord.createdAt,
          },
        }),
      }).catch((e) => console.warn('Lỗi ghi user vào Google Sheet:', e));
    }
  } catch (e) {
    // Ignore network errors in background
  }

  return { success: true, message: 'Đăng ký tài khoản thành công!', user: newUser };
};

// Login user
export const loginUser = async (
  username: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> => {
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = password.trim();

  // Admin lannhi verification
  if (cleanUsername === 'lannhi' && cleanPassword === '123456') {
    const adminUser: User = {
      id: DEFAULT_ADMIN.id,
      username: DEFAULT_ADMIN.username,
      displayName: DEFAULT_ADMIN.displayName,
      role: 'admin',
      createdAt: DEFAULT_ADMIN.createdAt,
      googleSheetUrl: localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_WEBAPP_URL) || '',
      isGoogleConnected: true,
    };
    setCurrentUser(adminUser);
    return { success: true, message: 'Đăng nhập Quản Trị Viên thành công!', user: adminUser };
  }

  const users = getAllUsers();
  const found = users.find((u) => u.username.toLowerCase() === cleanUsername);

  if (!found) {
    return { success: false, message: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại hoặc đăng ký mới.' };
  }

  if (found.password !== cleanPassword) {
    return { success: false, message: 'Mật khẩu không chính xác. Vui lòng thử lại.' };
  }

  const loggedInUser: User = {
    id: found.id,
    username: found.username,
    displayName: found.displayName,
    role: found.role,
    createdAt: found.createdAt,
    googleSheetUrl: found.personalSheetUrl || '',
    isGoogleConnected: !!found.personalSheetUrl,
  };

  setCurrentUser(loggedInUser);
  return { success: true, message: `Chào mừng ${loggedInUser.displayName || loggedInUser.username} quay trở lại!`, user: loggedInUser };
};

// Update personal Google Sheet for user
export const updatePersonalGoogleSheet = (user: User, sheetUrl: string, googleEmail?: string): User => {
  const updatedUser: User = {
    ...user,
    googleSheetUrl: sheetUrl.trim(),
    googleAccountEmail: googleEmail?.trim(),
    isGoogleConnected: !!sheetUrl.trim(),
  };

  setCurrentUser(updatedUser);

  const users = getAllUsers();
  const userIdx = users.findIndex((u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());
  if (userIdx >= 0) {
    users[userIdx].personalSheetUrl = sheetUrl.trim();
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  return updatedUser;
};

// Logout
export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};
