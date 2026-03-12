import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/dashboard/doctor-stats
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.doctorId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Start of month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayCount,
      completedToday,
      pendingToday,
      monthlyPatients,
    ] = await Promise.all([
      prisma.appointment.count({
        where: { doctorId, date: { gte: today, lt: tomorrow } },
      }),
      prisma.appointment.count({
        where: { doctorId, status: "COMPLETED", date: { gte: today, lt: tomorrow } },
      }),
      prisma.appointment.count({
        where: { doctorId, status: { in: ["PENDING", "CONFIRMED"] }, date: { gte: today, lt: tomorrow } },
      }),
      prisma.appointment.count({
        where: { doctorId, date: { gte: monthStart, lt: tomorrow } },
      }),
    ]);

    // Earnings today
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    const earningsToday = completedToday * (doctor?.consultationFee || 0);

    // Weekly data for chart
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = await prisma.appointment.count({
        where: { doctorId, date: { gte: d, lt: next } },
      });
      weekData.push({
        date: d.toISOString().split("T")[0],
        day: d.toLocaleDateString("en", { weekday: "short" }),
        count,
      });
    }

    // Next appointment
    const nextAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: { gte: today, lt: tomorrow },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: { patient: true },
      orderBy: { timeSlot: "asc" },
    });

    return NextResponse.json({
      stats: {
        todayCount,
        completedToday,
        pendingToday,
        earningsToday,
        monthlyPatients,
      },
      weekData,
      nextAppointment,
    });
  } catch (error) {
    console.error("Error fetching doctor stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
