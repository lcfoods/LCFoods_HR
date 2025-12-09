import React, { useState, useEffect, useMemo } from 'react';
import { Course, CourseProgress, User, Question, Section, Lesson } from '../types';
import { StorageService } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';           
import { 
  Plus, PlayCircle, Clock, Trash2, Edit2, Save, X, 
  CheckCircle, AlertCircle, FileQuestion, ArrowLeft, GraduationCap, 
  ChevronDown, ChevronRight, BookOpen, Search, Star, BarChart, User as UserIcon, Lock, Unlock, Play,
  Video, FileText, MoreVertical, GripVertical, XCircle, RotateCcw, Trophy,
  ArrowUp, ArrowDown
} from 'lucide-react';

interface TrainingModuleProps {
    currentUser: User;
    companyId: string;
}

export const TrainingModule: React.FC<TrainingModuleProps> = ({ currentUser, companyId }) => {
    const [view, setView] = useState<'HOME' | 'BUILDER' | 'VIEWER' | 'DETAIL'>('HOME');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const { t } = useLanguage();

    const permissions = useMemo(() => {
        if (!currentUser?.roleId) return [];
        const role = StorageService.getRoleById(currentUser.roleId);
        return role ? role.permissions : [];
    }, [currentUser]);

    const canManage = permissions.includes('TRAINING_MANAGE');

    const handleCreate = () => {
        setSelectedCourse(null);
        setView('BUILDER');
    };

    const handleEdit = (course: Course) => {
        setSelectedCourse(course);
        setView('BUILDER');
    };

    const handleDetail = (course: Course) => {
        setSelectedCourse(course);
        setView('DETAIL');
    };

    const handleLearn = (course: Course) => {
        // Enroll if not already
        StorageService.enrollUser(currentUser.id, course.id);
        setSelectedCourse(course);
        setView('VIEWER');
    };

    const handleBack = () => {
        setSelectedCourse(null);
        setView('HOME');
    };

    if (view === 'BUILDER' && canManage) {
        return <CourseBuilder course={selectedCourse} onSave={handleBack} onCancel={handleBack} companyId={companyId} />;
    }

    if (view === 'DETAIL' && selectedCourse) {
        return <CourseLandingPage course={selectedCourse} userId={currentUser.id} onBack={handleBack} onLearn={() => handleLearn(selectedCourse)} />;
    }

    if (view === 'VIEWER' && selectedCourse) {
        return <LearningPlayer course={selectedCourse} userId={currentUser.id} onBack={() => handleDetail(selectedCourse)} />;
    }

    return (
        <CourseDashboard 
            companyId={companyId} 
            userId={currentUser.id}
            canManage={canManage} 
            onCreate={handleCreate} 
            onEdit={handleEdit} 
            onDetail={handleDetail} 
        />
    );
};

// --- COMPONENT: COURSE DASHBOARD (HOME) ---

