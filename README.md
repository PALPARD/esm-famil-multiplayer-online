# 🎮 Esm-Famil-Multiplayer-Online (اسم فامیل آنلاین)

> **⚠️ AI Authorship Disclosure | سلب مسئولیت و اعلام سازنده:**
> This entire project — including backend game architecture, socket synchronization, client-side game engine, tactile arcade UI, vector character design, and procedural Web Audio synthesizer — was **autonomously generated, designed, and developed by an AI Agent (Hermes Agent)**. The repository owner did not personally write or author this source code.
>
> این پروژه به طور کامل (شامل معماری سرور، فرانت‌اند تعاملی، سیستم داوری، سینتی‌سایزر صوتی و رابط کاربری) **توسط هوش مصنوعی (AI Agent)** برنامه‌نویسی و طراحی شده است و صاحب این مخزن شخصاً کدی ننوشته است.

---

[English](#-english) | [راهنمای فارسی](#-راهنمای-فارسی)

---

## 🇬🇧 English

A modern, real-time multiplayer online Persian party game (*Esm Famil* / اسم فامیل) built with Node.js, Express, Socket.IO, and Tailwind CSS.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![AI-Generated](https://img.shields.io/badge/Author-Autonomous%20AI-purple.svg)

### ✨ Features

- **Real-Time Multiplayer Rooms:** Instant room creation with 5-character join codes and direct invite links.
- **Tactile 3D Arcade UI:** Tactile pressable buttons inspired by Jackbox Party Games and Gartic Phone with smooth transitions.
- **Interactive Dispute & Democratic Voting Phase:** Opponents can challenge answers with live counter tracking and democratic vote resolution.
- **Procedural Audio Synthesizer:** Built on the Web Audio API — generates ticks, buzzer, stop alarm, and fanfare with master volume control.
- **Persistent Profiles & Cumulative Leaderboard:** Saves player names and chosen avatars locally, tracking room totals and server-wide rankings.

### 🚀 Quick Start

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- npm or yarn

#### Installation & Run
```bash
# Clone the repository
git clone https://github.com/PALPARD/esm-famil-multiplayer-online.git
cd esm-famil-multiplayer-online

# Install dependencies
npm install

# Start the game server
npm start
```

The game server will start on `http://localhost:3000`.

### 🛠️ Tech Stack

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express.js
- **Real-time Engine:** Socket.IO
- **UI & Styling:** Tailwind CSS + Custom CSS arcade effects
- **Icons & Avatars:** Lucide Icons (offline bundle) + Inline SVG avatars
- **Audio:** Native Web Audio API Synthesizer

---

## 🇮🇷 راهنمای فارسی

یک پلتفرم مدرن و جذاب برای بازی نوستالژیک و آنلاین **اسم فامیل چندنفره** با طراحی مدرن آرکید، افکت‌های صوتی داخلی و قابلیت اجرای تحت وب بدون نیاز به نصب هیچ‌گونه اپلیکیشن اضافی.

### 🌟 قابلیت‌های کلیدی

- **لابی و اتاق‌های اختصاصی چندنفره:** ساخت اتاق با کد ۵ حرفی یا اشتراک‌گذاری لینک مستقیم دعوت.
- **رابط کاربری سه‌بعدی و لمسی (Tactile Arcade):** دکمه‌های فشردنی با انیمیشن روان الهام‌گرفته از بازی‌های مدرن دورهمی (مانند Jackbox و Gartic Phone).
- **سیستم داوری و رأی‌گیری دموکراتیک:** امکان وتو یا رأی‌گیری کلمات مشکوک توسط سایر بازیکنان به همراه شمارش زنده آرا.
- **موتور صوتی داخلی (Web Audio API):** افکت‌های صوتی زنده (تیک‌تاک زمان، آژیر استپ، افکت شمارش معکوس و تشویق برنده) با کنترل ولوم صدا.
- **حفظ امتیازات و لیدربرد سراسری:** حفظ امتیازات بازیکنان در طول دورهای مختلف یک اتاق و ثبت رکوردها در جدول لیدربرد بازی.
- **پشتیبانی از تم دارک و لایت:** امکان تغییر سریع تم محیط بازی به حالت تاریک یا روشن.

### 💻 نحوه نصب و اجرا روی سرور یا سیستم شخصی

#### پیش‌نیازها
- نصب بودن **Node.js** (نسخه ۱۸ به بالا)

#### مراحل اجرا
```bash
# دریافت سورس کد پروژه
git clone https://github.com/PALPARD/esm-famil-multiplayer-online.git
cd esm-famil-multiplayer-online

# نصب وابستگی‌ها
npm install

# اجرای سرور بازی
npm start
```

پس از اجرا، بازی روی آدرس زیر در دسترس خواهد بود:
`http://localhost:3000`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
