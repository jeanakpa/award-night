import React, { useState } from 'react';
import { X, Ticket, User, Phone, Mail, CheckCircle2, QrCode, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../api';

export default function TicketPurchaseModal({ isOpen, onClose, onInitiateWavePayment }) {
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [attendees, setAttendees] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleQuantityChange = (newQty) => {
    if (newQty < 1 || newQty > 10) return;
    setQuantity(newQty);
    
    // Adjust attendees array size
    setAttendees(prev => {
      const updated = [...prev];
      if (newQty > updated.length) {
        for (let i = updated.length; i < newQty; i++) {
          updated.push('');
        }
      } else {
        updated.splice(newQty);
      }
      return updated;
    });
  };

  const handleAttendeeNameChange = (index, value) => {
    const updated = [...attendees];
    updated[index] = value;
    setAttendees(updated);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!buyerName.trim() || !buyerPhone.trim()) {
      setError('Veuillez renseigner votre nom complet et votre numéro de téléphone.');
      return;
    }

    for (let i = 0; i < attendees.length; i++) {
      if (!attendees[i].trim()) {
        setError(`Veuillez indiquer le nom sur le Ticket #${i + 1}`);
        return;
      }
    }

    setLoading(true);

    try {
      const res = await api.post('/tickets/order', {
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        buyer_email: buyerEmail,
        attendees: attendees
      });

      setLoading(false);
      onClose();
      // Pass order reference & Wave checkout info to Wave payment modal
      onInitiateWavePayment({
        type: 'ticket',
        ref: res.data.order.order_reference,
        amount: res.data.order.total_amount,
        quantity: quantity,
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        tickets: res.data.order.tickets
      });
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Erreur lors de la création de la commande.');
    }
  };

  const totalPrice = quantity * 10000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-card w-full max-w-3xl my-8 p-6 sm:p-8 relative border-2 border-[#D4AF37] text-left animate-scaleUp">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <div className="p-3 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]">
            <Ticket className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-serif">Achat de Tickets Gala</h2>
            <p className="text-xs text-gray-300">
              Chaque ticket génère une carte d'accès avec un <strong className="text-[#D4AF37]">QR Code unique</strong>.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="space-y-6">
          
          {/* Buyer Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" /> 1. Vos Coordonnées Acheteur
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1 font-medium">Nom & Prénoms *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" 
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Ex: Jean Kouassi"
                    className="w-full bg-black/40 border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1 font-medium">Numéro Téléphone Wave *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="tel" 
                    required
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="Ex: 0708091011"
                    className="w-full bg-black/40 border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Quantity Selector */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                <Ticket className="w-4 h-4" /> 2. Nombre de Tickets
              </h3>
              <span className="text-xs text-gray-400">10.000 FCFA / ticket</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center bg-black/40 border border-white/15 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/15 text-white font-bold transition-all"
                >
                  -
                </button>
                <span className="w-12 text-center text-lg font-bold text-[#D4AF37] font-serif">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/15 text-white font-bold transition-all"
                >
                  +
                </button>
              </div>

              <div className="text-right flex-1">
                <span className="text-xs text-gray-400 block">Montant Total</span>
                <span className="text-2xl font-bold text-emerald-400 font-serif">
                  {totalPrice.toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </div>

          {/* Attendee Name inputs & Ticket Visual Preview Cards */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 3. Personnalisation & Modèle des Tickets
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-1">
              {attendees.map((name, idx) => (
                <div key={idx} className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-300">
                    Nom du Participant - Ticket #{idx + 1} *
                  </label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => handleAttendeeNameChange(idx, e.target.value)}
                    placeholder={`Nom & Prénoms sur ticket #${idx + 1}`}
                    className="w-full bg-black/40 border border-white/15 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />

                  {/* Realtime Ticket Model Visual Card */}
                  <div className="ticket-card-model p-3 text-left">
                    <div className="notch-left" />
                    <div className="notch-right" />
                    
                    <div className="flex justify-between items-start border-b border-white/10 pb-2 mb-2">
                      <div>
                        <span className="text-[10px] text-[#D4AF37] font-bold tracking-widest block uppercase">
                          AWARD NIGHT GALA
                        </span>
                        <span className="text-[9px] text-gray-400 block">25 Décembre à 21h · Salle St Pierre</span>
                      </div>
                      <span className="text-[10px] font-mono bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/30">
                        N° 00{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase">Titulaire du Ticket</span>
                        <span className="text-sm font-bold text-white block truncate max-w-[150px]">
                          {name || `[Nom Participant #${idx + 1}]`}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">
                          Tarif : 10.000 FCFA
                        </span>
                      </div>

                      <div className="bg-white p-1 rounded-lg">
                        <QrCode className="w-10 h-10 text-black" />
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Wave Payment Submit Button */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Paiement instantané et sécurisé avec l'API Wave Business
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto btn-wave text-base py-3 px-8 flex items-center justify-center gap-3"
            >
              {loading ? 'Génération de la commande...' : `Payer ${totalPrice.toLocaleString()} FCFA avec Wave`}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
