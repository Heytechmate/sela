"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ArchiveX, ChevronDown, ChevronUp } from "lucide-react";

type OrderItem = { name: string; qty: number; price: number; variant: string; };
type Order = { id: number; created_at: string; customer_name: string; customer_phone: string; customer_address: string; items: OrderItem[]; total_price: number; status: string; currency: string; };

export default function CancelledPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { 
      const load = async () => {
          setIsLoading(true);
          await fetchOrders(); 
          setIsLoading(false);
      };
      load();
  }, []);
  
  async function fetchOrders() { const { data } = await supabase.from('orders').select('*').eq('status', 'Cancelled').order('created_at', { ascending: false }); if (data) setOrders(data); }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center"><h2 className="text-sm font-bold uppercase tracking-widest text-red-900 flex items-center gap-2"><ArchiveX className="w-4 h-4" /> Cancelled Orders ({orders.length})</h2></div>
            
            {isLoading ? (
                <div className="divide-y divide-gray-100">
                    {[1, 2, 3].map((i) => (
                        <div key={`skel-${i}`} className="p-6 flex items-center justify-between animate-pulse">
                            <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div className="space-y-2"><div className="h-4 w-32 bg-gray-200 rounded"></div><div className="h-3 w-24 bg-gray-200 rounded"></div></div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="h-4 w-20 bg-gray-200 rounded ml-auto"></div>
                                <div className="h-8 w-24 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No cancelled orders.</div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {orders.map(order => (
                        <div key={order.id} className="group">
                            <div className="p-6 flex flex-col md:flex-row justify-between gap-4 bg-red-50/30 hover:bg-red-50 cursor-pointer" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                                <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs bg-red-500">C</div><div><h3 className="text-sm font-bold line-through text-gray-500">#{order.id} - {order.customer_name}</h3><p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p></div></div>
                                <div className="flex items-center gap-6"><p className="text-sm font-bold font-mono text-gray-400 line-through">{order.currency} {order.total_price.toLocaleString()}</p><span className="text-xs font-bold px-3 py-1 rounded bg-red-100 text-red-700">Cancelled</span></div>
                            </div>
                            {expandedOrderId === order.id && (<div className="bg-gray-50 px-6 py-6 border-t border-gray-100"><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div><h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Customer</h4><p className="text-sm font-bold">{order.customer_name}</p><p className="text-sm">{order.customer_phone}</p></div><div><h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Items (Returned)</h4>{order.items.map((i, idx) => <div key={idx} className="flex justify-between text-sm bg-white p-2 border rounded mb-1"><span>{i.name}</span><span className="line-through">{order.currency} {(i.price * i.qty).toLocaleString()}</span></div>)}</div></div></div>)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}