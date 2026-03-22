"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Types
interface StartupConfig {
  founderName: string;
  startupName: string;
  industry: string;
  difficulty: "beginner" | "standard" | "hardcore";
  structure: string;
  teamSize?: number;
}

interface StartupStats {
  capital: string;
  teamSize: number;
  reputation: string;
  stage: string;
}

interface Scenario {
  id: number;
  stage: string;
  text: string;
  options: { label: string; text: string }[];
}

// Icons
const CurrencyDollarIcon = () => (
  <svg className="w-4 h-4 text-accent inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const UserGroupIcon = () => (
  <svg className="w-4 h-4 text-accent inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const ChartBarIcon = () => (
  <svg className="w-4 h-4 text-accent inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const TagIcon = () => (
  <svg className="w-4 h-4 text-accent inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4 text-accent inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

// 15 Scenario Levels Array
const STAGES = [
  "Idea Validation", "First Prototype", "Early Users", "First Revenue", "MVP Launch",
  "Hiring First Team Member", "Product Iteration", "Investor Pitch", "Market Competition", "Scaling Operations",
  "Series A Preparation", "Expansion Strategy", "Industry Disruption", "Major Crisis Decision", "Market Leader Decision"
];

const MOCK_SCENARIOS: Scenario[] = [
  { id: 1, stage: STAGES[0], text: "You have an idea for a platform addressing an unmet need.\nWhat is your first step?", options: [{ label: "A", text: "Build a prototype immediately" }, { label: "B", text: "Conduct customer interviews first" }, { label: "C", text: "Look for a technical co-founder" }, { label: "D", text: "Pitch investors before building" }] },
  { id: 2, stage: STAGES[1], text: "Your early prototype is built, but it’s buggy.\nDo you launch it or fix it?", options: [{ label: "A", text: "Launch to a closed alpha group" }, { label: "B", text: "Wait 3 months to polish it" }, { label: "C", text: "Scrap it and pivot your idea" }, { label: "D", text: "Release it publicly and fix bugs live" }] },
  { id: 3, stage: STAGES[2], text: "A small group of users loves your product, but they want highly requested custom features.", options: [{ label: "A", text: "Build whatever the users ask for" }, { label: "B", text: "Stick strictly to your original roadmap" }, { label: "C", text: "Focus entirely on marketing over features" }, { label: "D", text: "Selectively build only core scalable features" }] },
  { id: 4, stage: STAGES[3], text: "It's time to monetize. Users are used to getting your tool for free.\nHow do you introduce pricing?", options: [{ label: "A", text: "Implement a hard paywall instantly" }, { label: "B", text: "Launch a freemium premium tier" }, { label: "C", text: "Grandfather early users for life" }, { label: "D", text: "Run ads instead of charging" }] },
  { id: 5, stage: STAGES[4], text: "Your MVP crashes due to unexpected viral traffic.\nYour servers are literally on fire.", options: [{ label: "A", text: "Shut down temporarily to rewrite backend" }, { label: "B", text: "Throw capital at expensive scalable servers" }, { label: "C", text: "Apologize publicly and beg for patience" }, { label: "D", text: "Cap new sign-ups with a waitlist" }] },
  { id: 6, stage: STAGES[5], text: "You have enough capital to hire your first key employee.\nWho do you bring on?", options: [{ label: "A", text: "A senior lead engineer" }, { label: "B", text: "A charismatic marketing director" }, { label: "C", text: "An operations and finance wizard" }, { label: "D", text: "Cheaper junior developers to move fast" }] },
  { id: 7, stage: STAGES[6], text: "Data shows user retention is dropping after the first week.\nHow do you address the leak?", options: [{ label: "A", text: "Launch huge marketing campaigns to replace them" }, { label: "B", text: "Completely redesign the onboarding flow" }, { label: "C", text: "Email users aggressively asking why they left" }, { label: "D", text: "Ignore it and focus on closing enterprise deals" }] },
  { id: 8, stage: STAGES[7], text: "You secure a meeting with a legendary VC firm.\nThey are skeptical about your market size.", options: [{ label: "A", text: "Confidently double your TAM estimates" }, { label: "B", text: "Admit it's niche but hyper-profitable" }, { label: "C", text: "Pitch them on pivoting to a larger market" }, { label: "D", text: "Show insane engagement metrics to distract them" }] },
  { id: 9, stage: STAGES[8], text: "A massive, well-funded competitor clones your product and undercuts your pricing.", options: [{ label: "A", text: "Engage in a brutal price war" }, { label: "B", text: "Pivot to focus on a superior enterprise tier" }, { label: "C", text: "Sue them for IP infringement" }, { label: "D", text: "Publicly mock them on social media" }] },
  { id: 10, stage: STAGES[9], text: "You need to scale rapidly but your internal processes are pure chaos.\nThe team is burning out.", options: [{ label: "A", text: "Hire an expensive experienced COO" }, { label: "B", text: "Slow down growth to fix internal culture" }, { label: "C", text: "Enforce strict corporate reporting structures" }, { label: "D", text: "Fire underperformers to set an example" }] },
  { id: 11, stage: STAGES[10], text: "You are preparing for a massive Series A raise.\nWhat is your core narrative?", options: [{ label: "A", text: "We are the absolute market leaders in tech" }, { label: "B", text: "We have unprecedented revenue growth" }, { label: "C", text: "We have an obsessed, cult-like user base" }, { label: "D", text: "We are an acquisition target for Google" }] },
  { id: 12, stage: STAGES[11], text: "With fresh capital, it's time to expand.\nWhere do you allocate the Series A funds?", options: [{ label: "A", text: "Aggressive international geographic expansion" }, { label: "B", text: "Acquiring two smaller struggling competitors" }, { label: "C", text: "Massive R&D into experimental new products" }, { label: "D", text: "Saturating your current market via marketing" }] },
  { id: 13, stage: STAGES[12], text: "A massive shift in AI technology threatens to make your core product obsolete in 2 years.", options: [{ label: "A", text: "Ignore the hype and stick to your guns" }, { label: "B", text: "Immediately sell the company before the crash" }, { label: "C", text: "Aggressively integrate the new AI into your core" }, { label: "D", text: "Pivot the entire company to become an AI startup" }] },
  { id: 14, stage: STAGES[13], text: "A major data breach leaks your customers' personal information to hackers.", options: [{ label: "A", text: "Cover it up and silently patch the exploit" }, { label: "B", text: "Immediately disclose publicly and take the hit" }, { label: "C", text: "Blame a third-party vendor" }, { label: "D", text: "Pay the hackers the ransom quietly" }] },
  { id: 15, stage: STAGES[14], text: "You dominate the market.\nA tech giant offers to acquire you for $500 Million.", options: [{ label: "A", text: "Accept the buyout and retire" }, { label: "B", text: "Reject it and prepare for an IPO" }, { label: "C", text: "Counter-offer for $1 Billion" }, { label: "D", text: "Leak the offer to the press to boost valuation" }] }
];

export default function GameScreen() {
  const router = useRouter();
  
  // App State
  const [config, setConfig] = useState<StartupConfig | null>(null);
  const [stats, setStats] = useState<StartupStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Game State
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);

  useEffect(() => {
    // Load config client-side
    const storedConfig = localStorage.getItem("hatchquest_startup_config");
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig) as StartupConfig;

        const teamSize = parsed.teamSize || 1;

        const calculatedStats: StartupStats = {
          capital: "$25,000",
          teamSize,
          reputation: "Moderate",
          stage: "Idea"
        };

        if (parsed.difficulty === "beginner") {
          calculatedStats.capital = "$50,000";
          calculatedStats.reputation = "High";
        } else if (parsed.difficulty === "hardcore") {
          calculatedStats.capital = "$10,000";
          calculatedStats.reputation = "Low";
        }

        setConfig(parsed);
        setStats(calculatedStats);
      } catch (e) {
        console.error("Failed to parse startup config", e);
      }
    }
    setLoading(false);
  }, []);

  const handleOptionSelect = (label: string) => {
    if (isTransitioning || gameComplete) return;
    
    setSelectedOption(label);
    setIsTransitioning(true);
    
    // Process consequence
    setTimeout(() => {
      setSelectedOption(null);
      setIsTransitioning(false);
      
      if (currentScenarioIndex < MOCK_SCENARIOS.length - 1) {
        setCurrentScenarioIndex(prev => prev + 1);
        
        // Mock stage evolution
        setStats(prev => prev ? ({
          ...prev,
          stage: STAGES[currentScenarioIndex + 1]
        }) : prev);

      } else {
        setGameComplete(true);
      }
    }, 1800);
  };

  const handlePlayAgain = () => {
    setCurrentScenarioIndex(0);
    setGameComplete(false);
    // Note: In a real app we would reset stats back to baseline here
  };

  if (!loading && (!config || !stats)) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-6">
        <div className="bg-light text-primary p-8 rounded-xl text-center shadow-2xl max-w-md w-full border-t-4 border-red-500">
          <h2 className="text-xl font-bold mb-4">No Startup Configured</h2>
          <p className="mb-6 opacity-80">You need to set up your startup before playing.</p>
          <Link href="/startup-setup" className="block w-full bg-accent text-primary font-bold py-3 rounded-xl hover:bg-[#e5a900] transition-colors">
            Go to Setup
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !config || !stats) {
    return <div className="min-h-screen bg-primary"></div>;
  }

  // --- RESULTS SCREEN ---
  if (gameComplete) {
    return (
      <div className="min-h-screen bg-primary text-light flex flex-col items-center justify-center p-6 selection:bg-accent selection:text-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-30">
          <div className="absolute top-[20%] left-[20%] w-[50%] h-[50%] bg-accent blur-[150px] rounded-full mix-blend-screen opacity-50"></div>
        </div>

        <div className="bg-light text-primary w-full max-w-2xl rounded-[2rem] shadow-2xl p-8 sm:p-12 border-t-8 border-accent z-10 text-center animate-in zoom-in duration-500">
          <h1 className="text-4xl sm:text-5xl font-black mb-2 text-primary tracking-tight">Game Complete</h1>
          <p className="text-xl text-mutedBlue font-semibold mb-8">
            The Journey of <span className="text-primary font-bold">{config.startupName}</span>
          </p>

          <div className="bg-primary/5 rounded-2xl p-6 mb-8 text-left space-y-4 border border-mutedBlue/20">
            <div className="flex justify-between items-center border-b border-mutedBlue/20 pb-4">
              <span className="text-primary/70 font-bold uppercase tracking-wider text-sm">Founder Performance</span>
              <span className="text-tealAccent font-black text-lg">Survived!</span>
            </div>
            <div className="flex justify-between items-center border-b border-mutedBlue/20 pb-4">
              <span className="text-primary/70 font-bold uppercase tracking-wider text-sm">Final Stage</span>
              <span className="text-primary font-black text-lg">{STAGES[14]}</span>
            </div>
            <div className="flex justify-between items-center border-b border-mutedBlue/20 pb-4">
              <span className="text-primary/70 font-bold uppercase tracking-wider text-sm">Final Team Size</span>
              <span className="text-primary font-black text-lg">{stats.teamSize} employees</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-primary/70 font-bold uppercase tracking-wider text-sm">Startup Outcome</span>
              <span className="text-accent font-black text-lg">Market Leader</span>
            </div>
          </div>

          <button 
            onClick={handlePlayAgain}
            className="w-full sm:w-auto bg-accent text-primary font-extrabold text-xl py-4 px-12 rounded-full shadow-[0_4px_20px_0_rgba(247,184,1,0.4)] hover:shadow-[0_8px_30px_rgba(247,184,1,0.3)] hover:bg-[#ffb600] transition-all transform hover:-translate-y-1"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // --- GAME LOOP SCREEN ---
  const currentScenario = MOCK_SCENARIOS[currentScenarioIndex];

  return (
    <div className="min-h-screen bg-primary font-sans text-light flex flex-col relative overflow-hidden selection:bg-accent selection:text-primary">
      
      {/* Immersive Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-30">
        <div className="w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] bg-tealAccent/20 blur-[150px] rounded-full absolute -top-[10%] -left-[10%]"></div>
        <div className="w-[60vw] h-[60vw] md:w-[30vw] md:h-[30vw] bg-accent/10 blur-[120px] rounded-full absolute top-[20%] right-[10%]"></div>
      </div>

      {/* Top Banner / Navigation */}
      <header className="w-full flex justify-between items-center px-6 md:px-10 py-5 z-20 border-b border-light/5 bg-primary/40 backdrop-blur-md">
        <div className="text-2xl font-black tracking-tighter text-light drop-shadow-md">
          HatchQuest
        </div>
      </header>

      {/* Main Responsive Grid Layout */}
      <div className="flex-1 w-full flex flex-col lg:flex-row relative z-10 w-full">
        
        {/* SIDEBAR: Ladder & Stats */}
        <div className="w-full lg:w-72 xl:w-80 lg:border-r border-light/10 bg-primary/40 backdrop-blur-xl flex flex-col order-2 lg:order-1 flex-shrink-0 lg:h-[calc(100vh-81px)] lg:sticky top-0 lg:overflow-y-auto">
          
          {/* Stats Box */}
          <div className="p-6 border-b border-light/10">
            <h3 className="text-xs font-black text-tealAccent uppercase tracking-widest mb-4 flex items-center">
              <SparklesIcon /> Your Startup
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-light/5 rounded-lg p-2.5 outline outline-1 outline-light/10 shadow-inner">
                <span className="text-light/60 text-sm flex items-center"><CurrencyDollarIcon /> Capital</span>
                <span className="font-bold text-accent">{stats.capital}</span>
              </div>
              <div className="flex justify-between items-center bg-light/5 rounded-lg p-2.5 outline outline-1 outline-light/10 shadow-inner">
                <span className="text-light/60 text-sm flex items-center"><UserGroupIcon /> Team</span>
                <span className="font-bold">{stats.teamSize}</span>
              </div>
              <div className="flex justify-between items-center bg-light/5 rounded-lg p-2.5 outline outline-1 outline-light/10 shadow-inner">
                <span className="text-light/60 text-sm flex items-center"><TagIcon /> Industry</span>
                <span className="font-bold text-tealAccent text-sm truncate max-w-[100px]">{config.industry}</span>
              </div>
            </div>
          </div>

          {/* Millionaire-style Progression Ladder */}
          <div className="p-6 pb-20 lg:pb-6 flex-1 flex flex-col justify-end">
            <h3 className="text-xs font-black text-light/40 uppercase tracking-widest mb-4">
              Growth Trajectory
            </h3>
            <div className="flex flex-col-reverse gap-[2px]">
              {STAGES.map((stageName, idx) => {
                const isCurrent = idx === currentScenarioIndex;
                const isPassed = idx < currentScenarioIndex;
                return (
                  <div 
                    key={idx}
                    className={`flex items-center px-4 py-2 rounded-md transition-all duration-300
                      ${isCurrent ? "bg-accent text-primary shadow-[0_0_15px_rgba(247,184,1,0.4)] transform scale-[1.03] z-10 font-black" : 
                        isPassed ? "text-accent/60 opacity-80" : "text-light/30"}
                    `}
                  >
                    <span className={`w-6 text-sm flex-shrink-0 ${isCurrent ? "text-primary/70" : isPassed ? "text-accent/40" : ""}`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm truncate">
                      {stageName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MAIN GAME AREA */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 order-1 lg:order-2 overflow-y-auto w-full max-w-5xl mx-auto min-h-[70vh]">
          
          {/* Stage Badge Mobile */}
          <div className="lg:hidden mb-6 bg-accent/20 border border-accent/40 text-accent font-bold px-4 py-1.5 rounded-full text-sm">
            Stage {currentScenarioIndex + 1}: {STAGES[currentScenarioIndex]}
          </div>

          {/* Center Prompt: The Scenario Area */}
          <div className="w-full flex-1 flex flex-col items-center justify-center mb-8 sm:mb-12">
            <div className="relative w-full">
              {/* Container Shape */}
              <div className={`relative px-6 md:px-12 xl:px-16 py-10 md:py-14 bg-gradient-to-b from-[#001f46] to-primary rounded-[2.5rem] md:rounded-[3.5rem] border-2 shadow-[0_0_50px_-15px_rgba(247,184,1,0.15)] flex flex-col items-center text-center transition-all duration-500 z-20 overflow-visible ${
                isTransitioning ? "border-tealAccent/60 shadow-[0_0_60px_-10px_rgba(98,146,158,0.4)] transform scale-[1.02]" : "border-mutedBlue/40"
              }`}>
                
                {/* Decorative side notches */}
                <div className="hidden sm:block absolute top-1/2 -left-5 transform -translate-y-1/2 w-10 h-10 bg-primary border-r-2 border-mutedBlue/40 rotate-45 z-0"></div>
                <div className="hidden sm:block absolute top-1/2 -right-5 transform -translate-y-1/2 w-10 h-10 bg-primary border-l-2 border-mutedBlue/40 rotate-45 z-0"></div>
                
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium leading-relaxed tracking-wide text-light z-10 whitespace-pre-line drop-shadow-md">
                  {currentScenario.text}
                </h2>

                {/* Feedback Overlay */}
                {isTransitioning && (
                  <div className="absolute bottom-4 justify-center animate-pulse flex items-center space-x-2 bg-tealAccent/20 px-6 py-2 rounded-full border border-tealAccent/30 backdrop-blur-sm z-30">
                    <div className="w-2 h-2 bg-tealAccent rounded-full"></div>
                    <span className="text-tealAccent font-bold text-xs sm:text-sm tracking-widest uppercase">Deciding...</span>
                  </div>
                )}
              </div>
              
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-mutedBlue/50 to-transparent"></div>
            </div>
          </div>

          {/* 4-Choice Option Grid */}
          <div className="w-full mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-10 md:gap-y-6">
              {currentScenario.options.map((option) => {
                const isSelected = selectedOption === option.label;
                const isDimmed = isTransitioning && !isSelected;
                
                return (
                  <button
                    key={option.label}
                    disabled={isTransitioning}
                    onClick={() => handleOptionSelect(option.label)}
                    className={`group relative flex items-center w-full px-5 py-5 sm:py-6 text-left rounded-full transition-all duration-300 outline-none
                      ${isSelected 
                        ? "bg-accent border border-accent text-primary shadow-[0_0_30px_rgba(247,184,1,0.5)] transform scale-[1.02] z-20" 
                        : "bg-[#001733] border-2 border-mutedBlue/30 hover:border-accent/80 hover:bg-[#001A3A] hover:shadow-[0_0_20px_rgba(247,184,1,0.2)] text-light"
                      }
                      ${isDimmed ? "opacity-30 scale-95" : "opacity-100"}
                    `}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-black text-base md:text-lg mr-4 lg:mr-5 flex-shrink-0 transition-colors duration-300 shadow-inner
                      ${isSelected 
                        ? "bg-primary text-accent" 
                        : "bg-mutedBlue/20 text-accent group-hover:bg-accent/20"
                      }
                    `}>
                      {option.label}
                    </div>
                    <span className={`text-sm sm:text-base lg:text-lg font-semibold tracking-wide transition-colors ${isSelected ? "text-primary" : "text-light/90 group-hover:text-light"}`}>
                      {option.text}
                    </span>
                    
                    {/* Hex tails */}
                    <div className={`hidden sm:block absolute -left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rotate-45 transition-colors duration-300 ${isSelected ? "bg-accent" : "bg-[#001733] border-b-2 border-l-2 border-mutedBlue/30 group-hover:border-accent/80"}`}></div>
                    <div className={`hidden sm:block absolute -right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rotate-45 transition-colors duration-300 ${isSelected ? "bg-accent" : "bg-[#001733] border-t-2 border-r-2 border-mutedBlue/30 group-hover:border-accent/80"}`}></div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}