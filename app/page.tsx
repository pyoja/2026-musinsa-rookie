"use client";
// by jh 20260320: 수강신청 시스템 테스트 대시보드 - 4개 탭 (강좌목록, 학생시간표, 동시성테스트, 현황판)

import { useState, useEffect, useCallback } from "react";

// ---------- 타입 정의 ----------
interface Department {
  id: number;
  name: string;
}

interface Course {
  id: number;
  name: string;
  credits: number;
  capacity: number;
  enrolled: number;
  day: string;
  startTime: string;
  endTime: string;
  professor: { name: string };
  department: { name: string };
}

interface Enrollment {
  id: number;
  course: Course;
  enrolledAt: string;
}

interface Stats {
  students: number;
  professors: number;
  courses: number;
  enrollments: number;
  fullCourses: number;
}

interface ConcurrencyResult {
  success: number;
  fail: number;
  details: string[];
  finalEnrolled: number | null;
}

const DAY_MAP: Record<string, string> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
};

const TAB_LIST = ["📋 강좌 목록", "👤 학생 시간표", "⚡ 동시성 테스트", "📊 현황판"];

// ---------- 메인 컴포넌트 ----------
export default function Page() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">🎓 수강신청 시스템 테스트 대시보드</h1>
        <p className="text-gray-400 text-sm mt-1">대학교 수강신청 시스템 API 테스트 UI</p>
      </header>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 mb-6 border-b border-gray-800">
        {TAB_LIST.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              activeTab === i
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 0 && <CourseTab />}
      {activeTab === 1 && <TimetableTab />}
      {activeTab === 2 && <ConcurrencyTab />}
      {activeTab === 3 && <StatsTab />}
    </div>
  );
}

