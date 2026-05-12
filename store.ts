"use client";
// ─── Types ────────────────────────────────────────────────────────────────────
export type Category = "Fertilizer" | "Pesticide" | "Seeds" | "Irrigation" | "Tools" | "Other";
export type PayMode  = "Cash" | "UPI" | "Credit" | "Cheque" | "Bank Transfer";
export type TxType   = "sale" | "purchase" | "expense" | "receipt" | "payment";

export interface Product {
  id: string; name: string; category: Category;
  unit: string; purchasePrice: number; salePrice: number;
  stock: number; hsnCode: string; minStock: number;
  createdAt: string;
}

export interface Customer {
  id: string; name: string; phone: string;
  email: string; address: string; gstNo: string;
  openingBalance: number; createdAt: string;
}

export interface Supplier {
  id: string; name: string; phone: string;
  email: string; address: string; gstNo: string;
  openingBalance: number; createdAt: string;
}

export interface InvoiceItem {
  productId: string; productName: string; unit: string;
  qty: number; rate: number; discount: number; amount: number; gstRate: number;
}

export interface SaleInvoice {
  id: string; invoiceNo: string; customerId: string; customerName: string;
  customerPhone: string; date: string; dueDate: string;
  items: InvoiceItem[]; subtotal: number; totalDiscount: number;
  taxableAmount: number; totalGST: number; total: number;
  paidAmount: number; balanceDue: number;
  payMode: PayMode; notes: string; status: "paid" | "partial" | "unpaid";
}

export interface PurchaseInvoice {
  id: string; invoiceNo: string; supplierId: string; supplierName: string;
  billNo: string; date: string; dueDate: string;
  items: InvoiceItem[]; subtotal: number; totalDiscount: number;
  taxableAmount: number; totalGST: number; total: number;
  paidAmount: number; balanceDue: number;
  payMode: PayMode; notes: string; status: "paid" | "partial" | "unpaid";
}

export interface LedgerEntry {
  id: string; date: string; type: TxType;
  partyType: "customer" | "supplier" | "general";
  partyId: string; partyName: string;
  description: string; debit: number; credit: number;
  balance: number; refId: string;
}

export interface Expense {
  id: string; date: string; category: string;
  description: string; amount: number; payMode: PayMode;
}

// ─── Seed Data ─────────────────────────────────────────────────────────────────
const SEED_PRODUCTS: Product[] = [
  { id:"p1", name:"Urea (46% N)",       category:"Fertilizer", unit:"Bag (50kg)",   purchasePrice:260, salePrice:285,  stock:120, hsnCode:"3102", minStock:20, createdAt:"2024-01-01" },
  { id:"p2", name:"DAP Fertilizer",     category:"Fertilizer", unit:"Bag (50kg)",   purchasePrice:1280,salePrice:1380, stock:80,  hsnCode:"3105", minStock:10, createdAt:"2024-01-01" },
  { id:"p3", name:"NPK 19:19:19",       category:"Fertilizer", unit:"Bag (50kg)",   purchasePrice:990, salePrice:1100, stock:60,  hsnCode:"3105", minStock:10, createdAt:"2024-01-01" },
  { id:"p4", name:"MOP (60% K2O)",      category:"Fertilizer", unit:"Bag (50kg)",   purchasePrice:740, salePrice:810,  stock:45,  hsnCode:"3104", minStock:10, createdAt:"2024-01-01" },
  { id:"p5", name:"Chlorpyrifos 20EC",  category:"Pesticide",  unit:"Litre",        purchasePrice:380, salePrice:440,  stock:40,  hsnCode:"3808", minStock:8,  createdAt:"2024-01-01" },
  { id:"p6", name:"Imidacloprid 17.8SL",category:"Pesticide",  unit:"250ml",        purchasePrice:190, salePrice:230,  stock:30,  hsnCode:"3808", minStock:5,  createdAt:"2024-01-01" },
  { id:"p7", name:"Mancozeb 75WP",      category:"Pesticide",  unit:"100g",         purchasePrice:55,  salePrice:70,   stock:25,  hsnCode:"3808", minStock:5,  createdAt:"2024-01-01" },
  { id:"p8", name:"BT Hybrid Cotton",   category:"Seeds",      unit:"Packet (450g)",purchasePrice:780, salePrice:880,  stock:200, hsnCode:"1207", minStock:20, createdAt:"2024-01-01" },
  { id:"p9", name:"Groundnut Seeds",    category:"Seeds",      unit:"Kg",           purchasePrice:80,  salePrice:98,   stock:300, hsnCode:"1202", minStock:30, createdAt:"2024-01-01" },
  { id:"p10",name:"Drip Lateral Pipe",  category:"Irrigation", unit:"Roll (100m)",  purchasePrice:560, salePrice:650,  stock:35,  hsnCode:"3917", minStock:5,  createdAt:"2024-01-01" },
  { id:"p11",name:"Sprinkler Head",     category:"Irrigation", unit:"Piece",        purchasePrice:45,  salePrice:60,   stock:80,  hsnCode:"8424", minStock:10, createdAt:"2024-01-01" },
  { id:"p12",name:"Garden Sprayer 16L", category:"Tools",      unit:"Piece",        purchasePrice:520, salePrice:650,  stock:15,  hsnCode:"8424", minStock:3,  createdAt:"2024-01-01" },
];

