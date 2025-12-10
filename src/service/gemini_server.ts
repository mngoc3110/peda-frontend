// Dùng thư viện chuẩn ổn định
import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, UserRole } from "../common/types";
import { buildSystemInstruction, getExamGenerationPrompt } from "../prompts/manager-promts";
// --- CẤU HÌNH ---
const MODEL_NAME = "gemini-2.0-flash"; 
const HARDCODED_API_KEY = "AIzaSyDWFHt02bFiuaqW4QvEJbkGCf0bgMHR9GI"; 

// --- KHỞI TẠO CLIENT ---
let client: GoogleGenerativeAI | null = null;

const getClient = () => {
  if (client) return client;
  if (!HARDCODED_API_KEY) throw new Error("Thiếu API Key");
  
  // Khởi tạo kiểu cũ (đơn giản hơn)
  client = new GoogleGenerativeAI(HARDCODED_API_KEY);
  return client;
};

// --- CÁC HÀM CHỨC NĂNG ---

export const createChatSession = (user: User) => {
  const genAI = getClient();
  
  // 2. NẠP KIẾN THỨC VÀO CHAT (Thay vì chuỗi string đơn giản)
  // Hàm này sẽ tự động đọc file text tương ứng với Role của user
  const fullInstruction = buildSystemInstruction(user);

  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    systemInstruction: fullInstruction // <-- Nạp "bộ não" vào đây
  });

  // Hàm startChat trả về object có .sendMessageStream (Chuẩn ổn định)
  return model.startChat({
    history: [],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8000, // Tăng token để AI "nhớ" được nhiều luật
    },
  });
};

export const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) resolve((reader.result as string).split(',')[1]);
    };
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

export const generateWeeklyExercises = async (subject: string, grade: string): Promise<string> => {
  const genAI = getClient();
  
  // 3. NẠP LUẬT SOẠN ĐỀ (File 7_exam_rules.txt)
  const examRules = getExamGenerationPrompt();

  try {
    const model = genAI.getGenerativeModel({ 
        model: MODEL_NAME,
        systemInstruction: examRules // <-- Nạp luật soạn đề vào đây
    });

    const result = await model.generateContent(`Soạn 5 câu trắc nghiệm môn ${subject} lớp ${grade} có đáp án.`);
    return result.response.text();
  } catch (error: any) {
    console.error("AI Error:", error);
    return "Xin lỗi, AI đang bận.";
  }
};

// Dummy exports (Giữ nguyên để không lỗi import)
export const savePedagogyInstruction = () => {};
export const getPedagogyInstruction = () => '';
export const getSystemInstruction = () => '';
export const explainPostContent = async () => "Đang cập nhật...";