// ---------- 탭 1: 강좌 목록 ----------
function CourseTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "12" });
    if (selectedDept) params.set("departmentId", selectedDept);
    const res = await fetch(`/api/courses?${params}`);
    const json = await res.json();
    setCourses(json.data ?? []);
    setTotalPages(json.pagination?.totalPages ?? 1);
    setLoading(false);
  }, [page, selectedDept]);

  useEffect(() => {
    fetch("/api/departments").then((r) => r.json()).then((j) => setDepartments(j.data ?? []));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [selectedDept]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleEnroll = async (courseId: number) => {
    if (!studentId.trim()) {
      setMessage({ text: "학생 ID를 입력하세요", type: "error" });
      return;
    }
    const res = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: Number(studentId), courseId }),
    });
    const json = await res.json();
    if (res.ok) {
      setMessage({ text: `✅ 수강신청 완료: ${json.data?.course?.name}`, type: "success" });
      fetchCourses();
    } else {
      setMessage({ text: `❌ ${json.error}`, type: "error" });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div>
      {/* 컨트롤 바 */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-gray-800 text-white rounded px-3 py-2 text-sm"
        >
          <option value="">전체 학과</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="학생 ID (수강신청용)"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="bg-gray-800 text-white rounded px-3 py-2 text-sm w-48"
        />
        {message && (
          <span className={`text-sm font-medium ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
            {message.text}
          </span>
        )}
      </div>

      {/* 강좌 목록 그리드 */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">로딩 중...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {courses.map((course) => {
            const isFull = course.enrolled >= course.capacity;
            const ratio = (course.enrolled / course.capacity) * 100;
            return (
              <div key={course.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-white text-sm">{course.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{course.department.name} · {course.professor.name}</p>
                  </div>
                  <span className="text-xs text-yellow-400 font-bold">{course.credits}학점</span>
                </div>
                {/* 정원 진행 바 */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{DAY_MAP[course.day]} {course.startTime}~{course.endTime}</span>
                    <span className={isFull ? "text-red-400 font-bold" : "text-green-400"}>
                      {course.enrolled}/{course.capacity}명
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${isFull ? "bg-red-500" : ratio > 80 ? "bg-yellow-500" : "bg-green-500"}`}
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleEnroll(course.id)}
                  disabled={isFull}
                  className={`w-full py-1.5 rounded text-xs font-medium transition-colors ${
                    isFull
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isFull ? "정원 초과" : "수강신청"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-40"
        >이전</button>
        <span className="px-3 py-1 text-sm text-gray-400">{page} / {totalPages}</span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-40"
        >다음</button>
      </div>
    </div>
  );
}

// ---------- 탭 2: 학생 시간표 ----------
function TimetableTab() {
  const [studentId, setStudentId] = useState("");
  const [data, setData] = useState<{ student: { name: string; studentNumber: string }; totalCredits: number; enrollments: Enrollment[] } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTimetable = async () => {
    if (!studentId.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/students/${studentId}/timetable`);
    const json = await res.json();
    if (res.ok) {
      setData(json.data);
    } else {
      setError(json.error);
      setData(null);
    }
    setLoading(false);
  };

  const handleCancel = async (enrollmentId: number) => {
    const res = await fetch(`/api/enrollments/${enrollmentId}`, { method: "DELETE" });
    if (res.ok) fetchTimetable();
  };

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <input
          type="number"
          placeholder="학생 ID 입력"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchTimetable()}
          className="bg-gray-800 text-white rounded px-3 py-2 text-sm w-48"
        />
        <button
          onClick={fetchTimetable}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm"
        >
          조회
        </button>
      </div>

      {loading && <div className="text-gray-400">조회 중...</div>}
      {error && <div className="text-red-400">{error}</div>}

      {data && (
        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
            <p className="text-white font-semibold">{data.student.name} 학생</p>
            <p className="text-gray-400 text-sm">학번: {data.student.studentNumber}</p>
            <p className="text-blue-400 text-sm mt-1">
              총 수강 학점: <span className="font-bold">{data.totalCredits}</span> / 18학점
            </p>
          </div>

          {data.enrollments.length === 0 ? (
            <p className="text-gray-500">수강신청한 강좌가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {data.enrollments.map((e) => (
                <div key={e.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-white text-sm font-medium">{e.course.name}</p>
                    <p className="text-gray-400 text-xs">
                      {DAY_MAP[e.course.day]} {e.course.startTime}~{e.course.endTime} · {e.course.credits}학점 · {e.course.professor.name}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancel(e.id)}
                    className="bg-red-700 hover:bg-red-800 text-white rounded px-3 py-1 text-xs"
                  >
                    취소
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- 탭 3: 동시성 테스트 ----------
function ConcurrencyTab() {
  const [courseId, setCourseId] = useState("1");
  const [concurrentCount, setConcurrentCount] = useState(100);
  const [result, setResult] = useState<ConcurrencyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [courseInfo, setCourseInfo] = useState<{ enrolled: number; capacity: number; name: string } | null>(null);

  // by jh 20260320: 동시성 테스트 - Promise.all로 N개 동시 요청 발사
  const runTest = async () => {
    setLoading(true);
    setResult(null);

    const startStudentId = Math.floor(Math.random() * 9000) + 1;
    const requests = Array.from({ length: concurrentCount }, (_, i) =>
      fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: startStudentId + i,
          courseId: Number(courseId),
        }),
      }).then(async (res) => {
        const json = await res.json();
        return { ok: res.ok, status: res.status, message: json.message ?? json.error };
      })
    );

    const responses = await Promise.all(requests);
    const successList = responses.filter((r) => r.ok);
    const failList = responses.filter((r) => !r.ok);

    // by jh 20260320: 최종 enrolled 수 확인
    const courseRes = await fetch(`/api/courses?limit=500`);
    const courseJson = await courseRes.json();
    const targetCourse = (courseJson.data as Course[]).find((c) => c.id === Number(courseId));

    setResult({
      success: successList.length,
      fail: failList.length,
      details: responses.slice(0, 20).map((r, i) => `요청${i + 1}: ${r.ok ? "✅" : "❌"} ${r.message}`),
      finalEnrolled: targetCourse?.enrolled ?? null,
    });

    if (targetCourse) {
      setCourseInfo({ enrolled: targetCourse.enrolled, capacity: targetCourse.capacity, name: targetCourse.name });
    }

    setLoading(false);
  };

  return (
    <div>
      <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-6">
        <p className="text-yellow-400 font-semibold text-sm">⚡ 동시성 제어 테스트</p>
        <p className="text-gray-300 text-xs mt-1">
          N명이 동시에 같은 강좌를 수강신청합니다. 정원 초과 없이 정확히 처리되는지 확인합니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div>
          <label className="text-gray-400 text-xs block mb-1">강좌 ID</label>
          <input
            type="number"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="bg-gray-800 text-white rounded px-3 py-2 text-sm w-28"
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs block mb-1">동시 요청 수</label>
          <input
            type="number"
            value={concurrentCount}
            onChange={(e) => setConcurrentCount(Number(e.target.value))}
            min={1}
            max={200}
            className="bg-gray-800 text-white rounded px-3 py-2 text-sm w-28"
          />
        </div>
        <button
          onClick={runTest}
          disabled={loading}
          className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded px-6 py-2 text-sm font-bold"
        >
          {loading ? "테스트 중..." : "🚀 동시 요청 발사"}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {/* 결과 요약 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-900/40 border border-green-700 rounded-lg p-4 text-center">
              <p className="text-green-400 text-3xl font-bold">{result.success}</p>
              <p className="text-green-300 text-sm">성공</p>
            </div>
            <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 text-center">
              <p className="text-red-400 text-3xl font-bold">{result.fail}</p>
              <p className="text-red-300 text-sm">실패</p>
            </div>
            <div className="bg-blue-900/40 border border-blue-700 rounded-lg p-4 text-center">
              <p className="text-blue-400 text-3xl font-bold">{result.finalEnrolled ?? "?"}</p>
              <p className="text-blue-300 text-sm">최종 enrolled 수</p>
              {courseInfo && (
                <p className="text-gray-400 text-xs mt-1">정원: {courseInfo.capacity}</p>
              )}
            </div>
          </div>

          {/* 동시성 판정 */}
          {result.finalEnrolled !== null && courseInfo && (
            <div className={`rounded-lg p-3 text-center font-semibold ${
              result.finalEnrolled <= courseInfo.capacity
                ? "bg-green-900/40 border border-green-600 text-green-400"
                : "bg-red-900/40 border border-red-600 text-red-400"
            }`}>
              {result.finalEnrolled <= courseInfo.capacity
                ? `✅ 동시성 제어 성공! enrolled(${result.finalEnrolled}) ≤ capacity(${courseInfo.capacity})`
                : `❌ 정원 초과 발생! enrolled(${result.finalEnrolled}) > capacity(${courseInfo.capacity})`}
            </div>
          )}

          {/* 상세 로그 (최대 20개) */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-2">요청 결과 상세 (최대 20개)</p>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {result.details.map((d, i) => (
                <p key={i} className="text-xs font-mono text-gray-300">{d}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- 탭 4: 현황판 ----------
function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const res = await fetch("/api/stats");
    const json = await res.json();
    setStats(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = stats
    ? [
        { label: "전체 학생 수", value: stats.students.toLocaleString(), color: "text-blue-400", icon: "👩‍🎓" },
        { label: "전체 교수 수", value: stats.professors.toLocaleString(), color: "text-purple-400", icon: "👨‍🏫" },
        { label: "전체 강좌 수", value: stats.courses.toLocaleString(), color: "text-green-400", icon: "📚" },
        { label: "수강신청 건수", value: stats.enrollments.toLocaleString(), color: "text-yellow-400", icon: "📝" },
        { label: "마감된 강좌", value: stats.fullCourses.toLocaleString(), color: "text-red-400", icon: "🔴" },
      ]
    : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">전체 현황</h2>
        <button
          onClick={fetchStats}
          className="bg-gray-800 hover:bg-gray-700 text-white rounded px-3 py-1 text-sm"
        >
          🔄 새로고침
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400">로딩 중...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map((card) => (
            <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-lg p-5 text-center">
              <p className="text-3xl mb-2">{card.icon}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-gray-400 text-xs mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4">
        <p className="text-gray-300 font-medium mb-2">📡 API 빠른 테스트</p>
        <div className="space-y-1">
          {[
            ["GET /health", "/health"],
            ["GET /api/students", "/api/students?limit=5"],
            ["GET /api/professors", "/api/professors?limit=5"],
            ["GET /api/courses", "/api/courses?limit=5"],
            ["GET /api/departments", "/api/departments"],
          ].map(([label, url]) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-mono"
            >
              <span className="text-gray-500">→</span> {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
