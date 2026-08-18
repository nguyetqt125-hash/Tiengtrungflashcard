import React, { useState, useEffect } from 'react';
import { Course, Lesson, Flashcard } from './types';
import {
  getCourses,
  saveCourses,
  deleteCourse,
  getLessons,
  saveLessons,
  deleteLesson,
  getCards,
  saveCards,
  addCardsBatch,
  deleteCard,
  deleteCardsBatch,
  initializeStorage,
} from './utils/storage';

import { Navbar } from './components/Navbar';
import { CourseList } from './components/CourseList';
import { LessonDetail } from './components/LessonDetail';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CourseModal } from './components/CourseModal';
import { LessonModal } from './components/LessonModal';
import { FlashcardModal } from './components/FlashcardModal';
import { BatchImportModal } from './components/BatchImportModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { SrsModal } from './components/SrsModal';
import { StudyMode } from './components/StudyMode';
import { MatchingGame } from './components/MatchingGame';
import { TestMode } from './components/TestMode';
import { HanziWorksheetModal } from './components/HanziWorksheetModal';
import { OnboardingTour } from './components/OnboardingTour';

export default function App() {
  // Navigation View State: 'courses' | 'lessons'
  const [currentView, setCurrentView] = useState<'courses' | 'lessons'>('courses');
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  // App Data State
  const [courses, setCoursesState] = useState<Course[]>([]);
  const [lessons, setLessonsState] = useState<Lesson[]>([]);
  const [cards, setCardsState] = useState<Flashcard[]>([]);

  // Active Modes: 'none' | 'study' | 'game' | 'test'
  const [activeMode, setActiveMode] = useState<'none' | 'study' | 'game' | 'test'>('none');
  const [activeLessonForMode, setActiveLessonForMode] = useState<{ lesson: Lesson; cards: Flashcard[] } | null>(null);

  // Modals Open States
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null);

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<Flashcard | null>(null);

  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState(false);
  const [batchImportLessonId, setBatchImportLessonId] = useState<string>('');
  const [batchImportLessonName, setBatchImportLessonName] = useState<string>('');

  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);

  // Tour / Onboarding Walkthrough State
  const [isTourOpen, setIsTourOpen] = useState(false);

  // SRS Modal State
  const [isSrsModalOpen, setIsSrsModalOpen] = useState(false);
  const [srsModalFilter, setSrsModalFilter] = useState<'due' | 'box1' | 'box2' | 'box3' | 'all'>('due');

  // Worksheet Printable Modal State
  const [isWorksheetOpen, setIsWorksheetOpen] = useState(false);

  // Delete Confirm Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'course' | 'lesson' | 'card';
    id: string;
    name: string;
  } | null>(null);

  // Load state on boot
  const reloadData = () => {
    initializeStorage();
    setCoursesState(getCourses());
    setLessonsState(getLessons());
    setCardsState(getCards());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Handlers for Navigation
  const handleNavigateHome = () => {
    setCurrentView('courses');
    setCurrentCourseId(null);
    setCurrentLessonId(null);
  };

  const handleSelectCourse = (courseId: string) => {
    setCurrentCourseId(courseId);
    setCurrentView('lessons');
    setCurrentLessonId(null);
  };

  // Course Save/Update
  const handleSaveCourse = (data: Omit<Course, 'id' | 'createdAt'> | Course) => {
    const existing = getCourses();
    if ('id' in data) {
      const updated = existing.map((c) => (c.id === data.id ? (data as Course) : c));
      saveCourses(updated);
    } else {
      const newCourse: Course = {
        ...data,
        id: `course-${Date.now()}`,
        createdAt: Date.now(),
      };
      saveCourses([...existing, newCourse]);
    }
    reloadData();
  };

  // Lesson Save/Update
  const handleSaveLesson = (data: Omit<Lesson, 'id' | 'createdAt'> | Lesson) => {
    const existing = getLessons();
    if ('id' in data) {
      const updated = existing.map((l) => (l.id === data.id ? (data as Lesson) : l));
      saveLessons(updated);
    } else {
      const newLesson: Lesson = {
        ...data,
        id: `lesson-${Date.now()}`,
        createdAt: Date.now(),
      };
      saveLessons([...existing, newLesson]);
      setCurrentLessonId(newLesson.id);
    }
    reloadData();
  };

  // Card Single Save/Update
  const handleSaveCard = (data: Omit<Flashcard, 'id' | 'createdAt'> | Flashcard) => {
    const existing = getCards();
    if ('id' in data) {
      const updated = existing.map((c) => (c.id === data.id ? (data as Flashcard) : c));
      saveCards(updated);
    } else {
      const newCard: Flashcard = {
        ...data,
        id: `card-${Date.now()}`,
        createdAt: Date.now(),
      };
      saveCards([...existing, newCard]);
    }
    reloadData();
  };

  // Batch Import Cards Handler
  const handleImportBatchCards = (newCards: Flashcard[]) => {
    addCardsBatch(newCards);
    reloadData();
  };

  // Trigger Delete Confirmation Popup
  const requestDelete = (type: 'course' | 'lesson' | 'card', id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setIsDeleteModalOpen(true);
  };

  // Confirmed Permanent Delete (Instant UI Update)
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;

    if (type === 'course') {
      deleteCourse(id);
      if (currentCourseId === id) {
        setCurrentView('courses');
        setCurrentCourseId(null);
      }
    } else if (type === 'lesson') {
      deleteLesson(id);
      if (currentLessonId === id) {
        setCurrentLessonId(null);
      }
    } else if (type === 'card') {
      deleteCard(id);
    }

    reloadData();
    setDeleteTarget(null);
  };

  // Active breadcrumb data
  const currentCourse = courses.find((c) => c.id === currentCourseId);
  const currentLesson = lessons.find((l) => l.id === currentLessonId);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      {/* Global Navigation Header */}
      <Navbar
        currentCourseId={currentCourseId}
        currentCourseName={currentCourse?.name}
        currentLessonId={currentLessonId}
        currentLessonName={currentLesson?.name}
        onNavigateHome={handleNavigateHome}
        onNavigateCourse={(id) => handleSelectCourse(id)}
        onOpenAddCourse={() => {
          setCourseToEdit(null);
          setIsCourseModalOpen(true);
        }}
        onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
        onOpenWorksheet={() => setIsWorksheetOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentView === 'courses' && (
          <CourseList
            courses={courses}
            lessons={lessons}
            cards={cards}
            onSelectCourse={handleSelectCourse}
            onAddCourse={() => {
              setCourseToEdit(null);
              setIsCourseModalOpen(true);
            }}
            onEditCourse={(course) => {
              setCourseToEdit(course);
              setIsCourseModalOpen(true);
            }}
            onDeleteCourse={(course) => requestDelete('course', course.id, course.name)}
            onAddLesson={(courseId) => {
              setCurrentCourseId(courseId);
              setLessonToEdit(null);
              setIsLessonModalOpen(true);
            }}
            onOpenGoogleSheets={() => setIsGoogleSheetsModalOpen(true)}
            onOpenSrsModal={(filter = 'due') => {
              setSrsModalFilter(filter);
              setIsSrsModalOpen(true);
            }}
            onOpenTour={() => setIsTourOpen(true)}
          />
        )}

        {currentView === 'lessons' && currentCourse && (
          <LessonDetail
            currentCourse={currentCourse}
            lessons={lessons}
            cards={cards}
            selectedLessonId={currentLessonId}
            onSelectLesson={(lessonId) => setCurrentLessonId(lessonId)}
            onBackToCourseList={handleNavigateHome}
            onAddLesson={(courseId) => {
              setCurrentCourseId(courseId);
              setLessonToEdit(null);
              setIsLessonModalOpen(true);
            }}
            onEditLesson={(les) => {
              setLessonToEdit(les);
              setIsLessonModalOpen(true);
            }}
            onDeleteLesson={(les) => requestDelete('lesson', les.id, les.name)}
            onOpenBatchImport={(lessonId, lessonName) => {
              setBatchImportLessonId(lessonId);
              setBatchImportLessonName(lessonName);
              setIsBatchImportModalOpen(true);
            }}
            onAddSingleCard={(lessonId) => {
              setCardToEdit(null);
              setIsCardModalOpen(true);
            }}
            onEditCard={(card) => {
              setCardToEdit(card);
              setIsCardModalOpen(true);
            }}
            onDeleteCard={(card) => requestDelete('card', card.id, card.term)}
            onDeleteCardsBatch={(cardIds) => {
              deleteCardsBatch(cardIds);
              reloadData();
            }}
            onStartStudy={(lesson, cards) => {
              setActiveLessonForMode({ lesson, cards });
              setActiveMode('study');
            }}
            onStartGame={(lesson, cards) => {
              setActiveLessonForMode({ lesson, cards });
              setActiveMode('game');
            }}
            onStartTest={(lesson, cards) => {
              setActiveLessonForMode({ lesson, cards });
              setActiveMode('test');
            }}
            onOpenWorksheet={() => setIsWorksheetOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">Hán Ngữ Flashcard — Ứng dụng học từ vựng tiếng Trung chuyên nghiệp</p>
        <p className="text-[11px] text-slate-400 mt-1">Hỗ trợ 7 trường thông tin flashcard, nhập liệu hàng loạt & làm bài kiểm tra tùy chỉnh.</p>
      </footer>

      {/* FULLSCREEN STUDY / GAME / TEST MODES */}
      {activeMode === 'study' && activeLessonForMode && (
        <StudyMode
          lesson={activeLessonForMode.lesson}
          cards={activeLessonForMode.cards}
          onClose={() => setActiveMode('none')}
        />
      )}

      {activeMode === 'game' && activeLessonForMode && (
        <MatchingGame
          lesson={activeLessonForMode.lesson}
          cards={activeLessonForMode.cards}
          onClose={() => setActiveMode('none')}
        />
      )}

      {activeMode === 'test' && activeLessonForMode && (
        <TestMode
          lesson={activeLessonForMode.lesson}
          cards={activeLessonForMode.cards}
          onClose={() => setActiveMode('none')}
        />
      )}

      {/* POPUP MODALS */}

      {/* Delete Confirmation Modal Popup */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        itemName={deleteTarget?.name || ''}
        itemType={
          deleteTarget?.type === 'course'
            ? 'khóa học'
            : deleteTarget?.type === 'lesson'
            ? 'bài học'
            : 'thẻ từ vựng'
        }
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Course Modal */}
      <CourseModal
        isOpen={isCourseModalOpen}
        courseToEdit={courseToEdit}
        onClose={() => setIsCourseModalOpen(false)}
        onSave={handleSaveCourse}
      />

      {/* Lesson Modal */}
      <LessonModal
        isOpen={isLessonModalOpen}
        courseId={currentCourseId || courses[0]?.id || ''}
        courses={courses}
        lessonToEdit={lessonToEdit}
        onClose={() => setIsLessonModalOpen(false)}
        onSave={handleSaveLesson}
      />

      {/* Flashcard Modal (7 fields) */}
      <FlashcardModal
        isOpen={isCardModalOpen}
        lessonId={currentLessonId || lessons[0]?.id || ''}
        cardToEdit={cardToEdit}
        onClose={() => setIsCardModalOpen(false)}
        onSave={handleSaveCard}
      />

      {/* Batch Text Import Modal */}
      <BatchImportModal
        isOpen={isBatchImportModalOpen}
        lessonId={batchImportLessonId}
        lessonName={batchImportLessonName}
        onClose={() => setIsBatchImportModalOpen(false)}
        onImport={handleImportBatchCards}
      />

      {/* Google Sheets Sync Modal */}
      <GoogleSheetModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        onRefreshData={reloadData}
      />

      {/* SRS Repetition Modal */}
      <SrsModal
        isOpen={isSrsModalOpen}
        onClose={() => setIsSrsModalOpen(false)}
        cards={cards}
        lessons={lessons}
        courses={courses}
        initialFilter={srsModalFilter}
        onNavigateToLesson={(courseId, lessonId) => {
          setCurrentCourseId(courseId);
          setCurrentLessonId(lessonId);
          setCurrentView('lessons');
        }}
        onStartStudySrsCards={(srsCards, title) => {
          const virtualLesson: Lesson = {
            id: 'srs-review-session',
            courseId: '',
            name: title,
            description: 'Phiên ôn tập lặp lại ngắt quãng (SRS)',
            createdAt: Date.now(),
          };
          setActiveLessonForMode({ lesson: virtualLesson, cards: srsCards });
          setActiveMode('study');
        }}
      />

      {/* Printable Hanzi Worksheet Modal */}
      <HanziWorksheetModal
        isOpen={isWorksheetOpen}
        onClose={() => setIsWorksheetOpen(false)}
        courses={courses}
        lessons={lessons}
        cards={cards}
        initialCourseId={currentCourseId}
        initialLessonId={currentLessonId}
        lessonTitle={currentLesson?.name || 'Vở Tập Viết Chữ Hán'}
      />

      {/* Interactive Step-by-Step Onboarding Tour Overlay */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        currentView={currentView}
        onNavigateToSampleLesson={() => {
          if (courses.length > 0) {
            handleSelectCourse(courses[0].id);
          }
        }}
      />
    </div>
  );
}
