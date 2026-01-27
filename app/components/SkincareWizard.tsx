'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Sun, Moon, Sparkles, Printer, CheckCircle2, RotateCcw } from 'lucide-react';

// --- Types ---
type RoutineItem = {
  id: string;
  name: string;
  category: 'AM' | 'PM' | 'Treatment';
  notes?: string;
};

// --- Main Component ---
export default function SkincareWizard() {
  // --- State ---
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [items, setItems] = useState<RoutineItem[]>([]);
  
  // Temporary Input State
  const [inputValue, setInputValue] = useState('');

  // --- Actions ---
  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const addItem = (category: 'AM' | 'PM' | 'Treatment') => {
    if (!inputValue.trim()) return;
    setItems([...items, {
      id: crypto.randomUUID(),
      name: inputValue,
      category,
    }]);
    setInputValue('');
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Render Steps ---
  
  // STEP 1: Welcome & Name
  if (step === 1) {
    return (
      <WizardShell step={1} totalSteps={4}>
        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Let's build your routine.</h1>
          <p className="text-slate-500">We'll create a custom printable tracker for you. First, who is this for?</p>
          
          <input
            autoFocus
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && userName && nextStep()}
            className="w-full text-center text-2xl border-b-2 border-slate-200 focus:border-rose-500 outline-none py-2 bg-transparent placeholder:text-slate-300 transition-colors"
          />
          
          <button
            onClick={nextStep}
            disabled={!userName}
            className="w-full mt-8 bg-slate-900 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
          >
            Start <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </WizardShell>
    );
  }

  // STEP 2: Morning Products
  if (step === 2) {
    return (
      <WizardShell step={2} totalSteps={4} onBack={prevStep}>
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="flex items-center gap-3 mb-2">
            <Sun className="w-8 h-8 text-amber-500" />
            <h2 className="text-2xl font-bold text-slate-900">Morning Routine</h2>
          </div>
          <p className="text-slate-500 text-sm">What products do you use when you wake up? (e.g. Cleanser, SPF)</p>

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem('AM')}
              placeholder="Add product..."
              className="flex-1 border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            <button 
              onClick={() => addItem('AM')}
              disabled={!inputValue}
              className="bg-amber-100 text-amber-700 font-bold px-4 rounded-lg hover:bg-amber-200 transition-colors"
            >
              Add
            </button>
          </div>

          {/* List */}
          <div className="space-y-2">
            {items.filter(i => i.category === 'AM').map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-amber-50 border border-amber-100 rounded-lg animate-in zoom-in-95 duration-200">
                <span className="font-medium text-slate-800">{item.name}</span>
                <button onClick={() => removeItem(item.id)} className="text-amber-400 hover:text-rose-500 p-1">×</button>
              </div>
            ))}
          </div>

          <button onClick={nextStep} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold mt-4 flex justify-center gap-2">
            Next Step <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </WizardShell>
    );
  }

  // STEP 3: Evening Products
  if (step === 3) {
    return (
      <WizardShell step={3} totalSteps={4} onBack={prevStep}>
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="flex items-center gap-3 mb-2">
            <Moon className="w-8 h-8 text-indigo-500" />
            <h2 className="text-2xl font-bold text-slate-900">Evening Routine</h2>
          </div>
          <p className="text-slate-500 text-sm">What do you use before bed? (e.g. Retinol, Moisturizer)</p>

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem('PM')}
              placeholder="Add product..."
              className="flex-1 border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button 
              onClick={() => addItem('PM')}
              disabled={!inputValue}
              className="bg-indigo-100 text-indigo-700 font-bold px-4 rounded-lg hover:bg-indigo-200 transition-colors"
            >
              Add
            </button>
          </div>

          {/* List */}
          <div className="space-y-2">
            {items.filter(i => i.category === 'PM').map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-indigo-50 border border-indigo-100 rounded-lg animate-in zoom-in-95 duration-200">
                <span className="font-medium text-slate-800">{item.name}</span>
                <button onClick={() => removeItem(item.id)} className="text-indigo-400 hover:text-rose-500 p-1">×</button>
              </div>
            ))}
          </div>

          <button onClick={nextStep} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold mt-4 flex justify-center gap-2">
            Finish & Preview <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </WizardShell>
    );
  }

  // STEP 4: PREVIEW (Print View)
  if (step === 4) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4 print:p-0 print:bg-white">
        
        {/* Mobile Header (Hidden on Print) */}
        <div className="w-full max-w-2xl mb-6 flex justify-between items-center print:hidden">
            <button onClick={prevStep} className="text-slate-500 flex items-center gap-1 hover:text-slate-800">
                <ArrowLeft className="w-4 h-4" /> Edit
            </button>
            <button 
                onClick={handlePrint}
                className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-rose-200 flex items-center gap-2 transition-transform active:scale-95"
            >
                <Printer className="w-4 h-4" /> Print PDF
            </button>
        </div>

        {/* --- THE A4 PAPER --- */}
        <div className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-[10mm] md:p-[15mm] print:shadow-none print:w-full print:max-w-none print:p-0">
            
            {/* Header */}
            <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">ROUTINE TRACKER</h1>
                    <div className="mt-2 text-slate-600 font-medium">Prepared for: <span className="text-rose-600">{userName}</span></div>
                </div>
                <div className="text-right">
                    <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest inline-block mb-1">Monthly Log</div>
                    <div className="text-xs text-slate-400">Scan to edit</div>
                </div>
            </div>

            {/* Grid */}
            <table className="w-full border-collapse text-left">
                <thead>
                    <tr>
                        <th className="py-2 border-b-2 border-slate-800 text-xs font-bold uppercase w-[30%]">Product</th>
                        <th className="py-2 border-b-2 border-slate-800 text-xs font-bold uppercase w-[5%] text-center">Use</th>
                        {Array.from({length: 31}).map((_, i) => (
                            <th key={i} className="text-[8px] text-slate-400 text-center border-b-2 border-slate-800 w-[2%]">{i+1}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50 print:bg-slate-50'}>
                            <td className="py-3 border-b border-slate-200 text-sm font-semibold text-slate-800 pr-2">{item.name}</td>
                            <td className="py-3 border-b border-slate-200 border-l border-slate-100 text-center">
                                {item.category === 'AM' ? <Sun className="w-3 h-3 mx-auto text-amber-500"/> : <Moon className="w-3 h-3 mx-auto text-indigo-500"/>}
                            </td>
                            {Array.from({length: 31}).map((_, i) => (
                                <td key={i} className="border-b border-slate-200 border-l border-slate-100 text-center relative">
                                    <div className="w-3 h-3 rounded-full border border-slate-300 mx-auto mt-1"></div>
                                </td>
                            ))}
                        </tr>
                    ))}
                    {/* Empty filler rows */}
                    {Array.from({length: Math.max(0, 15 - items.length)}).map((_, i) => (
                        <tr key={`fill-${i}`} className="border-b border-slate-100 h-10">
                            <td className="bg-slate-50/50"></td>
                            <td className="border-l border-slate-100"></td>
                            {Array.from({length: 31}).map((_, d) => <td key={d} className="border-l border-slate-100"></td>)}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer / QR Area */}
            <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-between">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest space-y-1">
                    <p>Consistency is key.</p>
                    <p>Generated by YourBrand</p>
                </div>
                {/* Simulated QR Code for Re-Access */}
                <div className="flex items-center gap-3">
                    <div className="text-right text-[9px] text-slate-500">
                        Scan to<br/>update routine
                    </div>
                    <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center text-[8px] font-mono">
                        [QR]
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return null;
}

// --- Layout Shell Helper ---
function WizardShell({ step, totalSteps, onBack, children }: { step: number, totalSteps: number, onBack?: () => void, children: React.ReactNode }) {
  const progress = (step / totalSteps) * 100;
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative">
        
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100">
          <div 
            className="h-full bg-slate-900 transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 min-h-[400px] flex flex-col">
            {onBack && (
                <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-slate-800 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
            )}
            
            <div className="flex-1 flex flex-col justify-center">
                {children}
            </div>
        </div>

        {/* Step Counter */}
        <div className="bg-slate-50 p-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Step {step} of {totalSteps}
        </div>
      </div>
    </div>
  );
}