"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { LayoutGrid, Package, ShoppingCart, ArchiveX, Settings, LogOut, Menu, X, Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // If not logged in and not on the login page, redirect
      if (!session && pathname !== '/admin/login') {
        router.push("/admin/login");
      } else {
        setIsAuthenticated(true);
      }
      setIsMounted(true);
    };
    checkAuth();
  }, [router, pathname, supabase]);

  // Bypass layout entirely for the Login page
  if (pathname === '/admin/login') return <>{children}</>;

  if (!isMounted || !isAuthenticated) {
      return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const navLinks = [
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Active Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Cancelled", href: "/admin/cancelled", icon: ArchiveX },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#f9fafb] font-sans text-gray-900 overflow-hidden flex-col md:flex-row">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-30 sticky top-0">
          <div className="flex items-center gap-3">
              <div className="bg-black text-white p-2 rounded-lg"><LayoutGrid className="w-5 h-5" /></div>
              <h1 className="text-sm font-bold tracking-widest uppercase">Admin</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-50 rounded-lg">
              <Menu className="w-5 h-5 text-gray-700" />
          </button>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* SIDEBAR (Responsive) */}
      <aside className={`fixed md:relative top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-50 transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="bg-black text-white p-2 rounded-lg"><LayoutGrid className="w-5 h-5" /></div>
                  <h1 className="text-sm font-bold tracking-widest uppercase">Admin Panel</h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-black"><X className="w-5 h-5" /></button>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navLinks.map((link) => {
                  const isActive = pathname.startsWith(link.href);
                  return (
                      <Link 
                        key={link.href} 
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive ? "bg-black text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}
                      >
                          <link.icon className="w-4 h-4" /> {link.name}
                      </Link>
                  );
              })}
          </nav>
          <div className="p-4 border-t border-gray-100">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-full p-4 md:p-8 relative">
        {children}
      </main>
    </div>
  );
}