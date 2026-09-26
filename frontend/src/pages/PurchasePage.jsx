import React, { useState } from 'react';
import { ArrowLeft, User, Phone, Mail, Ticket, ArrowRight, ShieldCheck, RefreshCw, CreditCard } from 'lucide-react';
import { API_BASE_URL } from '../api';

export default function PurchasePage({ onBack, onOrderCreated }) {
  const [formData, setFormData] = useState({
    buyer_name: '',
    buyer_phone: '',
    buyer_email: '',
    quantity: 1
  });

  const [selectedOperator, setSelectedOperator] = useState('wave');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuantityChange = (delta) => {
    setFormData(prev => {
      const nextQty = Math.max(1, Math.min(10, prev.quantity + delta));
      return { ...prev, quantity: nextQty };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.buyer_name.trim() || !formData.buyer_phone.trim() || !formData.buyer_email.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create ticket order on backend
      const purchaseRes = await fetch(`${API_BASE_URL}/tickets/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_name: formData.buyer_name,
          buyer_phone: formData.buyer_phone,
          buyer_whatsapp: formData.buyer_phone,
          buyer_email: formData.buyer_email,
          quantity: formData.quantity
        })
      });

      const purchaseData = await purchaseRes.json();

      if (!purchaseRes.ok) {
        setError(purchaseData.error || 'Erreur lors de la réservation du ticket.');
        setLoading(false);
        return;
      }

      const ticket = purchaseData.ticket;

      // 2. Initiate Jeko Payment to obtain checkout URL for chosen operator
      const jekoRes = await fetch(`${API_BASE_URL}/payments/jeko-initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: ticket.reference,
          operator: selectedOperator
        })
      });

      const jekoData = await jekoRes.json();

      if (jekoRes.ok && jekoData.success && jekoData.redirect_url) {
        // ALWAYS redirect directly to Jeko Payment Platform checkout page
        window.location.href = jekoData.redirect_url;
      } else {
        setError(jekoData.error || 'Échec d\'initialisation du paiement Jèko.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Une erreur réseau est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const unitPrice = 10;
  const totalPrice = unitPrice * formData.quantity;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#0D1E3A] via-[#09162D] to-[#070E1B] text-white py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Navigation Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all active:scale-95 shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </button>

        {/* Main Header Banner */}
        <div className="bg-[#0B172E] border border-[#183157] rounded-3xl p-6 shadow-2xl space-y-4 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5500]/10 rounded-full blur-3xl pointer-events-none" />

          <h1 className="text-2xl sm:text-3xl font-bold text-[#FFD700] tracking-tight">
            TICKET AWARD NIGHT
          </h1>

          <div className="bg-[#070E1B] border border-[#183157] rounded-2xl p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-[#94B3DE]">
              <span>Date:</span>
              <span className="font-extrabold text-white">Ven. 25 Décembre</span>
            </div>
            <div className="flex justify-between items-center text-[#94B3DE]">
              <span>Lieu:</span>
              <span className="font-semibold text-white">Salle Saint-Pierre</span>
            </div>
            <div className="flex justify-between items-center text-[#94B3DE]">
              <span>Heure:</span>
              <span className="font-semibold text-white">À partir de 20H00</span>
            </div>
            <div className="flex justify-between items-center text-[#94B3DE] pt-1 border-t border-white/10">
              <span>Prix Unitaire :</span>
              <span className="font-extrabold text-[#FF5500] text-sm">{unitPrice} FCFA</span>
            </div>
          </div>
        </div>

        {/* Purchase Form Container */}
        <form onSubmit={handleSubmit} className="bg-[#0B172E] border border-[#183157] rounded-3xl p-6 shadow-2xl space-y-5">

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Form Input Fields */}
          <div className="space-y-4">

            {/* Nom & Prénoms */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-extrabold text-[#94B3DE] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Nom et Prénoms <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                name="buyer_name"
                required
                value={formData.buyer_name}
                onChange={handleChange}
                placeholder="Jean-Marc Koffi"
                className="w-full bg-[#070E1B] border border-[#183157] focus:border-[#FF5500] text-white text-xs sm:text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder-[#5577A8]"
              />
            </div>

            {/* Numéro WhatsApp */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-extrabold text-[#94B3DE] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Numéro whatsapp <span className="text-red-500">*</span></span>
              </label>
              <input
                type="tel"
                name="buyer_phone"
                required
                value={formData.buyer_phone}
                onChange={handleChange}
                placeholder="0707070707"
                className="w-full bg-[#070E1B] border border-[#183157] focus:border-[#FF5500] text-white text-xs sm:text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder-[#5577A8]"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-extrabold text-[#94B3DE] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Adresse Email <span className="text-red-500">*</span></span>
              </label>
              <input
                type="email"
                name="buyer_email"
                required
                value={formData.buyer_email}
                onChange={handleChange}
                placeholder="jean.koffi@gmail.com"
                className="w-full bg-[#070E1B] border border-[#183157] focus:border-[#FF5500] text-white text-xs sm:text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder-[#5577A8]"
              />
            </div>

            {/* Quantité de tickets */}
            <div className="space-y-1.5 text-left pt-1">
              <label className="text-xs font-extrabold text-[#94B3DE] flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Nombre de tickets</span>
              </label>
              <div className="flex items-center justify-between bg-[#070E1B] border border-[#183157] rounded-xl p-2">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white font-extrabold flex items-center justify-center transition-colors text-base cursor-pointer"
                >
                  -
                </button>
                <span className="font-extrabold text-sm sm:text-base text-white">
                  {formData.quantity} ticket(s)
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  className="w-9 h-9 rounded-lg bg-[#FF5500] hover:bg-[#FF661A] text-white font-extrabold flex items-center justify-center transition-colors text-base cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Choix du moyen de paiement - Tuiles de style App / Capture */}
            <div className="space-y-3 text-left pt-2">
              <label className="text-xs font-extrabold text-[#94B3DE] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#FF5500]" />
                  <span>Moyen de paiement</span>
                </span>
              </label>

              <div className="grid grid-cols-3 gap-5 sm:gap-3">
                {[
                  { id: 'wave', name: 'Wave', bg: '#1dc8fe', icon: '/images/icon_wave.png' },
                  { id: 'mtn', name: 'MTN', bg: '#004f71', icon: '/images/icon_mtn.png' },
                  { id: 'moov', name: 'Moov', bg: '#eb6707', icon: '/images/icon_moov.png' },
                  { id: 'orange', name: 'Orange', bg: '#000000', icon: '/images/icon_orange.png' },
                  { id: 'djamo', name: 'Djamo', bg: '#000000', icon: '/images/icon_djamo.png' }
                ].map(op => {
                  const isSelected = selectedOperator === op.id;
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setSelectedOperator(op.id)}
                      className="flex flex-col items-center gap-2 group cursor-pointer outline-none transition-transform"
                    >
                      {/* Tuile carrée avec coins arrondis et couleur de fond personnalisée */}
                      <div
                        style={{ backgroundColor: op.bg }}
                        className={`w-13 h-13 sm:w-16 sm:h-16 rounded-2xl p-2.5 flex items-center justify-center relative transition-all duration-200 border border-white/20 shadow-md ${isSelected
                            ? 'ring-4 ring-[#FF5500] ring-offset-2 ring-offset-[#0B172E] scale-105 shadow-[0_0_20px_rgba(255,85,0,0.6)]'
                            : 'opacity-85 group-hover:opacity-100 group-hover:scale-102'
                          }`}
                      >
                        <img
                          src={op.icon}
                          alt={op.name}
                          className="w-full h-full object-contain filter drop-shadow-sm"
                        />
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#FF5500] rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                            ✓
                          </div>
                        )}
                      </div>
                      {/* Libellé sous la tuile */}
                      <span className={`text-[11px] sm:text-xs font-bold transition-colors ${isSelected ? 'text-[#FF5500]' : 'text-[#94B3DE] group-hover:text-white'
                        }`}>
                        {op.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Résumé du Total & Bouton "Suivant" */}
          <div className="pt-4 space-y-4 border-t border-[#183157]">
            <div className="flex justify-between items-center bg-[#070E1B] p-4 rounded-2xl border border-[#183157]">
              <div>
                <span className="text-xs text-[#94B3DE] block">Montant Total des tickets</span>
              </div>
              <span className="text-xl sm:text-2xl font-extrabold text-[#FF5500]">
                {totalPrice} FCFA
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#FF4500] hover:bg-[#FF5500] active:scale-95 text-white font-extrabold text-base rounded-full shadow-[0_8px_30px_rgba(255,69,0,0.65)] transition-all border border-white/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <span>Redirection ...</span>
                </>
              ) : (
                <>
                  <span>Suivant</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
