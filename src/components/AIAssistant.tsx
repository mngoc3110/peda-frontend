import React, { useState, useEffect, useRef } from 'react';
import { User } from '../common/types';
import { createChatSession, fileToGenerativePart } from '../service/gemini_server';
import { SendIcon, CloseIcon, AiIcon, AttachmentIcon } from './icons';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    image?: string;
    isError?: boolean;
}

interface AIAssistantProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onOpen?: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ user, isOpen, onClose, onOpen }) => {
    const getWelcomeMessage = () => {
        const name = user.name.trim();
        const role = user.role?.toString().toLowerCase();

        const femaleNames = ['cô', 'lan', 'linh', 'hương', 'mai', 'nga', 'thảo', 'hồng', 'ngọc', 'yến', 'hà', 'thu', 'phương', 'oanh', 'tuyết', 'vy', 'minh', 'anh', 'kim', 'trang', 'diễm'];

        const isFemaleTeacher = role === 'teacher' && femaleNames.some(f => name.toLowerCase().includes(f));

        if (role === 'Giáo viên') {
            const title = isFemaleTeacher ? 'cô' : 'thầy';
            return `Chào ${title} ${name}! Em có thể giúp gì cho ${title} hôm nay ạ?`;
        }
        if (role === 'Quản trị viên') {
            return `Chào anh/chị ${name}! Em có thể giúp gì cho anh/chị hôm nay ạ?`;
        }
        if (role === 'Nhà phát triển') {
            return `Chào anh ${name}! Em có thể giúp gì cho anh hôm nay ạ?`;
        }
        if (role === 'Học sinh') {
            return `Chào ${name}! Mình là Gia sư AI đây. Mình có thể giúp gì cho bạn hôm nay nào?`;
        }
        return `Chào ${name}! Em có thể giúp gì ạ?`;
    };

    // SỬA ĐIỂM 1: Tiêu đề đúng với xưng hô
    const getChatTitle = () => {
        const role = user.role?.toString().toLowerCase();
        if (role === 'Giáo viên' || role === 'Học sinh') return 'Gia sư AI';
        if (role === 'Nhà phát triển' || role === 'Quản trị viên') return 'Trợ lý AI';
        return 'Chatbot AI';
    };

    const [messages, setMessages] = useState<Message[]>([
        { id: 'init', role: 'model', text: getWelcomeMessage() }
    ]);

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const chatSessionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reloadSession = () => {
        const role = user.role?.toString().toLowerCase();
        if (!['teacher', 'admin', 'developer'].includes(role || '')) return;

        chatSessionRef.current = createChatSession(user);
        setMessages([{ id: 'reloaded', role: 'model', text: `Đã cập nhật dữ liệu mới nhất! ${getWelcomeMessage()}` }]);
    };

    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);
    useEffect(() => {
        const handleOpen = () => { if (onOpen) onOpen(); };
        window.addEventListener('OPEN_AI_CHAT', handleOpen);
        return () => window.removeEventListener('OPEN_AI_CHAT', handleOpen);
    }, [onOpen]);

    useEffect(() => {
        if (isOpen && !chatSessionRef.current) {
            chatSessionRef.current = createChatSession(user);
        }
    }, [isOpen, user]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setSelectedImage(e.target.files[0]);
    };

    const handleSend = async () => {
        if ((!input.trim() && !selectedImage) || isLoading) return;

        const txt = input;
        const img = selectedImage;
        const imgUrl = img ? URL.createObjectURL(img) : undefined;
        setInput(''); setSelectedImage(null); setIsLoading(true);

        const userMsgId = Date.now().toString() + Math.random().toString().slice(2,5);
        setMessages(p => [...p, { id: userMsgId, role: 'user', text: txt, image: imgUrl }]);

        try {
            if (!chatSessionRef.current) chatSessionRef.current = createChatSession(user);
            const session = chatSessionRef.current;

            const sendFunc = session.sendMessageStream ? session.sendMessageStream.bind(session)
                           : session.sendStream ? session.sendStream.bind(session) : null;
            if (!sendFunc) throw new Error("Không tìm thấy hàm gửi tin");

            let result;
            if (img) {
                const imgPart = await fileToGenerativePart(img);
                try { result = await sendFunc([txt || 'Hình ảnh', imgPart]); }
                catch { result = await sendFunc({ parts: [{ text: txt || 'Hình ảnh' }, imgPart] }); }
            } else {
                try { result = await sendFunc(txt); }
                catch { result = await sendFunc({ parts: [{ text: txt }] }); }
            }

            const botId = Date.now().toString() + Math.random().toString().slice(2,5);
            setMessages(p => [...p, { id: botId, role: 'model', text: '' }]);

            let fullText = "";
            for await (const chunk of result.stream) {
                const chunkText = typeof chunk.text === 'function' ? chunk.text() : (chunk.text || "");
                fullText += chunkText;
                setMessages(p => p.map(m => m.id === botId ? { ...m, text: fullText } : m));
            }
        } catch (error: any) {
            setMessages(p => [...p, { id: 'err', role: 'model', text: `Lỗi: ${error.message}`, isError: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-xl flex flex-col z-50 border font-sans">
            {/* HEADER – ĐÃ SỬA TIÊU ĐỀ CHUẨN */}
            <div className="bg-blue-600 text-white p-3 rounded-t-2xl flex justify-between items-center cursor-move select-none">
                <div className="flex items-center gap-2">
                    <AiIcon className="w-5 h-5"/>
                    <span className="font-bold text-sm">{getChatTitle()}</span>
                </div>
                <div className="flex items-center gap-1">
                    {(user.role?.toString().toLowerCase() === 'teacher' || 
                      user.role?.toString().toLowerCase() === 'admin' || 
                      user.role?.toString().toLowerCase() === 'developer') && (
                        <button
                            onClick={reloadSession}
                            className="hover:bg-white/20 px-2.5 py-1 rounded text-xs"
                            title="Nạp lại luật mới nhất"
                        >
                            Nạp dữ liệu
                        </button>
                    )}
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full">
                        <CloseIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {/* NỘI DUNG CHAT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 custom-scrollbar">
                {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl text-sm shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : m.isError ? 'bg-red-50 text-red-600' : 'bg-white border text-gray-800'}`}>
                            {m.image && <img src={m.image} className="mb-2 rounded max-h-32"/>}
                            <div className="whitespace-pre-wrap">{m.text}</div>
                        </div>
                    </div>
                ))}
                {isLoading && <div className="text-xs text-gray-400 animate-pulse">AI đang trả lời...</div>}
                <div ref={messagesEndRef}/>
            </div>

            {/* INPUT – NÚT GỬI NẰM NGANG ĐẸP */}
            <div className="p-3 bg-white border-t flex gap-3 items-center">
                <button onClick={() => fileInputRef.current?.click()} className="text-gray-500 hover:text-blue-600">
                    <AttachmentIcon className="w-5 h-5"/>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*"/>
                
                {selectedImage && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {selectedImage.name}
                    </span>
                )}

                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    disabled={isLoading}
                />

                {/* SỬA ĐIỂM 3: NÚT GỬI NGANG, ĐẸP */}
                <button
                    onClick={handleSend}
                    disabled={isLoading || (!input.trim() && !selectedImage)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    <SendIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
    );
};

export default AIAssistant;