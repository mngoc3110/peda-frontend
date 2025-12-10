import React, { useEffect, useMemo, useState } from "react";
import { User, UserRole, Assignment } from "../common/types";
import { AssignmentsIcon, ChartIcon, CloseIcon } from "./icons";

// Cùng backend với Assignments.tsx
const API_URL = "https://peda-backend-qi7k.onrender.com";
// Khi deploy Render thì đổi lại: "https://peda-backend-qi7k.onrender.com"

// Trùng với key dùng ở Assignments.tsx
const STORAGE_KEY_DATA = "pedagosys_assignments_v12_class_filtered";

interface TeacherSubmissionsProps {
  user: User;
}

interface BackendSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileName: string;
  mimeType: string;
  size: number;
  fileUrl: string;
  submittedAt: string;
  score: number | null;
  feedback?: string;
}

interface ExtendedSubmission extends BackendSubmission {
  studentName: string;
  studentAvatar: string;
  studentClass?: string;
}

// Map userId -> user info
interface UserMap {
  [id: string]: {
    name: string;
    avatarUrl: string;
    className?: string;
  };
}

const TeacherSubmissions: React.FC<TeacherSubmissionsProps> = ({ user }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");

  const [userMap, setUserMap] = useState<UserMap>({});
  const [submissions, setSubmissions] = useState<ExtendedSubmission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const [gradeDrafts, setGradeDrafts] = useState<{ [subId: string]: string }>(
    {}
  );
  const [feedbackDrafts, setFeedbackDrafts] = useState<{
    [subId: string]: string;
  }>({});

  const [filterStatus, setFilterStatus] = useState<"ALL" | "GRADED" | "UNGRADED">("ALL");

  // ===== 1. Chỉ cho GV / Admin / Dev xem màn này =====
  const isTeacherRole =
    user.role === UserRole.TEACHER ||
    user.role === UserRole.ADMIN ||
    user.role === UserRole.DEVELOPER;

  // ===== 2. Load danh sách bài tập (Assignments) từ localStorage =====
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_DATA);
    if (!stored) return;
    try {
      const list: Assignment[] = JSON.parse(stored);
      setAssignments(list);
    } catch (e) {
      console.error("Lỗi parse assignments từ localStorage:", e);
    }
  }, []);

  // Lọc những bài GV được chấm:
  const teacherAssignments = useMemo(() => {
    if (user.role === UserRole.ADMIN || user.role === UserRole.DEVELOPER) {
      return assignments.filter((a) => !("teacherId" in a) || (a as any).teacherId !== "ai_tutor");
    }
    // GV thường: chỉ xem bài mình giao
    return assignments.filter(
      (a: any) => a.teacherId === user.id && a.teacherId !== "ai_tutor"
    );
  }, [assignments, user]);

  // Auto chọn bài đầu tiên
  useEffect(() => {
    if (!selectedAssignmentId && teacherAssignments.length > 0) {
      setSelectedAssignmentId(teacherAssignments[0].id);
    }
  }, [teacherAssignments, selectedAssignmentId]);

  // ===== 3. Load danh sách user để map studentId -> name/avatar =====
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users`);
        const list = await res.json();
        const map: UserMap = {};
        list.forEach((u: any) => {
          map[u.id] = {
            name: u.name,
            avatarUrl: u.avatarUrl,
            className: u.className,
          };
        });
        setUserMap(map);
      } catch (e) {
        console.error("Lỗi load users:", e);
      }
    };
    fetchUsers();
  }, []);

  // ===== 4. Load submissions theo assignment =====
  useEffect(() => {
    if (!selectedAssignmentId) return;
    const fetchSubs = async () => {
      try {
        setLoadingSubs(true);
        setSubmissions([]);
        setGradeDrafts({});
        setFeedbackDrafts({});

        const res = await fetch(
          `${API_URL}/api/submissions/by-assignment/${selectedAssignmentId}`
        );
        const raw: BackendSubmission[] = await res.json();

        const extended: ExtendedSubmission[] = raw.map((s) => {
          const info = userMap[s.studentId];
          return {
            ...s,
            studentName: info?.name || s.studentId,
            studentAvatar: info?.avatarUrl || "https://ui-avatars.com/api/?name=HS",
            studentClass: info?.className,
          };
        });

        setSubmissions(extended);
      } catch (e) {
        console.error("Lỗi load submissions:", e);
      } finally {
        setLoadingSubs(false);
      }
    };

    fetchSubs();
  }, [selectedAssignmentId, userMap]);

  // ===== 5. Lọc theo trạng thái: đã chấm / chưa chấm =====
  const filteredSubmissions = useMemo(() => {
    if (filterStatus === "ALL") return submissions;
    if (filterStatus === "GRADED") {
      return submissions.filter((s) => s.score !== null && s.score !== undefined);
    }
    // UNGRADED
    return submissions.filter((s) => s.score === null || s.score === undefined);
  }, [submissions, filterStatus]);

  // ===== 6. Hàm chấm điểm =====
  const handleGrade = async (sub: ExtendedSubmission) => {
    const draftScore =
      gradeDrafts[sub.id] !== undefined
        ? gradeDrafts[sub.id]
        : sub.score !== null && sub.score !== undefined
        ? String(sub.score)
        : "";

    const draftFeedback =
      feedbackDrafts[sub.id] !== undefined ? feedbackDrafts[sub.id] : sub.feedback || "";

    if (draftScore === "") {
      alert("Vui lòng nhập điểm (0–10).");
      return;
    }

    const numeric = Number(draftScore);
    if (isNaN(numeric) || numeric < 0 || numeric > 10) {
      alert("Điểm phải từ 0 đến 10.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/submissions/${sub.id}/grade`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: numeric,
          feedback: draftFeedback,
        }),
      });

      const text = await res.text();
      console.log("📥 Grade response:", res.status, text);

      if (!res.ok) {
        let msg = "Chấm điểm thất bại.";
        try {
          const j = JSON.parse(text);
          if (j.message) msg = j.message;
        } catch {}
        throw new Error(msg);
      }

      const updated = JSON.parse(text) as BackendSubmission;

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? { ...s, score: updated.score, feedback: updated.feedback }
            : s
        )
      );

      alert("✅ Đã lưu điểm & nhận xét.");
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Có lỗi khi chấm điểm.");
    }
  };

  // ===== 7. Nếu không phải GV thì chặn màn này =====
  if (!isTeacherRole) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
          Bạn không có quyền truy cập trang chấm bài.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <AssignmentsIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Chấm Bài Tập Học Sinh
            </h2>
            <p className="text-sm text-gray-500">
              Giáo viên: <span className="font-semibold">{user.name}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <ChartIcon className="w-5 h-5 text-yellow-500" />
          <span className="text-xs text-gray-500">
            Gợi ý: lọc theo tình trạng bài nộp để chấm nhanh hơn.
          </span>
        </div>
      </div>

      {/* Chọn bài tập + lọc trạng thái */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 mb-1">
            Chọn bài tập:
          </label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
          >
            {teacherAssignments.length === 0 && (
              <option value="">(Bạn chưa giao bài nào)</option>
            )}
            {teacherAssignments.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">
            Lọc bài nộp:
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                filterStatus === "ALL"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterStatus("UNGRADED")}
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                filterStatus === "UNGRADED"
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              Chưa chấm
            </button>
            <button
              onClick={() => setFilterStatus("GRADED")}
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                filterStatus === "GRADED"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              Đã chấm
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách bài nộp */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-700 text-sm">
            Danh sách bài nộp{" "}
            {selectedAssignmentId && `(${filteredSubmissions.length})`}
          </h3>
        </div>

        {loadingSubs ? (
          <div className="py-10 text-center text-gray-400 text-sm">
            Đang tải danh sách bài nộp...
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">
            Chưa có bài nộp cho bài tập này hoặc không có bài phù hợp bộ lọc.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((s) => {
              const currentScore =
                gradeDrafts[s.id] !== undefined
                  ? gradeDrafts[s.id]
                  : s.score !== null && s.score !== undefined
                  ? String(s.score)
                  : "";

              const currentFeedback =
                feedbackDrafts[s.id] !== undefined
                  ? feedbackDrafts[s.id]
                  : s.feedback || "";

              return (
                <div
                  key={s.id}
                  className="border border-gray-200 rounded-lg p-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between hover:bg-gray-50"
                >
                  {/* Thông tin học sinh */}
                  <div className="flex-1 flex gap-3">
                    <img
                      src={s.studentAvatar}
                      alt={s.studentName}
                      className="w-10 h-10 rounded-full border"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">
                          {s.studentName}
                        </span>
                        {s.studentClass && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                            Lớp {s.studentClass}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Nộp lúc{" "}
                        {new Date(s.submittedAt).toLocaleString("vi-VN")}
                      </div>
                      <a
                        href={`${API_URL}${s.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-1 text-xs text-blue-600 underline"
                      >
                        📄 Xem bài: {s.fileName}
                      </a>
                    </div>
                  </div>

                  {/* Khu vực chấm điểm */}
                  <div className="w-full md:w-64 border-l md:border-l border-t md:border-t-0 border-gray-200 md:pl-3 md:ml-3 pt-3 md:pt-0 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        max={10}
                        className="w-20 border rounded px-2 py-1 text-sm text-right"
                        placeholder="Điểm"
                        value={currentScore}
                        onChange={(e) =>
                          setGradeDrafts((prev) => ({
                            ...prev,
                            [s.id]: e.target.value,
                          }))
                        }
                      />
                      <span className="text-xs text-gray-500">/ 10</span>
                    </div>
                    <textarea
                      className="w-full border rounded px-2 py-1 text-xs min-h-[50px]"
                      placeholder="Nhận xét cho học sinh..."
                      value={currentFeedback}
                      onChange={(e) =>
                        setFeedbackDrafts((prev) => ({
                          ...prev,
                          [s.id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      onClick={() => handleGrade(s)}
                      className="mt-1 w-full bg-green-600 text-white text-xs font-bold py-1.5 rounded hover:bg-green-700"
                    >
                      💾 Lưu điểm & nhận xét
                    </button>
                    {s.score !== null && s.score !== undefined && (
                      <div className="text-[11px] text-gray-500">
                        Đã lưu:{" "}
                        <span className="font-bold text-green-700">
                          {s.score} điểm
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSubmissions;