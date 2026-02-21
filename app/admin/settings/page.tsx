"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { Save, Loader2, Settings as SettingsIcon, FileText, ImageIcon, UploadCloud, X, MapPin, Phone, Users, Clock, Star } from "lucide-react";

const SL_CITIES = [ "Colombo 01 - Fort", "Colombo 02 - Slave Island", "Colombo 03 - Colpetty", "Colombo 04 - Bambalapitiya", "Colombo 05 - Havelock Town", "Colombo 06 - Wellawatte", "Colombo 07 - Cinnamon Gardens", "Colombo 08 - Borella", "Dehiwala", "Mount Lavinia", "Ratmalana", "Moratuwa", "Panadura", "Kalutara", "Battaramulla", "Rajagiriya", "Nugegoda", "Maharagama", "Kottawa", "Homagama", "Kelaniya", "Kiribathgoda", "Kadawatha", "Wattala", "Kandana", "Ja-Ela", "Seeduwa", "Katunayake", "Negombo", "Gampaha", "Minuwangoda", "Veyangoda", "Kandy", "Peradeniya", "Gampola", "Matale", "Galle", "Matara", "Hikkaduwa", "Ambalangoda", "Kurunegala", "Chilaw", "Puttalam", "Anuradhapura", "Polonnaruwa", "Jaffna", "Trincomalee", "Batticaloa", "Ratnapura", "Avissawella", "Kegalle", "Badulla", "Bandarawela", "Nuwara Eliya" ];
const CITY_GROUPS = { "Colombo Area": ["Colombo 01 - Fort", "Colombo 02 - Slave Island", "Colombo 03 - Colpetty", "Colombo 04 - Bambalapitiya", "Colombo 05 - Havelock Town", "Colombo 06 - Wellawatte", "Colombo 07 - Cinnamon Gardens", "Colombo 08 - Borella", "Dehiwala", "Mount Lavinia", "Ratmalana", "Moratuwa", "Battaramulla", "Rajagiriya", "Nugegoda", "Maharagama"], "Gampaha / Negombo": ["Negombo", "Katunayake", "Seeduwa", "Ja-Ela", "Kandana", "Wattala", "Gampaha", "Minuwangoda"], "Down South": ["Galle", "Matara", "Hikkaduwa", "Ambalangoda"] };

