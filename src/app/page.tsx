import Link from "next/link";

const LightbulbIcon = () => (
  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ChartBarIcon = () => (
  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const OfficeBuildingIcon = () => (
  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-primary text-light font-sans selection:bg-accent selection:text-primary flex flex-col">
      {/* Navigation Bar */}
      <nav className="w-full py-5 px-6 md:px-12 flex justify-between items-center bg-primary sticky top-0 z-50 shadow-sm border-b border-mutedBlue/30">
        <div className="text-2xl font-bold tracking-tight text-light hover:text-accent transition-colors">
          <Link href="/">HatchQuest</Link>
        </div>
        <div>
          <Link 
            href="/auth/signin" 
            className="text-light font-semibold hover:text-accent transition-colors"
          >
            Start Game
          </Link>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 px-6 flex flex-col items-center text-center bg-primary">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-light drop-shadow-sm">
            HatchQuest
          </h1>
          <p className="text-2xl md:text-3xl text-accent font-semibold mb-6 max-w-3xl drop-shadow-sm">
            A startup simulation where every decision shapes your venture.
          </p>
          <p className="text-lg md:text-xl text-light/80 max-w-2xl mb-12 leading-relaxed">
            Players take on the role of a founder making strategic business decisions.
          </p>
          <Link 
            href="/auth/signin" 
            className="inline-flex items-center justify-center bg-accent text-primary font-bold text-lg md:text-xl py-4 flex-shrink-0 px-10 rounded-xl shadow-[0_4px_14px_0_rgba(247,184,1,0.39)] hover:shadow-[0_6px_20px_rgba(247,184,1,0.23)] hover:bg-[#ffc933] transition-all transform hover:-translate-y-1"
          >
            Start Game
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </section>

        {/* How the Game Works */}
        <section className="py-24 px-6 md:px-12 bg-primary w-full flex flex-col items-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-16 text-light text-center">How the Game Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
            {/* Card 1 */}
            <div className="bg-light rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all flex flex-col items-start border-t-4 border-tealAccent transform hover:-translate-y-1">
              <div className="p-3 bg-primary/5 rounded-xl mb-6">
                 <LightbulbIcon />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-3">Make Strategic Decisions</h3>
              <p className="text-primary/70 text-lg leading-relaxed">
                Face real startup challenges.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-light rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all flex flex-col items-start border-t-4 border-tealAccent transform hover:-translate-y-1">
              <div className="p-3 bg-primary/5 rounded-xl mb-6">
                 <ChartBarIcon />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-3">Experience Consequences</h3>
              <p className="text-primary/70 text-lg leading-relaxed">
                Your choices impact capital, reputation, and growth.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-light rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all flex flex-col items-start border-t-4 border-tealAccent transform hover:-translate-y-1">
              <div className="p-3 bg-primary/5 rounded-xl mb-6">
                 <OfficeBuildingIcon />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-3">Build Your Venture</h3>
              <p className="text-primary/70 text-lg leading-relaxed">
                Smart founders scale. Poor choices fail.
              </p>
            </div>
          </div>
        </section>

        {/* Game Features Section */}
        <section className="py-24 px-6 md:px-12 bg-primary w-full flex flex-col items-center border-t border-mutedBlue/30">
          <div className="max-w-4xl w-full">
            <h2 className="text-3xl md:text-5xl font-bold mb-16 text-light text-center">Game Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {
                [
                  "Startup scenario simulation",
                  "Venture strategy decisions",
                  "Resource management",
                  "Entrepreneurship mindset challenges",
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-4 bg-mutedBlue/10 p-6 rounded-2xl border border-mutedBlue/30 hover:bg-mutedBlue/20 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-tealAccent/20 flex items-center justify-center shadow-inner">
                      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xl text-light/90 font-medium">{feature}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </section>

        {/* Final Call To Action */}
        <section className="py-32 px-6 flex flex-col items-center text-center bg-primary border-t border-mutedBlue/30">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-10 text-light">
            Ready to Build Your Startup?
          </h2>
          <Link 
            href="/auth/signin" 
            className="inline-flex items-center justify-center bg-accent text-primary font-bold text-xl md:text-2xl py-5 px-14 rounded-xl shadow-[0_4px_14px_0_rgba(247,184,1,0.39)] hover:shadow-[0_6px_20px_rgba(247,184,1,0.23)] hover:bg-[#ffc933] transition-all transform hover:-translate-y-1"
          >
            Start Game
          </Link>
        </section>
      </main>
    </div>
  );
}