"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { formatTime, getStatusColor, getPriorityColor, cn, getAge } from "@/lib/utils";
import { Clock, Check, X, FileText, User, Video, Stethoscope, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function DoctorSchedule() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrescription, setShowPrescription] = useState<any>(null);
  const [prescription, setPrescription] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

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
    if (res.ok) { toast.success(`Marked as ${status}`); fetchSchedule(); }
  };

  const savePrescription = async () => {
    if (!showPrescription) return;
    const res = await fetch(`/api/appointments/${showPrescription.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prescription,
        notes: prescriptionNotes,
        followUpDate: followUpDate || null,
        status: "COMPLETED",
      }),
    });
    if (res.ok) {
      toast.success("Prescription saved & appointment completed");
      setShowPrescription(null);
      fetchSchedule();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-white dark:bg-gray-900 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Today&apos;s Schedule</h1>
        <p className="text-sm text-gray-500">{format(new Date(), "EEEE, MMMM dd, yyyy")} · {appointments.length} patients</p>
      </div>

      {appointments.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center text-gray-500">
            <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No appointments for today</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((a: any, index: number) => (
            <Card key={a.id} className={cn(
              "border-0 shadow-sm transition-all hover:shadow-md",
              a.priority === "URGENT" && "border-l-4 border-l-red-500",
              a.status === "COMPLETED" && "opacity-60",
              a.status === "CANCELLED" && "opacity-40"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Time */}
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-teal-600 dark:text-teal-400">{formatTime(a.timeSlot)}</p>
                      <p className="text-[10px] text-gray-400">#{index + 1}</p>
                    </div>

                    {/* Patient info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">{a.patient.name}</p>
                        {a.patient.dateOfBirth && (
                          <span className="text-xs text-gray-500">{getAge(a.patient.dateOfBirth)} yrs</span>
                        )}
                        {a.priority === "URGENT" && (
                          <Badge className="bg-red-100 text-red-700 text-[10px]"><AlertTriangle className="w-3 h-3 mr-0.5" /> URGENT</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        {a.type === "TELECONSULT" ? (
                          <span className="flex items-center gap-1"><Video className="w-3 h-3 text-blue-500" /> Teleconsult</span>
                        ) : (
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> In-Person</span>
                        )}
                        {a.patient.bloodGroup && <span>· {a.patient.bloodGroup}</span>}
                      </div>
                      {a.symptoms && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-2 py-1">
                          {a.symptoms}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`${getStatusColor(a.status)} text-[10px]`}>{a.status}</Badge>
                    {["PENDING", "CONFIRMED"].includes(a.status) && (
                      <>
                        <Button size="sm" variant="outline" className="h-8 text-green-600 border-green-200 dark:border-green-800" onClick={() => {
                          setShowPrescription(a);
                          setPrescription(a.prescription || "");
                          setPrescriptionNotes(a.notes || "");
                          setFollowUpDate("");
                        }}>
                          <FileText className="w-3 h-3 mr-1" /> Complete
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-gray-500" onClick={() => updateStatus(a.id, "NO_SHOW")}>
                          No-Show
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Prescription Dialog */}
      <Dialog open={!!showPrescription} onOpenChange={() => setShowPrescription(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Appointment</DialogTitle>
          </DialogHeader>
          {showPrescription && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="font-medium">{showPrescription.patient.name}</p>
                <p className="text-sm text-gray-500">{showPrescription.symptoms || "No symptoms recorded"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Prescription</label>
                <textarea
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder="Write prescription details..."
                  className="w-full p-3 border rounded-lg text-sm resize-none h-28 bg-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Notes</label>
                <textarea
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className="w-full p-3 border rounded-lg text-sm resize-none h-20 bg-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Follow-up Date (optional)</label>
                <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
              </div>
              <Button onClick={savePrescription} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                Save & Complete
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
