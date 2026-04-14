export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{
      borderTop: "1px solid rgba(0,200,255,0.08)",
      padding: "20px 32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
      marginTop: "auto",
    }}>
      <p style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10,
        letterSpacing: 3,
        color: "rgba(0,200,255,0.3)",
      }}>
        © {year} JARVIS INTERVIEW PLATFORM. ALL RIGHTS RESERVED.
      </p>
      <p style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10,
        letterSpacing: 2,
        color: "rgba(0,200,255,0.2)",
      }}>
        POWERED BY AI · BUILT WITH REACT
      </p>
    </footer>
  );
}