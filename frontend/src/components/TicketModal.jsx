import React, { useState } from 'react';
import { X, User, Phone, MessageSquare, Mail, Ticket, ArrowRight, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../api';

export default function TicketModal({ isOpen, onClose, onOrderCreated }) {
  const [formData, setFormData] = useState({
    buyer_name: '',
    buyer_phone: '',
    buyer_whatsapp: '',
    buyer_email: '',
    quantity: 1,
    operator: 'wave'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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

  const operators = [
    { id: 'wave', name: 'Wave', icon: '🌊' },
    { id: 'orange', name: 'Orange', icon: '🟠' },
    { id: 'mtn', name: 'MTN', icon: '🟡' },
    { id: 'moov', name: 'Moov', icon: '🔵' },
    { id: 'djamo', name: 'Djamo', icon: '💳' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.buyer_name.trim() || !formData.buyer_phone.trim() || !formData.buyer_email.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create ticket order
      const purchaseRes = await fetch(`${API_BASE_URL}/tickets/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const purchaseData = await purchaseRes.json();

      if (!purchaseRes.ok) {
        setError(purchaseData.error || 'Erreur lors de la réservation du ticket.');
        setLoading(false);
        return;
      }

      const ticket = purchaseData.ticket;

      // 2. Initiate Jeko Payment directly
      const jekoRes = await fetch(`${API_BASE_URL}/payments/jeko-initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: ticket.reference,
          operator: formData.operator
        })
      });

      const jekoData = await jekoRes.json();

      if (jekoRes.ok && jekoData.success) {
        if (jekoData.redirect_url && !jekoData.simulated) {
          // Redirect to live Jeko Checkout
          window.location.href = jekoData.redirect_url;
        } else {
          // Simulate/Confirm payment locally if test mode
          const simRes = await fetch(`${API_BASE_URL}/payments/process-simulated`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reference: ticket.reference,
              operator: formData.operator,
              status: 'SUCCESS'
            })
          });
          const simData = await simRes.json();
          if (simRes.ok && simData.success) {
            onOrderCreated(simData.ticket);
          } else {
            setError('Échec de validation du paiement Jèko.');
          }
        }
      } else {
        setError(jekoData.message || 'Erreur lors de la connexion à l\'API Jèko.');
      }
    } catch (err) {
      setError('Impossible de se connecter au serveur backend.');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = formData.quantity * 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg card-emerald rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden border border-[#0F5937]">
        
        {/* Ribbon Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#FF5500] via-[#FFD700] to-[#00E676]"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 pt-1">
          <div className="inline-block px-3 py-1 rounded-full bg-[#032113] border border-[#0E5434] text-xs font-bold text-[#FFD700] mb-2">
            Paiement Sécurisé via Jèko (10 FCFA)
          </div>
          <h3 className="text-xl font-extrabold text-white">
            Achat du Ticket Gala
          </h3>
          <p className="text-xs text-[#9BBFA9]">Remplissez vos informations pour procéder au paiement Jèko</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs text-rose-200 text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-[#C5E3D5] uppercase mb-1">
              Nom & Prénoms *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF5500]" />
              <input
                type="text"
                name="buyer_name"
                required
                value={formData.buyer_name}
                onChange={handleChange}
                placeholder="Ex: Kouassi Emmanuel"
                className="w-full bg-[#031E12] border border-[#0E5434] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#5A8772] focus:outline-none focus:border-[#FF5500]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#C5E3D5] uppercase mb-1">
                Téléphone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF5500]" />
                <input
                  type="tel"
                  name="buyer_phone"
                  required
                  value={formData.buyer_phone}
                  onChange={handleChange}
                  placeholder="07 01 02 03 04"
                  className="w-full bg-[#031E12] border border-[#0E5434] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#5A8772] focus:outline-none focus:border-[#FF5500]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#C5E3D5] uppercase mb-1">
                WhatsApp
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF5500]" />
                <input
                  type="tel"
                  name="buyer_whatsapp"
                  value={formData.buyer_whatsapp}
                  onChange={handleChange}
                  placeholder="07 01 02 03 04"
                  className="w-full bg-[#031E12] border border-[#0E5434] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#5A8772] focus:outline-none focus:border-[#FF5500]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#C5E3D5] uppercase mb-1">
              Adresse Email (pour recevoir le QR Code) *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF5500]" />
              <input
                type="email"
                name="buyer_email"
                required
                value={formData.buyer_email}
                onChange={handleChange}
                placeholder="votre.email@exemple.com"
                className="w-full bg-[#031E12] border border-[#0E5434] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#5A8772] focus:outline-none focus:border-[#FF5500]"
              />
            </div>
          </div>

          {/* Jeko Operator Selection */}
          <div>
            <label className="block text-xs font-bold text-[#C5E3D5] uppercase mb-1.5">
              Moyen de Paiement Jèko *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {operators.map(op => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, operator: op.id }))}
                  className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-all ${
                    formData.operator === op.id
                      ? 'border-[#FF5500] bg-[#0A3D27] text-white shadow-md'
                      : 'border-[#0E5434] bg-[#031E12] text-gray-400 hover:border-[#FF5500]/40'
                  }`}
                >
                  <span className="text-base">{op.icon}</span>
                  <span>{op.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#031E12] p-4 rounded-xl border border-[#0E5434] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#C5E3D5] block">Nombre de billets</span>
              <span className="text-xs text-[#7AA993]">10 FCFA / ticket</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                className="w-8 h-8 rounded-lg bg-[#073522] border border-[#0E5434] text-white font-extrabold hover:bg-[#FF5500] transition-colors"
              >
                -
              </button>
              <span className="text-base font-extrabold text-white w-6 text-center">
                {formData.quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                className="w-8 h-8 rounded-lg bg-[#073522] border border-[#0E5434] text-white font-extrabold hover:bg-[#FF5500] transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-sm text-[#C5E3D5] font-extrabold">Total à payer :</span>
            <span className="text-xl font-extrabold text-[#FFD700]">
              {totalAmount.toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          {/* Direct Jeko Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#FF5500] to-[#FF6E00] hover:from-[#FF661A] hover:to-[#FF5500] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-[0_4px_20px_rgba(255,85,0,0.45)] flex items-center justify-center gap-2 mt-2 transition-all border border-[#FF7733]/30"
          >
            {loading ? (
              <div className="flex items-center gap-2 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Connexion au Guichet Jèko...</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#FFD700]" />
                <span>Payer avec Jèko ({formData.operator.toUpperCase()})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-[#A2C7B5]">
            <ShieldCheck className="w-4 h-4 text-[#FF5500]" />
            <span>Paiement sécurisé via Jèko (Wave, Orange, MTN, Moov, Djamo)</span>
          </div>

        </form>

      </div>
    </div>
  );
}