const SEED_CUSTOMERS: Customer[] = [
  { id:"c1", name:"Ramesh Patel",  phone:"9876543210", email:"ramesh@gmail.com", address:"Anjar, Kutchh",  gstNo:"24AAAAA0000A1Z5", openingBalance:0,    createdAt:"2024-01-01" },
  { id:"c2", name:"Bhavesh Jadeja",phone:"9988776655", email:"",                 address:"Bhuj, Kutchh",   gstNo:"",               openingBalance:2500, createdAt:"2024-01-01" },
  { id:"c3", name:"Naresh Bhatt",  phone:"9001122334", email:"naresh@gmail.com", address:"Mundra, Kutchh", gstNo:"",               openingBalance:0,    createdAt:"2024-01-01" },
  { id:"c4", name:"Jignesh Solanki",phone:"9123456780",email:"",                 address:"Rapar, Kutchh",  gstNo:"",               openingBalance:1800, createdAt:"2024-01-02" },
];

const SEED_SUPPLIERS: Supplier[] = [
  { id:"s1", name:"Agromax Distributors", phone:"9000111222", email:"agromax@mail.com", address:"Ahmedabad, Gujarat", gstNo:"24BBBBB0000B1Z5", openingBalance:0,    createdAt:"2024-01-01" },
  { id:"s2", name:"Krushi Seva Kendra",   phone:"9000333444", email:"",                 address:"Rajkot, Gujarat",    gstNo:"24CCCCC0000C1Z5", openingBalance:5000, createdAt:"2024-01-01" },
  { id:"s3", name:"Seed India Pvt Ltd",   phone:"9000555666", email:"seeds@india.com",  address:"Surat, Gujarat",     gstNo:"24DDDDD0000D1Z5", openingBalance:0,    createdAt:"2024-01-02" },
];

// ─── LocalStorage helpers ──────────────────────────────────────────────────────
const isBrowser = () => typeof window !== "undefined";

function load<T>(key: string, seed: T): T {
  if (!isBrowser()) return seed;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  } catch { return seed; }
}

function save<T>(key: string, data: T): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Store API ─────────────────────────────────────────────────────────────────
export const Store = {
  // Products
  getProducts: (): Product[] => load("agro_products", SEED_PRODUCTS),
  setProducts: (d: Product[]) => save("agro_products", d),

  // Customers
  getCustomers: (): Customer[] => load("agro_customers", SEED_CUSTOMERS),
  setCustomers: (d: Customer[]) => save("agro_customers", d),

  // Suppliers
  getSuppliers: (): Supplier[] => load("agro_suppliers", SEED_SUPPLIERS),
  setSuppliers: (d: Supplier[]) => save("agro_suppliers", d),

  // Sales
  getSales: (): SaleInvoice[] => load("agro_sales", []),
  setSales: (d: SaleInvoice[]) => save("agro_sales", d),

  // Purchases
  getPurchases: (): PurchaseInvoice[] => load("agro_purchases", []),
  setPurchases: (d: PurchaseInvoice[]) => save("agro_purchases", d),

  // Ledger
  getLedger: (): LedgerEntry[] => load("agro_ledger", []),
  setLedger: (d: LedgerEntry[]) => save("agro_ledger", d),

  // Expenses
  getExpenses: (): Expense[] => load("agro_expenses", []),
  setExpenses: (d: Expense[]) => save("agro_expenses", d),

  // Clear all (reset)
  reset: () => {
    ["agro_products","agro_customers","agro_suppliers","agro_sales","agro_purchases","agro_ledger","agro_expenses"]
      .forEach(k => localStorage.removeItem(k));
  },
};

// ─── Utilities ─────────────────────────────────────────────────────────────────
export const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
export const todayStr = () => new Date().toISOString().slice(0,10);
export const fmtDate = (d: string) => {
  if (!d) return "";
  const [y,m,day] = d.split("-");
  return `${day}/${m}/${y}`;
};
export const fmtMoney = (n: number) =>
  `₹${Number(n||0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const CATEGORIES: Category[] = ["Fertilizer","Pesticide","Seeds","Irrigation","Tools","Other"];
export const PAY_MODES: PayMode[]   = ["Cash","UPI","Credit","Cheque","Bank Transfer"];
export const EXPENSE_CATS           = ["Rent","Salary","Electricity","Transport","Marketing","Miscellaneous"];