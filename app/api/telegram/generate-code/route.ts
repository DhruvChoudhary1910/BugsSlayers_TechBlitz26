import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/telegram/generate-code - generate 6-digit verification code
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "DOCTOR" || !session.user.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Delete any existing unverified sessions for this doctor
    await prisma.telegramSession.deleteMany({
      where: { doctorId: session.user.doctorId, verified: false },
    });

    // Create new session with 10 minute expiry
    const telegramSession = await prisma.telegramSession.create({
      data: {
        doctorId: session.user.doctorId,
        verificationCode: code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    return NextResponse.json({ code, expiresAt: telegramSession.expiresAt });
  } catch (error) {
    console.error("Error generating Telegram code:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
