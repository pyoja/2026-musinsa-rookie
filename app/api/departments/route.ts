// by jh 20260320: GET /api/departments - 학과 목록 (프론트 필터 드롭다운용)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ data: departments });
  } catch {
    return NextResponse.json({ error: "서버 내부 오류" }, { status: 500 });
  }
}
