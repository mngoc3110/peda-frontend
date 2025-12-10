import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, UserRole, Assignment, AssignmentSubmission, AssignmentComment } from '../common/types';
import { AssignmentsIcon, SendIcon, TrashIcon, CheckIcon, AiIcon, AttachmentIcon, ChartIcon, ClockIcon, LockIcon, CloseIcon } from './icons'; 
import { generateWeeklyExercises } from '../service/gemini_server';

// Khai báo katex
declare const katex: any;

// 🔗 BACKEND API
const API_URL = "https://peda-backend-qi7k.onrender.com";// đổi sang localhost khi dev: "http://localhost:10000"

// --- CẤU HÌNH STORAGE ---
const STORAGE_KEY_DATA = 'pedagosys_assignments_v12_class_filtered'; 
const STORAGE_KEY_TIME = 'pedagosys_ai_last_run_date_v12';

// --- HÀM DELAY ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- INTERFACES ---
interface QuizConfig {
    isQuiz: boolean;
    durationMinutes: number | null;
    totalQuestions: number;
    correctAnswers: { [key: number]: string };
}

interface ExtendedAssignment extends Assignment {
    quizConfig?: QuizConfig;
    isLocked?: boolean;
    targetClass: string; // Bắt buộc có trường này để phân loại
}

interface LeaderboardItem {
    studentId: string;
    studentName: string;
    studentAvatar: string;
    totalScore: number;
}

// --- HELPER ---
const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getDefaultDeadline = () => {
    const date = new Date(); date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 16);
};

// Danh sách lớp (Khớp với format "10.5" trong profile)
const CLASSES = Array.from({ length: 3 }, (_, i) => i + 10).flatMap(grade => Array.from({ length: 8 }, (_, j) => `${grade}.${j + 1}`));

// --- HELPER COMPONENTS ---
const LatexBlock: React.FC<{ content: string, displayMode: boolean }> = ({ content, displayMode }) => {
    const containerRef = useRef<HTMLElement>(null);
    useEffect(() => {
        if (containerRef.current && typeof katex !== 'undefined') {
            try {
                katex.render(content, containerRef.current, { throwOnError: false, displayMode: displayMode });
            } catch (e) { containerRef.current.innerText = content; }
        }
    }, [content, displayMode]);
    return displayMode ? <div ref={containerRef as any} className="my-2 text-center" /> : <span ref={containerRef as any} className="px-1" />;
};

const AssignmentContentRenderer: React.FC<{ text: string }> = ({ text }) => {
    const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\(.*?\\\)|(?<!\\)\$.*?(?<!\\)\$)/g;
    const parts = text.split(regex);
    return (
        <div className="whitespace-pre-wrap leading-relaxed text-gray-800 font-medium">
            {parts.map((part, index) => {
                if (part.startsWith('$$') && part.endsWith('$$')) return <LatexBlock key={index} content={part.slice(2, -2)} displayMode={true} />;
                if (part.startsWith('$') && part.endsWith('$')) return <LatexBlock key={index} content={part.slice(1, -1)} displayMode={false} />;
                return <span key={index}>{part}</span>;
            })}
        </div>
    );
};

// --- COMPONENT CHÍNH ---
interface AssignmentsProps { user: User; }

