import { useState, useEffect, useRef } from "react";

// ─── Seed Data ───────────────────────────────────────────────────────────────
const INIT_PRODUCTS = [
  { id: 1, name: "Urea Fertilizer", category: "Fertilizer", unit: "Bag (50kg)", price: 280, stock: 120 },
  { id: 2, name: "DAP Fertilizer", category: "Fertilizer", unit: "Bag (50kg)", price: 1350, stock: 85 },
  { id: 3, name: "NPK 19:19:19", category: "Fertilizer", unit: "Bag (50kg)", price: 1100, stock: 60 },
  { id: 4, name: "Chlorpyrifos 20EC", category: "Pesticide", unit: "Litre", price: 420, stock: 45 },
  { id: 5, name: "Imidacloprid 17.8SL", category: "Pesticide", unit: "100ml", price: 210, stock: 30 },
  { id: 6, name: "BT Hybrid Cotton Seeds", category: "Seeds", unit: "Packet (450g)", price: 850, stock: 200 },
  { id: 7, name: "Groundnut Seeds", category: "Seeds", unit: "Kg", price: 95, stock: 300 },
  { id: 8, name: "Drip Lateral Pipe", category: "Irrigation", unit: "Roll (100m)", price: 620, stock: 40 },
];

const INIT_CUSTOMERS = [
  { id: 1, name: "Ramesh Patel", phone: "9876543210", address: "Anjar, Kutchh" },
  { id: 2, name: "Bhavesh Jadeja", phone: "9988776655", address: "Bhuj, Kutchh" },
  { id: 3, name: "Naresh Bhatt", phone: "9001122334", address: "Mundra, Kutchh" },
];

const CATEGORIES = ["All", "Fertilizer", "Pesticide", "Seeds", "Irrigation", "Other"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const genId = () => Date.now() + Math.floor(Math.random() * 1000);
const today = () => new Date().toLocaleDateString("en-IN");
const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const Icon = ({ d, size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  home:     "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  stock:    "M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M12 12h.01",
  invoice:  "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  customer: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  chart:    "M18 20V10 M12 20V4 M6 20v-6",
  plus:     "M12 5v14 M5 12h14",
  trash:    "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
  edit:     "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  search:   "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  print:    "M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z",
  alert:    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  check:    "M20 6L9 17l-5-5",
  close:    "M18 6L6 18 M6 6l12 12",
  down:     "M6 9l6 6 6-6",
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2800); return () => clearTimeout(t); }, []);
  const bg = type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#d97706";
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: bg, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 10, animation: "slideUp .3s ease" }}>
      <Icon d={type === "success" ? Icons.check : Icons.alert} size={16} />
      {msg}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: wide ? 760 : 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#166534" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "#6b7280" }}><Icon d={Icons.close} size={20} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Input / Select helpers ───────────────────────────────────────────────────
const inp = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #d1d5db", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

