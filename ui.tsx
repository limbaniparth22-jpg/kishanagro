"use client";
import { useEffect, useRef, ReactNode } from "react";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, maxWidth = 520 }: {
  title: string; onClose: () => void; children: ReactNode; maxWidth?: number;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, background: "#fff", zIndex: 1, borderRadius: "18px 18px 0 0" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#166534" }}>{title}</h3>
          <button onClick={onClose} className="btn btn-secondary btn-icon"><X size={18} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ msg, type = "success", onClose }: {
  msg: string; type?: "success" | "error" | "info"; onClose: () => void;
}) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const cfg = {
    success: { bg: "#16a34a", Icon: CheckCircle },
    error:   { bg: "#dc2626", Icon: AlertTriangle },
    info:    { bg: "#2563eb", Icon: Info },
  }[type];
  return (
    <div className="toast" style={{ background: cfg.bg }}>
      <cfg.Icon size={17} />
      {msg}
    </div>
  );
}

// ── Confirm dialog ─────────────────────────────────────────────────────────────
export function Confirm({ msg, onYes, onNo }: { msg: string; onYes: () => void; onNo: () => void }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 380 }}>
        <div style={{ padding: 28, textAlign: "center" }}>
          <AlertTriangle size={44} color="#f59e0b" style={{ marginBottom: 14 }} />
          <p style={{ margin: "0 0 22px", fontSize: 15, color: "#374151", lineHeight: 1.5 }}>{msg}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onYes} className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }}>Delete</button>
            <button onClick={onNo}  className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = "#16a34a", icon: Icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: any;
}) {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: "#64748b", marginTop: 5 }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={22} color={color} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
export function Field({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="field-label">{label}{required && <span style={{ color: "#dc2626" }}> *</span>}</label>
      {children}
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#14532d", fontFamily: "var(--font-display)" }}>{title}</h2>
        {subtitle && <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div style={{ padding: "60px 20px", textAlign: "center", color: "#94a3b8" }}>
      <Icon size={48} style={{ marginBottom: 14, opacity: .4 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

// ── SearchBar ────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ position: "relative" }}>
      <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? "Search…"}
        className="field-input" style={{ paddingLeft: 38 }} />
    </div>
  );
}