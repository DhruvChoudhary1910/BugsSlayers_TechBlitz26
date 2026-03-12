import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateTimeSlots } from "@/lib/utils";
import { notifyNewBooking } from "@/lib/telegram";

// GET /api/appointments - list with filters
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const doctorId = searchParams.get("doctorId");
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

    // Doctor can only see their own appointments
    if (session.user.role === "DOCTOR" && session.user.doctorId) {
      where.doctorId = session.user.doctorId;
    }

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        where.date.gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.date.lte = to;
      }
    }

    if (status && status !== "ALL") where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (type && type !== "ALL") where.type = type;
    if (priority && priority !== "ALL") where.priority = priority;

    if (search) {
      where.patient = {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
        ],
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: true,
          doctor: { include: { user: true } },
        },
        orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      appointments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/appointments - create with clash check
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { patientId, doctorId, date, timeSlot, type, priority, symptoms, notes } = body;

    // Check doctor availability
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor || !doctor.isAvailable) {
      return NextResponse.json({ error: "Doctor is not available" }, { status: 400 });
    }

    // Check for leave
    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(appointmentDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const leave = await prisma.doctorLeave.findFirst({
      where: {
        doctorId,
        date: { gte: appointmentDate, lt: nextDay },
      },
    });
    if (leave) {
      return NextResponse.json({ error: "Doctor is on leave on this date" }, { status: 400 });
    }

    // Check for clash
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: { gte: appointmentDate, lt: nextDay },
        timeSlot,
        status: { not: "CANCELLED" },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Time slot is already booked" }, { status: 409 });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        date: appointmentDate,
        timeSlot,
        type: type || "IN_PERSON",
        priority: priority || "NORMAL",
        symptoms,
        notes,
        createdBy: session.user.id,
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    // Create notifications
    await Promise.all([
      prisma.notification.create({
        data: {
          userId: doctor.userId,
          title: priority === "URGENT" ? "🔴 Urgent Appointment" : "New Appointment",
          message: `${appointment.patient.name} booked at ${timeSlot} on ${appointmentDate.toLocaleDateString()}`,
          type: "BOOKING",
          link: "/dashboard/doctor/schedule",
        },
      }),
    ]);

    // Send Telegram notification (fire and forget)
    notifyNewBooking(appointment);

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
