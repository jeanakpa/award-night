import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft, CreditCard, Smartphone, Sparkles, RefreshCw } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, ticket, kkiapayPublicKey, onPaymentSuccess, onBackToForm }) {
  const [selectedOperator, setSelectedOperator] = useState('wave');
  const [phoneNumber, setPhoneNumber] = useState(ticket?.buyer_phone || '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (ticket) {
      setPhoneNumber(ticket.buyer_phone);
    }
  }, [ticket]);

  // KKiaPay Event Listener Setup
  useEffect(() => {
    const handleKkiapaySuccess = (response) => {
      console.log('KKiaPay Success Event:', response);
      verifyKkiapayPayment(response.transactionId);
    };

    const handleKkiapayFailed = (error) => {
      console.log('KKiaPay Failed Event:', error);
      setErrorMessage('Le paiement KKiaPay a échoué ou a été annulé.');
    };

    window.addKkiapayListener && window.addKkiapayListener('success', handleKkiapaySuccess);
    window.addKkiapayListener && window.addKkiapayListener('failed', handleKkiapayFailed);

    return () => {
      window.removeKkiapayListener && window.removeKkiapayListener('success', handleKkiapaySuccess);
      window.removeKkiapayListener && window.removeKkiapayListener('failed', handleKkiapayFailed);
    };
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  const operators = [
    { id: 'jeko', name: 'Jèko Payment', color: 'bg-emerald-600 border-emerald-400 text-white', icon: '⚡' },
    { id: 'wave', name: 'Wave', color: 'bg-cyan-600 border-cyan-400 text-white', icon: '🌊' },
    { id: 'mtn', name: 'MTN Money', color: 'bg-yellow-500 border-yellow-300 text-black', icon: '🟡' },
    { id: 'orange', name: 'Orange Money', color: 'bg-orange-600 border-orange-400 text-white', icon: '🟠' },
    { id: 'moov', name: 'Moov Money', color: 'bg-blue-600 border-blue-400 text-white', icon: '🔵' },
    { id: 'kkiapay', name: 'KKiaPay SDK', color: 'bg-purple-700 border-purple-400 text-white', icon: '💳' }
  ];

  // Initiate Jeko Payment Redirect
  const handleJekoPayment = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/payments/jeko-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: ticket.reference,
          operator: selectedOperator === 'jeko' ? 'wave' : selectedOperator
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.redirect_url && !data.simulated) {
          window.location.href = data.redirect_url;
        } else {
          // If simulation mode or test fallback
          handleSimulatedPayment('SUCCESS');
        }
      } else {
        setErrorMessage(data.message || 'Échec de l\'initialisation Jèko.');
      }
    } catch (err) {
      setErrorMessage('Erreur réseau lors de la connexion à l\'API Jèko.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger KKiaPay Widget
  const launchKkiapayWidget = () => {
    if (typeof window.openKkiapayWidget === 'function') {
      window.openKkiapayWidget({
        amount: ticket.total_amount,
        key: kkiapayPublicKey || "27e327d0f43f11efb5aadb3c9a192eba",
        sandbox: true,
        phone: phoneNumber,
        name: ticket.buyer_name,
        email: ticket.buyer_email,
        reason: `Ticket Gala Award Night - Ref ${ticket.reference}`
      });
    } else {
      setErrorMessage("Le SDK KKiaPay n'a pas pu s'initialiser. Utilisez la simulation ci-dessous.");
    }
  };

  const verifyKkiapayPayment = async (transactionId) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/payments/kkiapay-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId,
          reference: ticket.reference
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onPaymentSuccess(data.ticket);
      } else {
        setErrorMessage(data.message || 'Échec de vérification KKiaPay.');
      }
    } catch (err) {
      setErrorMessage('Erreur réseau lors de la validation KKiaPay.');
    } finally {
      setLoading(false);
    }
  };

  // Process Simulated Payment (Success or Failure toggle)
  const handleSimulatedPayment = async (simulatedStatus) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/payments/process-simulated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: ticket.reference,
          operator: selectedOperator,
          status: simulatedStatus
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onPaymentSuccess(data.ticket);
      } else {
        setErrorMessage(data.message || 'Paiement échoué ou annulé.');
      }
    } catch (err) {
      setErrorMessage('Erreur de communication avec l\'agrégateur de paiement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg card-emerald rounded-3xl p-6 sm:p-8 border border-[#0F5937] shadow-2xl overflow-hidden">

        {/* Top Ribbon Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#FF5500] via-[#FFD700] to-[#00E676]"></div>

        {/* Back & Close Controls */}
        <div className="flex items-center justify-between mb-4 pt-1">
          <button
            onClick={onBackToForm}
            className="flex items-center gap-1 text-xs font-bold text-[#FF5500] hover:underline transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Modifier les infos
          </button>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Order Summary Header */}
        <div className="bg-[#031E12] p-4 rounded-2xl border border-[#0E5434] mb-6 flex justify-between items-center shadow-inner">
          <div>
            <span className="text-[10px] text-[#A2C7B5] uppercase tracking-widest block font-bold">Réf. Commande</span>
            <span className="font-mono font-extrabold text-white text-base">{ticket.reference}</span>
            <span className="text-xs text-[#C5E3D5] block">{ticket.buyer_name} ({ticket.quantity} ticket{ticket.quantity > 1 ? 's' : ''})</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#FF5500] uppercase tracking-widest block font-extrabold">Montant Total</span>
            <span className="font-extrabold text-xl text-[#FFD700]">
              {ticket.total_amount.toLocaleString('fr-FR')} F
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-extrabold text-white text-center mb-1">
          Guichet Jèko & Mobile Money
        </h3>
        <p className="text-xs text-[#9BBFA9] text-center mb-6">
          Sélectionnez Jèko ou votre opérateur Mobile Money pour valider votre achat.
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs text-rose-200 text-center flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Operators Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {operators.map(op => (
            <button
              key={op.id}
              type="button"
              onClick={() => setSelectedOperator(op.id)}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${selectedOperator === op.id
                  ? 'border-[#FF5500] bg-[#0A3D27] text-white shadow-lg shadow-[#FF5500]/20 scale-105'
                  : 'border-[#0E5434] bg-[#031E12] text-gray-300 hover:border-[#FF5500]/50'
                }`}
            >
              <span className="text-2xl">{op.icon}</span>
              <span className="text-white text-[12px] font-bold">{op.name}</span>
            </button>
          ))}
        </div>

        {/* Operator Specific Form & Direct Jeko Payment CTA */}
        <div className="bg-[#031E12] p-5 rounded-2xl border border-[#0E5434] mb-6 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#C5E3D5] font-bold">Opérateur Sélectionné :</span>
            <span className="text-[#FF5500] font-extrabold uppercase tracking-wider">{selectedOperator}</span>
          </div>

          <div>
            <label className="block text-[11px] text-[#A2C7B5] mb-1 font-bold uppercase">
              Numéro de téléphone pour le débit ({selectedOperator.toUpperCase()})
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF5500]" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: 07 01 02 03 04"
                className="w-full bg-[#052919] border border-[#0E5434] rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#FF5500]"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleJekoPayment}
            className="w-full py-3.5 bg-gradient-to-r from-[#FF5500] to-[#FF6E00] hover:from-[#FF661A] hover:to-[#FF5500] text-white font-extrabold rounded-xl shadow-[0_4px_20px_rgba(255,85,0,0.4)] flex items-center justify-center gap-2 text-sm transition-all border border-[#FF7733]/30"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#FFD700]" />
            )}
            <span>Payer via Jèko API ({selectedOperator.toUpperCase()})</span>
          </button>

          {selectedOperator === 'kkiapay' && (
            <button
              type="button"
              onClick={launchKkiapayWidget}
              className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
            >
              <CreditCard className="w-4 h-4" />
              Ouvrir le Guichet KKiaPay (SDK)
            </button>
          )}
        </div>

        {/* Aggregator Sandbox Test Buttons */}
        <div className="space-y-3">
          <p className="text-[11px] text-center text-[#7AA993] font-bold uppercase tracking-widest">
            — Simulation Directe (Mode Test) —
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSimulatedPayment('SUCCESS')}
              className="py-3 px-4 bg-[#053D25] hover:bg-[#00E676] hover:text-black text-[#00E676] font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all border border-[#00E676]/40"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Simuler Succès</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSimulatedPayment('FAILED')}
              className="py-3 px-4 bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Simuler Refus</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#A2C7B5]">
          <ShieldCheck className="w-4 h-4 text-[#FF5500]" />
          <span>Le ticket sera généré avec un QR Code unique dès la confirmation.</span>
        </div>

      </div>
    </div>
  );

}

