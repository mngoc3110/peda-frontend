import React, { useState, useEffect } from 'react';
import { User, UserRole, View, Announcement } from '../common/types';
import { 
    UserManagementIcon, AnnouncementIcon, GradebookIcon, AssignmentsIcon, 
    OnlineClassIcon, LibraryIcon, CubeIcon, AttendanceIcon
} from './icons';

interface DashboardProps {
  user: User;
  setActiveView: (view: View) => void;
}

// --- 1. DỮ LIỆU MẪU ---

const OLD_MOCK_NEWS: Announcement[] = [
    {
        id: 'gov_1',
        title: 'Bộ GD&ĐT công bố về quy chế thi tốt nghiệp THPT',
        summary: 'Kỳ thi dự kiến diễn ra vào cuối tháng 6.',
        content: 'Chi tiết xem tại cổng thông tin.',
        authorName: 'Bộ Giáo dục & Đào tạo',
        authorRole: UserRole.ADMIN,
        timestamp: Date.now() + 5000000,
        targetType: 'ALL',
        externalLink: 'https://xaydungchinhsach.chinhphu.vn/toan-van-thong-tu-24-2024-tt-bgddt-ban-hanh-quy-che-thi-tot-nghiep-thpt-119250109172801928.htm',
        imageUrl: 'https://xdcs.cdnchinhphu.vn/446259493575335936/2024/12/25/tn-17350822248751639988091.jpg',
        colorTheme: 'red'
    },
    {
        id: 'gov_2',
        title: 'Lịch sử trường Trung học Thực hành - ĐHSP TPHCM',
        summary: 'Tìm hiểu về sự ra đời và quá trình phát triển của trường.',
        content: 'Thông tin cho mọi người',
        authorName: 'THTH-ĐHSP',
        authorRole: UserRole.ADMIN,
        timestamp: Date.now() - 5000000,
        targetType: 'ALL',
        externalLink: 'http://trunghocthuchanhdhsp.edu.vn/index.php?option=com_quix&view=page&id=307&Itemid=383&lang=vi',
        imageUrl:'https://cdn2.tuoitre.vn/471584752817336320/2025/3/13/nmk-02109-3-1741892002844704636670.jpg',
        colorTheme: 'blue'
    }
];

const WELCOME_ANNOUNCEMENT: Announcement = {
    id: 'welcome_pinned',
    title: 'Chào mừng đến với hệ thống Web Pedagosys',
    summary: 'Hệ thống hỗ trọ giảng dạy và học tập',
    content: 'Chào mừng',
    authorName: 'Ban Quản Trị',
    authorRole: UserRole.ADMIN,
    timestamp: Date.now() + 999999999,
    targetType: 'ALL',
    colorTheme: 'blue'
};

