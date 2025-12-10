import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, UserRole, StudentGrade, GradeScore } from '../common/types';
import { GradebookIcon, AttachmentIcon, PlusIcon, CheckIcon, ChartIcon } from './icons';
// --- CẤU HÌNH ---
const SUBJECTS = ['Toán', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Ngữ Văn', 'Lịch Sử', 'Địa Lý', 'Tiếng Anh','GDKT và PL','Công Nghệ','Tin Học','GDTC','Âm Nhạc','Mỹ Thuật','GDQPAN'];
const CLASSES = ['10.1','10.2','10.3','10.4','10.5','10.6','10.7','10.8',
'11.1','11.2','11.3','11.4','11.5','11.6','11.7','11.8',
'12.1','12.2','12.3','12.4','12.5','12.6','12.7','12.8'];
// --- HELPER FUNCTIONS ---
// Hàm tính ĐTB theo quy chế 2018
const calculateGPA = (score: any): string => {
    if (!score) return '';
    let total = 0;
    let coeff = 0;
    // Điểm thường xuyên (Hệ số 1)
    if (Array.isArray(score.tx)) {
        score.tx.forEach((s: number) => { if (s != null) { total += s; coeff += 1; } });
    } else {
        // Fallback cho cấu trúc cũ
        if (score.tx1 != null) { total += score.tx1; coeff += 1; }
        if (score.tx2 != null) { total += score.tx2; coeff += 1; }
        if (score.tx3 != null) { total += score.tx3; coeff += 1; }
    }
    // Giữa kỳ (Hệ số 2)
    if (score.gk != null) { total += score.gk * 2; coeff += 2; }
    // Cuối kỳ (Hệ số 3)
    if (score.ck != null) { total += score.ck * 3; coeff += 3; }
    if (coeff === 0) return '';
    return (total / coeff).toFixed(1);
};
// Tính ĐTB Cả Năm
const calculateYearGPA = (hk1: string, hk2: string): string => {
    const s1 = parseFloat(hk1);
    const s2 = parseFloat(hk2);
    if (isNaN(s1) && isNaN(s2)) return '';
    if (isNaN(s2)) return s1.toFixed(1);
    if (isNaN(s1)) return s2.toFixed(1);
    return ((s1 + s2 * 2) / 3).toFixed(1);
};
// Sắp xếp tên A-Z
const getLastName = (name: string) => {
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].toLowerCase();
};
const Gradebook: React.FC<{ user?: User }> = ({ user }) => {
    // Lấy user hiện tại
    const currentUser = user || JSON.parse(localStorage.getItem('pedagosys_users') || '[]').find((u: any) => u.role === UserRole.DEVELOPER);
    // State dữ liệu
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [gradeData, setGradeData] = useState<any[]>([]); // Lưu cấu trúc mới { studentId, grades: { HK1: {...}, HK2: {...} } }
   
    // State bộ lọc & Cấu hình
    const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
    const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
    const [selectedSemester, setSelectedSemester] = useState<'HK1' | 'HK2' | 'YEAR'>('HK1');
    const [isEditing, setIsEditing] = useState(false);
    const [numTxCols, setNumTxCols] = useState(3); // Số cột TX
    const fileInputRef = useRef<HTMLInputElement>(null);
    // --- INIT ---
    useEffect(() => {
        const storedUsers = localStorage.getItem('pedagosys_users');
        if (storedUsers) setAllUsers(JSON.parse(storedUsers));
        // Load dữ liệu điểm (Dùng key v4 để tách biệt)
        const storedGrades = localStorage.getItem('pedagosys_grades_v4');
        if (storedGrades) setGradeData(JSON.parse(storedGrades));
    }, []);
    // --- DANH SÁCH HỌC SINH (Lọc & Sắp xếp) ---
    const studentsInClass = useMemo(() => {
        let students = allUsers.filter(u => u.role === UserRole.STUDENT && u.className === selectedClass);
        return students.sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name)));
    }, [allUsers, selectedClass]);
    // --- GET/SET SCORE ---
    const getScore = (studentId: string, semester: string, subject: string) => {
        const record = gradeData.find(r => r.studentId === studentId);
        return record?.grades?.[semester]?.[subject] || { tx: [] };
    };
    const updateScore = (studentId: string, semester: string, type: 'tx' | 'gk' | 'ck', value: string, index = 0) => {
        const numVal = value === '' ? null : parseFloat(value);
        if (numVal !== null && (numVal < 0 || numVal > 10)) return;
        setGradeData(prev => {
            const idx = prev.findIndex(r => r.studentId === studentId);
            let newRecords = [...prev];
            let record = idx >= 0 ? { ...newRecords[idx] } : { studentId, grades: {} };
            // Deep copy structure
            record.grades = { ...record.grades };
            if (!record.grades[semester]) record.grades[semester] = {};
            record.grades[semester] = { ...record.grades[semester] };
           
            if (!record.grades[semester][selectedSubject]) {
                record.grades[semester][selectedSubject] = { tx: [] };
            }
            const scoreObj = { ...record.grades[semester][selectedSubject] };
            if (type === 'gk') scoreObj.gk = numVal;
            else if (type === 'ck') scoreObj.ck = numVal;
            else if (type === 'tx') {
                const newTx = [...(scoreObj.tx || [])];
                newTx[index] = numVal;
                scoreObj.tx = newTx;
            }
            record.grades[semester][selectedSubject] = scoreObj;
            if (idx >= 0) newRecords[idx] = record;
            else newRecords.push(record);
            return newRecords;
        });
    };
    const handleSave = () => {
        localStorage.setItem('pedagosys_grades_v4', JSON.stringify(gradeData));
        setIsEditing(false);
        alert("Đã lưu bảng điểm!");
    };
    // Tự động mở rộng cột TX nếu có dữ liệu
    useEffect(() => {
        if (selectedSemester === 'YEAR' || currentUser?.role === UserRole.STUDENT) return;
        let maxTx = 3;
        studentsInClass.forEach(s => {
            const sc = getScore(s.id, selectedSemester, selectedSubject);
            if (sc.tx?.length > maxTx) maxTx = sc.tx.length;
        });
        setNumTxCols(Math.max(3, maxTx));
    }, [studentsInClass, selectedSemester, selectedSubject, gradeData]);
    // ============================
    // VIEW HỌC SINH (Student View) - Chỉ xem, không edit
    // ============================
    if (currentUser?.role === UserRole.STUDENT) {
        // Chỉ lấy điểm của chính mình
        const myRecord = gradeData.find(r => r.studentId === currentUser.id);
       
        return (
            <div className="max-w-6xl mx-auto pb-20 p-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 flex justify-between items-center border border-blue-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ChartIcon className="w-8 h-8 text-blue-600"/> Bảng Điểm Cá Nhân</h2>
                        <p className="text-gray-500 mt-1">Học sinh: <span className="font-bold text-blue-700">{currentUser.name}</span> | Lớp: {currentUser.className}</p>
                    </div>
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                        {['HK1', 'HK2', 'YEAR'].map(sem => (
                            <button key={sem} onClick={() => setSelectedSemester(sem as any)} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${selectedSemester === sem ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}>
                                {sem === 'YEAR' ? 'Cả Năm' : sem}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-4 border-r w-12 text-center">#</th>
                                    <th className="p-4 border-r min-w-[150px]">Môn Học</th>
                                    {selectedSemester === 'YEAR' ? (
                                        <>
                                            <th className="p-4 text-center border-r">ĐTB HK1</th>
                                            <th className="p-4 text-center border-r">ĐTB HK2</th>
                                            <th className="p-4 text-center bg-blue-50 text-blue-700">Cả Năm</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="p-4 text-center border-r text-gray-500">KTTX</th> {/* Cột mới: KTTX */}
                                            <th className="p-4 text-center bg-yellow-50 text-yellow-800 border-r w-24">Giữa Kỳ</th>
                                            <th className="p-4 text-center bg-red-50 text-red-800 border-r w-24">Cuối Kỳ</th>
                                            <th className="p-4 text-center bg-blue-50 text-blue-800 font-black w-24">ĐTB HK</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {SUBJECTS.map((sub, idx) => {
                                    if (selectedSemester === 'YEAR') {
                                        const hk1 = calculateGPA(myRecord?.grades?.HK1?.[sub]);
                                        const hk2 = calculateGPA(myRecord?.grades?.HK2?.[sub]);
                                        const cn = calculateYearGPA(hk1, hk2);
                                        return (
                                            <tr key={sub} className="hover:bg-blue-50/30">
                                                <td className="p-4 text-center text-gray-400 border-r">{idx + 1}</td>
                                                <td className="p-4 font-bold text-gray-800 border-r">{sub}</td>
                                                <td className="p-4 text-center border-r">{hk1 || '-'}</td>
                                                <td className="p-4 text-center border-r">{hk2 || '-'}</td>
                                                <td className="p-4 text-center font-bold text-blue-700 bg-blue-50/20">{cn || '-'}</td>
                                            </tr>
                                        )
                                    } else {
                                        const s = myRecord?.grades?.[selectedSemester]?.[sub] || {};
                                        const gpa = calculateGPA(s);
                                        const kttx = (s.tx || []).map((x: any) => x ?? '-').join(', ') || '-'; // KTTX: Chuỗi điểm TX
                                        return (
                                            <tr key={sub} className="hover:bg-blue-50/30">
                                                <td className="p-4 text-center text-gray-400 border-r">{idx + 1}</td>
                                                <td className="p-4 font-bold text-gray-800 border-r">{sub}</td>
                                                <td className="p-4 text-center border-r text-gray-600">{kttx}</td> {/* Hiển thị KTTX */}
                                                <td className="p-4 text-center border-r font-bold text-yellow-700 bg-yellow-50/10">{s.gk ?? '-'}</td>
                                                <td className="p-4 text-center border-r font-bold text-red-700 bg-red-50/10">{s.ck ?? '-'}</td>
                                                <td className={`p-4 text-center font-black ${parseFloat(gpa)>=8?'text-green-600':parseFloat(gpa)<5?'text-red-500':'text-blue-600'}`}>{gpa || '--'}</td>
                                            </tr>
                                        );
                                    }
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
    // ============================
    // VIEW GIÁO VIÊN (Teacher View) - Chỉ giáo viên edit
    // ============================
    return (
        <div className="max-w-full mx-auto pb-20 px-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm mb-6 flex flex-col gap-5 border border-green-50">
                <div className="flex justify-between items-center border-b pb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-xl"><GradebookIcon className="w-6 h-6 text-green-700"/></div>
                        <div><h2 className="text-xl font-bold text-gray-800">Sổ Điểm Điện Tử</h2><p className="text-xs text-gray-500">Lớp {selectedClass} • {selectedSubject}</p></div>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['HK1', 'HK2', 'YEAR'].map(sem => (
                            <button key={sem} onClick={() => setSelectedSemester(sem as any)} className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${selectedSemester === sem ? 'bg-white text-green-700 shadow' : 'text-gray-500'}`}>{sem === 'YEAR' ? 'Cả Năm' : sem}</button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="border p-2 rounded-lg text-sm font-bold">{CLASSES.map(c => <option key={c} value={c}>Lớp {c}</option>)}</select>
                    <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="border p-2 rounded-lg text-sm font-bold">{SUBJECTS.map(s => <option key={s} value={s}>Môn {s}</option>)}</select>
                    <div className="ml-auto">
                        {!isEditing ? <button onClick={() => setIsEditing(true)} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow">✏️ Nhập điểm</button> : <button onClick={handleSave} className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-green-700 shadow animate-pulse"><CheckIcon className="w-4 h-4 mr-1 inline"/> Lưu lại</button>}
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs sticky top-0 z-10 border-b">
                            <tr>
                                <th className="p-3 w-12 text-center border-r">STT</th>
                                <th className="p-3 min-w-[180px] border-r">Họ Tên</th>
                                {selectedSemester === 'YEAR' ? (
                                    <>
                                        <th className="p-3 text-center border-r bg-blue-50">HK1</th>
                                        <th className="p-3 text-center border-r bg-blue-50">HK2</th>
                                        <th className="p-3 text-center bg-blue-100 text-blue-800">Cả Năm</th>
                                    </>
                                ) : (
                                    <>
                                        {Array.from({length: numTxCols}).map((_, i) => <th key={i} className="p-3 w-14 text-center border-r bg-white font-medium">TX{i+1}</th>)}
                                        {isEditing && <th className="p-1 w-8 text-center border-r bg-white cursor-pointer hover:bg-green-50" onClick={() => setNumTxCols(n => n + 1)} title="Thêm cột"><PlusIcon className="w-4 h-4 mx-auto text-green-600"/></th>}
                                        <th className="p-3 w-20 text-center bg-yellow-50 text-yellow-800 border-r">GK</th>
                                        <th className="p-3 w-20 text-center bg-red-50 text-red-800 border-r">CK</th>
                                        <th className="p-3 w-20 text-center bg-blue-50 text-blue-800">ĐTB</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {studentsInClass.length === 0 ? <tr><td colSpan={15} className="p-10 text-center text-gray-400">Lớp này trống.</td></tr> : studentsInClass.map((st, idx) => {
                                if (selectedSemester === 'YEAR') {
                                    const hk1 = calculateGPA(getScore(st.id, 'HK1', selectedSubject));
                                    const hk2 = calculateGPA(getScore(st.id, 'HK2', selectedSubject));
                                    const cn = calculateYearGPA(hk1, hk2);
                                    return (
                                        <tr key={st.id} className="hover:bg-blue-50">
                                            <td className="p-3 text-center text-gray-400 border-r">{idx + 1}</td>
                                            <td className="p-3 font-semibold text-gray-800 border-r">{st.name}</td>
                                            <td className="p-3 text-center border-r">{hk1 || '-'}</td>
                                            <td className="p-3 text-center border-r">{hk2 || '-'}</td>
                                            <td className="p-3 text-center font-bold text-blue-700 bg-blue-50/20">{cn || '-'}</td>
                                        </tr>
                                    );
                                }
                                const sc = getScore(st.id, selectedSemester, selectedSubject);
                                const gpa = calculateGPA(sc);
                                return (
                                    <tr key={st.id} className="hover:bg-green-50/30">
                                        <td className="p-3 text-center text-gray-400 border-r">{idx + 1}</td>
                                        <td className="p-3 font-semibold text-gray-800 border-r">{st.name}</td>
                                        {Array.from({length: numTxCols}).map((_, i) => (
                                            <td key={i} className="p-1 text-center border-r">
                                                {isEditing ? <input type="number" className="w-full text-center p-1 text-sm border-none bg-transparent outline-none focus:bg-white focus:ring-1" value={sc.tx?.[i] ?? ''} onChange={e => updateScore(st.id, selectedSemester, 'tx', e.target.value, i)}/> : <span className="text-gray-600">{sc.tx?.[i] ?? '-'}</span>}
                                            </td>
                                        ))}
                                        {isEditing && <td className="border-r bg-gray-50"></td>}
                                        <td className="p-1 text-center border-r bg-yellow-50/20">{isEditing ? <input type="number" className="w-full text-center p-1 font-bold bg-transparent outline-none focus:bg-white" value={sc.gk ?? ''} onChange={e => updateScore(st.id, selectedSemester, 'gk', e.target.value)}/> : <span className="font-bold text-yellow-700">{sc.gk ?? '-'}</span>}</td>
                                        <td className="p-1 text-center border-r bg-red-50/20">{isEditing ? <input type="number" className="w-full text-center p-1 font-bold text-red-600 bg-transparent outline-none focus:bg-white" value={sc.ck ?? ''} onChange={e => updateScore(st.id, selectedSemester, 'ck', e.target.value)}/> : <span className="font-bold text-red-700">{sc.ck ?? '-'}</span>}</td>
                                        <td className="p-3 text-center font-black text-blue-600">{gpa || '--'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default Gradebook;