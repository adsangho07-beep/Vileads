import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fdfcfc] flex flex-col font-sans overflow-x-hidden">
      {/* ----------------- HEADER ----------------- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-2">
          {/* Left: Logo */}
          <div className="flex items-center shrink-0">
            <span className="font-extrabold text-xl md:text-2xl text-slate-900 tracking-tight">Vileads</span>
          </div>
          
          {/* Center: Navigation Links in a pill — hidden on small screens */}
          <nav className="hidden sm:flex items-center gap-1 bg-slate-100/80 p-1 md:p-1.5 rounded-full border border-slate-200/50 shadow-sm">
            <a href="#avis" className="text-xs md:text-sm font-semibold text-slate-600 hover:text-brand-600 hover:bg-white hover:shadow-sm px-3 md:px-5 py-1.5 md:py-2 rounded-full transition-all">
              Avis
            </a>
            <a href="#faq" className="text-xs md:text-sm font-semibold text-slate-600 hover:text-brand-600 hover:bg-white hover:shadow-sm px-3 md:px-5 py-1.5 md:py-2 rounded-full transition-all">
              FAQ
            </a>
          </nav>

          {/* Right: Auth Buttons */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Link 
              href="/login"
              className="text-xs md:text-sm font-semibold text-slate-700 hover:text-brand-600 transition-colors"
            >
              Connexion
            </Link>
            <Link 
              href="/signup"
              className="text-xs md:text-sm font-semibold bg-brand-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-full hover:bg-brand-700 transition-colors shadow-md shadow-brand-500/20"
            >
              Commencer
            </Link>
          </div>
        </div>
      </header>

      {/* ----------------- HERO SECTION ----------------- */}
      <main className="flex-1 flex flex-col items-center pt-10 md:pt-20 pb-16 md:pb-24 px-4 md:px-8 relative">
        <div className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center animate-in fade-in zoom-in-95 duration-700">
          
          {/* Hero Left */}
          <div className="flex flex-col items-start space-y-4 md:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-[4rem] font-bold text-slate-800 tracking-tight leading-[1.1]">
              Bienvenue sur <br />
              <span className="text-brand-600 font-black text-5xl sm:text-6xl md:text-[5rem] drop-shadow-sm">Vileads</span>
            </h1>
            <p className="text-base md:text-xl text-slate-600 max-w-md leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
              Générez plus de leads, plus rapidement. La plateforme tout-en-un pour développer votre activité et trouver vos futurs clients.
            </p>
          </div>

          {/* Hero Right: "vos CLIENTs" + Loupe scanning — all on ONE line */}
          <div className="flex items-center justify-center animate-in fade-in zoom-in-95 duration-700 delay-200 py-8">
            {/* Outer wrapper: "vos" + "CLIENTs" side by side */}
            <div className="relative inline-flex items-baseline gap-3">
              {/* "vos" */}
              <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-700 tracking-tight whitespace-nowrap">
                vos
              </span>

              {/* CLIENTs with loupe scanning over it */}
              <div className="relative inline-block">
                <span className="text-4xl sm:text-5xl md:text-6xl font-black text-brand-600 tracking-tighter whitespace-nowrap">
                  CL<span className="text-6xl sm:text-7xl md:text-8xl align-baseline leading-none">IEN</span>Ts
                </span>

                {/* Loupe — enlarged */}
                <div
                  className="absolute inset-0 w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 -top-10 pointer-events-none drop-shadow-2xl z-20"
                  style={{ animation: 'loupeScanner 3s ease-in-out infinite' }}
                >
                  <Image 
                    src="/loupe.png" 
                    alt="Loupe" 
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Central Button below hero */}
        <div className="mt-10 md:mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <Link 
            href="/signup"
            className="inline-flex items-center justify-center px-8 md:px-10 py-3.5 md:py-4 rounded-full bg-brand-600 text-white font-bold text-base md:text-lg hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-105 active:scale-95"
          >
            Commencer maintenant
          </Link>
        </div>
      </main>

      {/* ----------------- AVIS SECTION ----------------- */}
      <section id="avis" className="py-24 bg-slate-50 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Avis</h2>
            <p className="text-slate-500 mt-3">Ce que nos utilisateurs pensent de Vileads</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Avis 1 */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 delay-100">
              <div className="flex gap-1 text-amber-400 mb-6">
                {'★★★★★'.split('').map((s,i) => <span key={i}>{s}</span>)}
              </div>
              <p className="text-slate-600 italic mb-8 leading-relaxed">"Vileads a complètement transformé notre approche de la prospection. Nous avons doublé nos leads en un mois seulement !"</p>
              <div className="mt-auto flex flex-col items-center gap-3">
                <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-14 h-14 rounded-full object-cover shadow-sm border-2 border-white" />
                <div>
                  <p className="font-bold text-slate-900">Marc Dubois</p>
                  <p className="text-sm text-slate-500">Directeur Commercial</p>
                </div>
              </div>
            </div>

            {/* Avis 2 */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 delay-200">
              <div className="flex gap-1 text-amber-400 mb-6">
                {'★★★★★'.split('').map((s,i) => <span key={i}>{s}</span>)}
              </div>
              <p className="text-slate-600 italic mb-8 leading-relaxed">"Une plateforme intuitive et très puissante. Le suivi des campagnes est parfait et l'intégration avec nos outils a été un jeu d'enfant."</p>
              <div className="mt-auto flex flex-col items-center gap-3">
                <img src="https://i.pravatar.cc/150?img=47" alt="Avatar" className="w-14 h-14 rounded-full object-cover shadow-sm border-2 border-white" />
                <div>
                  <p className="font-bold text-slate-900">Sophie Martin</p>
                  <p className="text-sm text-slate-500">Fondatrice d'Agence</p>
                </div>
              </div>
            </div>

            {/* Avis 3 */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 delay-300">
              <div className="flex gap-1 text-amber-400 mb-6">
                {'★★★★★'.split('').map((s,i) => <span key={i}>{s}</span>)}
              </div>
              <p className="text-slate-600 italic mb-8 leading-relaxed">"Le meilleur investissement de l'année pour notre croissance. L'automatisation nous fait gagner un temps précieux au quotidien."</p>
              <div className="mt-auto flex flex-col items-center gap-3">
                <img src="https://i.pravatar.cc/150?img=33" alt="Avatar" className="w-14 h-14 rounded-full object-cover shadow-sm border-2 border-white" />
                <div>
                  <p className="font-bold text-slate-900">Antoine Lemaire</p>
                  <p className="text-sm text-slate-500">CEO, Startup Tech</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- FAQ SECTION ----------------- */}
      <section id="faq" className="py-24 bg-white px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">FAQ</h2>
            <p className="text-slate-500 mt-3">Questions fréquemment posées</p>
          </div>
          
          <div className="space-y-4">
            <details className="group bg-slate-50 rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer hover:bg-slate-100 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
              <summary className="flex justify-between items-center font-semibold text-slate-800 text-lg">
                Qu'est-ce que Vileads ?
                <span className="transition-transform duration-300 group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-slate-600 mt-4 leading-relaxed animate-in fade-in duration-300">
                Vileads est une plateforme SaaS tout-en-un de génération de leads et de prospection automatisée, conçue pour vous aider à trouver vos futurs clients plus rapidement et efficacement.
              </p>
            </details>

            <details className="group bg-slate-50 rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer hover:bg-slate-100 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
              <summary className="flex justify-between items-center font-semibold text-slate-800 text-lg">
                Comment Vileads trouve-t-il des clients pour moi ?
                <span className="transition-transform duration-300 group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-slate-600 mt-4 leading-relaxed animate-in fade-in duration-300">
                Nous combinons l'intelligence artificielle et l'automatisation pour analyser les données du marché et identifier les prospects qualifiés qui correspondent exactement à votre cible commerciale.
              </p>
            </details>

            <details className="group bg-slate-50 rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer hover:bg-slate-100 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
              <summary className="flex justify-between items-center font-semibold text-slate-800 text-lg">
                Est-ce que je peux essayer la plateforme avant de m'engager ?
                <span className="transition-transform duration-300 group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-slate-600 mt-4 leading-relaxed animate-in fade-in duration-300">
                Oui, l'inscription est gratuite et vous permet d'accéder à un certain nombre de crédits de test pour évaluer la puissance de notre plateforme sans avoir besoin d'entrer votre carte bancaire.
              </p>
            </details>

            <details className="group bg-slate-50 rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer hover:bg-slate-100 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400">
              <summary className="flex justify-between items-center font-semibold text-slate-800 text-lg">
                Est-ce adapté au marché africain ?
                <span className="transition-transform duration-300 group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-slate-600 mt-4 leading-relaxed animate-in fade-in duration-300">
                Tout à fait ! Vileads intègre des méthodes de paiement locales (comme Moneroo) et est spécialement optimisé pour vous accompagner sur le marché africain et international.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* ----------------- FOOTER ----------------- */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-sm">
          <p className="hover:text-white transition-colors cursor-default">Bamako, Mali</p>
          <span className="hidden md:inline text-slate-700">•</span>
          <p className="hover:text-white transition-colors cursor-default">+223 91180046</p>
          <span className="hidden md:inline text-slate-700">•</span>
          <p className="hover:text-white transition-colors cursor-default">production Visual Corp</p>
        </div>
      </footer>
    </div>
  );
}
