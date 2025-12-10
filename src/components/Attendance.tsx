
import React, { useState, useEffect, useMemo } from 'react';
import { CheckIcon, CloseIcon, TrashIcon } from './icons';

// --- 1. CẤU HÌNH LIÊN KẾT ---

// Link CSV (để tính toán thống kê nhanh - giữ nguyên cái cũ của bạn)
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/16N6LOENfs1z172s2Ts7S7E80L5IZ6MSJH7gDJOqoe6I/edit?usp=sharing"; 

// 👇 Link AppSheet Browser (Để mở tab mới)
const APPSHEET_EMBED_URL = "https://www.appsheet.com/start/f253125e-2f91-494c-95c8-6a16f51340e5?platform=desktop#appName=H%E1%BB%97tr%E1%BB%A3qu%E1%BA%A3nl%C3%ADh%E1%BB%8Dct%E1%BA%ADp-61683007&vss=H4sIAAAAAAAAA52QQU7DMBREr4L-2kVJKkB4C5VAqCBBxQLM4rf-US0SO4pdoIq84gLchy0X4SZ8FyoQ6qLN0uN54xl38GTo-Sbg7BHkffd7uqAlSOgUTJYNKZAKTpwNrasUCAWXWH-LZ1fjkYIIUezOfryZz_fXek-jna8yHsQ6I5AH2W3_vOzfXIDRZIMpDbUpJ1HM_zB8nQgWkp9nQr0IOK1oVZL9kaWdl_ao-z9i29p_uQ3118Amt4Br5wKrGv186rDVLJ1iQIbrhvUiKw4GeTHIikk-lHkus8P94fHRHcT0K6WbLTzpWx7ac6A_t6OXBq0eO83tSqw8xS_BELpVsgIAAA==&view=%C4%90i%E1%BB%83m%20danh"; 

// --- 2. ĐỊNH NGHĨA DỮ LIỆU ---
interface AttendanceRecord {
    status: 'PRESENT' | 'ABSENT' | 'LATE'; 
    date: string;
}

const Attendance: React.FC = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastSync, setLastSync] = useState<string>('Chưa đồng bộ');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

    // Tự động đồng bộ lần đầu
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const noCacheUrl = `${GOOGLE_SHEET_CSV_URL}&t=${Date.now()}`;
            const response = await fetch(noCacheUrl, { cache: "no-store" });
            if (!response.ok) throw new Error("Lỗi kết nối");
            
            const csvText = await response.text();
            const parsedData = parseCSV(csvText);
            setRecords(parsedData);
            
            const now = new Date();
            setLastSync(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
        } catch (err) {
            console.error("Lỗi tải thống kê:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const parseCSV = (text: string): AttendanceRecord[] => {
        const rows = text.split('\n').slice(1); 
        return rows.map((row) => {
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
            if (cols.length < 6) return null;

            const checkInTime = cols[5]?.trim().replace(/"/g, '') || '';
            const rawDate = cols[4]?.trim().replace(/"/g, '') || '';
            
            let dateIso = rawDate;
            if (rawDate.includes('/')) {
                const parts = rawDate.split('/');
                if (parts.length === 3) {
                     const day = parts[0].padStart(2, '0');
                     const month = parts[1].padStart(2, '0');
                     const year = parts[2];
                     dateIso = `${year}-${month}-${day}`; 
                }
            }

            let status: any = 'ABSENT';
            if (checkInTime) {
                status = 'PRESENT';
                const [h] = checkInTime.split(':').map(Number);
                if (h >= 7 && h < 12) status = 'LATE'; 
            }

            return { status, date: dateIso };
        }).filter(Boolean) as AttendanceRecord[];
    };

    const stats = useMemo(() => {
        const daily = records.filter(r => r.date === selectedDate);
        return {
            total: daily.length,
            present: daily.filter(r => r.status === 'PRESENT').length,
            late: daily.filter(r => r.status === 'LATE').length,
            absent: daily.filter(r => r.status === 'ABSENT').length,
        };
    }, [records, selectedDate]);

    return (
        <div className="max-w-6xl mx-auto pb-10 h-full flex flex-col px-4">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        Điểm danh & Thống kê
                    </h2>
                    <p className="text-sm text-gray-500">
                       Cập nhật lúc: <span className="font-bold text-blue-600">{lastSync}</span>
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                        onClick={fetchData}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm flex items-center"
                    >
                        {isLoading ? "Đang tải..." : "🔄 Cập nhật dữ liệu"}
                    </button>
                </div>
            </div>

            {/* STATS DASHBOARD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-bold">Tổng học sinh</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
                    <p className="text-xs text-green-600 uppercase font-bold">Hiện diện</p>
                    <p className="text-3xl font-bold text-green-700">{stats.present}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 shadow-sm">
                    <p className="text-xs text-yellow-600 uppercase font-bold">Đi muộn</p>
                    <p className="text-3xl font-bold text-yellow-700">{stats.late}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
                    <p className="text-xs text-red-600 uppercase font-bold">Vắng</p>
                    <p className="text-3xl font-bold text-red-700">{stats.absent}</p>
                </div>
            </div>

            {/* ACTION AREA: Thay vì iframe, hiển thị nút mở AppSheet */}
            <div className="flex-1 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg border border-blue-100 flex flex-col items-center justify-center p-10 min-h-[400px]">
                <div className="bg-white p-4 rounded-full shadow-md mb-4">
                    {/* Logo AppSheet giả lập hoặc icon */}
                    <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Hệ thống Điểm danh AppSheet</h3>
                <p className="text-gray-500 text-center max-w-md mb-8">
                    Để đảm bảo tính bảo mật và ổn định, vui lòng truy cập hệ thống điểm danh chính thức trên nền tảng AppSheet. 
                </p>
                
                <div className="flex space-x-4">
                    <button 
                        onClick={() => window.open(APPSHEET_EMBED_URL, '_blank')}
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transition transform hover:-translate-y-1 flex items-center"
                    >
                         Mở App Điểm Danh
                    </button>
                    <button 
                        onClick={() => window.open("https://docs.google.com/spreadsheets/d/16N6LOENfs1z172s2Ts7S7E80L5IZ6MSJH7gDJOqoe6I/edit?usp=sharing", '_blank')} // Thay link Google Sheet nếu muốn
                        className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition"
                    >
                        Xem File Database
                    </button>
                </div>
                
                <div className="mt-8 flex items-center space-x-2 text-xs text-gray-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span>Hệ thống đang hoạt động</span>
                </div>
            </div>
        </div>
    );
};

export default Attendance;