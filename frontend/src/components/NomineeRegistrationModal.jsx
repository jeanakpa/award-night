import React, { useState, useEffect } from 'react';
import { X, UserPlus, Image, Phone, Mail, Award, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../api';

export default function NomineeRegistrationModal({ isOpen, onClose }) {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get('/votes/categories').then(res => {
        const cats = res.data.categories || [];
        setCategories(cats);
        setRegistrationOpen(res.data.registration_open ?? true);
        if (cats.length > 0) {
          setCategoryId(cats[0].id);
        }
      }).catch(err => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!categoryId || !name.trim() || !phone.trim()) {
      setError('Veuillez sélectionner une catégorie, indiquer votre nom et votre numéro de téléphone.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/votes/self-register', {
        category_id: categoryId,
        name: name,
        phone: phone,
        email: email,
        bio: bio,
        photo_url: photoUrl
      });

      setLoading(false);
      setSuccessMsg(res.data.message || 'Candidature enregistrée avec succès !');
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
        setName('');
        setPhone('');
        setBio('');
        setPhotoUrl('');
      }, 2500);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Erreur lors du dépôt de candidature.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-card w-full max-w-lg p-6 sm:p-8 relative border-2 border-[#D4AF37] text-left animate-scaleUp">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <div className="p-3 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]">
            <UserPlus className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-serif">Formulaire de Candidature</h2>
            <p className="text-xs text-gray-300">
              Soumettez votre candidature pour les catégories ouvertes aux nominations.
            </p>
          </div>
        </div>

        {!registrationOpen ? (
          <div className="p-6 text-center text-rose-300 space-y-3">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Inscriptions Clôturées</h3>
            <p className="text-xs text-gray-300">
              La date limite de dépôt des candidatures pour cette édition est maintenant dépassée.
            </p>
          </div>
        ) : successMsg ? (
          <div className="p-6 text-center text-emerald-300 space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Félicitations !</h3>
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-300 mb-1 font-medium">Catégorie visée *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-black/50 border border-white/15 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1 font-medium">Nom & Prénoms du Candidat *</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Marie-Esther Yapo"
                className="w-full bg-black/40 border border-white/15 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1 font-medium">Numéro de Téléphone *</label>
                <input 
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 0707070707"
                  className="w-full bg-black/40 border border-white/15 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-300 mb-1 font-medium">Email (Optionnel)</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: candidat@gmail.com"
                  className="w-full bg-black/40 border border-white/15 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1 font-medium">Lien Photo de Profil (URL)</label>
              <input 
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Ex: https://images.unsplash.com/..."
                className="w-full bg-black/40 border border-white/15 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Laissez vide pour utiliser une photo par défaut.</span>
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1 font-medium">Présentation / Parcours / Bio</label>
              <textarea 
                rows="3"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Expliquez brièvement votre engagement et vos réalisations cette année..."
                className="w-full bg-black/40 border border-white/15 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3 text-sm justify-center flex items-center gap-2 mt-2"
            >
              {loading ? 'Envoi en cours...' : 'Soumettre ma Candidature'}
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
