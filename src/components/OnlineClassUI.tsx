import React, { useState } from 'react';
import { User, UserRole } from '../common/types';

interface OnlineClassUIProps {
  user: User;
}

interface ClassSession {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    topic: string;
    meetLink: string;
    teacherName: string;
}

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

// Mock data ban đầu
const INITIAL_CLASSES: ClassSession[] = [
    {
        id: '1',
        day: 'Thứ 2',
        startTime: '08:00',
        endTime: '09:30',
        subject: 'Toán',
        topic: 'Hàm số mũ',
        meetLink: 'https://meet.google.com/abc-defg-hij',
        teacherName: 'Cô Giáo Thảo'
    },
    {
        id: '2',
        day: 'Thứ 4',
        startTime: '14:00',
        endTime: '15:30',
        subject: 'Ngữ Văn',
        topic: 'Phân tích Tây Tiến',
        meetLink: 'https://meet.google.com/xyz-uvwx-yz1',
        teacherName: 'Thầy Hùng'
    }
];

const OnlineClassUI: React.FC<OnlineClassUIProps> = ({ user }) => {
    const [classes, setClasses] = useState<ClassSession[]>(INITIAL_CLASSES);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string>('Thứ 2');
    
    // Form state
    const [formData, setFormData] = useState({
        startTime: '',
        endTime: '',
        subject: '',
        topic: '',
        meetLink: ''
    });

    const isTeacher = user.role === UserRole.TEACHER;

    const handleOpenCreateModal = (day: string) => {
        setSelectedDay(day);
        setFormData({
            startTime: '08:00',
            endTime: '09:30',
            subject: '',
            topic: '',
            meetLink: ''
        });
        setIsModalOpen(true);
    };

    const generateMeetLink = () => {
        // Mô phỏng tạo link Google Meet ngẫu nhiên
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const segment = (length: number) => {
            let res = '';
            for (let i = 0; i < length; i++) {
                res += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return res;
        };
        const link = `https://meet.google.com/${segment(3)}-${segment(4)}-${segment(3)}`;
        setFormData(prev => ({ ...prev, meetLink: link }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject || !formData.meetLink) {
            alert("Vui lòng nhập môn học và tạo đường dẫn họp.");
            return;
        }

        const newClass: ClassSession = {
            id: Date.now().toString(),
            day: selectedDay,
            startTime: formData.startTime,
            endTime: formData.endTime,
            subject: formData.subject,
            topic: formData.topic,
            meetLink: formData.meetLink,
            teacherName: user.name
        };

        setClasses([...classes, newClass]);
        setIsModalOpen(false);
    };

    const handleDeleteClass = (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn hủy lớp học này?")) {
            setClasses(classes.filter(c => c.id !== id));
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Thời khóa biểu Học trực tuyến</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {isTeacher 
                            ? "Chọn ngày để lên lịch và tạo phòng Google Meet." 
                            : "Theo dõi lịch học và tham gia đúng giờ."}
                    </p>
                </div>
            </div>

            {/* Timetable Grid */}
            <div className="flex-grow overflow-x-auto">
                <div className="grid grid-cols-7 gap-4 min-w-[1000px] h-full">
                    {DAYS.map(day => (
                        <div key={day} className="flex flex-col h-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            {/* Day Header */}
                            <div className="bg-blue-100 p-3 text-center border-b border-blue-200">
                                <h3 className="font-bold text-blue-800">{day}</h3>
                            </div>

                            {/* Classes List */}
                            <div className="flex-1 p-2 space-y-3 overflow-y-auto">
                                {classes
                                    .filter(c => c.day === day)
                                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                    .map(session => (
                                    <div key={session.id} className="bg-white p-3 rounded shadow-sm border border-gray-100 hover:shadow-md transition group relative">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                                {session.startTime} - {session.endTime}
                                            </span>
                                            {isTeacher && session.teacherName === user.name && (
                                                <button 
                                                    onClick={() => handleDeleteClass(session.id)}
                                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                    title="Hủy lớp"
                                                >
                                                    &times;
                                                </button>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-sm">{session.subject}</h4>
                                        <p className="text-xs text-gray-500 mb-2 truncate">{session.topic}</p>
                                        <p className="text-[10px] text-gray-400 mb-2">GV: {session.teacherName}</p>
                                        
                                        <a 
                                            href={session.meetLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className={`block text-center w-full py-1.5 rounded text-xs font-bold transition ${
                                                isTeacher 
                                                    ? 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-50' 
                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                        >
                                            {isTeacher ? 'Mở Meet' : 'Vào học'}
                                        </a>
                                    </div>
                                ))}

                                {classes.filter(c => c.day === day).length === 0 && (
                                    <div className="text-center py-4 text-gray-300 text-xs italic">
                                        Trống
                                    </div>
                                )}
                            </div>

                            {/* Add Button (Teacher Only) */}
                            {isTeacher && (
                                <button 
                                    onClick={() => handleOpenCreateModal(day)}
                                    className="p-2 m-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition flex justify-center items-center"
                                    title="Thêm lớp học mới"
                                >
                                    <span className="text-xl leading-none">+</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Class Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800">Lên lịch cho {selectedDay}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800">&times;</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Bắt đầu</label>
                                    <input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full border p-2 rounded text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Kết thúc</label>
                                    <input type="time" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full border p-2 rounded text-sm"/>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Môn học</label>
                                <input type="text" required placeholder="Ví dụ: Toán Hình học" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Chủ đề bài học</label>
                                <input type="text" placeholder="Nội dung chính..." value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Đường dẫn Google Meet</label>
                                <div className="flex space-x-2">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        placeholder="Chưa có link..." 
                                        value={formData.meetLink} 
                                        className="flex-1 border p-2 rounded text-sm bg-gray-50 text-gray-600"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={generateMeetLink}
                                        className="bg-green-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-green-700 whitespace-nowrap flex items-center"
                                    >
                                        <span className="mr-1">📹</span> Tạo Meet
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">*Bấm "Tạo Meet" để sinh đường dẫn cuộc họp ngẫu nhiên.</p>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded text-sm font-medium hover:bg-gray-200">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 shadow">Lưu lịch</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnlineClassUI;