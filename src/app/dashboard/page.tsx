"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Icons
const CurrencyDollarIcon = () => (
  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserGroupIcon = () => (
  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ChartBarIcon = () => (
  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TagIcon = () => (
  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const BuildingOfficeIcon = () => (
  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

// Types
interface StartupConfig {
  founderName: string;
  startupName: string;
  industry: string;
  difficulty: "beginner" | "standard" | "hardcore";
  structure?: string;
  teamSize?: number;
}

interface StartupStats {
  capital: string;
  teamSize: number;
  reputation: string;
  stage: string;
  structureDisplay: string;
}

export default function FounderDashboard() {
  const router = useRouter();
  const [config, setConfig] = useState<StartupConfig | null>(null);
  const [stats, setStats] = useState<StartupStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load config client-side only
    const storedConfig = localStorage.getItem("hatchquest_startup_config");
    
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig) as StartupConfig;
        setConfig(parsed);
        
        // Calculate starting stats
        let structureDisplay = "Solo Founder";
        let teamSize = parsed.teamSize || 1;

        if (parsed.structure === "partnership") {
          structureDisplay = "Partnership";
        } else if (parsed.structure === "joint_venture") {
          structureDisplay = "Joint Venture";
        }

        let calculatedStats: StartupStats = {
          capital: "$25,000",
          teamSize,
          reputation: "Moderate",
          stage: "Idea",
          structureDisplay
        };
        
        if (parsed.difficulty === "beginner") {
          calculatedStats.capital = "$50,000";
          calculatedStats.reputation = "High";
        } else if (parsed.difficulty === "hardcore") {
          calculatedStats.capital = "$10,000";
          calculatedStats.reputation = "Low";
        }
        
        setStats(calculatedStats);
      } catch (e) {
        console.error("Failed to parse startup config", e);
      }
    }
    
    setLoading(false);
  }, []);

  // Graceful fallback UI built inside the same component route
  if (!loading && !config) {
    return (
      <div className="min-h-screen bg-primary text-light flex flex-col items-center justify-center p-6 selection:bg-accent selection:text-primary">
        <div className="bg-light text-primary w-full max-w-md rounded-2xl shadow-2xl p-8 sm:p-10 border-t-4 border-red-400 text-center">
          <h2 className="text-2xl font-bold mb-4">Startup Data Missing</h2>
          <p className="text-primary/70 mb-8">
            We couldn't find your startup configuration. Did you skip the setup phase?
          </p>
          <Link 
            href="/startup-setup"
            className="inline-block w-full bg-accent text-primary font-bold text-lg py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(217,155,0,0.39)] hover:shadow-[0_6px_20px_rgba(217,155,0,0.23)] hover:bg-[#ffb600] transition-all transform hover:-translate-y-0.5"
          >
            Go to Startup Setup
          </Link>
        </div>
      </div>
    );
  }

  // Loading state (avoids hydration mismatch)
  if (loading || !config || !stats) {
    return <div className="min-h-screen bg-primary"></div>;
  }

  return (
    <div className="min-h-screen bg-primary text-light p-6 sm:p-12 pb-24 selection:bg-accent selection:text-primary relative overflow-x-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-20">
        <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-tealAccent blur-[140px] rounded-full"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[35%] h-[35%] bg-mutedBlue blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        {/* Dashboard Header */}
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-mutedBlue/30 pb-6 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-tealAccent/20 text-tealAccent font-bold px-3 py-1 rounded-lg text-sm uppercase tracking-wider">
                Founder Dashboard
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight drop-shadow-sm mb-2 text-light">
              {config.startupName}
            </h1>
            <p className="text-xl text-tealAccent font-medium">
              Founded by <span className="text-light">{config.founderName}</span>
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-primary/10 text-mutedBlue max-w-xs text-sm sm:text-base leading-relaxed">
              Your company is ready. Now the real decisions begin.
            </p>
          </div>
        </header>

        {/* Status Panel Summary */}
        <div className="bg-primary/20 backdrop-blur-sm border border-mutedBlue/20 rounded-2xl p-6 sm:p-8 mb-10 shadow-lg">
          <h2 className="text-xl font-bold mb-3 flex items-center text-light">
            <SparklesIcon />
            <span className="ml-2">Startup Snapshot</span>
          </h2>
          <p className="text-light/80 text-lg leading-relaxed max-w-3xl">
            Your <span className="font-bold text-accent">{config.industry}</span> startup is entering the market at the <span className="font-bold text-tealAccent">{stats.stage}</span> stage. 
            You are operating on <span className="font-bold text-light">"{config.difficulty === 'hardcore' ? 'Hardcore Founder' : config.difficulty === 'standard' ? 'Standard' : 'Beginner'}"</span> difficulty. 
            Your next decisions will determine whether you survive long enough to scale or run out of runway.
          </p>
        </div>

        {/* Dashboard Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          
          {/* Capital Card */}
          <div className="bg-light text-primary rounded-2xl p-6 shadow-xl border-t-4 border-accent transform hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-primary/70 text-sm uppercase tracking-wider">Capital</h3>
              <div className="p-2 bg-primary/5 rounded-lg"><CurrencyDollarIcon /></div>
            </div>
            <p className="text-3xl font-extrabold text-primary">{stats.capital}</p>
          </div>

          {/* Team Size Card */}
          <div className="bg-light text-primary rounded-2xl p-6 shadow-xl border-t-4 border-tealAccent transform hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-primary/70 text-sm uppercase tracking-wider">Team Size</h3>
              <div className="p-2 bg-primary/5 rounded-lg"><UserGroupIcon /></div>
            </div>
            <p className="text-3xl font-extrabold text-primary">{stats.teamSize}</p>
          </div>

          {/* Reputation Card */}
          <div className="bg-light text-primary rounded-2xl p-6 shadow-xl border-t-4 border-mutedBlue transform hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-primary/70 text-sm uppercase tracking-wider">Reputation</h3>
              <div className="p-2 bg-primary/5 rounded-lg"><ChartBarIcon /></div>
            </div>
            <p className="text-3xl font-extrabold text-primary">{stats.reputation}</p>
          </div>

          {/* Industry Card */}
          <div className="bg-light text-primary rounded-2xl p-6 shadow-xl border-t-4 border-primary transform hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-primary/70 text-sm uppercase tracking-wider">Industry</h3>
              <div className="p-2 bg-primary/5 rounded-lg"><TagIcon /></div>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-primary truncate" title={config.industry}>
              {config.industry}
            </p>
          </div>

          {/* Structure Card */}
          <div className="bg-light text-primary rounded-2xl p-6 shadow-xl border-t-4 border-mutedBlue transform hover:-translate-y-1 transition-transform sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-primary/70 text-sm uppercase tracking-wider">Structure</h3>
              <div className="p-2 bg-primary/5 rounded-lg"><BuildingOfficeIcon /></div>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-primary truncate" title={stats.structureDisplay}>
              {stats.structureDisplay}
            </p>
          </div>

        </div>

        {/* Call to Action */}
        <div className="flex justify-center mt-12 pb-12">
          <Link 
            href="/game"
            className="inline-flex items-center justify-center bg-accent text-primary font-extrabold text-xl sm:text-2xl py-5 px-16 rounded-2xl shadow-[0_4px_20px_0_rgba(217,155,0,0.4)] hover:shadow-[0_8px_30px_rgba(217,155,0,0.3)] hover:bg-[#ffb600] transition-all transform hover:-translate-y-1"
          >
            Start Your Journey
            <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  );
}