// --- 2. CAROUSEL THÔNG MINH ---
const FeaturedCarousel: React.FC<{ user: User, setActiveView: (view: View) => void }> = ({ user, setActiveView }) => {
    const [items, setItems] = useState<Announcement[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        // 1. Lấy bài viết MỚI từ LocalStorage
        const storedData = localStorage.getItem('pedagosys_announcements');
        let userCreatedPosts: Announcement[] = storedData ? JSON.parse(storedData) : [];

        // Hàm kiểm tra quyền xem
        const isVisible = (ann: Announcement) => {
            if (user.role === UserRole.ADMIN || user.role === UserRole.DEVELOPER) return true;
            if (ann.targetType === 'ALL') return true;
            if (ann.targetType === 'ROLE' && ann.targetValue === user.role) return true;
            if (ann.targetType === 'CLASS' && user.className === ann.targetValue) return true;
            return false;
        };

        // 2. Lọc và Sắp xếp bài mới (Mới nhất lên đầu)
        const visibleUserPosts = userCreatedPosts
            .filter(isVisible)
            .sort((a, b) => b.timestamp - a.timestamp);

        // 3. Lọc bài mẫu cũ
        const visibleMockPosts = OLD_MOCK_NEWS.filter(isVisible);

        // 4. KHAI BÁO BIẾN finalItems TRƯỚC KHI DÙNG
        // Sử dụng spread operator (...) để gộp mảng
        const finalItems = [
            WELCOME_ANNOUNCEMENT,   // Luôn đứng đầu
            ...visibleUserPosts,    // Bài người dùng đăng
            ...visibleMockPosts     // Bài mẫu cũ
        ];

        // 5. Cập nhật State
        setItems(finalItems);

        // Auto-play logic
        if (finalItems.length > 1) {
            const interval = setInterval(() => {
                setActiveIndex((cur: number) => (cur + 1) % finalItems.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleItemClick = (item: Announcement) => {
        if (item.externalLink) window.open(item.externalLink, '_blank');
        else setActiveView(View.ANNOUNCEMENTS);
    };

    if (items.length === 0) return null;
    const currentItem = items[activeIndex];

    // Xử lý màu sắc an toàn
    const theme = currentItem.colorTheme || 'blue';
    const bgGradient = theme === 'red' ? 'from-red-900 to-red-600' : 
                       theme === 'green' ? 'from-green-900 to-green-600' : 
                       theme === 'purple' ? 'from-purple-900 to-purple-600' : 
                       'from-blue-900 to-blue-600';

    return (
        <div 
            className="mb-8 relative rounded-2xl overflow-hidden shadow-2xl h-56 transition-all duration-500 bg-gray-900 cursor-pointer group border border-gray-700/50" 
            onClick={() => handleItemClick(currentItem)}
        >
            {/* --- LỚP NỀN (BACKGROUND) --- */}
            {currentItem.imageUrl ? (
                <>
                    <img 
                        src={currentItem.imageUrl} 
                        alt="background" 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                </>
            ) : (
                <>
                    <div className={`absolute inset-0 opacity-90 bg-gradient-to-r ${bgGradient} transition-colors duration-1000`}></div>
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </>
            )}

            {/* --- NỘI DUNG CHỮ --- */}
            <div className="relative z-10 h-full flex flex-col justify-end p-8 text-white pb-10">
                <div className="flex items-center space-x-3 mb-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded border border-white/20 uppercase tracking-wider backdrop-blur-md ${
                        currentItem.imageUrl ? 'bg-black/60 text-white' : 'bg-white/20 text-white'
                    }`}>
                        {currentItem.targetType === 'ALL' ? '🔔 TOÀN TRƯỜNG' : `📢 ${currentItem.targetValue || 'THÔNG BÁO'}`}
                    </span>
                    
                    <span className="text-xs font-medium opacity-90 flex items-center shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                        {currentItem.authorName}
                    </span>
                </div>
                
                <h3 className="text-2xl md:text-4xl font-bold mb-2 line-clamp-1 drop-shadow-md leading-tight">
                    {currentItem.title}
                </h3>
                
                <p className="text-sm md:text-base text-gray-200 line-clamp-2 max-w-4xl drop-shadow-sm font-light">
                    {currentItem.summary}
                </p>
                
                <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                    <span className="inline-flex items-center text-xs font-bold bg-white text-gray-900 px-4 py-2 rounded-full shadow-lg">
                        {currentItem.externalLink ? '🔗 Mở liên kết' : '📄 Xem chi tiết'} &rarr;
                    </span>
                </div>
            </div>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                {items.map((_, idx) => (
                    <button 
                        key={idx} 
                        onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }} 
                        className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                            idx === activeIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/80'
                        }`} 
                    />
                ))}
            </div>
        </div>
    );
};

// --- 3. MAIN DASHBOARD ---

const Card: React.FC<{ title: string; icon: React.FC<{className?:string}>; onClick: () => void; }> = ({ title, icon: Icon, onClick }) => (
  <button onClick={onClick} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center justify-center text-center text-gray-700 h-full border border-transparent hover:border-blue-100">
    <div className="bg-blue-50 text-blue-600 rounded-full p-4 mb-4 transition-colors group-hover:bg-blue-100"><Icon className="h-8 w-8" /></div>
    <h3 className="text-lg font-semibold">{title}</h3>
  </button>
);

