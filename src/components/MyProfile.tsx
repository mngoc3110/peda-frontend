import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, LibraryPost } from '../common/types';
import { DotsHorizontalIcon, CloseIcon } from './icons';

interface MyProfileProps {
    user: User;
    onUpdateUser: (user: User) => void;
}

const MyProfile: React.FC<MyProfileProps> = ({ user, onUpdateUser }) => {
    const [userPosts, setUserPosts] = useState<LibraryPost[]>([]);
    
    // State Form
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState(user.name);
    const [editNickname, setEditNickname] = useState(user.nickname || '');
    const [editPhoneNumber, setEditPhoneNumber] = useState(user.phoneNumber || '');
    const [editJobTitle, setEditJobTitle] = useState(user.jobTitle || '');
    const [editBio, setEditBio] = useState(user.bio || "");
    const [newPassword, setNewPassword] = useState('');
    
    const [editSubject, setEditSubject] = useState(user.subject || '');     
    const [editClassName, setEditClassName] = useState(user.className || ''); 
    const [editSchool, setEditSchool] = useState(user.school || '');
    const [editWorkplace, setEditWorkplace] = useState(user.workplace || '');

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedPosts = localStorage.getItem('pedagosys_library_posts');
        if (storedPosts) {
            const allPosts: LibraryPost[] = JSON.parse(storedPosts);
            const myPosts = allPosts.filter(p => p.authorId === user.id);
            setUserPosts(myPosts);
        }
        setEditName(user.name);
        setEditNickname(user.nickname || '');
        setEditPhoneNumber(user.phoneNumber || '');
        setEditJobTitle(user.jobTitle || '');
        setEditBio(user.bio || "");
        setEditSubject(user.subject || '');
        setEditClassName(user.className || '');
        setEditSchool(user.school || '');
        setEditWorkplace(user.workplace || '');
        setNewPassword('');
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSaveChanges = () => {
        // Kiểm tra logic: Học sinh không được tự đổi lớp (Trừ khi là Admin đang sửa hộ - ở đây là User tự sửa nên chặn)
        // Nhưng ở đây ta disable input rồi nên giá trị state sẽ không đổi
        
        const updatedUser: User = {
            ...user,
            name: editName,
            nickname: editNickname,
            phoneNumber: editPhoneNumber,
            jobTitle: editJobTitle,
            bio: editBio,
            password: newPassword.trim() ? newPassword : user.password,
            
            subject: user.role === UserRole.TEACHER ? editSubject : undefined,
            workplace: user.role === UserRole.TEACHER ? editWorkplace : undefined,
            
            className: user.role === UserRole.STUDENT ? editClassName : undefined,
            school: user.role === UserRole.STUDENT ? editSchool : undefined,
        };

        onUpdateUser(updatedUser);
        setIsEditModalOpen(false);
        setIsMenuOpen(false);
        alert("Cập nhật hồ sơ thành công!");
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100 relative">
                <div className="absolute top-4 right-4" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition">
                        <DotsHorizontalIcon className="w-6 h-6" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden animate-fade-in-up">
                            <button onClick={() => { setIsEditModalOpen(true); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center transition">
                                <span className="mr-2">✏️</span> Chỉnh sửa thông tin
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                    <div className="relative group cursor-pointer">
                        <img src={user.avatarUrl} alt="Profile" className="w-24 h-24 rounded-full border-4 border-blue-50 object-cover group-hover:opacity-90 transition" />
                        <span className={`absolute bottom-1 right-1 w-5 h-5 border-2 border-white rounded-full ${user.isApproved ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left pt-1">
                        <div className="flex items-center justify-center md:justify-start">
                            <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                            {user.nickname && <span className="ml-2 text-lg font-normal text-gray-500">({user.nickname})</span>}
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1 text-sm text-gray-600">
                            <span className="font-medium">@{user.username}</span>
                            <span>•</span>
                            <span className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded ${user.role === UserRole.ADMIN ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                {user.role}
                            </span>
                            {user.school && <span className="text-gray-500">🏫 {user.school}</span>}
                            {user.workplace && <span className="text-gray-500">🏢 {user.workplace}</span>}
                        </div>

                        <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-2">
                            {user.jobTitle && <span className="bg-gray-100 px-2 py-1 rounded-lg text-xs font-medium text-gray-700">💼 {user.jobTitle}</span>}
                            {user.subject && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-medium">📚 Bộ môn: {user.subject}</span>}
                            {user.className && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-medium">🎓 Lớp: {user.className}</span>}
                        </div>
                        
                        <div className="flex items-center justify-center md:justify-start mt-5 space-x-8">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-500">{user.reputation}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Điểm Uy Tín</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200"></div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{userPosts.length}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Bài viết</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CONTENT --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-fit relative group">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-gray-800 text-sm flex items-center"><span className="mr-2">👋</span> Giới thiệu</h3>
                            <button onClick={() => setIsEditModalOpen(true)} className="text-xs text-blue-600 hover:underline font-medium">Sửa</button>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line min-h-[60px]">{user.bio || "Chưa có thông tin giới thiệu."}</p>
                    </div>
                    
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-3 text-sm">Thông tin liên hệ</h3>
                        <div className="text-sm space-y-2 text-gray-600">
                            <p>📞 {user.phoneNumber || "Chưa cập nhật"}</p>
                            {user.school && <p>🏫 {user.school}</p>}
                            {user.workplace && <p>🏢 {user.workplace}</p>}
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center text-lg"><span className="bg-blue-100 p-1.5 rounded-lg mr-2">📝</span> Bài viết đã đăng</h3>
                    {userPosts.length > 0 ? (
                        <div className="space-y-4">
                            {userPosts.map(post => (
                                <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                                    <p className="text-sm text-gray-800 line-clamp-2 font-medium mb-2">{post.content}</p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <span>❤️ {post.likes}</span>
                                        <span>💬 {post.comments.length}</span>
                                        {post.attachmentName && <span className="text-blue-500">📎 {post.attachmentName}</span>}
                                        <span className="ml-auto">{new Date(post.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300"><p className="text-gray-400 text-sm">Chưa có bài viết nào.</p></div>
                    )}
                </div>
            </div>

            {/* --- MODAL EDIT --- */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">Cập nhật hồ sơ</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition"><CloseIcon className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        
                        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ và tên</label><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Biệt danh</label><input type="text" value={editNickname} onChange={(e) => setEditNickname(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số điện thoại</label><input type="tel" value={editPhoneNumber} onChange={(e) => setEditPhoneNumber(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chức vụ</label><input type="text" value={editJobTitle} onChange={(e) => setEditJobTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none" /></div>
                            </div>

                            {user.role === UserRole.TEACHER && (
                                <div className="grid grid-cols-2 gap-4 bg-purple-50 p-3 rounded-lg">
                                    <div><label className="block text-xs font-bold text-purple-600 uppercase mb-1">Bộ môn</label><select value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full border border-purple-300 bg-white rounded-lg px-3 py-2 text-sm"><option value="">--</option><option value="Toán">Toán</option><option value="Lý">Lý</option><option value="Hóa">Hóa</option><option value="Văn">Văn</option><option value="Anh">Anh</option></select></div>
                                    <div><label className="block text-xs font-bold text-purple-600 uppercase mb-1">Nơi công tác</label><input type="text" value={editWorkplace} onChange={(e) => setEditWorkplace(e.target.value)} className="w-full border border-purple-300 rounded-lg px-3 py-2 text-sm" /></div>
                                </div>
                            )}

                            {user.role === UserRole.STUDENT && (
                                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg">
                                    <div>
                                        <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Trường học</label>
                                        <input type="text" value={editSchool} onChange={(e) => setEditSchool(e.target.value)} className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Lớp</label>
                                        {/* QUAN TRỌNG: DISABLED ĐỐI VỚI HỌC SINH */}
                                        <input 
                                            type="text" 
                                            value={editClassName} 
                                            disabled={true} 
                                            className="w-full border border-gray-300 bg-gray-200 text-gray-500 rounded-lg px-3 py-2 text-sm cursor-not-allowed" 
                                            title="Liên hệ Admin hoặc GVCN để thay đổi lớp"
                                        />
                                        <p className="text-[10px] text-red-500 mt-1">* Không thể tự sửa lớp</p>
                                    </div>
                                </div>
                            )}

                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giới thiệu</label><textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none resize-none" /></div>
                            <div className="border-t border-gray-100 pt-4 mt-2"><label className="block text-xs font-bold text-red-500 uppercase mb-1">Đổi mật khẩu</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-red-500 outline-none" placeholder="Nhập mật khẩu mới..." /></div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition">Hủy</button>
                            <button onClick={handleSaveChanges} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition">Lưu thay đổi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyProfile;