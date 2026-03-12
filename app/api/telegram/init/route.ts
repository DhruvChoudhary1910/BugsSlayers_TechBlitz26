import { NextResponse } from "next/server";
import { initTelegramBot } from "@/lib/telegram";

// GET /api/telegram/init - initialize the Telegram bot
export async function GET() {
  try {
    const bot = initTelegramBot();
    if (bot) {
      return NextResponse.json({ status: "Bot initialized and polling" });
    }
    return NextResponse.json({ status: "Bot not initialized (no token)" }, { status: 400 });
  } catch (error) {
    console.error("Error initializing telegram bot:", error);
    return NextResponse.json({ error: "Failed to initialize bot" }, { status: 500 });
  }
}
