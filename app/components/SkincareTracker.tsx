'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Printer, Check, X, FileText, Settings, Type } from 'lucide-react';

// --- Types ---
type Product = {
  id: string;
  name: string;
  frequency: 'Daily' | 'AM' | 'PM' | 'Weekly' | string;
};

type DailyLog = {
  [day: number]: {
    [productId: string]: boolean;
  };
};

export default function SkincarePrintable() {
  // --- State ---
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Vitamin C Serum', frequency: 'AM' },
    { id: '2', name: 'Retinol 0.5%', frequency: 'PM' },
    { id: '3', name: 'Moisturizer', frequency: 'Daily' },
  ]);
  
  const [logs, setLogs] = useState<DailyLog>({});
  
  // Editor State
  const [monthTitle, setMonthTitle] = useState('My Skincare Routine');
  const [printMode, setPrintMode] = useState<'template' | 'filled'>('template');
  
  // Form State
  const [newProductName, setNewProductName] = useState('');
  const [newProductFreq, setNewProductFreq] = useState('Daily');

  // --- Handlers ---

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: newProductName.trim(),
      frequency: newProductFreq,
    };

    setProducts([...products, newProduct]);
    setNewProductName('');
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const toggleStatus = (day: number, productId: string) => {
    setLogs((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [productId]: !prev[day]?.[productId],
      },
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Helpers ---
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-slate-50/50 print:bg-white p-6 md:p-12 font-sans text-slate-900">
      
      {/* ------------------- CONTROLS (Hidden on Print) ------------------- */}
      <div className="max-w-7xl mx-auto mb-10 print:hidden space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tracker Builder</h1>
            <p className="text-slate-500 mt-2 max-w-lg">
              Add your products below, customize the title, and then click "Download PDF" to generate a printable monthly sheet.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={() => setPrintMode('template')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                printMode === 'template' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Blank Template
            </button>
            <div className="w-px h-6 bg-slate-200" />
            <button
              onClick={() => setPrintMode('filled')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                printMode === 'filled' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Include Checks
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95"
          >
            <Printer className="w-5 h-5" />
            Download / Print PDF
          </button>
        </div>

        {/* Add Product Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center">
          <div className="flex-grow w-full md:w-auto">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Product Name</label>
            <input
              type="text"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="Ex: Niacinamide Serum"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          
          <div className="w-full md:w-48">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">When to use?</label>
            <input
              type="text"
              value={newProductFreq}
              onChange={(e) => setNewProductFreq(e.target.value)}
              placeholder="Ex: AM / Daily"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleAddProduct}
            disabled={!newProductName.trim()}
            className="w-full md:w-auto bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* ------------------- PREVIEW / PRINT AREA ------------------- */}
      {/* This section becomes the PDF page. We use inline styles for print safety. */}
      <div className="max-w-[1100px] mx-auto bg-white p-8 md:p-12 rounded-none md:rounded-2xl shadow-none md:shadow-2xl print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none">
        
        {/* Paper Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-8 print:mb-4">
          <div className="space-y-2 w-full">
            <input
              type="text"
              value={monthTitle}
              onChange={(e) => setMonthTitle(e.target.value)}
              className="text-4xl font-bold text-slate-900 w-full bg-transparent border-none focus:ring-0 placeholder:text-slate-300 p-0 print:text-3xl"
              placeholder="Click to Edit Title..."
            />
            <div className="flex items-center gap-4 text-sm text-slate-500 print:text-slate-600">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Monthly Routine Log
              </span>
              <span className="w-px h-4 bg-slate-300"></span>
              <span className="italic">Goal: Consistency</span>
            </div>
          </div>
          {/* Logo or Brand placeholder for print */}
          <div className="hidden print:block text-right">
            <div className="text-xs text-slate-400 uppercase tracking-widest">Date Start:</div>
            <div className="w-32 h-8 border-b border-slate-300 mt-1"></div>
          </div>
        </div>

        {/* The Grid */}
        <div className="overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="py-2 pr-4 font-bold text-slate-900 border-b-2 border-slate-200 w-[200px] text-sm uppercase tracking-wide">
                  Product / Routine
                </th>
                <th className="py-2 font-bold text-slate-900 border-b-2 border-slate-200 w-[80px] text-xs uppercase tracking-wide text-center">
                  Freq
                </th>
                {/* Day Headers */}
                {days.map((day) => (
                  <th key={day} className="py-2 border-b-2 border-slate-200 text-[10px] text-center font-medium text-slate-500 w-6">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={33} className="py-12 text-center text-slate-400 italic">
                    Add products above to populate your list.
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => (
                  <tr key={product.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50 print:bg-transparent'}>
                    <td className="py-3 pr-4 border-b border-slate-200 group relative">
                      {/* Product Name */}
                      <span className="font-semibold text-slate-800">{product.name}</span>
                      
                      {/* Delete Button (Hidden on Print) */}
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="absolute left-[-30px] top-1/2 -translate-y-1/2 p-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                    
                    <td className="py-3 border-b border-slate-200 text-center text-xs text-slate-500 font-medium">
                      {product.frequency}
                    </td>

                    {/* Checkboxes */}
                    {days.map((day) => {
                      const isChecked = logs[day]?.[product.id];
                      
                      return (
                        <td key={day} className="border-b border-slate-200 text-center border-l border-slate-100 print:border-l-slate-200">
                          {printMode === 'filled' ? (
                            // Interactive Mode: Clickable
                            <div 
                              onClick={() => toggleStatus(day, product.id)}
                              className="w-full h-full flex items-center justify-center cursor-pointer py-1 print:cursor-default"
                            >
                              {isChecked ? (
                                <div className="w-4 h-4 bg-slate-800 text-white rounded-sm flex items-center justify-center print:bg-black print:text-white">
                                  <Check className="w-3 h-3" strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="w-4 h-4 border border-slate-300 rounded-sm hover:border-slate-500"></div>
                              )}
                            </div>
                          ) : (
                            // Template Mode: Always blank circles for printing
                            <div className="flex items-center justify-center py-1">
                              <div className="w-4 h-4 border border-slate-300 rounded-full print:border-slate-400"></div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Notes Area for Print */}
        <div className="mt-8 pt-8 border-t border-slate-200 grid grid-cols-2 gap-12 print:grid">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Notes & Observations</h4>
            <div className="w-full h-24 border border-slate-200 rounded-lg bg-slate-50 print:bg-transparent print:border-slate-300"></div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Next Month Adjustments</h4>
            <div className="w-full h-24 border border-slate-200 rounded-lg bg-slate-50 print:bg-transparent print:border-slate-300"></div>
          </div>
        </div>

      </div>
    </div>
  );
}