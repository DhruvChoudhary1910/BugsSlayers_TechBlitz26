"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  Filter,
  Download,
  Eye,
  Check,
  X,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { formatDate, formatTime, getStatusColor, getPriorityColor, cn, exportToCSV } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [doctorFilter, setDoctorFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showReschedule, setShowReschedule] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [slots, setSlots] = useState<any>({ availableSlots: [], allSlots: [], bookedSlots: [] });
  const [showDetail, setShowDetail] = useState<any>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (search) params.set("search", search);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (doctorFilter !== "ALL") params.set("doctorId", doctorFilter);
    if (typeFilter !== "ALL") params.set("type", typeFilter);
    if (priorityFilter !== "ALL") params.set("priority", priorityFilter);

    const res = await fetch(`/api/appointments?${params}`);
    const data = await res.json();
    setAppointments(data.appointments || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, search, statusFilter, doctorFilter, typeFilter, priorityFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
  useEffect(() => { fetch("/api/doctors").then((r) => r.json()).then(setDoctors); }, []);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Appointment ${status.toLowerCase()}`);
      fetchAppointments();
    } else {
      toast.error("Failed to update");
    }
  };

  const bulkAction = async (status: string) => {
    const promises = Array.from(selected).map((id) =>
      fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
    );
    await Promise.all(promises);
    toast.success(`${selected.size} appointments updated`);
    setSelected(new Set());
    fetchAppointments();
  };

  const handleReschedule = async () => {
    if (!showReschedule || !rescheduleDate || !rescheduleSlot) return;
    const res = await fetch(`/api/appointments/${showReschedule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: format(rescheduleDate, "yyyy-MM-dd"), timeSlot: rescheduleSlot }),
    });
    if (res.ok) {
      toast.success("Appointment rescheduled");
      setShowReschedule(null);
      fetchAppointments();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to reschedule");
    }
  };

  useEffect(() => {
    if (showReschedule && rescheduleDate) {
      fetch(`/api/appointments/available-slots?doctorId=${showReschedule.doctorId}&date=${format(rescheduleDate, "yyyy-MM-dd")}`)
        .then((r) => r.json()).then(setSlots);
    }
  }, [showReschedule, rescheduleDate]);

  const handleExport = () => {
    const csvData = appointments.map((a: any) => ({
      Patient: a.patient.name,
      Phone: a.patient.phone,
      Doctor: a.doctor.user.name,
      Date: formatDate(a.date),
      Time: a.timeSlot,
      Type: a.type,
      Priority: a.priority,
      Status: a.status,
      Symptoms: a.symptoms || "",
    }));
    exportToCSV(csvData, `appointments_${format(new Date(), "yyyy-MM-dd")}`);
    toast.success("Exported to CSV");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Appointments</h1>
          <p className="text-sm text-gray-500">{total} total appointments</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search patient..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                {["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={doctorFilter} onValueChange={(v) => { setDoctorFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Doctor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Doctors</SelectItem>
                {doctors.map((d: any) => (
                  <SelectItem key={d.id} value={d.id}>{d.user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="IN_PERSON">In-Person</SelectItem>
                <SelectItem value="TELECONSULT">Teleconsult</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-teal-50 dark:bg-teal-900/20 p-3 rounded-xl">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulkAction("CONFIRMED")} className="text-green-600 border-green-200">
            <Check className="w-3 h-3 mr-1" /> Confirm
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("CANCELLED")} className="text-red-600 border-red-200">
            <X className="w-3 h-3 mr-1" /> Cancel
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === appointments.length && appointments.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelected(new Set(appointments.map((a: any) => a.id)));
                      else setSelected(new Set());
                    }}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">No appointments found</TableCell>
                </TableRow>
              ) : (
                appointments.map((a: any) => (
                  <TableRow key={a.id} className={a.priority === "URGENT" ? "bg-red-50/50 dark:bg-red-900/5" : ""}>
                    <TableCell>
                      <input type="checkbox" checked={selected.has(a.id)} onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(a.id); else next.delete(a.id);
                        setSelected(next);
                      }} className="rounded" />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{a.patient.name}</p>
                        <p className="text-xs text-gray-500">{a.patient.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{a.doctor.user.name}</TableCell>
                    <TableCell className="text-sm">{formatDate(a.date)}</TableCell>
                    <TableCell className="text-sm font-medium">{formatTime(a.timeSlot)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{a.type === "IN_PERSON" ? "In-Person" : "Tele"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getPriorityColor(a.priority)} text-[10px]`}>{a.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(a.status)} text-[10px]`}>{a.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowDetail(a)} title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {a.status === "PENDING" && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => updateStatus(a.id, "CONFIRMED")} title="Confirm">
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {["PENDING", "CONFIRMED"].includes(a.status) && (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => updateStatus(a.id, "CANCELLED")} title="Cancel">
                              <X className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" onClick={() => setShowReschedule(a)} title="Reschedule">
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        {a.status === "CONFIRMED" && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-600" onClick={() => updateStatus(a.id, "NO_SHOW")} title="No-Show">
                            <Clock className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Appointment Details</DialogTitle></DialogHeader>
          {showDetail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Patient:</span> <span className="font-medium">{showDetail.patient.name}</span></div>
                <div><span className="text-gray-500">Phone:</span> {showDetail.patient.phone}</div>
                <div><span className="text-gray-500">Doctor:</span> {showDetail.doctor.user.name}</div>
                <div><span className="text-gray-500">Date:</span> {formatDate(showDetail.date)}</div>
                <div><span className="text-gray-500">Time:</span> {formatTime(showDetail.timeSlot)}</div>
                <div><span className="text-gray-500">Status:</span> <Badge className={getStatusColor(showDetail.status)}>{showDetail.status}</Badge></div>
                <div><span className="text-gray-500">Type:</span> {showDetail.type}</div>
                <div><span className="text-gray-500">Priority:</span> <Badge className={getPriorityColor(showDetail.priority)}>{showDetail.priority}</Badge></div>
              </div>
              {showDetail.symptoms && <div className="text-sm"><span className="text-gray-500">Symptoms:</span><p className="mt-1">{showDetail.symptoms}</p></div>}
              {showDetail.prescription && <div className="text-sm"><span className="text-gray-500">Prescription:</span><p className="mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded">{showDetail.prescription}</p></div>}
              {showDetail.notes && <div className="text-sm"><span className="text-gray-500">Notes:</span><p className="mt-1">{showDetail.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!showReschedule} onOpenChange={() => setShowReschedule(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Reschedule Appointment</DialogTitle></DialogHeader>
          {showReschedule && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Rescheduling for <strong>{showReschedule.patient.name}</strong> with <strong>{showReschedule.doctor.user.name}</strong>
              </p>
              <Calendar
                mode="single"
                selected={rescheduleDate}
                onSelect={(d) => { setRescheduleDate(d as Date); setRescheduleSlot(""); }}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-xl border mx-auto"
              />
              {rescheduleDate && (
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {slots.availableSlots?.map((slot: string) => (
                    <button
                      key={slot}
                      onClick={() => setRescheduleSlot(slot)}
                      className={cn(
                        "p-2 rounded-lg text-sm font-medium transition-all",
                        rescheduleSlot === slot ? "bg-teal-500 text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-teal-50"
                      )}
                    >
                      {formatTime(slot)}
                    </button>
                  ))}
                </div>
              )}
              <Button onClick={handleReschedule} disabled={!rescheduleDate || !rescheduleSlot} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                Confirm Reschedule
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
