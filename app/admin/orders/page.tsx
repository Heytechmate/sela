"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Calendar, RefreshCw, ChevronDown, ChevronUp, Printer, DollarSign, TrendingUp, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";

type OrderItem = { name: string; qty: number; price: number; variant: string; };
type Order = { id: number; created_at: string; customer_name: string; customer_phone: string; customer_address: string; items: OrderItem[]; total_price: number; status: string; currency: string; };
type Product = { id: number; name: string; cost_price: number; variants?: {name: string; cost_price: number}[]; stock: number };

export default function OrdersPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState({ receipt_brand: "SELA", receipt_sub: "Beauty", currency: "LKR", receipt_footer: "" });
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true); // <-- Added Loading State
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchOrders(), fetchProducts(), fetchSettings()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  async function fetchOrders() { const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }); if (data) setOrders(data); }
  async function fetchProducts() { const { data } = await supabase.from('products').select('id, name, cost_price, variants, stock'); if (data) setProducts(data); }
  async function fetchSettings() { const { data } = await supabase.from('site_settings').select('*').limit(1).maybeSingle(); if (data) setSettings({ receipt_brand: data.receipt_brand||"SELA", receipt_sub: data.receipt_sub||"", currency: data.currency||"LKR", receipt_footer: data.receipt_footer||"" }); }

  const calculateOrderProfit = (order: Order) => {
      let profit = 0;
      order.items.forEach(item => {
          const product = products.find(p => p.name === item.name);
          if (!product) return;
          let cost = product.cost_price || 0; 
          if (item.variant && product.variants && product.variants.length > 0) {
              const variant = product.variants.find(v => v.name === item.variant);
              if (variant && variant.cost_price) cost = variant.cost_price;
          }
          profit += (item.price - cost) * item.qty;
      });
      return profit;
  };

  const updateOrderStatus = async (id: number, newStatus: string) => { 
      const order = orders.find(o => o.id === id);
      if (!order) return;
      if (newStatus === 'Cancelled') {
          if (!confirm("Cancelling this order will return items to stock. Continue?")) return;
          for (const item of order.items) {
             const product = products.find(p => p.name === item.name);
             if(!product) continue;
             await supabase.from('products').update({stock: product.stock + item.qty}).eq('id', product.id);
          }
      }
      await supabase.from('orders').update({ status: newStatus }).eq('id', id); 
      fetchOrders();
  };

  const generateReceipt = (order: Order) => {
    const printWindow = window.open('', '', 'width=600,height=800');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><style>body{font-family:sans-serif;padding:20px;}.header{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:20px;}table{width:100%;border-collapse:collapse;margin:20px 0;}th{text-align:left;border-bottom:1px solid #ccc;}td{padding:8px 0;}</style></head><body><div class="header"><h1>${settings.receipt_brand}</h1><p>${settings.receipt_sub}</p></div><p><strong>Order #${order.id}</strong><br/>${order.customer_name}<br/>${order.customer_phone}<br/>${order.customer_address}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead><tbody>${order.items.map(i=>`<tr><td>${i.name} (${i.variant})</td><td>${i.qty}</td><td>${settings.currency} ${(i.price*i.qty).toLocaleString()}</td></tr>`).join('')}<tr><td colspan="2"><strong>TOTAL</strong></td><td><strong>${settings.currency} ${order.total_price.toLocaleString()}</strong></td></tr></tbody></table><p>${settings.receipt_footer}</p><script>window.print()</script></body></html>`);
    printWindow.document.close();
  };

  const today = new Date().toLocaleDateString();
  const activeOrdersList = orders.filter(o => o.status !== 'Cancelled');
  const todayOrders = activeOrdersList.filter(o => new Date(o.created_at).toLocaleDateString() === today);
  const pastOrders = activeOrdersList.filter(o => new Date(o.created_at).toLocaleDateString() !== today);
  const currentHistoryOrders = pastOrders.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-8">
        {/* METRICS SKELETON */}
        {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse h-28">
                        <div className="h-3 bg-gray-200 rounded w-24 mb-3"></div>
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden"><div className="absolute top-0 right-0 p-3 opacity-10"><DollarSign className="w-12 h-12" /></div><h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Today's Revenue</h3><p className="text-xl md:text-2xl font-bold">{settings.currency} {todayOrders.reduce((acc, o) => acc + o.total_price, 0).toLocaleString()}</p></div>
                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden"><div className="absolute top-0 right-0 p-3 opacity-10"><TrendingUp className="w-12 h-12 text-green-600" /></div><h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Today's Profit</h3><p className="text-xl md:text-2xl font-bold text-green-600">+{settings.currency} {todayOrders.reduce((acc, o) => acc + calculateOrderProfit(o), 0).toLocaleString()}</p></div>
                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm"><h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Total Revenue</h3><p className="text-xl md:text-2xl font-bold text-gray-700">{settings.currency} {activeOrdersList.reduce((acc, o) => acc + o.total_price, 0).toLocaleString()}</p></div>
                <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm"><h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Total Profit</h3><p className="text-xl md:text-2xl font-bold text-green-700">+{settings.currency} {activeOrdersList.reduce((acc, o) => acc + calculateOrderProfit(o), 0).toLocaleString()}</p></div>
            </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center"><h2 className="text-sm font-bold uppercase tracking-widest text-blue-900 flex items-center gap-2"><Calendar className="w-4 h-4" /> Today's Activity</h2><button onClick={fetchOrders} className="text-xs font-bold bg-white border border-blue-200 text-blue-700 px-3 py-1 rounded hover:bg-blue-100"><RefreshCw className="w-3 h-3" /></button></div>
            
            {/* ORDERS SKELETON */}
            {isLoading ? (
                <div className="divide-y divide-gray-100">
                    {[1, 2, 3].map((i) => (
                        <div key={`skel-${i}`} className="p-6 flex items-center justify-between animate-pulse">
                            <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div className="space-y-2"><div className="h-4 w-32 bg-gray-200 rounded"></div><div className="h-3 w-24 bg-gray-200 rounded"></div></div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="space-y-2 text-right"><div className="h-4 w-20 bg-gray-200 rounded ml-auto"></div><div className="h-3 w-12 bg-gray-200 rounded ml-auto"></div></div>
                                <div className="h-8 w-24 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : todayOrders.length === 0 ? (<div className="p-8 text-center text-gray-400 text-sm italic">No active orders today.</div>) : (
                <div className="divide-y divide-gray-100">
                    {todayOrders.map(order => (
                        <div key={order.id} className="group">
                            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                                <div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${order.status === 'Paid' ? 'bg-green-500' : order.status === 'Shipped' ? 'bg-blue-500' : 'bg-yellow-500'}`}>{order.status[0]}</div><div><h3 className="text-sm font-bold">#{order.id} - {order.customer_name}</h3><p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString()} • {order.items.length} Items</p></div></div>
                                <div className="flex items-center gap-6 justify-between"><div className="text-right"><p className="text-sm font-bold font-mono">{order.currency} {order.total_price.toLocaleString()}</p><p className="text-[10px] font-bold text-green-600 bg-green-50 px-1 rounded">Profit: +{calculateOrderProfit(order).toLocaleString()}</p></div>
                                <select onClick={(e) => e.stopPropagation()} value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className={`text-xs font-bold px-3 py-1 rounded border outline-none ${order.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}><option>Pending</option><option>Paid</option><option>Shipped</option><option>Cancelled</option></select></div>
                            </div>
                            {expandedOrderId === order.id && (<div className="bg-gray-50 px-6 py-6 border-t border-gray-100"><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div><h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Customer</h4><p className="text-sm font-bold">{order.customer_name}</p><p className="text-sm">{order.customer_phone}</p><p className="text-sm mt-1">{order.customer_address}</p><button onClick={() => generateReceipt(order)} className="mt-4 text-xs font-bold bg-black text-white px-4 py-2 rounded flex items-center gap-2"><Printer className="w-3 h-3" /> Print Receipt</button></div><div><h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Items</h4>{order.items.map((i, idx) => <div key={idx} className="flex justify-between text-sm bg-white p-2 border rounded mb-1"><span>{i.name} ({i.variant}) x{i.qty}</span><span className="font-mono">{order.currency} {(i.price * i.qty).toLocaleString()}</span></div>)}</div></div></div>)}
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* History Section (Skeleton added inside when opened, but generally fast enough) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"><h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Order History ({pastOrders.length})</h2><button className="text-gray-400">{isHistoryOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</button></div>
            {isHistoryOpen && (
                <div className="divide-y divide-gray-100">
                    {currentHistoryOrders.map(order => (
                        <div key={order.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${order.status === 'Paid' ? 'bg-green-500' : 'bg-gray-400'}`}>{order.status[0]}</div><div><h3 className="text-sm font-bold">#{order.id} - {order.customer_name}</h3><p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p></div></div><div className="text-right"><p className="text-sm font-bold font-mono">{order.currency} {order.total_price.toLocaleString()}</p></div></div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}