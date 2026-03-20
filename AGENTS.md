# AGENTS.md — AI 에이전트 지침

> 이 문서는 AI 에이전트(Codex, Claude, Gemini 등)가 이 프로젝트에서 작업할 때 따라야 할 지침을 정의합니다.

---

## 프로젝트 개요

**대학교 수강신청 시스템** — REST API 서버

- 핵심 요구사항: 정원 초과 없는 동시성 제어 (100명 동시 신청 시 정원 1명이면 1명만 성공)
- 기술 스택: Next.js 14 (App Router) + TypeScript + Prisma + SQLite

---

## 코딩 원칙

### 필수 원칙

1. **TypeScript Strict Mode** — `any` 타입 사용 금지. 반드시 `interface` 또는 `type`으로 정의
2. **주석 형식** — `// by jh YYYYMMDD: 내용` 형식 준수
3. **에러 핸들링** — 모든 API에 `try-catch` 적용, 명확한 HTTP 상태코드 반환
4. **함수형 컴포넌트** — React 컴포넌트는 Functional Component로만 작성
5. **배치 처리** — DB 삽입은 `createMany()` 사용 (개별 insert 금지)

### 파일 구조

```
src/app/api/
├── health/route.ts          # GET /health
├── students/route.ts        # GET /api/students
├── professors/route.ts      # GET /api/professors
├── courses/route.ts         # GET /api/courses
├── enrollments/
│   ├── route.ts             # POST /api/enrollments
│   └── [id]/route.ts        # DELETE /api/enrollments/:id
└── students/
    └── [id]/timetable/route.ts  # GET /api/students/:id/timetable

prisma/
├── schema.prisma            # DB 스키마 (SQLite 기반)
└── seed.ts                  # 초기 데이터 생성 스크립트

docs/
├── REQUIREMENTS.md          # 요구사항 분석 및 설계 결정
└── API.md                   # REST API 명세

prompts/                     # AI 대화 프롬프트 이력
```

---

## 동시성 제어 규칙

> **절대 원칙**: 수강신청은 반드시 Prisma 인터랙티브 트랜잭션 내에서 처리한다.

```typescript
// by jh 20260320: 수강신청 동시성 제어 - 트랜잭션 내 원자적 처리 필수
await prisma.$transaction(async (tx) => {
  // 1. 강좌 잠금 조회
  // 2. 정원 확인
  // 3. 학점 제한 확인
  // 4. 시간 충돌 확인
  // 5. Enrollment 생성 + enrolled 카운트 업데이트
});
```

---

## API 설계 원칙

- 모든 응답은 JSON 형식
- 성공: `{ data: ..., message: "..." }`
- 실패: `{ error: "에러 메시지" }` + 적절한 HTTP 상태코드

| 상태코드 | 사용 상황 |
|---------|-----------|
| 200 | 조회 성공 |
| 201 | 생성 성공 (수강신청) |
| 400 | 요청 파라미터 오류, 학점 초과, 정원 초과 |
| 404 | 리소스 없음 |
| 409 | 중복 신청, 시간 충돌 |
| 500 | 서버 내부 오류 |

---

## 데이터 시드 규칙

- 서버 시작 시 자동으로 `prisma/seed.ts` 실행 (`package.json`의 `prisma.seed` 연동)
- `GET /health`가 200 응답할 시점에 모든 데이터 준비 완료 보장
- **1분 이내** 완료 필수
- 정적 파일(SQL dump, CSV) 사용 금지 — 프로그래밍 로직으로만 생성

---

## 금지 사항

- `any` 타입 사용
- 하드코딩된 ID 값 사용
- 트랜잭션 없이 수강신청 로직 처리
- `console.log`를 에러 처리로 대체 (반드시 HTTP 에러 응답 반환)
