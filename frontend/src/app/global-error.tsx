"use client";

/**
 * Global error boundary — replaces the root layout when the app itself crashes.
 * Must include its own <html> and <body> tags.
 * This also satisfies Next.js's build-time prerender of the /500 static page,
 * preventing the "Objects are not valid as a React child" error that occurs when
 * the root layout (with its client Providers boundary) is used for error prerendering.
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
          background: "#f5f3ff",
          fontFamily: "system-ui, sans-serif",
          padding: "20px",
          gap: "16px",
        }}
      >
        <h1 style={{ fontSize: "24px", color: "#1a0078", margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: "14px", color: "#555", margin: 0 }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#5250b3",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
