import React, { useState, useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { Course } from '../types';

interface CourseModalProps {
  isOpen: boolean;
  courseToEdit?: Course | null;
  onClose: () => void;
  onSave: (data: Omit<Course, 'id' | 'createdAt'> | Course) => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  courseToEdit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('HSK 1');

  useEffect(() => {
    if (courseToEdit) {
      setName(courseToEdit.name || '');
      setDescription(courseToEdit.description || '');
      setLevel(courseToEdit.level || 'HSK 1');
    } else {
      setName('');
      setDescription('');
      setLevel('HSK 1');
    }
  }, [courseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (courseToEdit) {
      onSave({
        ...courseToEdit,
        name: name.trim(),
        description: description.trim(),
        level,
      });
    } else {
      onSave({
        name: name.trim(),
        description: description.trim(),
        level,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {courseToEdit ? 'Chỉnh sửa Khóa học' : 'Tạo Khóa học mới'}
            </h2>
            <p className="text-xs text-slate-500">Khóa học chứa các bài học và bộ từ vựng</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Tên Khóa học <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Khóa Học Từ Vựng HSK 1 Chú Trọng"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Trình độ / Cấp độ</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
            >
              <option value="Sơ Cấp">Sơ Cấp (Cơ bản)</option>
              <option value="HSK 1">HSK 1</option>
              <option value="HSK 2">HSK 2</option>
              <option value="HSK 3">HSK 3</option>
              <option value="HSK 4">HSK 4</option>
              <option value="HSK 5">HSK 5</option>
              <option value="HSK 6">HSK 6</option>
              <option value="Giao Tiếp">Giao Tiếp Thương Mại / Du Lịch</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Mô tả Khóa học</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Tổng hợp các bài học từ vựng giúp đỗ HSK 1 cao điểm"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {courseToEdit ? 'Cập nhật' : 'Tạo Khóa học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
