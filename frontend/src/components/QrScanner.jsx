import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle, AlertOctagon, RefreshCw, Upload, Search, Check, X, Smartphone, ArrowLeftRight, FileImage } from 'lucide-react';
import api from '../api';

export default function QrScanner({ token, onValidationSuccess }) {
  const [activeMode, setActiveMode] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [cameraStarted, setCameraStarted] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraError, setCameraError] = useState('');

  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const html5QrcodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize camera list
  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameras(devices);
        const backCam = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('arrière') || 
          d.label.toLowerCase().includes('environment')
        );
        setSelectedCameraId(backCam ? backCam.id : devices[0].id);
      }
    }).catch(err => {
      console.warn("Unable to enumerate cameras:", err);
    });

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (cameraIdToUse) => {
    setCameraError('');
    setErrorMsg('');
    const elementId = "qr-reader-video";

    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode(elementId);
      } else if (html5QrcodeRef.current.isScanning) {
        await html5QrcodeRef.current.stop();
      }

      const cameraConfig = cameraIdToUse 
        ? { deviceId: { exact: cameraIdToUse } } 
        : { facingMode: "environment" };

      await html5QrcodeRef.current.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleValidateCode(decodedText);
        },
        () => {}
      );

      setCameraStarted(true);
    } catch (err) {
      console.error("Camera start error:", err);
      setCameraError("Impossible d'accéder à la caméra. Autorisez l'accès à l'appareil photo dans votre navigateur ou utilisez l'option 'Importer une photo QR'.");
      setCameraStarted(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        setCameraStarted(false);
      } catch (err) {
        console.warn("Stop camera error:", err);
      }
    }
  };

  const toggleCamera = async () => {
    if (cameraStarted) {
      await stopCamera();
    } else {
      await startCamera(selectedCameraId);
    }
  };

  const switchCameraDevice = async (newId) => {
    setSelectedCameraId(newId);
    if (cameraStarted) {
      await stopCamera();
      await startCamera(newId);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    setScanResult(null);

    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5Qrcode("qr-reader-video");
      }

      const qrCodeResult = await html5QrcodeRef.current.scanFileV2(file, true);
      if (qrCodeResult && qrCodeResult.decodedText) {
        handleValidateCode(qrCodeResult.decodedText);
      } else {
        setErrorMsg("Aucun QR code n'a pu être détecté dans cette image. Assurez-vous que le QR code soit bien visible.");
      }
    } catch (err) {
      console.error("File scan error:", err);
      setErrorMsg("Impossible de lire le QR code sur cette image. Importez une photo plus nette.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleValidateCode = async (codeToValidate) => {
    const targetCode = codeToValidate || manualCode;
    if (!targetCode || !targetCode.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/admin/tickets/validate-qr', { code: targetCode.trim() });

      if (res.data?.success) {
        setScanResult({
          success: true,
          message: res.data.message,
          ticket: res.data.ticket
        });
        if (onValidationSuccess) onValidationSuccess();
      } else {
        setScanResult({
          success: false,
          already_checked_in: res.data?.already_checked_in || false,
          message: res.data?.message || 'Validation échouée.',
          ticket: res.data?.ticket
        });
      }
    } catch (err) {
      const errorData = err.response?.data;
      setScanResult({
        success: false,
        already_checked_in: errorData?.already_checked_in || false,
        message: errorData?.message || 'Erreur lors de la validation du billet.',
        ticket: errorData?.ticket
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-1">
          <Camera className="w-4 h-4 text-blue-600" />
          <span>Contrôle & Validation des Entrées</span>
        </div>
        <h3 className="text-xl font-black text-slate-900">Scanner de Billets QR Code</h3>
        <p className="text-xs text-slate-500">
          Choisissez la méthode qui vous convient (Caméra en direct, Import d'image ou Code Manuel).
        </p>
      </div>

      {/* Mode Switcher Buttons */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold">
        <button
          onClick={() => { setActiveMode('camera'); }}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMode === 'camera' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Caméra Live</span>
        </button>

        <button
          onClick={() => { stopCamera(); setActiveMode('upload'); }}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMode === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Photo / Fichier</span>
        </button>

        <button
          onClick={() => { stopCamera(); setActiveMode('manual'); }}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeMode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Saisie Code</span>
        </button>
      </div>

      {/* MODE 1: LIVE CAMERA */}
      {activeMode === 'camera' && (
        <div className="space-y-4">
          <div className="relative bg-slate-900 rounded-xl overflow-hidden min-h-[280px] flex flex-col items-center justify-center border border-slate-300 shadow-inner">
            <div id="qr-reader-video" className="w-full max-w-sm mx-auto overflow-hidden"></div>

            {!cameraStarted && (
              <div className="p-6 text-center space-y-3 text-white z-10">
                <Camera className="w-12 h-12 text-blue-400 mx-auto animate-pulse" />
                <p className="text-sm font-semibold">Caméra non démarrée</p>
                <button
                  onClick={() => startCamera(selectedCameraId)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 mx-auto"
                >
                  <Camera className="w-4 h-4" />
                  Activer la Caméra
                </button>
              </div>
            )}
          </div>

          {/* Camera controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {cameras.length > 1 && (
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-slate-500" />
                <select
                  value={selectedCameraId}
                  onChange={(e) => switchCameraDevice(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:outline-none"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Caméra ${c.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {cameraStarted && (
              <button
                onClick={stopCamera}
                className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold rounded-lg ml-auto transition-colors"
              >
                Arrêter la caméra
              </button>
            )}
          </div>

          {cameraError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold text-center">
              {cameraError}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: UPLOAD IMAGE / PHOTO SCAN */}
      {activeMode === 'upload' && (
        <div className="space-y-4 text-center">
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 bg-slate-50 transition-colors cursor-pointer"
               onClick={() => fileInputRef.current?.click()}>
            <FileImage className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-sm">Scanner depuis une Photo ou Capture d'Écran</h4>
            <p className="text-xs text-slate-500 mt-1">Prenez une photo du QR code ou importez une image sauvegardée</p>
            
            <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm">
              Choisir un fichier image
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Hidden element for scanFile canvas */}
          <div id="qr-reader-video" className="hidden"></div>
        </div>
      )}

      {/* MODE 3: MANUAL INPUT */}
      {activeMode === 'manual' && (
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Saisie Manuelle du Code Référence (Ex: OYH-2026-X89A2)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleValidateCode()}
              placeholder="OYH-2026-XXXXXX"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
            <button
              onClick={() => handleValidateCode()}
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-sm shrink-0"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Vérifier'}
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
          {errorMsg}
        </div>
      )}

      {/* SCAN VALIDATION RESULT DIALOG */}
      {scanResult && (
        <div className={`p-5 rounded-2xl border-2 text-center space-y-3 shadow-md animate-fadeIn ${
          scanResult.success 
            ? 'bg-emerald-50 border-emerald-500 text-emerald-900' 
            : scanResult.already_checked_in
              ? 'bg-amber-50 border-amber-500 text-amber-900'
              : 'bg-rose-50 border-rose-500 text-rose-900'
        }`}>
          <div className="flex justify-center">
            {scanResult.success ? (
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            ) : (
              <AlertOctagon className="w-12 h-12 text-rose-600" />
            )}
          </div>

          <h4 className="font-black text-lg">
            {scanResult.success ? 'ACCÈS AUTORISÉ (VALIDE)' : scanResult.already_checked_in ? 'ATTENTION : Billet Déjà Scanné' : 'ACCÈS REFUSÉ'}
          </h4>

          <p className="text-xs font-bold">
            {scanResult.message}
          </p>

          {scanResult.ticket && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-1 shadow-xs">
              <p><span className="text-slate-500">Nom & Prénoms :</span> <b className="text-slate-900">{scanResult.ticket.buyer_name}</b></p>
              <p><span className="text-slate-500">Référence Billet :</span> <span className="font-mono font-bold text-blue-600">{scanResult.ticket.reference}</span></p>
              <p><span className="text-slate-500">Téléphone / WA :</span> {scanResult.ticket.buyer_phone} / {scanResult.ticket.buyer_whatsapp}</p>
              <p><span className="text-slate-500">Paiement :</span> <span className="font-bold text-emerald-700 uppercase">{scanResult.ticket.payment_method}</span> ({scanResult.ticket.total_amount} FCFA)</p>
            </div>
          )}

          <button
            onClick={() => setScanResult(null)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Fermer / Valider un autre billet
          </button>
        </div>
      )}

    </div>
  );
}
