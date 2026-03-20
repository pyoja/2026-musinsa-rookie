# API.md — REST API 명세

> **기준**: Next.js App Router Route Handlers
> **Base URL**: `http://localhost:3000`
> **응답 형식**: JSON

---

## 공통 응답 형식

```json
// 성공
{ "data": {...}, "message": "..." }
// 목록 조회 (페이지네이션 포함)
{ "data": [...], "pagination": { "page": 1, "limit": 20, "total": 500, "totalPages": 25 } }
// 실패
{ "error": "에러 메시지" }
```

## 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 조회 성공 |
| 201 | 수강신청 성공 |
| 400 | 잘못된 요청 (학점 초과, 정원 초과, 파라미터 오류) |
| 404 | 리소스 없음 |
| 409 | 중복 신청, 시간 충돌 |
| 500 | 서버 내부 오류 |

---

## 엔드포인트 목록

### GET /health — 헬스체크

```
GET /health
```

**응답 예시**
```json
{
  "status": "ok",
  "message": "서버 정상 구동 중",
  "data": { "students": 10000, "courses": 500 }
}
```

---

### GET /api/departments — 학과 목록

```
GET /api/departments
```

**응답 예시**
```json
{
  "data": [
    { "id": 1, "name": "컴퓨터공학과" },
    { "id": 2, "name": "전자공학과" }
  ]
}
```

---

### GET /api/students — 학생 목록

```
GET /api/students?page=1&limit=20&departmentId=1
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| page | number | N | 페이지 번호 (기본값: 1) |
| limit | number | N | 페이지당 수 (기본값: 20, 최대 100) |
| departmentId | number | N | 학과 ID 필터 |

**응답 예시**
```json
{
  "data": [
    {
      "id": 1,
      "name": "김민준",
      "studentNumber": "2026010001",
      "departmentId": 1,
      "department": { "name": "컴퓨터공학과" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 10000, "totalPages": 500 }
}
```

---

### GET /api/professors — 교수 목록

```
GET /api/professors?page=1&limit=20&departmentId=1
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| page | number | N | 페이지 번호 |
| limit | number | N | 페이지당 수 (기본값: 20) |
| departmentId | number | N | 학과 ID 필터 |

---

### GET /api/courses — 강좌 목록

```
GET /api/courses?page=1&limit=20&departmentId=1
```

**응답 예시**
```json
{
  "data": [
    {
      "id": 1,
      "name": "자료구조 (김민)",
      "credits": 3,
      "capacity": 30,
      "enrolled": 25,
      "day": "MON",
      "startTime": "09:00",
      "endTime": "10:30",
      "semester": "2026-1",
      "professor": { "name": "김민준" },
      "department": { "name": "컴퓨터공학과" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 500, "totalPages": 25 }
}
```

---

### POST /api/enrollments — 수강신청

```
POST /api/enrollments
Content-Type: application/json
```

**요청 Body**
```json
{ "studentId": 1, "courseId": 1 }
```

**검증 순서 (트랜잭션 내)**
1. 학생 존재 여부
2. 강좌 존재 여부
3. 중복 신청 확인 → 409
4. 정원 초과 확인 → 400
5. 18학점 초과 확인 → 400
6. 시간 충돌 확인 → 409

**성공 응답 (201)**
```json
{
  "data": {
    "id": 1,
    "studentId": 1,
    "courseId": 1,
    "enrolledAt": "2026-03-20T04:30:00.000Z",
    "course": { "name": "자료구조 (김민)", "credits": 3, ... }
  },
  "message": "수강신청이 완료되었습니다"
}
```

**에러 응답 예시**
```json
{ "error": "정원이 초과되었습니다" }       // 400
{ "error": "이미 수강신청한 강좌입니다" }   // 409
{ "error": "최대 18학점을 초과할 수 없습니다" } // 400
{ "error": "시간표가 겹치는 강좌가 있습니다" } // 409
```

---

### DELETE /api/enrollments/:id — 수강취소

```
DELETE /api/enrollments/1
```

**성공 응답 (200)**
```json
{ "message": "수강취소가 완료되었습니다" }
```

**에러 응답**
```json
{ "error": "수강신청 내역을 찾을 수 없습니다" }  // 404
```

---

### GET /api/students/:id/timetable — 시간표 조회

```
GET /api/students/1/timetable
```

**응답 예시**
```json
{
  "data": {
    "student": { "id": 1, "name": "김민준", "studentNumber": "2026010001" },
    "semester": "2026-1",
    "totalCredits": 12,
    "maxCredits": 18,
    "enrollments": [
      {
        "id": 1,
        "enrolledAt": "2026-03-20T04:30:00.000Z",
        "course": {
          "name": "자료구조 (김민)",
          "credits": 3,
          "day": "MON",
          "startTime": "09:00",
          "endTime": "10:30",
          "professor": { "name": "김민준" }
        }
      }
    ]
  }
}
```

---

### GET /api/stats — 통계 현황

```
GET /api/stats
```

**응답 예시**
```json
{
  "data": {
    "students": 10000,
    "professors": 100,
    "courses": 500,
    "enrollments": 342,
    "fullCourses": 12
  }
}
```