export default function SettingsPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // <-- Added Loading State
  
  const [settings, setSettings] = useState({ id: null as number | null, whatsapp: "", banner_text: "", currency: "LKR", banner_interval: 5000, hero_images: [] as string[], receipt_brand: "SELA COSMETICS", receipt_sub: "Science Meets Skin", receipt_footer: "", region_assignments: {} as Record<string, string>, marquee_reviews: [] as string[] });
  const [heroFiles, setHeroFiles] = useState<File[]>([]);
  const [newMarqueeReview, setNewMarqueeReview] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [tempPhone, setTempPhone] = useState("");

  useEffect(() => { 
      const load = async () => {
          setIsLoading(true);
          await fetchSettings();
          setIsLoading(false);
      };
      load();
  }, []);

  async function fetchSettings() {
    const { data } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
    if (data) setSettings({ id: data.id, whatsapp: data.whatsapp || "", banner_text: data.banner_text || "", currency: data.currency || "LKR", banner_interval: data.banner_interval || 5000, hero_images: data.hero_images || [], receipt_brand: data.receipt_brand || "SELA COSMETICS", receipt_sub: data.receipt_sub || "Science Meets Skin", receipt_footer: data.receipt_footer || "", region_assignments: data.region_assignments || {}, marquee_reviews: data.marquee_reviews || [] });
  }

  const saveSettings = async (e: React.FormEvent) => { 
      e.preventDefault(); setUploading(true);
      try {
          const newHeroUrls: string[] = [];
          for (const file of heroFiles) {
              const fileExt = file.name.split('.').pop();
              const fileName = `${Math.random()}.${fileExt}`;
              const filePath = `hero-images/${fileName}`;
              const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
              if (uploadError) throw uploadError;
              const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
              newHeroUrls.push(publicUrl);
          }
          const updatedHeroImages = [...settings.hero_images, ...newHeroUrls];
          const updatePayload = { whatsapp: settings.whatsapp, banner_text: settings.banner_text, currency: settings.currency, banner_interval: settings.banner_interval, hero_images: updatedHeroImages, receipt_brand: settings.receipt_brand, receipt_sub: settings.receipt_sub, receipt_footer: settings.receipt_footer, region_assignments: settings.region_assignments, marquee_reviews: settings.marquee_reviews };
          if (settings.id) await supabase.from('site_settings').update(updatePayload).eq('id', settings.id);
          else await supabase.from('site_settings').insert(updatePayload);
          setSettings(prev => ({...prev, hero_images: updatedHeroImages})); setHeroFiles([]); await fetchSettings(); alert("Settings Saved Successfully!");
      } catch (error: any) { alert(`Error: ${error.message}`); } finally { setUploading(false); }
  };

  const handleAddMarqueeReview = () => { if(!newMarqueeReview.trim()) return; setSettings(prev => ({...prev, marquee_reviews: [...prev.marquee_reviews, newMarqueeReview]})); setNewMarqueeReview(""); };
  const removeMarqueeReview = (index: number) => { setSettings(prev => ({...prev, marquee_reviews: prev.marquee_reviews.filter((_, i) => i !== index)})); };
  const removeHeroImage = (index: number) => { setSettings(p => ({ ...p, hero_images: p.hero_images.filter((_, idx) => idx !== index) })); };
  const addCityToSelection = (e: React.ChangeEvent<HTMLSelectElement>) => { const city = e.target.value; if (city && !selectedCities.includes(city)) setSelectedCities([...selectedCities, city]); e.target.value = ""; };
  const addGroupToSelection = (groupName: keyof typeof CITY_GROUPS) => { setSelectedCities(Array.from(new Set([...selectedCities, ...CITY_GROUPS[groupName]]))); };
  const removeCityFromSelection = (c: string) => { setSelectedCities(selectedCities.filter(city => city !== c)); };
  const assignBulkNumber = () => { if(!tempPhone) return alert("Enter WhatsApp number"); const newMap = { ...settings.region_assignments }; selectedCities.forEach(c => newMap[c] = tempPhone); setSettings(p => ({ ...p, region_assignments: newMap })); setSelectedCities([]); setTempPhone(""); };
  const removeAssignment = (c: string) => { const newMap = { ...settings.region_assignments }; delete newMap[c]; setSettings(p => ({ ...p, region_assignments: newMap })); };

  if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`md:col-span-${i === 4 ? '12' : '4'} bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4`}>
                    <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
                    <div className="h-10 w-full bg-gray-100 rounded-lg"></div>
                    <div className="h-10 w-full bg-gray-100 rounded-lg"></div>
                    <div className="h-20 w-full bg-gray-100 rounded-lg"></div>
                </div>
            ))}
        </div>
      );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <form onSubmit={saveSettings} className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* General Settings */}
            <div className="md:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2"><SettingsIcon className="w-4 h-4" /> General</h3>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Rest of Island WhatsApp</label><input required type="text" value={settings.whatsapp} onChange={(e) => setSettings({...settings, whatsapp: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-black" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Store Currency</label><input required type="text" value={settings.currency} onChange={(e) => setSettings({...settings, currency: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-black" /></div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Banner Slide Speed (Seconds)</label>
                    <div className="relative"><Clock className="w-4 h-4 absolute left-3 top-3 text-gray-400" /><input type="number" min="1" value={settings.banner_interval ? settings.banner_interval / 1000 : ""} onChange={(e) => { const val = parseFloat(e.target.value); const newInterval = isNaN(val) ? 0 : Math.max(0, val * 1000); setSettings({...settings, banner_interval: newInterval}); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-3 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-black" /></div>
                </div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Announcement Banner</label><textarea required rows={4} value={settings.banner_text} onChange={(e) => setSettings({...settings, banner_text: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium outline-none resize-none focus:ring-2 focus:ring-black" /></div>
            </div>

            {/* Receipt Branding */}
            <div className="md:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2"><FileText className="w-4 h-4" /> Receipt Branding</h3>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Brand Name</label><input type="text" value={settings.receipt_brand} onChange={(e) => setSettings({...settings, receipt_brand: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-black" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Tagline</label><input type="text" value={settings.receipt_sub} onChange={(e) => setSettings({...settings, receipt_sub: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-black" /></div>
                <div className="flex-1 flex flex-col"><label className="text-xs font-bold text-gray-500 uppercase block mb-2">Footer Policy</label><textarea value={settings.receipt_footer} onChange={(e) => setSettings({...settings, receipt_footer: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium outline-none h-full min-h-[100px] resize-none focus:ring-2 focus:ring-black" /></div>
            </div>

            {/* Hero Banners */}
            <div className="md:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Hero Banner</h3>
                <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl p-4 overflow-y-auto max-h-[300px]">
                    <div className="grid grid-cols-2 gap-2">
                        {settings.hero_images.map((img, i) => (<div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 group"><Image src={img} alt="Hero" fill className="object-cover" /><button type="button" onClick={() => removeHeroImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3" /></button></div>))}
                        {heroFiles.map((file, i) => (<div key={`new-${i}`} className="relative aspect-video rounded-lg overflow-hidden border border-blue-200 opacity-70"><Image src={URL.createObjectURL(file)} alt="Preview" fill className="object-cover" /></div>))}
                        <label className="aspect-video bg-gray-50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 border border-transparent hover:border-gray-300 transition text-gray-400"><UploadCloud className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">ADD</span><input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setHeroFiles(prev => [...prev, ...Array.from(e.target.files || [])])} /></label>
                    </div>
                </div>
            </div>

            {/* Marquee Reviews */}
            <div className="md:col-span-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2"><Star className="w-4 h-4" /> Marquee Reviews</h3>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3 flex gap-2 items-start"><input type="text" placeholder="e.g. ⭐️⭐️⭐️⭐️⭐️ Love it!" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-black" value={newMarqueeReview} onChange={(e) => setNewMarqueeReview(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMarqueeReview())}/><button type="button" onClick={handleAddMarqueeReview} className="bg-black text-white px-6 py-3 rounded-lg text-xs font-bold hover:bg-gray-800 transition">Add</button></div>
                    <div className="md:w-2/3 border border-gray-100 rounded-lg p-3 bg-gray-50 overflow-y-auto space-y-2 max-h-[150px]">
                        {settings.marquee_reviews.map((rev, i) => (<div key={i} className="flex justify-between items-center bg-white p-3 rounded border border-gray-100 text-sm"><span>{rev}</span><button type="button" onClick={() => removeMarqueeReview(i)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition"><X className="w-4 h-4"/></button></div>))}
                        {settings.marquee_reviews.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4">No reviews added. Using default reviews on website.</p>}
                    </div>
                </div>
            </div>

            {/* Delivery Routing */}
            <div className="md:col-span-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-6"><h3 className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center gap-2"><MapPin className="w-4 h-4" /> Delivery Routing (Exceptions)</h3><div className="flex gap-2">{Object.keys(CITY_GROUPS).map((group) => (<button key={group} type="button" onClick={() => addGroupToSelection(group as keyof typeof CITY_GROUPS)} className="bg-gray-100 border border-gray-200 rounded-full px-3 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-200 whitespace-nowrap transition">+ {group}</button>))}</div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="flex flex-wrap gap-2 p-2 bg-white border border-gray-100 rounded-lg min-h-[40px] mb-3">{selectedCities.length === 0 && <span className="text-xs text-gray-400 self-center pl-1">Select cities to route...</span>}{selectedCities.map(city => (<span key={city} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">{city} <button type="button" onClick={() => removeCityFromSelection(city)}><X className="w-3 h-3 hover:text-blue-900" /></button></span>))}</div>
                            <div className="flex flex-col md:flex-row gap-2"><select className="md:w-1/3 bg-white border border-gray-200 rounded-lg p-2 text-xs h-10 outline-none" onChange={addCityToSelection}><option value="">Select City...</option>{SL_CITIES.map(city => <option key={city} value={city}>{city}</option>)}</select><div className="flex-1 flex items-center bg-white border border-gray-200 rounded-lg px-3"><Phone className="w-4 h-4 text-gray-400 mr-2" /><input className="w-full text-sm outline-none h-10" placeholder="Enter WhatsApp Number" value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} /></div><button type="button" onClick={assignBulkNumber} className="bg-black text-white px-6 rounded-lg text-xs font-bold h-10 flex items-center justify-center gap-2 hover:bg-gray-800 transition"><Users className="w-4 h-4" /> Assign</button></div>
                        </div>
                    </div>
                    <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8 space-y-2 max-h-60 overflow-y-auto pr-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 sticky top-0 bg-white z-10 py-1">Active Rules</h4>
                        {Object.entries(settings.region_assignments).map(([city, phone]) => (<div key={city} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 text-sm shadow-sm"><span className="font-medium">{city}</span><div className="flex items-center gap-3"><span className="font-mono text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100">{phone}</span><button type="button" onClick={() => removeAssignment(city)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition"><X className="w-4 h-4" /></button></div></div>))}
                        {Object.keys(settings.region_assignments).length === 0 && <p className="text-xs text-gray-400 italic">No exceptions created. All orders route to default number.</p>}
                    </div>
                </div>
            </div>

            <div className="col-span-1 md:col-span-12 flex justify-end pt-4 border-t border-gray-100">
                <button type="submit" disabled={uploading} className="px-8 py-3 bg-black text-white rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 transition flex items-center gap-2">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All Settings</button>
            </div>
            
        </form>
    </div>
  );
}