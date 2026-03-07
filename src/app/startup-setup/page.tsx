"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Startup Rocket Icon
const RocketIcon = () => (
  <svg className="w-8 h-8 text-accent inline-block mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.5 21v-2.5m-3 2.5v-2.5m10.5-8.5c0 3.866-3.582 7-8 7s-8-3.134-8-7l1.1-5.5a4 4 0 013.922-3.216h5.956a4 4 0 013.922 3.216z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11v1m0 4v.01" />
  </svg>
);

const INDUSTRIES = [
  "FinTech",
  "HealthTech",
  "AgriTech",
  "E-commerce",
  "EdTech",
  "AI / SaaS",
  "Clean Energy",
  "Other"
];

const DIFFICULTIES = [
  {
    id: "beginner",
    label: "Beginner",
    description: "Higher starting capital and fewer early risks."
  },
  {
    id: "standard",
    label: "Standard",
    description: "Balanced resources and challenges."
  },
  {
    id: "hardcore",
    label: "Hardcore Founder",
    description: "Low starting capital and high market pressure."
  }
];

const COMPANY_STRUCTURES = [
  {
    id: "solo",
    label: "Solo Founder",
    description: "You are building the startup alone."
  },
  {
    id: "partnership",
    label: "Partnership",
    description: "You have one or more co-founders sharing ownership."
  },
  {
    id: "joint_venture",
    label: "Joint Venture",
    description: "The company is formed with multiple partners or organizations."
  }
];

