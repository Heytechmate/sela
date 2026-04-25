"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from 'xlsx'; 
import { 
  Plus, Trash2, Loader2, Save, ImageIcon, LayoutGrid, X, RefreshCw, 
  Settings, Package, UploadCloud, ShoppingCart, ChevronDown, ChevronUp, 
  Printer, FileText, Pencil, Ban, Box, MapPin, Phone, Users, ArrowLeft, LogOut, FileSpreadsheet, Megaphone, TrendingUp
} from "lucide-react";

// --- TYPES ---
type Variant = { name: string; price: number; stock: number };

type Product = {
  id: number;
  name: string;
  brand: string;
  sku: string;
  stock: number;
  price: number; 
  original_price: number; 
  cost_price: number; 
  category: string;
  description: string;
  tags: string[];
  image_url: string;
  is_active: boolean;
  is_on_sale: boolean;
  gallery?: string[];
  variants?: Variant[];
  usage_info?: string;
  ingredients?: string;
};

type OrderItem = { name: string; qty: number; price: number; variant: string; }

type Order = {
    id: number;
    created_at: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    items: OrderItem[];
    total_price: number;
    status: string;
    currency: string;
}

const SL_CITIES = [
  "Colombo 01 - Fort", "Colombo 02 - Slave Island", "Colombo 03 - Colpetty", "Colombo 04 - Bambalapitiya", 
  "Colombo 05 - Havelock Town", "Colombo 06 - Wellawatte", "Colombo 07 - Cinnamon Gardens", "Colombo 08 - Borella",
  "Dehiwala", "Mount Lavinia", "Ratmalana", "Moratuwa", "Panadura", "Kalutara",
  "Battaramulla", "Rajagiriya", "Nugegoda", "Maharagama", "Kottawa", "Homagama",
  "Kelaniya", "Kiribathgoda", "Kadawatha", "Wattala", "Kandana", "Ja-Ela", "Seeduwa", "Katunayake", "Negombo",
  "Gampaha", "Minuwangoda", "Veyangoda",
  "Kandy", "Peradeniya", "Gampola", "Matale",
  "Galle", "Matara", "Hikkaduwa", "Ambalangoda",
  "Kurunegala", "Chilaw", "Puttalam",
  "Anuradhapura", "Polonnaruwa", "Jaffna", "Trincomalee", "Batticaloa",
  "Ratnapura", "Avissawella", "Kegalle", "Badulla", "Bandarawela", "Nuwara Eliya"
];

const CITY_GROUPS = {
    "Colombo Area": ["Colombo 01 - Fort", "Colombo 02 - Slave Island", "Colombo 03 - Colpetty", "Colombo 04 - Bambalapitiya", "Colombo 05 - Havelock Town", "Colombo 06 - Wellawatte", "Colombo 07 - Cinnamon Gardens", "Colombo 08 - Borella", "Dehiwala", "Mount Lavinia", "Ratmalana", "Moratuwa", "Battaramulla", "Rajagiriya", "Nugegoda", "Maharagama"],
    "Gampaha / Negombo": ["Negombo", "Katunayake", "Seeduwa", "Ja-Ela", "Kandana", "Wattala", "Gampaha", "Minuwangoda"],
    "Down South": ["Galle", "Matara", "Hikkaduwa", "Ambalangoda"]
};

