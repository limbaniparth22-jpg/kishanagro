"use client";
import { useState, useEffect } from "react";
import { Store, genId, todayStr, fmtMoney, fmtDate, PAY_MODES, EXPENSE_CATS } from "@/lib/store";
import type { Expense } from "@/lib/store";
import { PageHeader, SearchBar, EmptyState, StatCard, Field, Modal, Toast, Confirm } from "@/components/ui";
import { Plus, Trash2, DollarSign, TrendingDown, Receipt } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const PIE_COLORS = ["#16a34a","#2563eb","#dc2626","#d97706","#7c3aed","#0891b2"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch]     = useState("");
  const [catFilter, setCat]     = useState("All");
  const [modal, setModal]       = useState(false);
  const [delId, setDelId]       = useState<string|null>(null);
  const [toast, setToast]       = useState<{msg:string;type:any}|null>(null);
  const [form, setForm]         = useState({
    date: todayStr(), category: EXPENSE_CATS[0],
    description: "", amount: "", payMode: "Cash",
  });

  useEffect(() => { setExpenses(Store.getExpenses()); }, []);

  const persist = (data: Expense[]) => { setExpenses(data); Store.setExpenses(data); };
  const f = (k:string, v:any) => setForm(p => ({...p,[k]:v}));

  const save = () => {
    if (!form.description || !form.amount || +form.amount<=0) {
      setToast({msg:"Fill all fields with valid amount",type:"error"}); return;
    }
    const expense: Expense = {
      id: genId(), date: form.date, category: form.category,
      description: form.description, amount: parseFloat(form.amount),
      payMode: form.payMode as any,
    };
    const updated = [...expenses, expense];
    persist(updated);
    // Add to ledger
    const ledger = Store.getLedger();
    Store.setLedger([...ledger, {
      id: genId(), date: form.date, type: "expense" as any,
      partyType: "general", partyId: "", partyName: form.category,
      description: form.description,
      debit: 0, credit: parseFloat(form.amount),
      balance: 0, refId: expense.id,
    }]);
    setToast({msg:"Expense recorded!",type:"success"});
    setModal(false);
    setForm({ date:todayStr(), category:EXPENSE_CATS[0], description:"", amount:"", payMode:"Cash" });
  };

  const filtered = expenses.filter(e =>
    (catFilter==="All" || e.category===catFilter) &&
    (e.description.toLowerCase().includes(search.toLowerCase()) ||
     e.category.toLowerCase().includes(search.toLowerCase()))
  ).slice().sort((a,b) => b.date.localeCompare(a.date));

  const totalExpenses = expenses.reduce((s,e) => s+e.amount, 0);
  const thisMonth = (() => {
    const m = new Date().toISOString().slice(0,7);
    return expenses.filter(e => e.date.startsWith(m)).reduce((s,e)=>s+e.amount,0);
  })();

  // Category totals for chart
  const catTotals: Record<string,number> = {};
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category]||0) + e.amount; });
  const chartData = Object.entries(catTotals).map(([name,value]) => ({name,value}));

  const modeColors: Record<string,string> = {
    Cash:"#16a34a", UPI:"#2563eb", Credit:"#dc2626", Cheque:"#d97706", "Bank Transfer":"#7c3aed"
  };

  return (
    <div className="page-enter">
      <PageHeader title="Expense Tracker"
        subtitle="Record and track all business expenses"
        action={
          <button className="btn btn-primary" style={{background:"#dc2626"}} onClick={()=>setModal(true)}>
            <Plus size={16}/> Add Expense
          </button>
        }
      />

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:14,marginBottom:22}}>
        <StatCard label="Total Expenses"   value={fmtMoney(totalExpenses)} color="#dc2626" icon={TrendingDown} />
        <StatCard label="This Month"       value={fmtMoney(thisMonth)}     color="#d97706" icon={Receipt} />
        <StatCard label="Total Entries"    value={expenses.length}         color="#2563eb" icon={DollarSign} />
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20,marginBottom:20}}>
        {/* Filters + Table */}
        <div>
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:180}}>
              <SearchBar value={search} onChange={setSearch} placeholder="Search expenses…" />
            </div>
            <select value={catFilter} onChange={e=>setCat(e.target.value)} className="field-input" style={{width:"auto"}}>
              <option>All</option>
              {EXPENSE_CATS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="card" style={{overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Category</th><th>Description</th><th>Mode</th><th style={{textAlign:"right"}}>Amount</th><th></th></tr>
                </thead>
                <tbody>
                  {filtered.length===0 && (
                    <tr><td colSpan={6} style={{padding:0}}>
                      <EmptyState icon={Receipt} title="No expenses recorded" subtitle="Add your first expense entry" />
                    </td></tr>
                  )}
                  {filtered.map(e => (
                    <tr key={e.id}>
                      <td style={{color:"#64748b",fontFamily:"monospace",fontSize:12}}>{fmtDate(e.date)}</td>
                      <td>
                        <span className="badge badge-red" style={{fontSize:11}}>{e.category}</span>
                      </td>
                      <td style={{fontSize:13}}>{e.description}</td>
                      <td>
                        <span style={{
                          background:`${modeColors[e.payMode]}18`,
                          color: modeColors[e.payMode]||"#475569",
                          borderRadius:20, padding:"2px 10px", fontSize:11.5, fontWeight:700
                        }}>{e.payMode}</span>
                      </td>
                      <td style={{textAlign:"right",fontWeight:700,color:"#dc2626"}}>{fmtMoney(e.amount)}</td>
                      <td>
                        <button className="btn btn-danger btn-icon" onClick={()=>setDelId(e.id)}><Trash2 size={13}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr style={{background:"#fff5f5",fontWeight:700}}>
                      <td colSpan={4} style={{padding:"11px 14px",color:"#dc2626"}}>TOTAL ({filtered.length} entries)</td>
                      <td style={{padding:"11px 14px",textAlign:"right",color:"#dc2626"}}>
                        {fmtMoney(filtered.reduce((s,e)=>s+e.amount,0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card" style={{padding:20,height:"fit-content"}}>
          <div style={{fontWeight:700,fontSize:15,color:"#1e293b",marginBottom:16}}>By Category</div>
          {chartData.length === 0 ? (
            <div style={{textAlign:"center",color:"#94a3b8",padding:40,fontSize:13}}>No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                    {chartData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v:any)=>fmtMoney(v)} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:12}} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{marginTop:12}}>
                {Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).map(([cat,amt],i) => (
                  <div key={cat} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:PIE_COLORS[i%PIE_COLORS.length]}}/>
                      {cat}
                    </div>
                    <strong style={{color:"#dc2626"}}>{fmtMoney(amt)}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {modal && (
        <Modal title="Record Expense" onClose={()=>setModal(false)} maxWidth={480}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Field label="Date" required>
              <input type="date" className="field-input" value={form.date} onChange={e=>f("date",e.target.value)} />
            </Field>
            <Field label="Category" required>
              <select className="field-input" value={form.category} onChange={e=>f("category",e.target.value)}>
                {EXPENSE_CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Description" required>
                <input className="field-input" value={form.description} onChange={e=>f("description",e.target.value)} placeholder="e.g. Shop rent for June 2025" autoFocus />
              </Field>
            </div>
            <Field label="Amount (₹)" required>
              <input type="number" className="field-input" value={form.amount} onChange={e=>f("amount",e.target.value)} placeholder="0.00" min={0} />
            </Field>
            <Field label="Payment Mode">
              <select className="field-input" value={form.payMode} onChange={e=>f("payMode",e.target.value)}>
                {PAY_MODES.map(m=><option key={m}>{m}</option>)}
              </select>
            </Field>
          </div>
          <div style={{display:"flex",gap:10,marginTop:22}}>
            <button className="btn btn-primary" style={{flex:1,justifyContent:"center",background:"#dc2626"}} onClick={save}>Save Expense</button>
            <button className="btn btn-secondary" style={{flex:1,justifyContent:"center"}} onClick={()=>setModal(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {delId && (
        <Confirm msg="Delete this expense record?" onYes={()=>{ persist(expenses.filter(e=>e.id!==delId)); setDelId(null); setToast({msg:"Deleted",type:"error"}); }} onNo={()=>setDelId(null)} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}