export default function StartupSetup() {
  const router = useRouter();
  
  // Form State
  const [founderName, setFounderName] = useState("");
  const [startupName, setStartupName] = useState("");
  const [industry, setIndustry] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [structure, setStructure] = useState("");
  const [partners, setPartners] = useState("");
  
  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!founderName.trim()) newErrors.founderName = "Founder name is required.";
    if (!startupName.trim()) newErrors.startupName = "Startup name is required.";
    if (!industry) newErrors.industry = "Please select an industry.";
    if (!difficulty) newErrors.difficulty = "Please select a starting difficulty.";
    if (!structure) newErrors.structure = "Please select a company structure.";
    
    if (structure && structure !== "solo") {
      const numPartners = parseInt(partners, 10);
      if (!partners || isNaN(numPartners) || numPartners < 2) {
        newErrors.partners = "Number of partners must be at least 2.";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Create mock object
      const startupConfig = {
        founderName: founderName.trim(),
        startupName: startupName.trim(),
        industry,
        difficulty,
        structure,
        teamSize: structure === "solo" ? 1 : parseInt(partners, 10)
      };
      
      // Store locally (browser storage)
      localStorage.setItem("hatchquest_startup_config", JSON.stringify(startupConfig));
      
      // Route to the founder dashboard
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-primary text-light flex flex-col items-center justify-center p-6 sm:py-12 selection:bg-accent selection:text-primary overflow-x-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[5%] w-[30%] h-[30%] bg-tealAccent blur-[140px] rounded-full"></div>
        <div className="absolute bottom-[5%] right-[5%] w-[25%] h-[25%] bg-mutedBlue blur-[120px] rounded-full"></div>
      </div>

      <div className="mb-6 z-10 text-center">
        <Link href="/" className="inline-block">
          <h1 className="text-3xl font-extrabold tracking-tight text-light hover:text-accent transition-colors drop-shadow-sm">
            HatchQuest
          </h1>
        </Link>
      </div>

      <div className="bg-light text-primary w-full max-w-[600px] rounded-2xl shadow-2xl p-8 sm:p-10 border-t-4 border-tealAccent z-10">
        
        {/* Header */}
        <div className="text-center mb-10 pb-6 border-b border-mutedBlue/20">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 flex items-center justify-center text-primary">
            <RocketIcon />
            Set Up Your Startup
          </h2>
          <p className="text-primary/70 text-base sm:text-lg">
            Every great company starts with a decision.
          </p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-6">
            {/* Founder Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-primary/90" htmlFor="founderName">
                Founder Name
              </label>
              <input
                id="founderName"
                type="text"
                placeholder="Enter your founder name"
                className={`w-full px-4 py-3 rounded-xl border bg-primary/5 text-primary placeholder-primary/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all ${
                  errors.founderName ? 'border-red-400 focus:ring-red-400' : 'border-mutedBlue/30'
                }`}
                value={founderName}
                onChange={(e) => {
                  setFounderName(e.target.value);
                  if (errors.founderName) setErrors({ ...errors, founderName: "" });
                }}
              />
              {errors.founderName && <p className="text-xs text-red-500 font-semibold">{errors.founderName}</p>}
            </div>

            {/* Startup Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-primary/90" htmlFor="startupName">
                Startup Name
              </label>
              <input
                id="startupName"
                type="text"
                placeholder="What is your company called?"
                className={`w-full px-4 py-3 rounded-xl border bg-primary/5 text-primary placeholder-primary/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all ${
                  errors.startupName ? 'border-red-400 focus:ring-red-400' : 'border-mutedBlue/30'
                }`}
                value={startupName}
                onChange={(e) => {
                  setStartupName(e.target.value);
                  if (errors.startupName) setErrors({ ...errors, startupName: "" });
                }}
              />
              {errors.startupName && <p className="text-xs text-red-500 font-semibold">{errors.startupName}</p>}
            </div>

            {/* Industry Selection */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-primary/90" htmlFor="industry">
                Industry
              </label>
              <div className="relative">
                <select
                  id="industry"
                  className={`w-full appearance-none px-4 py-3 rounded-xl border bg-primary/5 text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all cursor-pointer ${
                    errors.industry ? 'border-red-400 focus:ring-red-400' : 'border-mutedBlue/30'
                  } ${!industry ? 'text-primary/40' : 'text-primary'}`}
                  value={industry}
                  onChange={(e) => {
                    setIndustry(e.target.value);
                    if (errors.industry) setErrors({ ...errors, industry: "" });
                  }}
                >
                  <option value="" disabled>Select an industry...</option>
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind} className="text-primary">{ind}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary/50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.industry && <p className="text-xs text-red-500 font-semibold">{errors.industry}</p>}
            </div>

            {/* Starting Difficulty */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-primary/90">
                Starting Difficulty
              </label>
              <div className="grid grid-cols-1 gap-3">
                {DIFFICULTIES.map((diff) => (
                  <label 
                    key={diff.id} 
                    className={`relative flex cursor-pointer rounded-xl p-4 border transition-all ${
                      difficulty === diff.id 
                        ? "border-accent bg-accent/10 shadow-[0_0_15px_-3px_rgba(217,155,0,0.2)]" 
                        : "border-mutedBlue/30 hover:bg-primary/5 hover:border-mutedBlue/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      className="sr-only"
                      value={diff.id}
                      checked={difficulty === diff.id}
                      onChange={(e) => {
                        setDifficulty(e.target.value);
                        if (errors.difficulty) setErrors({ ...errors, difficulty: "" });
                      }}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${
                          difficulty === diff.id ? 'border-accent' : 'border-primary/30'
                        }`}>
                          {difficulty === diff.id && <div className="w-2.5 h-2.5 rounded-full bg-accent"></div>}
                        </div>
                        <span className={`font-bold ${difficulty === diff.id ? 'text-primary' : 'text-primary/80'}`}>
                          {diff.label}
                        </span>
                      </div>
                      <p className={`mt-1 pl-8 text-sm ${difficulty === diff.id ? 'text-primary/90' : 'text-primary/60'}`}>
                        {diff.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.difficulty && <p className="text-xs text-red-500 font-semibold">{errors.difficulty}</p>}
            </div>

            {/* Company Structure */}
            <div className="space-y-3 pt-2">
              <label className="text-sm font-bold text-primary/90">
                Company Structure
              </label>
              <div className="grid grid-cols-1 gap-3">
                {COMPANY_STRUCTURES.map((struct) => (
                  <label 
                    key={struct.id} 
                    className={`relative flex cursor-pointer rounded-xl p-4 border transition-all ${
                      structure === struct.id 
                        ? "border-accent bg-accent/10 shadow-[0_0_15px_-3px_rgba(217,155,0,0.2)]" 
                        : "border-mutedBlue/30 hover:bg-primary/5 hover:border-mutedBlue/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="structure"
                      className="sr-only"
                      value={struct.id}
                      checked={structure === struct.id}
                      onChange={(e) => {
                        setStructure(e.target.value);
                        if (errors.structure) setErrors({ ...errors, structure: "" });
                        if (e.target.value === "solo") {
                          setPartners("");
                          if (errors.partners) setErrors({ ...errors, partners: "" });
                        }
                      }}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${
                          structure === struct.id ? 'border-accent' : 'border-primary/30'
                        }`}>
                          {structure === struct.id && <div className="w-2.5 h-2.5 rounded-full bg-accent"></div>}
                        </div>
                        <span className={`font-bold ${structure === struct.id ? 'text-primary' : 'text-primary/80'}`}>
                          {struct.label}
                        </span>
                      </div>
                      <p className={`mt-1 pl-8 text-sm ${structure === struct.id ? 'text-primary/90' : 'text-primary/60'}`}>
                        {struct.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.structure && <p className="text-xs text-red-500 font-semibold">{errors.structure}</p>}
            </div>

            {/* Conditional Partners Input */}
            {structure && structure !== "solo" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-bold text-primary/90" htmlFor="partners">
                  Number of Partners / Co-Founders
                </label>
                <input
                  id="partners"
                  type="number"
                  min="2"
                  placeholder="How many partners are involved?"
                  className={`w-full px-4 py-3 rounded-xl border bg-primary/5 text-primary placeholder-primary/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all ${
                    errors.partners ? 'border-red-400 focus:ring-red-400' : 'border-mutedBlue/30'
                  }`}
                  value={partners}
                  onChange={(e) => {
                    setPartners(e.target.value);
                    if (errors.partners) setErrors({ ...errors, partners: "" });
                  }}
                />
                {errors.partners && <p className="text-xs text-red-500 font-semibold">{errors.partners}</p>}
              </div>
            )}
            
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-accent text-primary font-extrabold text-xl py-4 rounded-xl shadow-[0_4px_14px_0_rgba(217,155,0,0.39)] hover:shadow-[0_6px_20px_rgba(217,155,0,0.23)] hover:bg-[#ffb600] transition-all transform hover:-translate-y-0.5 mt-2"
            >
              Launch My Startup
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
