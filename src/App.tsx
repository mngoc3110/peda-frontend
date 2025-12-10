import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, View } from './common/types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AIAssistant from './components/AIAssistant';
import OnlineClassUI from './components/OnlineClassUI';
import DigitalLibrary from './components/DigitalLibrary';
import UserManagement from './components/UserManagement';
import Gradebook from './components/Gradebook'; // Dùng chung cho cả teacher & student view
import MyProfile from './components/MyProfile';
import VirtualLab from './components/VirtualLab';
import Announcements from './components/Announcements';
import Assignments from './components/Assignments'; 
import Attendance from './components/Attendance';
import TeacherSubmissions from './components/TeacherSubmissions'; // 👈 THÊM

const API_URL = "https://peda-backend-qi7k.onrender.com";

// --- 1. HÀM TIỆN ÍCH ---
const generateUsername = (fullName: string): string => {
    return fullName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
};

const promoteClass = (currentClass: string): string => {
    const match = currentClass.match(/^(\d+)(.*)$/);
    if (match) {
        const grade = parseInt(match[1]);
        const suffix = match[2]; 
        if (grade < 12) return `${grade + 1}${suffix}`;
        else return "Đã Tốt Nghiệp";
    }
    return currentClass;
};

// --- 2. DỮ LIỆU MẪU (giữ object cũ, nhưng sửa id trùng) ---
const mockUsers: { [key: string]: User } = {
  dev_huy: { 
      id: 'dev_01', name: 'Nguyen Hoang Huy', username: 'HoangHuy', password: '123', 
      role: UserRole.DEVELOPER, avatarUrl: 'https://ui-avatars.com/api/?name=Hoang+Huyv&background=0D8ABC&color=fff', 
      reputation: 9999, isApproved: true, jobTitle: 'Fullstack Lead', bio: 'Nhà phát triển hệ thống.'
  },
  dev_tuan: { 
      id: 'dev_02', name: 'Hong Khang Tuan', username: 'KhangTuan', password: '123', 
      role: UserRole.DEVELOPER, avatarUrl: 'https://ui-avatars.com/api/?name=Khang+Tuan&background=0D8ABC&color=fff', 
      reputation: 9999, isApproved: true, jobTitle: 'Fullstack Lead', bio: 'Nhà phát triển hệ thống.'
  },
  admin: { 
      id: 'admin_01', name: 'Admin Quản Trị', username: 'admin', password: '123', 
      role: UserRole.ADMIN, avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=000&color=fff', 
      reputation: 9999, isApproved: true, jobTitle: 'Quản trị viên' 
  },
  teacher: { 
      id: 'teacher01', name: 'Ta Thanh Tam', username: 'ThanhTam', password: '123', 
      role: UserRole.TEACHER, avatarUrl: 'https://ui-avatars.com/api/?name=Thanh+Tam&background=random', 
      reputation: 300, isApproved: true, subject: 'Vật Lý', workplace: 'THTH-ĐHSP', jobTitle: 'Giảng viên' 
  },
  student: { 
      id: 'student01', name: 'Em Văn', username: 'hocsinh', password: '123', 
      role: UserRole.STUDENT, avatarUrl: 'https://ui-avatars.com/api/?name=Em+Van&background=random', 
      reputation: 100, isApproved: true, className: '10.5', school: 'THTH-ĐHSP' 
  },
};

