"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search,
  UserPlus,
  CalendarIcon,
  CheckCircle,
  Stethoscope,
  Video,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { formatTime, cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function BookAppointment() {
  const [step, setStep] = useState(1);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState("");
  const [appointmentType, setAppointmentType] = useState("IN_PERSON");
  const [priority, setPriority] = useState("NORMAL");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<{ allSlots: string[]; bookedSlots: string[]; availableSlots: string[] }>({ allSlots: [], bookedSlots: [], availableSlots: [] });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", phone: "", email: "", dateOfBirth: "", gender: "", bloodGroup: "", address: "" });

  useEffect(() => {
    fetch("/api/patients").then((r) => r.json()).then(setPatients);
    fetch("/api/doctors").then((r) => r.json()).then(setDoctors);
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetch(`/api/appointments/available-slots?doctorId=${selectedDoctor.id}&date=${format(selectedDate, "yyyy-MM-dd")}`)
        .then((r) => r.json())
        .then(setSlots);
    }
  }, [selectedDoctor, selectedDate]);

  const filteredPatients = patients.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search)
  );

  const handleCreatePatient = async () => {
    if (!newPatient.name || !newPatient.phone) {
      toast.error("Name and phone are required");
      return;
    }
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatient),
      });
      const patient = await res.json();
      if (res.ok) {
        setPatients([...patients, patient]);
        setSelectedPatient(patient);
        setShowNewPatient(false);
        setStep(2);
        toast.success("Patient created!");
      }
    } catch {
      toast.error("Failed to create patient");
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error("Please complete all required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          doctorId: selectedDoctor.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          timeSlot: selectedSlot,
          type: appointmentType,
          priority,
          symptoms,
          notes,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setSuccess(result);
        toast.success("Appointment booked successfully!");
      } else {
        toast.error(result.error || "Failed to book appointment");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <Card className="border-0 shadow-lg text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Appointment Booked!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              ID: <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{success.id}</span>
            </p>
            <div className="text-left space-y-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
              <p className="text-sm"><strong>Patient:</strong> {success.patient?.name}</p>
              <p className="text-sm"><strong>Doctor:</strong> {success.doctor?.user?.name}</p>
              <p className="text-sm"><strong>Date:</strong> {format(new Date(success.date), "MMM dd, yyyy")}</p>
              <p className="text-sm"><strong>Time:</strong> {formatTime(success.timeSlot)}</p>
              <p className="text-sm"><strong>Type:</strong> {success.type === "IN_PERSON" ? "In-Person" : "Teleconsult"}</p>
              {success.priority === "URGENT" && <Badge className="bg-red-100 text-red-700">URGENT</Badge>}
            </div>
            <Button onClick={() => { setSuccess(null); setStep(1); setSelectedPatient(null); setSelectedDoctor(null); setSelectedDate(undefined); setSelectedSlot(""); setSymptoms(""); setNotes(""); }} className="bg-teal-600 hover:bg-teal-700 text-white">
              Book Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book Appointment</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Schedule a new appointment in a few steps</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {["Patient", "Doctor", "Schedule", "Review"].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
              step > i + 1 ? "bg-teal-500 text-white" : step === i + 1 ? "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300" : "bg-gray-100 text-gray-400 dark:bg-gray-800"
            )}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className={cn("text-xs font-medium hidden sm:block", step === i + 1 ? "text-teal-700 dark:text-teal-400" : "text-gray-400")}>{s}</span>
            {i < 3 && <div className={cn("flex-1 h-0.5", step > i + 1 ? "bg-teal-500" : "bg-gray-200 dark:bg-gray-800")} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Patient */}
      {step === 1 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Select Patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Button variant="outline" onClick={() => setShowNewPatient(true)} className="shrink-0">
                <UserPlus className="w-4 h-4 mr-2" /> New Patient
              </Button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredPatients.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => { setSelectedPatient(p); setStep(2); }}
                  className={cn(
                    "p-3 rounded-xl cursor-pointer border transition-all",
                    selectedPatient?.id === p.id
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                      : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  )}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.phone} {p.email && `· ${p.email}`}</p>
                </div>
              ))}
              {filteredPatients.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No patients found</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Doctor */}
      {step === 2 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Select Doctor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {doctors.map((d: any) => (
              <div
                key={d.id}
                onClick={() => { if (d.isAvailable) { setSelectedDoctor(d); setStep(3); } }}
                className={cn(
                  "p-4 rounded-xl cursor-pointer border transition-all",
                  !d.isAvailable && "opacity-50 cursor-not-allowed",
                  selectedDoctor?.id === d.id
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                    : "border-gray-200 dark:border-gray-800 hover:border-teal-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{d.user.name}</p>
                    <p className="text-sm text-gray-500">{d.specialization} · {d.qualification}</p>
                    <p className="text-xs text-gray-400 mt-1">{d.slotDurationMins} min slots · ₹{d.consultationFee}</p>
                  </div>
                  {!d.isAvailable && <Badge variant="secondary" className="text-xs">Unavailable</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Pick Date & Time */}
      {step === 3 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Pick Date & Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Date</label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => { setSelectedDate(date as Date); setSelectedSlot(""); }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-xl border"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Available Slots</label>
                {!selectedDate ? (
                  <p className="text-sm text-gray-400 py-8 text-center">Select a date first</p>
                ) : slots.availableSlots.length === 0 ? (
                  <p className="text-sm text-gray-400 py-8 text-center">{(slots as any).onLeave ? "Doctor is on leave" : "No available slots"}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto">
                    {slots.allSlots.map((slot: string) => {
                      const booked = slots.bookedSlots.includes(slot);
                      const available = slots.availableSlots.includes(slot);
                      return (
                        <button
                          key={slot}
                          disabled={!available}
                          onClick={() => setSelectedSlot(slot)}
                          className={cn(
                            "p-2 rounded-lg text-sm font-medium transition-all",
                            selectedSlot === slot
                              ? "bg-teal-500 text-white shadow-md"
                              : available
                              ? "bg-gray-50 dark:bg-gray-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-700 dark:text-gray-300"
                              : "bg-gray-100 dark:bg-gray-800/50 text-gray-400 line-through cursor-not-allowed"
                          )}
                        >
                          {formatTime(slot)}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Type & Priority */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Type</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={appointmentType === "IN_PERSON" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAppointmentType("IN_PERSON")}
                        className={appointmentType === "IN_PERSON" ? "bg-teal-600" : ""}
                      >
                        <Stethoscope className="w-3 h-3 mr-1" /> In-Person
                      </Button>
                      <Button
                        type="button"
                        variant={appointmentType === "TELECONSULT" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAppointmentType("TELECONSULT")}
                        className={appointmentType === "TELECONSULT" ? "bg-teal-600" : ""}
                      >
                        <Video className="w-3 h-3 mr-1" /> Teleconsult
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Priority</label>
                    <div className="flex gap-2">
                      <Button type="button" variant={priority === "NORMAL" ? "default" : "outline"} size="sm" onClick={() => setPriority("NORMAL")} className={priority === "NORMAL" ? "bg-gray-600" : ""}>Normal</Button>
                      <Button type="button" variant={priority === "URGENT" ? "default" : "outline"} size="sm" onClick={() => setPriority("URGENT")} className={priority === "URGENT" ? "bg-red-600" : "text-red-600 border-red-200"}>
                        <AlertTriangle className="w-3 h-3 mr-1" /> Urgent
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Symptoms / Reason</label>
                <Input value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Describe symptoms or reason for visit..." />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Notes (optional)</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button disabled={!selectedSlot} onClick={() => setStep(4)} className="bg-teal-600 hover:bg-teal-700 text-white">
                Review Appointment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Review & Confirm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Patient</span>
                <span className="text-sm font-medium">{selectedPatient?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Doctor</span>
                <span className="text-sm font-medium">{selectedDoctor?.user?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Specialization</span>
                <span className="text-sm font-medium">{selectedDoctor?.specialization}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm font-medium">{selectedDate && format(selectedDate, "MMM dd, yyyy")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Time</span>
                <span className="text-sm font-medium">{formatTime(selectedSlot)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Type</span>
                <Badge variant="secondary" className="text-xs">{appointmentType === "IN_PERSON" ? "In-Person" : "Teleconsult"}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Priority</span>
                <Badge className={priority === "URGENT" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"} >{priority}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Fee</span>
                <span className="text-sm font-semibold text-teal-600">₹{selectedDoctor?.consultationFee}</span>
              </div>
              {symptoms && (
                <div>
                  <span className="text-sm text-gray-500">Symptoms</span>
                  <p className="text-sm mt-0.5">{symptoms}</p>
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={handleSubmit} disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white">
                {loading ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons for steps 1 & 2 */}
      {step > 1 && step < 3 && (
        <div className="flex justify-start">
          <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
        </div>
      )}

      {/* New Patient Dialog */}
      <Dialog open={showNewPatient} onOpenChange={setShowNewPatient}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Full Name *" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} />
            <Input placeholder="Phone Number *" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} />
            <Input placeholder="Email" type="email" value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} />
            <Input placeholder="Date of Birth" type="date" value={newPatient.dateOfBirth} onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })} />
            <Select value={newPatient.gender} onValueChange={(val) => setNewPatient({ ...newPatient, gender: val })}>
              <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newPatient.bloodGroup} onValueChange={(val) => setNewPatient({ ...newPatient, bloodGroup: val })}>
              <SelectTrigger><SelectValue placeholder="Blood Group" /></SelectTrigger>
              <SelectContent>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Address" value={newPatient.address} onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })} />
            <Button onClick={handleCreatePatient} className="w-full bg-teal-600 hover:bg-teal-700 text-white">Create Patient</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
