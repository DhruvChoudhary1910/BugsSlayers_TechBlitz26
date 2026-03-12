"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Clock, Save, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AvailabilityPage() {
  const { data: session } = useSession();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState(30);
  const [isAvailable, setIsAvailable] = useState(true);
  const [fee, setFee] = useState(500);
  const [leaveDates, setLeaveDates] = useState<Date[]>([]);
  const [leaveReason, setLeaveReason] = useState("");
  const [selectedLeaveDate, setSelectedLeaveDate] = useState<Date | undefined>();

  const fetchAvailability = async () => {
    if (!session?.user?.doctorId) return;
    const res = await fetch(`/api/doctors/${session.user.doctorId}/availability`);
    const data = await res.json();
    setDoctor(data);
    setWorkingDays(JSON.parse(data.workingDays || "[]"));
    setStartTime(data.workingHoursStart);
    setEndTime(data.workingHoursEnd);
    setSlotDuration(data.slotDurationMins);
    setIsAvailable(data.isAvailable);
    setFee(data.consultationFee);
    setLeaveDates(data.leaves?.map((l: any) => new Date(l.date)) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAvailability(); }, [session]);

  const toggleDay = (day: number) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    if (!session?.user?.doctorId) return;
    setSaving(true);
    const res = await fetch(`/api/doctors/${session.user.doctorId}/availability`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workingDays,
        workingHoursStart: startTime,
        workingHoursEnd: endTime,
        slotDurationMins: slotDuration,
        isAvailable,
        consultationFee: fee,
      }),
    });
    if (res.ok) {
      toast.success("Availability updated!");
    } else {
      toast.error("Failed to update");
    }
    setSaving(false);
  };

  const addLeave = async () => {
    if (!selectedLeaveDate || !session?.user?.doctorId) return;
    const res = await fetch(`/api/doctors/${session.user.doctorId}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: format(selectedLeaveDate, "yyyy-MM-dd"), reason: leaveReason }),
    });
    if (res.ok) {
      toast.success("Leave added");
      setSelectedLeaveDate(undefined);
      setLeaveReason("");
      fetchAvailability();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to add leave");
    }
  };

  const removeLeave = async (date: Date) => {
    if (!session?.user?.doctorId) return;
    await fetch(`/api/doctors/${session.user.doctorId}/leave?date=${format(date, "yyyy-MM-dd")}`, { method: "DELETE" });
    toast.success("Leave removed");
    fetchAvailability();
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-white dark:bg-gray-900 rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Availability Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your working schedule and leave dates</p>
      </div>

      {/* Toggle availability */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Accepting Appointments</p>
              <p className="text-sm text-gray-500">When off, no new bookings can be made</p>
            </div>
            <button
              onClick={() => setIsAvailable(!isAvailable)}
              className={`w-12 h-6 rounded-full transition-colors ${isAvailable ? "bg-teal-500" : "bg-gray-300 dark:bg-gray-700"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${isAvailable ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Working days */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Working Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {DAYS.map((day, i) => (
              <button
                key={day}
                onClick={() => toggleDay(i)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  workingDays.includes(i)
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Working hours & slot */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Working Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Start Time</label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">End Time</label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Slot Duration</label>
              <Select value={String(slotDuration)} onValueChange={(v) => setSlotDuration(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[15, 20, 30, 45, 60].map((m) => (
                    <SelectItem key={m} value={String(m)}>{m} minutes</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Consultation Fee (₹)</label>
              <Input type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white w-full">
        <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Settings"}
      </Button>

      {/* Leave dates */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Leave Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Calendar
              mode="single"
              selected={selectedLeaveDate}
              onSelect={(d) => setSelectedLeaveDate(d as Date)}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-xl border"
            />
            <div className="flex-1 space-y-3">
              <Input placeholder="Reason (optional)" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} />
              <Button disabled={!selectedLeaveDate} onClick={addLeave} className="w-full bg-teal-600 hover:bg-teal-700 text-white">Add Leave</Button>

              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upcoming Leaves</p>
                {leaveDates.filter((d) => d >= new Date(new Date().setHours(0, 0, 0, 0))).length === 0 ? (
                  <p className="text-sm text-gray-400">No upcoming leaves</p>
                ) : (
                  leaveDates
                    .filter((d) => d >= new Date(new Date().setHours(0, 0, 0, 0)))
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((d) => (
                      <div key={d.toISOString()} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
                        <span className="text-sm">{format(d, "MMM dd, yyyy")}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => removeLeave(d)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
