import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, AlertTriangle, XCircle, RefreshCw, QrCode, Search, ShieldCheck } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import api from '../api';

export default function AdminScanner() {
  const [manualCode, setManualCode] = useState('');
  const [scanningActive, setScanningActive] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { status: 'VALID' | 'ALREADY_SCANNED' | 'INVALID', message, ticket }
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const html5QrCodeRef = useRef(null);

  const startScanner = async () => {
    setErrorMsg('');
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("reader");
      }

      setScanningActive(true);
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleVerifyTicketCode(decodedText);
          stopScanner();
        },
        () => {}
      );
    } catch (err) {
      console.error("Camera access error:", err);
      setErrorMsg("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.");
      setScanningActive(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scanningActive) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Stop scanner error:", err);
      }
      setScanningActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleVerifyTicketCode = async (codeToVerify) => {
    if (!codeToVerify) return;
    setLoading(true);
    setScanResult(null);

    try {
      const res = await api.post('/tickets/scan', {
        ticket_code: codeToVerify.trim()
      });

      setLoading(false);
      setScanResult(res.data);

      if (res.data.status === 'VALID') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data) {
        setScanResult(err.response.data);
      } else {
        setScanResult({
          status: 'INVALID',
          message: 'Erreur réseau ou serveur lors de la vérification.',
          valid: False
        });
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6 text-left">
      
      {/* Header */}
      <div className="glass-card p-5 border-l-4 border-l-[#D4AF37] flex items-center justify-between">
        <div>
          <span className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider block">
            Module de Contrôle d'Accès
          </span>
          <h2 className="text-xl font-bold text-white font-serif">Scanner QR Code Tickets</h2>
        </div>
        <ShieldCheck className="w-8 h-8 text-emerald-400" />
      </div>

      {/* Scanner Box */}
      <div className="glass-card p-6 text-center space-y-4 relative overflow-hidden">
        
        <div 
          id="reader" 
          className={`w-full aspect-square max-w-[320px] mx-auto rounded-2xl overflow-hidden bg-black/60 border-2 ${
            scanningActive ? 'border-[#D4AF37]' : 'border-white/10'
          } flex items-center justify-center`}
        >
          {!scanningActive && (
            <div className="p-6 text-center text-gray-400 space-y-3">
              <QrCode className="w-16 h-16 text-[#D4AF37] mx-auto opacity-70" />
              <p className="text-xs">Utilisez la caméra de votre smartphone ou PC pour scanner le QR Code du ticket.</p>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="flex justify-center gap-3">
          {!scanningActive ? (
            <button 
              onClick={startScanner}
              className="btn-gold py-3 px-6 text-sm flex items-center gap-2"
            >
              <Camera className="w-5 h-5" /> Activer la Caméra
            </button>
          ) : (
            <button 
              onClick={stopScanner}
              className="btn-outline py-2.5 px-5 text-sm flex items-center gap-2 border-rose-500/50 text-rose-300"
            >
              Désactiver Caméra
            </button>
          )}
        </div>

      </div>

      {/* Manual Input Fallback */}
      <div className="glass-card p-5 space-y-3">
        <label className="block text-xs font-semibold text-gray-300">
          Saisie Manuelle du Code Ticket (En cas de problème caméra)
        </label>
        <div className="flex gap-2">
          <input 
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ex: AN2026-X1Y2Z3A4B5C6"
            className="flex-1 bg-black/40 border border-white/15 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
          />
          <button
            onClick={() => handleVerifyTicketCode(manualCode)}
            disabled={loading || !manualCode.trim()}
            className="btn-gold text-xs px-4 flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" /> Vérifier
          </button>
        </div>
      </div>

      {/* Scan Result Feedback Modal */}
      {scanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-scaleUp">
          <div className={`glass-card w-full max-w-md p-6 text-center space-y-4 border-4 ${
            scanResult.status === 'VALID'
              ? 'border-emerald-500 bg-emerald-950/40'
              : scanResult.status === 'ALREADY_SCANNED'
              ? 'border-amber-500 bg-amber-950/40'
              : 'border-rose-600 bg-rose-950/40'
          }`}>
            
            {/* Icon Banner */}
            {scanResult.status === 'VALID' && (
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-4 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            )}

            {scanResult.status === 'ALREADY_SCANNED' && (
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-4 border-amber-500 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-12 h-12" />
              </div>
            )}

            {(scanResult.status === 'INVALID' || scanResult.status === 'UNPAID') && (
              <div className="w-20 h-20 rounded-full bg-rose-500/20 border-4 border-rose-500 text-rose-400 flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12" />
              </div>
            )}

            {/* Status Title */}
            <div>
              <h3 className={`text-2xl font-black font-serif uppercase tracking-wider ${
                scanResult.status === 'VALID'
                  ? 'text-emerald-400'
                  : scanResult.status === 'ALREADY_SCANNED'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}>
                {scanResult.status === 'VALID' && "C'EST BON !"}
                {scanResult.status === 'ALREADY_SCANNED' && "C'EST DÉJÀ SCANNÉ !"}
                {scanResult.status === 'INVALID' && "C'EST UN FAUX !"}
                {scanResult.status === 'UNPAID' && "NON PAYÉ !"}
              </h3>
              <p className="text-sm font-medium text-gray-200 mt-2 px-2">
                {scanResult.message}
              </p>
            </div>

            {/* Ticket Details if found */}
            {scanResult.ticket && (
              <div className="bg-black/50 p-4 rounded-xl text-left border border-white/10 text-xs space-y-2">
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-gray-400">Titulaire Ticket :</span>
                  <span className="font-bold text-white text-sm">{scanResult.ticket.attendee_name}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-gray-400">Acheteur :</span>
                  <span className="text-gray-200">{scanResult.ticket.buyer_name} ({scanResult.ticket.buyer_phone})</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-gray-400">Code Unique :</span>
                  <span className="font-mono text-[#D4AF37]">{scanResult.ticket.ticket_code}</span>
                </div>
                {scanResult.ticket.scanned_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dernier scan :</span>
                    <span className="text-amber-300 font-semibold">{new Date(scanResult.ticket.scanned_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setScanResult(null)}
              className="w-full btn-gold py-3 text-sm font-bold justify-center"
            >
              Scanner un Autre Ticket
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
