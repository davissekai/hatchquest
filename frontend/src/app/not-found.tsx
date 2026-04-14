export default function NotFound() {
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--c-canvas)",
      padding: "20px",
    }}>
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: "48px",
        color: "var(--c-navy)",
        marginBottom: "16px",
      }}>
        404
      </h1>
      <p style={{
        fontFamily: "var(--font-body)",
        fontSize: "16px",
        color: "var(--c-navy)",
        opacity: 0.7,
      }}>
        This page was not found.
      </p>
    </div>
  );
}