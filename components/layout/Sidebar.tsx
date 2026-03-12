"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  Users,
  Clock,
  Stethoscope,
  Settings,
  UserCircle,
  MessageCircle,
  X,
} from "lucide-react";

const receptionistLinks = [
  { href: "/dashboard/receptionist", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/receptionist/book", label: "Book Appointment", icon: CalendarPlus },
  { href: "/dashboard/receptionist/appointments", label: "All Appointments", icon: CalendarDays },
  { href: "/dashboard/receptionist/patients", label: "Patients", icon: Users },
  { href: "/dashboard/receptionist/schedule", label: "Today's Schedule", icon: Clock },
];

const doctorLinks = [
  { href: "/dashboard/doctor", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/doctor/schedule", label: "Today's Schedule", icon: Clock },
  { href: "/dashboard/doctor/appointments", label: "All Appointments", icon: CalendarDays },
  { href: "/dashboard/doctor/patients", label: "My Patients", icon: Users },
  { href: "/dashboard/doctor/availability", label: "Availability", icon: Settings },
  { href: "/dashboard/doctor/settings", label: "Settings", icon: MessageCircle },
  { href: "/dashboard/doctor/profile", label: "Profile", icon: UserCircle },
];

interface SidebarProps {
  role: string;
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ role, currentPath, isOpen, onClose }: SidebarProps) {
  const links = role === "DOCTOR" ? doctorLinks : receptionistLinks;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-teal-500/25">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                MediFlow
              </h1>
              <p className="text-[10px] font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                {role === "DOCTOR" ? "Doctor" : "Reception"}
              </p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 mt-2">
          {links.map((link) => {
            const isActive = currentPath === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/25"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-400 dark:text-gray-600 text-center">
            MediFlow Clinic v1.0
          </div>
        </div>
      </aside>
    </>
  );
}
