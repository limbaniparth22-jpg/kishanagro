"use client";
import { useState, useEffect } from "react";
import { Store, genId, todayStr, fmtMoney } from "@/lib/store";
import type { Supplier } from "@/lib/store";
import { Modal, Toast, Confirm, PageHeader, SearchBar, Field, EmptyState, StatCard } from "@/components/ui";
import { Plus, Edit2, Trash2, UserCheck, Phone, MapPin, Truck } from "lucide-react";

const EMPTY: Omit<Supplier,"id"|"createdAt"> = {
  name:"", phone:"", email:"", address:"", gstNo:"", openingBalance:0,
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState<"add"|"edit"|null>(null);
  const [form, setForm]           = useState<any>({...EMPTY});
  const [delId, setDelId]         = useState<string|null>(null);
  const [toast, setToast]         = useState<{msg:string;type:any}|null>(null);

  useEffect(() => {
    setSuppliers(Store.getSuppliers());
    setPurchases(Store.getPurchases());
  }, []);

  const persist = (data: Supplier[]) => { setSuppliers(data); Store.setSuppliers(data); };
  const notify  = (msg:string, type:any="success") => setToast({msg,type});
  const f       = (k:string, v:any) => setForm((p:any) => ({...p,[k]:v}));

  const save = () => {
    if (!form.name || !form.phone) { notify("Name and phone are required","error"); return; }
    if (modal === "add") {
      persist([...suppliers, {...form, id:genId(), createdAt:todayStr(), openingBalance:+form.openingBalance}]);
      notify("Supplier added!");
    } else {
      persist(suppliers.map(s => s.id===form.id ? {...form, openingBalance:+form.openingBalance} : s));
      notify("Supplier updated!");
    }
    setModal(null);
  };

  const getPayable = (suppId: string) => {
    const s = suppliers.find(x => x.id===suppId);
    const poTotal = purchases.filter(p => p.supplierId===suppId).reduce((a,p) => a+p.total, 0);
    const paid    = purchases.filter(p => p.supplierId===suppId).reduce((a,p) => a+p.paidAmount, 0);
    return (s?.openingBalance||0) + poTotal - paid;
  };

  const getTotalPurchased = (suppId: string) =>
    purchases.filter(p => p.supplierId===suppId).reduce((a,p) => a+p.total, 0);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  const totalPayable = suppliers.reduce((a,s) => {
    const bal = getPayable(s.id);
    return a + (bal > 0 ? bal : 0);
  }, 0);

  return (
    <div className="page-enter">
      <PageHeader title="Supplier Management"
        subtitle={`${suppliers.length} suppliers registered`}
        action={
          <button className="btn btn-primary" style={{background:"#7c3aed"}} onClick={()=>{setForm({...EMPTY});setModal("add");}}>
            <Plus size={16}/> Add Supplier
          </button>
        }
      />

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14,marginBottom:22}}>
        <StatCard label="Total Suppliers"  value={suppliers.length}         color="#7c3aed" icon={UserCheck} />
        <StatCard label="Total Payable"    value={fmtMoney(totalPayable)}   color="#dc2626" icon={Truck} />
        <StatCard label="Purchase Orders"  value={purchases.length}         color="#16a34a" icon={Truck} />
      </div>

      <div style={{marginBottom:16}}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or phone…" />
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{padding:0}}>
          <EmptyState icon={UserCheck} title="No suppliers found" subtitle="Add your first supplier" />
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
          {filtered.map(s => {
            const payable  = getPayable(s.id);
            const business = getTotalPurchased(s.id);
            const poCount  = purchases.filter(p => p.supplierId===s.id).length;
            return (
              <div key={s.id} className="card" style={{padding:"18px 20px",transition:"transform .18s,box-shadow .18s"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLDivElement).style.boxShadow="0 6px 24px rgba(0,0,0,.1)"}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="";(e.currentTarget as HTMLDivElement).style.boxShadow=""}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#ede9fe,#ddd6fe)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#7c3aed"}}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:15,color:"#1e293b"}}>{s.name}</div>
                      <div style={{fontSize:12,color:"#64748b",display:"flex",alignItems:"center",gap:4,marginTop:2}}>
                        <Phone size={11}/> {s.phone}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    <button className="btn btn-secondary btn-icon" onClick={()=>{setForm({...s});setModal("edit");}}>
                      <Edit2 size={13} color="#7c3aed"/>
                    </button>
                    <button className="btn btn-danger btn-icon" onClick={()=>setDelId(s.id)}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>

                {s.address && (
                  <div style={{fontSize:12,color:"#64748b",display:"flex",gap:5,marginBottom:8}}>
                    <MapPin size={12} style={{marginTop:1,flexShrink:0}}/> {s.address}
                  </div>
                )}
                {s.gstNo && (
                  <div style={{fontSize:11,background:"#faf5ff",color:"#7c3aed",borderRadius:6,padding:"3px 8px",display:"inline-block",marginBottom:8,fontFamily:"monospace"}}>
                    GSTIN: {s.gstNo}
                  </div>
                )}

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:10,paddingTop:10,borderTop:"1px solid #f1f5f9"}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:11,color:"#94a3b8",marginBottom:3}}>Orders</div>
                    <div style={{fontWeight:700,fontSize:16,color:"#1e293b"}}>{poCount}</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:11,color:"#94a3b8",marginBottom:3}}>Purchased</div>
                    <div style={{fontWeight:700,fontSize:13,color:"#7c3aed"}}>{fmtMoney(business)}</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:11,color:"#94a3b8",marginBottom:3}}>Payable</div>
                    <div style={{fontWeight:700,fontSize:13,color:payable>0?"#dc2626":"#16a34a"}}>
                      {payable>0?fmtMoney(payable):"Clear"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal==="add"?"Add Supplier":"Edit Supplier"} onClose={()=>setModal(null)} maxWidth={560}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Company / Supplier Name" required>
                <input className="field-input" value={form.name} onChange={e=>f("name",e.target.value)} placeholder="Supplier or company name" autoFocus />
              </Field>
            </div>
            <Field label="Phone Number" required>
              <input className="field-input" value={form.phone} onChange={e=>f("phone",e.target.value)} placeholder="10-digit mobile" />
            </Field>
            <Field label="Email">
              <input className="field-input" type="email" value={form.email} onChange={e=>f("email",e.target.value)} placeholder="email@company.com" />
            </Field>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Address">
                <input className="field-input" value={form.address} onChange={e=>f("address",e.target.value)} placeholder="City, State" />
              </Field>
            </div>
            <Field label="GSTIN (optional)">
              <input className="field-input" value={form.gstNo} onChange={e=>f("gstNo",e.target.value)} placeholder="24AAAAA0000A1Z5" style={{fontFamily:"monospace"}} />
            </Field>
            <Field label="Opening Balance (₹)">
              <input className="field-input" type="number" value={form.openingBalance} onChange={e=>f("openingBalance",e.target.value)} />
            </Field>
          </div>
          <div style={{display:"flex",gap:10,marginTop:22}}>
            <button className="btn btn-primary" style={{flex:1,justifyContent:"center",background:"#7c3aed"}} onClick={save}>Save Supplier</button>
            <button className="btn btn-secondary" style={{flex:1,justifyContent:"center"}} onClick={()=>setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {delId && <Confirm msg="Delete this supplier? Their purchase history will remain." onYes={()=>{persist(suppliers.filter(s=>s.id!==delId));setDelId(null);notify("Supplier deleted","error");}} onNo={()=>setDelId(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}
