import React from "react";

interface NarrativeBeatProps {
  title: string;
  storyText: string;
  feedback: string | null;
}

const SparklesIcon = () => (
  <svg className="w-4 h-4 text-accent inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

export default function NarrativeBeat({ title, storyText, feedback }: NarrativeBeatProps) {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center mb-8 sm:mb-12">
      <div className="relative w-full">
        {/* Container Shape */}
        <div className={`relative px-6 md:px-12 xl:px-16 py-10 md:py-14 bg-gradient-to-b from-[#001f46] to-primary rounded-[2.5rem] md:rounded-[3.5rem] border-2 shadow-[0_0_50px_-15px_rgba(247,184,1,0.15)] flex flex-col items-center text-center transition-all duration-500 z-20 overflow-visible ${
          !!feedback ? "border-tealAccent/60 shadow-[0_0_60px_-10px_rgba(98,146,158,0.4)] transform scale-[1.02]" : "border-mutedBlue/40"
        }`}>
          
          {/* Decorative side notches */}
          <div className="hidden sm:block absolute top-1/2 -left-5 transform -translate-y-1/2 w-10 h-10 bg-primary border-r-2 border-mutedBlue/40 rotate-45 z-0"></div>
          <div className="hidden sm:block absolute top-1/2 -right-5 transform -translate-y-1/2 w-10 h-10 bg-primary border-l-2 border-mutedBlue/40 rotate-45 z-0"></div>
          
          <h4 className="absolute -top-4 bg-mutedBlue text-primary font-black px-6 py-2 rounded-full text-sm uppercase tracking-widest shadow-md">
             {title}
          </h4>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium leading-relaxed tracking-wide text-light z-10 whitespace-pre-line drop-shadow-md mt-4">
            {storyText}
          </h2>

          {/* Feedback Overlay */}
          {!!feedback && (
            <div className="absolute -bottom-6 flex items-center space-x-2 bg-tealAccent px-8 py-3 rounded-full border border-tealAccent/30 shadow-xl z-30 animate-in slide-in-from-bottom-2 duration-300">
              <SparklesIcon />
              <span className="text-primary font-bold text-sm sm:text-base tracking-wide">
                {feedback}
              </span>
            </div>
          )}
        </div>
        
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-mutedBlue/50 to-transparent"></div>
      </div>
    </div>
  );
}