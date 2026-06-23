"use client";
import { useState, useEffect } from "react";
import { Store, fmtMoney, fmtDate } from "@/lib/store";
import { PageHeader, StatCard } from "@/components/ui";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { BarChart2, TrendingUp, TrendingDown, Package, Users, IndianRupee } from "lucide-react";

const COLORS = ["#16a34a","#2563eb","#7c3aed","#d97706","#dc2626","#0891b2"];

export default function ReportsPage() {
  const [data, setData]     = useState<any>(null);
  const [period, setPeriod] = useState<"week"|"month"|"year">("month");

  useEffect(() => {
    const sales     = Store.getSales();
    const purchases = Store.getPurchases();
    const products  = Store.getProducts();
    const customers = Store.getCustomers();
    const expenses  = Store.getExpenses();

    // Revenue summary
    const totalRevenue  = sales.reduce((s,i)=>s+i.total,0);
    const totalPurchase = purchases.reduce((s,p)=>s+p.total,0);
    const totalExpenses = expenses.reduce((s,e)=>s+e.amount,0);
    const grossProfit   = totalRevenue - totalPurchase;
    const netProfit     = grossProfit - totalExpenses;
    const totalGST      = sales.reduce((s,i)=>s+i.totalGST,0);
    const outstanding   = sales.reduce((s,i)=>s+i.balanceDue,0);

    // Period-wise chart data
    const today = new Date();
    let periodData: any[] = [];

    if (period === "week") {
      periodData = Array.from({length:7},(_,i)=>{
        const d = new Date(today); d.setDate(d.getDate()-(6-i));
        const key = d.toISOString().slice(0,10);
        const label = d.toLocaleDateString("en-IN",{weekday:"short"});
        return {
          label,
          revenue:  sales.filter(s=>s.date===key).reduce((a,s)=>a+s.total,0),
          purchase: purchases.filter(p=>p.date===key).reduce((a,p)=>a+p.total,0),
          expense:  expenses.filter(e=>e.date===key).reduce((a,e)=>a+e.amount,0),
        };
      });
    } else if (period === "month") {
      periodData = Array.from({length:12},(_,i)=>{
        const d = new Date(today.getFullYear(), today.getMonth()-11+i, 1);
        const key = d.toISOString().slice(0,7);
        const label = d.toLocaleDateString("en-IN",{month:"short",year:"2-digit"});
        return {
          label,
          revenue:  sales.filter(s=>s.date.startsWith(key)).reduce((a,s)=>a+s.total,0),
          purchase: purchases.filter(p=>p.date.startsWith(key)).reduce((a,p)=>a+p.total,0),
          expense:  expenses.filter(e=>e.date.startsWith(key)).reduce((a,e)=>a+e.amount,0),
        };
      });
    } else {
      periodData = Array.from({length:5},(_,i)=>{
        const yr = today.getFullYear()-4+i;
        return {
          label: String(yr),
          revenue:  sales.filter(s=>s.date.startsWith(String(yr))).reduce((a,s)=>a+s.total,0),
          purchase: purchases.filter(p=>p.date.startsWith(String(yr))).reduce((a,p)=>a+p.total,0),
          expense:  expenses.filter(e=>e.date.startsWith(String(yr))).reduce((a,e)=>a+e.amount,0),
        };
      });
    }

    // Top products by revenue
    const prodRevMap: Record<string,number> = {};
    sales.forEach(inv => inv.items.forEach(item => {
      prodRevMap[item.productName] = (prodRevMap[item.productName]||0) + item.amount;
    }));
    const topProducts = Object.entries(prodRevMap)
      .sort((a,b)=>b[1]-a[1]).slice(0,6)
      .map(([name,revenue])=>({name, revenue}));

    // Top customers
    const custRevMap: Record<string,number> = {};
    sales.forEach(inv => {
      custRevMap[inv.customerName] = (custRevMap[inv.customerName]||0) + inv.total;
    });
    const topCustomers = Object.entries(custRevMap)
      .sort((a,b)=>b[1]-a[1]).slice(0,5)
      .map(([name,total])=>({name,total}));

    // Category stock value
    const catStock: Record<string,number> = {};
    products.forEach(p => {
      catStock[p.category] = (catStock[p.category]||0) + p.salePrice*p.stock;
    });
    const catData = Object.entries(catStock).map(([name,value])=>({name,value}));

    // Payment mode breakdown
    const modeMap: Record<string,number> = {};
    sales.forEach(inv => { modeMap[inv.payMode] = (modeMap[inv.payMode]||0) + inv.total; });
    const modeData = Object.entries(modeMap).map(([name,value])=>({name,value}));

    setData({
      totalRevenue, totalPurchase, totalExpenses, grossProfit, netProfit,
      totalGST, outstanding, periodData, topProducts, topCustomers,
      catData, modeData,
      totalProducts: products.length,
      lowStock: products.filter(p=>p.stock<=p.minStock).length,
      totalCustomers: customers.length,
      totalSales: sales.length,
    });
  }, [period]);

  if (!data) return null;

  const kfmt = (n:number) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${n}`;

  return (
    <div className="page-enter">
      <PageHeader title="Reports & Analytics"
        subtitle="Business performance overview"
        action={
          <div style={{display:"flex",gap:6}}>
            {(["week","month","year"] as const).map(p=>(
              <button key={p} className={`btn ${period===p?"btn-primary":"btn-secondary"}`}
                onClick={()=>setPeriod(p)} style={{textTransform:"capitalize"}}>
                {p==="week"?"7 Days":p==="month"?"12 Months":"5 Years"}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:14,marginBottom:24}}>
        <StatCard label="Total Revenue"   value={fmtMoney(data.totalRevenue)}   color="#16a34a" icon={IndianRupee} />
        <StatCard label="Total Purchases" value={fmtMoney(data.totalPurchase)}  color="#7c3aed" icon={TrendingDown} />
        <StatCard label="Gross Profit"    value={fmtMoney(data.grossProfit)}    color={data.grossProfit>=0?"#16a34a":"#dc2626"} icon={TrendingUp}
          sub={data.totalRevenue>0 ? `Margin: ${((data.grossProfit/data.totalRevenue)*100).toFixed(1)}%` : undefined} />
        <StatCard label="Net Profit"      value={fmtMoney(data.netProfit)}      color={data.netProfit>=0?"#16a34a":"#dc2626"} icon={TrendingUp} />
        <StatCard label="Total Expenses"  value={fmtMoney(data.totalExpenses)}  color="#dc2626" icon={TrendingDown} />
        <StatCard label="GST Collected"   value={fmtMoney(data.totalGST)}       color="#d97706" icon={IndianRupee} />
        <StatCard label="Outstanding"     value={fmtMoney(data.outstanding)}    color="#dc2626" icon={IndianRupee} sub="to collect" />
        <StatCard label="Products"        value={data.totalProducts}            color="#2563eb" icon={Package}
          sub={`${data.lowStock} low stock`} />
      </div>

      {/* Revenue vs Purchase vs Expense chart */}
      <div className="card" style={{padding:20,marginBottom:20}}>
        <div style={{fontWeight:700,fontSize:15,color:"#1e293b",marginBottom:18}}>
          Revenue vs Purchases vs Expenses
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.periodData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{fontSize:11}} />
            <YAxis tick={{fontSize:11}} tickFormatter={kfmt} />
            <Tooltip formatter={(v:any,n:string)=>[fmtMoney(v), n.charAt(0).toUpperCase()+n.slice(1)]} />
            <Legend wrapperStyle={{fontSize:12}} />
            <Bar dataKey="revenue"  name="Revenue"   fill="#16a34a" radius={[4,4,0,0]} />
            <Bar dataKey="purchase" name="Purchases"  fill="#7c3aed" radius={[4,4,0,0]} />
            <Bar dataKey="expense"  name="Expenses"   fill="#dc2626" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Profit trend */}
      <div className="card" style={{padding:20,marginBottom:20}}>
        <div style={{fontWeight:700,fontSize:15,color:"#1e293b",marginBottom:18}}>Profit Trend</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.periodData.map((d:any)=>({...d, profit:d.revenue-d.purchase-d.expense}))}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#16a34a" stopOpacity={.3}/>
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{fontSize:11}} />
            <YAxis tick={{fontSize:11}} tickFormatter={kfmt} />
            <Tooltip formatter={(v:any)=>[fmtMoney(v),"Profit"]} />
            <Area type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={2.5} fill="url(#profitGrad)" name="Profit" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {/* Top Products */}
        <div className="card" style={{padding:20}}>
          <div style={{fontWeight:700,fontSize:15,color:"#1e293b",marginBottom:16}}>Top Products by Revenue</div>
          {data.topProducts.length===0 ? (
            <div style={{color:"#94a3b8",textAlign:"center",padding:30,fontSize:13}}>No sales data yet</div>
          ) : (
            data.topProducts.map((p:any,i:number)=>{
              const max = data.topProducts[0]?.revenue||1;
              return (
                <div key={p.name} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                    <span style={{fontWeight:600}}>{i+1}. {p.name}</span>
                    <span style={{fontWeight:700,color:"#16a34a"}}>{fmtMoney(p.revenue)}</span>
                  </div>
                  <div style={{background:"#e2e8f0",borderRadius:4,height:7}}>
                    <div style={{background:`hsl(${140-i*20},70%,40%)`,height:"100%",borderRadius:4,width:`${(p.revenue/max)*100}%`,transition:"width 1s ease"}}/>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Top Customers */}
        <div className="card" style={{padding:20}}>
          <div style={{fontWeight:700,fontSize:15,color:"#1e293b",marginBottom:16}}>Top Customers</div>
          {data.topCustomers.length===0 ? (
            <div style={{color:"#94a3b8",textAlign:"center",padding:30,fontSize:13}}>No sales data yet</div>
          ) : (
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"#f8fafc"}}>
                  <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:12}}>#</th>
                  <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:12}}>Customer</th>
                  <th style={{padding:"8px 10px",textAlign:"right",fontWeight:600,color:"#64748b",fontSize:12}}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.map((c:any,i:number)=>(
                  <tr key={c.name} style={{borderBottom:"1px solid #f1f5f9"}}>
                    <td style={{padding:"9px 10px",color:"#94a3b8"}}>{i+1}</td>
                    <td style={{padding:"9px 10px",fontWeight:600}}>{c.name}</td>
                    <td style={{padding:"9px 10px",textAlign:"right",fontWeight:700,color:"#16a34a"}}>{fmtMoney(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {/* Stock by Category */}
        <div className="card" style={{padding:20}}>
          <div style={{fontWeight:700,fontSize:15,color:"#1e293b",marginBottom:16}}>Stock Value by Category</div>
          {data.catData.length===0 ? (
            <div style={{color:"#94a3b8",textAlign:"center",padding:30,fontSize:13}}>No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.catData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                  {data.catData.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={(v:any)=>fmtMoney(v)} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{fontSize:11}} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Modes */}
        <div className="card" style={{padding:20}}>
          <div style={{fontWeight:700,fontSize:15,color:"#1e293b",marginBottom:16}}>Sales by Payment Mode</div>
          {data.modeData.length===0 ? (
            <div style={{color:"#94a3b8",textAlign:"center",padding:30,fontSize:13}}>No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={data.modeData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fontSize:11}} />
                  <YAxis tick={{fontSize:11}} tickFormatter={kfmt} />
                  <Tooltip formatter={(v:any)=>fmtMoney(v)} />
                  <Bar dataKey="value" name="Amount" radius={[5,5,0,0]}>
                    {data.modeData.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{marginTop:12}}>
                {data.modeData.map((m:any,i:number)=>(
                  <div key={m.name} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:COLORS[i%COLORS.length]}}/>
                      {m.name}
                    </div>
                    <strong>{fmtMoney(m.value)}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
