import React from 'react';

export default function Navbar({ onOpenTicketModal }) {
  return (
    <header className="sticky top-0 z-50 bg-[#031E12]/90 backdrop-blur-xl border-b border-[#0C4D2E] px-4 py-3 sm:px-8 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <img 
            src="/images/LOGO SANS FOND.png" 
            alt="Logo" 
            className="h-10 w-auto object-contain drop-shadow-md" 
          />
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white block leading-none">
              AWARD NIGHT
            </span>
            <span className="text-[10px] text-[#A2C7B5] font-medium block mt-0.5">
              Nuit des Distinctions 2026 • Temple Bethesda
            </span>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onOpenTicketModal}
          className="px-4 py-2 bg-gradient-to-r from-[#FF5500] to-[#FF6E00] hover:from-[#FF661A] hover:to-[#FF5500] text-white font-extrabold text-xs rounded-full shadow-[0_4px_20px_rgba(255,85,0,0.4)] transition-all transform active:scale-95 border border-[#FF7733]/30"
        >
          Acheter un Ticket
        </button>

      </div>
    </header>
  );
}
