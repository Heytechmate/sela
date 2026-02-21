"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import * as XLSX from 'xlsx'; 
import { Plus, Trash2, Loader2, Save, ImageIcon, X, RefreshCw, Pencil, Box, FileSpreadsheet, Megaphone, TrendingUp, Download, Search, Package } from "lucide-react";

type Variant = { name: string; price: number; cost_price: number; stock: number };
type Product = {
  id: number; name: string; brand: string; sku: string; stock: number; price: number; original_price: number; cost_price: number; 
  category: string; subcategory?: string; description: string; tags: string[]; image_url: string; is_active: boolean; is_on_sale: boolean; sale_end_date?: string; 
  gallery?: string[]; variants?: Variant[]; usage_info?: string; ingredients?: string; gender?: string; rating?: number; review_count?: number;
};
const SUGGESTED_CATEGORIES = ['Lips', 'Face', 'Skin', 'Eyes', 'Sets', 'Perfume', 'Accessories'];

export default function ProductsPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [products, setProducts] = useState<Product[]>([]);
  const [currency, setCurrency] = useState("LKR");
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // <-- Added Loading State
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [quickStockId, setQuickStockId] = useState<number | null>(null);
  const [quickStockVariants, setQuickStockVariants] = useState<Variant[]>([]);
  const [quickStockSimple, setQuickStockSimple] = useState<number>(0);

  const [form, setForm] = useState({ name: "", brand: "", sku: "", stock: "0", price: "", original_price: "", cost_price: "", category: "", subcategory: "", description: "", tags: "", usage_info: "", ingredients: "", is_on_sale: false, sale_end_date: "", gender: "Women", rating: "5.0", review_count: "0" });
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [existingMainImage, setExistingMainImage] = useState<string>(""); 
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingGallery, setExistingGallery] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [tempVariant, setTempVariant] = useState({ name: "", price: "", cost_price: "", stock: "" });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchProducts(), fetchCurrency()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  async function fetchProducts() { const { data } = await supabase.from('products').select('*').order('id', { ascending: false }); if (data) setProducts(data); }
  async function fetchCurrency() { const { data } = await supabase.from('site_settings').select('currency').limit(1).maybeSingle(); if (data?.currency) setCurrency(data.currency); }

  const calculateProductProfit = (price: number, cost: number) => price - (cost || 0);

  const handleDownloadTemplate = () => {
    const templateData = [{ "Name": "Example", "Brand": "Sela", "SKU": "SELA-001", "Stock": 50, "Price": 2500, "Cost Price": 1200, "Category": "Face", "Subcategory": "Shampoo", "Gender": "Women", "Rating": 5.0, "Review Count": 12 }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Template"); XLSX.writeFile(wb, "sela_template.xlsx");
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return; setUploading(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
          try {
              const wb = XLSX.read(evt.target?.result, { type: 'binary' });
              const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
              const formattedData = data.map((row: any) => ({
                  name: row['Name'] || "Untitled", brand: row['Brand'] || "Generic", sku: row['SKU'] || `AUTO-${Math.floor(Math.random()*10000)}`,
                  stock: parseInt(row['Stock'] || '0'), price: parseFloat(row['Price'] || '0'), cost_price: parseFloat(row['Cost Price'] || '0'),
                  category: row['Category'] || "Uncategorized", subcategory: row['Subcategory'] || "", is_active: true, is_on_sale: false,
                  rating: parseFloat(row['Rating'] || '5.0'), review_count: parseInt(row['Review Count'] || '0')
              }));
              await supabase.from('products').insert(formattedData); alert("Imported!"); fetchProducts();
          } catch (err) { alert("Error"); } finally { setUploading(false); }
      }; reader.readAsBinaryString(file);
  };

  const openQuickStock = (p: Product) => { setQuickStockId(p.id); setQuickStockVariants(p.variants ? p.variants.map(v => ({...v})) : []); setQuickStockSimple(p.stock || 0); };
  const saveQuickStock = async () => { 
      if(!quickStockId) return; 
      const updates = quickStockVariants.length > 0 ? { variants: quickStockVariants, stock: quickStockVariants.reduce((a, b) => a + b.stock, 0) } : { stock: quickStockSimple }; 
      await supabase.from('products').update(updates).eq('id', quickStockId); setQuickStockId(null); fetchProducts(); 
  };
  const generateSKU = () => { if (!form.brand || !form.category) return alert("Enter Brand/Category"); setForm(p => ({ ...p, sku: `${form.brand.substring(0,3).toUpperCase()}-${form.category.substring(0,3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}` })); };
  
  const handleSaveProduct = async (e: React.FormEvent) => {
      e.preventDefault(); setUploading(true);
      try {
          let finalImageUrl = existingMainImage;
          if (mainImage) { 
              const filePath = `product-images/${Math.random()}.${mainImage.name.split('.').pop()}`;
              await supabase.storage.from('products').upload(filePath, mainImage);
              finalImageUrl = supabase.storage.from('products').getPublicUrl(filePath).data.publicUrl;
          }
          const newGalleryUrls = [];
          for (const file of galleryFiles) { 
              const filePath = `product-gallery/${Math.random()}.${file.name.split('.').pop()}`;
              await supabase.storage.from('products').upload(filePath, file);
              newGalleryUrls.push(supabase.storage.from('products').getPublicUrl(filePath).data.publicUrl);
          }
          const productData = { 
              name: form.name, brand: form.brand, sku: form.sku, stock: parseInt(form.stock) || 0, price: parseFloat(form.price) || 0, original_price: parseFloat(form.original_price) || 0, cost_price: parseFloat(form.cost_price) || 0, category: form.category, subcategory: form.subcategory, gender: form.gender, description: form.description, tags: form.tags.split(',').filter(t => t.trim() !== ""), image_url: finalImageUrl, gallery: [...existingGallery, ...newGalleryUrls], variants, usage_info: form.usage_info, ingredients: form.ingredients, is_active: true, is_on_sale: form.is_on_sale, sale_end_date: form.sale_end_date, rating: parseFloat(form.rating) || 5.0, review_count: parseInt(form.review_count) || 0
          };
          if (editingId) await supabase.from('products').update(productData).eq('id', editingId); else await supabase.from('products').insert(productData);
          cancelEditing(); fetchProducts(); alert("Saved!");
      } catch (err:any) { alert(err.message); } finally { setUploading(false); }
  };

  const startEditing = (p: Product) => { 
      setEditingId(p.id); 
      setForm({ name: p.name, brand: p.brand, sku: p.sku, stock: p.stock.toString(), price: p.price.toString(), original_price: p.original_price?.toString()||"", cost_price: p.cost_price?.toString()||"", category: p.category, subcategory: p.subcategory||"", gender: p.gender||"Women", description: p.description||"", tags: p.tags?.join(",")||"", usage_info: p.usage_info||"", ingredients: p.ingredients||"", is_on_sale: p.is_on_sale||false, sale_end_date: p.sale_end_date||"", rating: p.rating?.toString()||"5.0", review_count: p.review_count?.toString()||"0" }); 
      setVariants(p.variants || []); setExistingMainImage(p.image_url); setExistingGallery(p.gallery || []); setGalleryFiles([]); setIsProductFormOpen(true); 
  };
  const cancelEditing = () => { setEditingId(null); setForm({ name: "", brand: "", sku: "", stock: "0", price: "", original_price: "", cost_price: "", category: "", subcategory: "", gender: "Women", description: "", tags: "", usage_info: "", ingredients: "", is_on_sale: false, sale_end_date: "", rating: "5.0", review_count: "0" }); setVariants([]); setMainImage(null); setExistingMainImage(""); setExistingGallery([]); setIsProductFormOpen(false); };
  const handleDelete = async (id: number) => { if(confirm("Delete?")) { await supabase.from('products').delete().eq('id', id); fetchProducts(); } };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Quick Stock Modal */}
        {quickStockId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center"><h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2"><Box className="w-4 h-4"/> Quick Restock</h3><button onClick={() => setQuickStockId(null)}><X className="w-4 h-4 text-gray-400 hover:text-black"/></button></div>
                    <div className="p-6 space-y-4">
                        {quickStockVariants.length > 0 ? (quickStockVariants.map((v, i) => (<div key={i} className="flex items-center justify-between"><span className="text-sm font-medium text-gray-600">{v.name}</span><div className="flex items-center gap-2"><button onClick={() => {const n = [...quickStockVariants]; n[i].stock = Math.max(0, (n[i].stock||0) - 1); setQuickStockVariants(n)}} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50">-</button><input type="number" className="w-16 text-center border rounded-lg py-1 text-sm font-bold" value={v.stock ?? 0} onChange={(e) => {const n = [...quickStockVariants]; n[i].stock = parseInt(e.target.value)||0; setQuickStockVariants(n)}} /><button onClick={() => {const n = [...quickStockVariants]; n[i].stock = (n[i].stock||0) + 1; setQuickStockVariants(n)}} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50">+</button></div></div>))) : (<div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-600">Total Stock</span><div className="flex items-center gap-2"><button onClick={() => setQuickStockSimple(Math.max(0, quickStockSimple - 1))} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50">-</button><input type="number" className="w-16 text-center border rounded-lg py-1 text-sm font-bold" value={quickStockSimple ?? 0} onChange={(e) => setQuickStockSimple(parseInt(e.target.value)||0)} /><button onClick={() => setQuickStockSimple(quickStockSimple + 1)} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50">+</button></div></div>)}
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end"><button onClick={saveQuickStock} className="bg-black text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition">Update</button></div>
                </div>
            </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <input placeholder="Search products..." className="w-full md:max-w-sm pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-black/5" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={handleDownloadTemplate} className="flex-1 md:flex-none justify-center bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition"><Download className="w-4 h-4"/> <span className="hidden md:inline">Template</span></button>
                    <label className="flex-1 md:flex-none justify-center bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition cursor-pointer">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileSpreadsheet className="w-4 h-4"/>} <span className="hidden md:inline">Import</span><input type="file" accept=".xlsx" onChange={handleBulkUpload} className="hidden" />
                    </label>
                    <button onClick={() => {cancelEditing(); setIsProductFormOpen(true);}} className="flex-1 md:flex-none justify-center bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition shadow-lg"><Plus className="w-4 h-4" /> Add</button>
                </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">Product</th><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Code</th><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Stock</th><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Price / Profit</th><th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* SKELETON LOADER */}
                  {isLoading ? (
                      [...Array(5)].map((_, i) => (
                          <tr key={`skel-${i}`} className="animate-pulse bg-white">
                              <td className="px-6 py-4 flex gap-4 items-center">
                                  <div className="w-12 h-12 bg-gray-200 rounded-lg shrink-0"></div>
                                  <div className="space-y-2 w-full"><div className="h-4 bg-gray-200 rounded w-1/2"></div><div className="h-3 bg-gray-200 rounded w-1/3"></div></div>
                              </td>
                              <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                              <td className="px-6 py-4 flex justify-end"><div className="h-6 bg-gray-200 rounded w-12"></div></td>
                              <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 ml-auto mb-1"></div><div className="h-3 bg-gray-100 rounded w-16 ml-auto"></div></td>
                              <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-24 ml-auto"></div></td>
                          </tr>
                      ))
                  ) : (
                    products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                              {product.image_url ? <Image src={product.image_url} alt="" fill className="object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-300"/></div>}
                            </div>
                            <div><p className="text-sm font-bold text-gray-900 line-clamp-1">{product.name} {product.is_on_sale && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold ml-2">SALE</span>}</p><p className="text-xs text-gray-500">{product.brand} | {product.rating}★</p></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell"><span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">{product.sku || "-"}</span></td>
                        <td className="px-6 py-4 text-right">
                          {product.variants?.length ? <div className="flex flex-col items-end gap-1">{product.variants.map((v, i) => <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200 whitespace-nowrap">{v.name}: <span className="font-bold">{v.stock}</span></span>)}</div> : <span className={`text-xs font-bold px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{product.stock}</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end"><span className="font-bold text-sm text-gray-900 whitespace-nowrap">{currency} {product.price.toLocaleString()}</span><span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 rounded mt-0.5 whitespace-nowrap">+{currency} {calculateProductProfit(product.price, product.cost_price).toLocaleString()}</span></div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openQuickStock(product)} className="text-gray-400 hover:text-green-600 p-2 bg-gray-50 rounded hover:bg-green-50 transition" title="Quick Stock"><Box className="w-4 h-4" /></button>
                            <button onClick={() => startEditing(product)} className="text-gray-400 hover:text-blue-600 p-2 bg-gray-50 rounded hover:bg-blue-50 transition"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(product.id)} className="text-gray-400 hover:text-red-600 p-2 bg-gray-50 rounded hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
        </div>

        {/* Create/Edit Modal */}
        {isProductFormOpen && (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex justify-center items-center p-0 md:p-4">
                <div className="bg-white md:rounded-xl shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0"><h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2"><Package className="w-4 h-4" /> {editingId ? "Edit Product" : "New Product"}</h2><button onClick={cancelEditing} className="text-gray-400 hover:text-black p-2"><X className="w-6 h-6" /></button></div>
                    <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-gray-500 mb-1 block">Brand Name</label><input required className="w-full bg-gray-50 rounded-lg p-3 text-sm outline-none" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 mb-1 block">SKU Code</label><div className="flex gap-2"><input readOnly className="w-full bg-gray-100 rounded-lg p-3 text-sm font-mono text-gray-600 outline-none" value={form.sku} placeholder="Auto" /><button type="button" onClick={generateSKU} className="bg-blue-600 text-white px-3 rounded-lg text-xs font-bold">Auto</button></div></div>
                                </div>
                                <div><label className="text-xs font-bold text-gray-500 mb-1 block">Product Name</label><input required className="w-full bg-gray-50 rounded-lg p-3 text-sm outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className="text-xs font-bold text-gray-500 mb-1 block">Sell Price</label><input required type="number" className="w-full bg-white border border-blue-100 rounded-lg p-3 text-sm outline-none" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 mb-1 block">Cost Price</label><input type="number" className="w-full bg-gray-50 rounded-lg p-3 text-sm outline-none" value={form.cost_price} onChange={e => setForm({...form, cost_price: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 mb-1 block">Orig Price</label><input type="number" className="w-full bg-gray-50 rounded-lg p-3 text-sm outline-none" value={form.original_price} onChange={e => setForm({...form, original_price: e.target.value})} /></div>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500"><TrendingUp className="w-4 h-4 text-green-600" /> Estimated Profit: <span className="text-green-700 font-bold">{currency} {((parseFloat(form.price)||0) - (parseFloat(form.cost_price)||0)).toLocaleString()}</span></div>
                                <div className="flex flex-col gap-3 bg-red-50 p-4 rounded-lg border border-red-100">
                                    <div className="flex items-center gap-3"><input type="checkbox" id="saleToggle" checked={form.is_on_sale} onChange={(e) => setForm({...form, is_on_sale: e.target.checked})} className="w-5 h-5 accent-red-600" /><label htmlFor="saleToggle" className="text-sm font-bold text-red-700 cursor-pointer">Mark as Sale Item</label></div>
                                    {form.is_on_sale && <div><label className="text-xs font-bold text-red-800 uppercase block mb-1">Sale Ends On</label><input type="date" className="w-full bg-white border border-red-200 rounded-lg p-2 text-xs" value={form.sale_end_date} onChange={(e) => setForm({...form, sale_end_date: e.target.value})} /></div>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-gray-500 mb-1 block">Category</label><input list="category-options" required className="w-full bg-white border border-blue-100 rounded-lg p-3 text-sm outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /><datalist id="category-options">{SUGGESTED_CATEGORIES.map(c => <option key={c} value={c} />)}</datalist></div>
                                    <div><label className="text-xs font-bold text-gray-500 mb-1 block">Subcategory</label><input className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none" value={form.subcategory} onChange={e => setForm({...form, subcategory: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 mb-1 block">Rating Score</label><input type="number" step="0.1" className="w-full bg-gray-50 rounded-lg p-3 text-sm outline-none" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 mb-1 block">Review Count</label><input type="number" className="w-full bg-gray-50 rounded-lg p-3 text-sm outline-none" value={form.review_count} onChange={e => setForm({...form, review_count: e.target.value})} /></div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div><label className="text-xs font-bold text-gray-900 uppercase">Product Media</label><div className="flex gap-4 overflow-x-auto pb-2 mt-2"><div className="relative w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 shrink-0"><input type="file" accept="image/*" onChange={(e) => setMainImage(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0" />{mainImage ? <Image src={URL.createObjectURL(mainImage)} alt="" fill className="object-cover" /> : existingMainImage ? <Image src={existingMainImage} alt="" fill className="object-cover" /> : <span className="text-[10px] font-bold">MAIN</span>}</div><div className="relative w-24 h-24 bg-gray-50 border-2 border-dashed rounded-xl flex items-center justify-center shrink-0"><input type="file" multiple accept="image/*" onChange={(e) => setGalleryFiles(prev => [...prev, ...Array.from(e.target.files || [])])} className="absolute inset-0 w-full h-full opacity-0" /><Plus className="w-5 h-5 text-gray-400" /></div></div></div>
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200"><label className="text-xs font-bold text-gray-500 uppercase block mb-3">Variants & Stock</label>
                                    <div className="grid grid-cols-4 gap-2 mb-3 items-end">
                                      <div className="col-span-1"><input className="w-full border rounded-lg p-2 text-xs" placeholder="Size" value={tempVariant.name} onChange={e => setTempVariant({...tempVariant, name: e.target.value})} /></div>
                                      <div className="col-span-1"><input className="w-full border rounded-lg p-2 text-xs" type="number" placeholder="Cost" value={tempVariant.cost_price} onChange={e => setTempVariant({...tempVariant, cost_price: e.target.value})} /></div>
                                      <div className="col-span-1"><input className="w-full border rounded-lg p-2 text-xs" type="number" placeholder="Price" value={tempVariant.price} onChange={e => setTempVariant({...tempVariant, price: e.target.value})} /></div>
                                      <div className="col-span-1 flex gap-1"><input className="w-full border rounded-lg p-2 text-xs" type="number" placeholder="Qty" value={tempVariant.stock} onChange={e => setTempVariant({...tempVariant, stock: e.target.value})} /><button type="button" onClick={() => {setVariants([...variants, {name: tempVariant.name, price: parseFloat(tempVariant.price), cost_price: parseFloat(tempVariant.cost_price)||0, stock: parseInt(tempVariant.stock)||0}]); setTempVariant({name:"",price:"",cost_price:"",stock:""})}} className="bg-black text-white px-2 rounded-lg text-xs font-bold">+</button></div>
                                    </div>
                                    <div className="space-y-2">{variants.map((v, i) => (<div key={i} className="flex justify-between items-center bg-white p-2 border rounded text-xs"><span>{v.name} (Qty: {v.stock})</span><button type="button" onClick={() => setVariants(variants.filter((_, idx)=>idx!==i))} className="text-red-400"><X className="w-3 h-3"/></button></div>))}</div>
                                    {variants.length === 0 && <input type="number" className="mt-2 w-full p-2 border rounded-lg text-xs" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="Simple Stock Qty" />}
                                </div>
                                <div><label className="text-xs font-bold text-gray-500 mb-1 block">Description</label><textarea className="w-full bg-gray-50 rounded-lg p-3 text-sm outline-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                            </div>
                        </div>
                    </form>
                    <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0"><button onClick={cancelEditing} className="px-6 py-3 font-bold text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button><button onClick={handleSaveProduct} disabled={uploading} className="px-8 py-3 bg-black text-white rounded-xl text-sm font-bold flex items-center gap-2">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save</button></div>
                </div>
            </div>
        )}
    </div>
  );
}