const CourseDashboard = ({ companyId, userId, canManage, onCreate, onEdit, onDetail }: any) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [tab, setTab] = useState<'ALL' | 'MY'>('ALL');
    const [search, setSearch] = useState('');

    useEffect(() => {
        setCourses(StorageService.getCourses(companyId));
    }, [companyId]);

    const myProgressList = useMemo(() => {
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith('hrm_progress'));
        // We filter courses where user has a progress entry
        return courses.filter(c => !!StorageService.getProgress(userId, c.id));
    }, [courses, userId]);

    const displayedCourses = useMemo(() => {
        let list = tab === 'ALL' ? courses : myProgressList;
        if (search) {
            list = list.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
        }
        return list;
    }, [courses, myProgressList, tab, search]);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this course?")) {
            StorageService.deleteCourse(id);
            setCourses(prev => prev.filter(c => c.id !== id));
        }
    };

    const CourseCard = ({ course }: { course: Course }) => {
        const progress = StorageService.getProgress(userId, course.id);
        const totalLessons = course.sections.reduce((acc, s) => acc + s.lessons.length, 0);
        const completedLessons = progress ? progress.completedLessonIds.length : 0;
        const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return (
            <div 
                onClick={() => onDetail(course)}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
            >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img 
                        src={course.thumbnail || `https://ui-avatars.com/api/?name=${course.title}&background=random&size=400`} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <PlayCircle className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 drop-shadow-lg" />
                    </div>
                    {course.level && (
                        <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded">
                            {course.level}
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-1 line-clamp-2 min-h-[3rem]" title={course.title}>
                        {course.title}
                    </h3>
                    <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                        <UserIcon className="w-3 h-3" /> {course.instructor || 'Unknown Instructor'}
                    </div>

                    <div className="mt-auto space-y-3">
                        {/* Meta info */}
                        <div className="flex items-center text-xs text-slate-500 gap-3">
                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {course.totalDurationMinutes}m</span>
                            <span className="flex items-center"><BookOpen className="w-3 h-3 mr-1"/> {totalLessons} lessons</span>
                        </div>

                        {/* Progress Bar (if enrolled) */}
                        {progress ? (
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                                    <span>{percent}% Complete</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${percent}%` }}></div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-1.5 w-full bg-transparent"></div> // Spacer
                        )}
                        
                        {/* Admin Actions */}
                        {canManage && (
                            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                                <button onClick={(e) => { e.stopPropagation(); onEdit(course); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4"/></button>
                                <button onClick={(e) => handleDelete(course.id, e)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header / Hero */}
            <div className="relative bg-gradient-to-r from-indigo-900 to-blue-800 rounded-2xl p-8 text-white overflow-hidden shadow-md">
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-3xl font-bold mb-2">Học tập không giới hạn</h1>
                    <p className="text-blue-100 mb-6">Nâng cao kỹ năng chuyên môn và kỹ năng mềm với kho khóa học nội bộ chất lượng cao.</p>
                    {canManage && (
                        <button onClick={onCreate} className="px-5 py-2 bg-white text-indigo-900 font-bold rounded-full hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm">
                            <Plus className="w-4 h-4" /> Tạo khóa học mới
                        </button>
                    )}
                </div>
                <GraduationCap className="absolute right-10 bottom-[-20px] w-64 h-64 text-white opacity-5 rotate-12 pointer-events-none" />
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
                    <button 
                        onClick={() => setTab('ALL')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${tab === 'ALL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Khám phá
                    </button>
                    <button 
                        onClick={() => setTab('MY')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${tab === 'MY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Khóa học của tôi
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm khóa học..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            {/* Grid */}
            {displayedCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {displayedCourses.map(course => <CourseCard key={course.id} course={course} />)}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-200 border-dashed">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Chưa tìm thấy khóa học nào phù hợp.</p>
                </div>
            )}
        </div>
    );
};

// --- COMPONENT: COURSE LANDING PAGE (DETAIL) ---

const CourseLandingPage = ({ course, userId, onBack, onLearn }: { course: Course, userId: string, onBack: () => void, onLearn: () => void }) => {
    const progress = StorageService.getProgress(userId, course.id);
    const totalLessons = course.sections.reduce((acc, s) => acc + s.lessons.length, 0);
    const completedLessons = progress ? progress.completedLessonIds.length : 0;
    const isEnrolled = !!progress;

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 mb-4 font-medium">
                <ArrowLeft className="w-4 h-4 mr-2"/> Quay lại danh sách
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 mb-4">{course.title}</h1>
                        <p className="text-lg text-slate-600 leading-relaxed">{course.description}</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                         <h3 className="text-lg font-bold text-slate-800 mb-4">Bạn sẽ học được gì?</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {/* Mock benefits since we don't have this field yet */}
                             <div className="flex items-start gap-2 text-sm text-slate-700">
                                 <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" /> Kiến thức nền tảng vững chắc
                             </div>
                             <div className="flex items-start gap-2 text-sm text-slate-700">
                                 <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" /> Áp dụng thực tế vào công việc
                             </div>
                             <div className="flex items-start gap-2 text-sm text-slate-700">
                                 <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" /> Chứng chỉ hoàn thành khóa học
                             </div>
                         </div>
                    </div>

                    {/* Syllabus */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800">Nội dung khóa học</h3>
                        <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 bg-white overflow-hidden">
                            {course.sections.map((section, idx) => (
                                <details key={section.id} className="group" open={idx === 0}>
                                    <summary className="flex items-center justify-between p-4 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors list-none select-none">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 flex items-center justify-center">
                                                <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                                            </div>
                                            <span className="font-bold text-slate-700">{section.title}</span>
                                        </div>
                                        <span className="text-xs text-slate-500">{section.lessons.length} bài học</span>
                                    </summary>
                                    <div className="bg-white px-4 py-2 space-y-1">
                                        {section.lessons.map(lesson => (
                                            <div key={lesson.id} className="flex items-center justify-between py-2 px-8 text-sm hover:bg-slate-50 rounded">
                                                 <div className="flex items-center gap-3">
                                                     {lesson.type === 'VIDEO' ? <PlayCircle className="w-4 h-4 text-slate-400"/> : <FileQuestion className="w-4 h-4 text-slate-400"/>}
                                                     <span className="text-slate-600">{lesson.title}</span>
                                                 </div>
                                                 <span className="text-xs text-slate-400">{lesson.durationMinutes} min</span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Sticky Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                        <div className="aspect-video bg-slate-100 relative">
                             <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                             {/* Overlay Play Button to Preview */}
                             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                 <div className="bg-white/90 rounded-full p-4 shadow-xl cursor-pointer hover:scale-110 transition-transform" onClick={onLearn}>
                                     <Play className="w-8 h-8 text-indigo-600 ml-1" />
                                 </div>
                             </div>
                        </div>
                        <div className="p-6">
                             {isEnrolled ? (
                                 <div className="mb-6">
                                     <div className="flex justify-between text-sm mb-1 font-semibold text-slate-700">
                                         <span>Đã hoàn thành</span>
                                         <span>{Math.round((completedLessons / totalLessons) * 100)}%</span>
                                     </div>
                                     <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                         <div className="h-full bg-green-500" style={{ width: `${(completedLessons / totalLessons) * 100}%` }}></div>
                                     </div>
                                 </div>
                             ) : null}

                             <button 
                                onClick={onLearn}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md transition-all active:scale-95 mb-4"
                             >
                                 {isEnrolled ? (completedLessons >= totalLessons ? 'Xem lại khóa học' : 'Tiếp tục học') : 'Đăng ký học ngay'}
                             </button>
                             
                             <div className="space-y-3 text-sm text-slate-600">
                                 <div className="flex items-center gap-3">
                                     <BarChart className="w-4 h-4 text-slate-400" /> Trình độ: {course.level}
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <Clock className="w-4 h-4 text-slate-400" /> Thời lượng: {course.totalDurationMinutes} phút
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <BookOpen className="w-4 h-4 text-slate-400" /> Tổng số bài: {totalLessons} bài
                                 </div>
                                 <div className="flex items-center gap-3">
                                     <UserIcon className="w-4 h-4 text-slate-400" /> GV: {course.instructor}
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: LEARNING PLAYER (GITIHO STYLE) ---

const LearningPlayer = ({ course, userId, onBack }: { course: Course, userId: string, onBack: () => void }) => {
    const { t } = useLanguage();
    const flatLessons = useMemo(() => {
        const flat: (Lesson & { sectionId: string })[] = [];
        course.sections.forEach(sec => {
            sec.lessons.forEach(less => flat.push({ ...less, sectionId: sec.id }));
        });
        return flat;
    }, [course]);

    const progress = StorageService.getProgress(userId, course.id);
    const [currentLesson, setCurrentLesson] = useState<Lesson & { sectionId: string }>(() => {
        if (progress?.lastAccessedLessonId) {
            return flatLessons.find(l => l.id === progress.lastAccessedLessonId) || flatLessons[0];
        }
        return flatLessons[0];
    });

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    // Quiz State
    const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState(0);

    // Reset quiz state when lesson changes
    useEffect(() => {
        setUserAnswers({});
        setQuizSubmitted(false);
        setQuizScore(0);
        
        // If revisiting a completed quiz, we could load previous score here (Optional enhancement)
        const previousScore = progress?.quizScores[currentLesson.id];
        if (previousScore !== undefined) {
             // Optional: show previous score state
             setQuizScore(previousScore);
             setQuizSubmitted(true);
        }
    }, [currentLesson.id]);

    const handleLessonSelect = (lesson: Lesson & { sectionId: string }) => {
        setCurrentLesson(lesson);
        // Only update progress for Video/Reading types immediately. 
        // Quizzes are updated after submission.
        if (lesson.type !== 'QUIZ') {
            StorageService.updateLessonProgress(userId, course.id, lesson.id);
        }
    };

    const handleNext = () => {
        const idx = flatLessons.findIndex(l => l.id === currentLesson.id);
        if (idx < flatLessons.length - 1) {
            handleLessonSelect(flatLessons[idx + 1]);
        }
    };

    const handlePrev = () => {
        const idx = flatLessons.findIndex(l => l.id === currentLesson.id);
        if (idx > 0) {
            handleLessonSelect(flatLessons[idx - 1]);
        }
    };

    const handleQuizAnswer = (questionId: string, optionIndex: number) => {
        if (quizSubmitted) return;
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const handleSubmitQuiz = () => {
        if (!currentLesson.questions) return;
        
        let correctCount = 0;
        currentLesson.questions.forEach(q => {
            if (userAnswers[q.id] === q.correctIndex) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / currentLesson.questions.length) * 100);
        setQuizScore(score);
        setQuizSubmitted(true);

        // Save progress regardless of score (completion tracked, score recorded)
        StorageService.updateLessonProgress(userId, course.id, currentLesson.id, score);
    };

    const handleRetakeQuiz = () => {
        setUserAnswers({});
        setQuizSubmitted(false);
        setQuizScore(0);
    };

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
            {/* Player Header */}
            <div className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0">
                 <div className="flex items-center gap-4">
                     <button onClick={onBack} className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5"/></button>
                     <h2 className="font-bold text-sm sm:text-base line-clamp-1">{course.title}</h2>
                 </div>
                 <div className="flex items-center gap-4 text-xs font-semibold">
                     <span className="hidden sm:inline">Tiến độ: {progress ? progress.completedLessonIds.length : 0}/{flatLessons.length}</span>
                     <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                         <div className="h-full bg-green-500 transition-all" style={{ width: `${(flatLessons.length > 0 ? ((progress?.completedLessonIds.length || 0)/flatLessons.length)*100 : 0)}%` }}></div>
                     </div>
                 </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Content Player */}
                <div className="flex-1 bg-black flex flex-col relative overflow-y-auto">
                    <div className="flex-1 flex items-center justify-center bg-zinc-900">
                        {currentLesson.type === 'VIDEO' && currentLesson.contentUrl ? (
                             <div className="w-full h-full max-h-[80vh] aspect-video">
                                 {currentLesson.contentUrl.includes('youtube') ? (
                                     <iframe src={currentLesson.contentUrl} className="w-full h-full" allowFullScreen allow="autoplay"></iframe>
                                 ) : (
                                     <video src={currentLesson.contentUrl} controls className="w-full h-full bg-black"></video>
                                 )}
                             </div>
                        ) : currentLesson.type === 'QUIZ' ? (
                            <div className="bg-white p-8 rounded-xl max-w-3xl w-full m-4 text-slate-800 shadow-xl overflow-y-auto max-h-full">
                                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                    <h2 className="text-2xl font-bold flex items-center gap-2 text-indigo-900">
                                        <FileQuestion className="w-6 h-6 text-indigo-600"/> 
                                        {currentLesson.title}
                                    </h2>
                                    {quizSubmitted && (
                                        <div className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${quizScore >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {quizScore >= 70 ? <Trophy className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                                            {quizScore >= 70 ? t.training.pass : t.training.fail} ({quizScore}%)
                                        </div>
                                    )}
                                </div>

                                {!quizSubmitted && (
                                    <p className="mb-6 text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm">
                                        Vui lòng hoàn thành các câu hỏi bên dưới. Bạn cần đạt tối thiểu <strong>70%</strong> để vượt qua bài kiểm tra này.
                                    </p>
                                )}

                                <div className="space-y-6">
                                    {currentLesson.questions?.map((q, idx) => {
                                        const isCorrect = userAnswers[q.id] === q.correctIndex;
                                        
                                        return (
                                            <div key={idx} className={`p-5 rounded-xl border-2 transition-all ${
                                                quizSubmitted 
                                                    ? (isCorrect ? 'border-green-200 bg-green-50/30' : 'border-red-100 bg-red-50/30')
                                                    : 'border-slate-100 bg-slate-50'
                                            }`}>
                                                <p className="font-bold text-base mb-3 flex gap-2 text-slate-800">
                                                    <span className="text-slate-400">#{idx+1}</span> {q.text}
                                                </p>
                                                <div className="space-y-2">
                                                    {q.options.map((opt, oIdx) => {
                                                        const isSelected = userAnswers[q.id] === oIdx;
                                                        const isThisCorrect = q.correctIndex === oIdx;
                                                        
                                                        let optionClass = "border-slate-200 hover:bg-slate-100";
                                                        if (quizSubmitted) {
                                                            if (isThisCorrect) optionClass = "bg-green-100 border-green-300 text-green-800 font-medium";
                                                            else if (isSelected && !isThisCorrect) optionClass = "bg-red-100 border-red-300 text-red-800";
                                                            else optionClass = "opacity-50 border-slate-100";
                                                        } else if (isSelected) {
                                                            optionClass = "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium ring-1 ring-indigo-500";
                                                        }

                                                        return (
                                                            <label key={oIdx} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${optionClass}`}>
                                                                <input 
                                                                    type="radio" 
                                                                    name={`question-${q.id}`}
                                                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 hidden"
                                                                    checked={isSelected}
                                                                    onChange={() => handleQuizAnswer(q.id, oIdx)}
                                                                    disabled={quizSubmitted}
                                                                />
                                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 shrink-0 ${
                                                                    quizSubmitted && isThisCorrect ? 'border-green-500 bg-green-500 text-white' :
                                                                    quizSubmitted && isSelected ? 'border-red-500 bg-red-500 text-white' :
                                                                    isSelected ? 'border-indigo-600' : 'border-slate-300'
                                                                }`}>
                                                                    {quizSubmitted && isThisCorrect ? <CheckCircle className="w-3.5 h-3.5"/> :
                                                                     quizSubmitted && isSelected ? <XCircle className="w-3.5 h-3.5"/> :
                                                                     isSelected && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"/>}
                                                                </div>
                                                                <span className="text-sm">{opt}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                                    {quizSubmitted ? (
                                        <>
                                            <button 
                                                onClick={handleRetakeQuiz} 
                                                className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg flex items-center gap-2 transition-colors"
                                            >
                                                <RotateCcw className="w-4 h-4"/> {t.training.retakeQuiz}
                                            </button>
                                            {quizScore >= 70 && (
                                                <button 
                                                    onClick={handleNext} 
                                                    className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2 transition-all animate-bounce-subtle"
                                                >
                                                    Bài tiếp theo <ChevronRight className="w-4 h-4"/>
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <button 
                                            onClick={handleSubmitQuiz} 
                                            disabled={Object.keys(userAnswers).length < (currentLesson.questions?.length || 0)}
                                            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
                                        >
                                            {t.common.submit}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-white">Unsupported Lesson Type</div>
                        )}
                    </div>
                    
                    {/* Navigation Bar */}
                    <div className="h-16 bg-white border-t border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
                        <button onClick={handlePrev} disabled={flatLessons[0].id === currentLesson.id} className="text-slate-600 font-bold text-sm disabled:opacity-30 hover:text-indigo-600 flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4"/> Bài trước
                        </button>
                        <span className="font-bold text-slate-800 line-clamp-1 max-w-[50%]">{currentLesson.title}</span>
                        <button onClick={handleNext} disabled={flatLessons[flatLessons.length-1].id === currentLesson.id} className="text-indigo-600 font-bold text-sm disabled:opacity-30 hover:text-indigo-800 flex items-center gap-2">
                            Bài tiếp theo <ChevronRight className="w-4 h-4"/>
                        </button>
                    </div>
                </div>

                {/* Right: Sidebar Playlist */}
                <div className={`w-80 bg-white border-l border-slate-200 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full'}`}>
                    <div className="p-4 font-bold text-slate-800 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <span>Nội dung khóa học</span>
                        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden"><X className="w-4 h-4"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {course.sections.map((section, sIdx) => (
                            <div key={section.id}>
                                <div className="px-4 py-3 bg-slate-100 font-bold text-xs text-slate-700 border-b border-slate-200 sticky top-0">
                                    {section.title}
                                </div>
                                <div>
                                    {section.lessons.map((lesson) => {
                                        const isActive = lesson.id === currentLesson.id;
                                        const isCompleted = progress?.completedLessonIds.includes(lesson.id);
                                        return (
                                            <div 
                                                key={lesson.id}
                                                onClick={() => handleLessonSelect({ ...lesson, sectionId: section.id })}
                                                className={`px-4 py-3 border-b border-slate-50 cursor-pointer flex gap-3 hover:bg-slate-50 transition-colors ${isActive ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}
                                            >
                                                <div className="mt-0.5">
                                                    {isCompleted ? (
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <div className={`w-4 h-4 rounded-full border-2 ${isActive ? 'border-indigo-600' : 'border-slate-300'}`}></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`text-sm ${isActive ? 'font-bold text-indigo-700' : 'text-slate-600'}`}>{lesson.title}</p>
                                                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                                                        {lesson.type === 'VIDEO' ? <PlayCircle className="w-3 h-3"/> : <FileQuestion className="w-3 h-3"/>}
                                                        {lesson.durationMinutes} min
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Toggle Sidebar Button (Mobile/Desktop) */}
                {!isSidebarOpen && (
                    <button onClick={() => setIsSidebarOpen(true)} className="absolute top-20 right-0 bg-white p-2 rounded-l-md shadow-md border border-r-0 border-slate-200 z-10">
                        <ChevronRight className="w-5 h-5 text-slate-600 rotate-180"/>
                    </button>
                )}
            </div>
        </div>
    );
};

// --- COMPONENT: COURSE BUILDER (Admin) ---

const CourseBuilder = ({ course, onSave, onCancel, companyId }: { course: Course | null, onSave: () => void, onCancel: () => void, companyId: string }) => {
    const [formData, setFormData] = useState<Partial<Course>>({
        title: '',
        description: '',
        instructor: '',
        level: 'Beginner',
        thumbnail: '',
        totalDurationMinutes: 0,
        sections: []
    });

    useEffect(() => {
        if (course) setFormData(JSON.parse(JSON.stringify(course))); // Deep copy
    }, [course]);

    // Section Management
    const addSection = () => {
        const newSection: Section = {
            id: crypto.randomUUID(),
            title: `New Section ${formData.sections ? formData.sections.length + 1 : 1}`,
            lessons: []
        };
        setFormData(prev => ({ ...prev, sections: [...(prev.sections || []), newSection] }));
    };

    const updateSectionTitle = (id: string, newTitle: string) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections?.map(s => s.id === id ? { ...s, title: newTitle } : s)
        }));
    };

    const deleteSection = (id: string) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections?.filter(s => s.id !== id)
        }));
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        if (!formData.sections) return;
        const newSections = [...formData.sections];
        if (direction === 'up' && index > 0) {
            [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
        } else if (direction === 'down' && index < newSections.length - 1) {
            [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
        }
        setFormData({ ...formData, sections: newSections });
    };

    // Lesson Management
    const addLesson = (sectionId: string) => {
        const newLesson: Lesson = {
            id: crypto.randomUUID(),
            title: 'New Lesson',
            type: 'VIDEO',
            durationMinutes: 5,
            contentUrl: ''
        };
        setFormData(prev => ({
            ...prev,
            sections: prev.sections?.map(s => s.id === sectionId ? { ...s, lessons: [...s.lessons, newLesson] } : s)
        }));
    };

    const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections?.map(s => 
                s.id === sectionId 
                ? { ...s, lessons: s.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l) } 
                : s
            )
        }));
    };

    const deleteLesson = (sectionId: string, lessonId: string) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections?.map(s => 
                s.id === sectionId ? { ...s, lessons: s.lessons.filter(l => l.id !== lessonId) } : s
            )
        }));
    };

    const moveLesson = (sectionIndex: number, lessonIndex: number, direction: 'up' | 'down') => {
        if (!formData.sections) return;
        const newSections = [...formData.sections];
        const section = { ...newSections[sectionIndex] };
        const newLessons = [...section.lessons];

        if (direction === 'up' && lessonIndex > 0) {
            [newLessons[lessonIndex], newLessons[lessonIndex - 1]] = [newLessons[lessonIndex - 1], newLessons[lessonIndex]];
        } else if (direction === 'down' && lessonIndex < newLessons.length - 1) {
            [newLessons[lessonIndex], newLessons[lessonIndex + 1]] = [newLessons[lessonIndex + 1], newLessons[lessonIndex]];
        }
        
        section.lessons = newLessons;
        newSections[sectionIndex] = section;
        setFormData({ ...formData, sections: newSections });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Ensure at least one section exists if empty
        const sections = formData.sections && formData.sections.length > 0 ? formData.sections : [
            {
                id: crypto.randomUUID(),
                title: 'Introduction',
                lessons: []
            }
        ];

        const finalCourse: Course = {
            id: course?.id || crypto.randomUUID(),
            title: formData.title || 'New Course',
            description: formData.description || '',
            instructor: formData.instructor || 'Admin',
            level: formData.level || 'Beginner',
            thumbnail: formData.thumbnail || '',
            totalDurationMinutes: Number(formData.totalDurationMinutes) || 0,
            sections: sections as Section[],
            companyId,
            createdAt: course?.createdAt || new Date().toISOString()
        };
        StorageService.saveCourse(finalCourse);
        onSave();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">{course ? 'Edit Course' : 'Create New Course'}</h2>
                <div className="space-x-3">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-100 rounded-lg text-slate-700 font-medium hover:bg-slate-200">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm flex items-center inline-flex gap-2">
                        <Save className="w-4 h-4"/> Save Course
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Meta Data Column */}
                <div className="space-y-6">
                     <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Basic Info</h3>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Instructor</label>
                            <input type="text" value={formData.instructor} onChange={e => setFormData({...formData, instructor: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm" rows={4}/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Level</label>
                                <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as any})} className="w-full border border-slate-300 p-2 rounded-lg text-sm">
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Duration (Min)</label>
                                <input type="number" value={formData.totalDurationMinutes} onChange={e => setFormData({...formData, totalDurationMinutes: Number(e.target.value)})} className="w-full border border-slate-300 p-2 rounded-lg text-sm"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Thumbnail URL</label>
                            <input type="text" value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} className="w-full border border-slate-300 p-2 rounded-lg text-sm" placeholder="https://..."/>
                        </div>
                     </div>
                </div>

                {/* Curriculum Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800">Curriculum</h3>
                            <button onClick={addSection} className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-1">
                                <Plus className="w-3 h-3"/> Add Section
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {formData.sections?.map((section, sIdx) => (
                                <div key={section.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                    {/* Section Header */}
                                    <div className="flex items-center gap-2 p-3 border-b border-slate-200">
                                        <div className="flex items-center gap-1 mr-2">
                                            <button type="button" onClick={() => moveSection(sIdx, 'up')} disabled={sIdx === 0} className="text-slate-400 hover:text-blue-600 disabled:opacity-30"><ArrowUp className="w-4 h-4"/></button>
                                            <button type="button" onClick={() => moveSection(sIdx, 'down')} disabled={sIdx === (formData.sections?.length || 0) - 1} className="text-slate-400 hover:text-blue-600 disabled:opacity-30"><ArrowDown className="w-4 h-4"/></button>
                                        </div>
                                        <GripVertical className="w-4 h-4 text-slate-400 cursor-move" />
                                        <input 
                                            type="text" 
                                            value={section.title} 
                                            onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                            className="flex-1 bg-transparent border-none font-bold text-slate-700 text-sm focus:ring-0 px-0"
                                            placeholder="Section Title"
                                        />
                                        <button onClick={() => deleteSection(section.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4"/></button>
                                    </div>

                                    {/* Lessons List */}
                                    <div className="p-3 space-y-2">
                                        {section.lessons.map((lesson, lIdx) => (
                                            <div key={lesson.id} className="flex items-center gap-3 bg-white p-3 rounded border border-slate-200 shadow-sm">
                                                 <div className="flex flex-col gap-0.5 mr-2">
                                                     <button type="button" onClick={() => moveLesson(sIdx, lIdx, 'up')} disabled={lIdx === 0} className="text-slate-300 hover:text-blue-600 disabled:opacity-20"><ArrowUp className="w-3 h-3"/></button>
                                                     <button type="button" onClick={() => moveLesson(sIdx, lIdx, 'down')} disabled={lIdx === section.lessons.length - 1} className="text-slate-300 hover:text-blue-600 disabled:opacity-20"><ArrowDown className="w-3 h-3"/></button>
                                                 </div>
                                                 <div className="text-slate-400">
                                                     {lesson.type === 'VIDEO' ? <Video className="w-4 h-4"/> : <FileQuestion className="w-4 h-4"/>}
                                                 </div>
                                                 <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                     <input 
                                                        type="text" 
                                                        value={lesson.title} 
                                                        onChange={(e) => updateLesson(section.id, lesson.id, { title: e.target.value })}
                                                        className="text-sm border border-slate-200 rounded px-2 py-1 focus:border-blue-500 outline-none"
                                                        placeholder="Lesson Title"
                                                     />
                                                     <div className="flex gap-2">
                                                         <select
                                                            value={lesson.type}
                                                            onChange={(e) => updateLesson(section.id, lesson.id, { type: e.target.value as any })}
                                                            className="text-xs border border-slate-200 rounded px-1 py-1 w-20"
                                                         >
                                                             <option value="VIDEO">Video</option>
                                                             <option value="QUIZ">Quiz</option>
                                                         </select>
                                                         <input 
                                                            type="text" 
                                                            value={lesson.contentUrl || ''} 
                                                            onChange={(e) => updateLesson(section.id, lesson.id, { contentUrl: e.target.value })}
                                                            className="text-sm border border-slate-200 rounded px-2 py-1 focus:border-blue-500 outline-none font-mono text-xs text-slate-500 flex-1"
                                                            placeholder={lesson.type === 'QUIZ' ? 'Quiz instructions (optional)' : 'YouTube / Video URL'}
                                                         />
                                                     </div>
                                                 </div>
                                                 <input 
                                                    type="number"
                                                    value={lesson.durationMinutes}
                                                    onChange={(e) => updateLesson(section.id, lesson.id, { durationMinutes: Number(e.target.value) })}
                                                    className="w-16 text-sm border border-slate-200 rounded px-2 py-1 text-center"
                                                    placeholder="Min"
                                                 />
                                                 <button onClick={() => deleteLesson(section.id, lesson.id)} className="text-slate-300 hover:text-red-500"><X className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                        
                                        <button onClick={() => addLesson(section.id)} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs font-bold text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-colors flex items-center justify-center gap-1">
                                            <Plus className="w-3 h-3"/> Add Lesson
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!formData.sections || formData.sections.length === 0) && (
                                <div className="text-center py-8 text-slate-400 italic text-sm">
                                    Start by adding a section to your curriculum.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