// --- 3. MÀN HÌNH ĐĂNG NHẬP / ĐĂNG KÝ ---
const AuthScreen: React.FC<{ onLoginSuccess: (user: User) => void }> = ({ onLoginSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [className, setClassName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [school, setSchool] = useState('');
  const [subject, setSubject] = useState('');
  const [workplace, setWorkplace] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);

  try {
    console.log("🔎 Đang gọi API login tới:", "https://peda-backend-qi7k.onrender.com/api/auth/login");

    const res = await fetch("https://peda-backend-qi7k.onrender.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: loginUser,
        password: loginPass
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Đăng nhập thất bại.");
    }

    const user: User = await res.json();
    localStorage.setItem("pedagosys_current_user", JSON.stringify(user));
    onLoginSuccess(user);
  } catch (err: any) {
    console.error("Login API error:", err);
    setError(err.message || "Có lỗi khi đăng nhập.");
  }
};

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !password) {
      setError("Vui lòng điền tên và mật khẩu.");
      return;
    }

    const autoUsername = generateUsername(name);

    const newUserPayload = {
      name,
      username: autoUsername,
      password,
      role,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      reputation: role === UserRole.TEACHER ? 300 : role === UserRole.STUDENT ? 100 : 0,
      isApproved: true,
      className: role === UserRole.STUDENT ? className : undefined,
      school: role === UserRole.STUDENT ? school : undefined,
      subject: role === UserRole.TEACHER ? subject : undefined,
      workplace: role === UserRole.TEACHER ? workplace : undefined,
      jobTitle
    };

    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserPayload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Đăng ký thất bại.");
      }

      const createdUser = await res.json();
      setSuccess(`Đăng ký thành công! Username: ${createdUser.username}`);
      setIsLoginView(true);

      setName("");
      setPassword("");
      setClassName("");
      setSchool("");
      setSubject("");
      setWorkplace("");
    } catch (err: any) {
      setError(err.message || "Có lỗi khi đăng ký.");
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold text-blue-900">Pedagosys</h1>
        <p className="text-gray-500">Hệ thống Quản lý Giáo dục</p>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">
          {isLoginView ? 'Đăng nhập' : 'Đăng ký thành viên'}
        </h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-xs font-bold">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-xs font-bold">{success}</div>}
        {isLoginView ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Tên đăng nhập</label>
              <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} className="w-full border p-2 rounded mt-1" placeholder="Username" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Mật khẩu</label>
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full border p-2 rounded mt-1" placeholder="Password" />
            </div>
            <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded font-bold hover:bg-blue-800 transition">Đăng nhập</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Họ và Tên (Tạo username tự động)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded text-sm" placeholder="Nguyễn Văn A" required />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Mật khẩu</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded text-sm" required />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Vai trò</label>
              <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full border p-2 rounded text-sm bg-white">
                <option value={UserRole.STUDENT}>Học sinh</option>
                <option value={UserRole.TEACHER}>Giáo viên</option>
                <option value={UserRole.DEVELOPER}>Nhà phát triển</option>
              </select>
            </div>

            {role === UserRole.STUDENT && (
              <div className="bg-blue-50 p-3 rounded border border-blue-100 space-y-2">
                <p className="text-[10px] font-bold text-blue-600 uppercase">Thông tin học sinh</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={className} onChange={e => setClassName(e.target.value)} placeholder="Lớp (VD: 10.5)" className="w-full border p-2 rounded text-xs" />
                  <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Chức vụ" className="w-full border p-2 rounded text-xs" />
                  <input type="text" value={school} onChange={e => setSchool(e.target.value)} placeholder="Trường học" className="w-full border p-2 rounded text-xs col-span-2" />
                </div>
              </div>
            )}

            {role === UserRole.TEACHER && (
              <div className="bg-purple-50 p-3 rounded border border-purple-100 space-y-2">
                <p className="text-[10px] font-bold text-purple-600 uppercase">Thông tin giáo viên</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Bộ môn" className="w-full border p-2 rounded text-xs" />
                  <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Chức vụ" className="w-full border p-2 rounded text-xs" />
                  <input type="text" value={workplace} onChange={e => setWorkplace(e.target.value)} placeholder="Nơi công tác" className="w-full border p-2 rounded text-xs col-span-2" />
                </div>
              </div>
            )}

            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold mt-2">
              Đăng ký ngay
            </button>
          </form>
        )}
        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsLoginView(!isLoginView); setError(null); setSuccess(null); }}
            className="text-sm text-blue-600 hover:underline"
          >
            {isLoginView ? 'Chưa có tài khoản? Đăng ký ngay' : 'Quay lại Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PlaceholderView: React.FC<{ title: string }> = ({ title }) => (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
    </div>
);

