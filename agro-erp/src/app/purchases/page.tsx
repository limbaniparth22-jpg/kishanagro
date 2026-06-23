"use client";
import { useState, useEffect } from "react";
import { Store, genId, todayStr, fmtMoney, fmtDate, PAY_MODES } from "@/lib/store";
import type { PurchaseInvoice, InvoiceItem, Product, Supplier } from "@/lib/store";
import { Modal, Toast, Confirm, PageHeader, SearchBar, Field, EmptyState } from "@/components/ui";
import { Plus, Eye, Trash2, Truck } from "lucide-react";

const nextNo = (purchases: PurchaseInvoice[]) => {
  const n = purchases.length + 1;
  return `PUR-${new Date().getFullYear()}-${String(n).padStart(4,"0")}`;
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch]       = useState("");
  const [showCreate, setShowCreate]= useState(false);
  const [viewInv, setViewInv]     = useState<PurchaseInvoice|null>(null);
  const [delId, setDelId]         = useState<string|null>(null);
  const [toast, setToast]         = useState<{msg:string;type:any}|null>(null);

  useEffect(() => {
    setPurchases(Store.getPurchases());
    setProducts(Store.getProducts());
    setSuppliers(Store.getSuppliers());
  }, []);

  const notify = (msg:string, type:any="success") => setToast({msg,type});
  const persist = (data: PurchaseInvoice[]) => { setPurchases(data); Store.setPurchases(data); };

  const doDelete = () => {
    const inv = purchases.find(p => p.id === delId);
    if (inv) {
      const prods = Store.getProducts();
      const updated = prods.map(p => {
        const item = inv.items.find(i => i.productId === p.id);
        return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p;
      });
      Store.setProducts(updated);
      setProducts(updated);
    }
    persist(purchases.filter(p => p.id !== delId));
    setDelId(null); notify("Purchase deleted","error");
  };

  const filtered = purchases.filter(p =>
    p.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
    p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    p.billNo.toLowerCase().includes(search.toLowerCase())
  ).slice().reverse();

  const totalPurchased = purchases.reduce((a,p) => a+p.total, 0);
  const totalPaid      = purchases.reduce((a,p) => a+p.paidAmount, 0);
  const totalOut       = purchases.reduce((a,p) => a+p.balanceDue, 0);

  return (
    <div className="page-enter">
      <PageHeader title="Purchase Management"
        subtitle={`${purchases.length} orders · Total: ${fmtMoney(totalPurchased)}`}
        action={<button className="btn btn-primary" onClick={()=>setShowCreate(true)}><Plus size={16}/> New Purchase</button>}
      />

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        {[
          {label:"Total Purchased", v:fmtMoney(totalPurchased), color:"#7c3aed"},
          {label:"Amount Paid",     v:fmtMoney(totalPaid),      color:"#16a34a"},
          {label:"Payable Due",     v:fmtMoney(totalOut),       color:"#dc2626"},
        ].map(x=>(
          <div key={x.label} style={{background:"#fff",borderRadius:12,padding:"14px 18px",boxShadow:"0 1px 6px rgba(0,0,0,.06)",borderLeft:`4px solid ${x.color}`}}>
            <div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".4px"}}>{x.label}</div>
            <div style={{fontSize:22,fontWeight:800,color:x.color,marginTop:4}}>{x.v}</div>
          </div>
        ))}
      </div>

      <div style={{marginBottom:16}}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search supplier or bill no…" />
      </div>

      <div className="card" style={{overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table className="data-table">
            <thead>
              <tr><th>PO #</th><th>Supplier</th><th>Bill No</th><th>Date</th><th>Items</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length===0 && (
                <tr><td colSpan={10} style={{padding:0}}>
                  <EmptyState icon={Truck} title="No purchases found" subtitle="Record your first purchase order" />
                </td></tr>
              )}
              {filtered.map(p=>(
                <tr key={p.id}>
                  <td style={{fontWeight:700,color:"#7c3aed"}}>{p.invoiceNo}</td>
                  <td style={{fontWeight:500}}>{p.supplierName}</td>
                  <td style={{fontFamily:"monospace",fontSize:12}}>{p.billNo||"—"}</td>
                  <td style={{color:"#64748b"}}>{fmtDate(p.date)}</td>
                  <td>{p.items.length}</td>
                  <td style={{fontWeight:700}}>{fmtMoney(p.total)}</td>
                  <td style={{color:"#16a34a",fontWeight:600}}>{fmtMoney(p.paidAmount)}</td>
                  <td style={{color:p.balanceDue>0?"#dc2626":"#16a34a",fontWeight:600}}>{fmtMoney(p.balanceDue)}</td>
                  <td><span className={`badge ${p.status==="paid"?"badge-green":p.status==="partial"?"badge-yellow":"badge-red"}`}>{p.status.charAt(0).toUpperCase()+p.status.slice(1)}</span></td>
                  <td>
                    <div style={{display:"flex",gap:5}}>
                      <button className="btn btn-secondary btn-icon" onClick={()=>setViewInv(p)}><Eye size={14} color="#2563eb"/></button>
                      <button className="btn btn-danger btn-icon" onClick={()=>setDelId(p.id)}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreatePurchaseModal products={products} setProducts={setProducts} suppliers={suppliers} purchases={purchases}
          onSave={(inv)=>{ persist([...purchases,inv]); notify("Purchase recorded! Stock updated ✓"); setShowCreate(false); }}
          onClose={()=>setShowCreate(false)} />
      )}
      {viewInv && (
        <Modal title={`Purchase ${viewInv.invoiceNo}`} onClose={()=>setViewInv(null)} maxWidth={660}>
          <div style={{fontSize:13}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <div><strong>{viewInv.supplierName}</strong><br/><span style={{color:"#64748b"}}>Bill: {viewInv.billNo||"—"}</span></div>
              <div style={{textAlign:"right"}}><div>Date: {fmtDate(viewInv.date)}</div><span className={`badge ${viewInv.status==="paid"?"badge-green":viewInv.status==="partial"?"badge-yellow":"badge-red"}`}>{viewInv.status.toUpperCase()}</span></div>
            </div>
            <table className="data-table" style={{marginBottom:14}}>
              <thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
              <tbody>{viewInv.items.map((it,i)=>(
                <tr key={i}><td>{i+1}</td><td>{it.productName}</td><td>{it.qty} {it.unit}</td><td>{fmtMoney(it.rate)}</td><td style={{fontWeight:700}}>{fmtMoney(it.amount)}</td></tr>
              ))}</tbody>
            </table>
            <div style={{display:"flex",justifyContent:"flex-end",gap:20,fontSize:13}}>
              <div style={{color:"#64748b"}}>Total: <strong style={{color:"#1e293b"}}>{fmtMoney(viewInv.total)}</strong></div>
              <div style={{color:"#16a34a"}}>Paid: <strong>{fmtMoney(viewInv.paidAmount)}</strong></div>
              <div style={{color:"#dc2626"}}>Due: <strong>{fmtMoney(viewInv.balanceDue)}</strong></div>
            </div>
          </div>
        </Modal>
      )}
      {delId && <Confirm msg="Delete this purchase record? Stock will be reversed." onYes={doDelete} onNo={()=>setDelId(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}

function CreatePurchaseModal({ products, setProducts, suppliers, purchases, onSave, onClose }: any) {
  const [suppQ, setSuppQ]     = useState("");
  const [selSupp, setSelSupp] = useState<Supplier|null>(null);
  const [suppName, setSuppName]=useState("");
  const [billNo, setBillNo]   = useState("");
  const [items, setItems]     = useState<InvoiceItem[]>([]);
  const [selProd, setSelProd] = useState("");
  const [qty, setQty]         = useState(1);
  const [rate, setRate]       = useState(0);
  const [gstR, setGstR]       = useState(5);
  const [payMode, setPayMode] = useState<any>("Cash");
  const [paidAmt, setPaidAmt] = useState("");
  const [date, setDate]       = useState(todayStr());
  const [dueDate, setDueDate] = useState(todayStr());
  const [notes, setNotes]     = useState("");
  const [toast, setToast]     = useState<{msg:string;type:any}|null>(null);

  const filteredSupp = suppliers.filter((s:Supplier) =>
    s.name.toLowerCase().includes(suppQ.toLowerCase())
  );

  const autoRate = (pid:string) => {
    const p = products.find((x:Product)=>x.id===pid);
    if (p) setRate(p.purchasePrice);
  };

  const addItem = () => {
    const prod = products.find((p:Product)=>p.id===selProd);
    if (!prod) { setToast({msg:"Select a product",type:"error"}); return; }
    if (qty<=0) { setToast({msg:"Enter valid qty",type:"error"}); return; }
    const gstAmt = (rate * qty * gstR) / 100;
    const amount = rate*qty + gstAmt;
    const existing = items.findIndex(i=>i.productId===prod.id);
    if (existing>=0) {
      const ni=[...items];
      const newQty=ni[existing].qty+qty;
      ni[existing]={...ni[existing],qty:newQty,amount:parseFloat((ni[existing].rate*newQty*(1+ni[existing].gstRate/100)).toFixed(2))};
      setItems(ni);
    } else {
      setItems(prev=>[...prev,{productId:prod.id,productName:prod.name,unit:prod.unit,qty,rate,discount:0,gstRate:gstR,amount:parseFloat(amount.toFixed(2))}]);
    }
    setSelProd(""); setQty(1); setRate(0);
  };

  const subtotal  = items.reduce((s,i)=>s+i.rate*i.qty,0);
  const totalGST  = items.reduce((s,i)=>s+i.rate*i.qty*i.gstRate/100,0);
  const total     = subtotal + totalGST;
  const paid      = parseFloat(paidAmt||"0");
  const balance   = Math.max(0,total-paid);
  const status: "paid"|"partial"|"unpaid" = balance===0?"paid":paid>0?"partial":"unpaid";

  const generate = () => {
    if (items.length===0){setToast({msg:"Add at least one item",type:"error"});return;}
    const sName = selSupp?selSupp.name:suppName||"Unknown Supplier";
    const inv: PurchaseInvoice = {
      id:genId(), invoiceNo:nextNo(purchases),
      supplierId:selSupp?.id||"", supplierName:sName, billNo,
      date, dueDate, items,
      subtotal:parseFloat(subtotal.toFixed(2)), totalDiscount:0,
      taxableAmount:parseFloat(subtotal.toFixed(2)),
      totalGST:parseFloat(totalGST.toFixed(2)), total:parseFloat(total.toFixed(2)),
      paidAmount:parseFloat(paid.toFixed(2)), balanceDue:parseFloat(balance.toFixed(2)),
      payMode, notes, status,
    };
    // Add to stock
    const prods = Store.getProducts();
    const updated = prods.map(p=>{
      const item=items.find(i=>i.productId===p.id);
      return item?{...p,stock:p.stock+item.qty}:p;
    });
    Store.setProducts(updated); setProducts(updated);
    // Ledger
    const ledger=Store.getLedger();
    Store.setLedger([...ledger,{
      id:genId(),date,type:"purchase" as any,
      partyType:"supplier",partyId:selSupp?.id||"",partyName:sName,
      description:`Purchase ${inv.invoiceNo}`,debit:0,credit:parseFloat(total.toFixed(2)),
      balance:parseFloat(balance.toFixed(2)),refId:inv.id,
    }]);
    onSave(inv);
  };

  return (
    <div className="modal-overlay" onClick={(e)=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal-box" style={{maxWidth:800}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px",borderBottom:"1px solid #f1f5f9",position:"sticky",top:0,background:"#fff",zIndex:1,borderRadius:"18px 18px 0 0"}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:700,color:"#7c3aed"}}>Record Purchase</h3>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>✕</button>
        </div>
        <div style={{padding:24,display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
          {/* Left */}
          <div>
            <div style={{fontWeight:700,fontSize:14,color:"#7c3aed",marginBottom:12}}>Supplier</div>
            <Field label="Search Supplier">
              <input className="field-input" value={suppQ} onChange={e=>{setSuppQ(e.target.value);setSelSupp(null);}} placeholder="Supplier name…" />
            </Field>
            {suppQ && filteredSupp.length>0 && !selSupp && (
              <div style={{border:"1px solid #e2e8f0",borderRadius:9,marginTop:4,maxHeight:110,overflowY:"auto",background:"#fff",position:"relative",zIndex:10}}>
                {filteredSupp.map((s:Supplier)=>(
                  <div key={s.id} onClick={()=>{setSelSupp(s);setSuppQ(s.name);}}
                    style={{padding:"8px 14px",cursor:"pointer",fontSize:13,borderBottom:"1px solid #f8f9fa"}}
                    onMouseEnter={e=>(e.currentTarget.style.background="#faf5ff")}
                    onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                    <strong>{s.name}</strong> · {s.phone}
                  </div>
                ))}
              </div>
            )}
            {!selSupp && <div style={{marginTop:8}}><Field label="Or enter supplier name"><input className="field-input" value={suppName} onChange={e=>setSuppName(e.target.value)} placeholder="Supplier name" /></Field></div>}
            {selSupp && <div style={{background:"#ede9fe",borderRadius:9,padding:"8px 14px",fontSize:13,fontWeight:600,color:"#7c3aed",marginTop:8}}>✓ {selSupp.name}</div>}

            <div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Supplier Bill No"><input className="field-input" value={billNo} onChange={e=>setBillNo(e.target.value)} placeholder="e.g. BILL-001" /></Field>
              <Field label="Payment Mode">
                <select className="field-input" value={payMode} onChange={e=>setPayMode(e.target.value)}>
                  {PAY_MODES.map(m=><option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Purchase Date"><input type="date" className="field-input" value={date} onChange={e=>setDate(e.target.value)} /></Field>
              <Field label="Due Date"><input type="date" className="field-input" value={dueDate} onChange={e=>setDueDate(e.target.value)} /></Field>
              <div style={{gridColumn:"1/-1"}}>
                <Field label="Amount Paid (₹)"><input type="number" className="field-input" value={paidAmt} onChange={e=>setPaidAmt(e.target.value)} placeholder={`Total: ${fmtMoney(total)}`} /></Field>
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <Field label="Notes"><textarea className="field-input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} style={{resize:"vertical"}} /></Field>
              </div>
            </div>
          </div>

          {/* Right */}
          <div>
            <div style={{fontWeight:700,fontSize:14,color:"#7c3aed",marginBottom:12}}>Items</div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:6,marginBottom:8,alignItems:"end"}}>
              <Field label="Product">
                <select className="field-input" value={selProd} onChange={e=>{setSelProd(e.target.value);autoRate(e.target.value);}}>
                  <option value="">Select…</option>
                  {products.map((p:Product)=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Qty"><input type="number" className="field-input" value={qty} min={1} onChange={e=>setQty(+e.target.value)} /></Field>
              <Field label="Rate ₹"><input type="number" className="field-input" value={rate} min={0} onChange={e=>setRate(+e.target.value)} /></Field>
              <Field label="GST%"><input type="number" className="field-input" value={gstR} min={0} onChange={e=>setGstR(+e.target.value)} /></Field>
              <div><button className="btn btn-primary" onClick={addItem} style={{height:40,marginTop:19}}>+</button></div>
            </div>

            <div style={{background:"#f8fafc",borderRadius:10,minHeight:130,padding:8,maxHeight:200,overflowY:"auto"}}>
              {items.length===0 && <div style={{color:"#94a3b8",textAlign:"center",padding:20,fontSize:13}}>No items</div>}
              {items.map(i=>(
                <div key={i.productId} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",background:"#fff",borderRadius:8,marginBottom:5,border:"1px solid #e2e8f0"}}>
                  <div><div style={{fontWeight:600,fontSize:13}}>{i.productName}</div><div style={{fontSize:11.5,color:"#64748b"}}>{i.qty} × {fmtMoney(i.rate)} · GST {i.gstRate}%</div></div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <strong>{fmtMoney(i.amount)}</strong>
                    <button className="btn btn-danger btn-icon" onClick={()=>setItems(prev=>prev.filter(x=>x.productId!==i.productId))}><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{background:"#4c1d95",color:"#fff",borderRadius:12,padding:"14px 18px",marginTop:12}}>
              {[["Subtotal",fmtMoney(subtotal)],["GST",fmtMoney(totalGST)]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13,opacity:.85}}><span>{k}</span><span>{v}</span></div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:18,borderTop:"1px solid rgba(255,255,255,.25)",paddingTop:8,marginTop:6}}>
                <span>TOTAL</span><span>{fmtMoney(total)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginTop:5,opacity:.8}}>
                <span>Paid · Due</span><span>{fmtMoney(paid)} · <span style={{color:"#fca5a5"}}>{fmtMoney(balance)}</span></span>
              </div>
            </div>
          </div>
        </div>
        <div style={{padding:"0 24px 24px"}}>
          <button className="btn btn-primary" style={{width:"100%",justifyContent:"center",fontSize:16,padding:"13px",background:"#7c3aed"}} onClick={generate}>
            📦 Record Purchase & Update Stock
          </button>
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}
