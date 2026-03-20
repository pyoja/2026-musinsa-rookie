// by jh 20260320: 초기 데이터 시드 스크립트 - 1분 이내 완료 목표
// 학과 10개, 교수 100명, 학생 10,000명, 강좌 500개 배치 생성

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// by jh 20260320: 한국어 이름 생성용 토큰 목록
const LAST_NAMES = [
  "김",
  "이",
  "박",
  "최",
  "정",
  "강",
  "조",
  "윤",
  "장",
  "임",
  "한",
  "오",
  "서",
  "신",
  "권",
  "황",
  "안",
  "송",
  "류",
  "홍",
];
const FIRST_SYLLABLE = [
  "민",
  "서",
  "지",
  "현",
  "준",
  "유",
  "수",
  "예",
  "도",
  "진",
  "하",
  "은",
  "재",
  "세",
  "태",
];
const SECOND_SYLLABLE = [
  "준",
  "아",
  "원",
  "빈",
  "우",
  "후",
  "나",
  "연",
  "혁",
  "민",
  "영",
  "호",
  "성",
  "린",
  "찬",
];

const DEPARTMENTS = [
  "컴퓨터공학과",
  "전자공학과",
  "경영학과",
  "경제학과",
  "수학과",
  "물리학과",
  "화학과",
  "국문학과",
  "영문학과",
  "사회학과",
];

// by jh 20260320: 학과별 현실적인 과목명 풀
const COURSE_NAMES_BY_DEPT: Record<string, string[]> = {
  컴퓨터공학과: [
    "자료구조",
    "알고리즘",
    "운영체제",
    "컴퓨터네트워크",
    "데이터베이스",
    "소프트웨어공학",
    "컴파일러",
    "인공지능",
    "머신러닝",
    "웹프로그래밍",
    "모바일프로그래밍",
    "컴퓨터구조",
    "시스템프로그래밍",
    "정보보안",
    "클라우드컴퓨팅",
  ],
  전자공학과: [
    "회로이론",
    "전자기학",
    "신호및시스템",
    "디지털공학",
    "아날로그회로",
    "반도체소자",
    "임베디드시스템",
    "통신이론",
    "마이크로프로세서",
    "제어공학",
    "전력전자",
    "RF공학",
    "광공학",
    "센서공학",
    "VLSI설계",
  ],
  경영학과: [
    "경영학원론",
    "마케팅원론",
    "재무관리",
    "조직행동론",
    "회계원리",
    "경영전략",
    "인사관리",
    "생산운영관리",
    "경영정보시스템",
    "국제경영",
    "창업경영",
    "소비자행동론",
    "광고론",
    "기업가치평가",
    "공급망관리",
  ],
  경제학과: [
    "미시경제학",
    "거시경제학",
    "계량경제학",
    "국제경제학",
    "화폐금융론",
    "재정학",
    "노동경제학",
    "산업조직론",
    "경제사",
    "게임이론",
    "행동경제학",
    "개발경제학",
    "환경경제학",
    "경제통계학",
    "공공경제학",
  ],
  수학과: [
    "미적분학",
    "선형대수학",
    "해석학",
    "복소함수론",
    "위상수학",
    "현대대수학",
    "수치해석",
    "확률론",
    "수리통계학",
    "편미분방정식",
    "조합론",
    "정수론",
    "기하학",
    "함수해석학",
    "최적화이론",
  ],
  물리학과: [
    "역학",
    "전자기학",
    "양자역학",
    "열통계역학",
    "광학",
    "상대성이론",
    "핵물리학",
    "응집물질물리",
    "천체물리학",
    "입자물리학",
    "전산물리",
    "물리실험",
    "플라즈마물리",
    "고체물리",
    "비선형역학",
  ],
  화학과: [
    "일반화학",
    "유기화학",
    "무기화학",
    "물리화학",
    "분석화학",
    "생화학",
    "고분자화학",
    "환경화학",
    "양자화학",
    "화학반응속도론",
    "분광학",
    "전기화학",
    "핵화학",
    "유기합성",
    "계산화학",
  ],
  국문학과: [
    "현대소설론",
    "현대시론",
    "고전문학개론",
    "국어학개론",
    "문학비평론",
    "한국현대문학사",
    "민속문학론",
    "고전시가론",
    "국어음운론",
    "문학과사회",
    "작가론",
    "고전소설론",
    "국어통사론",
    "문학과영화",
    "창작실습",
  ],
  영문학과: [
    "영문학개론",
    "영미소설",
    "영미시",
    "셰익스피어",
    "현대영미문학",
    "영어학개론",
    "미국문학사",
    "영국문학사",
    "비교문학",
    "영어음성학",
    "영어통사론",
    "문화연구",
    "포스트모더니즘",
    "영어글쓰기",
    "번역론",
  ],
  사회학과: [
    "사회학개론",
    "사회조사방법론",
    "사회통계학",
    "사회이론",
    "도시사회학",
    "가족사회학",
    "일탈사회학",
    "의료사회학",
    "문화사회학",
    "젠더와사회",
    "글로벌사회학",
    "노동사회학",
    "사회심리학",
    "환경사회학",
    "정치사회학",
  ],
};

