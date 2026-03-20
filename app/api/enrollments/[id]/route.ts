// by jh 20260320: DELETE /api/enrollments/:id - 수강취소 + enrolled 카운트 감소

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const enrollmentId = Number(params.id);

    if (isNaN(enrollmentId)) {
      return NextResponse.json({ error: "잘못된 ID 형식입니다" }, { status: 400 });
    }

    // by jh 20260320: 트랜잭션으로 삭제 + 카운트 감소 원자적 처리 (음수 방지 및 락 적용)
    await prisma.$transaction(async (tx) => {
      // 1. 수강신청 건 조회
      const enrollment = await tx.enrollment.findUnique({
        where: { id: enrollmentId },
        include: { course: true },
      });

      if (!enrollment) {
        throw new Error("ENROLLMENT_NOT_FOUND");
      }

      // 2. 해당 강좌에 대한 배타적 쓰기 락(Write Lock) 선점
      // 락을 획득함으로써 동시 취소나 신청 시 카운트 정합성을 보장함
      await tx.$executeRaw`UPDATE Course SET id = id WHERE id = ${enrollment.courseId}`;

      // 3. 인원수가 이미 0 이하라면 감소시키지 않음 (데이터 무결성 방어)
      if (enrollment.course.enrolled > 0) {
        await Promise.all([
          tx.enrollment.delete({ where: { id: enrollmentId } }),
          tx.course.update({
            where: { id: enrollment.courseId },
            data: { enrolled: { decrement: 1 } },
          }),
        ]);
      } else {
        // 비정상적인 상태라도 내 신청 기록은 삭제하여 학생 권리 복구
        await tx.enrollment.delete({ where: { id: enrollmentId } });
      }
    });

    return NextResponse.json({ message: "수강취소가 완료되었습니다" });
  } catch (error) {
    if (error instanceof Error && error.message === "ENROLLMENT_NOT_FOUND") {
      return NextResponse.json(
        { error: "수강신청 내역을 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: "서버 내부 오류" }, { status: 500 });
  }
}
