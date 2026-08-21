# Delayo 💤 — Snooze Tabs, Boost Focus

<p align="center">
  <img src="docs/assets/delayo-banner.jpg" alt="Delayo - Snooze Tabs, Boost Focus" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/allud1t/Delayo/releases"><img src="https://img.shields.io/github/v/release/allud1t/Delayo?color=FF8000&label=version" alt="GitHub Release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/allud1t/Delayo?color=blue" alt="License MIT" /></a>
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Chrome_Web_Store-v1.2.0-orange?logo=googlechrome&logoColor=white" alt="Chrome Web Store" />
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/delayo/egbfkigkgocjmahcdmigccelneabbajh?utm_source=github&utm_medium=readme&utm_campaign=organic"><strong>Install Delayo from the Chrome Web Store ↗</strong></a>
  ·
  <a href="https://allud1t.github.io/Delayo/">Visit the project site</a>
</p>

**Delayo** is a modern, privacy-focused open-source Chrome extension that lets you "snooze tabs," hiding them temporarily from your browser clutter and reopening them automatically right when you need them.

Ideal for engineers, researchers, students, and power users who want a clean tab bar without losing important links or keeping every possible task open at once.

---

## ⚡ What's New in v1.2.0

- ⚡ **Turbo Snooze (+1h)**: Instantly delay selected tabs by 1 hour with a single click.
- 🕒 **Context-Aware Dynamic Presets**: Smart time calculations that adapt dynamically (e.g., auto-shifting to "Tomorrow Night" if the evening deadline has already passed).
- 📅 **Integrated Custom Calendar & Time Picker**: Fast date & time selection without clunky native browser popups.
- 📊 **Productivity Insights**: Track your protected focus hours and tab statistics locally with 100% privacy (zero telemetry sent to external servers).
- ☕ **Direct Community Support**: Integrated PIX, PayPal, and Ko-fi support options right in the popup footer.

---

## 🚀 Key Features

- 💤 **Delay Tabs**: Clean your tab workspace and save memory without bookmarking clutter.
- 🎯 **Flexible Modes**: Snooze the active tab, multiple highlighted tabs, or all tabs in the current window.
- ⏰ **Smart Presets**: Choose from quick presets (Later Today, Tonight, Tomorrow Morning, Weekend, Next Week, Next Month, Someday).
- 🔁 **Recurring Delays**: Schedule tabs to reopen daily, on weekdays, weekly, or monthly (perfect for standups, timesheets, and newsletters).
- 📋 **Tab Management Dashboard**: View, filter, wake immediately, or discard all queued tabs.
- 🌙 **Dark & Light Modes**: Seamless theme switching with high-contrast readability.
- 🔒 **100% Private**: No account required, no ads, no trackers. All data stays inside your browser's local storage.

---

## 🧰 Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19** | Modern UI rendering & reactive state |
| **TypeScript 5** | End-to-end type safety |
| **Vite 5 & CRXJS** | Lightning-fast build and HMR development |
| **Tailwind CSS & DaisyUI** | Clean, accessible design system |
| **Vitest** | Comprehensive unit & integration test suite |
| **GitHub Actions** | Automated CI/CD & Chrome Web Store API deployment |

---

## 📦 Installation

### From Chrome Web Store
Install directly from the official [Delayo listing](https://chromewebstore.google.com/detail/delayo/egbfkigkgocjmahcdmigccelneabbajh?utm_source=github&utm_medium=readme&utm_campaign=organic) in the Chrome Web Store.

### Local Development / Manual Load
1. Clone this repository:
   ```bash
   git clone https://github.com/allud1t/Delayo.git
   cd Delayo
   ```
2. Install dependencies and build:
   ```bash
   pnpm install
   pnpm build
   ```
3. Open `chrome://extensions` in Google Chrome.
4. Enable **Developer mode** (top-right toggle).
5. Click **Load unpacked** (top-left) and select the `dist/` directory.

---

## 🧑‍💻 Development Commands

```bash
pnpm dev              # Start Vite in dev mode
pnpm build            # Type-check and build production dist/
pnpm test             # Run Vitest test suite
pnpm lint             # Run ESLint checks
pnpm zip              # Package production archive for store
```

---

## 🚚 Automated Releases

Releases to the Chrome Web Store are fully automated via GitHub Actions using the official Google Chrome Web Store API.

- [Runbook](docs/CHROME_WEB_STORE_RELEASE.md)
- [Release Spec](docs/specs/chrome-web-store-release.md)

---

## ⚖️ License & Attribution

Licensed under the [MIT License](LICENSE).  
Hard-forked from [Snoozr](https://github.com/hardchor/snoozr) with unique architecture, modern stack refactor, and new features.

---

<p align="center">Made with ❤️ for a distraction-free browsing experience.</p>

