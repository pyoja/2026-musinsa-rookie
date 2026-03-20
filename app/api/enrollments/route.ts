// by jh 20260320: POST /api/enrollments - 수강신청 (동시성 제어 핵심 로직)
// Prisma 인터랙티브 트랜잭션으로 정원 초과 방지

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_CREDITS = 18;
const SEMESTER = "2026-1";

interface EnrollmentBody {
  studentId: number;
  courseId: number;
}

// by jh 20260320: 시간 충돌 판별 함수
function isTimeConflict(
  existingDay: string,
  existingStart: string,
  existingEnd: string,
  newDay: string,
  newStart: string,
  newEnd: string
): boolean {
  if (existingDay !== newDay) return false;
  return existingStart < newEnd && existingEnd > newStart;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId 파라미터가 필요합니다" },
        { status: 400 }
      );
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: Number(studentId) },
      include: {
        course: {
          include: {
            professor: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    return NextResponse.json({ data: enrollments });
  } catch {
    return NextResponse.json({ error: "서버 내부 오류" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: EnrollmentBody = await request.json();
    const { studentId, courseId } = body;

    if (!studentId || !courseId) {
      return NextResponse.json(
        { error: "studentId와 courseId가 필요합니다" },
        { status: 400 }
      );
    }

    // by jh 20260320: 트랜잭션으로 원자적 처리 - 동시성 제어 핵심
    const enrollment = await prisma.$transaction(async (tx) => {
      // 1. 학생 존재 여부 확인 및 배타적 쓰기 락(Write Lock) 획득
      // by jh 20260320: 동일 학생이 여러 강좌를 동시 수강신청할 때 발생하는 시간표 중복(Write Skew) 방지
      // SQLite는 SELECT FOR UPDATE를 지원하지 않으므로 강제 업데이트를 통해 트랜잭션을 Write 모드로 즉시 격상시킴
      await tx.$executeRaw`UPDATE Student SET id = id WHERE id = ${studentId}`;
      const student = await tx.student.findUnique({
        where: { id: studentId },
      });
      if (!student) {
        throw new Error("STUDENT_NOT_FOUND");
      }

      // 2. 강좌 정보 조회 (정원 포함) 및 강좌 쓰기 락 획득 (동시 정원 초과 방지)
      await tx.$executeRaw`UPDATE Course SET id = id WHERE id = ${courseId}`;
      const course = await tx.course.findUnique({
        where: { id: courseId },
      });
      if (!course) {
        throw new Error("COURSE_NOT_FOUND");
      }

      // 3. 중복 신청 확인
      const existingEnrollment = await tx.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
      });
      if (existingEnrollment) {
        throw new Error("ALREADY_ENROLLED");
      }

      // 4. 정원 확인 - 원자적으로 체크 후 업데이트
      if (course.enrolled >= course.capacity) {
        throw new Error("COURSE_FULL");
      }

      // 5. 현재 수강 중인 학점 합산
      const currentEnrollments = await tx.enrollment.findMany({
        where: {
          studentId,
          course: { semester: SEMESTER },
        },
        include: { course: true }, // by jh 20260320: include와 select 혼용 오류 방지를 위해 true 사용
      });

      const totalCredits = currentEnrollments.reduce(
        (sum, e) => sum + e.course.credits,
        0
      );
      if (totalCredits + course.credits > MAX_CREDITS) {
        throw new Error("CREDITS_EXCEEDED");
      }

      // 6. 시간 충돌 확인
      const hasConflict = currentEnrollments.some((e) =>
        isTimeConflict(
          e.course.day,
          e.course.startTime,
          e.course.endTime,
          course.day,
          course.startTime,
          course.endTime
        )
      );
      if (hasConflict) {
        throw new Error("TIME_CONFLICT");
      }

      // 7. 수강신청 레코드 생성 + enrolled 카운트 증가 (원자적)
      const [newEnrollment] = await Promise.all([
        tx.enrollment.create({
          data: { studentId, courseId },
          include: {
            course: {
              select: { name: true, credits: true, day: true, startTime: true, endTime: true },
            },
          },
        }),
        tx.course.update({
          where: { id: courseId },
          data: { enrolled: { increment: 1 } },
        }),
      ]);

      return newEnrollment;
    });

    return NextResponse.json(
      { data: enrollment, message: "수강신청이 완료되었습니다" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      const errorMap: Record<string, [string, number]> = {
        STUDENT_NOT_FOUND: ["학생을 찾을 수 없습니다", 404],
        COURSE_NOT_FOUND: ["강좌를 찾을 수 없습니다", 404],
        ALREADY_ENROLLED: ["이미 수강신청한 강좌입니다", 409],
        COURSE_FULL: ["정원이 초과되었습니다", 400],
        CREDITS_EXCEEDED: [`최대 ${MAX_CREDITS}학점을 초과할 수 없습니다`, 400],
        TIME_CONFLICT: ["시간표가 겹치는 강좌가 있습니다", 409],
      };
      const mapped = errorMap[error.message];
      if (mapped) {
        return NextResponse.json({ error: mapped[0] }, { status: mapped[1] });
      }
    }
    return NextResponse.json({ error: "서버 내부 오류" }, { status: 500 });
  }
}