// by jh 20260320: 강의 시간 슬롯 정의 (요일 × 시간대)
const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const TIME_SLOTS = [
  { start: "09:00", end: "10:30" },
  { start: "10:30", end: "12:00" },
  { start: "13:00", end: "14:30" },
  { start: "14:30", end: "16:00" },
  { start: "16:00", end: "17:30" },
  { start: "17:30", end: "19:00" },
  { start: "19:00", end: "20:30" },
  { start: "20:30", end: "22:00" },
];

const SEMESTER = "2026-1";
const BATCH_SIZE = 500; // by jh 20260320: createMany 배치 크기

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(): string {
  return (
    randomItem(LAST_NAMES) +
    randomItem(FIRST_SYLLABLE) +
    randomItem(SECOND_SYLLABLE)
  );
}

async function main() {
  console.log("🌱 시드 데이터 생성 시작...");
  const startTime = Date.now();

  // by jh 20260320: 기존 데이터 초기화 (재실행 안정성)
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.professor.deleteMany();
  await prisma.department.deleteMany();
  console.log("✅ 기존 데이터 초기화 완료");

  // by jh 20260320: WAL 모드 활성화 - PRAGMA가 결과를 반환하므로 $queryRawUnsafe 사용
  await prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL;");
  console.log("✅ WAL 모드 활성화");

  // 1. 학과 10개 생성
  const deptRecords = await Promise.all(
    DEPARTMENTS.map((name) => prisma.department.create({ data: { name } }))
  );
  console.log(`✅ 학과 ${deptRecords.length}개 생성 완료`);

  // 2. 교수 100명 생성 (학과당 10명)
  const professorData = deptRecords.flatMap((dept) =>
    Array.from({ length: 10 }, () => ({
      name: generateName(),
      departmentId: dept.id,
    }))
  );
  await prisma.professor.createMany({ data: professorData });
  const professors = await prisma.professor.findMany();
  console.log(`✅ 교수 ${professors.length}명 생성 완료`);

  // 3. 학생 10,000명 배치 생성
  const STUDENT_TOTAL = 10000;
  for (let batch = 0; batch < STUDENT_TOTAL / BATCH_SIZE; batch++) {
    const dept = deptRecords[batch % deptRecords.length];
    const studentBatch = Array.from({ length: BATCH_SIZE }, (_, i) => ({
      name: generateName(),
      // by jh 20260320: 학번 = 2026 + 학과번호(2자리) + 순번(4자리)
      studentNumber: `2026${String(dept.id).padStart(2, "0")}${String(batch * BATCH_SIZE + i + 1).padStart(4, "0")}`,
      departmentId: dept.id,
    }));
    await prisma.student.createMany({ data: studentBatch });
  }
  console.log(`✅ 학생 ${STUDENT_TOTAL}명 생성 완료`);

  // 4. 강좌 500개 생성
  // by jh 20260320: 교수당 시간 충돌 없도록 교수별 사용 슬롯 추적
  const professorUsedSlots = new Map<number, Set<string>>();
  professors.forEach((p) => professorUsedSlots.set(p.id, new Set()));

  const courseData: {
    name: string;
    credits: number;
    capacity: number;
    day: string;
    startTime: string;
    endTime: string;
    semester: string;
    professorId: number;
    departmentId: number;
  }[] = [];

  const COURSE_TOTAL = 500;
  let attempts = 0;

  while (courseData.length < COURSE_TOTAL && attempts < 10000) {
    attempts++;
    const prof = randomItem(professors);
    const dept = deptRecords.find((d) => d.id === prof.departmentId)!;
    const day = randomItem(DAYS);
    const slot = randomItem(TIME_SLOTS);
    const slotKey = `${day}-${slot.start}`;

    const usedSlots = professorUsedSlots.get(prof.id)!;
    if (usedSlots.has(slotKey)) continue; // 시간 충돌 방지
    usedSlots.add(slotKey);

    const deptCourseNames =
      COURSE_NAMES_BY_DEPT[dept.name] || COURSE_NAMES_BY_DEPT["컴퓨터공학과"];
    const baseName = randomItem(deptCourseNames);
    // by jh 20260320: 같은 이름의 강좌는 분반 추가 (강좌명 충돌 회피)
    const courseName = `${baseName} (${prof.name.slice(0, 2)})`;

    // by jh 20260320: 학점 70% 3학점, 30% 2학점
    const credits = Math.random() < 0.7 ? 3 : 2;
    // by jh 20260320: 정원 20~50명 랜덤
    const capacity = Math.floor(Math.random() * 31) + 20;

    courseData.push({
      name: courseName,
      credits,
      capacity,
      day,
      startTime: slot.start,
      endTime: slot.end,
      semester: SEMESTER,
      professorId: prof.id,
      departmentId: dept.id,
    });
  }

  await prisma.course.createMany({ data: courseData });
  console.log(`✅ 강좌 ${courseData.length}개 생성 완료`);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 시드 완료! 총 소요 시간: ${elapsed}초`);
  console.log(`   학과: ${deptRecords.length}개`);
  console.log(`   교수: ${professors.length}명`);
  console.log(`   학생: ${STUDENT_TOTAL}명`);
  console.log(`   강좌: ${courseData.length}개`);
}

main()
  .catch((e) => {
    console.error("❌ 시드 오류:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
