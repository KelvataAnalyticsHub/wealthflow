# WealthFlow 💰 — Personal Budget Manager

A world-class personal budget app built as a **Progressive Web App (PWA)** — installable as an APK-equivalent on Android, and fully hostable on GitHub Pages or any static host.

---

## ✨ Features

- **Multi-currency support** — 20+ currencies (USD, KES, EUR, GBP, NGN, INR, etc.)
- **Dashboard** — Balance overview, spending rings, quick actions
- **Transactions** — Add income, expenses, transfers with categories
- **Budgets** — Set monthly limits per category with visual progress bars
- **Savings Goals** — Track targets with deadlines and funding
- **Reports** — Monthly summary, category breakdown, 6-month trend chart
- **Offline-first** — Works without internet after first load
- **Export** — Download as CSV or JSON backup
- **Install as app** — On Android: "Add to Home Screen" from Chrome; on desktop: install button in browser

---

## 🚀 Deploy on GitHub Pages

### Option 1: GitHub Pages (Free, instant)

```bash
git init
git add .
git commit -m "Initial: WealthFlow budget app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/wealthflow.git
git push -u origin main
```

Then in your repo → **Settings → Pages → Source: main branch / (root)** → Save.

Your app will be live at: `https://YOUR_USERNAME.github.io/wealthflow/`

### Option 2: Netlify (Drag & drop)

1. Go to [netlify.com](https://netlify.com)
2. Drag the entire `budget-app` folder onto the deploy zone
3. Done — live in seconds!

### Option 3: Vercel

```bash
npx vercel --yes
```

---

## 📱 Install as Android APK (TWA / PWA)

### Method A: Chrome Install Prompt (Easiest)

1. Open your hosted URL in **Chrome for Android**
2. Tap the **three-dot menu** → **"Add to Home Screen"**
3. The app installs like a native app with full-screen mode

### Method B: Build a Real APK with PWABuilder

1. Host your app (GitHub Pages, Netlify, etc.)
2. Go to **[pwabuilder.com](https://www.pwabuilder.com)**
3. Enter your hosted URL → **"Start"**
4. Select **Android** → **"Generate Package"**
5. Download the signed `.apk` or `.aab` file
6. Install directly on your Android device!

### Method C: Bubblewrap CLI

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://YOUR_URL/manifest.json
bubblewrap build
```

---

## 📁 Project Structure

```
wealthflow/
├── index.html          # Main app shell
├── manifest.json       # PWA manifest (icons, name, theme)
├── sw.js               # Service worker (offline support)
├── css/
│   └── style.css       # All styles (dark theme, responsive)
├── js/
│   ├── data.js         # Currencies, categories, localStorage
│   └── app.js          # Full app logic
└── icons/
    ├── icon-192.png    # App icon
    └── icon-512.png    # App icon (large)
```

---

## 🎨 Tech Stack

- **Vanilla HTML/CSS/JS** — Zero dependencies, instant load
- **CSS Custom Properties** — Full dark theme with design tokens
- **LocalStorage** — All data stored locally on device
- **PWA** — Service worker, web manifest, installable
- **Fonts**: Syne (display), Instrument Sans (body), DM Mono (numbers)

---

## 💡 Inspired By

Research from the best budgeting tools:
- **YNAB** — Zero-based budgeting philosophy
- **Monarch Money** — Beautiful flex/category budgeting
- **PocketGuard** — Snapshot spending overview
- **Goodbudget** — Envelope-style category tracking

---

## 📄 License

MIT — Free to use, modify, and distribute.
