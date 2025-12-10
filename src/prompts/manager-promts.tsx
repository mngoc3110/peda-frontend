import { User, UserRole } from "../common/types";

// 1. IMPORT CÁC FILE RAW (Dữ liệu thô)
import generalRules from '../prompts/_general_rules.txt?raw';
import ruleDev from '../prompts/1_rule_developer.txt?raw';
import ruleAdmin from '../prompts/2_rule_admin.txt?raw';
import ruleTeacher from '../prompts/3_rule_teacher.txt?raw';
import ruleStudent from '../prompts/4_rule_student.txt?raw';
import GDPT from '../prompts/5_rule_GDPT.txt';
import scope from '../prompts/6_rule_scope.txt?raw';
import examRules from '../prompts/7_rule_exam_rules.txt?raw';
// --- 2. HÀM XÂY DỰNG PROMPT CHO CHAT BOT ---
export const buildSystemInstruction = (user: User): string => {
    // Khai báo biến 'parts' ở đây để dùng trong hàm này
    const parts: string[] = [];

    // === PHẦN 0: LUẬT CHUNG (LUÔN CÓ) ===
    parts.push("=== PHẦN 0: QUY TẮC ỨNG XỬ CHUNG ===");
    if (generalRules) parts.push(generalRules);

    // === PHẦN 1: PERSONA THEO VAI TRÒ ===
    parts.push("\n=== PHẦN 1: PERSONA THEO VAI TRÒ ===");
    switch (user.role) {
        case UserRole.DEVELOPER:
            parts.push(ruleDev);
            break;
        case UserRole.ADMIN:
            parts.push(ruleAdmin);
            break;
        case UserRole.TEACHER:
            parts.push(ruleTeacher);
            break;
        case UserRole.STUDENT:
            parts.push(ruleStudent);
            break;
        default:
            parts.push(ruleStudent);
    }

    // === PHẦN 2: KIẾN THỨC NỀN TẢNG ===
    parts.push("\n=== PHẦN 2: KIẾN THỨC NỀN TẢNG ===");
    parts.push(GDPT); // File 5
    parts.push(scope);      // File 6

    // === PHẦN 3: KỸ NĂNG CHUYÊN MÔN ===
    // Chỉ nạp luật soạn đề cho Giáo viên/Admin
    if (user.role === UserRole.TEACHER || user.role === UserRole.ADMIN) {
        parts.push("\n=== PHẦN 3: KỸ NĂNG CHUYÊN MÔN ===");
        parts.push(examRules); // File 7
    }

    // === PHẦN 4: CONTEXT ===
    parts.push("\n==================================");
    parts.push(`USER CONTEXT: Tên: ${user.name} | Vai trò: ${user.role}`);
    parts.push("Yêu cầu: Hãy tuân thủ nghiêm ngặt các quy tắc ở Phần 0 và Persona ở Phần 1.");
    
    return parts.join("\n\n");
};

// --- 3. HÀM LẤY PROMPT ĐỂ TẠO BÀI TẬP ---
// Hàm này không dùng biến 'parts' hay 'user' của hàm trên, mà tự tạo danh sách riêng
export const getExamGenerationPrompt = (): string => {
    return [
        "=== QUY TẮC SOẠN ĐỀ THI ===",
        generalRules, // Áp dụng luật chung
        "Vai trò: Bạn là chuyên gia soạn đề thi trắc nghiệm khách quan.",
        examRules,   // File 7: Quy tắc soạn đề
        GDPT,  // File 5: Khung chương trình
        scope        // File 6: Giới hạn
    ].join("\n\n");
};