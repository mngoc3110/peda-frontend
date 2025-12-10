import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, UserRole, LibraryPost, LibraryComment } from '../common/types';
import { 
    MessageIcon, SendIcon, AiIcon, AttachmentIcon, 
    TrashIcon, ShareIcon, DotsHorizontalIcon, 
    FilterIcon, UsersIcon, BookIcon, 
    StarIcon
} from './icons';

// --- MOCK DATA ---
const MOCK_POSTS: any[] = [
    {
        id: 'post_1', authorId: 'dev_01', authorName: 'Nguyen Hoang Huy', authorAvatar: 'https://ui-avatars.com/api/?name=Hoang+Huy&background=0D8ABC&color=fff',
        authorRole: UserRole.DEVELOPER, authorReputation: 9999,
        title: '📢 CẬP NHẬT HỆ THỐNG V2.0', 
        content: 'Đã thêm tính năng chỉnh sửa bài viết và xem lịch sử hoạt động. Các bạn kiểm tra nhé!',
        timestamp: Date.now(), likes: 999, likedBy: [], comments: [], tags: ['Thông báo'],
        attachmentType: 'image', attachmentUrl: 'https://placehold.co/800x300/0D8ABC/FFF?text=System+Update',
        attachmentName: 'update_v2.jpg',
        category: 'OTHER'
    },
    {
        id: 'post_2', authorId: 'gv_01', authorName: 'Hong Khang Tuan', authorAvatar: 'https://ui-avatars.com/api/?name=Khang+Tuan',
        authorRole: UserRole.DEVELOPER, authorReputation: 350,
        title: 'Tổng hợp tài liệu Toán 12 (Đại số & Hình học)',
        content: 'Chia sẻ bộ đề thi thử và lý thuyết trọng tâm ôn thi THPT Quốc gia.',
        timestamp: Date.now() - 86400000 * 2, likes: 45, likedBy: [], comments: [], tags: ['Toán 12'],
        attachmentType: 'image', attachmentUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Polynomialdeg2.svg/800px-Polynomialdeg2.svg.png',
        attachmentName: 'do_thi_ham_so.png',
        category: 'KHTN'
    },
    {
        id: 'post_3', authorId: 'admin_01', authorName: 'Quản trị viên', authorAvatar: 'https://ui-avatars.com/api/?name=admin',
        authorRole: UserRole.ADMIN, authorReputation: 120,
        title: 'Tổng hợp thư viện ',
        content: '',
        timestamp: Date.now() - 86400000 * 5, likes: 230, likedBy: [], comments: [], tags: ['Thư viện'],
        attachmentType: 'file', attachmentName: '',
        category: 'Khác'
    }
];

const CATEGORIES = [
    { id: 'KHTN', name: 'Khoa học Tự nhiên', color: 'bg-blue-100 text-blue-700' },
    { id: 'KHXH', name: 'Khoa học Xã hội', color: 'bg-green-100 text-green-700' },
    { id: 'ART', name: 'Nghệ thuật', color: 'bg-purple-100 text-purple-700' },
    { id: 'OTHER', name: 'Khác', color: 'bg-gray-100 text-gray-700' },
];

const formatTime = (timestamp: number) => {
    try {
        return new Date(timestamp).toLocaleDateString('vi-VN');
    } catch { return 'Vừa xong'; }
};

