"use client";

/**
 * Global error boundary — replaces the root layout when the app itself crashes.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FDFBF7", // cream
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{
          background: "#FFFFFF",
          padding: "40px",
          borderRadius: "48px",
          border: "4px solid #1E3A8A",
          boxShadow: "0 20px 60px rgba(30,58,138,0.1)",
          maxWidth: "400px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          alignItems: "center"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            background: "#FF2A85", // hot-pink
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 30px rgba(255,42,133,0.3)"
          }}>
            <span style={{ fontSize: "40px", color: "#FFFFFF" }}>⚠️</span>
          </div>
          
          <h1 style={{ fontSize: "32px", color: "#1E3A8A", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
            Critical Glitch
          </h1>
          
          <p style={{ fontSize: "18px", color: "rgba(30,58,138,0.7)", margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
            Accra pulsates, but your connection flickered. Let's get you back in the game.
          </p>
          
          <button
            onClick={reset}
            style={{
              background: "#39FF14", // lime
              color: "#1E3A8A", // navy
              border: "4px solid #FFFFFF",
              borderRadius: "9999px",
              padding: "16px 32px",
              fontSize: "18px",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 10px 30px rgba(57,255,20,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              width: "100%"
            }}
          >
            Retry Connection
          </button>
        </div>
      </body>
    </html>
  );
}
