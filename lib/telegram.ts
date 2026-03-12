import TelegramBot from "node-telegram-bot-api";
import prisma from "@/lib/prisma";
import { format, formatDistanceToNow } from "date-fns";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

let bot: TelegramBot | null = null;
let schedulerInterval: ReturnType<typeof setInterval> | null = null;

// ─── Helpers ──────────────────────────────────────────────────

function formatTimeSlot(slot: string): string {
  const [h, m] = slot.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${period}`;
}

function statusEmoji(status: string): string {
  switch (status) {
    case "PENDING": return "🟡";
    case "CONFIRMED": return "🟢";
    case "CANCELLED": return "🔴";
    case "COMPLETED": return "✅";
    case "NO_SHOW": return "🚫";
    default: return "⚪";
  }
}

async function getDoctorByChatId(chatId: number) {
  return prisma.doctor.findFirst({
    where: { telegramChatId: String(chatId), telegramLinked: true },
    include: { user: true },
  });
}

// ─── sendTelegramMessage (exported for use in API routes) ───

export async function sendTelegramMessage(chatId: string, message: string): Promise<void> {
  try {
    if (!bot) return;
    await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (error) {
    console.error("[Telegram] Failed to send message:", error);
  }
}

// ─── Notify helpers for appointment events ──────────────────

export async function notifyNewBooking(appointment: any): Promise<void> {
  const doctor = await prisma.doctor.findUnique({ where: { id: appointment.doctorId } });
  if (!doctor?.telegramLinked || !doctor.telegramChatId) return;

  const isUrgent = appointment.priority === "URGENT";
  const header = isUrgent ? "🚨 <b>URGENT Appointment Booked!</b>" : "🆕 <b>New Appointment Booked!</b>";
  const dateStr = format(new Date(appointment.date), "dd MMM yyyy");

  const msg = `${header}

👤 Patient: ${appointment.patient?.name || "Unknown"}
📅 Date: ${dateStr}
⏰ Time: ${formatTimeSlot(appointment.timeSlot)}
🏥 Type: ${appointment.type === "IN_PERSON" ? "In-Person" : "Teleconsult"}
⚡ Priority: ${appointment.priority}
${appointment.symptoms ? `🤒 Symptoms: ${appointment.symptoms}` : ""}

Appointment ID: <code>${appointment.id.slice(-8)}</code>`;

  sendTelegramMessage(doctor.telegramChatId, msg);
}

export async function notifyCancellation(appointment: any): Promise<void> {
  const doctor = await prisma.doctor.findUnique({ where: { id: appointment.doctorId } });
  if (!doctor?.telegramLinked || !doctor.telegramChatId) return;

  const dateStr = format(new Date(appointment.date), "dd MMM yyyy");
  const msg = `❌ <b>Appointment Cancelled</b>

👤 Patient: ${appointment.patient?.name || "Unknown"}
📅 Date: ${dateStr}
⏰ Time: ${formatTimeSlot(appointment.timeSlot)}

Your ${formatTimeSlot(appointment.timeSlot)} slot is now free.`;

  sendTelegramMessage(doctor.telegramChatId, msg);
}

export async function notifyReschedule(
  appointment: any,
  oldDate: Date,
  oldTimeSlot: string
): Promise<void> {
  const doctor = await prisma.doctor.findUnique({ where: { id: appointment.doctorId } });
  if (!doctor?.telegramLinked || !doctor.telegramChatId) return;

  const msg = `🔄 <b>Appointment Rescheduled</b>

👤 Patient: ${appointment.patient?.name || "Unknown"}
📅 Old: ${format(oldDate, "dd MMM")}, ${formatTimeSlot(oldTimeSlot)}
📅 New: ${format(new Date(appointment.date), "dd MMM")}, ${formatTimeSlot(appointment.timeSlot)}
Type: ${appointment.type === "IN_PERSON" ? "In-Person" : "Teleconsult"}`;

  sendTelegramMessage(doctor.telegramChatId, msg);
}

// ─── Bot commands ───────────────────────────────────────────

function setupCommands() {
  if (!bot) return;

  // /start
  bot.onText(/\/start/, (msg) => {
    bot!.sendMessage(
      msg.chat.id,
      `🏥 <b>Welcome to MediFlow Clinic Bot!</b>

I can help you manage your appointments and get notifications right here in Telegram.

To get started, link your doctor account:
1️⃣ Go to your MediFlow dashboard → Settings
2️⃣ Click "Connect Telegram"
3️⃣ Send me the verification code: <code>/verify YOUR_CODE</code>

Type /help to see all available commands.`,
      { parse_mode: "HTML" }
    );
  });

  // /verify CODE
  bot.onText(/\/verify\s+(\S+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const code = match?.[1];
    if (!code) {
      bot!.sendMessage(chatId, "Please provide a code: /verify YOUR_CODE");
      return;
    }

    try {
      const session = await prisma.telegramSession.findFirst({
        where: {
          verificationCode: code,
          verified: false,
          expiresAt: { gt: new Date() },
        },
        include: { doctor: { include: { user: true } } },
      });

      if (!session) {
        bot!.sendMessage(chatId, "❌ Invalid or expired code. Please generate a new one from your dashboard.");
        return;
      }

      // Link the account
      await prisma.doctor.update({
        where: { id: session.doctorId },
        data: { telegramChatId: String(chatId), telegramLinked: true },
      });
      await prisma.telegramSession.update({
        where: { id: session.id },
        data: { verified: true },
      });

      bot!.sendMessage(
        chatId,
        `✅ <b>Successfully linked!</b>\n\nYou will now receive appointment notifications, Dr. ${session.doctor.user.name}.\n\nType /help to see available commands.`,
        { parse_mode: "HTML" }
      );
    } catch (error) {
      console.error("[Telegram] Verify error:", error);
      bot!.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  });

  // /today
  bot.onText(/\/today/, async (msg) => {
    const doctor = await getDoctorByChatId(msg.chat.id);
    if (!doctor) { bot!.sendMessage(msg.chat.id, "❌ Account not linked. Use /verify CODE first."); return; }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id, date: { gte: today, lt: tomorrow }, status: { not: "CANCELLED" } },
      include: { patient: true },
      orderBy: { timeSlot: "asc" },
    });

    if (appointments.length === 0) {
      bot!.sendMessage(msg.chat.id, `📅 <b>Today's Schedule — ${format(today, "dd MMM yyyy")}</b>\n\nNo appointments for today! 🎉`, { parse_mode: "HTML" });
      return;
    }

    const lines = appointments.map((a, i) => {
      const urgentMark = a.priority === "URGENT" ? " 🔴 Urgent" : "";
      return `${i + 1}. ${formatTimeSlot(a.timeSlot)} — ${a.patient.name} (${a.type === "IN_PERSON" ? "In-Person" : "Teleconsult"}) ${statusEmoji(a.status)} ${a.status}${urgentMark}`;
    });

    bot!.sendMessage(
      msg.chat.id,
      `📅 <b>Today's Schedule — ${format(today, "dd MMM yyyy")}</b>\n\n${lines.join("\n")}\n\nTotal: ${appointments.length} appointments`,
      { parse_mode: "HTML" }
    );
  });

  // /upcoming
  bot.onText(/\/upcoming/, async (msg) => {
    const doctor = await getDoctorByChatId(msg.chat.id);
    if (!doctor) { bot!.sendMessage(msg.chat.id, "❌ Account not linked."); return; }

    const now = new Date();
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id, date: { gte: now }, status: { in: ["PENDING", "CONFIRMED"] } },
      include: { patient: true },
      orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      take: 5,
    });

    if (appointments.length === 0) {
      bot!.sendMessage(msg.chat.id, "📋 No upcoming appointments!");
      return;
    }

    const lines = appointments.map((a, i) =>
      `${i + 1}. ${format(new Date(a.date), "dd MMM")} ${formatTimeSlot(a.timeSlot)} — ${a.patient.name} (${a.type === "IN_PERSON" ? "In-Person" : "Tele"}) ${statusEmoji(a.status)} ${a.status}`
    );

    bot!.sendMessage(msg.chat.id, `📋 <b>Upcoming Appointments</b>\n\n${lines.join("\n")}`, { parse_mode: "HTML" });
  });

  // /summary
  bot.onText(/\/summary/, async (msg) => {
    const doctor = await getDoctorByChatId(msg.chat.id);
    if (!doctor) { bot!.sendMessage(msg.chat.id, "❌ Account not linked."); return; }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [completed, pending, cancelled, noShow] = await Promise.all([
      prisma.appointment.count({ where: { doctorId: doctor.id, status: "COMPLETED", date: { gte: today, lt: tomorrow } } }),
      prisma.appointment.count({ where: { doctorId: doctor.id, status: { in: ["PENDING", "CONFIRMED"] }, date: { gte: today, lt: tomorrow } } }),
      prisma.appointment.count({ where: { doctorId: doctor.id, status: "CANCELLED", date: { gte: today, lt: tomorrow } } }),
      prisma.appointment.count({ where: { doctorId: doctor.id, status: "NO_SHOW", date: { gte: today, lt: tomorrow } } }),
    ]);

    const earnings = completed * doctor.consultationFee;

    bot!.sendMessage(
      msg.chat.id,
      `📊 <b>Summary for ${format(today, "dd MMM yyyy")}</b>

✅ Completed: ${completed}
⏳ Pending: ${pending}
❌ Cancelled: ${cancelled}
🚫 No-show: ${noShow}

Total patients seen: ${completed}
💰 Earnings today: ₹${earnings.toLocaleString()}`,
      { parse_mode: "HTML" }
    );
  });

  // /patients
  bot.onText(/\/patients/, async (msg) => {
    const doctor = await getDoctorByChatId(msg.chat.id);
    if (!doctor) { bot!.sendMessage(msg.chat.id, "❌ Account not linked."); return; }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const [monthlyCount, weeklyNew] = await Promise.all([
      prisma.appointment.findMany({
        where: { doctorId: doctor.id, date: { gte: monthStart } },
        select: { patientId: true },
        distinct: ["patientId"],
      }),
      prisma.appointment.findMany({
        where: { doctorId: doctor.id, date: { gte: weekStart } },
        select: { patientId: true },
        distinct: ["patientId"],
      }),
    ]);

    bot!.sendMessage(
      msg.chat.id,
      `👥 <b>Patient Stats</b>\n\nPatients this month: ${monthlyCount.length}\nNew patients this week: ${weeklyNew.length}`,
      { parse_mode: "HTML" }
    );
  });

  // /next
  bot.onText(/\/next/, async (msg) => {
    const doctor = await getDoctorByChatId(msg.chat.id);
    if (!doctor) { bot!.sendMessage(msg.chat.id, "❌ Account not linked."); return; }

    const now = new Date();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    // Find next appointment today that hasn't started yet
    const allToday = await prisma.appointment.findMany({
      where: { doctorId: doctor.id, date: { gte: today, lt: tomorrow }, status: { in: ["PENDING", "CONFIRMED"] } },
      include: { patient: true },
      orderBy: { timeSlot: "asc" },
    });

    const next = allToday.find((a) => {
      const [h, m] = a.timeSlot.split(":").map(Number);
      const slotTime = new Date(now); slotTime.setHours(h, m, 0, 0);
      return slotTime > now;
    }) || (allToday.length > 0 ? allToday[0] : null);

    if (!next) {
      // Try upcoming dates
      const upcoming = await prisma.appointment.findFirst({
        where: { doctorId: doctor.id, date: { gt: today }, status: { in: ["PENDING", "CONFIRMED"] } },
        include: { patient: true },
        orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      });
      if (!upcoming) { bot!.sendMessage(msg.chat.id, "✨ No upcoming appointments!"); return; }

      bot!.sendMessage(
        msg.chat.id,
        `⏰ <b>Next Appointment</b>

👤 Patient: ${upcoming.patient.name}
📅 Date: ${format(new Date(upcoming.date), "dd MMM yyyy")}
⏰ Time: ${formatTimeSlot(upcoming.timeSlot)}
🏥 Type: ${upcoming.type === "IN_PERSON" ? "In-Person" : "Teleconsult"}
${upcoming.symptoms ? `🤒 Symptoms: ${upcoming.symptoms}` : ""}
${upcoming.priority === "URGENT" ? "⚡ Priority: 🔴 Urgent" : ""}`,
        { parse_mode: "HTML" }
      );
      return;
    }

    const [h, m] = next.timeSlot.split(":").map(Number);
    const slotTime = new Date(now); slotTime.setHours(h, m, 0, 0);
    const timeUntil = formatDistanceToNow(slotTime, { addSuffix: true });

    bot!.sendMessage(
      msg.chat.id,
      `⏰ <b>Next Appointment</b>

👤 Patient: ${next.patient.name}
⏰ Time: ${formatTimeSlot(next.timeSlot)} (${timeUntil})
🏥 Type: ${next.type === "IN_PERSON" ? "In-Person" : "Teleconsult"}
${next.symptoms ? `🤒 Symptoms: ${next.symptoms}` : ""}
${next.priority === "URGENT" ? "⚡ Priority: 🔴 Urgent" : ""}`,
      { parse_mode: "HTML" }
    );
  });

  // /cancel - show cancellable appointments
  const cancelState = new Map<number, any[]>();

  bot.onText(/\/cancel/, async (msg) => {
    const doctor = await getDoctorByChatId(msg.chat.id);
    if (!doctor) { bot!.sendMessage(msg.chat.id, "❌ Account not linked."); return; }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const pending = await prisma.appointment.findMany({
      where: { doctorId: doctor.id, date: { gte: today, lt: tomorrow }, status: { in: ["PENDING", "CONFIRMED"] } },
      include: { patient: true },
      orderBy: { timeSlot: "asc" },
    });

    if (pending.length === 0) {
      bot!.sendMessage(msg.chat.id, "No cancellable appointments today.");
      return;
    }

    cancelState.set(msg.chat.id, pending);
    const lines = pending.map((a, i) => `${i + 1}. ${formatTimeSlot(a.timeSlot)} — ${a.patient.name}`);
    bot!.sendMessage(
      msg.chat.id,
      `Select an appointment to cancel:\n\n${lines.join("\n")}\n\nReply with the number (1-${pending.length}):`,
    );
  });

  // Handle cancel reply
  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith("/")) return;
    const chatId = msg.chat.id;
    const pending = cancelState.get(chatId);
    if (!pending) return;

    const num = parseInt(msg.text.trim());
    if (isNaN(num) || num < 1 || num > pending.length) {
      bot!.sendMessage(chatId, `Please enter a number between 1 and ${pending.length}`);
      return;
    }

    const appt = pending[num - 1];
    await prisma.appointment.update({ where: { id: appt.id }, data: { status: "CANCELLED" } });
    cancelState.delete(chatId);
    bot!.sendMessage(chatId, `✅ Cancelled appointment for ${appt.patient.name} at ${formatTimeSlot(appt.timeSlot)}`);
  });

  // /reminders on|off
  bot.onText(/\/reminders\s*(on|off)?/i, async (msg, match) => {
    const doctor = await getDoctorByChatId(msg.chat.id);
    if (!doctor) { bot!.sendMessage(msg.chat.id, "❌ Account not linked."); return; }

    const toggle = match?.[1]?.toLowerCase();
    if (!toggle) {
      const status = doctor.telegramReminders ? "ON ✅" : "OFF ❌";
      bot!.sendMessage(msg.chat.id, `Reminders are currently: ${status}\n\nUse /reminders on or /reminders off`);
      return;
    }

    const enabled = toggle === "on";
    await prisma.doctor.update({ where: { id: doctor.id }, data: { telegramReminders: enabled } });
    bot!.sendMessage(msg.chat.id, `${enabled ? "✅" : "❌"} Reminders turned ${toggle.toUpperCase()}`);
  });

  // /unlink
  bot.onText(/\/unlink/, async (msg) => {
    const doctor = await getDoctorByChatId(msg.chat.id);
    if (!doctor) { bot!.sendMessage(msg.chat.id, "Account is not linked."); return; }

    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { telegramChatId: null, telegramLinked: false },
    });
    bot!.sendMessage(msg.chat.id, "🔓 Telegram account unlinked. You will no longer receive notifications.");
  });

  // /help
  bot.onText(/\/help/, (msg) => {
    bot!.sendMessage(
      msg.chat.id,
      `🏥 <b>MediFlow Bot Commands</b>

📋 <b>Schedule</b>
/today — Today's full schedule
/upcoming — Next 5 upcoming appointments
/next — Very next appointment
/summary — Daily stats summary
/patients — Patient stats

🔧 <b>Management</b>
/cancel — Cancel an appointment
/reminders on|off — Toggle reminders

🔗 <b>Account</b>
/verify CODE — Link your account
/unlink — Disconnect Telegram
/help — Show this help`,
      { parse_mode: "HTML" }
    );
  });
}

