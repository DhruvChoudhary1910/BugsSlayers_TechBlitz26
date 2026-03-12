"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Eye, FileText } from "lucide-react";
import { formatDate, formatTime, getStatusColor, getPriorityColor } from "@/lib/utils";
import toast from "react-hot-toast";

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showDetail, setShowDetail] = useState<any>(null);
  const [editPrescription, setEditPrescription] = useState(false);
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    const res = await fetch(`/api/appointments?${params}`);
    const data = await res.json();
    setAppointments(data.appointments || []);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const savePrescription = async () => {
    if (!showDetail) return;
    const res = await fetch(`/api/appointments/${showDetail.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prescription, notes }),
    });
    if (res.ok) {
      toast.success("Updated!");
      setEditPrescription(false);
      fetchAppointments();
      // Refresh detail
      const updated = await res.json();
      setShowDetail(updated);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Appointments</h1>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">No appointments found</TableCell>
                </TableRow>
              ) : (
                appointments.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{a.patient.name}</p>
                      <p className="text-xs text-gray-500">{a.symptoms || "—"}</p>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(a.date)}</TableCell>
                    <TableCell className="text-sm">{formatTime(a.timeSlot)}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{a.type === "IN_PERSON" ? "In-Person" : "Tele"}</Badge></TableCell>
                    <TableCell><Badge className={`${getStatusColor(a.status)} text-[10px]`}>{a.status}</Badge></TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                        setShowDetail(a);
                        setPrescription(a.prescription || "");
                        setNotes(a.notes || "");
                        setEditPrescription(false);
                      }}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Appointment Details</DialogTitle></DialogHeader>
          {showDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Patient:</span> <span className="font-medium">{showDetail.patient.name}</span></div>
                <div><span className="text-gray-500">Date:</span> {formatDate(showDetail.date)}</div>
                <div><span className="text-gray-500">Time:</span> {formatTime(showDetail.timeSlot)}</div>
                <div><span className="text-gray-500">Status:</span> <Badge className={getStatusColor(showDetail.status)}>{showDetail.status}</Badge></div>
              </div>
              {showDetail.symptoms && <div className="text-sm"><p className="text-gray-500 mb-1">Symptoms</p><p className="bg-gray-50 dark:bg-gray-800 p-2 rounded">{showDetail.symptoms}</p></div>}

              <div className="text-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-gray-500 font-medium">Prescription & Notes</p>
                  <Button size="sm" variant="ghost" onClick={() => setEditPrescription(!editPrescription)}>
                    <FileText className="w-3 h-3 mr-1" /> {editPrescription ? "Cancel" : "Edit"}
                  </Button>
                </div>
                {editPrescription ? (
                  <div className="space-y-2">
                    <textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder="Prescription..." className="w-full p-2 border rounded-lg text-sm resize-none h-24 bg-transparent" />
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." className="w-full p-2 border rounded-lg text-sm resize-none h-16 bg-transparent" />
                    <Button size="sm" onClick={savePrescription} className="bg-teal-600 hover:bg-teal-700 text-white">Save</Button>
                  </div>
                ) : (
                  <>
                    {showDetail.prescription ? (
                      <p className="bg-green-50 dark:bg-green-900/10 p-2 rounded">{showDetail.prescription}</p>
                    ) : (
                      <p className="text-gray-400 italic">No prescription yet</p>
                    )}
                    {showDetail.notes && <p className="bg-gray-50 dark:bg-gray-800 p-2 rounded mt-2">{showDetail.notes}</p>}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
