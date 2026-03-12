import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// DELETE /api/telegram/unlink - disconnect Telegram from doctor account
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "DOCTOR" || !session.user.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.doctor.update({
      where: { id: session.user.doctorId },
      data: { telegramChatId: null, telegramLinked: false },
    });

    // Clean up sessions
    await prisma.telegramSession.deleteMany({
      where: { doctorId: session.user.doctorId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unlinking Telegram:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/telegram/unlink - get current link status
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "DOCTOR" || !session.user.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: session.user.doctorId },
      select: { telegramLinked: true, telegramReminders: true },
    });

    return NextResponse.json(doctor);
  } catch (error) {
    console.error("Error fetching Telegram status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/telegram/unlink - toggle reminders
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "DOCTOR" || !session.user.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { telegramReminders } = await req.json();

    await prisma.doctor.update({
      where: { id: session.user.doctorId },
      data: { telegramReminders },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating reminders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
