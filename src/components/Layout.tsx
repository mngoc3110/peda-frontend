import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, UserRole, View } from '../common/types';
import { 
    DashboardIcon, GradebookIcon, AssignmentsIcon, OnlineClassIcon, AiIcon, 
    LibraryIcon, UserManagementIcon, AnnouncementIcon, LogoutIcon, CubeIcon, AttendanceIcon 
} from './icons';
import AIAssistant from './AIAssistant';

interface LayoutProps {
  user: User;
  activeView: View;
  setActiveView: (view: View) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

/* ============================
   🎯 NAVIGATION MENU CHO TỪNG VAI TRÒ
   ============================ */

const navItems: { [key in UserRole]: { view: View; icon: React.FC<{ className?: string }> }[] } = {
  [UserRole.ADMIN]: [
    { view: View.DASHBOARD, icon: DashboardIcon },
    { view: View.USER_MANAGEMENT, icon: UserManagementIcon },
    { view: View.ANNOUNCEMENTS, icon: AnnouncementIcon },
    { view: View.DIGITAL_LIBRARY, icon: LibraryIcon },
    { view: View.VIRTUAL_LAB, icon: CubeIcon },
    { view: View.ATTENDANCE, icon: AttendanceIcon },
  ],

  [UserRole.TEACHER]: [
    { view: View.DASHBOARD, icon: DashboardIcon },
    { view: View.GRADEBOOK, icon: GradebookIcon },
    { view: View.ASSIGNMENTS, icon: AssignmentsIcon },

    // ⭐ THÊM MỤC CHẤM BÀI
    { view: View.TEACHER_SUBMISSIONS, icon: GradebookIcon },

    { view: View.ONLINE_CLASS, icon: OnlineClassIcon },
    { view: View.DIGITAL_LIBRARY, icon: LibraryIcon },
    { view: View.VIRTUAL_LAB, icon: CubeIcon },
    { view: View.ANNOUNCEMENTS, icon: AnnouncementIcon },
    { view: View.ATTENDANCE, icon: AttendanceIcon },
  ],

  [UserRole.STUDENT]: [
    { view: View.DASHBOARD, icon: DashboardIcon },
    { view: View.MY_GRADES, icon: GradebookIcon },
    { view: View.ASSIGNMENTS, icon: AssignmentsIcon },
    { view: View.ONLINE_CLASS, icon: OnlineClassIcon },
    { view: View.DIGITAL_LIBRARY, icon: LibraryIcon },
    { view: View.VIRTUAL_LAB, icon: CubeIcon },
    { view: View.ANNOUNCEMENTS, icon: AnnouncementIcon },
  ],

  [UserRole.DEVELOPER]: [
    { view: View.DASHBOARD, icon: DashboardIcon },
    { view: View.USER_MANAGEMENT, icon: UserManagementIcon },
    { view: View.GRADEBOOK, icon: GradebookIcon },
    { view: View.ASSIGNMENTS, icon: AssignmentsIcon },

    // ⭐ DEV cũng được xem màn chấm bài
    { view: View.TEACHER_SUBMISSIONS, icon: GradebookIcon },

    { view: View.ONLINE_CLASS, icon: OnlineClassIcon },
    { view: View.DIGITAL_LIBRARY, icon: LibraryIcon },
    { view: View.VIRTUAL_LAB, icon: CubeIcon },
    { view: View.ANNOUNCEMENTS, icon: AnnouncementIcon },
    { view: View.ATTENDANCE, icon: AttendanceIcon },
  ]
};

/* ============================
   SIDEBAR (TÙY CHỌN)
   ============================ */

const Sidebar: React.FC<{ user: User; activeView: View; setActiveView: (view: View) => void; }> = ({ user, activeView, setActiveView }) => {
  const items = navItems[user.role];

  return (
    <div className="w-64 bg-blue-900 text-white flex flex-col shadow-xl z-20">
      <div className="p-6 text-2xl font-bold border-b border-blue-800 flex items-center">
        Pedagosys
      </div>

      <nav className="flex-grow p-4 overflow-y-auto">
        <ul className="space-y-2">
          {items.map(({ view, icon: Icon }) => (
            <li key={view}>
              <button
                onClick={() => setActiveView(view)}
                className={`w-full text-left flex items-center p-3 rounded-xl transition-all duration-200 ${
                  activeView === view
                    ? 'bg-blue-600 shadow-md translate-x-1'
                    : 'hover:bg-blue-800 hover:translate-x-1 text-blue-100'
                }`}
              >
                <Icon className={`h-5 w-5 mr-3 ${activeView === view ? 'text-white' : 'text-blue-300'}`} />
                <span className="font-medium text-sm">{view}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 text-xs text-blue-400 text-center border-t border-blue-800">
        © NCKH Pedagosys 2025
      </div>
    </div>
  );
};

/* ============================
   HEADER (USER DROPDOWN)
   ============================ */

const Header: React.FC<{ 
    user: User, 
    activeView: View, 
    setActiveView: (view: View) => void, 
    onLogout: () => void 
}> = ({ user, activeView, setActiveView, onLogout }) => {
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="bg-white shadow-sm px-6 py-3 flex justify-between items-center relative z-30">
            <h1 className="text-xl font-bold text-gray-800">{activeView}</h1>

            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-3 hover:bg-gray-50 p-1.5 pr-3 rounded-full transition-all"
                >
                    <img src={user.avatarUrl} className="h-9 w-9 rounded-full border" />
                    <div className="text-left hidden md:block">
                        <p className="text-sm font-bold text-gray-700">{user.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{user.role}</p>
                    </div>
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border py-2">
                        <button 
                            onClick={() => { setActiveView(View.MY_PROFILE); setIsMenuOpen(false); }}
                            className="w-full text-left px-5 py-3 text-sm hover:bg-blue-50 flex items-center"
                        >
                            👤 Hồ sơ cá nhân
                        </button>

                        <button onClick={onLogout} className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center">
                            🚪 Đăng xuất
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

/* ============================
   NÚT AI DRAGGABLE
   ============================ */

const DraggableAIFab: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const fabRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragInfo = useRef({ hasDragged: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });

    const handleDragStart = (e: any) => {
        dragInfo.current.hasDragged = false;
        setIsDragging(true);

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        dragInfo.current.startX = clientX;
        dragInfo.current.startY = clientY;
        dragInfo.current.initialX = position.x;
        dragInfo.current.initialY = position.y;

        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('touchmove', handleDragMove, { passive: false });
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchend', handleDragEnd);
    };

    const handleDragMove = (e: any) => {
        if (e.cancelable) e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const dx = clientX - dragInfo.current.startX;
        const dy = clientY - dragInfo.current.startY;

        if (!dragInfo.current.hasDragged && (Math.abs(dx) > 5 || Math.abs(dy) > 5))
            dragInfo.current.hasDragged = true;

        setPosition({
            x: dragInfo.current.initialX + dx,
            y: dragInfo.current.initialY + dy
        });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchend', handleDragEnd);

        // Nếu không kéo → click
        if (!dragInfo.current.hasDragged) onClick();
    };

    return (
        <button
            ref={fabRef}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                transform: `translate(${position.x}px, ${position.y}px)`,
                zIndex: 1000,
                touchAction: 'none'
            }}
            className="bg-blue-600 text-white h-16 w-16 rounded-full shadow-lg flex items-center justify-center cursor-move"
        >
            <AiIcon className="h-8 w-8" />
        </button>
    );
};

/* ============================
   LAYOUT CHÍNH
   ============================ */

const Layout: React.FC<LayoutProps> = ({ user, activeView, setActiveView, onLogout, children }) => {
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} activeView={activeView} setActiveView={setActiveView} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          user={user}
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={onLogout}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 relative">
          {children}
        </main>
      </div>

      <DraggableAIFab onClick={() => setIsAiAssistantOpen(true)} />

      <AIAssistant 
        user={user} 
        isOpen={isAiAssistantOpen} 
        onClose={() => setIsAiAssistantOpen(false)} 
        onOpen={() => setIsAiAssistantOpen(true)}
      />
    </div>
  );
};

export default Layout;