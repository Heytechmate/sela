"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf"; 
import { 
  Search, ShoppingBag, X, Minus, Plus, ArrowRight, Loader2, Star, 
  CheckCircle, AlertCircle, MessageCircle, ChevronLeft, ChevronRight,
  ClipboardList, Clock, Sparkles, Sun, Moon, User, Printer, Trash2
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

const DEFAULT_HERO_IMAGES = [
  "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=2574&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1596462502278-27bfdd403348?q=80&w=2574&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1556228720-1915d590a362?q=80&w=2574&auto=format&fit=crop"  
];

// --- 100+ MOTIVATIONAL QUOTES ---
const MOTIVATIONAL_QUOTES = [
  "Consistency is the only magic pill.",
  "Invest in your skin. It is going to represent you for a very long time.",
  "Your skin is 90% of your selfie.",
  "Skincare is a marathon, not a sprint.",
  "Glow is an inside job.",
  "Healthy skin is always in.",
  "Self-care is not selfish.",
  "Beautiful skin requires commitment, not a miracle.",
  "Filter free is the goal.",
  "Take time to make your soul happy... and your skin glowing.",
  "Exfoliate the bad vibes.",
  "Your skin is an investment, not an expense.",
  "Sleep, drink water, and treat your skin.",
  "Glowing skin is a result of proper skincare. It means you can wear less makeup and let your skin shine through.",
  "Be good to your skin. You’ll wear it every day for the rest of your life.",
  "Skincare is like dieting. You have to invest time and effort. There is no instant miracle cure.",
  "Happiness is a habit. So is your skincare.",
  "Don't forget to drink water and get some sun (with SPF!).",
  "Confidence breeds beauty.",
  "Wake up and makeup? No, wake up and skincare.",
  "The best foundation you can wear is healthy glowing skin.",
  "I regret taking such good care of my skin. – Said no one ever.",
  "SPF is your BFF.",
  "Your skin routine is a bank account. Good choices are good investments.",
  "May your coffee be strong and your SPF be stronger.",
  "Facials are my workout.",
  "Beauty is being comfortable in your own skin.",
  "You are one facial away from a good mood.",
  "Last minute skincare is better than no skincare.",
  "Peace, Love, and Face Masks.",
  "Less stress, more facials.",
  "Slay the day, but wash your face first.",
  "Skincare first, makeup second, smile always.",
  "Great skin doesn't happen by chance, it happens by appointment.",
  "Keep calm and moisturize on.",
  "A little progress each day adds up to big results.",
  "Respect your skin.",
  "Trust the process. Your skin is healing.",
  "Real skin has texture. Real skin has pores. Real skin is beautiful.",
  "Your skin is the best accessory. Take care of it.",
  "Every day is a fresh start for your skin.",
  "Don't let yesterday take up too much of today.",
  "Small daily improvements are the key to staggering long-term results.",
  "You glow differently when you take care of yourself.",
  "Protect your peace. Protect your skin.",
  "Hydrate. Moisturize. Repeat.",
  "Self-love looks good on you.",
  "Routine is what turns a dream into reality.",
  "Be patient with your skin.",
  "Beauty begins the moment you decide to be yourself.",
  "Skin cells turnover every 28 days. As we age this rate decreases.",
  "Aging is a fact of life. Looking your age is not.",
  "Sunscreen is the fountain of youth.",
  "Don't go to bed with your makeup on.",
  "Your face is your canvas.",
  "Start your day with a grateful heart and a clean face.",
  "Love the skin you're in.",
  "Time spent on yourself is never wasted.",
  "Cleanse, tone, moisturize, conquer.",
  "Focus on the good.",
  "Today is a perfect day to start.",
  "Discipline is doing what needs to be done, even if you don't want to.",
  "Your future self will thank you.",
  "Make yourself a priority.",
  "Relax, refresh, recharge.",
  "Inner beauty is great, but a little skincare never hurt.",
  "Life isn't perfect but your skin can be.",
  "Serums are magic potions.",
  "Just keep glowing.",
  "Don't rush the process.",
  "Listen to your skin.",
  "Feed your skin with good ingredients.",
  "Self-discipline is self-love.",
  "A healthy outside starts from the inside.",
  "Stress less, glow more.",
  "Good things come to those who cleanse.",
  "Be your own kind of beautiful.",
  "Let your skin breathe.",
  "Radiate positivity.",
  "Embrace your natural beauty.",
  "You are enough.",
  "A good skincare routine is the secret to aging gracefully.",
  "Consistency beats intensity.",
  "Keep your standards high and your skin clear.",
  "Face masks and chill.",
  "Get your glow on.",
  "Your skin remembers.",
  "Beauty is power, a smile is its sword.",
  "Give your skin a drink.",
  "Be consistent.",
  "Nature gives you the face you have at twenty; it is up to you to merit the face you have at fifty.",
  "Dermatologist tested, mother approved.",
  "Prevention is better than cure.",
  "Skincare is healthcare.",
  "The clearer the skin, the clearer the mind.",
  "It’s not vanity, it’s maintenance.",
  "You can't buy happiness, but you can buy skincare.",
  "Keep shining.",
  "Every step counts.",
  "Do it for the 'After' photo."
];

export default function Home() {
  // --- E-COMMERCE STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Settings
  const [siteSettings, setSiteSettings] = useState({
    whatsapp: "94770000000",
    bannerText: "Welcome to Sela Cosmetics",
    currency: "LKR",
    bannerInterval: 5000,
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
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({ name: "", phone: "", city: SL_CITIES[0], address: "" });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // --- ROUTINE GENERATOR STATE ---
  const [isRoutineOpen, setIsRoutineOpen] = useState(false);
  const [routineTab, setRoutineTab] = useState<'profile' | 'am' | 'pm'>('profile');
  const [routineForm, setRoutineForm] = useState({
      name: "",
      skinType: "Normal",
      wakeTime: "07:00",
      bedTime: "22:00",
      amProducts: ['Cleanser', 'SPF 50'] as string[],
      pmProducts: ['Cleanser', 'Moisturizer'] as string[]
  });
  const [newRoutineProduct, setNewRoutineProduct] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const scrollToShop = () => {
    const shopSection = document.getElementById("shop-section");
    if (shopSection) shopSection.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    async function init() {
      try {
          const { data: productsData } = await supabase.from('products').select('*').eq('is_active', true).order('id', { ascending: false });
          if (productsData) {
            setProducts(productsData);
            const allCategories = productsData.map(item => item.category);
            const hasSaleItems = productsData.some(p => p.is_on_sale);
            const uniqueCategories = Array.from(new Set(allCategories)).sort();
            setCategories(hasSaleItems ? ["All", "SALE", ...uniqueCategories] : ["All", ...uniqueCategories]);
          }
          const { data: settingsData } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
          if (settingsData) {
             setSiteSettings({
                whatsapp: settingsData.whatsapp,
                bannerText: settingsData.banner_text,
                currency: settingsData.currency,
                bannerInterval: settingsData.banner_interval || 5000,
                heroImages: settingsData.hero_images || [],
                regionAssignments: settingsData.region_assignments || {}
             });
          }
      } catch (error) { console.error("Failed to load data:", error); } finally { setLoading(false); }
    }
    init();
  }, [supabase]);

  const activeHeroImages = siteSettings.heroImages.length > 0 ? siteSettings.heroImages : DEFAULT_HERO_IMAGES;

  useEffect(() => {
    if (activeHeroImages.length <= 1) return;
    const timer = setInterval(() => setCurrentHeroIndex((prev) => (prev + 1) % activeHeroImages.length), siteSettings.bannerInterval); 
    return () => clearInterval(timer);
  }, [activeHeroImages.length, siteSettings.bannerInterval]);

  const addToCart = (product: Product, quantity = 1, variant: Variant | null = null) => {
    const availableStock = variant ? variant.stock : product.stock;
    if (availableStock <= 0) return alert("Out of stock!");
    
    const finalPrice = variant ? variant.price : product.price;
    const finalName = variant ? `${product.name} (${variant.name})` : product.name;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.name === finalName);
      if (existing) {
        if (existing.quantity + quantity > availableStock) { alert("Max stock reached."); return prev; }
        return prev.map(item => (item.id === product.id && item.name === finalName) ? { ...item, quantity: item.quantity + quantity } : item);
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

  // --- ROUTINE LOGIC ---
  const addRoutineProduct = (type: 'am' | 'pm') => {
    if (!newRoutineProduct.trim()) return;
    setRoutineForm(prev => ({
      ...prev,
      [type === 'am' ? 'amProducts' : 'pmProducts']: [...(type === 'am' ? prev.amProducts : prev.pmProducts), newRoutineProduct]
    }));
    setNewRoutineProduct('');
  };

  const removeRoutineProduct = (type: 'am' | 'pm', index: number) => {
    setRoutineForm(prev => ({
      ...prev,
      [type === 'am' ? 'amProducts' : 'pmProducts']: (type === 'am' ? prev.amProducts : prev.pmProducts).filter((_, i) => i !== index)
    }));
  };

  // --- PROFESSIONAL LANDSCAPE PDF GENERATOR ---
  const generateRoutinePDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    // --- HELPER VARIABLES ---
    const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
    const margin = 12; // Slightly smaller margin to maximize space
    const contentWidth = pageWidth - (margin * 2);
    
    // Grid Calculations (Wider now!)
    const dayWidth = 5.5; // Bigger circles for landscape
    const gridStartX = pageWidth - margin - (dayWidth * 31); // Where circles start
    const nameWidth = gridStartX - margin - 5; // Lots of space for names
    
    // Pick a Random Quote
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

    let currentY = 15;

    // --- 1. HEADER SIDE-BY-SIDE ---
    // In landscape, we put Brand on Left, Details on Right to save vertical space
    
    // Left: Brand
    doc.setFont("times", "bold");
    doc.setFontSize(24);
    doc.text("SELA COSMETICS", margin, currentY + 5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setCharSpace(2);
    doc.text("DAILY TRACKER", margin, currentY + 10);
    
    // Right: User Details & Month
    doc.setCharSpace(0);
    doc.setFontSize(10);
    doc.text("PREPARED FOR:", pageWidth - margin - 80, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(routineForm.name.toUpperCase() || "VALUED CUSTOMER", pageWidth - margin - 45, currentY);
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.line(pageWidth - margin - 45, currentY + 1, pageWidth - margin, currentY + 1);

    doc.setFont("helvetica", "normal");
    doc.text("MONTH:", pageWidth - margin - 80, currentY + 8);
    doc.line(pageWidth - margin - 45, currentY + 9, pageWidth - margin, currentY + 9);

    currentY += 20; // Move down for cards

    // --- HELPER FUNCTION TO DRAW A WIDE CARD ---
    const drawRoutineCard = (title: string, products: string[], startY: number, iconType: 'sun' | 'moon') => {
      const headerHeight = 12;
      const rowHeight = 9; // Slightly tighter vertically
      // Force at least 3 rows
      const displayProducts = products.length > 0 ? products : ["", "", ""];
      const cardHeight = headerHeight + (displayProducts.length * rowHeight) + 4;
      
      // Card Container
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, startY, contentWidth, cardHeight, 3, 3, 'S');

      // Title & Icon
      const textY = startY + 8;
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.text(title, margin + 12, textY);
      
      // Icon
      doc.setLineWidth(0.5);
      if (iconType === 'sun') {
        doc.circle(margin + 6, textY - 1.2, 2, 'S');
        // Sun rays (simple lines)
        doc.setLineWidth(0.1);
        doc.line(margin + 6, textY - 4.2, margin + 6, textY - 3.2); // Top
        doc.line(margin + 6, textY + 0.8, margin + 6, textY + 1.8); // Bottom
        doc.line(margin + 3, textY - 1.2, margin + 4, textY - 1.2); // Left
        doc.line(margin + 8, textY - 1.2, margin + 9, textY - 1.2); // Right
      } else {
        doc.setFillColor(0);
        doc.circle(margin + 6, textY - 1.2, 2, 'F');
        doc.setFillColor(255);
        doc.circle(margin + 7, textY - 2.2, 1.8, 'F'); // Crescent cut
      }

      // Days Grid Numbers
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(120);
      for (let i = 0; i < 31; i++) {
        const xPos = gridStartX + (i * dayWidth) + (dayWidth/2);
        // Label only 1, 5, 10...
        if ((i + 1) % 5 === 0 || i === 0) {
            doc.text((i + 1).toString(), xPos, textY, { align: "center" });
        }
      }
      doc.setTextColor(0);

      // Separator
      doc.setLineWidth(0.1);
      doc.line(margin, startY + headerHeight, pageWidth - margin, startY + headerHeight);

      // Rows
      let rowY = startY + headerHeight + 6;
      doc.setFontSize(10);
      
      displayProducts.forEach((prod) => {
        // Line Guide
        doc.setDrawColor(220);
        doc.line(margin + 5, rowY + 1, gridStartX - 5, rowY + 1);
        doc.setDrawColor(0);

        // Truncate Text
        let printText = prod;
        if (doc.getTextWidth(printText) > nameWidth) {
           while (doc.getTextWidth(printText + "...") > nameWidth && printText.length > 0) {
               printText = printText.slice(0, -1);
           }
           printText += "...";
        }

        doc.setFont("helvetica", "normal");
        doc.text(printText, margin + 5, rowY);
        
        // Circles
        for (let i = 0; i < 31; i++) {
          const circleX = gridStartX + (i * dayWidth) + (dayWidth/2);
          doc.circle(circleX, rowY - 1, 1.8, 'S'); // Larger 1.8mm circles
        }
        
        rowY += rowHeight;
      });

      return cardHeight;
    };

    // --- DRAW CARDS ---
    const amHeight = drawRoutineCard("MORNING ROUTINE", routineForm.amProducts, currentY, 'sun');
    currentY += amHeight + 8; // Small gap

    const pmHeight = drawRoutineCard("EVENING ROUTINE", routineForm.pmProducts, currentY, 'moon');
    currentY += pmHeight + 12;

    // --- RANDOM MOTIVATION QUOTE (Centered, Big) ---
    doc.setFont("times", "italic");
    doc.setFontSize(14);
    doc.setTextColor(80); // Dark Gray
    doc.text(`“${randomQuote}”`, pageWidth / 2, currentY, { align: "center" });

    // --- FOOTER ---
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    doc.text("www.selacosmetics.com", pageWidth / 2, pageHeight - 8, { align: "center" });

    doc.save(`Sela_Routine_${routineForm.name || "Tracker"}.pdf`);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault(); setIsPlacingOrder(true);
    try {
        const fullAddress = `${customerDetails.city}, ${customerDetails.address}`;
        const { error } = await supabase.from('orders').insert({
            customer_name: customerDetails.name, customer_phone: customerDetails.phone, customer_address: fullAddress,
            items: cart.map(i => ({ name: i.name, qty: i.quantity, price: i.price, variant: i.selectedVariant?.name || "Standard" })),
            total_price: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            currency: siteSettings.currency, status: 'Pending'
        });
        if (error) throw error;
        
        // WhatsApp Redirect
        const receipt = `ｧｾ *ORDER*\n側 ${customerDetails.name}\n腸 Total: ${siteSettings.currency} ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}`;
        const targetPhone = (siteSettings.regionAssignments || {})[customerDetails.city] || siteSettings.whatsapp;
        setCart([]); setIsCheckoutOpen(false); setIsPlacingOrder(false);
        window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(receipt)}`, '_blank');
    } catch (err) { alert("Error placing order."); setIsPlacingOrder(false); }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const filteredProducts = products.filter(p => (activeCategory === 'All' ? true : activeCategory === 'SALE' ? p.is_on_sale : p.category === activeCategory) && (searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <main className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-20 relative">
      
      <div className="bg-black text-white text-[10px] md:text-xs font-bold text-center py-2 tracking-widest uppercase">
        {siteSettings.bannerText}
      </div>

      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center relative">
          <div className="flex items-center gap-4 z-20">
            <div className={`flex items-center transition-all duration-300 ${isSearchOpen ? 'bg-gray-100 rounded-full pl-3 pr-2 py-1 w-32 md:w-64' : 'w-5'}`}>
                {isSearchOpen ? (
                    <>
                        <input ref={searchInputRef} type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        <button onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}><X className="w-4 h-4 text-gray-500 hover:text-black"/></button>
                    </>
                ) : (
                    <button onClick={() => setIsSearchOpen(true)}><Search className="w-5 h-5" /></button>
                )}
            </div>
          </div>
          <div className={`absolute left-1/2 -translate-x-1/2 transition-opacity duration-200 ${isSearchOpen ? 'opacity-0 pointer-events-none md:opacity-100' : 'opacity-100'}`}>
            <h1 className="text-2xl font-bold tracking-[0.2em] uppercase font-serif cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Sela.</h1>
          </div>
          <div className="flex items-center gap-6 z-20">
            <div className="relative cursor-pointer" onClick={() => setShowCart(true)}>
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-3.5 h-3.5 flex items-center justify-center rounded-full">{cart.reduce((a, b) => a + b.quantity, 0)}</span>}
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION (MOBILE OPTIMIZED) */}
      <section className="relative h-[85vh] md:h-[80vh] w-full bg-[#f4f4f4] flex items-center justify-center overflow-hidden group">
        
        {/* ARROWS: Hidden on Mobile (hidden), Visible on Desktop (md:block) */}
        <button 
          onClick={() => setCurrentHeroIndex(prev => prev === 0 ? activeHeroImages.length - 1 : prev - 1)} 
          className="hidden md:block absolute left-4 z-20 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setCurrentHeroIndex(prev => (prev + 1) % activeHeroImages.length)} 
          className="hidden md:block absolute right-4 z-20 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur-md transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* IMAGE */}
        <AnimatePresence mode="wait">
            <motion.div 
              key={currentHeroIndex} 
              initial={{ opacity: 0, scale: 1.05 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 1 }} 
              className="absolute inset-0 bg-gray-900" // Dark background to help image contrast
            >
                {/* Opacity lowered slightly on mobile for better text readability */}
                <Image 
                  src={activeHeroImages[currentHeroIndex]} 
                  alt="Hero" 
                  fill 
                  className="object-cover opacity-80 md:opacity-90" 
                  priority 
                />
                {/* Gradient Overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </motion.div>
        </AnimatePresence>

        {/* CONTENT */}
        <div className="relative z-10 text-center space-y-6 max-w-lg px-6 mt-10 md:mt-0">
          <h2 className="text-4xl md:text-6xl font-serif text-white drop-shadow-lg leading-tight">
            THE NEW <br className="md:hidden" /> STANDARD
          </h2>
          
          <p className="text-white/90 text-sm md:text-base font-medium tracking-wide drop-shadow-md max-w-xs mx-auto">
            Science-backed formulations for the modern minimalist.
          </p>
          
          {/* BUTTONS: Column on Mobile, Row on Desktop */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full pt-4">
             <button 
               onClick={scrollToShop} 
               className="w-full md:w-auto bg-white text-black px-8 py-4 md:py-3 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors duration-300 rounded-sm"
             >
               Shop Collection
             </button>
             
             <button 
               onClick={() => { setIsRoutineOpen(true); setRoutineTab('profile'); }} 
               className="w-full md:w-auto bg-black/40 backdrop-blur-md text-white border border-white/30 px-6 py-4 md:py-3 text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors duration-300 flex items-center justify-center gap-2 rounded-sm"
             >
                <Sparkles className="w-3 h-3" /> Free Routine
             </button>
          </div>
        </div>
      </section>

      {/* SHOP SECTION */}
      <div id="shop-section" className="sticky top-16 z-30 bg-white border-b border-gray-100 py-4 scroll-mt-20">
        <div className="flex justify-center gap-8 overflow-x-auto no-scrollbar px-6">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-xs font-bold uppercase tracking-widest whitespace-nowrap pb-1 border-b-2 transition-all duration-300 ${activeCategory === cat ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'} ${cat === 'SALE' ? 'text-red-600 border-red-600' : ''}`}>{cat}</button>
          ))}
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {loading ? <div className="flex justify-center py-32"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-12">
            {filteredProducts.map((product) => {
                const isSoldOut = (product.variants && product.variants.length > 0 ? product.variants.reduce((a,v)=>a+(v.stock||0),0) : product.stock) <= 0;
                return (
                    <div key={product.id} className={`group cursor-pointer ${isSoldOut ? 'opacity-70 pointer-events-none' : ''}`} onClick={() => !isSoldOut && openProduct(product)}>
                    <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden mb-4 rounded-sm">
                        <Image src={product.image_url} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
                        {product.is_on_sale && !isSoldOut && <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest shadow-sm z-10">Sale</div>}
                        {!isSoldOut && <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur text-black py-3 text-xs font-bold uppercase tracking-widest transition-transform duration-300 translate-y-0 md:translate-y-full md:group-hover:translate-y-0">Quick Add</button>}
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 line-clamp-1">{product.name}</h3>
                        <div className="flex flex-col items-start gap-0.5">
                            {product.is_on_sale && product.original_price && <span className="text-[10px] text-gray-400 line-through">Was {siteSettings.currency} {product.original_price.toLocaleString()}</span>}
                            <p className={`text-sm font-medium ${product.is_on_sale ? 'text-red-600 font-bold' : ''}`}>{siteSettings.currency} {product.price.toLocaleString()}</p>
                        </div>
                    </div>
                    </div>
                );
            })}
          </div>
        )}
      </section>

      {/* SHOPPING BAG */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCart(false)} className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.3 }} className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-white z-[70] shadow-2xl flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center"><h2 className="text-sm font-bold uppercase tracking-widest">Shopping Bag</h2><button onClick={() => setShowCart(false)}><X className="w-5 h-5" /></button></div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 {cart.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="flex gap-4">
                        <div className="relative w-20 h-24 bg-gray-100 shrink-0"><Image src={item.image_url} alt={item.name} fill className="object-cover" unoptimized /></div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <h3 className="text-sm font-bold uppercase line-clamp-1">{item.name}</h3>
                          <div className="flex justify-between items-center">
                             <div className="flex items-center border border-gray-200"><button onClick={() => removeFromCart(item.id, item.name)} className="px-2 py-1"><Minus className="w-3 h-3" /></button><span className="text-xs font-bold w-6 text-center">{item.quantity}</span><button onClick={() => addToCart(item, 1, item.selectedVariant)} className="px-2 py-1"><Plus className="w-3 h-3" /></button></div>
                             <p className="text-sm font-medium">{siteSettings.currency} {(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                 ))}
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                 <div className="flex justify-between items-end mb-4"><span className="text-xs font-bold uppercase text-gray-500">Total</span><span className="text-xl font-bold font-serif">{siteSettings.currency} {cartTotal.toLocaleString()}</span></div>
                 <button onClick={() => setIsCheckoutOpen(true)} disabled={cart.length === 0} className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-900 transition flex items-center justify-center gap-2">Checkout <ArrowRight className="w-4 h-4" /></button>
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
                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Full Name</label><input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black outline-none" value={customerDetails.name} onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Phone</label><input required type="tel" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black outline-none" value={customerDetails.phone} onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})} /></div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">City</label>
                        <select required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black outline-none" value={customerDetails.city} onChange={(e) => setCustomerDetails({...customerDetails, city: e.target.value})}>
                            {SL_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                    </div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Address</label><textarea required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black outline-none h-24" value={customerDetails.address} onChange={(e) => setCustomerDetails({...customerDetails, address: e.target.value})} /></div>
                    <div className="pt-4 border-t border-gray-100 text-center"><button type="submit" disabled={isPlacingOrder} className="w-full bg-black text-white py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition flex items-center justify-center gap-2">{isPlacingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Confirm Order</button></div>
                </form>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* TABBED ROUTINE GENERATOR MODAL */}
      <AnimatePresence>
        {isRoutineOpen && (
           <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRoutineOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-[100] flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="bg-black text-white p-6 relative">
                  <button onClick={() => setIsRoutineOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                  <h2 className="text-xl font-bold tracking-tight">Build Your Routine</h2>
                  <p className="text-sm text-gray-400 mt-1">Get a free, personalized schedule PDF instantly.</p>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-6 shrink-0">
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setRoutineTab('profile')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase rounded-lg transition-all ${routineTab === 'profile' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}><User className="w-4 h-4" /> Setup</button>
                    <button onClick={() => setRoutineTab('am')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase rounded-lg transition-all ${routineTab === 'am' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}><Sun className="w-4 h-4" /> Morning</button>
                    <button onClick={() => setRoutineTab('pm')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase rounded-lg transition-all ${routineTab === 'pm' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}><Moon className="w-4 h-4" /> Evening</button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {routineTab === 'profile' && (
                        <div className="space-y-5 animate-in slide-in-from-left-4 duration-300">
                            <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Your Name</label><input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-black" value={routineForm.name} onChange={(e) => setRoutineForm({...routineForm, name: e.target.value})} placeholder="e.g. Sarah" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Wake Up</label><input type="time" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none" value={routineForm.wakeTime} onChange={(e) => setRoutineForm({...routineForm, wakeTime: e.target.value})} /></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Bed Time</label><input type="time" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none" value={routineForm.bedTime} onChange={(e) => setRoutineForm({...routineForm, bedTime: e.target.value})} /></div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Skin Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Oily', 'Dry', 'Combo', 'Normal', 'Sensitive'].map(type => (
                                        <button key={type} onClick={() => setRoutineForm({...routineForm, skinType: type})} className={`py-2 text-xs font-bold rounded-lg border transition ${routineForm.skinType === type ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}>{type}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {(routineTab === 'am' || routineTab === 'pm') && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-gray-900">{routineTab === 'am' ? 'Morning Routine' : 'Evening Routine'}</h3><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{(routineTab === 'am' ? routineForm.amProducts : routineForm.pmProducts).length} items</span></div>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Add product..." value={newRoutineProduct} onChange={(e) => setNewRoutineProduct(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addRoutineProduct(routineTab)} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-black transition-colors" />
                                <button onClick={() => addRoutineProduct(routineTab)} className="bg-black text-white px-4 rounded-lg hover:bg-gray-800 transition-colors"><Plus className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-2">
                                {(routineTab === 'am' ? routineForm.amProducts : routineForm.pmProducts).map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                    <span className="text-sm font-medium text-gray-700">{item}</span>
                                    <button onClick={() => removeRoutineProduct(routineTab, idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                                </div>
                                ))}
                                {(routineTab === 'am' ? routineForm.amProducts : routineForm.pmProducts).length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">No products added yet.</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
                  {routineTab === 'profile' ? (
                    <button onClick={() => setRoutineTab('am')} className="w-full bg-black text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all">Next Step <ArrowRight className="w-4 h-4" /></button>
                  ) : (
                    <div className="flex gap-3">
                      {routineTab === 'am' ? (
                         <button onClick={() => setRoutineTab('pm')} className="flex-1 bg-black text-white py-3.5 rounded-xl font-bold">Go to Evening</button>
                      ) : (
                         <button onClick={generateRoutinePDF} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-200 transition-all"><Printer className="w-4 h-4" /> Generate PDF</button>
                      )}
                    </div>
                  )}
                </div>

             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* PRODUCT DETAILS MODAL */}
      <AnimatePresence>
        {isModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
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
                      
                      <div className="text-xl md:text-2xl font-bold mb-4 flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                              <span className={selectedProduct.is_on_sale ? "text-red-600" : ""}>{siteSettings.currency} {(activeVariant ? activeVariant.price : selectedProduct.price).toLocaleString()}</span>
                              {selectedProduct.is_on_sale && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full uppercase tracking-wider font-bold">On Sale</span>}
                          </div>
                          {selectedProduct.is_on_sale && selectedProduct.original_price && <span className="text-sm text-gray-400 line-through">Was: {siteSettings.currency} {selectedProduct.original_price.toLocaleString()}</span>}
                      </div>
                      
                      {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                        <div className="mb-6">
                           <label className="text-xs font-bold uppercase text-gray-900 mb-2 block">Size</label>
                           <div className="flex flex-wrap gap-2">
                              {selectedProduct.variants.map((v, i) => (
                                 <button key={i} disabled={v.stock <= 0} onClick={() => setActiveVariant(v)} className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded border transition-all ${activeVariant?.name === v.name ? 'border-black bg-black text-white ring-1 ring-black ring-offset-1' : v.stock <= 0 ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through' : 'border-gray-200 text-gray-500 hover:border-black'}`}>{v.name}</button>
                              ))}
                           </div>
                        </div>
                      )}
                      
                      <div className="mb-6 text-sm text-gray-600 leading-relaxed">
                          {isDescExpanded || !selectedProduct.description ? <p>{selectedProduct.description || "No description available."}</p> : <p>{selectedProduct.description.substring(0, 150)}... <button onClick={() => setIsDescExpanded(true)} className="font-bold text-black underline decoration-1 underline-offset-2 ml-1">Read More</button></p>}
                          {isDescExpanded && <button onClick={() => setIsDescExpanded(false)} className="font-bold text-black underline decoration-1 underline-offset-2 mt-1 text-xs">Show Less</button>}
                      </div>
                      
                      <a href={`https://wa.me/${siteSettings.whatsapp}?text=Hi Sela, I need advice on ${selectedProduct.name}`} target="_blank" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-green-600 transition mb-6 bg-gray-50 px-3 py-2 rounded-lg"><MessageCircle className="w-4 h-4" /> Ask an Expert on WhatsApp</a>
                   </div>
                   <div className="pt-4 border-t border-gray-100 flex gap-3">
                      <div className="flex items-center border border-gray-200 rounded-lg px-2 h-10">
                         <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} className="p-1"><Minus className="w-3 h-3 text-gray-500 hover:text-black"/></button>
                         <span className="w-8 text-center text-xs font-bold">{modalQty}</span>
                         <button onClick={() => setModalQty(modalQty + 1)} className="p-1"><Plus className="w-3 h-3 text-gray-500 hover:text-black"/></button>
                      </div>
                      
                      {(activeVariant && activeVariant.stock > 0) || (!activeVariant && (selectedProduct.variants?.reduce((a,v)=>a+v.stock,0) ?? selectedProduct.stock) > 0) ? (
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