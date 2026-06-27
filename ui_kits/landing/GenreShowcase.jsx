/* Landing — GenreShowcase: the critical "萬象/不止仙侠" diversity gallery */
function GenreShowcase() {
  const { SectionHead, AssetTile } = window;
  const section = window.__lf.raw("landing.genreShowcase", {
    kicker: "",
    title: "",
    sub: "",
    note: "",
    tiles: [],
  });

  return (
    <section data-official-showcase="landing" style={{ padding: "88px 40px", background: "var(--bg-base)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <SectionHead kicker={section.kicker} title={section.title} sub={section.sub} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 44 }}>
          {section.tiles.map((t) => <AssetTile key={t.genre} {...t} />)}
        </div>
        <p style={{ textAlign: "center", marginTop: 26, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>
          {section.note}
        </p>
      </div>
    </section>
  );
}
Object.assign(window, { GenreShowcase });
