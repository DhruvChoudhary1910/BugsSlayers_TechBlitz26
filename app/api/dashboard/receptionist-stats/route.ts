import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/dashboard/receptionist-stats
export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Stats
    const [
      todayAppointments,
      totalPatients,
      pendingConfirmations,
      cancelledToday,
      completedToday,
    ] = await Promise.all([
      prisma.appointment.count({
        where: { date: { gte: today, lt: tomorrow } },
      }),
      prisma.patient.count(),
      prisma.appointment.count({
        where: { status: "PENDING", date: { gte: today, lt: tomorrow } },
      }),
      prisma.appointment.count({
        where: { status: "CANCELLED", date: { gte: today, lt: tomorrow } },
      }),
      prisma.appointment.count({
        where: { status: "COMPLETED", date: { gte: today, lt: tomorrow } },
      }),
    ]);

    // Weekly appointments for chart
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = await prisma.appointment.count({
        where: { date: { gte: d, lt: next } },
      });
      weekData.push({
        date: d.toISOString().split("T")[0],
        day: d.toLocaleDateString("en", { weekday: "short" }),
        count,
      });
    }

    // Status breakdown for pie chart
    const statusBreakdown = await Promise.all(
      ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"].map(async (status) => ({
        status,
        count: await prisma.appointment.count({
          where: { status, date: { gte: today, lt: tomorrow } },
        }),
      }))
    );

    // Upcoming appointments
    const upcoming = await prisma.appointment.findMany({
      where: {
        date: { gte: today },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
      orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      take: 5,
    });

    return NextResponse.json({
      stats: {
        todayAppointments,
        totalPatients,
        pendingConfirmations,
        cancelledToday,
        completedToday,
      },
      weekData,
      statusBreakdown,
      upcoming,
    });
  } catch (error) {
    console.error("Error fetching receptionist stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
