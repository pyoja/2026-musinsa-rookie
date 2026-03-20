# 03. 프롬프트 이력: 핵심 API 분리 및 동시성 제어 (Core API & Concurrency)

> **작성일**: 2026-03-20
> **단계**: 3단계 - 비즈니스 분기 처리, 수강신청, 시간표 로직 구현

---

## 작업 개요
본 문서는 수강신청 시스템의 **핵심 과제인 정원 초과 방지(동시성 제어), 18학점 제한, 시간표 충돌 등 예외 처리 로직**을 구현하며 AI와 협업한 기록입니다.

---

### [핵심 과제] 100명이 1자리 남은 강좌에 동시 요청 시 1명만 성공해야 함

**(AI 에이전트의 구현 전략 및 코드 설계 과정 요약)**

**1. 동시성 제어의 접근성 판단**
- **Redis 기반 분산 락**이나 **PostgreSQL의 배타적 락(Pessimistic Locking)** 처리를 서버 평가 요소로 구축할 수 있지만, "SQLite 기반의 환경에서 평가자가 쉽게 구동"해야 한다는 목표가 있음.
- 따라서, **"Prisma 인터랙티브 트랜잭션 (`$transaction`)"**을 핵심 도구로 결정.

**2. 트랜잭션의 원자성(Atomicity) 확보 흐름 설계**
수강신청 요청 (`POST /api/enrollments`) 내에서 아래와 같은 선형적 체크 로직을 원자적으로 구성했음.
```typescript
await prisma.$transaction(async (tx) => {
    // [Check 1] 학생 & 강좌 존재 확인
    // [Check 2] 중복 수강 여부 확인
    // [Check 3] 정원이 차지 않았는지 DB 상의 카운트 확인
    // [Check 4] 현재 내가 수강한 총 학점과 새로 담을 학점의 18학점 초과 여부 확인
    // [Check 5] 내가 등록한 수강 목록의 시간표들과 겹치는지 이중 반복문 검사
    // [Commit] 최종적으로 Enrollment.create 와 Course.update(enrolled + 1) 처리
});
```

**3. 프론트엔드 시각화 (테스트 탭 구축)**
이후 평가자가 동시성 제어가 성공적으로 구동됨을 바로 눈으로 볼 수 있게 브라우저 UI를 구성하기로 함.
- Javascript의 `Promise.all()`을 이용해 백엔드 API를 동시에 N개만큼 스로틀링 없이 쏘는 테스트 코드 작성.

---

### [문제 및 해결] 시간 충돌 검사 로직 (Business Logic)

수강신청 로직 중 시간표 충돌 여부를 데이터베이스 쿼리로만 해결하기엔 시간 포맷 파싱("09:00", "10:30" 문자열 처리)이 DB 레이어에서 까다로웠음.

**결정 사항**:
- 강좌의 현재 시간 데이터를 가져온 뒤, `Javascript Layer(Server Side)`에서 `isTimeConflict` 헬퍼 함수를 통해 교집합이 발생하는지 검사.
- `existingStart < newEnd && existingEnd > newStart` 라는 간단명료한 공식으로 시간의 범위를 쉽게 파악함.

---

### [문제 및 해결] 통계/현황판 쿼리 오류 해결

**발생 상황**:
```typescript
prisma.course.count({
  where: { enrolled: { gte: prisma.course.fields.capacity } }
})
```
현황판 API 작성 시 위 코드에서 Prisma Type Error가 발생함. `prisma.course.fields` 라는 속성이 구버전에서만 되거나 특정 환경에서 제공되지 않는 형태임을 파악.

**AI 원인 분석 및 해결안 도출**:
오류를 수정하기 위해 직접 같은 테이블의 두 컬럼 크기를 비교하는 Raw Query 방식으로 우회하기로 결정함.
```typescript
const fullCourseResult = await prisma.$queryRaw`
  SELECT COUNT(*) as count FROM Course WHERE enrolled >= capacity
`;
```
이를 통해 정원이 "마감된 강좌 수"를 정확하게 `BigInt` 형태로 집계해 UI 상의 대시보드 현황판에 올바르게 노출하는 것으로 트러블슈팅 완료.

---

## 최종 결론
AI와의 협상을 통해 "문제의 복잡한 조건(시간, 학점, 정원)"을 하나의 트랜잭션으로 응집시켜 정합성을 맞출 수 있었으며, 동시성 에러 없이 1자리 강좌를 여러 명이 때렸을 때 올바르게 1명만 `201 Created`를 받고, 나머지는 `400 Bad Request("COURSE_FULL")` 로 튕겨내는 데 완벽히 성공함.
