"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Truck,
  Users, UserCheck, BookOpen, BarChart2, DollarSign,
  Menu, X, Leaf, ChevronDown
} from "lucide-react";

const NAV = [
  { label: "Dashboard",   href: "/",             icon: LayoutDashboard },
  { label: "Stock",       href: "/stock",         icon: Package },
  { label: "Sales",       href: "/sales",         icon: ShoppingCart },
  { label: "Purchases",   href: "/purchases",     icon: Truck },
  { label: "Customers",   href: "/customers",     icon: Users },
  { label: "Suppliers",   href: "/suppliers",     icon: UserCheck },
  { label: "Ledger",      href: "/ledger",        icon: BookOpen },
  { label: "Expenses",    href: "/expenses",      icon: DollarSign },
  { label: "Reports",     href: "/reports",       icon: BarChart2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false); }, [path]);

  return (
    <>
      {/* Sidebar */}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        {/* Logo */}
        <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#4ade80,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Leaf size={22} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", color: "#fff", fontSize: 18, fontWeight: 900, lineHeight: 1.1 }}>AgroERP</div>
              <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11 }}>Retail Manager</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 0" }}>
          <div style={{ padding: "6px 18px 4px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: "1.2px" }}>MAIN MENU</div>
          {NAV.map(n => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`nav-link ${active ? "active" : ""}`}>
                <n.icon size={17} strokeWidth={active ? 2.5 : 2} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,.08)", fontSize: 11, color: "rgba(255,255,255,.3)", textAlign: "center" }}>
          Galaxy Automation © 2025
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 40 }} />
      )}

      {/* Main */}
      <div className="main-content">
        {/* Top header */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30,
          background: scrolled ? "rgba(255,255,255,.95)" : "#fff",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 24px", height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transition: "background .2s",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setOpen(!open)} className="btn btn-secondary btn-icon" style={{ display: "none" }}
              // show only on mobile via CSS — handled by media query override below
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
              {NAV.find(n => n.href === "/" ? path === "/" : path.startsWith(n.href))?.label ?? "AgroERP"}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              {new Date().toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
            </div>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#4ade80,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700 }}>
              A
            </div>
          </div>
        </header>

        {/* Mobile menu button visible via CSS */}
        <style>{`
          @media (max-width: 768px) {
            header button { display: flex !important; }
          }
        `}</style>

        {/* Page content */}
        <main style={{ padding: "24px 24px 48px", maxWidth: 1280, margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </>
  );
}