# 🎮 Name-Shahr-Shohrat (اسم فامیل آنلاین)

> **⚠️ AI Authorship Disclosure | سلب مسئولیت و اعلام سازنده:**
> This entire project — including backend game architecture, socket synchronization, client-side game engine, tactile arcade UI, vector character design, and procedural Web Audio synthesizer — was **autonomously generated, designed, and developed by an AI Agent (Hermes Agent)**. The repository owner did not personally write or author this source code.
>
> این پروژه به طور کامل (شامل معماری سرور، فرانت‌اند تعاملی، سیستم داوری، سینتی‌سایزر صوتی و رابط کاربری) **توسط هوش مصنوعی (AI Agent)** برنامه‌نویسی و طراحی شده است و صاحب این مخزن شخصاً کدی ننوشته است.

---

A modern, real-time multiplayer online Persian party game (*Esm Famil* / اسم فامیل) built with Node.js, Express, Socket.IO, and Tailwind CSS.

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![AI-Generated](https://img.shields.io/badge/Author-Autonomous%20AI-purple.svg)

---

## ✨ Features

- **Real-Time Multiplayer Rooms:** Instant room creation with 5-character join codes and direct invite links.
- **Tactile 3D Arcade UI:** Tactile pressable buttons inspired by Jackbox Party Games and Gartic Phone with smooth transitions.
- **Pure Vector Graphics (No System Emojis):** Completely eliminates standard emojis in favor of scalable Lucide SVG icons and 12 custom vector avatars.
- **Interactive Dispute & Democratic Voting Phase:** Opponents can challenge answers with live counter tracking and democratic vote resolution.
- **Procedural Audio Synthesizer:** Built on the Web Audio API — generates ticks, buzzer, stop alarm, and fanfare with master volume control.
- **Dynamic Scoring & Alef Normalization:** Special handling for the Persian letter «الف» (supporting `[اآأإ]`) while maintaining distinction for letters like «ت» and «ط».
- **Persistent Profiles & Cumulative Leaderboard:** Saves player names and chosen avatars locally, tracking room totals and server-wide rankings.
- **Security Hardened:** Comprehensive stored-XSS protection (`escapeHtml`), socket rate-limiting, prototype pollution guards, and input sanitization.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/PALPARD/name-shahr-shohrat.git
cd name-shahr-shohrat

# Install dependencies
npm install

# Start the game server
npm start
```

The game will be available at `http://localhost:3000`.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express.js
- **Real-time Engine:** Socket.IO
- **UI & Styling:** Tailwind CSS + Custom CSS arcade effects
- **Icons & Avatars:** Lucide Icons (offline bundle) + Inline SVG avatars
- **Audio:** Native Web Audio API Synthesizer

---

## 🔒 Security Audited

- **XSS Protection:** All user-supplied fields (words, nicknames, categories, chat) are sanitized and escaped prior to DOM injection.
- **Prototype Pollution Prevention:** Object keys and JSON data strictly validated against `__proto__`, `constructor`, and `prototype`.
- **DoS / Flood Protection:** Per-socket token bucket rate limiting on gameplay and voting events.
- **Security Headers:** Configured `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `X-XSS-Protection`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
