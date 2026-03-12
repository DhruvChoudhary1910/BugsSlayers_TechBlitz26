import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyCancellation, notifyReschedule } from "@/lib/telegram";

// GET /api/appointments/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/appointments/[id] - update status, reschedule, add prescription
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { status, date, timeSlot, prescription, notes, followUpDate } = body;

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, doctor: { include: { user: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // If rescheduling, check for clashes
    if (date && timeSlot) {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(newDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const clash = await prisma.appointment.findFirst({
        where: {
          doctorId: existing.doctorId,
          date: { gte: newDate, lt: nextDay },
          timeSlot,
          status: { not: "CANCELLED" },
          id: { not: id },
        },
      });
      if (clash) {
        return NextResponse.json({ error: "New time slot is already booked" }, { status: 409 });
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      updateData.date = d;
    }
    if (timeSlot) updateData.timeSlot = timeSlot;
    if (prescription !== undefined) updateData.prescription = prescription;
    if (notes !== undefined) updateData.notes = notes;
    if (followUpDate !== undefined) {
      updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    // Create notification for status changes
    if (status) {
      const notifMap: Record<string, { title: string; type: string }> = {
        CONFIRMED: { title: "Appointment Confirmed", type: "BOOKING" },
        CANCELLED: { title: "Appointment Cancelled", type: "CANCELLATION" },
        COMPLETED: { title: "Appointment Completed", type: "INFO" },
        NO_SHOW: { title: "Patient No-Show", type: "INFO" },
      };
      const notifInfo = notifMap[status];
      if (notifInfo) {
        await prisma.notification.create({
          data: {
            userId: existing.doctor.userId,
            title: notifInfo.title,
            message: `${existing.patient.name}'s appointment at ${existing.timeSlot} - ${status}`,
            type: notifInfo.type,
          },
        });
      }

      // Telegram notification for cancellation
      if (status === "CANCELLED") {
        notifyCancellation(updated);
      }
    }

    // Telegram notification for reschedule
    if (date && timeSlot) {
      notifyReschedule(updated, existing.date, existing.timeSlot);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