export default function AdminPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "settings" | "orders">("products");
  
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [quickStockId, setQuickStockId] = useState<number | null>(null);
  const [quickStockVariants, setQuickStockVariants] = useState<Variant[]>([]);
  const [quickStockSimple, setQuickStockSimple] = useState<number>(0);

  // Form State
  const [form, setForm] = useState({ 
      name: "", brand: "", sku: "", stock: "0", 
      price: "", original_price: "", cost_price: "", 
      category: "", description: "", tags: "", usage_info: "", ingredients: "", is_on_sale: false 
  });
  
  // Settings State
  const [settings, setSettings] = useState({ 
      whatsapp: "", banner_text: "", currency: "LKR", 
      hero_images: [] as string[], receipt_brand: "SELA COSMETICS", 
      receipt_sub: "Science Meets Skin", receipt_footer: "", 
      region_assignments: {} as Record<string, string> 
  });

  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [tempPhone, setTempPhone] = useState("");
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [existingMainImage, setExistingMainImage] = useState<string>(""); 
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [heroFiles, setHeroFiles] = useState<File[]>([]);
  const [existingGallery, setExistingGallery] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [tempVariant, setTempVariant] = useState({ name: "", price: "", stock: "" });

  const SUGGESTED_CATEGORIES = ['Lips', 'Face', 'Skin', 'Eyes', 'Sets', 'Perfume', 'Accessories'];

  // --- AUTH CHECK ---
  useEffect(() => {
    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push("/admin/login");
        } else {
            setIsAuthenticated(true);
            const savedTab = localStorage.getItem("adminActiveTab");
            if (savedTab === "products" || savedTab === "settings" || savedTab === "orders") {
                setActiveTab(savedTab);
            }
            fetchProducts(); 
            fetchSettings(); 
            fetchOrders();
        }
        setIsMounted(true);
    };
    checkAuth();
  }, [router]);

  // --- DATA FETCHING ---
  const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push("/admin/login");
  };

  const handleTabChange = (tab: "products" | "settings" | "orders") => {
      setActiveTab(tab); 
      localStorage.setItem("adminActiveTab", tab);
      if (tab !== "products") setIsProductFormOpen(false); 
  };

  async function fetchProducts() { 
      const { data } = await supabase.from('products').select('*').order('id', { ascending: false }); 
      if (data) setProducts(data); 
  }
  
  async function fetchOrders() { 
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }); 
      if (data) setOrders(data); 
  }
  
  async function fetchSettings() {
    const { data } = await supabase.from('site_settings').select('*').single();
    if (data) {
        setSettings({ 
            whatsapp: data.whatsapp || "", banner_text: data.banner_text || "", 
            currency: data.currency || "LKR", hero_images: data.hero_images || [], 
            receipt_brand: data.receipt_brand || "SELA COSMETICS", 
            receipt_sub: data.receipt_sub || "Science Meets Skin", 
            receipt_footer: data.receipt_footer || "", 
            region_assignments: data.region_assignments || {} 
        });
    }
  }

  // --- PRODUCT FORM LOGIC ---
  const calculateProfit = () => {
      const sell = parseFloat(form.price) || 0;
      const cost = parseFloat(form.cost_price) || 0;
      return sell - cost;
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
          try {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              const data = XLSX.utils.sheet_to_json(ws);
              
              const formattedData = data.map((row: any) => ({
                  name: row['Name'] || row['Product Name'] || "Untitled",
                  brand: row['Brand'] || "Generic",
                  sku: row['SKU'] || `AUTO-${Math.floor(Math.random() * 10000)}`,
                  stock: parseInt(row['Stock'] || '0'),
                  price: parseFloat(row['Price'] || '0'),
                  category: row['Category'] || "Uncategorized",
                  description: row['Description'] || "",
                  image_url: row['Image URL'] || "", 
                  is_active: true,
                  is_on_sale: false 
              }));

              const { error } = await supabase.from('products').insert(formattedData);
              if (error) throw error;
              alert(`Successfully imported ${formattedData.length} products!`);
              fetchProducts();
          } catch (error: any) { 
              console.error(error); 
              alert("Error processing file."); 
          } finally { 
              setUploading(false); 
          }
      };
      reader.readAsBinaryString(file);
  };

  const openQuickStock = (p: Product) => { 
      setQuickStockId(p.id); 
      setQuickStockVariants(p.variants ? p.variants.map(v => ({...v})) : []); 
      setQuickStockSimple(p.stock || 0); 
  };
  
  const saveQuickStock = async () => { 
      if(!quickStockId) return; 
      const updates = quickStockVariants.length > 0 
          ? { variants: quickStockVariants, stock: quickStockVariants.reduce((a, b) => a + b.stock, 0) } 
          : { stock: quickStockSimple }; 
          
      await supabase.from('products').update(updates).eq('id', quickStockId); 
      setProducts(products.map(p => p.id === quickStockId ? { ...p, ...updates } : p)); 
      setQuickStockId(null); 
  };
  
  const generateSKU = () => { 
      if (!form.brand || !form.category) return alert("Enter Brand/Category"); 
      setForm(p => ({ ...p, sku: `${form.brand.substring(0,3).toUpperCase()}-${form.category.substring(0,3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}` })); 
  };
  
  const handleSaveProduct = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Upload Images
      let finalImageUrl = existingMainImage;
      if (mainImage) { 
          const fd = new FormData(); 
          fd.append("file", mainImage); 
          const res = await fetch("/api/upload", { method: "POST", body: fd }); 
          if (res.ok) { const d = await res.json(); finalImageUrl = d.url; } 
      }
      
      const newGallery = [];
      for (const f of galleryFiles) { 
          const fd = new FormData(); 
          fd.append("file", f); 
          const res = await fetch("/api/upload", { method: "POST", body: fd }); 
          if (res.ok) { const d = await res.json(); newGallery.push(d.url); } 
      }
      
      const productData = { 
          name: form.name, brand: form.brand, sku: form.sku, stock: parseInt(form.stock), 
          price: parseFloat(form.price), 
          original_price: parseFloat(form.original_price) || 0,
          cost_price: parseFloat(form.cost_price) || 0,
          category: form.category, description: form.description, 
          tags: form.tags.split(',').filter(t => t), image_url: finalImageUrl, 
          gallery: [...existingGallery, ...newGallery], variants, usage_info: form.usage_info, 
          ingredients: form.ingredients, is_active: true, is_on_sale: form.is_on_sale 
      };
      
      if (editingId) { 
          await supabase.from('products').update(productData).eq('id', editingId); 
          alert("Updated!"); 
      } else { 
          await supabase.from('products').insert(productData); 
          alert("Created!"); 
      }
      cancelEditing(); 
      fetchProducts();
  };

  const openCreateForm = () => { cancelEditing(); setIsProductFormOpen(true); };
  
  const startEditing = (p: Product) => { 
      setEditingId(p.id); 
      setForm({ 
          name: p.name, brand: p.brand, sku: p.sku, stock: p.stock.toString(), 
          price: p.price.toString(), 
          original_price: p.original_price ? p.original_price.toString() : "",
          cost_price: p.cost_price ? p.cost_price.toString() : "",
          category: p.category, description: p.description || "", tags: p.tags?.join(",") || "", 
          usage_info: p.usage_info || "", ingredients: p.ingredients || "", 
          is_on_sale: p.is_on_sale || false 
      }); 
      setVariants(p.variants || []); setExistingMainImage(p.image_url); 
      setExistingGallery(p.gallery || []); setGalleryFiles([]); setIsProductFormOpen(true); 
  };
  
  const cancelEditing = () => { 
      setEditingId(null); 
      setForm({ name: "", brand: "", sku: "", stock: "0", price: "", original_price: "", cost_price: "", category: "", description: "", tags: "", usage_info: "", ingredients: "", is_on_sale: false }); 
      setVariants([]); setMainImage(null); setExistingMainImage(""); 
      setExistingGallery([]); setIsProductFormOpen(false); 
  };
  
  const handleDelete = async (id: number) => { 
      if(confirm("Delete?")) { 
          await supabase.from('products').delete().eq('id', id); 
          fetchProducts(); 
      } 
  };
  
  const saveSettings = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      await supabase.from('site_settings').update({ ...settings }).eq('id', 1); 
      alert("Settings Saved!"); 
  };

  const handleAddVariant = () => { 
      if (!tempVariant.name || !tempVariant.price) return; 
      setVariants([...variants, { name: tempVariant.name, price: parseFloat(tempVariant.price), stock: parseInt(tempVariant.stock) || 0 }]); 
      setTempVariant({ name: "", price: "", stock: "" }); 
  };
  
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));
  
  // --- ORDER LOGIC ---
  const updateOrderStatus = async (id: number, newStatus: string) => { 
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id); 
      if (!error) setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o)); 
  };
  
  const calculateRevenue = () => orders.filter(o => o.status !== 'Cancelled').reduce((acc, o) => acc + o.total_price, 0);
  const calculateTotalOrders = () => orders.filter(o => o.status !== 'Cancelled').length;
  
  const generateReceipt = (order: Order) => {
    const printWindow = window.open('', '', 'width=600,height=800');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><style>body{font-family:sans-serif;padding:20px;}.header{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:20px;}table{width:100%;border-collapse:collapse;margin:20px 0;}th{text-align:left;border-bottom:1px solid #ccc;}td{padding:8px 0;}</style></head><body><div class="header"><h1>${settings.receipt_brand}</h1><p>${settings.receipt_sub}</p></div><p><strong>Order #${order.id}</strong><br/>${order.customer_name}<br/>${order.customer_phone}<br/>${order.customer_address}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead><tbody>${order.items.map(i=>`<tr><td>${i.name} (${i.variant})</td><td>${i.qty}</td><td>${settings.currency} ${(i.price*i.qty).toLocaleString()}</td></tr>`).join('')}<tr><td colspan="2"><strong>TOTAL</strong></td><td><strong>${settings.currency} ${order.total_price.toLocaleString()}</strong></td></tr></tbody></table><p>${settings.receipt_footer}</p><script>window.print()</script></body></html>`);
    printWindow.document.close();
  };

  // --- CITY ROUTING HELPERS ---
  const addCityToSelection = (e: React.ChangeEvent<HTMLSelectElement>) => { 
      const city = e.target.value; 
      if (city && !selectedCities.includes(city)) setSelectedCities([...selectedCities, city]); 
      e.target.value = ""; 
  };
  const addGroupToSelection = (groupName: keyof typeof CITY_GROUPS) => { 
      setSelectedCities(Array.from(new Set([...selectedCities, ...CITY_GROUPS[groupName]]))); 
  };
  const removeCityFromSelection = (c: string) => setSelectedCities(selectedCities.filter(city => city !== c));
  const assignBulkNumber = () => { 
      if(!tempPhone) return alert("Enter number"); 
      const newMap = { ...settings.region_assignments }; 
      selectedCities.forEach(c => newMap[c] = tempPhone); 
      setSettings(p => ({ ...p, region_assignments: newMap })); 
      setSelectedCities([]); 
      setTempPhone(""); 
  };
  const removeAssignment = (c: string) => { 
      const newMap = { ...settings.region_assignments }; 
      delete newMap[c]; 
      setSettings(p => ({ ...p, region_assignments: newMap })); 
  };

  if (!isMounted || !isAuthenticated) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>;

  return (
    <div className="flex h-screen bg-[#f9fafb] font-sans text-gray-900 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <div className="bg-black text-white p-2 rounded-lg"><LayoutGrid className="w-5 h-5" /></div>
              <h1 className="text-sm font-bold tracking-widest uppercase">Admin Panel</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <button onClick={() => handleTabChange("products")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === "products" ? "bg-black text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}><Package className="w-4 h-4" /> Products</button>
              <button onClick={() => handleTabChange("orders")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === "orders" ? "bg-black text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}><ShoppingCart className="w-4 h-4" /> Orders</button>
              <button onClick={() => handleTabChange("settings")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === "settings" ? "bg-black text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}><Settings className="w-4 h-4" /> Settings</button>
          </nav>
          <div className="p-4 border-t border-gray-100">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-full p-8 relative">
        
        {/* QUICK STOCK MODAL */}
        {quickStockId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center"><h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2"><Box className="w-4 h-4"/> Quick Restock</h3><button onClick={() => setQuickStockId(null)}><X className="w-4 h-4 text-gray-400 hover:text-black"/></button></div>
                    <div className="p-6 space-y-4">
                        {quickStockVariants.length > 0 ? (quickStockVariants.map((v, i) => (<div key={i} className="flex items-center justify-between"><span className="text-sm font-medium text-gray-600">{v.name}</span><div className="flex items-center gap-2"><button onClick={() => {const n = [...quickStockVariants]; n[i].stock = Math.max(0, (n[i].stock||0) - 1); setQuickStockVariants(n)}} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50">-</button><input type="number" className="w-16 text-center border rounded-lg py-1 text-sm font-bold" value={v.stock ?? 0} onChange={(e) => {const n = [...quickStockVariants]; n[i].stock = parseInt(e.target.value)||0; setQuickStockVariants(n)}} /><button onClick={() => {const n = [...quickStockVariants]; n[i].stock = (n[i].stock||0) + 1; setQuickStockVariants(n)}} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50">+</button></div></div>))) : (<div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-600">Total Stock</span><div className="flex items-center gap-2"><button onClick={() => setQuickStockSimple(Math.max(0, quickStockSimple - 1))} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50">-</button><input type="number" className="w-16 text-center border rounded-lg py-1 text-sm font-bold" value={quickStockSimple ?? 0} onChange={(e) => setQuickStockSimple(parseInt(e.target.value)||0)} /><button onClick={() => setQuickStockSimple(quickStockSimple + 1)} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50">+</button></div></div>)}
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end"><button onClick={saveQuickStock} className="bg-black text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition">Update Stock</button></div>
                </div>
            </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <input placeholder="Search products..." className="w-full max-w-sm pl-4 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-black/5" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <div className="flex gap-2">
                            <label className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition cursor-pointer">
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileSpreadsheet className="w-4 h-4"/>} Import Excel
                                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleBulkUpload} className="hidden" />
                            </label>
                            <button onClick={openCreateForm} className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition shadow-lg shadow-gray-200"><Plus className="w-4 h-4" /> Add Product</button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Product</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Code</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Stock</th>
                            {/* CHANGED TO PRICE */}
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Price</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="relative w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                    <Image src={product.image_url} alt="" fill className="object-cover" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{product.name} {product.is_on_sale && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold ml-2">SALE</span>}</p>
                                    <p className="text-xs text-gray-500">{product.brand}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4"><span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">{product.sku || "-"}</span></td>
                              <td className="px-6 py-4 text-right">
                                {product.variants && product.variants.length > 0 ? (
                                  <div className="flex flex-col items-end gap-1">
                                    {product.variants.map((v, i) => (
                                      <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200 whitespace-nowrap">
                                        {v.name}: <span className={`font-bold ${v.stock < 3 ? 'text-red-600' : 'text-green-600'}`}>{v.stock}</span>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className={`text-xs font-bold px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{product.stock}</span>
                                )}
                              </td>
                              {/* CHANGED: SHOWING SELLING PRICE */}
                              <td className="px-6 py-4 text-right text-xs font-bold text-gray-900">
                                {settings.currency} {product.price.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => openQuickStock(product)} className="text-gray-400 hover:text-green-600 p-2 bg-gray-50 rounded hover:bg-green-50 transition" title="Quick Stock"><Box className="w-4 h-4" /></button>
                                  <button onClick={() => startEditing(product)} className="text-gray-400 hover:text-blue-600 p-2 bg-gray-50 rounded hover:bg-blue-50 transition"><Pencil className="w-4 h-4" /></button>
                                  <button onClick={() => handleDelete(product.id)} className="text-gray-400 hover:text-red-600 p-2 bg-gray-50 rounded hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                </div>
            </div>
        )}

        {/* PRODUCT FORM OVERLAY */}
        {isProductFormOpen && (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
                    <div className={`px-8 py-6 border-b border-gray-200 flex justify-between items-center ${editingId ? 'bg-yellow-50' : 'bg-gray-50'}`}><h2 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${editingId ? 'text-yellow-700' : 'text-gray-500'}`}>{editingId ? <><Pencil className="w-4 h-4" /> Editing Product</> : <><Plus className="w-4 h-4" /> Create New Product</>}</h2><button onClick={cancelEditing} className="text-gray-400 hover:text-black transition"><X className="w-6 h-6" /></button></div>
                    <form onSubmit={handleSaveProduct} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-6">
                               <div className="grid grid-cols-2 gap-4">
                                   <div><label className="text-xs font-bold text-gray-500 mb-1 block">Brand Name</label><input required className="w-full bg-gray-50 border-none rounded-lg p-3 text-sm font-medium outline-none" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} /></div>
                                   <div><label className="text-xs font-bold text-gray-500 mb-1 block">SKU Code</label><div className="flex gap-2"><input readOnly className="w-full bg-gray-100 border-none rounded-lg p-3 text-sm font-mono font-bold text-gray-600 outline-none" value={form.sku} placeholder="Auto-generated" /><button type="button" onClick={generateSKU} className="bg-blue-600 text-white px-3 rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Auto</button></div></div>
                               </div>
                               <div><label className="text-xs font-bold text-gray-500 mb-1 block">Product Name</label><input required className="w-full bg-gray-50 border-none rounded-lg p-3 text-sm font-medium outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                               
                               <div className="grid grid-cols-3 gap-4">
                                   <div><label className="text-xs font-bold text-gray-500 mb-1 block">Selling Price</label><input required type="number" step="0.01" className="w-full bg-white border border-blue-100 rounded-lg p-3 text-sm font-medium outline-none" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
                                   <div><label className="text-xs font-bold text-gray-500 mb-1 block">Buying Cost</label><input type="number" step="0.01" className="w-full bg-gray-50 border-none rounded-lg p-3 text-sm font-medium outline-none" value={form.cost_price} onChange={e => setForm({...form, cost_price: e.target.value})} placeholder="0.00" /></div>
                                   <div><label className="text-xs font-bold text-gray-500 mb-1 block">Original Price</label><input type="number" step="0.01" className="w-full bg-gray-50 border-none rounded-lg p-3 text-sm font-medium outline-none" value={form.original_price} onChange={e => setForm({...form, original_price: e.target.value})} placeholder="0.00" /></div>
                               </div>
                               <div className="flex items-center gap-2 text-xs font-medium text-gray-500"><TrendingUp className="w-4 h-4 text-green-600" /> Estimated Profit: <span className="text-green-700 font-bold">{settings.currency} {calculateProfit().toLocaleString()}</span></div>

                               <div className="flex items-center gap-3 bg-red-50 p-3 rounded-lg border border-red-100">
                                   <input type="checkbox" id="saleToggle" checked={form.is_on_sale} onChange={(e) => setForm({...form, is_on_sale: e.target.checked})} className="w-5 h-5 accent-red-600" />
                                   <label htmlFor="saleToggle" className="text-sm font-bold text-red-700 cursor-pointer flex items-center gap-2"><Megaphone className="w-4 h-4" /> Mark as Promotion / Sale Item</label>
                               </div>

                               <div><label className="text-xs font-bold text-gray-500 mb-1 block">Category</label><input list="category-options" required className="w-full bg-white border border-blue-100 rounded-lg p-3 text-sm font-medium outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /><datalist id="category-options">{SUGGESTED_CATEGORIES.map(c => <option key={c} value={c} />)}</datalist></div>
                               <div><label className="text-xs font-bold text-gray-500 mb-1 block">Description</label><textarea className="w-full bg-gray-50 border-none rounded-lg p-3 text-sm font-medium outline-none h-32" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                           </div>
                           <div className="space-y-6">
                               <div className="space-y-4"><label className="text-xs font-bold text-gray-900 uppercase">Product Media</label><div className="flex gap-4"><div className="relative w-32 h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition cursor-pointer overflow-hidden shrink-0"><input type="file" accept="image/*" onChange={(e) => setMainImage(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />{mainImage ? (<Image src={URL.createObjectURL(mainImage)} alt="Preview" fill className="object-cover" />) : existingMainImage ? (<Image src={existingMainImage} alt="Existing" fill className="object-cover" />) : (<div className="text-center p-1"><ImageIcon className="w-6 h-6 mx-auto mb-2 opacity-50" /><span className="text-[10px] font-bold">MAIN IMAGE</span></div>)}</div><div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl p-3 flex gap-3 overflow-x-auto items-center">{existingGallery.map((url, i) => (<div key={`exist-${i}`} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200 group"><Image src={url} alt="" fill className="object-cover" /><button type="button" onClick={() => setExistingGallery(existingGallery.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3" /></button></div>))}{galleryFiles.map((file, i) => (<div key={`new-${i}`} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-blue-200"><Image src={URL.createObjectURL(file)} alt="" fill className="object-cover" /></div>))}<div className="relative w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-100"><input type="file" multiple accept="image/*" onChange={(e) => setGalleryFiles(prev => [...prev, ...Array.from(e.target.files || [])])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><Plus className="w-5 h-5 text-gray-400" /></div></div></div></div>
                               <div className="bg-gray-50 p-5 rounded-xl border border-gray-200"><label className="text-xs font-bold text-gray-500 uppercase block mb-3">Variants & Stock</label><div className="flex gap-2 mb-3"><input className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-xs" placeholder="Size (e.g. 30ml)" value={tempVariant.name} onChange={e => setTempVariant({...tempVariant, name: e.target.value})} /><input className="w-24 bg-white border border-gray-200 rounded-lg p-2 text-xs" type="number" placeholder="Price" value={tempVariant.price} onChange={e => setTempVariant({...tempVariant, price: e.target.value})} /><input className="w-20 bg-white border border-gray-200 rounded-lg p-2 text-xs" type="number" placeholder="Qty" value={tempVariant.stock} onChange={e => setTempVariant({...tempVariant, stock: e.target.value})} /><button type="button" onClick={handleAddVariant} className="bg-black text-white px-4 rounded-lg text-xs font-bold">Add</button></div><div className="space-y-2 max-h-40 overflow-y-auto">{variants.map((v, i) => (<div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 text-xs"><span className="font-medium">{v.name}</span><div className="flex gap-3 text-gray-500"><span>LKR {Number(v.price).toFixed(2)}</span><span className="font-bold text-gray-900 border-l pl-3">Qty: {v.stock}</span></div><button type="button" onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button></div>))}</div>{variants.length === 0 && <div className="text-center py-2"><p className="text-xs text-gray-400">No variants added. Simple product stock:</p><input type="number" className="mt-2 w-24 text-center border rounded py-1 text-sm mx-auto block" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="0" /></div>}</div>
                               <div><label className="text-xs font-bold text-gray-500 mb-1 block">How to Use</label><textarea className="w-full bg-gray-50 border-none rounded-lg p-3 text-sm font-medium outline-none h-24" value={form.usage_info} onChange={e => setForm({...form, usage_info: e.target.value})} /></div><div><label className="text-xs font-bold text-gray-500 mb-1 block">Ingredients</label><textarea className="w-full bg-gray-50 border-none rounded-lg p-3 text-sm font-medium outline-none h-24" value={form.ingredients} onChange={e => setForm({...form, ingredients: e.target.value})} /></div><div><label className="text-xs font-bold text-gray-500 mb-1 block">Tags</label><input className="w-full bg-gray-50 border-none rounded-lg p-3 text-sm font-medium outline-none" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} /></div>
                           </div>
                       </div>
                       
                       <div className="pt-6 border-t border-gray-100 flex justify-end gap-3"><button type="button" onClick={cancelEditing} className="px-6 py-3 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-xl transition">Cancel</button><button type="submit" disabled={uploading} className={`px-8 py-3 text-white rounded-xl text-sm font-bold shadow-lg transition flex items-center gap-2 ${editingId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-black hover:bg-gray-800'}`}>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editingId ? "Update Product" : "Save Product"}</button></div>
                    </form>
                </div>
            </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"><div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><h3 className="text-xs font-bold text-gray-500 uppercase">Total Revenue</h3><p className="text-2xl font-bold mt-2">{settings.currency} {calculateRevenue().toLocaleString()}</p></div><div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><h3 className="text-xs font-bold text-gray-500 uppercase">Total Orders (Valid)</h3><p className="text-2xl font-bold mt-2">{calculateTotalOrders()}</p></div><div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><h3 className="text-xs font-bold text-gray-500 uppercase">Pending</h3><p className="text-2xl font-bold mt-2 text-yellow-600">{orders.filter(o => o.status === 'Pending').length}</p></div></div><div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center"><h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Recent Orders</h2><button onClick={fetchOrders} className="text-xs font-bold bg-white border border-gray-200 px-3 py-1 rounded hover:bg-gray-100"><RefreshCw className="w-3 h-3" /></button></div><div className="divide-y divide-gray-100">{orders.map(order => (<div key={order.id} className="group"><div className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition cursor-pointer ${order.status === 'Cancelled' ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50'}`} onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${order.status === 'Paid' ? 'bg-green-500' : order.status === 'Shipped' ? 'bg-blue-500' : order.status === 'Cancelled' ? 'bg-red-500' : 'bg-yellow-500'}`}>{order.status[0]}</div><div><h3 className={`text-sm font-bold ${order.status === 'Cancelled' ? 'line-through text-gray-400' : ''}`}>#{order.id} - {order.customer_name}</h3><p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()} • {order.items.length} Items</p></div></div><div className="flex items-center gap-6"><p className={`text-sm font-bold font-mono ${order.status === 'Cancelled' ? 'line-through text-gray-400' : ''}`}>{order.currency} {order.total_price.toLocaleString()}</p><select onClick={(e) => e.stopPropagation()} value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className={`text-xs font-bold px-3 py-1 rounded border outline-none cursor-pointer ${order.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}><option value="Pending">Pending</option><option value="Paid">Paid</option><option value="Shipped">Shipped</option><option value="Cancelled">Cancelled</option></select>{expandedOrderId === order.id ? <ChevronUp className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}</div></div>{expandedOrderId === order.id && (<div className="bg-gray-50 px-6 py-6 border-t border-gray-100"><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div><h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Customer Details</h4><p className="text-sm font-bold">{order.customer_name}</p><p className="text-sm text-gray-600">{order.customer_phone}</p><p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{order.customer_address}</p><button onClick={(e) => { e.stopPropagation(); generateReceipt(order); }} className="mt-4 text-xs font-bold bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800 transition"><Printer className="w-3 h-3" /> Print Receipt</button></div><div><h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Order Items</h4><div className="space-y-2">{order.items.map((item, idx) => (<div key={idx} className="flex justify-between text-sm bg-white p-2 rounded border border-gray-200"><span>{item.name} <span className="text-gray-400">({item.variant})</span> x{item.qty}</span><span className="font-mono">{order.currency} {(item.price * item.qty).toLocaleString()}</span></div>))}</div></div></div></div>)}</div>))}</div></div></div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><form onSubmit={saveSettings} className="grid grid-cols-1 md:grid-cols-12 gap-6"><div className="md:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6"><h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2"><Settings className="w-4 h-4" /> General</h3><div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Rest of Island WhatsApp</label><input required type="text" value={settings.whatsapp} onChange={(e) => setSettings({...settings, whatsapp: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium outline-none" /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Store Currency</label><input required type="text" value={settings.currency} onChange={(e) => setSettings({...settings, currency: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium outline-none" /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Announcement Banner</label><textarea required rows={4} value={settings.banner_text} onChange={(e) => setSettings({...settings, banner_text: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium outline-none resize-none" /></div></div><div className="md:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6"><h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2"><FileText className="w-4 h-4" /> Receipt Branding</h3><div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Brand Name</label><input type="text" value={settings.receipt_brand} onChange={(e) => setSettings({...settings, receipt_brand: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium outline-none" /></div><div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Tagline</label><input type="text" value={settings.receipt_sub} onChange={(e) => setSettings({...settings, receipt_sub: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium outline-none" /></div><div className="flex-1 flex flex-col"><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Footer Policy</label><textarea value={settings.receipt_footer} onChange={(e) => setSettings({...settings, receipt_footer: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium outline-none h-full min-h-[100px] resize-none" /></div></div><div className="md:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6"><h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Hero Banner</h3><div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl p-4 overflow-y-auto max-h-[300px]"><div className="grid grid-cols-2 gap-2">{settings.hero_images.map((img, i) => (<div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 group"><Image src={img} alt="Hero" fill className="object-cover" /><button type="button" onClick={() => removeHeroImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3" /></button></div>))}{heroFiles.map((file, i) => (<div key={`new-${i}`} className="relative aspect-video rounded-lg overflow-hidden border border-blue-200 opacity-70"><Image src={URL.createObjectURL(file)} alt="Preview" fill className="object-cover" /></div>))}<label className="aspect-video bg-gray-50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 border border-transparent hover:border-gray-300 transition text-gray-400"><UploadCloud className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">ADD</span><input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setHeroFiles(prev => [...prev, ...Array.from(e.target.files || [])])} /></label></div></div></div><div className="md:col-span-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6"><div className="flex justify-between items-start mb-6"><h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2"><MapPin className="w-4 h-4" /> Delivery Routing (Exceptions)</h3><div className="flex gap-2">{Object.keys(CITY_GROUPS).map((group) => (<button key={group} type="button" onClick={() => addGroupToSelection(group as keyof typeof CITY_GROUPS)} className="bg-gray-100 border border-gray-200 rounded-full px-3 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-200 whitespace-nowrap">+ {group}</button>))}</div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-4"><div className="bg-gray-50 p-4 rounded-xl border border-gray-200"><div className="flex flex-wrap gap-2 p-2 bg-white border border-gray-100 rounded-lg min-h-[40px] mb-3">{selectedCities.length === 0 && <span className="text-xs text-gray-400 self-center pl-1">Select cities to route...</span>}{selectedCities.map(city => (<span key={city} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">{city} <button type="button" onClick={() => removeCityFromSelection(city)}><X className="w-3 h-3 hover:text-blue-900" /></button></span>))}</div><div className="flex gap-2"><select className="w-1/3 bg-white border border-gray-200 rounded-lg p-2 text-xs h-10" onChange={addCityToSelection}><option value="">Select City...</option>{SL_CITIES.map(city => <option key={city} value={city}>{city}</option>)}</select><div className="flex-1 flex items-center bg-white border border-gray-200 rounded-lg px-2"><Phone className="w-3 h-3 text-gray-400 mr-2" /><input className="w-full text-xs outline-none h-9" placeholder="Enter WhatsApp Number" value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} /></div><button type="button" onClick={assignBulkNumber} className="bg-black text-white px-4 rounded-lg text-xs font-bold h-10 flex items-center gap-2"><Users className="w-3 h-3" /> Assign</button></div></div></div><div className="border-l border-gray-100 pl-8 space-y-2 max-h-60 overflow-y-auto"><h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Active Rules</h4>{Object.entries(settings.region_assignments).map(([city, phone]) => (<div key={city} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 text-sm"><span className="font-medium">{city}</span><div className="flex items-center gap-3"><span className="font-mono text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded">{phone}</span><button type="button" onClick={() => removeAssignment(city)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button></div></div>))}{Object.keys(settings.region_assignments).length === 0 && <p className="text-xs text-gray-400 italic">No exceptions. All orders go to default number.</p>}</div></div></div><div className="md:col-span-12 flex justify-end pt-4 border-t border-gray-100"><button type="submit" disabled={uploading} className="px-8 py-3 bg-black text-white rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 transition flex items-center gap-2">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All Settings</button></div></form></div>
        )}

      </main>
    </div>
  );
}