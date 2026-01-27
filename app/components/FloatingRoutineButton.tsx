'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';

export default function FloatingRoutineButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      setShowTooltip(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-3 font-sans">
      {showTooltip && (
        <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-2xl p-4 max-w-[220px] relative">
            <button 
              onClick={(e) => {
                e.preventDefault();
                setShowTooltip(false);
              }}
              className="absolute -top-2 -left-2 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-full p-1 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">Free Tool</p>
              <p className="text-sm text-slate-600 leading-tight">
                Confused by steps? Build your personalized <span className="text-rose-500 font-bold">PDF Routine</span> here.
              </p>
            </div>
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-b border-r border-slate-100 rotate-45"></div>
          </div>
        </div>
      )}

      <Link 
        href="/routine-builder" 
        className="group relative flex items-center justify-center"
      >
        <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-20 animate-ping duration-[2000ms]"></span>
        <div className="relative flex items-center gap-0 bg-slate-900 text-white pl-5 pr-2 py-2.5 rounded-full shadow-2xl hover:bg-slate-800 hover:scale-105 transition-all duration-300">
          <div className="flex flex-col items-start mr-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">Get My</span>
            <span className="text-sm font-bold leading-none">Routine</span>
          </div>
          <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
            <Sparkles className="w-5 h-5 text-white fill-white/20" />
          </div>
        </div>
      </Link>