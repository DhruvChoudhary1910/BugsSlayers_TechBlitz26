# MediSchedule
> **A high-performance, role-based clinic management and intelligent appointment scheduling system.**

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)

MediSchedule is a full-stack web application designed to streamline clinic operations. Built with modern web technologies, it features dedicated workflows for both Receptionists and Doctors, backed by a robust automated slot-generation engine with real-time clash detection.

## 📸 Previews
![WhatsApp Image 2026-03-13 at 1 08 09 PM](https://github.com/user-attachments/assets/55638b39-4eb7-429e-ad86-3c74d47cda89)

### Receptionist Dashboard
![WhatsApp Image 2026-03-13 at 1 07 49 PM](https://github.com/user-attachments/assets/503cc19b-e124-42c8-942b-5e7247a0c05a)

### Doctor Dashboard
![WhatsApp Image 2026-03-13 at 1 08 41 PM](https://github.com/user-attachments/assets/d9168f95-04db-4257-8571-e0c6fb5cb062)

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


## 🏗 Architecture Overview

MediSchedule leverages the **Next.js 14 App Router** to strictly separate server-side logic from client-side interactivity. By defaulting to React Server Components (RSCs), we securely fetch data directly from the Prisma database, significantly reducing the JavaScript bundle sent to the browser. Client components (`"use client"`) are strictly reserved for interactive UI elements like modals, toast notifications, and forms.

The application enforces security via **Role-Based Middleware**, which intercepts requests at the edge to ensure users can only access their respective dashboards and API routes. The backend APIs are structured as standard RESTful Route Handlers, communicating with an SQLite database via Prisma. The core of the application is the **Scheduling Engine**, a custom utility that dynamically calculates available time slots based on a doctor's standard working hours, actively subtracting existing bookings and registered leave days to prevent double-booking.


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


## 🤖 Telegram Bot Integration
[![Telegram Bot](https://img.shields.io/badge/Telegram_Bot-@Mediflow123__bot-2CA5E0?style=for-the-badge&logo=telegram)](https://t.me/Mediflow123_bot)

MediSchedule features a fully integrated Telegram Bot designed specifically for Doctors. It provides real-time alerts, daily schedule summaries, and secure on-demand access to clinic data directly from Telegram.

### How It Works

The integration uses a secure 3-step linkage process to map a Doctor's authenticated web session to their personal Telegram chat:

1. **Generate Code:** The Doctor clicks "Connect Telegram" in their dashboard settings. The API generates a secure, 6-digit `verificationCode` tied to their `doctorId` and stores it in the `TelegramSession` database table (expires in 10 minutes).
2. **Send to Bot:** The Doctor opens the Telegram bot and sends `/verify <CODE>`.
3. **Link Established:** The bot verifies the code against the database, extracts the Telegram `chatId`, saves it to the `Doctor` model (`telegramLinked = true`), and deletes the session code.

Once linked, Next.js API route handlers trigger fire-and-forget background notifications to the bot whenever a receptionist updates the clinic schedule.

### Bot Commands Reference

| Command | Description | Auth Required |
| :--- | :--- | :--- |
| `/start` | Welcome message and setup instructions. | No |
| `/verify CODE` | Links the Doctor's Next.js account to Telegram using a 6-digit code. | No |
| `/today` | Fetches the full schedule for today with status emojis. | Yes |
| `/upcoming` | Lists the next 5 upcoming appointments across all dates. | Yes |
| `/next` | Displays the single next pending appointment with a countdown. | Yes |
| `/summary` | Shows daily statistics (completed, pending, cancelled, no-show, earnings). | Yes |
| `/patients` | Monthly patient volume and new patients added this week. | Yes |
| `/cancel` | Returns a numbered list of pending appointments; reply to cancel. | Yes |
| `/reminders on\|off` | Toggles automatic 30-minute pre-appointment reminders. | Yes |
| `/unlink` | Disconnects the Telegram account and halts all notifications. | Yes |
| `/help` | Displays the full command reference menu. | No |

### Automatic Notifications

Notifications are triggered asynchronously via API route handlers.

| Trigger Event | Notification Type | Message Format Summary |
| :--- | :--- | :--- |
| **New Booking** | `POST /api/appointments` | Patient name, time slot, listed symptoms. |
| **Urgent Booking** | `POST /api/appointments` | 🚨 Urgent header, patient details, immediate review prompt. |
| **Cancellation** | `PATCH /api/appointments/[id]` | Alert that a slot has opened up + cancelled patient name. |
| **Reschedule** | `PATCH /api/appointments/[id]` | Comparison of old date/time vs. new date/time. |

### Scheduled Messages

The bot runs a lightweight internal scheduler (`setInterval`) initialized on server boot:
* **Morning Summary (8:00 AM):** Automatically pulls the day's schedule and sends a morning brief if the doctor has appointments booked for that day.
* **30-Minute Reminders:** Scans for appointments starting in exactly 30 minutes. To guarantee idempotency and prevent duplicate pings during Next.js hot-reloads or polling restarts, it checks and updates a `reminderSent` boolean on the `Appointment` model.
