import { Link } from 'react-router-dom';
import { Bus, Users, MapPin, ShieldCheck, ArrowRight, Car, Route } from 'lucide-react';
import { Logo } from '@/components/Logo';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="absolute top-0 left-0 right-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost text-sm">Connexion</Link>
            <Link to="/register" className="btn-primary text-sm">S'inscrire</Link>
          </div>
        </div>
      </header>

      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-3xl mx-auto">
            La mobilité universitaire au Bénin, simplifiée.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-primary-100 max-w-2xl mx-auto leading-relaxed">
            Étudi'Move connecte les étudiants du Bénin à des solutions de transport fiables et abordables : mototurage, covoiturage et bus étudiant.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="btn-accent text-base px-6 py-3">
              Créer un compte <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn bg-white/10 text-white border border-white/20 hover:bg-white/20 text-base px-6 py-3">
              Se connecter
            </Link>
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Bike, title: 'Mototurage', desc: 'Trajets rapides en moto' },
            { icon: Car, title: 'Covoiturage', desc: 'Partagez vos trajets' },
            { icon: Bus, title: 'Bus étudiant', desc: 'Transport en commun' },
          ].map(f => (
            <div key={f.title} className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/15 text-center">
              <f.icon className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-white font-medium">{f.title}</p>
              <p className="text-primary-100 text-sm mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-neutral-800">Pourquoi Étudi'Move ?</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: MapPin, title: 'Trajets fiables', desc: 'Trouvez et réservez des trajets adaptés à vos horaires universitaires.' },
              { icon: Users, title: 'Communauté étudiante', desc: 'Une plateforme réservée aux étudiants, par les étudiants.' },
              { icon: ShieldCheck, title: "Sécurité d'abord", desc: 'Conducteurs vérifiés et profils validés pour votre tranquillité.' },
            ].map(f => (
              <div key={f.title} className="card text-center hover:shadow-card-hover transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto">
                  <f.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-neutral-800">{f.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-700 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Prêt à rejoindre Étudi'Move ?</h2>
          <p className="mt-3 text-primary-100">Inscrivez-vous gratuitement et commencez à vous déplacer dès aujourd'hui.</p>
          <Link to="/register" className="btn-accent mt-6 text-base px-6 py-3">
            Créer un compte <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="bg-neutral-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-sm text-neutral-400">© {new Date().getFullYear()} Étudi'Move — Mobilité universitaire au Bénin</p>
        </div>
      </footer>
    </div>
  );
}

import { Bike } from 'lucide-react';
