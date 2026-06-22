"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, fmtMoney, fmtDate } from "@/lib/store";
import type { SaleInvoice, Product } from "@/lib/store";
import { StatCard, PageHeader } from "@/components/ui";
import {
  ShoppingCart, Truck, Package, Users, TrendingUp,
  AlertTriangle, IndianRupee, Receipt, ArrowRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";

export default function DashboardPage() {
  const [sales, setSales]       = useState<SaleInvoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    setSales(Store.getSales());
    setProducts(Store.getProducts());
    setReady(true);
  }, []);

  if (!ready) return null;

  const totalRevenue  = sales.reduce((s, i) => s + i.total, 0);
  const totalReceived = sales.reduce((s, i) => s + i.paidAmount, 0);
  const outstanding   = sales.reduce((s, i) => s + i.balanceDue, 0);
  const lowStock      = products.filter(p => p.stock <= p.minStock);
  const stockValue    = products.reduce((s, p) => s + p.salePrice * p.stock, 0);

  // Last 7 days chart
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
    const rev = sales.filter(s => s.date === key).reduce((a, s) => a + s.total, 0);
    return { day: dayName, revenue: rev };
  });

  // Category-wise stock
  const catMap: Record<string, number> = {};
  products.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + p.stock; });
  const catData = Object.entries(catMap).map(([cat, qty]) => ({ cat, qty }));

  const recentSales = sales.slice(-5).reverse();

  return (
    <div className="page-enter">
      <PageHeader title="Dashboard" subtitle="Welcome back! Here's your business overview." />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Revenue"   value={fmtMoney(totalRevenue)}  sub={`${sales.length} invoices`} color="#16a34a" icon={IndianRupee} />
        <StatCard label="Amount Received" value={fmtMoney(totalReceived)} sub="collected so far"            color="#2563eb" icon={TrendingUp} />
        <StatCard label="Outstanding"     value={fmtMoney(outstanding)}   sub="pending collection"          color="#dc2626" icon={Receipt} />
        <StatCard label="Stock Value"     value={fmtMoney(stockValue)}    sub={`${products.length} products`} color="#7c3aed" icon={Package} />
        <StatCard label="Low Stock Items" value={lowStock.length}         sub="need restocking"             color="#f59e0b" icon={AlertTriangle} />
        <StatCard label="Total Customers" value={Store.getCustomers().length} sub="registered"             color="#0891b2" icon={Users} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 18 }}>Revenue – Last 7 Days</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={last7}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
              <Tooltip formatter={(v: any) => [fmtMoney(v), "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 18 }}>Stock by Category</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="cat" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="qty" name="Units" fill="#16a34a" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div style={{ background: "#fff7ed", border: "2px solid #fb923c", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "#c2410c", marginBottom: 10 }}>
            <AlertTriangle size={18} /> Low Stock Alert
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {lowStock.map(p => (
              <span key={p.id} style={{ background: "#fed7aa", borderRadius: 20, padding: "4px 12px", fontSize: 12.5, fontWeight: 600, color: "#9a3412" }}>
                {p.name} — {p.stock} {p.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent sales */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>Recent Sales</div>
          <Link href="/sales" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>View All <ArrowRight size={14} /></Link>
        </div>
        {recentSales.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No sales yet. <Link href="/sales" style={{ color: "#16a34a" }}>Create your first invoice →</Link></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th><th>Customer</th><th>Date</th><th>Total</th><th>Paid</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700, color: "#16a34a" }}>{inv.invoiceNo}</td>
                  <td style={{ fontWeight: 500 }}>{inv.customerName}</td>
                  <td style={{ color: "#64748b" }}>{fmtDate(inv.date)}</td>
                  <td style={{ fontWeight: 700 }}>{fmtMoney(inv.total)}</td>
                  <td>{fmtMoney(inv.paidAmount)}</td>
                  <td>
                    <span className={`badge ${inv.status==="paid"?"badge-green":inv.status==="partial"?"badge-yellow":"badge-red"}`}>
                      {inv.status.charAt(0).toUpperCase()+inv.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
