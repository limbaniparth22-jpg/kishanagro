"use client";
import { useState, useEffect } from "react";
import { Store, genId, todayStr, fmtMoney, fmtDate } from "@/lib/store";
import type { LedgerEntry } from "@/lib/store";
import { PageHeader, SearchBar, EmptyState, StatCard, Field, Modal, Toast } from "@/components/ui";
import { BookOpen, TrendingUp, TrendingDown, DollarSign, Plus, Filter } from "lucide-react";

const ENTRY_TYPES = ["All","sale","purchase","expense","receipt","payment"];

export default function LedgerPage() {
  const [ledger, setLedger]     = useState<LedgerEntry[]>([]);
  const [search, setSearch]     = useState("");
  const [typeFilter, setType]   = useState("All");
  const [dateFrom, setFrom]     = useState("");
  const [dateTo, setTo]         = useState("");
  const [modal, setModal]       = useState(false);
  const [toast, setToast]       = useState<{msg:string;type:any}|null>(null);
  const [form, setForm]         = useState({
    date: todayStr(), partyName:"", description:"",
    type:"receipt", debit:"", credit:"",
  });

  useEffect(() => { setLedger(Store.getLedger()); }, []);

  const persist = (data: LedgerEntry[]) => { setLedger(data); Store.setLedger(data); };
  const f = (k:string, v:any) => setForm(p => ({...p,[k]:v}));

  const addEntry = () => {
    if (!form.partyName || !form.description) { setToast({msg:"Fill required fields",type:"error"}); return; }
    if (!form.debit && !form.credit) { setToast({msg:"Enter debit or credit amount",type:"error"}); return; }
    const entry: LedgerEntry = {
      id: genId(), date: form.date,
      type: form.type as any,
      partyType: "general", partyId: "", partyName: form.partyName,
      description: form.description,
      debit: parseFloat(form.debit||"0"),
      credit: parseFloat(form.credit||"0"),
      balance: 0, refId: "",
    };
    const updated = [...ledger, entry];
    persist(updated);
    setToast({msg:"Entry added!",type:"success"});
    setModal(false);
    setForm({ date:todayStr(), partyName:"", description:"", type:"receipt", debit:"", credit:"" });
  };

  const filtered = ledger.filter(e => {
    const matchSearch = e.partyName.toLowerCase().includes(search.toLowerCase()) ||
                        e.description.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter==="All" || e.type===typeFilter;
    const matchFrom   = !dateFrom || e.date >= dateFrom;
    const matchTo     = !dateTo   || e.date <= dateTo;
    return matchSearch && matchType && matchFrom && matchTo;
  }).slice().sort((a,b) => b.date.localeCompare(a.date));

  const totalDebit  = filtered.reduce((s,e) => s+e.debit,  0);
  const totalCredit = filtered.reduce((s,e) => s+e.credit, 0);
  const netBalance  = totalDebit - totalCredit;

  // Running balance (chronological order)
  const chronological = [...filtered].sort((a,b) => a.date.localeCompare(b.date));
  let running = 0;
  const withBalance = chronological.map(e => {
    running += e.debit - e.credit;
    return { ...e, runningBalance: running };
  }).reverse();

  const typeColor: Record<string,string> = {
    sale:"#16a34a", purchase:"#7c3aed", expense:"#dc2626",
    receipt:"#2563eb", payment:"#d97706",
  };
  const typeBg: Record<string,string> = {
    sale:"#dcfce7", purchase:"#ede9fe", expense:"#fee2e2",
    receipt:"#dbeafe", payment:"#fef9c3",
  };

  return (
    <div className="page-enter">
      <PageHeader title="Account Ledger"
        subtitle="Complete transaction history & account book"
        action={
          <button className="btn btn-primary" onClick={()=>setModal(true)}>
            <Plus size={16}/> Manual Entry
          </button>
        }
      />

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14,marginBottom:22}}>
        <StatCard label="Total Entries"  value={ledger.length}          color="#2563eb" icon={BookOpen} />
        <StatCard label="Total Debit"    value={fmtMoney(totalDebit)}   color="#16a34a" icon={TrendingUp} />
        <StatCard label="Total Credit"   value={fmtMoney(totalCredit)}  color="#dc2626" icon={TrendingDown} />
        <StatCard label="Net Balance"    value={fmtMoney(Math.abs(netBalance))} sub={netBalance>=0?"Receivable":"Payable"} color={netBalance>=0?"#16a34a":"#dc2626"} icon={DollarSign} />
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{flex:2,minWidth:200}}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search party name or description…" />
        </div>
        <select value={typeFilter} onChange={e=>setType(e.target.value)} className="field-input" style={{width:"auto"}}>
          {ENTRY_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <input type="date" className="field-input" value={dateFrom} onChange={e=>setFrom(e.target.value)} style={{width:"auto"}} title="From date" />
        <input type="date" className="field-input" value={dateTo} onChange={e=>setTo(e.target.value)} style={{width:"auto"}} title="To date" />
        {(dateFrom||dateTo||typeFilter!=="All") && (
          <button className="btn btn-secondary" onClick={()=>{setFrom("");setTo("");setType("All");}}>Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Type</th><th>Party</th><th>Description</th>
                <th style={{textAlign:"right"}}>Debit (Dr)</th>
                <th style={{textAlign:"right"}}>Credit (Cr)</th>
                <th style={{textAlign:"right"}}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {withBalance.length===0 && (
                <tr><td colSpan={7} style={{padding:0}}>
                  <EmptyState icon={BookOpen} title="No ledger entries" subtitle="Entries are auto-created when you make sales, purchases or expenses" />
                </td></tr>
              )}
              {withBalance.map(e => (
                <tr key={e.id}>
                  <td style={{color:"#64748b",fontFamily:"monospace",fontSize:12}}>{fmtDate(e.date)}</td>
                  <td>
                    <span style={{
                      background: typeBg[e.type]||"#f1f5f9",
                      color: typeColor[e.type]||"#475569",
                      borderRadius:20, padding:"2px 10px", fontSize:11.5, fontWeight:700,
                      textTransform:"capitalize"
                    }}>{e.type}</span>
                  </td>
                  <td style={{fontWeight:600}}>{e.partyName||"—"}</td>
                  <td style={{color:"#64748b",fontSize:13}}>{e.description}</td>
                  <td style={{textAlign:"right",color:"#16a34a",fontWeight:600}}>
                    {e.debit > 0 ? fmtMoney(e.debit) : "—"}
                  </td>
                  <td style={{textAlign:"right",color:"#dc2626",fontWeight:600}}>
                    {e.credit > 0 ? fmtMoney(e.credit) : "—"}
                  </td>
                  <td style={{textAlign:"right",fontWeight:700,color: e.runningBalance>=0?"#1e293b":"#dc2626"}}>
                    {fmtMoney(Math.abs(e.runningBalance))}
                    <span style={{fontSize:11,color:"#94a3b8",marginLeft:4}}>
                      {e.runningBalance>=0?"Dr":"Cr"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {withBalance.length > 0 && (
              <tfoot>
                <tr style={{background:"#f0fdf4",fontWeight:700}}>
                  <td colSpan={4} style={{padding:"11px 14px",color:"#166534"}}>TOTALS</td>
                  <td style={{padding:"11px 14px",textAlign:"right",color:"#16a34a"}}>{fmtMoney(totalDebit)}</td>
                  <td style={{padding:"11px 14px",textAlign:"right",color:"#dc2626"}}>{fmtMoney(totalCredit)}</td>
                  <td style={{padding:"11px 14px",textAlign:"right",color:netBalance>=0?"#166534":"#dc2626"}}>
                    {fmtMoney(Math.abs(netBalance))} {netBalance>=0?"Dr":"Cr"}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {modal && (
        <Modal title="Add Manual Ledger Entry" onClose={()=>setModal(false)} maxWidth={500}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="Date" required>
              <input type="date" className="field-input" value={form.date} onChange={e=>f("date",e.target.value)} />
            </Field>
            <Field label="Entry Type">
              <select className="field-input" value={form.type} onChange={e=>f("type",e.target.value)}>
                {["receipt","payment","expense","sale","purchase"].map(t=>(
                  <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                ))}
              </select>
            </Field>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Party Name" required>
                <input className="field-input" value={form.partyName} onChange={e=>f("partyName",e.target.value)} placeholder="Customer/Supplier/Other" autoFocus />
              </Field>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Description" required>
                <input className="field-input" value={form.description} onChange={e=>f("description",e.target.value)} placeholder="e.g. Cash received against invoice INV-0012" />
              </Field>
            </div>
            <Field label="Debit Amount (₹)">
              <input type="number" className="field-input" value={form.debit} onChange={e=>f("debit",e.target.value)} placeholder="0.00" min={0} />
            </Field>
            <Field label="Credit Amount (₹)">
              <input type="number" className="field-input" value={form.credit} onChange={e=>f("credit",e.target.value)} placeholder="0.00" min={0} />
            </Field>
          </div>
          <div style={{background:"#f0fdf4",borderRadius:8,padding:"10px 14px",marginTop:14,fontSize:12,color:"#166534"}}>
            💡 <strong>Debit</strong> = money coming in (sales, receipts). <strong>Credit</strong> = money going out (purchases, payments, expenses).
          </div>
          <div style={{display:"flex",gap:10,marginTop:20}}>
            <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={addEntry}>Add Entry</button>
            <button className="btn btn-secondary" style={{flex:1,justifyContent:"center"}} onClick={()=>setModal(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}
