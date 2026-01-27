'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Printer, RotateCcw, Download, Sun, Moon, Calendar } from 'lucide-react';

// --- Types ---
type RoutineItem = {
  id: string;
  name: string;
  category: 'AM' | 'PM' | 'Treatment' | 'Other';
  notes: string;
};

export default function FreeRoutineGenerator() {
  // --- State ---
  const [title, setTitle] = useState('My Monthly Skincare Routine');
  const [userName, setUserName] = useState('');
  
  const [items, setItems] = useState<RoutineItem[]>([
    { id: '1', name: 'Gentle Cleanser', category: 'AM', notes: 'Wash for 60 seconds' },
    { id: '2', name: 'Vitamin C Serum', category: 'AM', notes: 'Apply to dry skin' },
    { id: '3', name: 'Retinol 0.5%', category: 'PM', notes: 'Avoid eye area' },
  ]);

  // Form Input State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCat, setNewItemCat] = useState<'AM' | 'PM' | 'Treatment' | 'Other'>('AM');
  const [newItemNote, setNewItemNote] = useState('');

  // --- Handlers ---
  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setItems([...items, {
      id: crypto.randomUUID(),
      name: newItemName,
      category: newItemCat,
      notes: newItemNote
    }]);

    setNewItemName('');
    setNewItemNote('');
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col lg:flex-row">
      
      {/* ==================== LEFT PANEL: EDITOR (Hidden on Print) ==================== */}
      <div className="w-full lg:w-[400px] bg-white border-r border-slate-200 p-6 flex flex-col gap-6 shadow-xl z-10 print:hidden h-auto lg:h-screen lg:overflow-y-auto lg:sticky lg:top-0">
        
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Routine Builder</h1>
          <p className="text-sm text-slate-500 mt-1">Fill out the details below to generate your printable tracker.</p>
        </div>

        {/* Global Settings */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Tracker Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Your Name (Optional)</label>
            <input 
              type="text" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Sarah's Plan"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Add New Item Form */}
        <form onSubmit={addItem} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Product/Step
          </h3>
          
          <input 
            type="text" 
            placeholder="Product Name (e.g. Sunscreen)" 
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          />
          
          <div className="flex gap-2">
            <select 
              value={newItemCat}
              onChange={(e) => setNewItemCat(e.target.value as any)}
              className="w-1/3 border border-slate-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
              <option value="Treatment">Treat</option>
              <option value="Other">Other</option>
            </select>
            
            <input 
              type="text" 
              placeholder="Short Note (Optional)" 
              value={newItemNote}
              onChange={(e) => setNewItemNote(e.target.value)}
              className="w-2/3 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            />
          </div>

          <button 
            type="submit" 
            disabled={!newItemName}
            className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50"
          >
            Add to List
          </button>
        </form>

        {/* Active Items List */}
        <div className="flex-1 space-y-2">
          <h3 className="text-xs font-semibold uppercase text-slate-400">Current Items ({items.length})</h3>
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg text-sm group hover:border-blue-300 transition-colors">
              <div>
                <span className="font-semibold text-slate-800 block">{item.name}</span>
                <span className="text-xs text-slate-500 flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    item.category === 'AM' ? 'bg-amber-100 text-amber-700' :
                    item.category === 'PM' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {item.category}
                  </span>
                  {item.notes}
                </span>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Print Button */}
        <div className="pt-4 border-t border-slate-200">
          <button 
            onClick={handlePrint}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            Tip: Select "Save as PDF" in the print dialog.
          </p>
        </div>
      </div>

      {/* ==================== RIGHT PANEL: PREVIEW (What gets printed) ==================== */}
      <div className="flex-1 p-8 bg-slate-200/50 flex justify-center overflow-auto print:p-0 print:bg-white print:block">
        
        {/* A4 Paper Container */}
        <div 
          className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-[10mm] md:p-[15mm] print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0"
          style={{ aspectRatio: '210/297' }} // Enforces A4 ratio on screen
        >
          
          {/* --- PDF HEADER --- */}
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">{title}</h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                {userName && <span className="font-semibold">User: {userName}</span>}
                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">Month: __________________</span>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Consistency Tracker</div>
              <Calendar className="w-6 h-6 text-slate-300 ml-auto" />
            </div>
          </div>

          {/* --- MAIN GRID --- */}
          <div className="w-full">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="py-2 border-b-2 border-slate-800 w-[25%] text-xs font-bold uppercase tracking-wider text-slate-900">Product / Step</th>
                  <th className="py-2 border-b-2 border-slate-800 w-[8%] text-xs font-bold uppercase tracking-wider text-center text-slate-900">Time</th>
                  
                  {/* Days 1-31 */}
                  {Array.from({length: 31}).map((_, i) => (
                    <th key={i} className="py-2 border-b-2 border-slate-800 text-[9px] font-medium text-slate-500 text-center w-[2%] border-l border-slate-100">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={33} className="py-12 text-center text-slate-400 italic bg-slate-50 rounded-lg mt-4">
                      Add items on the left to populate this list.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50 print:bg-slate-50'}`}>
                      {/* Product Name & Notes */}
                      <td className="py-3 pr-2 align-middle">
                        <div className="font-semibold text-slate-800 text-sm">{item.name}</div>
                        {item.notes && <div className="text-[10px] text-slate-500 italic mt-0.5">{item.notes}</div>}
                      </td>
                      
                      {/* Category Icon/Text */}
                      <td className="py-3 border-l border-slate-200 text-center align-middle">
                        {item.category === 'AM' && <Sun className="w-4 h-4 mx-auto text-amber-500" />}
                        {item.category === 'PM' && <Moon className="w-4 h-4 mx-auto text-indigo-500" />}
                        {item.category !== 'AM' && item.category !== 'PM' && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{item.category.substring(0,4)}</span>
                        )}
                      </td>

                      {/* 31 Empty Checkboxes */}
                      {Array.from({length: 31}).map((_, i) => (
                        <td key={i} className="border-l border-slate-200 text-center p-0 h-full relative">
                          {/* This is the circle the user colors in physically */}
                          <div className="w-3 h-3 rounded-full border border-slate-300 mx-auto opacity-50 print:opacity-100"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                )}
                
                {/* Empty Rows for user to write in manually */}
                {Array.from({length: Math.max(0, 10 - items.length)}).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-b border-slate-100 print:border-slate-200 h-[45px]">
                    <td className="bg-slate-50/30"></td>
                    <td className="border-l border-slate-100"></td>
                    {Array.from({length: 31}).map((_, d) => (
                      <td key={d} className="border-l border-slate-100 text-center">
                        <div className="w-3 h-3 rounded-full border border-slate-200 mx-auto"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- FOOTER NOTES --- */}
          <div className="mt-8 grid grid-cols-2 gap-8 border-t-2 border-slate-200 pt-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Monthly Goals</h4>
              <div className="w-full h-20 border border-slate-200 rounded-lg bg-slate-50 print:bg-white print:border-slate-300"></div>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Notes / Skin Reactions</h4>
              <div className="w-full h-20 border border-slate-200 rounded-lg bg-slate-50 print:bg-white print:border-slate-300"></div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider">
             <span>Generated by [Your Website Name]</span>
             <span>Page 1 of 1</span>
          </div>

        </div>
      </div>
    </div>
  );
}