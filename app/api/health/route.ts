// by jh 20260320: GET /health - 서버 상태 확인 및 데이터 준비 완료 응답

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // by jh 20260320: DB 연결 확인 및 기본 카운트 조회
    const [studentCount, courseCount] = await Promise.all([
      prisma.student.count(),
      prisma.course.count(),
    ]);

    return NextResponse.json({
      status: "ok",
      message: "서버 정상 구동 중",
      data: {
        students: studentCount,
        courses: courseCount,
      },
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "서버 오류" },
      { status: 500 }
    );
  }
}
