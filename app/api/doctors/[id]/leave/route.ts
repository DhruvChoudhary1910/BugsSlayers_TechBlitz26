import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/doctors/[id]/leave - add leave date
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { date, reason } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const leaveDate = new Date(date);
    leaveDate.setHours(0, 0, 0, 0);

    const leave = await prisma.doctorLeave.create({
      data: {
        doctorId: id,
        date: leaveDate,
        reason: reason || null,
      },
    });

    return NextResponse.json(leave, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Leave already exists for this date" }, { status: 409 });
    }
    console.error("Error adding leave:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/doctors/[id]/leave - remove leave by date query param
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json({ error: "Date query param is required" }, { status: 400 });
    }

    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    await prisma.doctorLeave.deleteMany({
      where: {
        doctorId: id,
        date,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing leave:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
