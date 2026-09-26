import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, CheckCircle, AlertOctagon, Camera, RefreshCw, X } from 'lucide-react';

export default function QrScanner({ token, onValidationSuccess }) {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render((decodedText) => {
      handleValidateCode(decodedText);
    }, (error) => {
      // Quiet scanning errors
    });

    return () => {
      scanner.clear().catch(err => console.log('Scanner clear error', err));
    };
  }, []);

  const handleValidateCode = async (codeToValidate) => {
    const targetCode = codeToValidate || manualCode;
    if (!targetCode.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setScanResult(null);

    try {
      const res = await fetch('/api/admin/tickets/validate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: targetCode })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setScanResult({
          success: true,
          message: data.message,
          ticket: data.ticket
        });
        if (onValidationSuccess) onValidationSuccess();
      } else {
        setScanResult({
          success: false,
          already_checked_in: data.already_checked_in || false,
          message: data.message || 'Validation échouée.',
          ticket: data.ticket
        });
      }
    } catch (err) {
      setErrorMsg('Erreur de connexion au serveur de validation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-emerald p-6 rounded-3xl border border-[#0F5937] shadow-2xl max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#031E12] text-[#FFD700] border border-[#0E5434] text-xs font-bold mb-2">
          <Camera className="w-4 h-4 text-[#FF5500]" />
          <span>Scanner d'Accès à l'Entrée</span>
        </div>
        <h3 className="text-xl font-extrabold text-white">
          Contrôle des Billets Gala
        </h3>
        <p className="text-xs text-[#7AA993] mt-1">
          Scannez le QR Code de l'invité ou saisissez manuellement la référence.
        </p>
      </div>

      {/* Camera Video Container */}
      <div className="bg-[#03190E] p-3 rounded-2xl border border-[#0E5434] overflow-hidden shadow-inner">
        <div id="qr-reader" className="w-full text-white text-xs"></div>
      </div>

      {/* Manual Input Form */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-[#C5E3D5] uppercase tracking-wider">
          Saisie Manuelle de la Référence (Ex: OYH-2026-X89A2)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="OYH-2026-XXXXXX"
            className="flex-1 bg-[#031E12] border border-[#0E5434] rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-[#5A8772] focus:outline-none focus:border-[#FF5500]"
          />
          <button
            onClick={() => handleValidateCode()}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-[#FF5500] to-[#FF6E00] hover:from-[#FF661A] hover:to-[#FF5500] text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md shrink-0 border border-[#FF7733]/30"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Vérifier'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs text-rose-200 text-center font-bold">
          {errorMsg}
        </div>
      )}

      {/* Validation Result Modal / Box */}
      {scanResult && (
        <div className={`p-5 rounded-2xl border-2 text-center space-y-3 ${
          scanResult.success 
            ? 'bg-[#053D25] border-[#00E676] text-[#00E676]' 
            : scanResult.already_checked_in
              ? 'bg-amber-950/80 border-amber-500 text-amber-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
        }`}>
          <div className="flex justify-center">
            {scanResult.success ? (
              <CheckCircle className="w-12 h-12 text-[#00E676]" />
            ) : (
              <AlertOctagon className="w-12 h-12 text-rose-400" />
            )}
          </div>

          <h4 className="font-extrabold text-lg">
            {scanResult.success ? 'ACCÈS AUTORISÉ !' : scanResult.already_checked_in ? 'ATTENTION : DÉJÀ VALIDÉ' : 'ACCÈS REFUSÉ'}
          </h4>

          <p className="text-xs font-bold">
            {scanResult.message}
          </p>

          {scanResult.ticket && (
            <div className="bg-black/40 p-3 rounded-xl border border-white/10 text-left text-xs space-y-1">
              <p><span className="text-gray-400">Invité :</span> <b className="text-white">{scanResult.ticket.buyer_name}</b></p>
              <p><span className="text-gray-400">Réf :</span> <span className="font-mono text-[#FFD700]">{scanResult.ticket.reference}</span></p>
              <p><span className="text-gray-400">Téléphone :</span> {scanResult.ticket.buyer_phone}</p>
              <p><span className="text-gray-400">Mode Paiement :</span> <span className="uppercase">{scanResult.ticket.payment_method}</span></p>
            </div>
          )}

          <button
            onClick={() => setScanResult(null)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Fermer / Prochain Billet
          </button>
        </div>
      )}

    </div>
  );
}

