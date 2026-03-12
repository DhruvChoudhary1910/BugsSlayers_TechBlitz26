"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Phone, Mail, Droplet, Calendar } from "lucide-react";
import { formatDate, formatTime, getStatusColor, getAge } from "@/lib/utils";

export default function DoctorPatients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState<any>(null);

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/patients${params}`).then((r) => r.json()).then(setPatients).finally(() => setLoading(false));
  }, [search]);

  const viewProfile = async (id: string) => {
    const res = await fetch(`/api/patients/${id}`);
    setShowProfile(await res.json());
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Patients</h1>
        <p className="text-sm text-gray-500">{patients.length} patients seen</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-gray-900 rounded-2xl animate-pulse" />
          ))
        ) : patients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No patients found</div>
        ) : (
          patients.map((p: any) => (
            <Card key={p.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => viewProfile(p.id)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.phone}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  {p.gender && <span>{p.gender}</span>}
                  {p.dateOfBirth && <span>{getAge(p.dateOfBirth)} yrs</span>}
                  {p.bloodGroup && <span className="flex items-center gap-1"><Droplet className="w-3 h-3" /> {p.bloodGroup}</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!showProfile} onOpenChange={() => setShowProfile(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{showProfile?.name}</DialogTitle></DialogHeader>
          {showProfile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {showProfile.phone}</div>
                {showProfile.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> {showProfile.email}</div>}
                {showProfile.dateOfBirth && <div>{formatDate(showProfile.dateOfBirth)} ({getAge(showProfile.dateOfBirth)} yrs)</div>}
                {showProfile.bloodGroup && <div><Droplet className="w-4 h-4 inline text-gray-400" /> {showProfile.bloodGroup}</div>}
              </div>
              {showProfile.medicalHistory && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Medical History</p>
                  <p className="bg-gray-50 dark:bg-gray-800 rounded p-2">{showProfile.medicalHistory}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium mb-2">Visit History</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {showProfile.appointments?.map((a: any) => (
                    <div key={a.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{formatDate(a.date)} · {formatTime(a.timeSlot)}</span>
                        <Badge className={`${getStatusColor(a.status)} text-[10px]`}>{a.status}</Badge>
                      </div>
                      {a.symptoms && <p className="text-gray-500 mt-1">{a.symptoms}</p>}
                      {a.prescription && <p className="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/10 rounded p-1 mt-1 text-xs">Rx: {a.prescription}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
