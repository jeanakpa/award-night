import React, { useState } from 'react';
import { Ticket, Calendar, MapPin, Check, Heart, Award, Star, Flame, Sparkles } from 'lucide-react';

export default function Hero({ onOpenTicketModal }) {
  const [activeCategory, setActiveCategory] = useState('Tout');

  const categories = [
    { id: 'Tout', label: 'Tout' },
    { id: 'Média', label: ' MEDIA' },
    { id: 'Église', label: 'ÉGLISES' },
    { id: 'Agrégateur', label: 'AGREGATEUR' }
  ];

  // Grid covers matching mockup layout - expanded for edge-to-edge full width
  const gridCovers = [
    { name: '1', img: 'https://img.magnific.com/photos-gratuite/gros-plan-brillant-verrerie-debout-derriere-diner-plaque_8353-664.jpg?semt=ais_hybrid&w=740&q=80' },
    { name: '2', img: 'https://www.trait-tendance.com/wp-content/uploads/2018/07/sorin32.jpg' },
    { name: '3', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80' },
    { name: '4', img: 'https://lescharrettesdelily.com/wp-content/uploads/2025/04/5-1024x683.webp' },
    { name: '5', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKtBVc4gl2YPK1S_MPnDYtkYVkSdSArqYgPT4qHVxaITzzKkt1A44fl1U&s=10' },
    { name: '6', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR28YS09clMpI9bBCXWT6kChWWrKv8u4pSGbsjqVgqzuV6Dqb57Yka1QxM&s=10' },
    { name: '7', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-ts8T6PFlKjucsL7oilAasSEEA-ygnqDSojdCjQET-NrGWsc7lDiCzR8&s=10' },
    { name: '8', img: 'https://www.labrique.org/wp-content/uploads/gedeckter-table-3604064_1920.jpg' },
    { name: '9', img: 'https://www.siec-online.com/-/media/Project/Comexposium-Master1/Master1-SIEC/le-salon/actu/actualites-soiree-gala.jpg?h=480&iar=0&w=1120&rev=1e8524d99aca437fbf871804c1379294&hash=95855CFF0B4ABE2CD1F310793F566D35' },
    { name: '10', img: 'https://www.trait-tendance.com/wp-content/uploads/2018/07/sorin32.jpg' },
    { name: '11', img: 'https://img.magnific.com/photos-gratuite/recipients-verre-brillants-couverts-table-diner-decores_8353-660.jpg?semt=ais_hybrid&w=740&q=80' },
    { name: '12', img: 'https://img.magnific.com/photos-gratuite/beaute-mettre-table-dans-endroit-luxueux_8353-9905.jpg?semt=ais_hybrid&w=740&q=80' }
  ];

  // Partenaires (Capture 2 Horizontal Style)
  const partners = [
    {
      name: 'Eglise Méthodiste',
      type: 'de Côte d\'Ivoire',
      category: 'Église',
      img: 'https://www.cevaa.org/la-communaute/fiches-deglises/afrique-occidentale-centrafrique/emu-ci-eglise-methodiste-unie-cote-d2019ivoire/image_mini'
    },
    {
      name: 'MASSI EVENT PROD',
      type: 'Couverture médiatique',
      category: 'Média',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSePGVULRixLvVUXtzVT9_GAmOByZCmftGLKnq38f1TRSmXkQ_rErfLjGM&s=10'
    },
    {
      name: 'Wave CI',
      type: 'Agregateur de paiement mobile',
      category: 'Agrégateur',
      img: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiVwsoHgdXlTAQbQYzaNTfG95bnhIdxTLHXcpfq9Ed6CJ0rXfe28EeU-rkpMdT85cUbrJE1heEkZQWcAMVH5ksSx-pZtkv_SPKXitweWFjVvc81N6jzpVUbzRjaMf0zxzeIk2GcjPfCyI-x/w1200-h630-p-k-no-nu/94276735_252067996154769_1190461988380082176_o.png'
    },
    {
      name: 'CARTE JEUNES CI',
      type: 'Projet de la jeunesse de CI',
      category: 'Sponsors',
      img: 'https://www.cartejeune.ci/clients-logos-carroussel/img/logo-cartejeune.png'
    },
    {
      name: 'SOLIBRA',
      type: 'Fournisseur de boisson',
      category: 'Sponsors',
      img: 'https://www.solibra.ci/images/global/profil_facebook.png'
    },
    {
      name: 'JEKO AFRICA',
      type: 'Agrégateur de paiement',
      category: 'Agrégateur',
      img: 'https://jeko.africa/images/jekobox-terminal.png'
    },
    {
      name: 'ORANGE CI',
      type: 'Agrégateur de paiement',
      category: 'Agrégateur',
      img: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1280px-Orange_logo.svg.png?utm_source=fr.wikipedia.org&utm_campaign=index&utm_content=thumbnail'
    },
    {
      name: 'MTN CI',
      type: 'Agrégateur de paiement',
      category: 'Agrégateur',
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTL9k3u28EU63gjORBQBFy05KQfGvLLeXG3jmpPOL0IpA&s=10'
    },
    {
      name: 'MOOV AFRICA',
      type: 'Agrégateur de paiement',
      category: 'Agrégateur',
      img: 'https://upload.wikimedia.org/wikipedia/fr/1/1d/Moov_Africa_logo.png?utm_source=fr.wikipedia.org&utm_campaign=index&utm_content=original'
    },
    {
      name: 'DJAMO',
      type: 'Agrégateur de paiement',
      category: 'Agrégateur',
      img: 'https://play-lh.googleusercontent.com/eVRq_NpkzdMFXpYUt0vhpWWxEq2PB4bl_x4Q7Q9hEGT471Jn_MSzmIPy9jbe8UZcPETdBeoril8JIASMeRHtjg'
    }
  ];

  const filteredPartners = activeCategory === 'Tout'
    ? partners
    : partners.filter(p => p.category === activeCategory);

  // Programme officiel de la soirée (16 étapes sans heure)
  const programSchedule = [
    {
      theme: 'Mise en place',
      description: 'Musique d’ambiance douce et installation des invités.',
      img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Accueil des invités et prestation de bienvenue',
      description: 'Musique d’ambiance de bienvenue et accueil chaleureux.',
      img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Ouverture officielle',
      description: 'Baisse progressive de la musique et mot de bienvenue du PCO.',
      img: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Première ambiance artistique',
      description: 'Prestation spéciale d\'un artiste en herbe.',
      img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Buffet 1',
      description: 'Plat chaud savoureux accompagné par le groupe musical.',
      img: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Remise de prix 1',
      description: 'Cérémonie de remise des prix : Jeunesse et mérite.',
      img: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Intermède musical',
      description: 'Prestation chorale inspirante.',
      img: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Distinctions particulières',
      description: 'Remise de distinctions particulières et honorifiques.',
      img: 'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Buffet 2',
      description: 'Dégustation des desserts et rafraîchissements au cocktail.',
      img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Défilé de mode',
      description: 'Défilé de mode chic et présentation des créations.',
      img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Remise de prix 2',
      description: 'Remise solennelle des grands prix de la soirée.',
      img: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Prestation live',
      description: 'Performance live réunissant artiste en herbe et groupe musical.',
      img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Mot de remerciements et discours finaux',
      description: 'Discours du PCO et de la présidente de la jeunesse.',
      img: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Show live du groupe musical',
      description: 'Concert et prestation enflammée du groupe musical.',
      img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Grande ambiance de clôture et dancefloor',
      description: 'Animation festive, dancefloor ouvert et remerciements du MC.',
      img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80'
    },
    {
      theme: 'Clôture officielle',
      description: 'Fin de la cérémonie officielle de l\'Award Night.',
      img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80'
    }
  ];

  return (
    <div className="w-full">

      {/* 1. FULL-WIDTH HERO SECTION WITH LOGO & FONDANT GRADIENT */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#0D1E3A] via-[#09162D] to-[#070E1B] pt-4 pb-8 px-4 sm:px-8 text-center text-white flex flex-col justify-end">

        {/* Full-width Top Tilted Cover Grid (Incrustées vers le haut) */}
        <div className="absolute inset-x-0 top-0 h-[400px] sm:h-[450px] overflow-hidden pointer-events-none">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 sm:gap-4 p-2 transform -rotate-6 scale-110 -translate-y-6">
            {gridCovers.map((cover, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-2xl overflow-hidden shadow-xl border border-white/15 bg-[#0A1428]"
              >
                <img
                  src={cover.img}
                  alt={cover.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          {/* LE FONDANT: Full-width gradient fade into page background #070E1B */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0D1E3A]/60 via-[#09162D]/85 to-[#070E1B]" />
        </div>

        {/* Content Layer Over the Fondant */}
        <div className="relative z-20 max-w-md sm:max-w-xl mx-auto space-y-3 pt-26 sm:pt-20">

          {/* Logo Award Night & Subtitle tight flex group */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <img
              src="/logo.png"
              alt="Award Night Logo"
              className="w-full max-w-[340px] sm:max-w-[440px] h-auto object-contain drop-shadow-[0_8px_25px_rgba(0,0,0,0.75)] transition-transform hover:scale-105"
            />

            <p className="text-xs sm:text-sm text-white/90 leading-relaxed px-3 font-medium bg-black/30 backdrop-blur-md py-2 rounded-xl border border-white/10 max-w-lg mx-auto shadow-sm">
              Organisation de la jeunesse méthodiste de Bethesda de Yopougon Niangon Sud
            </p>
          </div>

          {/* Orange Pill CTA Button */}
          <div className="space-y-2 pt-1 max-w-sm mx-auto">
            <button
              onClick={onOpenTicketModal}
              className="w-full py-3.5 sm:py-4 bg-[#FF4500] hover:bg-[#FF5500] active:scale-95 text-white font-extrabold text-sm sm:text-base rounded-full shadow-[0_8px_30px_rgba(255,69,0,0.65)] transition-all border border-white/20 flex items-center justify-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              <span>Payer un ticket (10 FCFA)</span>
            </button>
          </div>

        </div>

      </section>

      {/* 2. MAIN CONTENT SECTIONS */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 pt-4 pb-16">

        {/* REQUIREMENT 2: DATE, LIEU & HEURE - REMARQUABLE CARD (Capture 1 Style in Midnight Blue) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C1E3C] to-[#091730] border border-[#1C3A68] p-4 sm:p-5 shadow-[0_8px_25px_rgba(12,30,60,0.5)] flex items-center justify-between gap-4 transition-all hover:border-[#FF5500]/60 group">
          <div className="flex items-center gap-4">
            {/* Left Icon Box */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <Calendar className="w-7 h-7 text-[#FFD700]" />
            </div>

            {/* Center Details */}
            <div className="text-left space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                vendredi 25 Decembre 2026
              </h3>
              <h2 className="text-base sm:text-lg font-italic text-white tracking-tight">
                A partir de 18h30
              </h2>
              <p className="text-xs sm:text-sm text-[#94B3DE] font-semibold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#FF5500] shrink-0" />
                <span>Salle de Saint-Pierre</span>
              </p>
            </div>
          </div>
        </div>


        {/* REQUIREMENT 3: LISTE DES PARTENAIRES (Capture 2 Style Horizontal Scroll) */}
        <div className="space-y-4 pt-2">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Partenaires et Sponsors
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${activeCategory === cat.id ? 'pill-active' : 'pill-inactive'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horizontal Carousel (Capture 2 Style) */}
          <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-none snap-x pt-1">
            {filteredPartners.map((partner, idx) => (
              <div
                key={idx}
                className="w-40 sm:w-48 shrink-0 snap-start group cursor-pointer"
              >
                {/* Square Card Image */}
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-[#0B172E] border border-[#183157] shadow-lg relative group-hover:border-[#FF5500] transition-all">
                  <img
                    src={partner.img}
                    alt={partner.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-[#FFD700] bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/10">
                    {partner.category}
                  </span>
                </div>

                {/* Partner Name & Subtitle */}
                <div className="mt-2 text-left space-y-0.5">
                  <h4 className="font-bold text-sm text-white truncate group-hover:text-[#FF5500] transition-colors">
                    {partner.name}
                  </h4>
                  <p className="text-xs text-[#94B3DE] truncate font-medium">
                    {partner.type}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>


        {/* REQUIREMENT 4: LE PROGRAMME (Capture 3 Style Vertical List) */}
        <div className="space-y-4 pt-2">

          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Programme de la soirée
            </h2>
            <p className="text-xs text-[#94B3DE]">Le déroulement chronologique de la Nuit des Awards</p>
          </div>

          {/* Vertical List (Capture 3 Style) */}
          <div className="space-y-3">
            {programSchedule.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0B172E]/90 border border-[#183157] hover:bg-[#0E1F3D] hover:border-[#FF5500]/60 transition-all cursor-pointer group shadow-md"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Left Thumbnail Illustration Image */}
                  <img
                    src={item.img}
                    alt={item.theme}
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 border border-white/10 group-hover:scale-105 transition-transform"
                  />

                  {/* Middle Title & Description */}
                  <div className="min-w-0 space-y-1 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-[#FF5500] bg-[#FF5500]/10 px-2 py-0.5 rounded-md border border-[#FF5500]/20 shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="font-extrabold text-sm sm:text-base text-white group-hover:text-[#FF5500] transition-colors">
                        {item.theme}
                      </h4>
                    </div>
                    <p className="text-xs text-[#94B3DE] font-medium leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
