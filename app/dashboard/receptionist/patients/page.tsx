"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, Phone, Mail, Calendar, MapPin, Droplet, FileText, ArrowRight, X } from "lucide-react";
import { formatDate, formatTime, getStatusColor, getAge } from "@/lib/utils";
import toast from "react-hot-toast";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", dateOfBirth: "", gender: "", bloodGroup: "", address: "", medicalHistory: "" });

  const fetchPatients = async () => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/patients${params}`);
    const data = await res.json();
    setPatients(data);
    setLoading(false);
  };

  useEffect(() => { fetchPatients(); }, [search]);

  const handleAdd = async () => {
    if (!form.name || !form.phone) { toast.error("Name and phone are required"); return; }
    const res = await fetch("/api/patients", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Patient added!");
      setShowAdd(false);
      setForm({ name: "", phone: "", email: "", dateOfBirth: "", gender: "", bloodGroup: "", address: "", medicalHistory: "" });
      fetchPatients();
    }
  };

  const viewProfile = async (id: string) => {
    const res = await fetch(`/api/patients/${id}`);
    const data = await res.json();
    setShowProfile(data);
    setForm({
      name: data.name, phone: data.phone, email: data.email || "", dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
      gender: data.gender || "", bloodGroup: data.bloodGroup || "", address: data.address || "", medicalHistory: data.medicalHistory || "",
    });
  };

  const handleUpdate = async () => {
    const res = await fetch(`/api/patients/${showProfile.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Patient updated!");
      setEditMode(false);
      viewProfile(showProfile.id);
      fetchPatients();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patients</h1>
          <p className="text-sm text-gray-500">{patients.length} registered patients</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
          <UserPlus className="w-4 h-4 mr-2" /> Add Patient
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search by name, phone, or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-white dark:bg-gray-900 rounded-2xl animate-pulse" />
          ))
        ) : patients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>No patients found</p>
          </div>
        ) : (
          patients.map((p: any) => (
            <Card key={p.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => viewProfile(p.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.phone}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {p._count?.appointments || 0} visits
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  {p.gender && <span className="flex items-center gap-1">{p.gender}</span>}
                  {p.bloodGroup && <span className="flex items-center gap-1"><Droplet className="w-3 h-3" /> {p.bloodGroup}</span>}
                  {p.dateOfBirth && <span>{getAge(p.dateOfBirth)} yrs</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Patient Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Patient</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Phone Number *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.bloodGroup} onValueChange={(v) => setForm({ ...form, bloodGroup: v })}>
              <SelectTrigger><SelectValue placeholder="Blood Group" /></SelectTrigger>
              <SelectContent>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <textarea placeholder="Medical History" value={form.medicalHistory} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })} className="w-full p-2 border rounded-lg text-sm resize-none h-20 bg-transparent" />
            <Button onClick={handleAdd} className="w-full bg-teal-600 hover:bg-teal-700 text-white">Add Patient</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Patient Profile Dialog */}
      <Dialog open={!!showProfile} onOpenChange={() => { setShowProfile(null); setEditMode(false); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{showProfile?.name}</span>
              <Button size="sm" variant="outline" onClick={() => setEditMode(!editMode)}>
                {editMode ? "Cancel" : "Edit"}
              </Button>
            </DialogTitle>
          </DialogHeader>
          {showProfile && !editMode && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {showProfile.phone}</div>
                {showProfile.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> {showProfile.email}</div>}
                {showProfile.dateOfBirth && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> {formatDate(showProfile.dateOfBirth)} ({getAge(showProfile.dateOfBirth)} yrs)</div>}
                {showProfile.gender && <div>Gender: {showProfile.gender}</div>}
                {showProfile.bloodGroup && <div className="flex items-center gap-2"><Droplet className="w-4 h-4 text-gray-400" /> {showProfile.bloodGroup}</div>}
                {showProfile.address && <div className="col-span-2 flex items-start gap-2"><MapPin className="w-4 h-4 text-gray-400 mt-0.5" /> {showProfile.address}</div>}
              </div>
              {showProfile.medicalHistory && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medical History</p>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3">{showProfile.medicalHistory}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Appointment History ({showProfile.appointments?.length || 0})</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {showProfile.appointments?.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                      <div>
                        <p className="font-medium">{formatDate(a.date)} · {formatTime(a.timeSlot)}</p>
                        <p className="text-xs text-gray-500">{a.doctor?.user?.name} · {a.symptoms || "—"}</p>
                      </div>
                      <Badge className={`${getStatusColor(a.status)} text-[10px]`}>{a.status}</Badge>
                    </div>
                  )) || <p className="text-sm text-gray-400">No appointments yet</p>}
                </div>
              </div>
            </div>
          )}
          {showProfile && editMode && (
            <div className="space-y-3">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
              <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
              <textarea value={form.medicalHistory} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })} placeholder="Medical History" className="w-full p-2 border rounded-lg text-sm resize-none h-20 bg-transparent" />
              <Button onClick={handleUpdate} className="w-full bg-teal-600 hover:bg-teal-700 text-white">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