// --- APP COMPONENT ---
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>(View.DASHBOARD);

  useEffect(() => {
    const existingUsers = localStorage.getItem('pedagosys_users');
    if (!existingUsers) {
      localStorage.setItem('pedagosys_users', JSON.stringify(Object.values(mockUsers)));
    }

    const savedUser = localStorage.getItem("pedagosys_current_user");
    if (savedUser) {
      try {
        const u: User = JSON.parse(savedUser);
        setCurrentUser(u);
      } catch {}
    }
  }, []);

  const handleLoginSuccess = (user: User) => { 
    setCurrentUser(user); 
    setActiveView(View.DASHBOARD); 
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("pedagosys_current_user");
  };

  const handleUpdateUser = (updatedUser: User) => {
    if (!currentUser) return;
    const finalUser = { ...updatedUser, password: updatedUser.password ? updatedUser.password : currentUser.password };
    setCurrentUser(finalUser);
    const users: User[] = JSON.parse(localStorage.getItem('pedagosys_users') || '[]');
    let userFound = false;
    const updatedList = users.map(u => { if (u.id === finalUser.id) { userFound = true; return finalUser; } return u; });
    if (!userFound) updatedList.push(finalUser);
    localStorage.setItem('pedagosys_users', JSON.stringify(updatedList));
  };

  const handlePromoteAllStudents = () => {
    if (!window.confirm("Xác nhận Tổng Kết Năm Học?\nToàn bộ học sinh sẽ được lên 1 lớp.")) return;
    const users: User[] = JSON.parse(localStorage.getItem('pedagosys_users') || '[]');
    const updatedList = users.map(u => { 
      if (u.role === UserRole.STUDENT && u.className) { 
        return { ...u, className: promoteClass(u.className) }; 
      } 
      return u; 
    });
    localStorage.setItem('pedagosys_users', JSON.stringify(updatedList));
    alert("Đã lên lớp thành công!");
    if (currentUser?.role === UserRole.STUDENT && currentUser.className) { 
      setCurrentUser({ ...currentUser, className: promoteClass(currentUser.className) }); 
    }
  };

  const currentView = useMemo(() => {
    if (!currentUser) return null;
    switch (activeView) {
      case View.DASHBOARD: 
        return <Dashboard user={currentUser} setActiveView={setActiveView} />;
      case View.ONLINE_CLASS: 
        return <OnlineClassUI user={currentUser} />;
      case View.DIGITAL_LIBRARY: 
        return <DigitalLibrary user={currentUser} />;
      case View.GRADEBOOK: 
      case View.MY_GRADES: 
        return <Gradebook user={currentUser} />;
      case View.USER_MANAGEMENT: 
        return <UserManagement onPromoteStudents={handlePromoteAllStudents} />;
      case View.MY_PROFILE: 
        return <MyProfile user={currentUser} onUpdateUser={handleUpdateUser} />;
      case View.VIRTUAL_LAB: 
        return <VirtualLab />;
      case View.ANNOUNCEMENTS: 
        return <Announcements user={currentUser} />;
      case View.ASSIGNMENTS: 
        return <Assignments user={currentUser} />;
      case View.ATTENDANCE: 
        return <Attendance />;

      // 👇 MÀN GIÁO VIÊN XEM & CHẤM BÀI
      case View.TEACHER_SUBMISSIONS:
        return <TeacherSubmissions user={currentUser} />;

      default: 
        return <PlaceholderView title={String(activeView)} />;
    }
  }, [activeView, currentUser]);

  if (!currentUser) return <AuthScreen onLoginSuccess={handleLoginSuccess} />;

  return (
    <Layout user={currentUser} activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout}>
      {currentView}
    </Layout>
  );
};

export default App;