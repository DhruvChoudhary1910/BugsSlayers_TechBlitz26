"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, User } from "lucide-react";
import toast from "react-hot-toast";

export default function DoctorProfile() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    specialization: "",
    qualification: "",
    bio: "",
    consultationFee: 500,
  });

  useEffect(() => {
    if (!session?.user?.doctorId) return;
    fetch(`/api/doctors/${session.user.doctorId}/availability`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.user?.name || "",
          phone: data.user?.phone || "",
          specialization: data.specialization || "",
          qualification: data.qualification || "",
          bio: data.bio || "",
          consultationFee: data.consultationFee || 500,
        });
        setLoading(false);
      });
  }, [session]);

  const handleSave = async () => {
    if (!session?.user?.doctorId) return;
    setSaving(true);
    const res = await fetch(`/api/doctors/${session.user.doctorId}/availability`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) toast.success("Profile updated!");
    else toast.error("Failed to update");
    setSaving(false);
  };

  if (loading) {
    return <div className="max-w-lg mx-auto"><div className="h-96 bg-white dark:bg-gray-900 rounded-2xl animate-pulse" /></div>;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Update your professional information</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
              {form.name.charAt(0) || "D"}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Full Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Phone</label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Specialization</label>
            <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Qualification</label>
            <Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="About yourself..."
              className="w-full p-3 border rounded-lg text-sm resize-none h-24 bg-transparent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Consultation Fee (₹)</label>
            <Input type="number" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })} />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
            <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
