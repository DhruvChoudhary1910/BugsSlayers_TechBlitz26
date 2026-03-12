import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/patients
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const doctorId = searchParams.get("doctorId");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // If doctor, only show patients they've seen
    if (doctorId || (session.user.role === "DOCTOR" && session.user.doctorId)) {
      const dId = doctorId || session.user.doctorId;
      const patientIds = await prisma.appointment.findMany({
        where: { doctorId: dId! },
        select: { patientId: true },
        distinct: ["patientId"],
      });
      where.id = { in: patientIds.map((p) => p.patientId) };
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { appointments: true } },
      },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/patients
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, phone, email, dateOfBirth, gender, bloodGroup, address, medicalHistory } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        phone,
        email: email || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        address: address || null,
        medicalHistory: medicalHistory || null,
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
