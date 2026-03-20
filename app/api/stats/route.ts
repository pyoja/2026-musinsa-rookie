// by jh 20260320: GET /api/stats - 전체 현황 통계 (프론트 대시보드용)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      studentCount,
      professorCount,
      courseCount,
      enrollmentCount,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.professor.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
    ]);

    // by jh 20260320: 정원이 꽉 찬 강좌 수 (enrolled >= capacity) - Raw 쿼리 사용
    const fullCourseResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM Course WHERE enrolled >= capacity
    `;
    const fullCourseCount = Number(fullCourseResult[0]?.count ?? 0);

    return NextResponse.json({
      data: {
        students: studentCount,
        professors: professorCount,
        courses: courseCount,
        enrollments: enrollmentCount,
        fullCourses: fullCourseCount,
      },
    });
  } catch {
    return NextResponse.json({ error: "서버 내부 오류" }, { status: 500 });
  }
}
