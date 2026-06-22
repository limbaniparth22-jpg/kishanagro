# 🌾 AgroERP — Agro Retail Shop Management System

A complete mini-ERP for agro retail shops built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**.
All data is stored in **localStorage** — no backend, no database required. Deploy directly on Vercel.

---

## 📦 Features

| Module | Features |
|---|---|
| **Stock** | Add/edit products, HSN codes, purchase & sale price, min-stock alert, restock |
| **Sales** | GST invoices, customer search, discount, part-payment, print/PDF |
| **Purchases** | Supplier orders, stock auto-update, bill tracking |
| **Customers** | Customer ledger, balance tracking, GSTIN |
| **Suppliers** | Supplier ledger, payable tracking |
| **Ledger** | Auto-entries from sales/purchases/expenses, manual entries, running balance |
| **Expenses** | Category-wise expenses, charts, auto-ledger entry |
| **Reports** | Revenue, profit, GST, top products, top customers, payment-mode breakdown |
| **Dashboard** | KPI cards, 7-day revenue chart, stock alerts, recent sales |

---

## 🖥️ Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Recharts** (charts)
- **Lucide React** (icons)
- **localStorage** (data persistence — no server needed)

---

## 🚀 Local Setup (Step by Step)

### Prerequisites
- Node.js **18 or higher** — download from https://nodejs.org
- npm (comes with Node.js)
- Git — download from https://git-scm.com

---

### Step 1 — Clone or Download the Project

If you have Git:
```bash
git clone https://github.com/YOUR_USERNAME/agro-erp.git
cd agro-erp
```

Or download the ZIP and extract it, then open terminal inside the folder.

---

### Step 2 — Install Dependencies

```bash
npm install
```

This downloads all packages (Next.js, Tailwind, Recharts, etc.) into `node_modules/`.
Takes 1–3 minutes on first run.

---

### Step 3 — Run Development Server

```bash
npm run dev
```

Open browser at: **http://localhost:3000**

---

### Step 4 — Build for Production (test locally)

```bash
npm run build
npm run start
```

---

## ☁️ Deploy on Vercel (Free)

### Option A — Via Vercel CLI (recommended)

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy from project folder
vercel

# 4. Follow prompts — select defaults
# Your app URL will be printed at the end
```

### Option B — Via GitHub (easiest for updates)

1. Push code to a GitHub repository
2. Go to https://vercel.com and sign in with GitHub
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Leave all settings as default — Vercel auto-detects Next.js
6. Click **"Deploy"**
7. Your app is live in ~2 minutes at `https://agro-erp-xxx.vercel.app`

---

## 📁 Project File Structure

```
agro-erp/
├── .eslintrc.json              ← ESLint config
├── .gitignore                  ← Git ignore rules
├── next.config.js              ← Next.js config
├── package.json                ← Dependencies & scripts
├── postcss.config.js           ← PostCSS (for Tailwind)
├── tailwind.config.js          ← Tailwind theme config
├── tsconfig.json               ← TypeScript config
├── public/
│   └── favicon.svg             ← App icon
└── src/
    ├── app/
    │   ├── globals.css         ← Global styles
    │   ├── layout.tsx          ← Root layout (sidebar wrapper)
    │   ├── page.tsx            ← Dashboard
    │   ├── stock/page.tsx      ← Stock & Inventory
    │   ├── sales/page.tsx      ← Sales & Billing
    │   ├── purchases/page.tsx  ← Purchase Management
    │   ├── customers/page.tsx  ← Customer Management
    │   ├── suppliers/page.tsx  ← Supplier Management
    │   ├── ledger/page.tsx     ← Account Ledger
    │   ├── expenses/page.tsx   ← Expense Tracker
    │   └── reports/page.tsx    ← Reports & Analytics
    ├── components/
    │   ├── AppShell.tsx        ← Sidebar + header layout
    │   └── ui.tsx              ← Shared UI components
    └── lib/
        └── store.ts            ← Data layer (localStorage + types + seed data)
```

---

## ⚠️ Important Notes

1. **Data is stored in browser localStorage** — clearing browser data will reset everything.
2. For permanent data storage, a future upgrade could use Supabase or MongoDB.
3. The app uses seed data on first load so you can explore immediately.
4. To reset all data: open browser Console → type `localStorage.clear()` → refresh.

---

## 🏭 Built for Galaxy Automation
Kutchh, Gujarat, India
