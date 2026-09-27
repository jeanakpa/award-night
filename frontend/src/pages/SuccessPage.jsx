import React from 'react';
import { CheckCircle2, Home, Download, FileText, Ticket, QrCode, Sparkles, Calendar, MapPin, User, Hash } from 'lucide-react';
import { API_BASE_URL } from '../api';

export default function SuccessPage({ ticket, onGoHome }) {
  const reference = ticket?.reference || 'AWN-2026';
  const pdfDownloadUrl = `${API_BASE_URL}/tickets/${reference}/pdf`;

  const handleDownloadPdf = () => {
    window.open(pdfDownloadUrl, '_blank');
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#070E1B] via-[#0D1E3A] to-[#070E1B] text-white py-8 px-4 sm:px-6 flex flex-col justify-center items-center">
      <div className="max-w-md w-full space-y-5 text-center my-auto">

        {/* Success Header Icon */}
        <div className="space-y-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/15 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Paiement Validé !
            </h1>
            <p className="text-xs sm:text-sm text-[#94B3DE]">
              Votre ticket pour le <span className="text-[#FFD700] font-bold">Award Night 2026</span> est prêt.
            </p>
          </div>
        </div>

        {/* Action Callout Notice */}
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-emerald-200 text-xs sm:text-sm text-center leading-relaxed font-medium shadow-lg">
          <Sparkles className="w-5 h-5 text-[#FFD700] mx-auto mb-1.5" />
          <p>
            Téléchargez directement votre billet ci-dessous au format <strong>PDF</strong> pour le présenter le jour de l'événement.
          </p>
        </div>

        {/* Ticket Visual Card Pass */}
        {ticket && (
          <div className="bg-[#0B172E] border-2 border-[#FF5500]/40 rounded-3xl p-5 shadow-2xl space-y-4 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5500]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Ticket Header */}
            <div className="flex justify-between items-center pb-3 border-b border-[#183157]">
              <div>
                <span className="text-[10px] font-bold text-[#FF5500] uppercase tracking-wider block">Pass Officiel</span>
                <h3 className="text-base font-extrabold text-white">AWARD NIGHT GALA 2026</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#94B3DE] block">Référence</span>
                <span className="font-mono text-sm font-extrabold text-[#FFD700]">{ticket.reference}</span>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[#94B3DE] block flex items-center gap-1">
                  <User className="w-3 h-3 text-[#FF5500]" /> Nom & Prénoms
                </span>
                <span className="font-bold text-white truncate block">{ticket.buyer_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#94B3DE] block flex items-center gap-1">
                  <Ticket className="w-3 h-3 text-[#FF5500]" /> Quantité & Prix
                </span>
                <span className="font-bold text-white block">{ticket.quantity} ticket(s) • {ticket.total_amount} FCFA</span>
              </div>
              <div>
                <span className="text-[10px] text-[#94B3DE] block flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#FF5500]" /> Date
                </span>
                <span className="font-semibold text-[#FFD700]">Ven. 25 Décembre à 20H</span>
              </div>
              <div>
                <span className="text-[10px] text-[#94B3DE] block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#FF5500]" /> Lieu
                </span>
                <span className="font-semibold text-white">Salle Saint-Pierre</span>
              </div>
            </div>

            {/* QR Code Section */}
            {ticket.qr_code_data && (
              <div className="pt-3 border-t border-[#183157] text-center space-y-2">
                <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mx-auto">
                  <img
                    src={`data:image/png;base64,${ticket.qr_code_data}`}
                    alt={`QR Code ${ticket.reference}`}
                    className="w-32 h-32 sm:w-36 sm:h-36 object-contain mx-auto"
                  />
                </div>
                <p className="text-[11px] text-[#94B3DE] font-mono">
                  Présentez ce QR Code à l'entrée
                </p>
              </div>
            )}
          </div>
        )}

        {/* Direct Action Download Buttons */}
        <div className="space-y-3 pt-1">
          <button
            onClick={handleDownloadPdf}
            className="w-full py-4 bg-gradient-to-r from-[#FF5500] to-[#FF7700] hover:from-[#FF661A] hover:to-[#FF8800] active:scale-95 text-white font-extrabold text-base rounded-2xl shadow-[0_8px_25px_rgba(255,85,0,0.5)] transition-all border border-white/20 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>Télécharger le Billet (PDF)</span>
          </button>

          <button
            onClick={onGoHome}
            className="w-full py-3 bg-[#0B172E] hover:bg-[#122447] text-[#94B3DE] hover:text-white font-bold text-xs rounded-xl border border-[#183157] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </button>
        </div>

      </div>
    </div>
  );
}


