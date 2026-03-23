"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

// The EnvelopeIcon component for the UI
const EnvelopeIcon = () => (
  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

// We need an inner component to safely use useSearchParams within Suspense
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";
  const [resendStatus, setResendStatus] = useState<"idle" | "sent">("idle");

  const handleResend = () => {
    // Mock the backend resend action
    setResendStatus("sent");
    // Reset status after a few seconds
    setTimeout(() => setResendStatus("idle"), 5000);
  };

  return (
    <div className="bg-light text-primary w-full max-w-md rounded-2xl shadow-2xl p-8 sm:p-10 border-t-4 border-tealAccent text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center border border-mutedBlue/20">
          <EnvelopeIcon />
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold mb-4">Verify Your Email</h2>
      
      <p className="text-primary/80 mb-6 leading-relaxed">
        We&apos;ve sent a verification link to <span className="font-bold text-tealAccent">{email}</span>. Please check your inbox to continue.
      </p>

      <div className="space-y-4">
        <Link 
          href="/startup-setup"
          className="block w-full bg-accent text-primary font-bold text-lg py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(217,155,0,0.39)] hover:shadow-[0_6px_20px_rgba(217,155,0,0.23)] hover:bg-[#ffb600] transition-all transform hover:-translate-y-0.5"
        >
          Simulate Email Verification
        </Link>
        
        <button 
          onClick={handleResend}
          disabled={resendStatus === "sent"}
          className={`w-full py-3 font-medium text-sm transition-colors rounded-xl border ${
            resendStatus === "sent" 
              ? "bg-green-50 text-green-700 border-green-200" 
              : "bg-transparent text-mutedBlue hover:text-primary hover:bg-primary/5 border-mutedBlue/30"
          }`}
        >
          {resendStatus === "sent" ? "Verification email sent again." : "Resend verification email"}
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-mutedBlue/20">
        <Link href="/auth/signin" className="text-sm font-bold text-tealAccent hover:text-primary transition-colors">
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <div className="min-h-screen bg-primary text-light flex flex-col items-center justify-center p-6 selection:bg-accent selection:text-primary">
      {/* Subtle background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[30%] h-[30%] bg-tealAccent blur-[100px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[25%] h-[25%] bg-mutedBlue blur-[80px] rounded-full"></div>
      </div>

      <div className="mb-8 text-center">
        <Link href="/" className="inline-block">
          <h1 className="text-4xl font-extrabold tracking-tight text-light hover:text-accent transition-colors drop-shadow-sm">
            HatchQuest
          </h1>
        </Link>
      </div>

      <Suspense fallback={<div className="text-light">Loading verification status...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
