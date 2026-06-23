"use client";
import { useState, useEffect } from "react";
import { Store, genId, todayStr, fmtMoney, CATEGORIES } from "@/lib/store";
import type { Product, Category } from "@/lib/store";
import { Modal, Toast, Confirm, PageHeader, SearchBar, Field, EmptyState } from "@/components/ui";
import { Plus, Edit2, Trash2, Package, PlusCircle } from "lucide-react";

const EMPTY: Omit<Product,"id"|"createdAt"> = {
  name:"", category:"Fertilizer", unit:"", purchasePrice:0,
  salePrice:0, stock:0, hsnCode:"", minStock:5,
};

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch]     = useState("");
  const [cat, setCat]           = useState<string>("All");
  const [modal, setModal]       = useState<"add"|"edit"|"restock"|null>(null);
  const [form, setForm]         = useState<any>({...EMPTY});
  const [restockProd, setRestockProd] = useState<Product|null>(null);
  const [restockQty, setRestockQty]   = useState("");
  const [delId, setDelId]       = useState<string|null>(null);
  const [toast, setToast]       = useState<{msg:string;type:any}|null>(null);

  useEffect(() => { setProducts(Store.getProducts()); }, []);

  const persist = (data: Product[]) => { setProducts(data); Store.setProducts(data); };
  const notify  = (msg: string, type: any = "success") => setToast({ msg, type });
  const f       = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const openAdd  = () => { setForm({...EMPTY}); setModal("add"); };
  const openEdit = (p: Product) => { setForm({...p}); setModal("edit"); };

  const save = () => {
    if (!form.name || !form.unit || !form.salePrice) { notify("Fill required fields","error"); return; }
    if (modal === "add") {
      persist([...products, { ...form, id: genId(), createdAt: todayStr(), stock: +form.stock, purchasePrice: +form.purchasePrice, salePrice: +form.salePrice, minStock: +form.minStock }]);
      notify("Product added!");
    } else {
      persist(products.map(p => p.id === form.id ? { ...form, stock: +form.stock, purchasePrice: +form.purchasePrice, salePrice: +form.salePrice, minStock: +form.minStock } : p));
      notify("Product updated!");
    }
    setModal(null);
  };

  const doDelete = () => {
    persist(products.filter(p => p.id !== delId));
    setDelId(null); notify("Product deleted","error");
  };

  const doRestock = () => {
    if (!restockQty || +restockQty <= 0) { notify("Enter valid quantity","error"); return; }
    persist(products.map(p => p.id === restockProd!.id ? { ...p, stock: p.stock + +restockQty } : p));
    notify(`Added ${restockQty} ${restockProd!.unit} to stock`);
    setModal(null); setRestockProd(null); setRestockQty("");
  };

  const filtered = products.filter(p =>
    (cat === "All" || p.category === cat) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.hsnCode.includes(search))
  );

  const stockStatus = (p: Product) =>
    p.stock === 0 ? { label:"Out", cls:"badge-red" } :
    p.stock <= p.minStock ? { label:"Low", cls:"badge-yellow" } :
    { label:"Good", cls:"badge-green" };

  return (
    <div className="page-enter">
      <PageHeader title="Stock & Inventory"
        subtitle={`${products.length} products · ${products.reduce((s,p)=>s+p.stock,0)} total units`}
        action={
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Add Product</button>
        }
      />

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:200 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search product or HSN…" />
        </div>
        <select value={cat} onChange={e=>setCat(e.target.value)} className="field-input" style={{width:"auto"}}>
          <option>All</option>
          {CATEGORIES.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Product Name</th><th>Category</th><th>HSN</th>
                <th>Unit</th><th>Purchase ₹</th><th>Sale ₹</th>
                <th>Stock</th><th>Min</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={11} style={{padding:0}}>
                  <EmptyState icon={Package} title="No products found" subtitle="Add your first product to get started" />
                </td></tr>
              )}
              {filtered.map((p,i) => {
                const st = stockStatus(p);
                return (
                  <tr key={p.id}>
                    <td style={{color:"#94a3b8",fontSize:12}}>{i+1}</td>
                    <td style={{fontWeight:600}}>{p.name}</td>
                    <td><span className="badge badge-green">{p.category}</span></td>
                    <td style={{fontFamily:"monospace",fontSize:12}}>{p.hsnCode||"—"}</td>
                    <td style={{color:"#64748b"}}>{p.unit}</td>
                    <td>{fmtMoney(p.purchasePrice)}</td>
                    <td style={{fontWeight:700,color:"#166534"}}>{fmtMoney(p.salePrice)}</td>
                    <td style={{fontWeight:700,color: p.stock===0?"#dc2626": p.stock<=p.minStock?"#d97706":"#16a34a"}}>{p.stock}</td>
                    <td style={{color:"#94a3b8"}}>{p.minStock}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td>
                      <div style={{display:"flex",gap:6}}>
                        <button title="Restock" className="btn btn-secondary btn-icon"
                          onClick={()=>{setRestockProd(p);setRestockQty("");setModal("restock")}}>
                          <PlusCircle size={15} color="#16a34a"/>
                        </button>
                        <button title="Edit" className="btn btn-secondary btn-icon" onClick={()=>openEdit(p)}>
                          <Edit2 size={15} color="#2563eb"/>
                        </button>
                        <button title="Delete" className="btn btn-danger btn-icon" onClick={()=>setDelId(p.id)}>
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{display:"flex",gap:16,marginTop:16,flexWrap:"wrap"}}>
        {CATEGORIES.map(c => {
          const cnt = products.filter(p=>p.category===c);
          if (!cnt.length) return null;
          return (
            <div key={c} style={{background:"#fff",borderRadius:10,padding:"10px 16px",fontSize:13,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
              <span style={{fontWeight:700,color:"#16a34a"}}>{c}</span>
              <span style={{color:"#64748b",marginLeft:8}}>{cnt.length} items · {cnt.reduce((s,p)=>s+p.stock,0)} units</span>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {(modal==="add"||modal==="edit") && (
        <Modal title={modal==="add"?"Add New Product":"Edit Product"} onClose={()=>setModal(null)} maxWidth={640}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{gridColumn:"1/-1"}}>
              <Field label="Product Name" required>
                <input className="field-input" value={form.name} onChange={e=>f("name",e.target.value)} placeholder="e.g. Urea Fertilizer" />
              </Field>
            </div>
            <Field label="Category" required>
              <select className="field-input" value={form.category} onChange={e=>f("category",e.target.value)}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Unit" required>
              <input className="field-input" value={form.unit} onChange={e=>f("unit",e.target.value)} placeholder="e.g. Bag (50kg), Litre" />
            </Field>
            <Field label="HSN Code">
              <input className="field-input" value={form.hsnCode} onChange={e=>f("hsnCode",e.target.value)} placeholder="e.g. 3102" />
            </Field>
            <Field label="Purchase Price (₹)" required>
              <input className="field-input" type="number" value={form.purchasePrice} onChange={e=>f("purchasePrice",e.target.value)} min={0} />
            </Field>
            <Field label="Sale Price (₹)" required>
              <input className="field-input" type="number" value={form.salePrice} onChange={e=>f("salePrice",e.target.value)} min={0} />
            </Field>
            <Field label="Opening Stock">
              <input className="field-input" type="number" value={form.stock} onChange={e=>f("stock",e.target.value)} min={0} />
            </Field>
            <Field label="Min Stock Alert">
              <input className="field-input" type="number" value={form.minStock} onChange={e=>f("minStock",e.target.value)} min={0} />
            </Field>
          </div>
          <div style={{display:"flex",gap:10,marginTop:24}}>
            <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={save}>Save Product</button>
            <button className="btn btn-secondary" style={{flex:1,justifyContent:"center"}} onClick={()=>setModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Restock Modal */}
      {modal==="restock" && restockProd && (
        <Modal title={`Restock: ${restockProd.name}`} onClose={()=>{setModal(null);setRestockProd(null)}} maxWidth={380}>
          <p style={{color:"#64748b",marginTop:0,fontSize:14}}>Current stock: <strong style={{color:"#16a34a"}}>{restockProd.stock} {restockProd.unit}</strong></p>
          <Field label="Quantity to Add" required>
            <input className="field-input" type="number" value={restockQty} onChange={e=>setRestockQty(e.target.value)} placeholder="e.g. 50" min={1} autoFocus />
          </Field>
          <div style={{display:"flex",gap:10,marginTop:20}}>
            <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={doRestock}>Add to Stock</button>
            <button className="btn btn-secondary" style={{flex:1,justifyContent:"center"}} onClick={()=>{setModal(null);setRestockProd(null)}}>Cancel</button>
          </div>
        </Modal>
      )}

      {delId && <Confirm msg="Delete this product? This cannot be undone." onYes={doDelete} onNo={()=>setDelId(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}