// --- COMPONENT GỢI Ý ---
const SuggestedSection: React.FC<{ posts: LibraryPost[] }> = ({ posts }) => {
    const trendingPosts = useMemo(() => posts.slice(0, 3), [posts]);
    if (trendingPosts.length === 0) return null;
    return (
        <div className="mb-8">
            <h3 className="text-base font-bold text-gray-700 mb-4 flex items-center uppercase tracking-wider">
                <span className="mr-2 text-xl">🔥</span> Xu hướng nổi bật
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {trendingPosts.map(post => (
                    <div key={post.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer h-full flex flex-col">
                        <div className="flex items-center mb-2">
                            <img src={post.authorAvatar} className="w-6 h-6 rounded-full mr-2" alt="" />
                            <span className="text-xs font-bold text-gray-700 truncate">{post.authorName}</span>
                        </div>
                        <h4 className="font-bold text-sm text-gray-800 mb-1 line-clamp-2">{post.title || post.content.substring(0, 50)}</h4>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DigitalLibrary: React.FC<{ user: User }> = ({ user }) => {
    const [posts, setPosts] = useState<any[]>([]);
    
    // Form state
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    
    // Tab & Filter state
    const [activeTab, setActiveTab] = useState<'COMMUNITY' | 'LIBRARY'>('COMMUNITY');
    const [activeCategory, setActiveCategory] = useState<string>('ALL');
    const [selectedCategoryForPost, setSelectedCategoryForPost] = useState<string>('OTHER');

    // UI state
    const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
    const [openCommentId, setOpenCommentId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Init & Load Data
    useEffect(() => {
        const storedPosts = localStorage.getItem('pedagosys_library_posts_v5'); // Bump version để load mock data mới
        setPosts(storedPosts ? JSON.parse(storedPosts) : MOCK_POSTS);
    }, []);

    useEffect(() => { if(posts.length > 0) localStorage.setItem('pedagosys_library_posts_v5', JSON.stringify(posts)); }, [posts]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setActiveMenuPostId(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter Logic
    const displayedPosts = useMemo(() => {
        let filtered = [...posts];
        if (activeTab === 'LIBRARY' && activeCategory !== 'ALL') {
            filtered = filtered.filter(p => p.category === activeCategory);
        }
        return filtered.sort((a, b) => b.timestamp - a.timestamp);
    }, [posts, activeTab, activeCategory]);

    // --- ACTIONS ---
    const handleCreatePost = () => {
        if (!newPostTitle.trim() && !newPostContent.trim() && !attachment) return;
        
        const finalTitle = newPostTitle.trim() || (newPostContent.trim() ? newPostContent.substring(0, 50) + "..." : "Tài liệu chia sẻ");
        
        const newPost = {
            id: `post_${Date.now()}`, 
            authorId: user.id, authorName: user.name, authorAvatar: user.avatarUrl, authorRole: user.role, authorReputation: user.reputation,
            title: finalTitle, 
            content: newPostContent, 
            timestamp: Date.now(), likes: 0, likedBy: [], comments: [], tags: [], 
            attachmentUrl: attachmentPreview || undefined, attachmentName: attachment?.name, 
            attachmentType: attachment?.type.startsWith('image/') ? 'image' : 'file', 
            category: selectedCategoryForPost
        };
        setPosts(prev => [newPost, ...prev]);
        setNewPostTitle(''); setNewPostContent(''); setAttachment(null); setAttachmentPreview(null); setSelectedCategoryForPost('OTHER');
    };

    const handleDeletePost = (id: string) => { if (window.confirm("Xóa bài này?")) setPosts(prev => prev.filter(p => p.id !== id)); };
    const handleLike = (id: string) => setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likedBy.includes(user.id) ? p.likes-1 : p.likes+1, likedBy: p.likedBy.includes(user.id) ? p.likedBy.filter((u:string)=>u!==user.id) : [...p.likedBy, user.id] } : p));
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return; setAttachment(file);
        const reader = new FileReader(); reader.onloadend = () => setAttachmentPreview(reader.result as string); reader.readAsDataURL(file);
    };
    const triggerAskAI = (post: any) => {
        const contentToAsk = post.content || post.title || "Tài liệu này nói về gì?";
        window.dispatchEvent(new CustomEvent('OPEN_AI_CHAT', { detail: { message: `Giải thích: "${contentToAsk}"` } }));
    };
    
    const handlePostComment = (id: string) => { 
        if(!commentText.trim()) return;
        const c: LibraryComment = { 
            id: `c_${Date.now()}`, 
            authorId: user.id, 
            authorName: user.name, 
            authorAvatar: user.avatarUrl, 
            content: commentText, 
            timestamp: Date.now() 
        };
        setPosts(prev => prev.map(p => p.id === id ? { ...p, comments: [...p.comments, c] } : p));
        setCommentText('');
    };

    return (
        <div className="flex h-full bg-gray-50 overflow-hidden font-sans">
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header Tabs */}
                <div className="bg-white px-8 py-5 shadow-sm z-10 flex justify-between items-center border-b border-gray-100">
                    <div className="flex space-x-2 bg-gray-100 p-1.5 rounded-xl">
                        <button onClick={() => setActiveTab('COMMUNITY')} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center transition-all ${activeTab === 'COMMUNITY' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><UsersIcon className="w-4 h-4 mr-2"/> Cộng đồng</button>
                        <button onClick={() => setActiveTab('LIBRARY')} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center transition-all ${activeTab === 'LIBRARY' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><BookIcon className="w-4 h-4 mr-2"/> Thư viện</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="max-w-7xl mx-auto pb-24"> {/* Tăng max-width để chứa thẻ rộng hơn */}
                        
                        {/* === VIEW: CỘNG ĐỒNG (FEED) === */}
                        {activeTab === 'COMMUNITY' && (
                            <div className="max-w-3xl mx-auto">
                                <SuggestedSection posts={posts} />
                                
                                {/* Form Đăng bài */}
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
                                    <div className="flex space-x-4">
                                        <img src={user.avatarUrl} className="w-12 h-12 rounded-full border border-gray-100" />
                                        <div className="flex-1 space-y-3">
                                            <input value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} placeholder="Tiêu đề bài viết (Ngắn gọn)..." className="w-full bg-gray-50 px-4 py-2.5 rounded-xl border-none outline-none text-sm font-bold focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all" />
                                            <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder={`Mô tả chi tiết...`} className="w-full bg-gray-50 px-4 py-3 rounded-xl border-none outline-none text-sm resize-none h-20 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all" />
                                            {attachmentPreview && <div className="relative inline-block"><img src={attachmentPreview} className="h-24 rounded-lg border" /><button onClick={() => {setAttachment(null); setAttachmentPreview(null)}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow">✕</button></div>}
                                            <div className="flex justify-between items-center pt-2">
                                                <div className="flex items-center space-x-3">
                                                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="Đính kèm file"><input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" /><AttachmentIcon className="w-5 h-5" /></button>
                                                    <select value={selectedCategoryForPost} onChange={(e) => setSelectedCategoryForPost(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none cursor-pointer hover:border-blue-300 transition-colors">{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                                                </div>
                                                <button onClick={handleCreatePost} disabled={(!newPostTitle.trim() && !newPostContent.trim()) && !attachment} className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 flex items-center transition-all">Đăng <SendIcon className="w-4 h-4 ml-2" /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* List Feed */}
                                <div className="space-y-6">
                                    {displayedPosts.map(post => (
                                        <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex space-x-3">
                                                    <img src={post.authorAvatar} className="w-10 h-10 rounded-full border border-gray-100" />
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-800">{post.authorName}</h4>
                                                        <span className="text-xs text-gray-500">{formatTime(post.timestamp)}</span>
                                                    </div>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id); }} className="text-gray-400 p-1 hover:bg-gray-100 rounded-full"><DotsHorizontalIcon className="w-5 h-5" /></button>
                                                {activeMenuPostId === post.id && (
                                                    <div ref={menuRef} className="absolute right-4 mt-8 w-32 bg-white rounded-lg shadow-xl border z-20 overflow-hidden"><button onClick={() => handleDeletePost(post.id)} className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-medium">Xóa bài</button></div>
                                                )}
                                            </div>
                                            
                                            {post.title && <h3 className="text-base font-bold text-gray-900 mb-2">{post.title}</h3>}
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4 leading-relaxed">{post.content}</p>
                                            
                                            {post.attachmentUrl && (post.attachmentType === 'image' ? <img src={post.attachmentUrl} className="w-full h-auto rounded-xl border border-gray-100 mb-4" /> : <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 border border-blue-100 mb-4 flex items-center font-medium"><BookIcon className="w-5 h-5 mr-2"/> {post.attachmentName}</div>)}
                                            
                                            <div className="border-t border-gray-100 pt-3 flex gap-6 text-gray-500">
                                                <button onClick={() => handleLike(post.id)} className={`flex items-center space-x-1.5 transition-colors ${post.likedBy.includes(user.id) ? 'text-yellow-500' : 'hover:text-yellow-500'}`}>
                                                    <StarIcon className="w-5 h-5" filled={post.likedBy.includes(user.id)} /> <span className="text-sm font-medium">{post.likes} Uy tín</span>
                                                </button>
                                                <button onClick={() => setOpenCommentId(openCommentId === post.id ? null : post.id)} className="flex items-center space-x-1.5 hover:text-blue-500 transition-colors"><MessageIcon className="w-5 h-5" /> <span className="text-sm font-medium">{post.comments.length} Bình luận</span></button>
                                                <button onClick={() => triggerAskAI(post)} className="ml-auto text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full font-bold transition-colors flex items-center"><AiIcon className="w-3 h-3 mr-1.5"/> Hỏi AI</button>
                                            </div>

                                            {/* Comment Section */}
                                            {openCommentId === post.id && (
                                                <div className="bg-gray-50 p-3 mt-3 rounded-lg border border-gray-100 animate-fade-in">
                                                    <div className="space-y-2 mb-3 max-h-40 overflow-y-auto custom-scrollbar">
                                                        {post.comments.map((cmt: any) => (
                                                            <div key={cmt.id} className="flex space-x-2 text-xs">
                                                                <span className="font-bold text-gray-800">{cmt.authorName}:</span>
                                                                <span className="text-gray-600">{cmt.content}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handlePostComment(post.id)} placeholder="Viết bình luận..." className="flex-1 border rounded-full px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white" />
                                                        <button onClick={() => handlePostComment(post.id)} disabled={!commentText.trim()}><SendIcon className="w-4 h-4 text-blue-600" /></button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* === VIEW: THƯ VIỆN (GRID THẺ RỘNG HƠN) === */}
                        {activeTab === 'LIBRARY' && (
                            // ĐÃ SỬA: Giảm số cột để thẻ rộng hơn (md:2, lg:2, xl:3) và tăng gap
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {displayedPosts.map(post => (
                                    <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-80 group relative">
                                        
                                        {/* 1. Header Card */}
                                        <div className="px-4 py-3 bg-white border-b border-gray-100 flex justify-between items-center text-[11px] text-gray-500 font-medium">
                                            <span>{formatTime(post.timestamp)}</span>
                                            <span className="flex items-center text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
                                                <StarIcon className="w-3 h-3 mr-1" filled /> {post.likes}
                                            </span>
                                        </div>

                                        {/* 2. Body Card */}
                                        <div className="flex-1 bg-gray-50 relative flex items-center justify-center overflow-hidden cursor-pointer group" onClick={() => window.open(post.attachmentUrl || '#', '_blank')}>
                                            {post.attachmentType === 'image' && post.attachmentUrl ? (
                                                <img src={post.attachmentUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Document" />
                                            ) : (
                                                <div className="text-center p-6">
                                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-500 shadow-inner">
                                                        <BookIcon className="w-8 h-8" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px]">
                                                <span className="bg-white text-gray-900 text-xs px-4 py-2 rounded-full font-bold shadow-lg transform scale-90 group-hover:scale-100 transition-transform">Xem tài liệu</span>
                                            </div>
                                        </div>

                                        {/* 3. Footer Card */}
                                        <div className="p-3 border-t border-gray-100 bg-white h-auto flex flex-col justify-center min-h-[70px]">
                                            <h4 className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug mb-2" title={post.title || post.content}>
                                                {post.title || post.content || "Tài liệu không tên"}
                                            </h4>
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <img src={post.authorAvatar} className="w-5 h-5 rounded-full mr-1.5 border border-gray-200" />
                                                    <span className="text-[10px] text-gray-500 font-semibold truncate max-w-[80px]">{post.authorName}</span>
                                                </div>
                                                <button onClick={(e) => {e.stopPropagation(); triggerAskAI(post)}} className="text-purple-400 hover:text-purple-600 p-1 transition-colors" title="Phân tích tài liệu này">
                                                    <AiIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {displayedPosts.length === 0 && <div className="col-span-full text-center py-20 text-gray-400 italic">Chưa có tài liệu nào trong mục này.</div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR */}
            {activeTab === 'LIBRARY' && (
                <div className="w-72 bg-white border-l border-gray-200 hidden xl:block overflow-y-auto shadow-inner">
                    <div className="p-6">
                        <h3 className="font-bold text-gray-800 mb-5 flex items-center text-sm uppercase tracking-wide"><FilterIcon className="w-4 h-4 mr-2 text-green-600"/> Danh mục tài liệu</h3>
                        <div className="space-y-2">
                            <button onClick={() => setActiveCategory('ALL')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeCategory === 'ALL' ? 'bg-green-50 text-green-700 shadow-sm border border-green-100' : 'text-gray-600 hover:bg-gray-50'}`}>Tất cả tài liệu</button>
                            {CATEGORIES.map(cat => (
                                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex justify-between items-center ${activeCategory === cat.id ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    {cat.name}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeCategory === cat.id ? 'bg-white text-blue-600' : 'bg-gray-100 text-gray-500'}`}>{posts.filter(p => p.category === cat.id).length}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DigitalLibrary;