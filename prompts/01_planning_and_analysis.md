# 01. 프로젝트 분석 및 구조 계획 (Planning & Analysis)

> **작성일**: 2026-03-20
> **단계**: 1단계 - PROBLEM.md 분석 및 전체 구조 설계

---

## 프롬프트 기록

### [Prompt 1] PROBLEM.md 분석 요청

**입력한 프롬프트:**
```
@[PROBLEM.md] 해당 문서를 읽고, 앞으로 구현해야 할 것들을 정리해줘.
예를 들면 docs폴더를 만들고 어떤 용도의 md파일을 작성해야하는지,
prompts 폴더는 어떻게 지금까지 입력한 프롬프트를 어떻게 정리할 것인지 등
첨부한 파일을 읽고 진행해야 할 내용들을 모두 정리해줘.
```

**AI 답변 핵심 요약:**
- 과제의 핵심 평가 기준: ① 동작 여부 ② 핵심 기능(동시성 제어) ③ 사고의 깊이(AI 활용 프롬프트)
- 제출물 필수 구조: `README.md`, `AGENTS.md`, `docs/REQUIREMENTS.md`, `docs/API.md`, `prompts/*.md`, `src/`
- `docs/REQUIREMENTS.md`: 명시되지 않은 요구사항에 대한 합리적인 판단 기록이 핵심
- `prompts/`: 작업 단계별 주제로 분리하여 AI 활용 과정을 체계적으로 기록

---

### [Prompt 2] 기술 스택 결정 및 본격 착수 요청

**입력한 프롬프트:**
```
이 질문에 대한 답변은 글로벌 룰대로 하지말고, 문제를 풀 수 있도록 유리한 방안으로
인메모리 기반 DB(Prisma 연동 등)를 통해 진행해줘.
바로 docs/, prompts/ 폴더 및 기본 스캐폴딩 구조를 생성하고
첫 작업인 REQUIREMENTS.md의 초안 작성을 진행해줘.
```

**판단 및 결정:**
- **DB 선택**: SQLite (Prisma 연동) 채택
  - 이유: 평가자가 별도의 환경 변수 없이 `npm run dev` 한 번으로 바로 실행 가능
  - 이유: 네트워크 지연 없이 1분 이내 데이터 1만 건 이상 시드 처리 가능
  - 이유: Prisma의 원자적 트랜잭션을 활용한 동시성 제어 구현에 유리
- **기술 스택 확정**: Next.js (App Router) + TypeScript + Prisma + SQLite

---

## 설계 의사결정 요약

| 항목 | 결정 | 근거 |
|------|------|------|
| 언어 | TypeScript | 타입 안전성, 팀 친숙도 |
| 프레임워크 | Next.js (App Router) | Route Handler로 REST API 구현 가능 |
| DB | SQLite | 설치 불필요, 평가자 실행 편의성 최우선 |
| ORM | Prisma | 타입 안전 쿼리, 원자적 트랜잭션 지원 |
| 동시성 전략 | Prisma 트랜잭션 + SQLite WAL 모드 | 경량 환경에서 최적 |

---

## 다음 단계

- `docs/REQUIREMENTS.md` 초안 작성 → 요구사항 분석 및 설계 결정 기록
- `docs/API.md` 초안 작성 → REST API 명세 작성
- Prisma 스키마 설계 및 시드 스크립트 작성
