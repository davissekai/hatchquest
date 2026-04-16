import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#FDFBF7", // cream
      padding: "24px",
      textAlign: "center",
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    }}>
      <div style={{
        background: "#FFFFFF",
        padding: "48px",
        borderRadius: "64px",
        border: "8px solid #1E3A8A", // navy
        boxShadow: "0 30px 80px rgba(30,58,138,0.15)",
        maxWidth: "450px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        alignItems: "center",
        transform: "rotate(-2deg)"
      }}>
        <div style={{
          fontSize: "120px",
          fontWeight: 900,
          color: "#FF2A85", // hot-pink
          lineHeight: 1,
          letterSpacing: "-0.05em",
          fontStyle: "italic",
          textShadow: "4px 4px 0px #1E3A8A"
        }}>
          404
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h1 style={{ fontSize: "28px", color: "#1E3A8A", fontWeight: 900, margin: 0 }}>
            Wrong District.
          </h1>
          <p style={{ fontSize: "18px", color: "rgba(30,58,138,0.6)", margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
            This alleyway doesn&apos;t exist in Accra. Let&apos;s get you back to the main street.
          </p>
        </div>

        <Link
          href="/"
          style={{
            background: "#00F0FF", // electric-cyan
            color: "#1E3A8A", // navy
            border: "4px solid #FFFFFF",
            borderRadius: "9999px",
            padding: "16px 40px",
            fontSize: "20px",
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "0 10px 30px rgba(0,240,255,0.3)",
            textDecoration: "none",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            transition: "all 0.3s ease"
          }}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
