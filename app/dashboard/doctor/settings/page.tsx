"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Link2,
  Link2Off,
  Copy,
  Bell,
  BellOff,
  ExternalLink,
  CheckCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

export default function DoctorSettings() {
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramReminders, setTelegramReminders] = useState(true);
  const [loading, setLoading] = useState(true);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [codeExpiry, setCodeExpiry] = useState<Date | null>(null);
  const [generating, setGenerating] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/telegram/unlink");
      const data = await res.json();
      setTelegramLinked(data.telegramLinked || false);
      setTelegramReminders(data.telegramReminders ?? true);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/telegram/generate-code", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setVerificationCode(data.code);
        setCodeExpiry(new Date(data.expiresAt));
        toast.success("Verification code generated!");

        // Also initialize the bot
        fetch("/api/telegram/init").catch(() => {});
      } else {
        toast.error(data.error || "Failed to generate code");
      }
    } catch {
      toast.error("Failed to generate code");
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(`/verify ${verificationCode}`);
      toast.success("Copied to clipboard!");
    }
  };

  const unlinkTelegram = async () => {
    setUnlinking(true);
    try {
      const res = await fetch("/api/telegram/unlink", { method: "DELETE" });
      if (res.ok) {
        setTelegramLinked(false);
        setVerificationCode(null);
        toast.success("Telegram disconnected");
      }
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setUnlinking(false);
    }
  };

  const toggleReminders = async () => {
    const newValue = !telegramReminders;
    setTelegramReminders(newValue);
    try {
      await fetch("/api/telegram/unlink", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramReminders: newValue }),
      });
      toast.success(`Reminders ${newValue ? "enabled" : "disabled"}`);
    } catch {
      setTelegramReminders(!newValue);
      toast.error("Failed to update");
    }
  };

  const isCodeExpired = codeExpiry ? new Date() > codeExpiry : false;

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-40 bg-white dark:bg-gray-900 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your notifications and integrations</p>
      </div>

      {/* Telegram Integration Card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            Telegram Integration
            {telegramLinked && (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ml-auto">
                <CheckCircle className="w-3 h-3 mr-1" /> Connected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {telegramLinked ? (
            /* Connected state */
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your Telegram account is connected. You receive appointment notifications directly in Telegram.
              </p>

              {/* Reminders toggle */}
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  {telegramReminders ? (
                    <Bell className="w-5 h-5 text-teal-600" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      30-Min Reminders
                    </p>
                    <p className="text-xs text-gray-500">
                      Get reminded before each appointment
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleReminders}
                  className={`w-11 h-6 rounded-full transition-colors ${
                    telegramReminders
                      ? "bg-teal-500"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      telegramReminders ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Bot link */}
              <a
                href="https://t.me/Mediflow123_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" /> Open @Mediflow123_bot
              </a>

              {/* Disconnect */}
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/10 w-full"
                onClick={unlinkTelegram}
                disabled={unlinking}
              >
                <Link2Off className="w-4 h-4 mr-2" />
                {unlinking ? "Disconnecting..." : "Disconnect Telegram"}
              </Button>
            </>
          ) : (
            /* Not connected state */
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect your Telegram account to receive appointment notifications, manage your schedule, and get daily summaries — all from Telegram.
              </p>

              {!verificationCode || isCodeExpired ? (
                /* Generate code button */
                <Button
                  onClick={generateCode}
                  disabled={generating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Connect Telegram
                    </>
                  )}
                </Button>
              ) : (
                /* Code display + instructions */
                <div className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Your Verification Code
                      </span>
                      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <Clock className="w-3 h-3" /> Expires in 10 min
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-center text-2xl font-mono font-bold tracking-[0.5em] text-blue-900 dark:text-blue-200 bg-white dark:bg-gray-800 rounded-lg py-3">
                        {verificationCode}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 text-blue-600"
                        onClick={copyCode}
                        title="Copy verify command"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                      <p className="font-medium">Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>
                          Open{" "}
                          <a
                            href="https://t.me/Mediflow123_bot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-medium"
                          >
                            @Mediflow123_bot
                          </a>{" "}
                          on Telegram
                        </li>
                        <li>
                          Send: <code className="bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded">/verify {verificationCode}</code>
                        </li>
                        <li>Wait for confirmation ✅</li>
                      </ol>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={generateCode}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> New Code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        fetchStatus();
                        toast.success("Status refreshed");
                      }}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" /> Check Status
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Features card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">What you&apos;ll get</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {[
              "🆕 New appointment alerts",
              "❌ Cancellation notifications",
              "🔄 Reschedule notifications",
              "🚨 Urgent appointment alerts",
              "☀️ Daily morning schedule summary",
              "⏰ 30-minute pre-appointment reminders",
              "📋 On-demand schedule with /today",
              "📊 Daily stats with /summary",
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
