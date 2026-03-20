// by jh 20260320: GET /api/students/:id/timetable - 학생 시간표 조회

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SEMESTER = "2026-1";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const studentId = Number(params.id);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: "잘못된 학생 ID입니다" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, studentNumber: true },
    });

    if (!student) {
      return NextResponse.json({ error: "학생을 찾을 수 없습니다" }, { status: 404 });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId,
        course: { semester: SEMESTER },
      },
      include: {
        course: {
          include: {
            professor: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [
        { course: { day: "asc" } },
        { course: { startTime: "asc" } },
      ],
    });

    const totalCredits = enrollments.reduce(
      (sum, e) => sum + e.course.credits,
      0
    );

    return NextResponse.json({
      data: {
        student,
        semester: SEMESTER,
        totalCredits,
        maxCredits: 18,
        enrollments,
      },
    });
  } catch {
    return NextResponse.json({ error: "서버 내부 오류" }, { status: 500 });
  }
}