// ════════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════════
export default function AgroApp() {
  const [tab, setTab] = useState("dashboard");
  const [products, setProducts] = useState(INIT_PRODUCTS);
  const [customers, setCustomers] = useState(INIT_CUSTOMERS);
  const [invoices, setInvoices] = useState([]);
  const [toast, setToast] = useState(null);

  const notify = (msg, type = "success") => setToast({ msg, type });

  // Low stock list
  const lowStock = products.filter(p => p.stock <= 20);

  const tabs = [
    { key: "dashboard", label: "Dashboard", icon: Icons.home },
    { key: "stock",     label: "Stock",     icon: Icons.stock },
    { key: "invoice",   label: "Sales",     icon: Icons.invoice },
    { key: "customers", label: "Customers", icon: Icons.customer },
    { key: "reports",   label: "Reports",   icon: Icons.chart },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", background: "#f0fdf4", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .page { animation: fadeIn .25s ease; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #86efac; border-radius: 3px; }
        button:hover { opacity: .87; }
        .nav-btn:hover { background: #dcfce7 !important; }
        .nav-btn.active { background: #166534 !important; color: #fff !important; }
        .nav-btn.active svg { stroke: #fff !important; }
        .row-hover:hover { background: #f0fdf4 !important; }
        input:focus, select:focus, textarea:focus { border-color: #16a34a !important; box-shadow: 0 0 0 3px rgba(22,163,74,.15); }
      `}</style>

      {/* Header */}
      <header style={{ background: "linear-gradient(135deg,#14532d,#166534)", color: "#fff", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "#86efac", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🌾</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: .3 }}>KisanKart Manager</div>
            <div style={{ fontSize: 11, opacity: .75 }}>Agro Retail Shop Management</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 13 }}>
          {lowStock.length > 0 && (
            <div style={{ background: "#dc2626", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              <Icon d={Icons.alert} size={14} /> {lowStock.length} Low Stock
            </div>
          )}
          <span style={{ opacity: .7, fontSize: 12 }}>{today()}</span>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "2px solid #dcfce7", padding: "8px 20px", display: "flex", gap: 6, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`nav-btn${tab === t.key ? " active" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", background: "transparent", color: "#374151", transition: "all .2s" }}>
            <Icon d={t.icon} size={16} />
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: "24px 20px", maxWidth: 1100, width: "100%", margin: "0 auto" }}>
        {tab === "dashboard" && <Dashboard products={products} invoices={invoices} customers={customers} lowStock={lowStock} setTab={setTab} />}
        {tab === "stock"     && <StockPage products={products} setProducts={setProducts} notify={notify} />}
        {tab === "invoice"   && <InvoicePage products={products} setProducts={setProducts} customers={customers} invoices={invoices} setInvoices={setInvoices} notify={notify} />}
        {tab === "customers" && <CustomersPage customers={customers} setCustomers={setCustomers} notify={notify} />}
        {tab === "reports"   && <ReportsPage invoices={invoices} products={products} />}
      </main>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════════════
function Dashboard({ products, invoices, customers, lowStock, setTab }) {
  const totalRevenue = invoices.reduce((s, inv) => s + inv.total, 0);
  const todayInv = invoices.filter(i => i.date === today());
  const stockValue = products.reduce((s, p) => s + p.price * p.stock, 0);

  const cards = [
    { label: "Total Products", value: products.length, icon: "📦", color: "#dcfce7", accent: "#16a34a", tab: "stock" },
    { label: "Total Customers", value: customers.length, icon: "👨‍🌾", color: "#dbeafe", accent: "#1d4ed8", tab: "customers" },
    { label: "Total Invoices", value: invoices.length, icon: "🧾", color: "#fef9c3", accent: "#ca8a04", tab: "invoice" },
    { label: "Today's Sales", value: todayInv.length, icon: "📈", color: "#ede9fe", accent: "#7c3aed", tab: "invoice" },
    { label: "Stock Value", value: fmt(stockValue), icon: "💰", color: "#fce7f3", accent: "#be185d", tab: "stock" },
    { label: "Total Revenue", value: fmt(totalRevenue), icon: "💵", color: "#dcfce7", accent: "#15803d", tab: "reports" },
  ];

  return (
    <div className="page">
      <h2 style={{ margin: "0 0 20px", color: "#14532d", fontSize: 22, fontWeight: 800 }}>Dashboard Overview</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
        {cards.map(c => (
          <div key={c.label} onClick={() => setTab(c.tab)} style={{ background: c.color, borderRadius: 14, padding: "20px 18px", cursor: "pointer", border: `2px solid transparent`, transition: "all .2s", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = c.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}>
            <div style={{ fontSize: 28 }}>{c.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.accent, marginTop: 8 }}>{c.value}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div style={{ background: "#fff7ed", border: "2px solid #fb923c", borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, color: "#c2410c", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon d={Icons.alert} color="#c2410c" /> Low Stock Alert ({lowStock.length} items)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {lowStock.map(p => (
              <span key={p.id} style={{ background: "#fed7aa", borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 600, color: "#9a3412" }}>
                {p.name} — {p.stock} {p.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {invoices.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
          <div style={{ fontWeight: 700, color: "#14532d", marginBottom: 14, fontSize: 16 }}>Recent Invoices</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f0fdf4" }}>
                {["Invoice #","Customer","Date","Items","Total","Status"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#166534", fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.slice(-5).reverse().map(inv => (
                <tr key={inv.id} className="row-hover" style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#166534" }}>#{inv.id}</td>
                  <td style={{ padding: "10px 12px" }}>{inv.customerName}</td>
                  <td style={{ padding: "10px 12px", color: "#6b7280" }}>{inv.date}</td>
                  <td style={{ padding: "10px 12px" }}>{inv.items.length}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>{fmt(inv.total)}</td>
                  <td style={{ padding: "10px 12px" }}><span style={{ background: "#dcfce7", color: "#166534", borderRadius: 20, padding: "2px 12px", fontSize: 12, fontWeight: 700 }}>Paid</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// STOCK PAGE
// ════════════════════════════════════════════════════════════════════════════════
function StockPage({ products, setProducts, notify }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [modal, setModal] = useState(null); // null | 'add' | product(edit)
  const [form, setForm] = useState({ name: "", category: "Fertilizer", unit: "", price: "", stock: "" });
  const [restockProd, setRestockProd] = useState(null);
  const [restockQty, setRestockQty] = useState("");

  const filtered = products.filter(p =>
    (catFilter === "All" || p.category === catFilter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm({ name: "", category: "Fertilizer", unit: "", price: "", stock: "" }); setModal("add"); };
  const openEdit = (p) => { setForm({ ...p }); setModal(p); };

  const save = () => {
    if (!form.name || !form.unit || !form.price || !form.stock) { notify("Fill all fields", "error"); return; }
    if (modal === "add") {
      setProducts(prev => [...prev, { ...form, id: genId(), price: +form.price, stock: +form.stock }]);
      notify("Product added!");
    } else {
      setProducts(prev => prev.map(p => p.id === form.id ? { ...form, price: +form.price, stock: +form.stock } : p));
      notify("Product updated!");
    }
    setModal(null);
  };

  const del = (id) => { setProducts(prev => prev.filter(p => p.id !== id)); notify("Product deleted", "error"); };

  const restock = () => {
    if (!restockQty || +restockQty <= 0) { notify("Enter valid qty", "error"); return; }
    setProducts(prev => prev.map(p => p.id === restockProd.id ? { ...p, stock: p.stock + +restockQty } : p));
    notify(`Restocked ${restockProd.name} by ${restockQty} units`);
    setRestockProd(null); setRestockQty("");
  };

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0, color: "#14532d", fontSize: 22, fontWeight: 800 }}>Stock Management</h2>
        <button onClick={openAdd} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon d={Icons.plus} size={16} color="#fff" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><Icon d={Icons.search} size={16} color="#9ca3af" /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product..." style={{ ...inp, paddingLeft: 38 }} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...inp, width: "auto" }}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#14532d", color: "#fff" }}>
              {["Product","Category","Unit","Price","Stock","Status","Actions"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700, fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="row-hover" style={{ borderTop: "1px solid #e5e7eb" }}>
                <td style={{ padding: "12px 14px", fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: "12px 14px" }}><span style={{ background: "#dcfce7", color: "#166534", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{p.category}</span></td>
                <td style={{ padding: "12px 14px", color: "#6b7280" }}>{p.unit}</td>
                <td style={{ padding: "12px 14px", fontWeight: 700 }}>{fmt(p.price)}</td>
                <td style={{ padding: "12px 14px", fontWeight: 700, color: p.stock <= 20 ? "#dc2626" : p.stock <= 50 ? "#d97706" : "#16a34a" }}>{p.stock}</td>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{ background: p.stock <= 20 ? "#fee2e2" : p.stock <= 50 ? "#fef9c3" : "#dcfce7", color: p.stock <= 20 ? "#dc2626" : p.stock <= 50 ? "#92400e" : "#166534", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                    {p.stock <= 20 ? "Low" : p.stock <= 50 ? "Medium" : "Good"}
                  </span>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(p)} style={{ background: "#dbeafe", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer", color: "#1d4ed8" }}><Icon d={Icons.edit} size={15} color="#1d4ed8" /></button>
                    <button onClick={() => { setRestockProd(p); setRestockQty(""); }} style={{ background: "#dcfce7", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}><Icon d={Icons.plus} size={15} color="#16a34a" /></button>
                    <button onClick={() => del(p.id)} style={{ background: "#fee2e2", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}><Icon d={Icons.trash} size={15} color="#dc2626" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {modal !== null && (
        <Modal title={modal === "add" ? "Add New Product" : "Edit Product"} onClose={() => setModal(null)}>
          {[
            { label: "Product Name", key: "name", type: "text" },
            { label: "Unit (e.g. Bag, Litre, Kg)", key: "unit", type: "text" },
            { label: "Price (₹)", key: "price", type: "number" },
            { label: "Stock Quantity", key: "stock", type: "number" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 }}>{f.label}</label>
              <input type={f.type} value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inp} />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 }}>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inp}>
              {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={save} style={{ flex: 1, background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>Save</button>
            <button onClick={() => setModal(null)} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Restock Modal */}
      {restockProd && (
        <Modal title={`Restock: ${restockProd.name}`} onClose={() => setRestockProd(null)}>
          <p style={{ color: "#6b7280", marginTop: 0 }}>Current stock: <strong>{restockProd.stock} {restockProd.unit}</strong></p>
          <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 }}>Add Quantity</label>
          <input type="number" value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder="e.g. 50" style={{ ...inp, marginBottom: 20 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={restock} style={{ flex: 1, background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, cursor: "pointer" }}>Add Stock</button>
            <button onClick={() => setRestockProd(null)} style={{ flex: 1, background: "#f3f4f6", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// INVOICE PAGE
// ════════════════════════════════════════════════════════════════════════════════
function InvoicePage({ products, setProducts, customers, invoices, setInvoices, notify }) {
  const [showCreate, setShowCreate] = useState(false);
  const [viewInv, setViewInv] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = invoices.filter(i =>
    i.customerName.toLowerCase().includes(search.toLowerCase()) ||
    String(i.id).includes(search)
  );

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0, color: "#14532d", fontSize: 22, fontWeight: 800 }}>Sales Invoices</h2>
        <button onClick={() => setShowCreate(true)} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon d={Icons.plus} size={16} color="#fff" /> New Invoice
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><Icon d={Icons.search} size={16} color="#9ca3af" /></span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer or invoice #..." style={{ ...inp, paddingLeft: 38 }} />
      </div>

      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#14532d", color: "#fff" }}>
              {["Invoice #","Customer","Date","Items","Subtotal","GST","Total","Action"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700, fontSize: 13 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice().reverse().map(inv => (
              <tr key={inv.id} className="row-hover" style={{ borderTop: "1px solid #e5e7eb" }}>
                <td style={{ padding: "12px 14px", fontWeight: 700, color: "#166534" }}>#{inv.id}</td>
                <td style={{ padding: "12px 14px", fontWeight: 600 }}>{inv.customerName}</td>
                <td style={{ padding: "12px 14px", color: "#6b7280" }}>{inv.date}</td>
                <td style={{ padding: "12px 14px" }}>{inv.items.length}</td>
                <td style={{ padding: "12px 14px" }}>{fmt(inv.subtotal)}</td>
                <td style={{ padding: "12px 14px" }}>{fmt(inv.gst)}</td>
                <td style={{ padding: "12px 14px", fontWeight: 800, color: "#16a34a" }}>{fmt(inv.total)}</td>
                <td style={{ padding: "12px 14px" }}>
                  <button onClick={() => setViewInv(inv)} style={{ background: "#dcfce7", border: "none", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#166534" }}>View</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>No invoices yet. Create your first sale!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateInvoice products={products} setProducts={setProducts} customers={customers} invoices={invoices} setInvoices={setInvoices} notify={notify} onClose={() => setShowCreate(false)} />
      )}
      {viewInv && <InvoiceView inv={viewInv} onClose={() => setViewInv(null)} />}
    </div>
  );
}

function CreateInvoice({ products, setProducts, customers, invoices, setInvoices, notify, onClose }) {
  const [custSearch, setCustSearch] = useState("");
  const [selectedCust, setSelectedCust] = useState(null);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [items, setItems] = useState([]);
  const [selProd, setSelProd] = useState("");
  const [qty, setQty] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [gstRate, setGstRate] = useState(5);
  const [payMode, setPayMode] = useState("Cash");
  const [notes, setNotes] = useState("");

  const addItem = () => {
    const prod = products.find(p => p.id === +selProd);
    if (!prod) { notify("Select a product", "error"); return; }
    if (qty <= 0) { notify("Invalid quantity", "error"); return; }
    if (qty > prod.stock) { notify(`Only ${prod.stock} ${prod.unit} in stock`, "error"); return; }
    const existing = items.find(i => i.productId === prod.id);
    if (existing) {
      const newQty = existing.qty + +qty;
      if (newQty > prod.stock) { notify("Not enough stock", "error"); return; }
      setItems(prev => prev.map(i => i.productId === prod.id ? { ...i, qty: newQty, amount: newQty * i.price } : i));
    } else {
      setItems(prev => [...prev, { productId: prod.id, name: prod.name, unit: prod.unit, price: prod.price, qty: +qty, amount: prod.price * +qty }]);
    }
    setSelProd(""); setQty(1);
  };

  const removeItem = (pid) => setItems(prev => prev.filter(i => i.productId !== pid));

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const discAmt = (subtotal * discount) / 100;
  const afterDisc = subtotal - discAmt;
  const gstAmt = (afterDisc * gstRate) / 100;
  const total = afterDisc + gstAmt;

  const generate = () => {
    if (items.length === 0) { notify("Add at least one item", "error"); return; }
    const custName = selectedCust ? selectedCust.name : newCustName || "Walk-in Customer";
    const custPhone = selectedCust ? selectedCust.phone : newCustPhone;
    const newInv = {
      id: (invoices.length + 1).toString().padStart(4, "0"),
      customerName: custName, customerPhone: custPhone,
      date: today(), items, subtotal, discAmt, gstRate, gst: gstAmt, total, payMode, notes,
    };
    // Deduct stock
    items.forEach(item => {
      setProducts(prev => prev.map(p => p.id === item.productId ? { ...p, stock: p.stock - item.qty } : p));
    });
    setInvoices(prev => [...prev, newInv]);
    notify("Invoice created successfully! 🎉");
    onClose();
  };

  const filteredCust = customers.filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.phone.includes(custSearch));

  return (
    <Modal title="Create New Invoice" onClose={onClose} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left */}
        <div>
          <div style={{ fontWeight: 700, color: "#166534", marginBottom: 12, fontSize: 15 }}>Customer Details</div>
          <input value={custSearch} onChange={e => { setCustSearch(e.target.value); setSelectedCust(null); }} placeholder="Search existing customer..." style={{ ...inp, marginBottom: 8 }} />
          {custSearch && filteredCust.length > 0 && !selectedCust && (
            <div style={{ border: "1px solid #d1d5db", borderRadius: 8, marginBottom: 8, maxHeight: 140, overflowY: "auto", background: "#fff" }}>
              {filteredCust.map(c => (
                <div key={c.id} onClick={() => { setSelectedCust(c); setCustSearch(c.name); }} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14, borderBottom: "1px solid #f3f4f6" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <strong>{c.name}</strong> · {c.phone}
                </div>
              ))}
            </div>
          )}
          {!selectedCust && (
            <div>
              <input value={newCustName} onChange={e => setNewCustName(e.target.value)} placeholder="Or enter new customer name" style={{ ...inp, marginBottom: 8 }} />
              <input value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} placeholder="Phone number" style={{ ...inp, marginBottom: 8 }} />
            </div>
          )}
          {selectedCust && <div style={{ background: "#dcfce7", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#166534" }}>✓ {selectedCust.name} · {selectedCust.phone}</div>}

          <div style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 700, color: "#166534", marginBottom: 12, fontSize: 15 }}>Payment & Notes</div>
            <select value={payMode} onChange={e => setPayMode(e.target.value)} style={{ ...inp, marginBottom: 8 }}>
              {["Cash","UPI","Credit","Cheque"].map(m => <option key={m}>{m}</option>)}
            </select>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Discount %</label>
                <input type="number" value={discount} min={0} max={100} onChange={e => setDiscount(+e.target.value)} style={inp} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>GST %</label>
                <input type="number" value={gstRate} min={0} onChange={e => setGstRate(+e.target.value)} style={inp} />
              </div>
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} style={{ ...inp, resize: "vertical" }} />
          </div>
        </div>

        {/* Right */}
        <div>
          <div style={{ fontWeight: 700, color: "#166534", marginBottom: 12, fontSize: 15 }}>Add Products</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <select value={selProd} onChange={e => setSelProd(e.target.value)} style={{ ...inp, flex: 2 }}>
              <option value="">-- Select Product --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit})</option>)}
            </select>
            <input type="number" value={qty} min={1} onChange={e => setQty(+e.target.value)} style={{ ...inp, flex: 1 }} />
            <button onClick={addItem} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}>Add</button>
          </div>

          <div style={{ background: "#f9fafb", borderRadius: 10, minHeight: 160, padding: 8 }}>
            {items.length === 0 && <div style={{ color: "#9ca3af", textAlign: "center", padding: 20, fontSize: 13 }}>No items added</div>}
            {items.map(i => (
              <div key={i.productId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "#fff", borderRadius: 8, marginBottom: 6, border: "1px solid #e5e7eb" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{i.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{i.qty} × {fmt(i.price)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <strong style={{ fontSize: 15 }}>{fmt(i.amount)}</strong>
                  <button onClick={() => removeItem(i.productId)} style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}><Icon d={Icons.trash} size={13} color="#dc2626" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ background: "#14532d", color: "#fff", borderRadius: 12, padding: "16px 18px", marginTop: 14 }}>
            {[
              ["Subtotal", fmt(subtotal)],
              discount > 0 ? [`Discount (${discount}%)`, `-${fmt(discAmt)}`] : null,
              [`GST (${gstRate}%)`, fmt(gstAmt)],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 14, opacity: .85 }}>
                <span>{k}</span><span>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.3)", fontWeight: 800, fontSize: 18 }}>
              <span>TOTAL</span><span>{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <button onClick={generate} style={{ width: "100%", marginTop: 20, background: "#16a34a", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 800, cursor: "pointer", fontSize: 16 }}>
        🧾 Generate Invoice
      </button>
    </Modal>
  );
}

function InvoiceView({ inv, onClose }) {
  return (
    <Modal title={`Invoice #${inv.id}`} onClose={onClose} wide>
      <div style={{ fontFamily: "monospace", fontSize: 13 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#14532d" }}>🌾 KisanKart Agro Store</div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>Tax Invoice</div>
          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>Invoice #{inv.id} · {inv.date}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, padding: "10px 14px", background: "#f0fdf4", borderRadius: 8 }}>
          <div><strong>Customer:</strong> {inv.customerName}<br /><span style={{ color: "#6b7280" }}>{inv.customerPhone}</span></div>
          <div style={{ textAlign: "right" }}><strong>Payment:</strong> {inv.payMode}</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#14532d", color: "#fff" }}>
              {["#","Product","Qty","Rate","Amount"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "8px 10px" }}>{i + 1}</td>
                <td style={{ padding: "8px 10px" }}>{item.name}</td>
                <td style={{ padding: "8px 10px" }}>{item.qty} {item.unit}</td>
                <td style={{ padding: "8px 10px" }}>{fmt(item.price)}</td>
                <td style={{ padding: "8px 10px", fontWeight: 700 }}>{fmt(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ maxWidth: 300, marginLeft: "auto", background: "#14532d", color: "#fff", borderRadius: 10, padding: "14px 18px" }}>
          {[["Subtotal", fmt(inv.subtotal)], inv.discAmt > 0 ? ["Discount", `-${fmt(inv.discAmt)}`] : null, [`GST (${inv.gstRate}%)`, fmt(inv.gst)]].filter(Boolean).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, opacity: .85, fontSize: 13 }}><span>{k}</span><span>{v}</span></div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18, borderTop: "1px solid rgba(255,255,255,.3)", paddingTop: 8, marginTop: 4 }}><span>TOTAL</span><span>{fmt(inv.total)}</span></div>
        </div>
        {inv.notes && <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef9c3", borderRadius: 8, fontSize: 13, color: "#78350f" }}><strong>Note:</strong> {inv.notes}</div>}
        <div style={{ textAlign: "center", marginTop: 16, color: "#9ca3af", fontSize: 12 }}>Thank you for your business! 🌾</div>
      </div>
      <button onClick={() => window.print()} style={{ width: "100%", marginTop: 16, background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Icon d={Icons.print} size={16} color="#fff" /> Print Invoice
      </button>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// CUSTOMERS PAGE
// ════════════════════════════════════════════════════════════════════════════════
function CustomersPage({ customers, setCustomers, notify }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [search, setSearch] = useState("");

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  const save = () => {
    if (!form.name || !form.phone) { notify("Name and phone required", "error"); return; }
    if (modal === "add") {
      setCustomers(prev => [...prev, { ...form, id: genId() }]);
      notify("Customer added!");
    } else {
      setCustomers(prev => prev.map(c => c.id === form.id ? form : c));
      notify("Customer updated!");
    }
    setModal(null);
  };

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0, color: "#14532d", fontSize: 22, fontWeight: 800 }}>Customers</h2>
        <button onClick={() => { setForm({ name: "", phone: "", address: "" }); setModal("add"); }} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon d={Icons.plus} size={16} color="#fff" /> Add Customer
        </button>
      </div>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><Icon d={Icons.search} size={16} color="#9ca3af" /></span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..." style={{ ...inp, paddingLeft: 38 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {filtered.map(c => (
          <div key={c.id} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 10px rgba(0,0,0,.06)", border: "2px solid transparent", transition: "border .2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#86efac"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#14532d" }}>{c.name}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>📞 {c.phone}</div>
                {c.address && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>📍 {c.address}</div>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { setForm(c); setModal("edit"); }} style={{ background: "#dbeafe", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}><Icon d={Icons.edit} size={14} color="#1d4ed8" /></button>
                <button onClick={() => { setCustomers(prev => prev.filter(x => x.id !== c.id)); notify("Customer removed", "error"); }} style={{ background: "#fee2e2", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}><Icon d={Icons.trash} size={14} color="#dc2626" /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#9ca3af", padding: 40 }}>No customers found</div>}
      </div>
      {modal && (
        <Modal title={modal === "add" ? "Add Customer" : "Edit Customer"} onClose={() => setModal(null)}>
          {[["Full Name","name","text"],["Phone Number","phone","tel"],["Address","address","text"]].map(([label,key,type]) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 }}>{label}</label>
              <input type={type} value={form[key]||""} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={inp} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={save} style={{ flex: 1, background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, cursor: "pointer" }}>Save</button>
            <button onClick={() => setModal(null)} style={{ flex: 1, background: "#f3f4f6", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// REPORTS PAGE
// ════════════════════════════════════════════════════════════════════════════════
function ReportsPage({ invoices, products }) {
  const totalRevenue = invoices.reduce((s, i) => s + i.total, 0);
  const totalGST = invoices.reduce((s, i) => s + i.gst, 0);
  const totalItems = invoices.reduce((s, i) => s + i.items.reduce((a, x) => a + x.qty, 0), 0);
  const avgInvoice = invoices.length ? totalRevenue / invoices.length : 0;

  // Top products
  const prodSales = {};
  invoices.forEach(inv => inv.items.forEach(item => {
    prodSales[item.name] = (prodSales[item.name] || 0) + item.amount;
  }));
  const topProds = Object.entries(prodSales).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Payment modes
  const payModes = {};
  invoices.forEach(inv => { payModes[inv.payMode] = (payModes[inv.payMode] || 0) + 1; });

  return (
    <div className="page">
      <h2 style={{ margin: "0 0 20px", color: "#14532d", fontSize: 22, fontWeight: 800 }}>Reports & Analytics</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
        {[
          ["Total Revenue", fmt(totalRevenue), "#dcfce7", "#16a34a", "💵"],
          ["Total GST Collected", fmt(totalGST), "#fef9c3", "#ca8a04", "🏛️"],
          ["Items Sold", totalItems, "#dbeafe", "#1d4ed8", "📦"],
          ["Avg Invoice Value", fmt(avgInvoice), "#ede9fe", "#7c3aed", "📊"],
        ].map(([label, val, bg, color, icon]) => (
          <div key={label} style={{ background: bg, borderRadius: 14, padding: "20px 18px", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize: 26 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 8 }}>{val}</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Top Products */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
          <div style={{ fontWeight: 700, color: "#14532d", marginBottom: 16, fontSize: 16 }}>Top Selling Products</div>
          {topProds.length === 0 && <div style={{ color: "#9ca3af", fontSize: 14 }}>No sales data yet</div>}
          {topProds.map(([name, amt], i) => (
            <div key={name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{i + 1}. {name}</span>
                <span style={{ fontWeight: 700, color: "#166534" }}>{fmt(amt)}</span>
              </div>
              <div style={{ background: "#e5e7eb", borderRadius: 4, height: 8 }}>
                <div style={{ background: "#16a34a", height: "100%", borderRadius: 4, width: `${(amt / (topProds[0]?.[1] || 1)) * 100}%`, transition: "width 1s ease" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Payment Modes & Stock */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
            <div style={{ fontWeight: 700, color: "#14532d", marginBottom: 12, fontSize: 16 }}>Payment Methods</div>
            {Object.keys(payModes).length === 0 && <div style={{ color: "#9ca3af", fontSize: 14 }}>No data yet</div>}
            {Object.entries(payModes).map(([mode, count]) => (
              <div key={mode} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 14 }}>
                <span>{mode}</span>
                <span style={{ background: "#dcfce7", color: "#166534", borderRadius: 20, padding: "2px 14px", fontWeight: 700, fontSize: 13 }}>{count} txn</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
            <div style={{ fontWeight: 700, color: "#14532d", marginBottom: 12, fontSize: 16 }}>Stock Summary</div>
            {[
              ["Total Products", products.length, "#166534"],
              ["Low Stock (≤20)", products.filter(p => p.stock <= 20).length, "#dc2626"],
              ["Medium Stock (21-50)", products.filter(p => p.stock > 20 && p.stock <= 50).length, "#d97706"],
              ["Well Stocked (>50)", products.filter(p => p.stock > 50).length, "#16a34a"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                <span style={{ color: "#6b7280" }}>{label}</span>
                <span style={{ fontWeight: 700, color }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
