/* Landing — shared bits: icon helper, decorative emblem, section heading, AssetTile.
 * Exported to window for sibling babel scripts. */

const LFIcon = ({ name, size = 18, color, style = {} }) =>
  React.createElement("i", { "data-lucide": name, style: { width: size, height: size, color, ...style } });

const generatedAssetPath = (file) => `../../assets/generated/official/${file}`;

function SectionHead({ kicker, title, sub, align = "center" }) {
  return (
    <div style={{ textAlign: align, maxWidth: 720, margin: align === "center" ? "0 auto" : 0 }}>
      {kicker && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, background: "var(--gold-400)", transform: "rotate(45deg)", boxShadow: "var(--glow-spirit)" }} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, letterSpacing: "var(--tracking-wider)", color: "var(--gold-300)", textTransform: "uppercase" }}>{kicker}</span>
        </div>
      )}
      <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 40, lineHeight: 1.2, color: "var(--text-primary)", margin: 0, letterSpacing: "var(--tracking-tight)" }}>{title}</h2>
      {sub && <p style={{ fontFamily: "var(--font-sans)", fontSize: 16, lineHeight: 1.7, color: "var(--text-secondary)", margin: "16px auto 0", maxWidth: 640 }}>{sub}</p>}
    </div>
  );
}

function AssetTile({ genre, sub, icon, from, to, glow, tags = [], size, large = false, image }) {
  const imageSrc = image
    ? image.includes("/") ? image : generatedAssetPath(image)
    : "";
  return (
    <div style={{
      position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden",
      border: "1px solid var(--border-subtle)", background: "var(--surface-card)",
      aspectRatio: large ? "16 / 10" : "3 / 4", minHeight: large ? 220 : 0,
      cursor: "pointer", transition: "transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.boxShadow = "var(--shadow-panel)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {imageSrc ? (
        <>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%), rgba(2,6,10,0.82)",
            backgroundSize: "18px 18px",
            backgroundPosition: "0 0, 0 9px",
          }} />
          <img src={imageSrc} alt={genre} loading="lazy" style={{
            position: "absolute", inset: large ? "14px 18px 82px" : "12px 12px 72px",
            width: `calc(100% - ${large ? 36 : 24}px)`,
            height: `calc(100% - ${large ? 96 : 84}px)`,
            objectFit: "contain",
            imageRendering: "pixelated",
            filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.38))",
          }} />
          <span style={{ position: "absolute", top: 8, left: 8, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--jade-200)", background: "rgba(7,9,11,0.74)", border: "1px solid rgba(90,218,178,0.28)", borderRadius: "var(--radius-sm)", padding: "2px 7px" }}>AI TEST OUTPUT</span>
        </>
      ) : (
        <>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% 18%, ${from}, ${to} 70%)` }} />
          <div style={{ position: "absolute", inset: 0, background: "repeating-radial-gradient(circle at 50% 35%, transparent 0 26px, rgba(255,255,255,0.03) 26px 27px)", opacity: 0.5 }} />
          <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", color: "rgba(255,255,255,0.92)", filter: `drop-shadow(0 0 18px ${glow})` }}>
            <i data-lucide={icon} style={{ width: large ? 64 : 46, height: large ? 64 : 46 }} />
          </div>
          <span style={{ position: "absolute", top: 8, left: 8, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", background: "rgba(7,9,11,0.74)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "2px 7px" }}>NEXT TEST</span>
        </>
      )}
      {/* bottom plate */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: large ? 18 : 13, background: "linear-gradient(to top, rgba(7,9,11,0.92), rgba(7,9,11,0.55) 60%, transparent)" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: large ? 20 : 15, color: "#fff", letterSpacing: "var(--tracking-tight)" }}>{genre}</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: large ? 13 : 11, color: "rgba(244,241,232,0.7)", marginTop: 3 }}>{sub}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 9 }}>
          {tags.map((t) => (
            <span key={t} style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--gold-200)", background: "rgba(201,163,91,0.16)", border: "1px solid rgba(201,163,91,0.3)", borderRadius: "var(--radius-sm)", padding: "2px 7px" }}>{t}</span>
          ))}
          {size && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(244,241,232,0.55)", padding: "2px 0", marginLeft: "auto" }}>{size}</span>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LFIcon, SectionHead, AssetTile, generatedAssetPath });
