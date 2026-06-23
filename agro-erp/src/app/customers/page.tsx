"use client";
import { useState, useEffect } from "react";
import { Store, genId, todayStr, fmtMoney } from "@/lib/store";
import type { Customer } from "@/lib/store";
import { Modal, Toast, Confirm, PageHeader, SearchBar, Field, EmptyState, StatCard } from "@/components/ui";
import { Plus, Edit2, Trash2, Users, Phone, MapPin, CreditCard } from "lucide-react";

const EMPTY: Omit<Customer,"id"|"createdAt"> = {
  name:"", phone:"", email:"", address:"", gstNo:"", openingBalance:0,
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales]         = useState<any[]>([]);
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState<"add"|"edit"|null>(null);
  const [form, setForm]           = useState<any>({...EMPTY});
  const [delId, setDelId]         = useState<string|null>(null);
  const [toast, setToast]         = useState<{msg:string;type:any}|null>(null);

  useEffect(() => {
    setCustomers(Store.getCustomers());
    setSales(Store.getSales());
  }, []);

  const persist = (data: Customer[]) => { setCustomers(data); Store.setCustomers(data); };
  const notify  = (msg:string, type:any="success") => setToast({msg,type});
  const f       = (k:string, v:any) => setForm((p:any) => ({...p,[k]:v}));

  const save = () => {
    if (!form.name || !form.phone) { notify("Name and phone are required","error"); return; }
    if (modal === "add") {
      persist([...customers, {...form, id:genId(), createdAt:todayStr(), openingBalance:+form.openingBalance}]);
      notify("Customer added!");
    } else {
      persist(customers.map(c => c.id===form.id ? {...form, openingBalance:+form.openingBalance} : c));
      notify("Customer updated!");
    }
    setModal(null);
  };

  const getBalance = (custId: string) => {
    const c = customers.find(x => x.id===custId);
    const invoiceTotal = sales.filter(s => s.customerId===custId).reduce((a,s) => a+s.total, 0);
    const paid         = sales.filter(s => s.customerId===custId).reduce((a,s) => a+s.paidAmount, 0);
    return (c?.openingBalance||0) + invoiceTotal - paid;
  };

  const getTotalBusiness = (custId: string) =>
    sales.filter(s => s.customerId===custId).reduce((a,s) => a+s.total, 0);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  const totalReceivable = customers.reduce((a,c) => {
    const bal = getBalance(c.id);
    return a + (bal > 0 ? bal : 0);
  }, 0);

  return (
    <div className="page-enter">
      <PageHeader title="Customer Management"
        subtitle={`${customers.length} customers registered`}
        action={
          <button className="btn btn-primary" onClick={()=>{setForm({...EMPTY});setModal("add");}}>
            <Plus size={16}/> Add Customer
          </button>
        }
      />

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14,marginBottom:22}}>
        <StatCard label="Total Customers"   value={customers.length}        color="#2563eb" icon={Users} />
        <StatCard label="Total Receivable"  value={fmtMoney(totalReceivable)} color="#dc2626" icon={CreditCard} />
        <StatCard label="Total Invoices"    value={sales.length}            color="#16a34a" icon={CreditCard} />
      </div>

      <div style={{marginBottom:16}}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone or address…" />
      </div>

      {/* Customer Cards */}
      {filtered.length === 0 ? (
        <div className="card" style={{padding:0}}>
          <EmptyState icon={Users} title="No customers found" subtitle="Add your first customer to get started" />
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
          {filtered.map(c => {
            const bal       = getBalance(c.id);
            const business  = getTotalBusiness(c.id);
            const invCount  = sales.filter(s => s.customerId===c.id).length;
            return (
              <div key={c.id} className="card" style={{padding:"18px 20px",transition:"transform .18s,box-shadow .18s"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLDivElement).style.boxShadow="0 6px 24px rgba(0,0,0,.1)"}}
                onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="";(e.currentTarget as HTMLDivElement).style.boxShadow=""}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#dbeafe,#bfdbfe)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#1d4ed8"}}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:15,color:"#1e293b"}}>{c.name}</div>
                      <div style={{fontSize:12,color:"#64748b",display:"flex",alignItems:"center",gap:4,marginTop:2}}>
                        <Phone size={11}/> {c.phone}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    <button className="btn btn-secondary btn-icon" onClick={()=>{setForm({...c});setModal("edit");}}>
                      <Edit2 size={13} color="#2563eb"/>
                    </button>
                    <button className="btn btn-danger btn-icon" onClick={()=>setDelId(c.id)}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>

                {c.address && (
                  <div style={{fontSize:12,color:"#64748b",display:"flex",gap:5,alignItems:"flex-start",marginBottom:8}}>
                    <MapPin size={12} style={{marginTop:1,flexShrink:0}}/> {c.address}
                  </div>
                )}
                {c.gstNo && (
                  <div style={{fontSize:11,background:"#f0fdf4",color:"#166534",borderRadius:6,padding:"3px 8px",display:"inline-block",marginBottom:8,fontFamily:"monospace"}}>
                    GSTIN: {c.gstNo}
                  </div>
                )}

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:10,paddingTop:10,borderTop:"1px solid #f1f5f9"}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:11,color:"#94a3b8",marginBottom:3}}>Invoices</div>
                    <div style={{fontWeight:700,fontSize:16,color:"#1e293b"}}>{invCount}</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:11,color:"#94a3b8",marginBottom:3}}>Business</div>
                    <div style={{fontWeight:700,fontSize:13,color:"#16a34a"}}>{fmtMoney(business)}</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:11,color:"#94a3b8",marginBottom:3}}>Balance</div>
                    <div style={{fontWeight:700,fontSize:13,color:bal>0?"#dc2626":bal<0?"#16a34a":"#64748b"}}>
                      {bal>0?`Due: ${fmtMoney(bal)}`:bal<0?`Adv: ${fmtMoney(-bal)}`:"Clear"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <Modal title={modal==="add"?"Add New Customer":"Edit Customer"} onClose={()=>setModal(null)} maxWidth={560}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Full Name" required>
                <input className="field-input" value={form.name} onChange={e=>f("name",e.target.value)} placeholder="Customer full name" autoFocus />
              </Field>
            </div>
            <Field label="Phone Number" required>
              <input className="field-input" value={form.phone} onChange={e=>f("phone",e.target.value)} placeholder="10-digit mobile" maxLength={10} />
            </Field>
            <Field label="Email">
              <input className="field-input" type="email" value={form.email} onChange={e=>f("email",e.target.value)} placeholder="email@example.com" />
            </Field>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Address">
                <input className="field-input" value={form.address} onChange={e=>f("address",e.target.value)} placeholder="Village/Town, District" />
              </Field>
            </div>
            <Field label="GSTIN (optional)">
              <input className="field-input" value={form.gstNo} onChange={e=>f("gstNo",e.target.value)} placeholder="24AAAAA0000A1Z5" style={{fontFamily:"monospace"}} />
            </Field>
            <Field label="Opening Balance (₹)">
              <input className="field-input" type="number" value={form.openingBalance} onChange={e=>f("openingBalance",e.target.value)} placeholder="0 = no balance" />
            </Field>
          </div>
          <div style={{display:"flex",gap:10,marginTop:22}}>
            <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={save}>Save Customer</button>
            <button className="btn btn-secondary" style={{flex:1,justifyContent:"center"}} onClick={()=>setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {delId && <Confirm msg="Delete this customer? Their invoice history will remain." onYes={()=>{persist(customers.filter(c=>c.id!==delId));setDelId(null);notify("Customer deleted","error");}} onNo={()=>setDelId(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}
