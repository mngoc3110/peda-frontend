export enum UserRole {
  ADMIN = 'Quản trị viên',
  TEACHER = 'Giáo viên',
  STUDENT = 'Học sinh',
  DEVELOPER = 'Nhà phát triển',
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  avatarUrl: string;
  reputation: number;
  isApproved: boolean;
  password?: string;
  bio?: string; // Giới thiệu bản thân
  nickname?: string;
  jobTitle?: string;
  subject?: string;   // Cho Giáo viên
  className?: string; // Cho Học sinh
  phoneNumber?: string;
  school?: string;      // Trường học (Cho HS)
  schoolYear?: string;  // Năm học / Niên khóa (Cho HS)
  workplace?: string;   // Nơi công tác (Cho GV)
}

export enum View {
  DASHBOARD = 'Bảng điều khiển',
  GRADEBOOK = 'Sổ điểm',
  ASSIGNMENTS = 'Bài tập',
  ONLINE_CLASS = 'Lớp học trực tuyến',
  DIGITAL_LIBRARY = 'Thư viện số',
  USER_MANAGEMENT = 'Quản lý người dùng',
  ANNOUNCEMENTS = 'Thông báo',
  MY_GRADES = 'Điểm của tôi',
  MY_PROFILE = 'Hồ sơ của tôi',
  VIRTUAL_LAB = 'Phòng thí nghiệm 3d',
  ATTENDANCE = 'Điểm danh',
  TEACHER_SUBMISSIONS = 'TEACHER_SUBMISSIONS',
}

export interface FeedbackLog {
  id: string;
  userId: string;
  userRole: UserRole;
  type: 'DATA_ERROR' | 'PEDAGOGY_ERROR';
  content: string;
  context: string;
  timestamp: number;
  status: 'PENDING' | 'RESOLVED';
}

// SỬA: Đổi tên thành LibraryComment (Viết hoa chữ C) để không bị nhầm
export interface LibraryComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: number;
}

export interface CharacterData {
  id: string;
  name: string;
  avatar: string;
  description: string;
}

export interface LibraryPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: UserRole;
  authorReputation: number;
  content: string;
  timestamp: number;
  likes: number;
  likedBy: string[]; // Mảng chứa IDs người đã like
  aiAnalysis?: string; // Phân tích AI
  tags: string[];
  title?: string;       // Tiêu đề bài viết (Có thể có hoặc không)
    category?: string;    // Chuyên mục (KHTN, KHXH...)
  
  // SỬA QUAN TRỌNG: Dùng LibraryComment[] thay vì Comment[]
  // Comment[] là kiểu mặc định của trình duyệt (HTML comment), gây lỗi xung đột
  comments: LibraryComment[]; 

  attachmentUrl?: string; 
  attachmentName?: string; 
  attachmentType?: "image" | "file";
}

export interface Announcement {
  id: string;
  title: string;
  summary: string;
  content: string;
  authorName: string;
  authorRole: UserRole;
  timestamp: number;
  targetType: 'ALL' | 'ROLE' | 'CLASS'; // Gửi cho: Tất cả / Nhóm vai trò / Lớp cụ thể
  targetValue?: string; // Giá trị đi kèm (VD: 'TEACHER' hoặc '10.1', '12.8'...)
  externalLink?: string;
  imageUrl?: string;      // Đường dẫn ảnh (hoặc base64)
  colorTheme?: string;     // Tên màu chủ đạo (vd: 'red', 'blue', 'green')
}

export interface AssignmentSubmission {
    studentId: string;
    studentName: string;
    studentAvatar: string;
    submittedAt: number;
    fileUrl?: string;
    fileName?: string;
    score?: number;
}

export interface AssignmentComment {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    userRole: UserRole;
    content: string;
    timestamp: number;
}

export interface Assignment {
    id: string;
    teacherId: string;
    teacherName: string;
    title: string;
    content: string;
    targetClass: string; 
    deadline: number;    
    createdAt: number;
    submissions: AssignmentSubmission[]; 
    comments: AssignmentComment[];     
    attachmentUrl?: string; 
    attachmentName?: string; 
}
export interface Attendance {
    id: string;
    classId: string;
    date: number;
    status: 'Present' | 'Absent' | 'Late';
    studentId: string;
}
export interface GradeScore {
    tx1?: number; 
    tx2?: number; 
    tx3?: number;
    gk?: number;  
    ck?: number;  
    tbm?: number; 
}
export interface StudentGrade {
    studentId: string;
    studentName: string;
    className: string;
    scores: { [subject: string]: GradeScore }; // Key là tên môn học
}