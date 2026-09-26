import React, { useState, useEffect } from 'react';
import { X, Shield, Lock, Search, Filter, Download, Mail, CheckCircle, Clock, Smartphone, TrendingUp, Users, DollarSign, Camera, LogOut, RefreshCw } from 'lucide-react';
import QrScanner from './QrScanner';

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
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        localStorage.setItem('admin_token', data.token);
      } else {
        setLoginError(data.error || 'Identifiants invalides.');
      }
    } catch (err) {
      setLoginError('Erreur de connexion serveur.');
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
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.log('Error fetching stats:', err);
    }
  };

  // Fetch Tickets List
  const fetchTickets = async () => {
    try {
      const query = new URLSearchParams({
        search,
        status: statusFilter,
        operator: operatorFilter
      }).toString();

      const res = await fetch(`/api/admin/tickets?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.log('Error fetching tickets:', err);
    }
  };

  // Resend Ticket Email
  const handleResendEmail = async (ticketId) => {
    setActionMessage('');
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/resend-email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage('✅ Email renvoyé avec succès !');
        fetchTickets();
      } else {
        setActionMessage(`❌ Erreur: ${data.error}`);
      }
    } catch (err) {
      setActionMessage('❌ Échec d\'envoi email.');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    window.open('/api/admin/tickets/export', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-6xl card-emerald rounded-3xl p-6 sm:p-8 border border-[#0F5937] shadow-2xl my-8 max-h-[90vh] flex flex-col">
        
        {/* Ribbon Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#FF5500] via-[#FFD700] to-[#00E676]"></div>

        {/* Dashboard Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#0F5937] shrink-0 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#042B1A] border border-[#0F5937] flex items-center justify-center text-[#FF5500] shadow-md">
              <Shield className="w-6 h-6 text-[#FF5500]" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">
                Dashboard Administration Gala
              </h3>
              <p className="text-xs text-[#7AA993]">
                Gestion des billets, statistiques financières & scanner d'entrée
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {token && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-gray-300 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* LOGIN SCREEN */}
        {!token ? (
          <div className="max-w-md mx-auto my-12 w-full card-emerald p-8 rounded-3xl border border-[#0F5937] shadow-2xl">
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 text-[#FF5500] mx-auto mb-2" />
              <h4 className="text-xl font-extrabold text-white">Connexion Administrateur</h4>
              <p className="text-xs text-[#7AA993]">Entrez vos identifiants pour gérer l'événement</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs text-rose-200 text-center font-semibold">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#C5E3D5] uppercase mb-1">Nom d'utilisateur</label>
                <input
                  type="text"
                  required
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="admin"
                  className="w-full bg-[#031E12] border border-[#0E5434] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5500]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#C5E3D5] uppercase mb-1">Mot de Passe</label>
                <input
                  type="password"
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#031E12] border border-[#0E5434] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5500]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#FF5500] to-[#FF6E00] hover:from-[#FF661A] hover:to-[#FF5500] text-white font-extrabold rounded-xl shadow-[0_4px_20px_rgba(255,85,0,0.4)] text-sm mt-2 border border-[#FF7733]/30"
              >
                {loading ? 'Connexion en cours...' : 'Se Connecter'}
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED DASHBOARD */
          <div className="flex-1 overflow-y-auto space-y-6 pt-4 pr-1">
            
            {/* Navigation Tabs */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-[#031E12] p-1.5 rounded-2xl border border-[#0E5434]">
                <button
                  onClick={() => setActiveTab('tickets')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'tickets' ? 'pill-active' : 'pill-inactive'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Liste des Billets
                </button>
                <button
                  onClick={() => setActiveTab('scanner')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'scanner' ? 'pill-active' : 'pill-inactive'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  Scanner QR Code Entrée
                </button>
              </div>

              <button
                onClick={handleExportCsv}
                className="px-4 py-2 bg-[#052C1C] hover:bg-[#073824] border border-[#0F5937] text-[#FFD700] text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md"
              >
                <Download className="w-4 h-4 text-[#FF5500]" />
                Exporter en CSV
              </button>
            </div>

            {/* KPI STATS CARDS */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#031E12] p-4 rounded-2xl border border-[#0E5434] shadow-lg">
                  <div className="flex items-center justify-between text-[#7AA993] mb-2">
                    <span className="text-xs font-bold uppercase">Recettes Totales</span>
                    <DollarSign className="w-5 h-5 text-[#FFD700]" />
                  </div>
                  <span className="text-2xl font-extrabold text-[#FFD700] block">
                    {stats.total_revenue.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className="text-[10px] text-[#7AA993]">Paiements validés</span>
                </div>

                <div className="bg-[#031E12] p-4 rounded-2xl border border-[#0E5434] shadow-lg">
                  <div className="flex items-center justify-between text-[#7AA993] mb-2">
                    <span className="text-xs font-bold uppercase">Billets Vendus</span>
                    <Users className="w-5 h-5 text-[#FF5500]" />
                  </div>
                  <span className="text-2xl font-extrabold text-white block">
                    {stats.total_tickets_sold} Billet{stats.total_tickets_sold > 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-[#00E676]">Standard Test (10 FCFA)</span>

                </div>

                <div className="bg-[#031E12] p-4 rounded-2xl border border-[#0E5434] shadow-lg">
                  <div className="flex items-center justify-between text-[#7AA993] mb-2">
                    <span className="text-xs font-bold uppercase">Présence Entrée</span>
                    <CheckCircle className="w-5 h-5 text-[#00E676]" />
                  </div>
                  <span className="text-2xl font-extrabold text-white block">
                    {stats.checked_in_count} / {stats.total_tickets_sold}
                  </span>
                  <span className="text-[10px] text-[#7AA993]">Scannés au Gala</span>
                </div>

                <div className="bg-[#031E12] p-4 rounded-2xl border border-[#0E5434] shadow-lg">
                  <div className="flex items-center justify-between text-[#7AA993] mb-1">
                    <span className="text-xs font-bold uppercase">Par Opérateur</span>
                    <Smartphone className="w-5 h-5 text-[#FF5500]" />
                  </div>
                  <div className="text-[11px] space-y-0.5 text-[#C5E3D5]">
                    <div className="flex justify-between"><span>🌊 Wave:</span> <b className="text-white">{stats.operator_stats?.wave?.count || 0}</b></div>
                    <div className="flex justify-between"><span>🟡 MTN:</span> <b className="text-white">{stats.operator_stats?.mtn?.count || 0}</b></div>
                    <div className="flex justify-between"><span>🟠 Orange:</span> <b className="text-white">{stats.operator_stats?.orange?.count || 0}</b></div>
                    <div className="flex justify-between"><span>💳 KKiaPay/Autre:</span> <b className="text-white">{(stats.operator_stats?.kkiapay?.count || 0) + (stats.operator_stats?.moov?.count || 0)}</b></div>
                  </div>
                </div>
              </div>
            )}

            {actionMessage && (
              <div className="p-3 bg-[#053D25] border border-[#00E676]/50 text-[#00E676] rounded-xl text-xs text-center font-bold">
                {actionMessage}
              </div>
            )}

            {/* TAB CONTENT */}
            {activeTab === 'scanner' ? (
              <QrScanner token={token} onValidationSuccess={() => { fetchStats(); fetchTickets(); }} />
            ) : (
              /* TICKETS TABLE VIEW */
              <div className="space-y-4">
                
                {/* Search & Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7AA993]" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher nom, réf, tél..."
                      className="w-full bg-[#031E12] border border-[#0E5434] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#5A8772] focus:outline-none focus:border-[#FF5500]"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#031E12] border border-[#0E5434] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5500]"
                  >
                    <option value="">Tous les Statuts</option>
                    <option value="SUCCESS">Succès (Payé)</option>
                    <option value="PENDING">En Attente</option>
                    <option value="FAILED">Échoué</option>
                  </select>

                  <select
                    value={operatorFilter}
                    onChange={(e) => setOperatorFilter(e.target.value)}
                    className="bg-[#031E12] border border-[#0E5434] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5500]"
                  >
                    <option value="">Tous les Opérateurs</option>
                    <option value="wave">Wave</option>
                    <option value="mtn">MTN Money</option>
                    <option value="orange">Orange Money</option>
                    <option value="moov">Moov Money</option>
                    <option value="kkiapay">KKiaPay</option>
                  </select>
                </div>

                {/* Table */}
                <div className="bg-[#031E12] border border-[#0E5434] rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-[#C5E3D5]">
                      <thead className="bg-[#052C1C] text-[#FFD700] uppercase text-[10px] tracking-wider border-b border-[#0E5434]">
                        <tr>
                          <th className="py-3 px-4">Référence</th>
                          <th className="py-3 px-4">Participant</th>
                          <th className="py-3 px-4">Contact & WhatsApp</th>
                          <th className="py-3 px-4">Montant</th>
                          <th className="py-3 px-4">Opérateur</th>
                          <th className="py-3 px-4">Statut</th>
                          <th className="py-3 px-4">Entrée</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#093D25]">
                        {tickets.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="py-8 text-center text-[#7AA993] text-xs">
                              Aucun billet correspondant trouvé.
                            </td>
                          </tr>
                        ) : (
                          tickets.map((t) => (
                            <tr key={t.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-mono font-extrabold text-[#FFD700]">{t.reference}</td>
                              <td className="py-3 px-4 font-bold text-white">{t.buyer_name}</td>
                              <td className="py-3 px-4">
                                <div>{t.buyer_phone}</div>
                                <div className="text-[10px] text-[#7AA993]">WA: {t.buyer_whatsapp}</div>
                              </td>
                              <td className="py-3 px-4 font-extrabold text-white">{t.total_amount.toLocaleString('fr-FR')} F</td>
                              <td className="py-3 px-4 uppercase font-bold text-[#C5E3D5]">{t.payment_method}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  t.payment_status === 'SUCCESS' ? 'bg-[#053D25] text-[#00E676] border border-[#00E676]/40' :
                                  t.payment_status === 'PENDING' ? 'bg-amber-950 text-amber-400 border border-amber-500/40' :
                                  'bg-rose-950 text-rose-400 border border-rose-500/40'
                                }`}>
                                  {t.payment_status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {t.checked_in ? (
                                  <span className="text-[#00E676] font-bold flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Oui
                                  </span>
                                ) : (
                                  <span className="text-[#7AA993]">Non</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleResendEmail(t.id)}
                                  className="px-2.5 py-1 bg-[#052C1C] hover:bg-[#FF5500] hover:text-white border border-[#0F5937] text-[#FF5500] text-[11px] font-bold rounded-lg flex items-center gap-1 ml-auto transition-colors"
                                  title="Renvoyer l'email avec le billet PDF"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  Email
                                </button>
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

      </div>
    </div>
  );
}

