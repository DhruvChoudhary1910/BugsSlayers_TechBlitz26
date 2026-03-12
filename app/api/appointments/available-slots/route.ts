import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateTimeSlots } from "@/lib/utils";

// GET /api/appointments/available-slots?doctorId=&date=
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");

    if (!doctorId || !date) {
      return NextResponse.json({ error: "doctorId and date are required" }, { status: 400 });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    if (!doctor.isAvailable) {
      return NextResponse.json({ allSlots: [], bookedSlots: [], availableSlots: [] });
    }

    // Check if doctor works on this day
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();
    const workingDays: number[] = JSON.parse(doctor.workingDays);
    if (!workingDays.includes(dayOfWeek)) {
      return NextResponse.json({ allSlots: [], bookedSlots: [], availableSlots: [] });
    }

    // Check for leave
    appointmentDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(appointmentDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const leave = await prisma.doctorLeave.findFirst({
      where: { doctorId, date: { gte: appointmentDate, lt: nextDay } },
    });
    if (leave) {
      return NextResponse.json({ allSlots: [], bookedSlots: [], availableSlots: [], onLeave: true });
    }

    // Generate all slots
    const allSlots = generateTimeSlots(
      doctor.workingHoursStart,
      doctor.workingHoursEnd,
      doctor.slotDurationMins
    );

    // Get booked slots
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: { gte: appointmentDate, lt: nextDay },
        status: { not: "CANCELLED" },
      },
      select: { timeSlot: true },
    });
    const bookedSlots = bookedAppointments.map((a) => a.timeSlot);

    // Filter past slots for today
    const now = new Date();
    const isToday = appointmentDate.toDateString() === now.toDateString();
    const availableSlots = allSlots.filter((slot) => {
      if (bookedSlots.includes(slot)) return false;
      if (isToday) {
        const [hours, mins] = slot.split(":").map(Number);
        const slotTime = new Date(now);
        slotTime.setHours(hours, mins, 0, 0);
        return slotTime > now;
      }
      return true;
    });

    return NextResponse.json({ allSlots, bookedSlots, availableSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