const Assignments: React.FC<AssignmentsProps> = ({ user }) => {
    const [assignments, setAssignments] = useState<ExtendedAssignment[]>([]);
    const [activeTab, setActiveTab] = useState<'TEACHER' | 'AI'>('TEACHER');
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    
    // Filter State
    const [viewClass, setViewClass] = useState<string>('Toàn trường');
    
    // Quiz & Leaderboard
    const [showLeaderboard, setShowLeaderboard] = useState(false); 
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
    const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
    
    // Teacher Form
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetClass, setTargetClass] = useState(CLASSES[4]); // Mặc định 10.5 (index 4) cho tiện test
    const [deadline, setDeadline] = useState(getDefaultDeadline());
    const [teacherFile, setTeacherFile] = useState<File | null>(null);

    // Interaction
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const [submissionFile, setSubmissionFile] = useState<File | null>(null);
    
    const teacherInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- 1. TIMER LOGIC ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeQuizId && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        handleAutoSubmit(activeQuizId);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeQuizId, timeLeft]);

    const handleAutoSubmit = (quizId: string) => {
        alert("⏰ Đã hết thời gian làm bài! Hệ thống sẽ tự động thu bài.");
        handleSubmitQuiz(quizId, true);
    };

    // --- 2. INIT & AI LOGIC ---
    useEffect(() => {
        const initSystem = async () => {
            const stored = localStorage.getItem(STORAGE_KEY_DATA);
            let currentList: ExtendedAssignment[] = stored ? JSON.parse(stored) : [];
            
            const now = Date.now();
            currentList = currentList.map(a => ({ ...a, isLocked: now > a.deadline }));
            
            setAssignments(currentList);
            calculateLeaderboard(currentList);

            const todayStr = new Date().toDateString();
            const lastRunDate = localStorage.getItem(STORAGE_KEY_TIME);
            const isPrivileged = [UserRole.ADMIN, UserRole.TEACHER, UserRole.DEVELOPER].includes(user.role);

            // Tự động tạo bài tập AI (Chỉ GV/Admin kích hoạt để tránh lỗi Quota)
            if (isPrivileged && lastRunDate !== todayStr) {
                setIsAiGenerating(true);
                const subjects = ["Toán Học", "Vật Lý", "Hóa Học"];
                const newAiAssignments: ExtendedAssignment[] = [];
                
                for (let i = 0; i < 2; i++) {
                    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
                    const isHardMode = i === 1;
                    if (i > 0) await delay(4000); 

                    try {
                        const aiContent = await generateWeeklyExercises(randomSubject, "12");
                        
                        if (!aiContent || aiContent.includes("Error") || aiContent.trim().length < 50) {
                            console.warn(`AI Generation Failed for iteration ${i}`);
                            continue; 
                        }

                        // Fake answers
                        const mockCorrectAnswers: { [key: number]: string } = {};
                        for (let q = 1; q <= 10; q++) mockCorrectAnswers[q] = ['A','B','C','D'][Math.floor(Math.random() * 4)];

                        newAiAssignments.push({
                            id: `ai_${Date.now()}_${i}`,
                            teacherId: 'ai_tutor', teacherName: '🤖 AI Gia Sư',
                            title: isHardMode ? `[Nâng Cao] ${randomSubject} - Tư duy` : `[Thi Thử] ${randomSubject} - Tốc độ`,
                            content: aiContent,
                            targetClass: 'Toàn trường',
                            deadline: Date.now() + 2 * 24 * 60 * 60 * 1000,
                            createdAt: Date.now() + i * 1000,
                            submissions: [], comments: [],
                            quizConfig: { isQuiz: true, durationMinutes: isHardMode ? null : 45, totalQuestions: 10, correctAnswers: mockCorrectAnswers }
                        });

                    } catch (e) {
                        console.error(`Lỗi tạo bài AI:`, e);
                    }
                }

                if (newAiAssignments.length > 0) {
                    const updatedList = [...newAiAssignments, ...currentList];
                    setAssignments(updatedList);
                    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(updatedList));
                    localStorage.setItem(STORAGE_KEY_TIME, todayStr);
                    calculateLeaderboard(updatedList);
                }
                
                setIsAiGenerating(false);
            }
        };
        initSystem();
    }, [user.role]);

    const saveAssignments = (newAssignments: ExtendedAssignment[]) => {
        setAssignments(newAssignments);
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(newAssignments));
        calculateLeaderboard(newAssignments);
    };

    const calculateLeaderboard = (list: ExtendedAssignment[]) => {
        const scores: { [id: string]: LeaderboardItem } = {};
        list.forEach(asm => {
            if (asm.teacherId === 'ai_tutor') {
                asm.submissions.forEach(sub => {
                    if (sub.score) {
                        if (!scores[sub.studentId]) {
                            scores[sub.studentId] = { 
                                studentId: sub.studentId, studentName: sub.studentName, studentAvatar: sub.studentAvatar, totalScore: 0 
                            };
                        }
                        scores[sub.studentId].totalScore += sub.score;
                    }
                });
            }
        });
        setLeaderboardData(Object.values(scores).sort((a,b) => b.totalScore - a.totalScore));
    };

    // --- 3. FILTER LOGIC ---
    const filteredAssignments = useMemo(() => {
        return assignments.filter(a => {
            const isTabMatch = activeTab === 'TEACHER' ? a.teacherId !== 'ai_tutor' : a.teacherId === 'ai_tutor';
            if (!isTabMatch) return false;

            if (user.role === UserRole.ADMIN || user.role === UserRole.DEVELOPER) {
                return viewClass === 'Toàn trường' ? true : a.targetClass === viewClass;
            }
            
            if (user.role === UserRole.TEACHER) return true;

            if (user.role === UserRole.STUDENT) {
                return a.targetClass === 'Toàn trường' || a.targetClass === user.className;
            }

            return false;
        }).sort((a, b) => b.createdAt - a.createdAt);
    }, [assignments, activeTab, viewClass, user]);

    // --- HANDLERS ---
    const handleTeacherFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setTeacherFile(e.target.files[0]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setSubmissionFile(e.target.files[0]);
    };

    const handleStartQuiz = (asm: ExtendedAssignment) => {
        if (asm.isLocked) return alert("Bài tập này đã quá hạn!");
        if (confirm(`Bắt đầu làm bài?\nThời gian: ${asm.quizConfig?.durationMinutes ? asm.quizConfig.durationMinutes + ' phút' : 'Thoải mái'}`)) {
            setActiveQuizId(asm.id);
            setUserAnswers({});
            setTimeLeft(asm.quizConfig?.durationMinutes ? asm.quizConfig.durationMinutes * 60 : 0);
        }
    };

    const handleSubmitQuiz = (asmId: string, isAuto = false) => {
        const asm = assignments.find(a => a.id === asmId);
        if (!asm || !asm.quizConfig) return;

        let correctCount = 0;
        const total = asm.quizConfig.totalQuestions;
        Object.keys(userAnswers).forEach(q => {
            if (userAnswers[parseInt(q)] === asm.quizConfig!.correctAnswers[parseInt(q)]) correctCount++;
        });
        
        const score = total > 0 ? Math.round((correctCount / total) * 10 * 10) / 10 : 0;

        const newSub: AssignmentSubmission = {
            studentId: user.id, studentName: user.name, studentAvatar: user.avatarUrl,
            submittedAt: Date.now(), fileName: 'Quiz Result', fileUrl: '#', score: score
        };

        const updated = assignments.map(a => a.id === asmId ? { ...a, submissions: [...a.submissions.filter(s => s.studentId !== user.id), newSub] } : a);
        saveAssignments(updated);
        setActiveQuizId(null);
        if (!isAuto) alert(`Kết quả: ${correctCount}/${total} câu đúng.\nĐiểm số: ${score}`);
    };

    // --- TẠO BÀI TẬP (GIÁO VIÊN) ---
    const handleTeacherCreate = () => {
        if (!title || !content || !deadline) return alert("Thiếu thông tin tiêu đề, nội dung hoặc hạn nộp!");
        
        const newAsm: ExtendedAssignment = {
            id: `asm_${Date.now()}`, 
            teacherId: user.id, 
            teacherName: user.name,
            title, content, 
            targetClass: targetClass,
            deadline: new Date(deadline).getTime(), 
            createdAt: Date.now(),
            submissions: [], comments: [], 
            attachmentName: teacherFile?.name,
            attachmentUrl: teacherFile ? URL.createObjectURL(teacherFile) : undefined
        };
        saveAssignments([newAsm, ...assignments]);
        setIsCreating(false); setTitle(''); setContent(''); setTeacherFile(null);
        if (teacherInputRef.current) teacherInputRef.current.value = '';
        alert(`Đã giao bài thành công cho lớp ${targetClass}`);
    };

    // 🔥 NỘP BÀI LÊN BACKEND (UPLOAD FILE)
    const handleTeacherSubmitFile = async (asmId: string) => {
  if (!submissionFile) {
    alert("Chưa chọn file!");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", submissionFile);      // trùng với upload.single("file")
    formData.append("assignmentId", asmId);
    formData.append("studentId", user.id);

    console.log("📤 Đang gửi FormData tới:", `${API_URL}/api/submissions/upload`);
    console.log("assignmentId:", asmId, "studentId:", user.id, "file:", submissionFile.name);

    const res = await fetch(`${API_URL}/api/submissions/upload`, {
      method: "POST",
      body: formData,
    });

    const debugText = await res.text();
    console.log("📥 Response status:", res.status);
    console.log("📥 Response raw body:", debugText);

    if (!res.ok) {
      // thử parse JSON, nếu lỗi thì dùng fallback
      let errMsg = "Nộp bài thất bại.";
      try {
        const errJson = JSON.parse(debugText);
        if (errJson.message) errMsg = errJson.message;
      } catch (_) {}
      throw new Error(errMsg);
    }

    const backendSub = JSON.parse(debugText);

    const newSub: AssignmentSubmission = {
      ...backendSub,
      studentName: user.name,
      studentAvatar: user.avatarUrl,
    };

    const updated = assignments.map((a) =>
      a.id === asmId
        ? {
            ...a,
            submissions: [
              ...a.submissions.filter((s) => s.studentId !== user.id),
              newSub,
            ],
          }
        : a
    );

    saveAssignments(updated);

    setSubmissionFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    alert("Nộp bài thành công!");
  } catch (e: any) {
    console.error(e);
    alert(e.message || "Có lỗi khi nộp bài.");
  }
};

    const handlePostComment = (asm: ExtendedAssignment) => {
        if (!commentText.trim()) return;
        const newCmt: AssignmentComment = { id: `cmt_${Date.now()}`, userId: user.id, userName: user.name, userAvatar: user.avatarUrl, userRole: user.role, content: commentText, timestamp: Date.now() };
        saveAssignments(assignments.map(a => a.id === asm.id ? { ...a, comments: [...a.comments, newCmt] } : a));
        setCommentText('');
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 relative">
            {/* LEADERBOARD MODAL */}
            {showLeaderboard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 flex justify-between items-center text-white">
                            <h3 className="text-lg font-bold flex items-center"><ChartIcon className="w-6 h-6 mr-2" /> Bảng Phong Thần</h3>
                            <button onClick={() => setShowLeaderboard(false)} className="hover:bg-white/20 p-1 rounded-full transition"><CloseIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {leaderboardData.length === 0 ? <p className="text-center text-gray-500 py-8">Chưa có dữ liệu.</p> : (
                                <table className="w-full text-left">
                                    <thead className="text-xs text-gray-400 uppercase bg-gray-50"><tr><th className="p-3">Hạng</th><th className="p-3">Học sinh</th><th className="p-3 text-right">Tổng điểm</th></tr></thead>
                                    <tbody className="text-sm">
                                        {leaderboardData.map((item, idx) => (
                                            <tr key={item.studentId} className={`border-b last:border-0 ${item.studentId === user.id ? 'bg-yellow-50' : ''}`}>
                                                <td className="p-3 font-bold text-gray-500">{idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</td>
                                                <td className="p-3 flex items-center"><img src={item.studentAvatar} className="w-8 h-8 rounded-full mr-3 border" /> <span className={`font-bold ${item.studentId === user.id ? 'text-blue-600' : 'text-gray-700'}`}>{item.studentName}</span></td>
                                                <td className="p-3 text-right font-bold text-orange-600">{item.totalScore}đ</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <div className="flex items-center">
                    <div className="bg-purple-100 p-2 rounded-lg mr-3"><AssignmentsIcon className="w-8 h-8 text-purple-600" /></div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Góc Học Tập</h2>
                        {user.role === UserRole.STUDENT && <p className="text-sm text-gray-500">Lớp của bạn: <span className="font-bold text-blue-600">{user.className || "Chưa cập nhật"}</span></p>}
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <button onClick={() => setShowLeaderboard(true)} className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:scale-105 transition">🏆 Xem BXH</button>
                    {(user.role === UserRole.ADMIN || user.role === UserRole.DEVELOPER) &&
                        <select value={viewClass} onChange={e => setViewClass(e.target.value)} className="border rounded-lg px-2 py-2 text-sm">
                            <option value="Toàn trường">Toàn trường</option>
                            {CLASSES.map(c => <option key={c} value={c}>Lớp {c}</option>)}
                        </select>
                    }
                </div>
            </div>

            {/* TABS */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6 w-fit mx-auto md:mx-0">
                <button onClick={() => setActiveTab('TEACHER')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'TEACHER' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}>GV Giao</button>
                <button onClick={() => setActiveTab('AI')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'AI' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>AI Thi Thử</button>
            </div>

            {user.role === UserRole.TEACHER && activeTab === 'TEACHER' && <button onClick={() => setIsCreating(!isCreating)} className="mb-6 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md block ml-auto">{isCreating ? 'Đóng' : '+ Giao bài mới'}</button>}

            {isAiGenerating && <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center animate-pulse"><AiIcon className="w-5 h-5 mr-2 animate-spin" /> AI đang tạo đề thi mới...</div>}

            {/* TEACHER FORM */}
            {isCreating && activeTab === 'TEACHER' && (
                <div className="bg-white p-6 rounded-xl shadow border border-purple-100 mb-6 animate-fade-in">
                    <h3 className="font-bold text-gray-700 mb-4">Soạn bài mới</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2"><input value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2 rounded font-bold" placeholder="Tiêu đề bài tập" /></div>
                        <div className="md:col-span-2"><textarea value={content} onChange={e => setContent(e.target.value)} className="w-full border p-2 rounded h-24" placeholder="Nội dung bài tập, dặn dò..." /></div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Giao cho lớp:</label>
                            <select value={targetClass} onChange={e => setTargetClass(e.target.value)} className="w-full border p-2 rounded bg-white">
                                <option value="Toàn trường">Toàn trường (Tất cả HS)</option>
                                {CLASSES.map(c => <option key={c} value={c}>Lớp {c}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Hạn nộp:</label>
                            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full border p-2 rounded" />
                        </div>
                    </div>
                    <div className="mt-4"><input type="file" ref={teacherInputRef} onChange={handleTeacherFileSelect} className="text-sm" /></div>
                    <button onClick={handleTeacherCreate} className="mt-4 bg-purple-600 text-white px-6 py-2 rounded font-bold w-full hover:bg-purple-700 transition">Phát hành bài tập</button>
                </div>
            )}

            {/* LIST */}
            <div className="space-y-6">
                {filteredAssignments.length === 0 && !isAiGenerating && <div className="text-center py-20 bg-white rounded-xl border-dashed border-2 text-gray-400">Không có bài tập nào cho lớp này.</div>}
                
                {filteredAssignments.map(asm => {
                    const isAI = asm.teacherId === 'ai_tutor';
                    const isExpanded = expandedId === asm.id;
                    const mySub = asm.submissions.find(s => s.studentId === user.id);
                    const isDoingThis = activeQuizId === asm.id;
                    const isLocked = asm.isLocked || (Date.now() > asm.deadline);
                    const hasTimer = asm.quizConfig?.durationMinutes;

                    return (
                        <div key={asm.id} className={`bg-white rounded-xl border shadow-sm transition ${isAI ? 'border-blue-200 ring-1 ring-blue-50' : 'border-gray-200'} ${isLocked ? 'opacity-70 bg-gray-50' : ''}`}>
                            <div className={`p-5 cursor-pointer ${isAI ? 'bg-gradient-to-r from-blue-50/30 to-white' : ''}`} onClick={() => !isDoingThis && setExpandedId(isExpanded ? null : asm.id)}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isAI ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>{isAI ? 'AI TEST' : 'BÀI TẬP'}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700">Lớp: {asm.targetClass}</span>
                                            
                                            {isAI && hasTimer && <span className="flex items-center text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded"><ClockIcon className="w-3 h-3 mr-1" /> {asm.quizConfig?.durationMinutes} phút</span>}
                                            {isLocked && <span className="flex items-center text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded"><LockIcon className="w-3 h-3 mr-1" /> Đã đóng</span>}
                                            {mySub && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">{mySub.score !== undefined ? `ĐIỂM: ${mySub.score}` : 'ĐÃ NỘP'}</span>}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800">{asm.title}</h3>
                                        <p className="text-xs text-gray-500">Giáo viên: {asm.teacherName} • Hạn chót: {new Date(asm.deadline).toLocaleString()}</p>
                                    </div>
                                    {isDoingThis && <div className="text-2xl font-mono font-bold text-red-600 animate-pulse">{formatTime(timeLeft)}</div>}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="border-t bg-gray-50 p-5">
                                    {!isDoingThis && !mySub && isAI && asm.quizConfig ? (
                                        <div className="text-center py-8">
                                            <h4 className="font-bold text-gray-700 mb-2">Bài thi trắc nghiệm</h4>
                                            <p className="text-sm text-gray-500 mb-4">{hasTimer ? `Thời gian: ${asm.quizConfig.durationMinutes} phút` : "Thời gian: Thoải mái"}</p>
                                            {isLocked ? <button disabled className="bg-gray-400 text-white px-6 py-2 rounded font-bold cursor-not-allowed">Đã hết hạn</button> :
                                                <button onClick={() => handleStartQuiz(asm)} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 shadow-lg transform hover:scale-105 transition">⏱️ Bắt đầu làm bài</button>}
                                        </div>
                                    ) : (
                                        <div className="bg-white p-5 rounded-lg border border-gray-200 mb-6 shadow-sm">
                                            <AssignmentContentRenderer text={asm.content} />
                                            {asm.attachmentUrl && <a href={asm.attachmentUrl} className="text-blue-600 text-xs font-bold underline mt-2 block">Tải đính kèm: {asm.attachmentName}</a>}
                                        </div>
                                    )}

                                    {/* QUIZ FORM */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4">
                                        {isDoingThis && asm.quizConfig && (
                                            <div>
                                                <h4 className="font-bold text-blue-700 text-sm mb-3 border-b pb-2">Phiếu Trả Lời</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                                                    {Array.from({ length: asm.quizConfig.totalQuestions }, (_, i) => i + 1).map(q => (
                                                        <div key={q} className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-gray-500 mb-1">Câu {q}</span>
                                                            <select className={`border rounded p-1 text-sm font-bold outline-none ${userAnswers[q] ? 'bg-blue-50 border-blue-300' : ''}`} value={userAnswers[q] || ''} onChange={(e) => setUserAnswers(p => ({ ...p, [q]: e.target.value }))}>
                                                                <option value="">--</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                                                            </select>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button onClick={() => handleSubmitQuiz(asm.id)} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Nộp Bài Thi</button>
                                            </div>
                                        )}

                                        {/* FILE SUBMISSION FORM (STUDENT) */}
                                        {!isAI && !mySub && user.role === UserRole.STUDENT && (
                                            <div>
                                                <h4 className="font-bold text-gray-700 text-sm mb-3">Nộp bài tập (File)</h4>
                                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="block w-full text-xs text-gray-500 mb-3" />
                                                <button onClick={() => handleTeacherSubmitFile(asm.id)} className="w-full bg-purple-600 text-white py-2 rounded font-bold text-sm">Nộp File</button>
                                            </div>
                                        )}

                                        {/* SUBMISSIONS LIST */}
                                        {(mySub || user.role !== UserRole.STUDENT) && !isDoingThis && (
                                            <div>
                                                <h4 className="font-bold text-sm mb-2">Danh sách nộp ({asm.submissions.length})</h4>
                                                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                                                    {asm.submissions.map(s => (
                                                        <div key={s.studentId} className="flex justify-between items-center text-xs p-2 border-b hover:bg-gray-50">
                                                            <div className="flex items-center gap-2"><img src={s.studentAvatar} className="w-5 h-5 rounded-full" /> <span className="font-bold">{s.studentName}</span></div>
                                                            <div className="font-bold">
                                                                {s.score !== undefined ? (
                                                                    <span className="text-yellow-600">{s.score}đ</span>
                                                                ) : (
                                                                    <a href={s.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600">File</a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {asm.submissions.length === 0 && <div className="text-gray-400 text-xs text-center">Chưa có bài nộp.</div>}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* COMMENTS */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                                        <h4 className="font-bold text-sm mb-2">Thảo luận</h4>
                                        <div className="max-h-32 overflow-y-auto mb-2 space-y-2">
                                            {asm.comments.map(c => <div key={c.id} className="text-xs bg-gray-100 p-2 rounded"><strong>{c.userName}:</strong> {c.content}</div>)}
                                        </div>
                                        <div className="flex gap-2">
                                            <input value={commentText} onChange={e => setCommentText(e.target.value)} className="flex-1 border rounded px-2 py-1 text-xs" placeholder="Bình luận..." />
                                            <button onClick={() => handlePostComment(asm)} className="bg-gray-800 text-white px-3 rounded"><SendIcon className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Assignments;