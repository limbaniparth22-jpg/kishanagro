"use client";
import { useState, useEffect } from "react";
import { Store, genId, todayStr, fmtMoney, fmtDate, PAY_MODES } from "@/lib/store";
import type { SaleInvoice, InvoiceItem, Product, Customer } from "@/lib/store";
import { Modal, Toast, Confirm, PageHeader, SearchBar, Field, EmptyState } from "@/components/ui";
import { Plus, Eye, Trash2, Printer, ShoppingCart, CheckCircle, Clock } from "lucide-react";

// ─── Invoice number generator ─────────────────────────────────────────────────
const nextNo = (sales: SaleInvoice[]) => {
  const n = sales.length + 1;
  return `INV-${new Date().getFullYear()}-${String(n).padStart(4,"0")}`;
};

// ─── Print invoice ─────────────────────────────────────────────────────────────
function printInvoice(inv: SaleInvoice) {
  const w = window.open("","_blank");
  if (!w) return;
  w.document.write(`
    <html><head><title>Invoice ${inv.invoiceNo}</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;margin:0;padding:20px;color:#1e293b;font-size:13px}
      .logo{font-size:22px;font-weight:900;color:#166534}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
      .info-box{background:#f0fdf4;padding:12px 16px;border-radius:8px;margin-bottom:20px;display:flex;justify-content:space-between}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      thead tr{background:#166534;color:#fff}
      th,td{padding:8px 12px;text-align:left;font-size:12px}
      tbody tr:nth-child(even){background:#f8fffe}
      .totals{max-width:280px;margin-left:auto}
      .totals td{padding:5px 12px}
      .grand-total{font-size:16px;font-weight:900;color:#166534;border-top:2px solid #166534}
      .footer{text-align:center;margin-top:30px;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;padding-top:12px}
    </style></head>
    <body>
    <div class="header">
      <div>
        <div class="logo">🌾 KisanKart Agro Store</div>
        <div style="color:#64748b;font-size:12px;margin-top:4px">Kutchh, Gujarat · GSTIN: 24AAAAA0000A1Z5</div>
        <div style="color:#64748b;font-size:12px">Ph: +91 98765 43210</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:20px;font-weight:900;color:#dc2626">TAX INVOICE</div>
        <div style="margin-top:6px"><strong>Invoice:</strong> ${inv.invoiceNo}</div>
        <div><strong>Date:</strong> ${fmtDate(inv.date)}</div>
        <div><strong>Due:</strong> ${fmtDate(inv.dueDate)}</div>
      </div>
    </div>
    <div class="info-box">
      <div><strong>Bill To:</strong><br>${inv.customerName}<br>${inv.customerPhone}</div>
      <div><strong>Payment:</strong> ${inv.payMode}<br><strong>Status:</strong> ${inv.status.toUpperCase()}</div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Product</th><th>HSN</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Disc%</th><th>GST%</th><th>Amount</th></tr></thead>
      <tbody>
        ${inv.items.map((it,i)=>`<tr><td>${i+1}</td><td>${it.productName}</td><td>—</td><td>${it.qty}</td><td>${it.unit}</td><td>${fmtMoney(it.rate)}</td><td>${it.discount}%</td><td>${it.gstRate}%</td><td><strong>${fmtMoney(it.amount)}</strong></td></tr>`).join("")}
      </tbody>
    </table>
    <table class="totals">
      <tr><td>Subtotal</td><td style="text-align:right">${fmtMoney(inv.subtotal)}</td></tr>
      ${inv.totalDiscount>0?`<tr><td>Discount</td><td style="text-align:right;color:#dc2626">-${fmtMoney(inv.totalDiscount)}</td></tr>`:""}
      <tr><td>Taxable Amount</td><td style="text-align:right">${fmtMoney(inv.taxableAmount)}</td></tr>
      <tr><td>GST</td><td style="text-align:right">${fmtMoney(inv.totalGST)}</td></tr>
      <tr class="grand-total"><td><strong>TOTAL</strong></td><td style="text-align:right"><strong>${fmtMoney(inv.total)}</strong></td></tr>
      <tr><td>Paid</td><td style="text-align:right;color:#16a34a">${fmtMoney(inv.paidAmount)}</td></tr>
      <tr><td><strong>Balance Due</strong></td><td style="text-align:right;color:#dc2626"><strong>${fmtMoney(inv.balanceDue)}</strong></td></tr>
    </table>
    ${inv.notes?`<div style="background:#fef9c3;padding:10px 14px;border-radius:6px;font-size:12px"><strong>Note:</strong> ${inv.notes}</div>`:""}
    <div class="footer">Thank you for your business! · This is a computer generated invoice.</div>
    </body></html>
  `);
  w.document.close();
  w.print();
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SalesPage() {
  const [sales, setSales]           = useState<SaleInvoice[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [viewInv, setViewInv]       = useState<SaleInvoice|null>(null);
  const [delId, setDelId]           = useState<string|null>(null);
  const [toast, setToast]           = useState<{msg:string;type:any}|null>(null);

  useEffect(() => {
    setSales(Store.getSales());
    setProducts(Store.getProducts());
    setCustomers(Store.getCustomers());
  }, []);

  const notify = (msg:string, type:any="success") => setToast({msg,type});

  const persist = (data: SaleInvoice[]) => { setSales(data); Store.setSales(data); };

  const doDelete = () => {
    // Restore stock
    const inv = sales.find(s => s.id === delId);
    if (inv) {
      const prods = Store.getProducts();
      const updated = prods.map(p => {
        const item = inv.items.find(i => i.productId === p.id);
        return item ? { ...p, stock: p.stock + item.qty } : p;
      });
      Store.setProducts(updated);
      setProducts(updated);
    }
    persist(sales.filter(s => s.id !== delId));
    setDelId(null);
    notify("Invoice deleted & stock restored","error");
  };

  const filtered = sales.filter(s =>
    (filter === "all" || s.status === filter) &&
    (s.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
     s.customerName.toLowerCase().includes(search.toLowerCase()))
  ).slice().reverse();

  const totalRevenue  = sales.reduce((a,s) => a+s.total, 0);
  const totalPaid     = sales.reduce((a,s) => a+s.paidAmount, 0);
  const totalOut      = sales.reduce((a,s) => a+s.balanceDue, 0);

  return (
    <div className="page-enter">
      <PageHeader title="Sales & Billing"
        subtitle={`${sales.length} invoices · Revenue: ${fmtMoney(totalRevenue)}`}
        action={<button className="btn btn-primary" onClick={()=>setShowCreate(true)}><Plus size={16}/> New Invoice</button>}
      />

      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        {[
          {label:"Total Billed",  v:fmtMoney(totalRevenue), color:"#16a34a"},
          {label:"Amount Received",v:fmtMoney(totalPaid),   color:"#2563eb"},
          {label:"Outstanding",   v:fmtMoney(totalOut),     color:"#dc2626"},
        ].map(x=>(
          <div key={x.label} style={{background:"#fff",borderRadius:12,padding:"14px 18px",boxShadow:"0 1px 6px rgba(0,0,0,.06)",borderLeft:`4px solid ${x.color}`}}>
            <div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".4px"}}>{x.label}</div>
            <div style={{fontSize:22,fontWeight:800,color:x.color,marginTop:4}}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200}}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search invoice or customer…" />
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)} className="field-input" style={{width:"auto"}}>
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      <div className="card" style={{overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table className="data-table">
            <thead>
              <tr><th>Invoice #</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Paid</th><th>Balance</th><th>Mode</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length===0 && (
                <tr><td colSpan={10} style={{padding:0}}>
                  <EmptyState icon={ShoppingCart} title="No invoices found" subtitle="Create your first sale invoice" />
                </td></tr>
              )}
              {filtered.map(inv => (
                <tr key={inv.id}>
                  <td style={{fontWeight:700,color:"#166534"}}>{inv.invoiceNo}</td>
                  <td style={{fontWeight:500}}>{inv.customerName}<div style={{fontSize:11,color:"#94a3b8"}}>{inv.customerPhone}</div></td>
                  <td style={{color:"#64748b"}}>{fmtDate(inv.date)}</td>
                  <td>{inv.items.length}</td>
                  <td style={{fontWeight:700}}>{fmtMoney(inv.total)}</td>
                  <td style={{color:"#16a34a",fontWeight:600}}>{fmtMoney(inv.paidAmount)}</td>
                  <td style={{color: inv.balanceDue>0?"#dc2626":"#16a34a",fontWeight:600}}>{fmtMoney(inv.balanceDue)}</td>
                  <td><span className="badge badge-gray">{inv.payMode}</span></td>
                  <td>
                    <span className={`badge ${inv.status==="paid"?"badge-green":inv.status==="partial"?"badge-yellow":"badge-red"}`}>
                      {inv.status==="paid"?<CheckCircle size={11} style={{marginRight:3}}/>:<Clock size={11} style={{marginRight:3}}/>}
                      {inv.status.charAt(0).toUpperCase()+inv.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div style={{display:"flex",gap:5}}>
                      <button className="btn btn-secondary btn-icon" title="View" onClick={()=>setViewInv(inv)}><Eye size={14} color="#2563eb"/></button>
                      <button className="btn btn-secondary btn-icon" title="Print" onClick={()=>printInvoice(inv)}><Printer size={14} color="#7c3aed"/></button>
                      <button className="btn btn-danger btn-icon"    title="Delete" onClick={()=>setDelId(inv.id)}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateInvoiceModal
          products={products} setProducts={setProducts}
          customers={customers} sales={sales}
          onSave={(inv) => {
            const updated = [...sales, inv];
            persist(updated);
            notify("Invoice created successfully! 🎉");
            setShowCreate(false);
          }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {viewInv && <ViewInvoiceModal inv={viewInv} onClose={()=>setViewInv(null)} />}
      {delId && <Confirm msg="Delete this invoice? Stock will be restored." onYes={doDelete} onNo={()=>setDelId(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}

// ─── Create Invoice Modal ──────────────────────────────────────────────────────
function CreateInvoiceModal({ products, setProducts, customers, sales, onSave, onClose }: any) {
  const [custQ, setCustQ]         = useState("");
  const [selCust, setSelCust]     = useState<Customer|null>(null);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone,setWalkInPhone]=useState("");
  const [items, setItems]         = useState<InvoiceItem[]>([]);
  const [selProd, setSelProd]     = useState("");
  const [qty, setQty]             = useState(1);
  const [itemDisc, setItemDisc]   = useState(0);
  const [itemGst, setItemGst]     = useState(5);
  const [globalDisc, setGlobalDisc]=useState(0);
  const [payMode, setPayMode]     = useState<any>("Cash");
  const [paidAmt, setPaidAmt]     = useState("");
  const [date, setDate]           = useState(todayStr());
  const [dueDate, setDueDate]     = useState(todayStr());
  const [notes, setNotes]         = useState("");
  const [toast, setToast]         = useState<{msg:string;type:any}|null>(null);

  const filteredCust = customers.filter((c:Customer) =>
    c.name.toLowerCase().includes(custQ.toLowerCase()) || c.phone.includes(custQ)
  );

  const addItem = () => {
    const prod = products.find((p:Product) => p.id === selProd);
    if (!prod) { setToast({msg:"Select a product",type:"error"}); return; }
    if (qty <= 0 || qty > prod.stock) { setToast({msg:`Only ${prod.stock} ${prod.unit} available`,type:"error"}); return; }
    const disc = itemDisc || 0;
    const discAmt = (prod.salePrice * qty * disc) / 100;
    const taxable = prod.salePrice * qty - discAmt;
    const gstAmt  = (taxable * itemGst) / 100;
    const amount  = taxable + gstAmt;
    const existing = items.findIndex(i => i.productId === prod.id);
    if (existing >= 0) {
      const newItems = [...items];
      const old = newItems[existing];
      const newQty = old.qty + qty;
      if (newQty > prod.stock) { setToast({msg:"Exceeds available stock",type:"error"}); return; }
      const dAmt = (prod.salePrice * newQty * old.discount) / 100;
      const tax  = prod.salePrice * newQty - dAmt;
      const gst  = (tax * old.gstRate) / 100;
      newItems[existing] = { ...old, qty: newQty, amount: tax + gst };
      setItems(newItems);
    } else {
      setItems(prev => [...prev, {
        productId: prod.id, productName: prod.name, unit: prod.unit,
        qty, rate: prod.salePrice, discount: disc, gstRate: itemGst,
        amount: parseFloat(amount.toFixed(2))
      }]);
    }
    setSelProd(""); setQty(1); setItemDisc(0);
  };

  const removeItem = (pid: string) => setItems(prev => prev.filter(i => i.productId !== pid));

  const subtotal    = items.reduce((s,i) => s + i.rate * i.qty, 0);
  const totalDisc   = items.reduce((s,i) => s + (i.rate * i.qty * i.discount / 100), 0) + (subtotal - items.reduce((s,i)=>s+(i.rate*i.qty*i.discount/100),0)) * globalDisc / 100;
  const taxable     = subtotal - items.reduce((s,i) => s + (i.rate*i.qty*i.discount/100), 0) - ((subtotal - items.reduce((s,i)=>s+(i.rate*i.qty*i.discount/100),0)) * globalDisc / 100);
  const totalGST    = items.reduce((s,i) => { const base = i.rate*i.qty - i.rate*i.qty*i.discount/100; return s + base*i.gstRate/100; }, 0);
  const total       = taxable + totalGST;
  const paid        = parseFloat(paidAmt || "0");
  const balance     = Math.max(0, total - paid);
  const status: "paid"|"partial"|"unpaid" = balance === 0 ? "paid" : paid > 0 ? "partial" : "unpaid";

  const generate = () => {
    if (items.length === 0) { setToast({msg:"Add at least one item",type:"error"}); return; }
    const custName  = selCust ? selCust.name  : walkInName || "Walk-in Customer";
    const custPhone = selCust ? selCust.phone : walkInPhone;
    const inv: SaleInvoice = {
      id: genId(), invoiceNo: nextNo(sales),
      customerId: selCust?.id || "", customerName: custName, customerPhone: custPhone,
      date, dueDate, items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalDiscount: parseFloat(totalDisc.toFixed(2)),
      taxableAmount: parseFloat(taxable.toFixed(2)),
      totalGST: parseFloat(totalGST.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      paidAmount: parseFloat(paid.toFixed(2)),
      balanceDue: parseFloat(balance.toFixed(2)),
      payMode, notes, status,
    };
    // Deduct stock
    const prods = Store.getProducts();
    const updated = prods.map(p => {
      const item = items.find(i => i.productId === p.id);
      return item ? { ...p, stock: p.stock - item.qty } : p;
    });
    Store.setProducts(updated);
    setProducts(updated);
    // Ledger entry
    const ledger = Store.getLedger();
    Store.setLedger([...ledger, {
      id: genId(), date, type: "sale" as any,
      partyType: "customer", partyId: selCust?.id || "",
      partyName: custName, description: `Sale Invoice ${inv.invoiceNo}`,
      debit: parseFloat(total.toFixed(2)), credit: 0,
      balance: parseFloat(balance.toFixed(2)), refId: inv.id,
    }]);
    onSave(inv);
  };

  return (
    <div className="modal-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{maxWidth:860}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px",borderBottom:"1px solid #f1f5f9",position:"sticky",top:0,background:"#fff",zIndex:1,borderRadius:"18px 18px 0 0"}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:700,color:"#166534"}}>Create Sale Invoice</h3>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>✕</button>
        </div>
        <div style={{padding:24}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
            {/* Left: Customer + Settings */}
            <div>
              <div style={{fontWeight:700,fontSize:14,color:"#166534",marginBottom:12,paddingBottom:6,borderBottom:"1px solid #f1f5f9"}}>Customer</div>
              <Field label="Search Customer">
                <input className="field-input" value={custQ} onChange={e=>{setCustQ(e.target.value);setSelCust(null);}} placeholder="Name or phone…" />
              </Field>
              {custQ && filteredCust.length > 0 && !selCust && (
                <div style={{border:"1px solid #e2e8f0",borderRadius:9,marginTop:4,maxHeight:130,overflowY:"auto",background:"#fff",zIndex:10,position:"relative"}}>
                  {filteredCust.map((c:Customer) => (
                    <div key={c.id} onClick={()=>{setSelCust(c);setCustQ(c.name);}}
                      style={{padding:"8px 14px",cursor:"pointer",fontSize:13,borderBottom:"1px solid #f8f9fa"}}
                      onMouseEnter={e=>(e.currentTarget.style.background="#f0fdf4")}
                      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                      <strong>{c.name}</strong> · {c.phone}
                    </div>
                  ))}
                </div>
              )}
              {!selCust && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
                  <Field label="Walk-in Name"><input className="field-input" value={walkInName} onChange={e=>setWalkInName(e.target.value)} placeholder="Customer name" /></Field>
                  <Field label="Phone"><input className="field-input" value={walkInPhone} onChange={e=>setWalkInPhone(e.target.value)} placeholder="Mobile" /></Field>
                </div>
              )}
              {selCust && <div style={{background:"#dcfce7",borderRadius:9,padding:"8px 14px",fontSize:13,fontWeight:600,color:"#166534",marginTop:8}}>✓ {selCust.name} · {selCust.phone}</div>}

              <div style={{marginTop:18,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Field label="Invoice Date"><input type="date" className="field-input" value={date} onChange={e=>setDate(e.target.value)} /></Field>
                <Field label="Due Date"><input type="date" className="field-input" value={dueDate} onChange={e=>setDueDate(e.target.value)} /></Field>
                <Field label="Payment Mode">
                  <select className="field-input" value={payMode} onChange={e=>setPayMode(e.target.value)}>
                    {PAY_MODES.map(m=><option key={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Extra Discount %">
                  <input type="number" className="field-input" value={globalDisc} min={0} max={100} onChange={e=>setGlobalDisc(+e.target.value)} />
                </Field>
                <div style={{gridColumn:"1/-1"}}>
                  <Field label="Amount Paid (₹)">
                    <input type="number" className="field-input" value={paidAmt} placeholder={`Max: ${fmtMoney(total)}`} onChange={e=>setPaidAmt(e.target.value)} />
                  </Field>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <Field label="Notes"><textarea className="field-input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} style={{resize:"vertical"}} /></Field>
                </div>
              </div>
            </div>

            {/* Right: Items */}
            <div>
              <div style={{fontWeight:700,fontSize:14,color:"#166534",marginBottom:12,paddingBottom:6,borderBottom:"1px solid #f1f5f9"}}>Add Items</div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:6,marginBottom:8,alignItems:"end"}}>
                <Field label="Product">
                  <select className="field-input" value={selProd} onChange={e=>setSelProd(e.target.value)}>
                    <option value="">Select…</option>
                    {products.map((p:Product)=>(
                      <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit})</option>
                    ))}
                  </select>
                </Field>
                <Field label="Qty"><input type="number" className="field-input" value={qty} min={1} onChange={e=>setQty(+e.target.value)} /></Field>
                <Field label="Disc%"><input type="number" className="field-input" value={itemDisc} min={0} max={100} onChange={e=>setItemDisc(+e.target.value)} /></Field>
                <Field label="GST%"><input type="number" className="field-input" value={itemGst} min={0} onChange={e=>setItemGst(+e.target.value)} /></Field>
                <div style={{paddingBottom:0}}>
                  <button className="btn btn-primary" onClick={addItem} style={{height:40,marginTop:19}}>+</button>
                </div>
              </div>

              {/* Item list */}
              <div style={{background:"#f8fafc",borderRadius:10,minHeight:140,padding:8,maxHeight:220,overflowY:"auto"}}>
                {items.length===0 && <div style={{color:"#94a3b8",textAlign:"center",padding:20,fontSize:13}}>No items added yet</div>}
                {items.map(i=>(
                  <div key={i.productId} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",background:"#fff",borderRadius:8,marginBottom:5,border:"1px solid #e2e8f0"}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{i.productName}</div>
                      <div style={{fontSize:11.5,color:"#64748b"}}>{i.qty} {i.unit} × {fmtMoney(i.rate)} {i.discount>0?`(${i.discount}% off)`:""} · GST {i.gstRate}%</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <strong style={{fontSize:14}}>{fmtMoney(i.amount)}</strong>
                      <button className="btn btn-danger btn-icon" onClick={()=>removeItem(i.productId)}><Trash2 size={12}/></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{background:"#14532d",color:"#fff",borderRadius:12,padding:"14px 18px",marginTop:12}}>
                {[
                  ["Subtotal", fmtMoney(subtotal)],
                  totalDisc>0 ? ["Total Discount", `-${fmtMoney(totalDisc)}`] : null,
                  ["Taxable Amount", fmtMoney(taxable)],
                  ["GST", fmtMoney(totalGST)],
                ].filter(Boolean).map(([k,v])=>(
                  <div key={k as string} style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13,opacity:.85}}>
                    <span>{k}</span><span>{v}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:18,borderTop:"1px solid rgba(255,255,255,.25)",paddingTop:8,marginTop:6}}>
                  <span>TOTAL</span><span>{fmtMoney(total)}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginTop:6,opacity:.8}}>
                  <span>Paid · Balance</span>
                  <span>{fmtMoney(paid)} · <span style={{color:"#fca5a5"}}>{fmtMoney(balance)}</span></span>
                </div>
                <div style={{textAlign:"center",marginTop:6}}>
                  <span style={{fontSize:12,fontWeight:700,background:status==="paid"?"#4ade80":status==="partial"?"#fbbf24":"#f87171",color:"#14532d",borderRadius:20,padding:"2px 14px"}}>{status.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" style={{width:"100%",marginTop:20,justifyContent:"center",fontSize:16,padding:"13px"}} onClick={generate}>
            🧾 Generate Invoice
          </button>
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}

// ─── View Invoice Modal ────────────────────────────────────────────────────────
function ViewInvoiceModal({ inv, onClose }: { inv: SaleInvoice; onClose: () => void }) {
  return (
    <Modal title={`Invoice ${inv.invoiceNo}`} onClose={onClose} maxWidth={680}>
      <div style={{fontSize:13}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <div style={{fontWeight:700,color:"#1e293b"}}>{inv.customerName}</div>
            <div style={{color:"#64748b"}}>{inv.customerPhone}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontWeight:600}}>Date: {fmtDate(inv.date)}</div>
            <div style={{color:"#64748b"}}>Due: {fmtDate(inv.dueDate)}</div>
            <div style={{marginTop:4}}><span className={`badge ${inv.status==="paid"?"badge-green":inv.status==="partial"?"badge-yellow":"badge-red"}`}>{inv.status.toUpperCase()}</span></div>
          </div>
        </div>
        <table className="data-table" style={{marginBottom:16}}>
          <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Rate</th><th>Disc%</th><th>GST%</th><th>Amount</th></tr></thead>
          <tbody>
            {inv.items.map((item,i)=>(
              <tr key={i}>
                <td>{i+1}</td><td style={{fontWeight:500}}>{item.productName}</td>
                <td>{item.qty} {item.unit}</td><td>{fmtMoney(item.rate)}</td>
                <td>{item.discount}%</td><td>{item.gstRate}%</td>
                <td style={{fontWeight:700}}>{fmtMoney(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{maxWidth:280,marginLeft:"auto"}}>
          {[
            ["Subtotal", fmtMoney(inv.subtotal)],
            inv.totalDiscount>0?["Discount",`-${fmtMoney(inv.totalDiscount)}`]:null,
            ["Taxable", fmtMoney(inv.taxableAmount)],
            ["GST", fmtMoney(inv.totalGST)],
          ].filter(Boolean).map(([k,v])=>(
            <div key={k as string} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13,borderBottom:"1px solid #f1f5f9"}}>
              <span style={{color:"#64748b"}}>{k}</span><span>{v}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontWeight:800,fontSize:16,color:"#166534"}}>
            <span>TOTAL</span><span>{fmtMoney(inv.total)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
            <span style={{color:"#16a34a",fontWeight:600}}>Paid: {fmtMoney(inv.paidAmount)}</span>
            <span style={{color:"#dc2626",fontWeight:600}}>Due: {fmtMoney(inv.balanceDue)}</span>
          </div>
        </div>
        {inv.notes && <div style={{marginTop:12,background:"#fef9c3",padding:"8px 14px",borderRadius:8,fontSize:12}}><strong>Note:</strong> {inv.notes}</div>}
      </div>
      <button className="btn btn-primary" style={{width:"100%",marginTop:16,justifyContent:"center"}} onClick={()=>printInvoice(inv)}>
        <Printer size={16}/> Print Invoice
      </button>
    </Modal>
  );
}
