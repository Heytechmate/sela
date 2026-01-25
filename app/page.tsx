"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ShoppingBag, X, Minus, Plus, Menu, ArrowRight, Loader2, Star, 
  CheckCircle, AlertCircle, MessageCircle 
} from "lucide-react";

// --- TYPES ---
type Variant = { name: string; price: number; stock: number };

type Product = {
  id: number;
  name: string;
  price: number; 
  original_price?: number; 
  category: string;
  description?: string;
  tags?: string[];
  image_url: string;
  brand?: string;
  gallery?: string[];
  variants?: Variant[];
  usage_info?: string;
  ingredients?: string;
  stock: number;
  is_on_sale?: boolean;
};

type CartItem = Product & { quantity: number; selectedVariant: Variant | null };

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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Settings
  const [siteSettings, setSiteSettings] = useState({
    whatsapp: "94770000000",
    bannerText: "Welcome to Sela Cosmetics",
    currency: "LKR",
    heroImages: [] as string[],
    regionAssignments: {} as Record<string, string>
  });

  // UI State
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(""); 
  const [activeVariant, setActiveVariant] = useState<Variant | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [isDescExpanded, setIsDescExpanded] = useState(false); 

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({ name: "", phone: "", city: SL_CITIES[0], address: "" });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Scroll Helper
  const scrollToShop = () => {
    const shopSection = document.getElementById("shop-section");
    if (shopSection) {
      shopSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const fetchProducts = async () => {
    const { data: productsData } = await supabase.from('products').select('*').eq('is_active', true).order('id', { ascending: false });
    if (productsData) {
      setProducts(productsData);
      const allCategories = productsData.map(item => item.category);
      const hasSaleItems = productsData.some(p => p.is_on_sale);
      const uniqueCategories = Array.from(new Set(allCategories)).sort();
      if (hasSaleItems) {
          setCategories(["All", "SALE", ...uniqueCategories]);
      } else {
          setCategories(["All", ...uniqueCategories]);
      }
    }
  };

  useEffect(() => {
    async function init() {
      await fetchProducts();
      const { data: settingsData } = await supabase.from('site_settings').select('*').single();
      if (settingsData) {
         setSiteSettings({
            whatsapp: settingsData.whatsapp,
            bannerText: settingsData.banner_text,
            currency: settingsData.currency,
            heroImages: settingsData.hero_images || [],
            regionAssignments: settingsData.region_assignments || {}
         });
      }
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (siteSettings.heroImages.length <= 1) return;
    const timer = setInterval(() => setCurrentHeroIndex((prev) => (prev + 1) % siteSettings.heroImages.length), 5000); 
    return () => clearInterval(timer);
  }, [siteSettings.heroImages]);

  const getRealStock = (product: Product) => {
      if (product.variants && product.variants.length > 0) {
          return product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
      }
      return product.stock;
  };

  const addToCart = (product: Product, quantity = 1, variant: Variant | null = null) => {
    const availableStock = variant ? variant.stock : product.stock;
    if (availableStock <= 0) return alert("This item is out of stock!");
    if (quantity > availableStock) return alert(`Only ${availableStock} items available.`);

    const finalPrice = variant ? variant.price : product.price;
    const finalName = variant ? `${product.name} (${variant.name})` : product.name;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.name === finalName);
      if (existing) {
        if (existing.quantity + quantity > availableStock) { alert("Max stock reached."); return prev; }
        return prev.map(item => (item.id === product.id && item.name === finalName) ? { ...item, quantity: item.quantity + quantity, selectedVariant: variant } : item);
      }
      return [...prev, { ...product, name: finalName, price: finalPrice, quantity: quantity, selectedVariant: variant }];
    });
    setShowCart(true); 
    setIsModalOpen(false); 
  };

  const removeFromCart = (id: number, name: string) => {
    setCart(prev => prev.reduce((acc, item) => {
      if (item.id === id && item.name === name) {
        if (item.quantity > 1) acc.push({ ...item, quantity: item.quantity - 1, selectedVariant: item.selectedVariant });
      } else {
        acc.push(item);
      }
      return acc;
    }, [] as CartItem[]));
  };

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveImage(product.image_url);
    setModalQty(1);
    setIsDescExpanded(false); 
    if (product.variants && product.variants.length > 0) {
      const firstInStock = product.variants.find(v => v.stock > 0);
      setActiveVariant(firstInStock || product.variants[0]);
    } else {
      setActiveVariant(null);
    }
    setIsModalOpen(true);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const filteredProducts = products.filter(p => {
      const matchesCategory = activeCategory === 'All' ? true : activeCategory === 'SALE' ? p.is_on_sale : p.category === activeCategory;
      const matchesSearch = searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
  });

  const heroImageSrc = siteSettings.heroImages.length > 0 ? siteSettings.heroImages[currentHeroIndex] : "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=2574&auto=format&fit=crop";

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPlacingOrder(true);
    try {
        const fullAddress = `${customerDetails.city}, ${customerDetails.address}`;
        const { data: orderData, error } = await supabase.from('orders').insert({
            customer_name: customerDetails.name,
            customer_phone: customerDetails.phone,
            customer_address: fullAddress,
            items: cart.map(i => ({ name: i.name, qty: i.quantity, price: i.price, variant: i.selectedVariant?.name || "Standard" })),
            total_price: cartTotal,
            currency: siteSettings.currency,
            status: 'Pending'
        }).select().single();

        if (error) throw error;

        for (const item of cart) {
            const { data: currentProduct } = await supabase.from('products').select('*').eq('id', item.id).single();
            if (!currentProduct) continue;
            if (currentProduct.variants && currentProduct.variants.length > 0 && item.selectedVariant) {
                const updatedVariants = currentProduct.variants.map((v: Variant) => v.name === item.selectedVariant!.name ? { ...v, stock: Math.max(0, v.stock - item.quantity) } : v);
                const newTotalStock = updatedVariants.reduce((sum: number, v: Variant) => sum + v.stock, 0);
                await supabase.from('products').update({ variants: updatedVariants, stock: newTotalStock }).eq('id', item.id);
            } else {
                await supabase.from('products').update({ stock: Math.max(0, currentProduct.stock - item.quantity) }).eq('id', item.id);
            }
        }

        const receipt = `🧾 *ORDER #${orderData.id}*\n👤 ${customerDetails.name}\n📍 ${customerDetails.city}\n💰 Total: ${siteSettings.currency} ${cartTotal.toLocaleString()}`;
        const selectedCity = customerDetails.city.trim();
        const routingMap = siteSettings.regionAssignments || {};
        const targetPhone = routingMap[selectedCity] || siteSettings.whatsapp;

        setCart([]);
        setIsCheckoutOpen(false);
        setIsPlacingOrder(false);
        window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(receipt)}`, '_blank');
        await fetchProducts();

    } catch (err: any) {
        alert("Error placing order.");
        setIsPlacingOrder(false);
    }
  };

  const getTruncatedText = (text: string, limit: number) => text.length <= limit ? text : text.substring(0, limit) + "...";

  return (
    <main className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-20">
      
      <div className="bg-black text-white text-[10px] md:text-xs font-bold text-center py-2 tracking-widest uppercase">
        {siteSettings.bannerText}
      </div>

      {/* HEADER */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center relative">
          
          <div className="flex items-center gap-4 z-20">
            {/* SEARCH BAR - ADJUSTED WIDTH FOR MOBILE (w-32) TO PREVENT OVERLAP */}
            <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'bg-gray-100 rounded-full pl-3 pr-2 py-1 w-32 md:w-64' : 'w-5'}`}>
                {isSearchOpen ? (
                    <>
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            placeholder="Search..." 
                            className="bg-transparent border-none outline-none text-sm w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') scrollToShop(); }}
                        />
                        <button onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}><X className="w-4 h-4 text-gray-500 hover:text-black"/></button>
                    </>
                ) : (
                    <button onClick={() => setIsSearchOpen(true)}><Search className="w-5 h-5" /></button>
                )}
            </div>
          </div>

          {/* LOGO - HIDES ON MOBILE WHEN SEARCH IS OPEN */}
          <div className={`absolute left-1/2 -translate-x-1/2 transition-opacity duration-200 ${isSearchOpen ? 'opacity-0 pointer-events-none md:opacity-100' : 'opacity-100'}`}>
            <h1 className="text-2xl font-bold tracking-[0.2em] uppercase font-serif cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Sela.</h1>
          </div>

          <div className="flex items-center gap-6 z-20">
            <div className="relative cursor-pointer" onClick={() => setShowCart(true)}>
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="relative h-[60vh] md:h-[80vh] w-full bg-[#f4f4f4] flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
            <motion.div key={currentHeroIndex} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0 bg-gray-200">
                <Image src={heroImageSrc} alt="Hero" fill className="object-cover opacity-90" priority />
            </motion.div>
        </AnimatePresence>
        <div className="relative z-10 text-center space-y-4 max-w-lg px-4">
          <h2 className="text-4xl md:text-6xl font-serif text-white mix-blend-difference drop-shadow-sm">THE NEW STANDARD</h2>
          <p className="text-white/90 text-sm md:text-base font-medium tracking-wide drop-shadow-md">Science-backed formulations for the modern minimalist.</p>
          <button onClick={scrollToShop} className="bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors duration-300">Shop Collection</button>
        </div>
      </section>

      <div id="shop-section" className="sticky top-16 z-30 bg-white border-b border-gray-100 py-4 scroll-mt-20">
        <div className="flex justify-center gap-8 overflow-x-auto no-scrollbar px-6">
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)} 
              className={`text-xs font-bold uppercase tracking-widest whitespace-nowrap pb-1 border-b-2 transition-all duration-300 ${activeCategory === cat ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'} ${cat === 'SALE' ? 'text-red-600 border-red-600' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-32"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-12">
            {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-20 text-gray-400">
                    <p>No products found.</p>
                </div>
            ) : (
                filteredProducts.map((product) => {
                const realStock = getRealStock(product);
                const isSoldOut = realStock <= 0;
                
                return (
                    <div 
                    key={product.id} 
                    className={`group cursor-pointer ${isSoldOut ? 'opacity-70 pointer-events-none' : ''}`}
                    onClick={() => !isSoldOut && openProduct(product)}
                    >
                    <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden mb-4 rounded-sm">
                        <Image src={product.image_url} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
                        
                        {product.is_on_sale && !isSoldOut && (
                            <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest shadow-sm z-10">
                                Sale
                            </div>
                        )}

                        {isSoldOut && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] z-10">
                                <span className="bg-white text-black text-xs font-bold px-4 py-2 uppercase tracking-widest border border-black">Sold Out</span>
                            </div>
                        )}

                        {/* QUICK ADD - NOW VISIBLE ON MOBILE BY DEFAULT */}
                        {!isSoldOut && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
                            className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur text-black py-3 text-xs font-bold uppercase tracking-widest transition-transform duration-300 translate-y-0 md:translate-y-full md:group-hover:translate-y-0"
                        >
                            Quick Add
                        </button>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 group-hover:underline decoration-1 underline-offset-4 line-clamp-1">{product.name}</h3>
                        
                        <div className="flex flex-col items-start gap-0.5">
                            {/* ORIGINAL PRICE (STRIKETHROUGH) - DISPLAYED FIRST */}
                            {product.is_on_sale && product.original_price ? (
                                <span className="text-[10px] text-gray-400 line-through">
                                    Was {siteSettings.currency} {product.original_price.toLocaleString()}
                                </span>
                            ) : null}

                            {/* NEW SELLING PRICE (HIGHLIGHTED) */}
                            <p className={`text-sm font-medium ${product.is_on_sale ? 'text-red-600 font-bold' : ''}`}>
                                {siteSettings.currency} {product.price.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    </div>
                );
                })
            )}
          </div>
        )}
      </section>

      {/* SHOPPING BAG */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCart(false)} className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.3 }} className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-white z-[70] shadow-2xl flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-widest">Shopping Bag</h2>
                <button onClick={() => setShowCart(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4"><ShoppingBag className="w-10 h-10 opacity-20" /><p className="text-sm uppercase tracking-wider">Empty</p></div>
                 ) : (
                    cart.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="flex gap-4">
                        <div className="relative w-20 h-24 bg-gray-100 shrink-0"><Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized /></div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <h3 className="text-sm font-bold uppercase line-clamp-1">{item.name}</h3>
                          <div className="flex justify-between items-center">
                             <div className="flex items-center border border-gray-200"><button onClick={() => removeFromCart(item.id, item.name)} className="px-2 py-1 hover:bg-gray-50"><Minus className="w-3 h-3" /></button><span className="text-xs font-bold w-6 text-center">{item.quantity}</span><button onClick={() => addToCart(item, 1, item.selectedVariant)} className="px-2 py-1 hover:bg-gray-50"><Plus className="w-3 h-3" /></button></div>
                             <p className="text-sm font-medium">{siteSettings.currency} {(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                 )}
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                 <div className="flex justify-between items-end mb-4"><span className="text-xs font-bold uppercase text-gray-500">Total</span><span className="text-xl font-bold font-serif">{siteSettings.currency} {cartTotal.toLocaleString()}</span></div>
                 <button onClick={() => setIsCheckoutOpen(true)} disabled={cart.length === 0} className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2">Checkout <ArrowRight className="w-4 h-4" /></button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CHECKOUT MODAL */}
      <AnimatePresence>
        {isCheckoutOpen && (
           <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCheckoutOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden z-[90]">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center"><h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Finalize Order</h2><button onClick={() => setIsCheckoutOpen(false)}><X className="w-5 h-5" /></button></div>
                <form onSubmit={handlePlaceOrder} className="p-8 space-y-4">
                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Full Name</label><input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="John Doe" value={customerDetails.name} onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Phone Number</label><input required type="tel" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black outline-none" placeholder="077 123 4567" value={customerDetails.phone} onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})} /></div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Select City / Area</label>
                        <select 
                            required 
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black outline-none"
                            value={customerDetails.city}
                            onChange={(e) => setCustomerDetails({...customerDetails, city: e.target.value})}
                        >
                            {SL_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                    </div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Street Address / Details</label><textarea required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black outline-none h-24" placeholder="123 Lotus Rd, Near the temple..." value={customerDetails.address} onChange={(e) => setCustomerDetails({...customerDetails, address: e.target.value})} /></div>
                    <div className="pt-4 border-t border-gray-100 text-center"><p className="text-xs text-gray-400 mb-4">Stock will be reserved upon confirmation.</p><button type="submit" disabled={isPlacingOrder} className="w-full bg-black text-white py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition flex items-center justify-center gap-2">{isPlacingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Confirm & Send Receipt</button></div>
                </form>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* PRODUCT DETAILS MODAL */}
      <AnimatePresence>
        {isModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", duration: 0.5 }} className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-gray-100 transition"><X className="w-5 h-5" /></button>
                <div className="w-full md:w-1/2 bg-gray-50 p-6 flex flex-col gap-4 overflow-y-auto">
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white border border-gray-100"><Image src={activeImage || selectedProduct.image_url} alt={selectedProduct.name} fill className="object-cover" unoptimized /></div>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                       <button onClick={() => setActiveImage(selectedProduct.image_url)} className={`relative w-14 h-14 rounded-lg overflow-hidden border transition-all ${activeImage === selectedProduct.image_url ? 'border-black ring-1 ring-black ring-offset-2' : 'border-transparent hover:opacity-80'}`}><Image src={selectedProduct.image_url} alt="Main" fill className="object-cover" unoptimized /></button>
                       {selectedProduct.gallery?.map((img, i) => (<button key={i} onClick={() => setActiveImage(img)} className={`relative w-14 h-14 rounded-lg overflow-hidden border transition-all ${activeImage === img ? 'border-black ring-1 ring-black ring-offset-2' : 'border-transparent hover:opacity-80'}`}><Image src={img} alt="" fill className="object-cover" unoptimized /></button>))}
                    </div>
                </div>
                <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto">
                   <div className="mb-auto">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{selectedProduct.brand || "Sela Cosmetics"}</span>
                      <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2 leading-tight">{selectedProduct.name}</h2>
                      <div className="flex items-center gap-2 mb-6"><div className="flex text-yellow-500"><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/><Star className="w-3 h-3 fill-current"/></div><span className="text-xs text-gray-400 font-bold">(4.9)</span></div>
                      
                      {/* MODAL PRICE DISPLAY */}
                      <div className="text-xl md:text-2xl font-bold mb-4 flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                              <span className={selectedProduct.is_on_sale ? "text-red-600" : ""}>{siteSettings.currency} {(activeVariant ? activeVariant.price : selectedProduct.price).toLocaleString()}</span>
                              {selectedProduct.is_on_sale && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full uppercase tracking-wider font-bold">On Sale</span>}
                          </div>
                          
                          {/* SHOW ORIGINAL PRICE IN MODAL */}
                          {selectedProduct.is_on_sale && selectedProduct.original_price && (
                              <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-400 line-through">Was: {siteSettings.currency} {selectedProduct.original_price.toLocaleString()}</span>
                                  <span className="text-xs text-green-600 font-bold uppercase tracking-wide">
                                      Save {siteSettings.currency} {(selectedProduct.original_price - selectedProduct.price).toLocaleString()}
                                  </span>
                              </div>
                          )}
                      </div>
                      
                      {activeVariant && activeVariant.stock < 5 && activeVariant.stock > 0 && (
                        <div className="mb-6 flex items-center gap-2 text-red-600 bg-red-50 w-fit px-3 py-1.5 rounded-full"><div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" /><span className="text-[10px] font-bold uppercase tracking-wider">Only {activeVariant.stock} left in stock</span></div>
                      )}
                      
                      {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                        <div className="mb-6">
                           <label className="text-xs font-bold uppercase text-gray-900 mb-2 block">Size</label>
                           <div className="flex flex-wrap gap-2">
                              {selectedProduct.variants.map((v, i) => (
                                 <button 
                                   key={i} 
                                   disabled={v.stock <= 0}
                                   onClick={() => setActiveVariant(v)} 
                                   className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded border transition-all ${activeVariant?.name === v.name ? 'border-black bg-black text-white ring-1 ring-black ring-offset-1' : v.stock <= 0 ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through' : 'border-gray-200 text-gray-500 hover:border-black'}`}
                                 >
                                    {v.name}
                                 </button>
                              ))}
                           </div>
                        </div>
                      )}

                      <div className="mb-6 text-sm text-gray-600 leading-relaxed">
                          {isDescExpanded || !selectedProduct.description ? (
                              <p>{selectedProduct.description || "No description available."}</p>
                          ) : (
                              <p>{getTruncatedText(selectedProduct.description, 150)} <button onClick={() => setIsDescExpanded(true)} className="font-bold text-black underline decoration-1 underline-offset-2 ml-1">Read More</button></p>
                          )}
                          {isDescExpanded && <button onClick={() => setIsDescExpanded(false)} className="font-bold text-black underline decoration-1 underline-offset-2 mt-1 text-xs">Show Less</button>}
                      </div>

                      <a 
                        href={`https://wa.me/${siteSettings.whatsapp}?text=Hi Sela, I need advice on ${selectedProduct.name}`} 
                        target="_blank" 
                        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-green-600 transition mb-6 bg-gray-50 px-3 py-2 rounded-lg"
                      >
                        <MessageCircle className="w-4 h-4" /> Not sure? Ask an Expert on WhatsApp
                      </a>

                   </div>
                   <div className="pt-4 border-t border-gray-100 flex gap-3">
                      <div className="flex items-center border border-gray-200 rounded-lg px-2 h-10">
                         <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} className="p-1"><Minus className="w-3 h-3 text-gray-500 hover:text-black"/></button>
                         <span className="w-8 text-center text-xs font-bold">{modalQty}</span>
                         <button onClick={() => setModalQty(modalQty + 1)} className="p-1"><Plus className="w-3 h-3 text-gray-500 hover:text-black"/></button>
                      </div>
                      
                      {(activeVariant && activeVariant.stock > 0) || (!activeVariant && getRealStock(selectedProduct) > 0) ? (
                          <button onClick={() => addToCart(selectedProduct, modalQty, activeVariant)} className="flex-1 bg-black text-white rounded-lg h-10 font-bold text-xs uppercase tracking-[0.15em] hover:bg-gray-800 transition flex items-center justify-center gap-2">Add to Bag</button>
                      ) : (
                          <button disabled className="flex-1 bg-gray-200 text-gray-400 rounded-lg h-10 font-bold text-xs uppercase tracking-[0.15em] cursor-not-allowed flex items-center justify-center gap-2"><AlertCircle className="w-4 h-4" /> Sold Out</button>
                      )}
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}