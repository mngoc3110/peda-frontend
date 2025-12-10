import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../common/types';
import { UserManagementIcon, TrashIcon, CheckIcon, CloseIcon } from './icons';

// Component nhận prop onPromoteStudents từ App.tsx
interface UserManagementProps {
    onPromoteStudents?: () => void; // Optional vì có thể chưa truyền ngay
}

const UserManagement: React.FC<UserManagementProps> = ({ onPromoteStudents }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUsers = JSON.parse(localStorage.getItem('pedagosys_users') || '[]');
        setUsers(storedUsers);
        // Hacky way to get current user role (should pass via props in real app)
        // Ở đây giả định người vào được trang này đã là Admin/Dev
    }, []);

    const saveUsers = (newUsers: User[]) => {
        setUsers(newUsers);
        localStorage.setItem('pedagosys_users', JSON.stringify(newUsers));
    };

    const toggleApproval = (id: string) => {
        const newUsers = users.map(u => u.id === id ? { ...u, isApproved: !u.isApproved } : u);
        saveUsers(newUsers);
    };

    const deleteUser = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            const newUsers = users.filter(u => u.id !== id);
            saveUsers(newUsers);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto pb-10">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3"><UserManagementIcon className="w-6 h-6 text-blue-600" /></div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h2>
                        <p className="text-sm text-gray-500">{users.length} tài khoản trong hệ thống</p>
                    </div>
                </div>

                {/* NÚT TỔNG KẾT NĂM HỌC (Di chuyển từ App.tsx sang đây) */}
                {onPromoteStudents && (
                    <button 
                        onClick={onPromoteStudents}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-red-700 transition flex items-center"
                    >
                        ⚙️ Tổng kết năm học (Lên lớp)
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm theo tên hoặc username..." 
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                                <th className="p-4 border-b">Học viên / Giáo viên</th>
                                <th className="p-4 border-b">Vai trò</th>
                                <th className="p-4 border-b">Thông tin</th>
                                <th className="p-4 border-b text-center">Trạng thái</th>
                                <th className="p-4 border-b text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 border-b">
                                        <div className="flex items-center">
                                            <img src={u.avatarUrl} className="w-8 h-8 rounded-full mr-3" alt="" />
                                            <div>
                                                <p className="font-bold text-gray-800">{u.name}</p>
                                                <p className="text-xs text-gray-500">@{u.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 border-b">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            u.role === UserRole.ADMIN ? 'bg-red-100 text-red-700' :
                                            u.role === UserRole.TEACHER ? 'bg-purple-100 text-purple-700' :
                                            u.role === UserRole.STUDENT ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                        }`}>{u.role}</span>
                                    </td>
                                    <td className="p-4 border-b text-gray-600 text-xs">
                                        {u.className && <p>Lớp: {u.className}</p>}
                                        {u.subject && <p>Dạy: {u.subject}</p>}
                                        {u.jobTitle && <p>CV: {u.jobTitle}</p>}
                                    </td>
                                    <td className="p-4 border-b text-center">
                                        <button onClick={() => toggleApproval(u.id)} className={`px-3 py-1 rounded-full text-xs font-bold transition ${u.isApproved ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                                            {u.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                                        </button>
                                    </td>
                                    <td className="p-4 border-b text-right">
                                        {u.role !== UserRole.DEVELOPER && (
                                            <button onClick={() => deleteUser(u.id)} className="text-gray-400 hover:text-red-600 p-1">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;