import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "dev.db" });
const prisma = new PrismaClient({ adapter });

// Simple hash function compatible with our auth (we'll verify with same approach)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function main() {
  console.log("Seeding database...");

  const receptionistPass = await hashPassword("password123");
  const doctorPass = await hashPassword("password123");

  // Create Receptionist
  const receptionist = await prisma.user.upsert({
    where: { email: "receptionist@clinic.com" },
    update: {},
    create: {
      name: "Sarah Johnson",
      email: "receptionist@clinic.com",
      password: receptionistPass,
      role: "RECEPTIONIST",
      phone: "+1-555-0101",
    },
  });

  // Create Doctor User
  const doctorUser = await prisma.user.upsert({
    where: { email: "doctor@clinic.com" },
    update: {},
    create: {
      name: "Dr. Michael Chen",
      email: "doctor@clinic.com",
      password: doctorPass,
      role: "DOCTOR",
      phone: "+1-555-0102",
    },
  });

  // Create Doctor profile
  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      specialization: "General Medicine",
      qualification: "MBBS, MD - Internal Medicine",
      bio: "Experienced physician with 10+ years in general medicine. Passionate about preventive healthcare and patient education.",
      slotDurationMins: 30,
      workingDays: "[1,2,3,4,5]",
      workingHoursStart: "09:00",
      workingHoursEnd: "17:00",
      isAvailable: true,
      consultationFee: 500,
    },
  });

  // Create second doctor
  const doctorUser2 = await prisma.user.upsert({
    where: { email: "dr.smith@clinic.com" },
    update: {},
    create: {
      name: "Dr. Emily Smith",
      email: "dr.smith@clinic.com",
      password: doctorPass,
      role: "DOCTOR",
      phone: "+1-555-0103",
    },
  });

  const doctor2 = await prisma.doctor.upsert({
    where: { userId: doctorUser2.id },
    update: {},
    create: {
      userId: doctorUser2.id,
      specialization: "Pediatrics",
      qualification: "MBBS, MD - Pediatrics",
      bio: "Dedicated pediatrician specializing in child health and development. Board certified with a focus on holistic child care.",
      slotDurationMins: 20,
      workingDays: "[1,2,3,4,5,6]",
      workingHoursStart: "10:00",
      workingHoursEnd: "18:00",
      isAvailable: true,
      consultationFee: 600,
    },
  });

  // Create sample patients
  const patients = await Promise.all([
    prisma.patient.upsert({
      where: { id: "patient-1" },
      update: {},
      create: {
        id: "patient-1",
        name: "John Doe",
        phone: "+1-555-1001",
        email: "john.doe@email.com",
        dateOfBirth: new Date("1990-05-15"),
        gender: "Male",
        bloodGroup: "O+",
        address: "123 Main Street, Springfield",
        medicalHistory: "No known allergies. Previous surgery: Appendectomy (2015).",
      },
    }),
    prisma.patient.upsert({
      where: { id: "patient-2" },
      update: {},
      create: {
        id: "patient-2",
        name: "Jane Smith",
        phone: "+1-555-1002",
        email: "jane.smith@email.com",
        dateOfBirth: new Date("1985-08-22"),
        gender: "Female",
        bloodGroup: "A+",
        address: "456 Oak Avenue, Springfield",
        medicalHistory: "Allergic to Penicillin. Hypertension (managed).",
      },
    }),
    prisma.patient.upsert({
      where: { id: "patient-3" },
      update: {},
      create: {
        id: "patient-3",
        name: "Robert Wilson",
        phone: "+1-555-1003",
        email: "robert.wilson@email.com",
        dateOfBirth: new Date("1978-12-01"),
        gender: "Male",
        bloodGroup: "B+",
        address: "789 Pine Road, Springfield",
        medicalHistory: "Type 2 Diabetes. Regular medication: Metformin 500mg.",
      },
    }),
    prisma.patient.upsert({
      where: { id: "patient-4" },
      update: {},
      create: {
        id: "patient-4",
        name: "Emily Davis",
        phone: "+1-555-1004",
        email: "emily.davis@email.com",
        dateOfBirth: new Date("1995-03-10"),
        gender: "Female",
        bloodGroup: "AB+",
        address: "321 Elm Street, Springfield",
        medicalHistory: "Asthma (mild, inhaler as needed).",
      },
    }),
    prisma.patient.upsert({
      where: { id: "patient-5" },
      update: {},
      create: {
        id: "patient-5",
        name: "Michael Brown",
        phone: "+1-555-1005",
        email: "michael.brown@email.com",
        dateOfBirth: new Date("2000-07-20"),
        gender: "Male",
        bloodGroup: "O-",
        address: "654 Maple Lane, Springfield",
        medicalHistory: "No significant medical history.",
      },
    }),
  ]);

  // Create sample appointments for today and recent days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await Promise.all([
    prisma.appointment.create({
      data: {
        patientId: "patient-1",
        doctorId: doctor.id,
        date: today,
        timeSlot: "09:00",
        status: "CONFIRMED",
        type: "IN_PERSON",
        priority: "NORMAL",
        symptoms: "Persistent headache for 3 days",
        createdBy: receptionist.id,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: "patient-2",
        doctorId: doctor.id,
        date: today,
        timeSlot: "09:30",
        status: "PENDING",
        type: "TELECONSULT",
        priority: "URGENT",
        symptoms: "High fever and body aches",
        createdBy: receptionist.id,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: "patient-3",
        doctorId: doctor.id,
        date: today,
        timeSlot: "10:00",
        status: "CONFIRMED",
        type: "IN_PERSON",
        priority: "NORMAL",
        symptoms: "Regular diabetes checkup",
        createdBy: receptionist.id,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: "patient-4",
        doctorId: doctor2.id,
        date: today,
        timeSlot: "10:00",
        status: "PENDING",
        type: "IN_PERSON",
        priority: "NORMAL",
        symptoms: "Annual physical examination",
        createdBy: receptionist.id,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: "patient-5",
        doctorId: doctor.id,
        date: today,
        timeSlot: "11:00",
        status: "CONFIRMED",
        type: "IN_PERSON",
        priority: "NORMAL",
        symptoms: "Sore throat and cough",
        createdBy: receptionist.id,
      },
    }),
    // Yesterday's appointments (completed)
    prisma.appointment.create({
      data: {
        patientId: "patient-1",
        doctorId: doctor.id,
        date: yesterday,
        timeSlot: "09:00",
        status: "COMPLETED",
        type: "IN_PERSON",
        priority: "NORMAL",
        symptoms: "Follow-up visit",
        prescription: "Continue existing medication. Follow up in 2 weeks.",
        createdBy: receptionist.id,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: "patient-2",
        doctorId: doctor.id,
        date: yesterday,
        timeSlot: "10:00",
        status: "COMPLETED",
        type: "IN_PERSON",
        priority: "NORMAL",
        symptoms: "Blood pressure check",
        prescription: "BP stable at 130/85. Continue Amlodipine 5mg.",
        createdBy: receptionist.id,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: "patient-3",
        doctorId: doctor.id,
        date: yesterday,
        timeSlot: "11:00",
        status: "CANCELLED",
        type: "IN_PERSON",
        priority: "NORMAL",
        symptoms: "Routine checkup",
        createdBy: receptionist.id,
      },
    }),
    // Tomorrow's appointment
    prisma.appointment.create({
      data: {
        patientId: "patient-4",
        doctorId: doctor2.id,
        date: tomorrow,
        timeSlot: "10:00",
        status: "CONFIRMED",
        type: "IN_PERSON",
        priority: "NORMAL",
        symptoms: "Vaccination",
        createdBy: receptionist.id,
      },
    }),
  ]);

  // Create notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: receptionist.id,
        title: "New Appointment Booked",
        message: "Appointment booked for John Doe with Dr. Michael Chen at 09:00",
        type: "BOOKING",
        link: "/dashboard/receptionist/appointments",
      },
    }),
    prisma.notification.create({
      data: {
        userId: doctorUser.id,
        title: "New Appointment",
        message: "You have a new appointment with John Doe at 09:00 today",
        type: "BOOKING",
        link: "/dashboard/doctor/schedule",
      },
    }),
    prisma.notification.create({
      data: {
        userId: doctorUser.id,
        title: "Urgent Appointment",
        message: "URGENT: Jane Smith has been booked at 09:30 with high fever symptoms",
        type: "BOOKING",
        link: "/dashboard/doctor/schedule",
      },
    }),
  ]);

  console.log("Seed completed!");
  console.log(`Receptionist: receptionist@clinic.com / password123`);
  console.log(`Doctor 1: doctor@clinic.com / password123`);
  console.log(`Doctor 2: dr.smith@clinic.com / password123`);
  console.log(`Patients: ${patients.length} created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
