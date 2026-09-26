import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, QrCode, Download, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api';

export default function WavePaymentModal({ isOpen, onClose, data }) {
  const [loading, setLoading] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [paidResult, setPaidResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen || !data) return null;

  const isTicket = data.type === 'ticket';

  const handleSimulatePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/wave/simulate-payment', {
        type: data.type,
        ref: data.ref,
        phone: data.buyer_phone || data.voter_phone
      });

      setLoading(false);
      setPaidSuccess(true);
      setPaidResult(res.data);

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Erreur lors de la confirmation du paiement Wave.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-card w-full max-w-lg p-6 sm:p-8 relative border-2 border-[#1DC7FF] text-left animate-scaleUp">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-gray-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {!paidSuccess ? (
          <div className="space-y-6">
            
            {/* Wave Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#00C3FF] text-white flex items-center justify-center font-bold text-xl shadow-lg">
                wave
              </div>
              <div>
                <span className="text-[10px] text-[#00C3FF] font-bold uppercase tracking-wider block">
                  Paiement Mobile Wave Business
                </span>
                <h3 className="text-xl font-bold text-white font-serif">Confirmation de Règlement</h3>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Summary Details */}
            <div className="bg-black/50 p-4 rounded-2xl border border-white/10 space-y-3 text-xs">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Transaction :</span>
                <span className="font-mono text-[#1DC7FF] font-bold">{data.ref}</span>
              </div>

              {isTicket ? (
                <>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Objet :</span>
                    <span className="text-white font-bold">{data.quantity} Ticket(s) Dîner Gala</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Acheteur :</span>
                    <span className="text-white">{data.buyer_name} ({data.buyer_phone})</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Objet :</span>
                    <span className="text-white font-bold">{data.vote_count} Vote(s) pour {data.nominee_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Votant :</span>
                    <span className="text-white">{data.voter_name || 'Anonyme'} ({data.voter_phone})</span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center pt-1">
                <span className="text-sm text-gray-300 font-bold">Total à Payer :</span>
                <span className="text-2xl font-black text-emerald-400 font-serif">
                  {data.amount.toLocaleString()} FCFA
                </span>
              </div>
            </div>

            {/* Simulated & Real Wave Buttons */}
            <div className="space-y-3">
              <button 
                onClick={handleSimulatePayment}
                disabled={loading}
                className="w-full btn-wave py-3 text-sm justify-center flex items-center gap-2 shadow-xl"
              >
                <Sparkles className="w-5 h-5" />
                {loading ? 'Validation du paiement Wave...' : `Payer ${data.amount.toLocaleString()} FCFA via Wave`}
              </button>

              <p className="text-[10px] text-gray-400 text-center">
                Paiement direct sécurisé Wave API. Vos tickets et votes seront confirmés et générés immédiatement après paiement.
              </p>
            </div>

          </div>
        ) : (
          /* Payment Success & Ticket Presentation */
          <div className="space-y-6 text-center">
            
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">
                Paiement Confirmé !
              </span>
              <h3 className="text-2xl font-bold text-white font-serif mt-1">
                {isTicket ? 'Vos Tickets sont Prêts !' : 'Vote pris en compte !'}
              </h3>
              <p className="text-xs text-gray-300 mt-1">
                Transaction Wave N° <strong className="text-[#1DC7FF]">{paidResult?.wave_transaction_id}</strong>
              </p>
            </div>

            {/* Generated Tickets Cards Display */}
            {isTicket && paidResult?.order?.tickets && (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {paidResult.order.tickets.map((t, idx) => (
                  <div key={t.id} className="ticket-card-model p-4 text-left">
                    <div className="notch-left" />
                    <div className="notch-right" />

                    <div className="flex justify-between items-start border-b border-white/10 pb-2 mb-2">
                      <div>
                        <span className="text-[11px] text-[#D4AF37] font-bold tracking-widest block uppercase">
                          AWARD NIGHT GALA
                        </span>
                        <span className="text-[9px] text-gray-400 block">25 Décembre à 21h · Salle St Pierre</span>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                        VALIDE
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase">Titulaire</span>
                        <span className="text-base font-bold text-white block">{t.attendee_name}</span>
                        <span className="text-[10px] text-gray-400 font-mono mt-1 block">Code: {t.ticket_code}</span>
                      </div>

                      {t.qr_code_path && (
                        <div className="bg-white p-1.5 rounded-xl text-center">
                          <img src={t.qr_code_path} alt="QR Code" className="w-16 h-16" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={() => { setPaidSuccess(false); onClose(); }}
              className="w-full btn-gold py-3 text-sm font-bold justify-center"
            >
              Fermer et Retourner à l'Accueil
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
