import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import PurchasePage from './pages/PurchasePage';
import SuccessPage from './pages/SuccessPage';
import TicketViewModal from './components/TicketViewModal';
import AdminDashboard from './components/AdminDashboard';
import { AppProvider, useApp } from './context/AppContext';
import { Ticket, Play } from 'lucide-react';
import api from './api';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'purchase' | 'success'
  const [isTicketViewModalOpen, setIsTicketViewModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  const { currentTicket, setCurrentTicket } = useApp();

  // Check URL query or hash for dedicated Admin access or Jeko Payment return redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true' || window.location.pathname === '/admin') {
      setIsAdminDashboardOpen(true);
    }

    const ref = urlParams.get('ticket_ref');
    const paymentStatus = urlParams.get('payment_status');
    const pageParam = urlParams.get('page');

    if (pageParam === 'success' || paymentStatus === 'success') {
      setCurrentPage('success');
      if (ref) {
        api.get(`/tickets/lookup/${ref}`)
          .then(res => {
            if (res.data?.success && res.data?.ticket) {
              setCurrentTicket(res.data.ticket);
            }
          })
          .catch(err => console.error(err));
      }
    }
  }, []);

  const handleOrderCreated = (confirmedTicket) => {
    setCurrentTicket(confirmedTicket);
    setCurrentPage('success');
  };

  const handleGoHome = () => {
    // Clear URL parameters when returning home
    window.history.replaceState({}, document.title, window.location.pathname);
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen bg-[#070E1B] text-[#F1F6FF] flex flex-col justify-between selection:bg-[#FF5500] selection:text-white pb-20 sm:pb-0">
      
      {/* Main Page View Navigation */}
      <main className="flex-1">
        {currentPage === 'purchase' ? (
          <PurchasePage
            onBack={handleGoHome}
            onOrderCreated={handleOrderCreated}
          />
        ) : currentPage === 'success' ? (
          <SuccessPage
            ticket={currentTicket}
            onGoHome={handleGoHome}
          />
        ) : (
          <Home onOpenTicketModal={() => setCurrentPage('purchase')} />
        )}
      </main>

      {/* Floating Bottom Quick Action Bar (Only on Home view) */}
      {currentPage === 'home' && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-40 sm:max-w-md">
          <div className="bg-[#0D1B36]/95 backdrop-blur-xl border border-[#1E3A66] rounded-2xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF5500] to-[#FF8800] flex items-center justify-center text-white font-extrabold shadow-md shrink-0">
                <Play className="w-5 h-5 fill-white text-white ml-0.5" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-white block truncate">
                  Ticket Award Night 2026
                </span>
                <span className="text-[10px] text-[#94B3DE] block">
                  25 Déc. • Salle Saint-Pierre
                </span>
              </div>
            </div>

            <button
              onClick={() => setCurrentPage('purchase')}
              className="px-4 py-2.5 bg-[#FF5500] hover:bg-[#FF661A] text-white font-extrabold text-xs rounded-xl shadow-[0_4px_15px_rgba(255,85,0,0.4)] flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Réserver</span>
            </button>
          </div>
        </div>
      )}

      {/* Clean Footer without Admin Button */}
      <footer className="border-t border-[#13284B] py-8 text-center text-xs text-[#7B9CC4] space-y-2">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Award Night • Tous droits réservés</p>
        </div>
      </footer>

      {/* Ticket View Modal */}
      <TicketViewModal
        isOpen={isTicketViewModalOpen}
        onClose={() => setIsTicketViewModalOpen(false)}
        ticket={currentTicket}
      />

      {/* Dedicated Admin Portal Modal */}
      <AdminDashboard
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
