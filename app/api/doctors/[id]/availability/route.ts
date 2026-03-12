import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/doctors/[id]/availability
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        leaves: { orderBy: { date: "asc" } },
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/doctors/[id]/availability
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};
    if (body.workingDays !== undefined) updateData.workingDays = JSON.stringify(body.workingDays);
    if (body.workingHoursStart !== undefined) updateData.workingHoursStart = body.workingHoursStart;
    if (body.workingHoursEnd !== undefined) updateData.workingHoursEnd = body.workingHoursEnd;
    if (body.slotDurationMins !== undefined) updateData.slotDurationMins = body.slotDurationMins;
    if (body.isAvailable !== undefined) updateData.isAvailable = body.isAvailable;
    if (body.consultationFee !== undefined) updateData.consultationFee = body.consultationFee;

    // Update user profile fields
    if (body.name || body.phone || body.specialization || body.qualification || body.bio) {
      const doctor = await prisma.doctor.findUnique({ where: { id } });
      if (doctor) {
        if (body.name || body.phone) {
          await prisma.user.update({
            where: { id: doctor.userId },
            data: {
              ...(body.name && { name: body.name }),
              ...(body.phone && { phone: body.phone }),
            },
          });
        }
        if (body.specialization) updateData.specialization = body.specialization;
        if (body.qualification) updateData.qualification = body.qualification;
        if (body.bio !== undefined) updateData.bio = body.bio;
      }
    }

    const updated = await prisma.doctor.update({
      where: { id },
      data: updateData,
      include: { user: true, leaves: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