// ─── Scheduler (30-min reminders + 8 AM summary) ───────────

async function runScheduler() {
  try {
    if (!bot) return;

    const now = new Date();

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        status: { in: ["PENDING", "CONFIRMED"] },
        reminderSent: false,
      },
      include: { patient: true, doctor: true },
    });

    for (const appt of upcomingAppointments) {
      const [h, m] = appt.timeSlot.split(":").map(Number);
      const apptTime = new Date(today); apptTime.setHours(h, m, 0, 0);

      // Check if appointment is ~30 mins away
      const diff = apptTime.getTime() - now.getTime();
      if (diff > 0 && diff <= 31 * 60 * 1000 && diff >= 29 * 60 * 1000) {
        if (appt.doctor.telegramLinked && appt.doctor.telegramChatId && appt.doctor.telegramReminders) {
          await sendTelegramMessage(
            appt.doctor.telegramChatId,
            `⏰ <b>Appointment Reminder</b>

Next patient in 30 minutes:
👤 ${appt.patient.name}
⏰ ${formatTimeSlot(appt.timeSlot)}
🏥 ${appt.type === "IN_PERSON" ? "In-Person" : "Teleconsult"}
${appt.symptoms ? `🤒 Symptoms: ${appt.symptoms}` : ""}`
          );
          await prisma.appointment.update({
            where: { id: appt.id },
            data: { reminderSent: true },
          });
        }
      }
    }

    // 8 AM morning summary (check between 8:00 and 8:01)
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours === 8 && minutes === 0) {
      const doctors = await prisma.doctor.findMany({
        where: { telegramLinked: true, telegramChatId: { not: null } },
        include: { user: true },
      });

      for (const doctor of doctors) {
        const todayAppts = await prisma.appointment.findMany({
          where: { doctorId: doctor.id, date: { gte: today, lt: tomorrow }, status: { not: "CANCELLED" } },
          orderBy: { timeSlot: "asc" },
        });

        if (todayAppts.length === 0) continue;

        const urgentCount = todayAppts.filter((a) => a.priority === "URGENT").length;
        const normalCount = todayAppts.length - urgentCount;
        const firstTime = formatTimeSlot(todayAppts[0].timeSlot);

        await sendTelegramMessage(
          doctor.telegramChatId!,
          `☀️ <b>Good Morning Dr. ${doctor.user.name}!</b>

Here's your schedule for today:

Total appointments: ${todayAppts.length}
${urgentCount > 0 ? `🔴 Urgent: ${urgentCount}\n` : ""}📋 Normal: ${normalCount}

First appointment at: ${firstTime}

Reply /today for full details.`
        );
      }
    }
  } catch (error) {
    console.error("[Telegram Scheduler] Error:", error);
  }
}

// ─── Initialize bot ─────────────────────────────────────────

export function initTelegramBot(): TelegramBot | null {
  if (bot) return bot;
  if (!BOT_TOKEN) {
    console.warn("[Telegram] No TELEGRAM_BOT_TOKEN set, skipping bot init.");
    return null;
  }

  try {
    bot = new TelegramBot(BOT_TOKEN, { polling: true });
    console.log("[Telegram] Bot started with polling.");

    setupCommands();

    // Start scheduler: check every minute
    if (!schedulerInterval) {
      schedulerInterval = setInterval(runScheduler, 60_000);
      console.log("[Telegram] Scheduler started (60s interval).");
    }

    // Handle errors gracefully
    bot.on("polling_error", (error) => {
      console.error("[Telegram] Polling error:", error.message);
    });

    return bot;
  } catch (error) {
    console.error("[Telegram] Failed to init bot:", error);
    return null;
  }
}

export function getTelegramBot(): TelegramBot | null {
  return bot;
}
