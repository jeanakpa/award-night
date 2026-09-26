import React, { useState, useEffect } from 'react';
import { Award, Sparkles, Trophy, Vote, Search, Flame, UserPlus, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../api';

export default function VotingSection({ onOpenRegisterModal, onInitiateWavePayment }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedNominee, setSelectedNominee] = useState(null);
  const [voteCount, setVoteCount] = useState(1);
  const [voterName, setVoterName] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [submittingVote, setSubmittingVote] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/votes/categories');
      setCategories(res.data.categories || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // Auto-refresh votes every 10 seconds for real-time accumulation effect
    const interval = setInterval(fetchCategories, 10000);
    return () => clearInterval(interval);
  }, []);

  // Aggregate all nominees across categories or filter by category
  let allNominees = [];
  categories.forEach(cat => {
    if (selectedCategoryId === 'ALL' || selectedCategoryId === cat.id) {
      if (cat.nominees) {
        cat.nominees.forEach((nom, index) => {
          allNominees.push({
            ...nom,
            rank: index + 1
          });
        });
      }
    }
  });

  if (searchQuery.trim()) {
    allNominees = allNominees.filter(n => 
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.category_title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const handleOpenVoteModal = (nominee) => {
    setSelectedNominee(nominee);
    setVoteCount(1);
    setVoterName('');
    setVoterPhone('');
    setError('');
  };

  const handleConfirmVote = async (e) => {
    e.preventDefault();
    if (!selectedNominee) return;
    setError('');

    if (voteCount < 1) {
      setError('Veuillez saisir au moins 1 vote.');
      return;
    }

    setSubmittingVote(true);
    try {
      const res = await api.post('/votes/submit', {
        nominee_id: selectedNominee.id,
        vote_count: voteCount,
        voter_name: voterName || 'Anonyme',
        voter_phone: voterPhone
      });

      setSubmittingVote(false);
      const nomineeData = selectedNominee;
      setSelectedNominee(null);

      // Launch Wave payment modal
      onInitiateWavePayment({
        type: 'vote',
        ref: res.data.vote_transaction.transaction_reference,
        amount: res.data.vote_transaction.total_amount,
        vote_count: voteCount,
        nominee_name: nomineeData.name,
        voter_name: voterName || 'Anonyme',
        voter_phone: voterPhone
      });
    } catch (err) {
      setSubmittingVote(false);
      setError(err.response?.data?.message || 'Erreur lors du traitement du vote.');
    }
  };

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto text-left" id="voting-section">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1DC7FF]/10 border border-[#1DC7FF]/30 text-[#1DC7FF] text-xs font-semibold uppercase mb-3">
            <Flame className="w-4 h-4" /> Votes en Direct (25 FCFA / vote)
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-serif">
            Nominés & Catégories de Récompenses
          </h2>
          <p className="text-gray-400 text-sm mt-1 max-w-xl">
            Soutenez vos candidats préférés. Les votes s'accumulent en temps réel avec calcul automatique des pourcentages !
          </p>
        </div>

        <button 
          onClick={onOpenRegisterModal}
          className="btn-outline text-xs sm:text-sm py-2.5 px-5 flex items-center gap-2 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#D4AF37]" />
          Proposer sa Candidature
        </button>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryId('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategoryId === 'ALL' 
                  ? 'bg-gold-gradient text-black shadow-md' 
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Toutes les catégories
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategoryId === cat.id 
                    ? 'bg-gold-gradient text-black shadow-md' 
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un nominé..."
              className="w-full bg-black/40 border border-white/15 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

        </div>
      </div>

      {/* Nominees Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">
          <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          Chargement des nommés et des scores en direct...
        </div>
      ) : allNominees.length === 0 ? (
        <div className="glass-card py-16 text-center text-gray-400">
          <Award className="w-12 h-12 text-[#D4AF37] mx-auto mb-3 opacity-50" />
          <p className="text-base font-semibold text-white">Aucun nominé dans cette catégorie pour le moment.</p>
          <p className="text-xs text-gray-400 mt-1">Vous pouvez proposer votre candidature en cliquant sur "Proposer sa Candidature".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allNominees.map((nominee) => (
            <div 
              key={nominee.id}
              className="glass-card p-5 relative flex flex-col justify-between group hover:border-[#D4AF37]"
            >
              {/* Rank Badge */}
              <div className={`absolute top-4 right-4 text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                nominee.rank === 1 
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/50' 
                  : nominee.rank === 2
                  ? 'bg-slate-300/20 text-slate-200 border-slate-300/50'
                  : 'bg-amber-800/20 text-amber-500 border-amber-800/50'
              }`}>
                {nominee.rank === 1 ? '🥇 #1 Leader' : `#${nominee.rank}`}
              </div>

              <div>
                {/* Photo / Avatar */}
                <div className="w-24 h-24 rounded-2xl mx-auto mb-4 overflow-hidden border-2 border-[#D4AF37]/40 group-hover:scale-105 transition-transform bg-black">
                  <img 
                    src={nominee.photo_url} 
                    alt={nominee.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'; }}
                  />
                </div>

                {/* Category tag */}
                <span className="text-[10px] text-[#D4AF37] font-semibold tracking-wider uppercase block text-center truncate">
                  {nominee.category_title}
                </span>

                <h3 className="text-lg font-bold text-white text-center font-serif mt-1 truncate">
                  {nominee.name}
                </h3>

                {nominee.bio && (
                  <p className="text-xs text-gray-300 text-center line-clamp-2 mt-1 px-2 italic">
                    "{nominee.bio}"
                  </p>
                )}
              </div>

              {/* Vote Percentage Progress Meter */}
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Pourcentage des votes</span>
                  <span className="font-extrabold text-gold-gradient font-serif">
                    {nominee.vote_percentage}% ({nominee.vote_count} votes)
                  </span>
                </div>

                <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${Math.max(nominee.vote_percentage, 5)}%` }}
                  />
                </div>

                {/* Vote Action Button */}
                <button
                  onClick={() => handleOpenVoteModal(nominee)}
                  className="w-full mt-3 btn-gold text-xs py-2.5 justify-center flex items-center gap-2"
                >
                  <Vote className="w-4 h-4" />
                  Voter ce Nominé (25F)
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Voting Modal */}
      {selectedNominee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-6 relative border-2 border-[#1DC7FF] text-left animate-scaleUp">
            
            <button 
              onClick={() => setSelectedNominee(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-gray-300"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#D4AF37]">
                <img src={selectedNominee.photo_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-[10px] text-[#1DC7FF] font-bold uppercase tracking-wider block">
                  Voter pour le nominé
                </span>
                <h3 className="text-lg font-bold text-white font-serif">{selectedNominee.name}</h3>
                <span className="text-xs text-gray-400 block">{selectedNominee.category_title}</span>
              </div>
            </div>

            {error && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleConfirmVote} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1 font-medium">Nombre de votes *</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-black/40 border border-white/15 rounded-xl p-1">
                    <button 
                      type="button" 
                      onClick={() => setVoteCount(Math.max(1, voteCount - 1))}
                      className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold"
                    >
                      -
                    </button>
                    <input 
                      type="number"
                      min="1"
                      value={voteCount}
                      onChange={(e) => setVoteCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center bg-transparent text-white font-bold text-base focus:outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={() => setVoteCount(voteCount + 1)}
                      className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex gap-1.5 overflow-x-auto">
                    {[10, 50, 100].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setVoteCount(cnt)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-gray-300"
                      >
                        +{cnt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Voter Optional Contact */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Votre Nom (Optionnel)</label>
                  <input 
                    type="text"
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    placeholder="Ex: Paul"
                    className="w-full bg-black/40 border border-white/15 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#1DC7FF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Téléphone Wave</label>
                  <input 
                    type="tel"
                    value={voterPhone}
                    onChange={(e) => setVoterPhone(e.target.value)}
                    placeholder="Ex: 0700000000"
                    className="w-full bg-black/40 border border-white/15 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#1DC7FF]"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                <span className="text-xs text-gray-300">Total du Paiement (25F / vote)</span>
                <span className="text-lg font-bold text-cyan-400 font-serif">
                  {(voteCount * 25).toLocaleString()} FCFA
                </span>
              </div>

              <button 
                type="submit"
                disabled={submittingVote}
                className="w-full btn-wave py-3 text-sm justify-center flex items-center gap-2"
              >
                {submittingVote ? 'Initialisation...' : `Payer ${(voteCount * 25).toLocaleString()} FCFA sur Wave`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>
      )}

    </section>
  );
}
