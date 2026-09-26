import React from 'react';
import { Utensils, Award, Shirt, Sparkles, Music, Gift } from 'lucide-react';

export default function EventDetails({ onOpenTicketModal }) {
  const highlights = [
    {
      icon: Utensils,
      title: "Dîner Gastronomique",
      desc: "Buffet d'honneur, cocktail de bienvenue & rafraîchissements à volonté."
    },
    {
      icon: Award,
      title: "Nuit des Distinctions",
      desc: "Remise officielle des trophées et trophées d'honneur Award Night 2026."
    },
    {
      icon: Shirt,
      title: "Dress Code Chic & Doré",
      desc: "Tenue de soirée ou de gala exigée avec une touche d'élégance dorée."
    }
  ];

  return (
    <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      
      {/* Section Header */}
      <div className="text-center space-y-1">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF5500]">
          Expérience VIP Prestige
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-white">
          Au Programme de la Soirée Gala
        </h2>
      </div>

      {/* 3 Feature Cards in Emerald & Orange */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {highlights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="card-emerald card-emerald-hover rounded-3xl p-6 text-center space-y-3 border border-[#0F5937] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#042B1A] border border-[#0F5937] flex items-center justify-center text-[#FF5500] mx-auto shadow-md">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-white">{item.title}</h3>
              <p className="text-xs text-[#9BBFA9] leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

    </section>
  );
}

