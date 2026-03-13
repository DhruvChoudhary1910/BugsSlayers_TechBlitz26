# MediSchedule
> **A high-performance, role-based clinic management and intelligent appointment scheduling system.**

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)

MediSchedule is a full-stack web application designed to streamline clinic operations. Built with modern web technologies, it features dedicated workflows for both Receptionists and Doctors, backed by a robust automated slot-generation engine with real-time clash detection.

## 📸 Previews

> 📸 *Tip: Add a high-quality GIF or screenshot of the dashboard here.*

### Receptionist Dashboard
> 📸 *Placeholder: Image showing the timeline view and appointment data table.*

### Doctor Dashboard
> 📸 *Placeholder: Image showing the daily queue, prescription modal, and availability calendar.*

---

## 🚀 Features

### Role-Specific Workflows

| 👩‍💼 Receptionist (Admin) | 👨‍⚕️ Doctor (Provider) |
| :--- | :--- |
| **Complete Appointment CRUD:** Book, reschedule, cancel, and filter all appointments. | **Daily Queue:** View today's schedule at a glance with one-click status updates (Complete/No-Show). |
| **Patient Management:** Create and maintain detailed patient records. | **Clinical Actions:** Add prescriptions and set follow-up dates directly from the queue. |
| **Timeline View:** Visual representation of today's schedule across the clinic. | **Schedule Management:** Toggle availability and manage leave/blocked days on the calendar. |
| **Bulk Actions:** Manage multiple records simultaneously. | **Patient History:** Access historical clinical data and past visits for context. |
| **Data Export:** Export schedules and patient lists to CSV. | **Priority Alerts:** Visual indicators for urgent appointments. |

### Shared System Features
* **Secure Authentication:** JWT-based sessions with `NextAuth.js v5` and strict role-based routing.
* **Smart Notifications:** Real-time notification bell with unread counters and global toast alerts.
* **Modern UI/UX:** Responsive sidebar layout, dark mode support, and loading skeletons for seamless data fetching.
* **Intelligent Scheduling:** Automated slot generation respecting clinic hours, doctor leaves, and existing bookings.

---

## 🛠 Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router) | React framework utilizing Server Components for performance. |
| **Language** | TypeScript | End-to-end type safety reducing runtime errors. |
| **Styling** | Tailwind CSS | Utility-first CSS for rapid, responsive UI development. |
| **UI Components** | shadcn/ui | Accessible, customizable radix-based components. |
| **Backend / API** | Next.js Route Handlers | RESTful API architecture running on Edge/Node runtime. |
| **Database** | SQLite | Lightweight, zero-configuration database (ideal for local/hackathon). |
| **ORM** | Prisma | Strongly typed database client and schema migrations. |
| **Authentication** | NextAuth.js (Auth.js) v5 | Secure, credential-based session management. |
| **Data Viz** | recharts | Rendering dashboard analytics and statistics. |
| **Utilities** | date-fns, lucide-react | Timezone-aware date manipulation and SVG iconography. |

---

## 🏗 Architecture Overview

MediSchedule leverages the **Next.js 14 App Router** to strictly separate server-side logic from client-side interactivity. By defaulting to React Server Components (RSCs), we securely fetch data directly from the Prisma database, significantly reducing the JavaScript bundle sent to the browser. Client components (`"use client"`) are strictly reserved for interactive UI elements like modals, toast notifications, and forms.

The application enforces security via **Role-Based Middleware**, which intercepts requests at the edge to ensure users can only access their respective dashboards and API routes. The backend APIs are structured as standard RESTful Route Handlers, communicating with an SQLite database via Prisma. The core of the application is the **Scheduling Engine**, a custom utility that dynamically calculates available time slots based on a doctor's standard working hours, actively subtracting existing bookings and registered leave days to prevent double-booking.

---

## 📂 Project Structure

```text
📦 medischedule
 ┣ 📂 prisma               # Database schema and migration files
 ┣ 📂 public               # Static assets (images, icons)
 ┣ 📂 src
 ┃ ┣ 📂 app                # Next.js App Router (Pages, Layouts, API routes)
 ┃ ┃ ┣ 📂 (auth)           # Login pages (grouped route)
 ┃ ┃ ┣ 📂 (dashboard)      # Authenticated layouts
 ┃ ┃ ┃ ┣ 📂 doctor         # Doctor-specific pages
 ┃ ┃ ┃ ┗ 📂 receptionist   # Receptionist-specific pages
 ┃ ┃ ┣ 📂 api              # RESTful Route Handlers
 ┃ ┣ 📂 components         # Reusable React components
 ┃ ┃ ┣ 📂 ui               # shadcn/ui components
 ┃ ┃ ┗ 📂 shared           # Layouts, Skeletons, Navigation
 ┃ ┣ 📂 lib                # Core utilities
 ┃ ┃ ┣ 📜 auth.ts          # NextAuth v5 configuration
 ┃ ┃ ┣ 📜 prisma.ts        # Prisma client singleton
 ┃ ┃ ┗ 📜 scheduling.ts    # Slot generation & clash detection logic
 ┃ ┗ 📂 types              # Global TypeScript interfaces
 ┣ 📜 .env.example         # Environment variables template
 ┗ 📜 package.json         # Dependencies and scripts