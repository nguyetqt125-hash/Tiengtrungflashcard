import React, { useState, useEffect } from 'react';
import { X, GraduationCap } from 'lucide-react';
import { Lesson, Course } from '../types';

interface LessonModalProps {
  isOpen: boolean;
  courseId: string;
  courses: Course[];
  lessonToEdit?: Lesson | null;
  onClose: () => void;
  onSave: (data: Omit<Lesson, 'id' | 'createdAt'> | Lesson) => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  isOpen,
  courseId,
  courses,
  lessonToEdit,
  onClose,
  onSave,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState(courseId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setSelectedCourseId(courseId);
  }, [courseId]);

  useEffect(() => {
    if (lessonToEdit) {
      setSelectedCourseId(lessonToEdit.courseId || courseId);
      setName(lessonToEdit.name || '');
      setDescription(lessonToEdit.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [lessonToEdit, isOpen, courseId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (lessonToEdit) {
      onSave({
        ...lessonToEdit,
        courseId: selectedCourseId,
        name: name.trim(),
        description: description.trim(),
      });
    } else {
      onSave({
        courseId: selectedCourseId,
        name: name.trim(),
        description: description.trim(),
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
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {lessonToEdit ? 'Chỉnh sửa Bài học' : 'Tạo Bài học mới'}
            </h2>
            <p className="text-xs text-slate-500">Bài học chứa danh sách các thẻ từ vựng Flashcard</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Thuộc Khóa học</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Tên Bài học <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Bài 1: Chào Hỏi & Bản Thân"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Mô tả bài học</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Các mẫu từ vựng về xin chào, cảm ơn, tạm biệt"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-900"
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
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {lessonToEdit ? 'Cập nhật' : 'Tạo Bài học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
