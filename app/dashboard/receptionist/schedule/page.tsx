"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatTime, getStatusColor, getPriorityColor, cn } from "@/lib/utils";
import { Printer, Check, X, Clock, Video, User } from "lucide-react";
import toast from "react-hot-toast";

export default function TodaysSchedule() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    setLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");
    const res = await fetch(`/api/appointments?date=${today}&limit=100`);
    const data = await res.json();
    setAppointments((data.appointments || []).sort((a: any, b: any) => a.timeSlot.localeCompare(b.timeSlot)));
    setLoading(false);
  };

  useEffect(() => { fetchSchedule(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success(`Status: ${status}`); fetchSchedule(); }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-white dark:bg-gray-900 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Group by time slot
  const grouped = appointments.reduce((acc: any, a: any) => {
    if (!acc[a.timeSlot]) acc[a.timeSlot] = [];
    acc[a.timeSlot].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Today&apos;s Schedule</h1>
          <p className="text-sm text-gray-500">{format(new Date(), "EEEE, MMMM dd, yyyy")} · {appointments.length} appointments</p>
        </div>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Print
        </Button>
      </div>

      {appointments.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No appointments scheduled for today</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([time, appts]: [string, any]) => (
            <div key={time} className="relative">
              {/* Time marker */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-900/20 px-3 py-1.5 rounded-full">
                  <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="text-sm font-semibold text-teal-700 dark:text-teal-400">{formatTime(time)}</span>
                </div>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
              </div>

              {/* Appointment cards */}
              <div className="space-y-2 ml-6">
                {appts.map((a: any) => (
                  <Card key={a.id} className={cn(
                    "border-0 shadow-sm transition-all hover:shadow-md",
                    a.priority === "URGENT" && "border-l-4 border-l-red-500",
                    a.status === "COMPLETED" && "opacity-60",
                    a.status === "CANCELLED" && "opacity-40"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                            {a.patient.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 dark:text-white">{a.patient.name}</p>
                              {a.priority === "URGENT" && (
                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px]">URGENT</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-2">
                              <User className="w-3 h-3" /> {a.doctor.user.name}
                              {a.type === "TELECONSULT" && <><Video className="w-3 h-3 text-blue-500" /> Teleconsult</>}
                            </p>
                            {a.symptoms && <p className="text-xs text-gray-400 mt-0.5">{a.symptoms}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(a.status)} text-[10px]`}>{a.status}</Badge>
                          {a.status === "PENDING" && (
                            <Button size="sm" variant="ghost" className="h-7 text-green-600" onClick={() => updateStatus(a.id, "CONFIRMED")}>
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {["PENDING", "CONFIRMED"].includes(a.status) && (
                            <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => updateStatus(a.id, "CANCELLED")}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