const Dashboard: React.FC<DashboardProps> = ({ user, setActiveView }) => {
  const renderAdminDashboard = () => (
    <>
    <Card title={View.USER_MANAGEMENT} icon={UserManagementIcon} onClick={() => setActiveView(View.USER_MANAGEMENT)} />
    <Card title="Quản lý Thông báo" icon={AnnouncementIcon} onClick={() => setActiveView(View.ANNOUNCEMENTS)} />
    <Card title={View.DIGITAL_LIBRARY} icon={LibraryIcon} onClick={() => setActiveView(View.DIGITAL_LIBRARY)} />
    <Card title={View.VIRTUAL_LAB} icon={CubeIcon} onClick={() => setActiveView(View.VIRTUAL_LAB)} />
    <Card title="Điểm danh" icon={AttendanceIcon} onClick={() => setActiveView(View.ATTENDANCE)} />
    </>
  );
  const renderTeacherDashboard = () => (
    <>
      <Card title={View.GRADEBOOK} icon={GradebookIcon} onClick={() => setActiveView(View.GRADEBOOK)} />
      <Card title={View.ASSIGNMENTS} icon={AssignmentsIcon} onClick={() => setActiveView(View.ASSIGNMENTS)} />
      <Card title={View.ONLINE_CLASS} icon={OnlineClassIcon} onClick={() => setActiveView(View.ONLINE_CLASS)} />
      <Card title={View.DIGITAL_LIBRARY} icon={LibraryIcon} onClick={() => setActiveView(View.DIGITAL_LIBRARY)} />
      <Card title={View.VIRTUAL_LAB} icon={CubeIcon} onClick={() => setActiveView(View.VIRTUAL_LAB)} />
      <Card title="Đăng thông báo" icon={AnnouncementIcon} onClick={() => setActiveView(View.ANNOUNCEMENTS)} />
      <Card title={View.ATTENDANCE} icon={AttendanceIcon} onClick={() => setActiveView(View.ATTENDANCE)} />
    </>
  );
  const renderStudentDashboard = () => (
    <>
      <Card title={View.MY_GRADES} icon={GradebookIcon} onClick={() => setActiveView(View.MY_GRADES)} />
      <Card title={View.ASSIGNMENTS} icon={AssignmentsIcon} onClick={() => setActiveView(View.ASSIGNMENTS)} />
      <Card title="Tham gia lớp học" icon={OnlineClassIcon} onClick={() => setActiveView(View.ONLINE_CLASS)} />
      <Card title={View.DIGITAL_LIBRARY} icon={LibraryIcon} onClick={() => setActiveView(View.DIGITAL_LIBRARY)} />
      <Card title={View.VIRTUAL_LAB} icon={CubeIcon} onClick={() => setActiveView(View.VIRTUAL_LAB)} />
      <Card title={View.ATTENDANCE} icon={AnnouncementIcon} onClick={() => setActiveView(View.ANNOUNCEMENTS)} />
    </>
  );
  const renderDeveloperDashboard = () => (
    <>
      <Card title={View.USER_MANAGEMENT} icon={UserManagementIcon} onClick={() => setActiveView(View.USER_MANAGEMENT)} />
      <Card title="Hệ thống Thông báo" icon={AnnouncementIcon} onClick={() => setActiveView(View.ANNOUNCEMENTS)} />
      <Card title={View.ONLINE_CLASS} icon={OnlineClassIcon} onClick={() => setActiveView(View.ONLINE_CLASS)} />
      <Card title={View.DIGITAL_LIBRARY} icon={LibraryIcon} onClick={() => setActiveView(View.DIGITAL_LIBRARY)} />
      <Card title={View.VIRTUAL_LAB} icon={CubeIcon} onClick={() => setActiveView(View.VIRTUAL_LAB)} />
        <Card title={View.ATTENDANCE} icon={AttendanceIcon} onClick={() => setActiveView(View.ATTENDANCE)} />
    </>
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Chào mừng trở lại, {user.name}!</h2>
      <FeaturedCarousel user={user} setActiveView={setActiveView} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {user.role === UserRole.ADMIN && renderAdminDashboard()}
        {user.role === UserRole.TEACHER && renderTeacherDashboard()}
        {user.role === UserRole.STUDENT && renderStudentDashboard()}
        {user.role === UserRole.DEVELOPER && renderDeveloperDashboard()}
      </div>
    </div>
  );
};

export default Dashboard;