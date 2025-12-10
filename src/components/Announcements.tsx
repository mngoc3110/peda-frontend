import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Announcement } from '../common/types';
import { AnnouncementIcon, SendIcon, TrashIcon, AttachmentIcon, CloseIcon } from './icons';

interface AnnouncementsProps {
    user: User;
}

const CLASSES = Array.from({ length: 3 }, (_, i) => i + 10).flatMap(grade => 
    Array.from({ length: 8 }, (_, j) => `${grade}.${j + 1}`)
);

// 1. KHAI BÁO DANH SÁCH MÀU
const COLOR_THEMES = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo', 'teal', 'orange'];

const Announcements: React.FC<AnnouncementsProps> = ({ user }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    
    const [isFormExpanded, setIsFormExpanded] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [link, setLink] = useState('');
    const [targetType, setTargetType] = useState<'ALL' | 'ROLE' | 'CLASS'>('ALL');
    const [targetValue, setTargetValue] = useState('');
    
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const stored = localStorage.getItem('pedagosys_announcements');
        if (stored) setAnnouncements(JSON.parse(stored));
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleCreate = () => {
        if (!title || !content) return alert("Vui lòng nhập tiêu đề và nội dung!");
        if (targetType === 'CLASS' && !targetValue) return alert("Vui lòng chọn lớp!");
        if (targetType === 'ROLE' && !targetValue) return alert("Vui lòng chọn vai trò!");

        // 2. TÍNH TOÁN MÀU NGẪU NHIÊN TRƯỚC KHI DÙNG
        const randomTheme = COLOR_THEMES[Math.floor(Math.random() * COLOR_THEMES.length)];

        const newAnn: Announcement = {
            id: `ann_${Date.now()}`,
            title,
            summary: content.substring(0, 80) + (content.length > 80 ? "..." : ""),
            content,
            authorName: user.name,
            authorRole: user.role,
            timestamp: Date.now(),
            targetType,
            targetValue: targetType === 'ALL' ? '' : targetValue,
            externalLink: link,
            imageUrl: imagePreview || undefined,
            
            // 3. GÁN VÀO ĐÂY
            colorTheme: randomTheme 
        };

        const updated = [newAnn, ...announcements];
        setAnnouncements(updated);
        
        try {
            localStorage.setItem('pedagosys_announcements', JSON.stringify(updated));
            setTitle(''); setContent(''); setLink(''); setImagePreview(null);
            if(fileInputRef.current) fileInputRef.current.value = '';
            setIsFormExpanded(false);
            alert("Đã đăng thông báo thành công!");
        } catch (error) {
             alert("Lỗi: Ảnh quá lớn, không thể lưu.");
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Xóa thông báo này?")) {
            const updated = announcements.filter(a => a.id !== id);
            setAnnouncements(updated);
            localStorage.setItem('pedagosys_announcements', JSON.stringify(updated));
        }
    };

    const visibleList = announcements.filter(ann => {
        if (user.role === UserRole.ADMIN || user.role === UserRole.DEVELOPER) return true;
        if (ann.authorName === user.name) return true;
        if (ann.targetType === 'ALL') return true;
        if (ann.targetType === 'ROLE' && ann.targetValue === user.role) return true;
        if (ann.targetType === 'CLASS' && user.className === ann.targetValue) return true;
        return false;
    });

    const canCreate = user.role === UserRole.ADMIN || user.role === UserRole.DEVELOPER || user.role === UserRole.TEACHER;

    return (
        <div className="max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3"><AnnouncementIcon className="w-6 h-6 text-blue-600" /></div>
                    <h2 className="text-2xl font-bold text-gray-800">Quản lý Thông báo</h2>
                </div>
                {canCreate && (
                    <button onClick={() => setIsFormExpanded(!isFormExpanded)} className={`px-4 py-2 rounded-lg font-bold text-sm transition ${isFormExpanded ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white'}`}>
                        {isFormExpanded ? '➖ Thu gọn' : '➕ Tạo thông báo mới'}
                    </button>
                )}
            </div>

            {canCreate && isFormExpanded && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8 animate-fade-in">
                    <h3 className="font-bold text-gray-700 mb-4">📢 Soạn thông báo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="md:col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Gửi đến ai?</label>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <label className="flex items-center cursor-pointer"><input type="radio" name="target" checked={targetType === 'ALL'} onChange={() => setTargetType('ALL')} className="mr-2" /> Toàn bộ hệ thống</label>
                                <label className="flex items-center cursor-pointer"><input type="radio" name="target" checked={targetType === 'ROLE'} onChange={() => {setTargetType('ROLE'); setTargetValue(UserRole.TEACHER)}} className="mr-2" /> Theo Vai trò</label>
                                <label className="flex items-center cursor-pointer"><input type="radio" name="target" checked={targetType === 'CLASS'} onChange={() => {setTargetType('CLASS'); setTargetValue(CLASSES[0])}} className="mr-2" /> Theo Lớp học</label>
                            </div>
                            <div className="mt-3">
                                {targetType === 'ROLE' && <select className="w-full border p-2 rounded text-sm" value={targetValue} onChange={e => setTargetValue(e.target.value)}><option value={UserRole.TEACHER}>Giáo viên</option><option value={UserRole.STUDENT}>Học sinh</option></select>}
                                {targetType === 'CLASS' && <select className="w-full border p-2 rounded text-sm" value={targetValue} onChange={e => setTargetValue(e.target.value)}>{CLASSES.map(cls => <option key={cls} value={cls}>Lớp {cls}</option>)}</select>}
                            </div>
                        </div>
                        <div className="md:col-span-2"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề" className="w-full border p-2 rounded font-bold outline-none" /></div>
                        <div className="md:col-span-2"><textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Nội dung..." rows={4} className="w-full border p-2 rounded text-sm resize-none outline-none" /></div>
                        <div className="md:col-span-2"><input value={link} onChange={e => setLink(e.target.value)} placeholder="Link liên kết..." className="w-full border p-2 rounded text-sm bg-gray-50" /></div>
                        <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Hình ảnh (Tùy chọn)</label>
                             <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                             {imagePreview && (
                                 <div className="mt-3 relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                                     <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                     <button onClick={() => {setImagePreview(null); if(fileInputRef.current) fileInputRef.current.value = ''}} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><CloseIcon className="w-4 h-4" /></button>
                                 </div>
                             )}
                        </div>
                    </div>
                    <button onClick={handleCreate} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition flex items-center"><SendIcon className="w-4 h-4 mr-2" /> Phát hành</button>
                </div>
            )}

            <div className="space-y-6">
                {visibleList.length === 0 && <div className="text-center text-gray-400 py-10 border-2 border-dashed rounded-xl">Chưa có thông báo nào.</div>}
                {visibleList.map(ann => {
                    // Xử lý màu sắc an toàn
                    const theme = ann.colorTheme || 'blue'; 
                    const borderColorClass = `border-${theme}-500`;
                    const bgColorClass = `bg-${theme}-500`;
                    const textColorClass = `text-${theme}-700`;
                    const bgLightColorClass = `bg-${theme}-50`;

                    return (
                    <div key={ann.id} className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden border-l-4 ${borderColorClass} flex flex-col md:flex-row`}>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase text-white ${bgColorClass}`}>
                                        {ann.targetType === 'ALL' ? '🔔 Toàn trường' : ann.targetType === 'ROLE' ? `👥 ${ann.targetValue}` : `🏫 Lớp ${ann.targetValue}`}
                                    </span>
                                    <span className="text-xs text-gray-400">{new Date(ann.timestamp).toLocaleDateString('vi-VN')}</span>
                                </div>
                                {canCreate && <button onClick={() => handleDelete(ann.id)} className="text-gray-300 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>}
                            </div>
                            <h3 className={`font-bold text-xl ${textColorClass} mb-3`}>{ann.title}</h3>
                            <div className="text-gray-600 text-sm whitespace-pre-wrap mb-4 flex-grow">{ann.content}</div>
                             <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                                <div>
                                    {ann.externalLink && (
                                        <a href={ann.externalLink} target="_blank" rel="noreferrer" className={`inline-flex items-center text-xs font-bold ${textColorClass} hover:underline ${bgLightColorClass} px-3 py-1.5 rounded-lg`}>🔗 Xem liên kết</a>
                                    )}
                                </div>
                                <div className="text-[11px] text-gray-400">Đăng bởi: <span className="font-semibold text-gray-600">{ann.authorName}</span></div>
                             </div>
                        </div>
                        {ann.imageUrl && (
                            <div className="md:w-1/3 h-48 md:h-auto relative bg-gray-100 md:order-last">
                                <img src={ann.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                )})}
            </div>
        </div>
    );
};

export default Announcements;