import React from 'react';
import { CheckCircle2, Home } from 'lucide-react';

const maskPhone = (phone) => {
  if (!phone) return "";
  const clean = phone.replace(/\D/g, '');
  const local = (clean.length === 12 && clean.startsWith('225')) ? clean.slice(3) : clean;
  if (local.length >= 4) {
    return `${local.slice(0, 2)}....${local.slice(-2)}`;
  }
  return phone;
};

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 4) {
    return `${local.slice(0, 1)}..........@${domain}`;
  }
  return `${local.slice(0, 2)}..........${local.slice(-2)}@${domain}`;
};

export default function SuccessPage({ ticket, onGoHome }) {
  const maskedPhone = maskPhone(ticket?.buyer_whatsapp || ticket?.buyer_phone);
  const maskedEmail = maskEmail(ticket?.buyer_email);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#070E1B] via-[#0D1E3A] to-[#070E1B] text-white py-4 px-4 sm:px-6 flex flex-col justify-center items-center">
      <div className="max-w-md w-full space-y-4 text-center my-auto">

        {/* Success Icon & Header */}
        <div className="space-y-3">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Paiement Confirmé !
            </h1>
            <p className="text-xs sm:text-sm text-[#94B3DE]">
              Merci pour votre achat pour le <span className="text-[#FFD700] font-bold">Award Night 2026</span>.
            </p>
          </div>
        </div>

        {/* Highlighted Delivery Info Card */}
        <div className="bg-[#0B172E] border border-[#183157] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

          {/* Simple Main Announcement */}
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs sm:text-sm leading-relaxed font-medium">
            <p className="text-center sm:text-left">
              Votre ticket d'accès vous a été envoyé par <strong>WhatsApp</strong> via le numéro <span className="text-[#FFD700] font-bold font-mono">{maskedPhone}</span> et par <strong>Email</strong> via <span className="text-[#FFD700] font-bold font-mono">{maskedEmail}</span>.
            </p>
          </div>

          {/* Ticket Reference Summary */}
          {ticket && (
            <div className="pt-3 border-t border-[#183157] flex justify-between items-center text-xs text-[#94B3DE]">
              <div>
                <span>Bénéficiaire : </span>
                <strong className="text-white block sm:inline">{ticket.buyer_name}</strong>
              </div>
              <div className="text-right">
                <span>Référence : </span>
                <strong className="text-[#FFD700] font-mono block sm:inline">{ticket.reference}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Back to Home Button Only */}
        <div className="pt-1">
          <button
            onClick={onGoHome}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#FF5500] to-[#FF8800] hover:from-[#FF661A] hover:to-[#FF991A] text-white font-extrabold text-sm rounded-xl shadow-[0_6px_20px_rgba(255,85,0,0.35)] transition-all transform active:scale-95 border border-white/20 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </button>
        </div>

      </div>
    </div>
  );
}


