import React, { useEffect } from 'react';
import { X, Download, Printer, CheckCircle, MailCheck, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TicketViewModal({ isOpen, onClose, ticket }) {

  useEffect(() => {
    if (isOpen && ticket) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF5500', '#FFD700', '#FFFFFF', '#00E676']
      });
    }
  }, [isOpen, ticket]);

  if (!isOpen || !ticket) return null;

  const handleDownloadPdf = () => {
    window.open(`/api/tickets/${ticket.reference}/pdf`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#090305] rounded-3xl p-4 sm:p-6 border border-[#FFD700]/30 shadow-2xl overflow-hidden print:p-0 print:border-none my-auto">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10 print:hidden cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Success Header Banner */}
        <div className="text-center mb-5 pt-1 print:hidden">
          <div className="w-14 h-14 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-400 shadow-md">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white">
            Félicitations ! Votre Billet est Validé
          </h3>
          <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center justify-center gap-1">
            <MailCheck className="w-4 h-4" />
            Un e-mail de confirmation avec votre billet PDF a été transmis à {ticket.buyer_email}
          </p>
        </div>

        {/* High-Fidelity Official Ticket Template Component Voucher */}
        <div id="printable-ticket" className="relative w-full aspect-[1024/370] rounded-2xl overflow-hidden shadow-2xl border-2 border-[#D4AF37] select-none bg-[#120204]">
          
          {/* Template Graphic Background Image */}
          <img 
            src="/images/ticket.jpg" 
            alt="Billet Officiel Award Night 2026" 
            className="w-full h-full object-cover block"
          />

          {/* 1. Ticket Reference Overlay (Top Left next to 'ticket N.') */}
          <div className="absolute top-[7.5%] left-[14.2%] text-[2.5vw] sm:text-[14px] font-mono font-black text-[#1A1A1A] tracking-wider leading-none">
            {ticket.reference}
          </div>

          {/* 2. Beneficiary Name Overlay (Inside Bottom Left Dark Maroon Box) */}
          <div className="absolute bottom-[2.5%] left-[2.5%] w-[33.5%] h-[15%] flex items-center justify-center text-center px-2">
            <span className="text-[2.6vw] sm:text-[15px] font-black text-[#FFD700] uppercase tracking-wider truncate font-sans drop-shadow">
              {ticket.buyer_name}
            </span>
          </div>

          {/* 3. Code QR Overlay (Inside Right Stub Square Box) */}
          <div className="absolute top-[31.5%] left-[79.5%] w-[14.5%] h-[36%] flex items-center justify-center bg-white p-[1.5%] rounded-lg shadow-md border border-white">
            <img 
              src={ticket.qr_code_data} 
              alt="Code QR Access" 
              className="w-full h-full object-contain" 
            />
          </div>

        </div>

        {/* Info Reminder Box Below Ticket */}
        <div className="mt-4 p-4 bg-[#140608] border border-[#FFD700]/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl border border-[#FFD700]">
              <img src={ticket.qr_code_data} alt="QR Code Ticket" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">Billet d'Accès Nominatif • Award Night 2026</h4>
              <p className="text-xs text-gray-400">Présentez ce Code QR à l'entrée du gala le 25 Décembre 2026 pour valider l'accès.</p>
              <p className="text-xs text-[#FFD700] font-mono mt-0.5">Réf : {ticket.reference} • Bénéficiaire : {ticket.buyer_name}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-extrabold shrink-0">
            ✓ PAYÉ & VALIDÉ
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-4 print:hidden">
          <button
            onClick={handleDownloadPdf}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-[#FF5500] to-[#FF8800] hover:from-[#FF661A] hover:to-[#FF5500] text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all border border-white/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Télécharger Billet PDF
          </button>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#1C0306] hover:bg-[#2B0508] text-white border border-[#FFD700]/30 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#FFD700]" />
            Imprimer le Billet
          </button>
        </div>

      </div>
    </div>
  );
}



