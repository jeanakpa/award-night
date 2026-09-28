import React, { useState, useEffect } from 'react';
import { 
  X, Shield, Lock, Search, Filter, Download, Mail, CheckCircle, 
  Clock, Smartphone, TrendingUp, Users, DollarSign, Camera, LogOut, 
  RefreshCw, Eye, QrCode, AlertCircle, ArrowUpRight, Check, XCircle
} from 'lucide-react';
import QrScanner from './QrScanner';
import api, { API_BASE_URL } from '../api';

export default function AdminDashboard({ isOpen, onClose }) {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'scanner'
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Selected ticket for QR Code image preview modal
  const [previewQrTicket, setPreviewQrTicket] = useState(null);

  useEffect(() => {
    if (token && isOpen) {
      fetchStats();
      fetchTickets();
    }
  }, [token, isOpen, search, statusFilter, operatorFilter]);

  if (!isOpen) return null;

  // Handle Admin Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await api.post('/admin/login', credentials);
      if (res.data?.token) {
        setToken(res.data.token);
        localStorage.setItem('admin_token', res.data.token);
      } else {
        setLoginError('Identifiants invalides.');
      }
    } catch (err) {
      console.error("Admin login error:", err);
      const msg = err.response?.data?.error || 'Erreur de connexion serveur.';
      setLoginError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('admin_token');
  };

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.log('Error fetching stats:', err);
    }
  };

  // Fetch Tickets List
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        status: statusFilter,
        operator: operatorFilter
      }).toString();

      const res = await api.get(`/admin/tickets?${query}`);
      if (res.data) {
        setTickets(res.data);
      }
    } catch (err) {
      console.log('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Check-in status directly from row
  const handleToggleCheckin = async (ticketId) => {
    setActionMessage('');
    try {
      const res = await api.post(`/admin/tickets/${ticketId}/toggle-checkin`);
      if (res.data?.success) {
        setActionMessage(`✅ ${res.data.message}`);
        fetchTickets();
        fetchStats();
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Erreur de mise à jour.";
      setActionMessage(`❌ ${msg}`);
    }
  };

  // Update Payment Status directly from row
  const handleUpdateStatus = async (ticketId, newStatus) => {
    setActionMessage('');
    try {
      const res = await api.post(`/admin/tickets/${ticketId}/update-status`, { status: newStatus });
      if (res.data?.success) {
        setActionMessage(`✅ ${res.data.message}`);
        fetchTickets();
        fetchStats();
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Erreur de mise à jour statut.";
      setActionMessage(`❌ ${msg}`);
    }
  };

  // Resend Ticket Email
  const handleResendEmail = async (ticketId) => {
    setActionMessage('');
    try {
      const res = await api.post(`/admin/tickets/${ticketId}/resend-email`);
      if (res.data) {
        setActionMessage('✅ Billet & QR Code renvoyés par email avec succès !');
        fetchTickets();
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Échec d'envoi email.";
      setActionMessage(`❌ Erreur: ${msg}`);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    window.open(`${API_BASE_URL}/admin/tickets/export`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-100 text-slate-800 w-full min-h-screen flex flex-col font-sans animate-fadeIn">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Administration Award Night
              <span className="text-[11px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                PRO GALA
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Gestion centralisée des billets, suivi des encaissements et contrôle des entrées
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {token && (
            <>
              <button
                onClick={() => { fetchStats(); fetchTickets(); }}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                title="Actualiser les données"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </>
          )}

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors ml-2"
            title="Fermer l'administration"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* 2. LOGIN SCREEN FOR UNAUTHENTICATED USERS */}
      {!token ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto text-blue-600 shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Connexion Administrateur</h2>
              <p className="text-xs text-slate-500">
                Saisissez vos identifiants pour gérer les inscriptions & scanner les billets.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 text-center font-bold">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  required
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="admin"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md text-sm transition-all"
              >
                {loading ? 'Connexion en cours...' : 'Se Connecter'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* 3. AUTHENTICATED DASHBOARD BODY */
        <div className="flex-1 px-4 sm:px-8 py-6 space-y-6 max-w-[1600px] w-full mx-auto">
          
          {/* KPI STATS CARDS */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold uppercase text-slate-400">Recettes Total Validées</span>
                  <span className="text-2xl font-black text-slate-900 block">
                    {stats.total_revenue.toLocaleString('fr-FR')} F
                  </span>
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Paiements confirmés
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold uppercase text-slate-400">Billets / Inscriptions</span>
                  <span className="text-2xl font-black text-slate-900 block">
                    {stats.total_tickets_sold} Validé{stats.total_tickets_sold > 1 ? 's' : ''}
                  </span>
                  <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {stats.pending_count || 0} En attente
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold uppercase text-slate-400">Taux de Présence</span>
                  <span className="text-2xl font-black text-slate-900 block">
                    {stats.checked_in_count} / {stats.total_tickets_sold}
                  </span>
                  <span className="text-[11px] text-blue-600 font-bold">
                    Scannés à l'entrée du Gala
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <Camera className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="space-y-1 w-full">
                  <span className="text-xs font-extrabold uppercase text-slate-400">Par Opérateur</span>
                  <div className="text-xs grid grid-cols-2 gap-x-3 gap-y-1 pt-1 font-semibold text-slate-600">
                    <div>🌊 Wave: <b className="text-slate-900">{stats.operator_stats?.wave?.count || 0}</b></div>
                    <div>🟡 MTN: <b className="text-slate-900">{stats.operator_stats?.mtn?.count || 0}</b></div>
                    <div>🟠 Orange: <b className="text-slate-900">{stats.operator_stats?.orange?.count || 0}</b></div>
                    <div>💳 Autre: <b className="text-slate-900">{(stats.operator_stats?.kkiapay?.count || 0) + (stats.operator_stats?.moov?.count || 0)}</b></div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {actionMessage && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* MAIN TAB CONTENT CONTROLS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            
            {/* Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('tickets')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 ${
                  activeTab === 'tickets' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Tableau des Inscriptions ({tickets.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('scanner')}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 ${
                  activeTab === 'scanner' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Scanner QR Code Entrée</span>
              </button>
            </div>

            {/* Export Action */}
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Exporter la liste en CSV</span>
            </button>
          </div>

          {/* TAB 1: SCANNER */}
          {activeTab === 'scanner' ? (
            <QrScanner token={token} onValidationSuccess={() => { fetchStats(); fetchTickets(); }} />
          ) : (
            /* TAB 2: TICKETS TABLE VIEW */
            <div className="space-y-4">
              
              {/* Filters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher nom, réf, tél, email..."
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                >
                  <option value="">Tous les Statuts de Paiement</option>
                  <option value="SUCCESS">Paiements Confirmés (SUCCESS)</option>
                  <option value="PENDING">En Attente de Paiement (PENDING)</option>
                  <option value="FAILED">Échoués (FAILED)</option>
                </select>

                {/* Operator Filter */}
                <select
                  value={operatorFilter}
                  onChange={(e) => setOperatorFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 shadow-xs"
                >
                  <option value="">Tous les Opérateurs</option>
                  <option value="wave">Wave CI</option>
                  <option value="mtn">MTN Money</option>
                  <option value="orange">Orange Money</option>
                  <option value="moov">Moov Money</option>
                  <option value="kkiapay">KKiaPay / Carte</option>
                </select>

              </div>

              {/* Table Container */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    
                    <thead className="bg-slate-50 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Référence</th>
                        <th className="py-3.5 px-4 text-center">QR Code</th>
                        <th className="py-3.5 px-4">Participant & Email</th>
                        <th className="py-3.5 px-4">Contact & WA</th>
                        <th className="py-3.5 px-4">Montant</th>
                        <th className="py-3.5 px-4">Opérateur</th>
                        <th className="py-3.5 px-4">Statut Paiement</th>
                        <th className="py-3.5 px-4 text-center">Entrée Gala</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {tickets.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="py-12 text-center text-slate-400 text-xs">
                            Aucun billet ou inscription trouvé.
                          </td>
                        </tr>
                      ) : (
                        tickets.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            
                            {/* Reference */}
                            <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                              {t.reference}
                            </td>

                            {/* QR Code Thumbnail Preview */}
                            <td className="py-3.5 px-4 text-center">
                              {t.qr_code_data ? (
                                <button
                                  onClick={() => setPreviewQrTicket(t)}
                                  className="group relative inline-block p-1 bg-white border border-slate-200 rounded-lg hover:border-blue-500 shadow-xs transition-all"
                                  title="Cliquer pour agrandir le QR Code"
                                >
                                  <img
                                    src={t.qr_code_data.startsWith('data:') ? t.qr_code_data : `data:image/png;base64,${t.qr_code_data}`}
                                    alt="QR Code"
                                    className="w-10 h-10 object-contain rounded"
                                  />
                                  <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 rounded flex items-center justify-center transition-opacity">
                                    <Eye className="w-4 h-4 text-blue-700" />
                                  </div>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Non généré</span>
                              )}
                            </td>

                            {/* Participant */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{t.buyer_name}</div>
                              <div className="text-[11px] text-slate-500">{t.buyer_email || 'Pas d\'email'}</div>
                            </td>

                            {/* Contact & WhatsApp */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-semibold text-slate-800">{t.buyer_phone}</div>
                              <div className="text-[10px] text-emerald-600 font-bold">WA: {t.buyer_whatsapp}</div>
                            </td>

                            {/* Amount */}
                            <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                              {t.total_amount?.toLocaleString('fr-FR')} F
                              <span className="block text-[10px] font-normal text-slate-500">Qté: {t.quantity || 1}</span>
                            </td>

                            {/* Payment Operator */}
                            <td className="py-3.5 px-4 uppercase font-bold text-slate-700 whitespace-nowrap">
                              {t.payment_method || 'N/A'}
                            </td>

                            {/* Payment Status Dropdown Selector */}
                            <td className="py-3.5 px-4">
                              <select
                                value={t.payment_status}
                                onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold focus:outline-none cursor-pointer border ${
                                  t.payment_status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                  t.payment_status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                                  'bg-rose-50 text-rose-700 border-rose-300'
                                }`}
                              >
                                <option value="SUCCESS">✅ SUCCESS (Payé)</option>
                                <option value="PENDING">⏳ PENDING (En attente)</option>
                                <option value="FAILED">❌ FAILED (Échoué)</option>
                              </select>
                            </td>

                            {/* Checked-in status 1-click Toggle */}
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => handleToggleCheckin(t.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 transition-all shadow-xs border ${
                                  t.checked_in
                                    ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                }`}
                                title="Cliquer pour modifier l'état de présence au gala"
                              >
                                {t.checked_in ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Présent</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Non scanné</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleResendEmail(t.id)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                                  title="Renvoyer le billet par email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>Email</span>
                                </button>
                              </div>
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>

                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* 4. LARGE QR CODE PREVIEW MODAL */}
      {previewQrTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full space-y-4 text-center relative">
            
            <button
              onClick={() => setPreviewQrTicket(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Aperçu QR Code Officiel
              </span>
              <h3 className="font-black text-slate-900 text-base">{previewQrTicket.buyer_name}</h3>
              <p className="text-xs font-mono font-bold text-blue-700">{previewQrTicket.reference}</p>
            </div>

            {/* High Res Image */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block shadow-inner">
              <img
                src={previewQrTicket.qr_code_data.startsWith('data:') ? previewQrTicket.qr_code_data : `data:image/png;base64,${previewQrTicket.qr_code_data}`}
                alt="QR Code Billet"
                className="w-48 h-48 mx-auto object-contain"
              />
            </div>

            <div className="text-xs text-slate-500 space-y-0.5">
              <p>Tél : <b>{previewQrTicket.buyer_phone}</b></p>
              <p>Paiement : <b className="uppercase">{previewQrTicket.payment_method}</b> ({previewQrTicket.total_amount} FCFA)</p>
            </div>

            {/* Download Link */}
            <a
              href={previewQrTicket.qr_code_data.startsWith('data:') ? previewQrTicket.qr_code_data : `data:image/png;base64,${previewQrTicket.qr_code_data}`}
              download={`QR_Code_${previewQrTicket.reference}.png`}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Télécharger l'image QR Code
            </a>

          </div>
        </div>
      )}

    </div>
  );
}
