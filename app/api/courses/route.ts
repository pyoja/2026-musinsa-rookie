// by jh 20260320: GET /api/courses - 강좌 목록 조회 (학과 필터, 정원/현재인원/시간 포함)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const departmentId = searchParams.get("departmentId");

    const where = departmentId ? { departmentId: Number(departmentId) } : {};

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          professor: { select: { name: true } },
          department: { select: { name: true } },
        },
        orderBy: { id: "asc" },
      }),
      prisma.course.count({ where }),
    ]);

    return NextResponse.json({
      data: courses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: "서버 내부 오류" }, { status: 500 });
  }
}
