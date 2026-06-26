/* Studio — right parameter panel */
function ParamPanel({ params, setParam, cost, spirit, onGenerate, generating }) {
  const { Tag, SegmentedControl, Switch, Select, Button } = window.LingjiForgeDesignSystem_e6d384;
  const cfg = window.__lf.raw("studio.params");
  const isEn = window.__lf.lang === "en";
  const pick = (list) =>
    list.map((item) => {
      if (Array.isArray(item)) {
        const value = item[0];
        const label = isEn ? item[1] : item[0];
        return { value, label };
      }
      return { value: item, label: item };
    });
  const normalizeOptions = (opts) => opts.map((item) => {
    if (item && typeof item === "object" && !Array.isArray(item) && Object.prototype.hasOwnProperty.call(item, "value")) {
      return item;
    }
    return pick([item])[0];
  });

  const Group = ({ label, children }) => (
    <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid var(--divider)" }}>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 11 }}>{label}</div>
      {children}
    </div>
  );
  const chips = (key, opts) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {normalizeOptions(opts).map(({ value, label }) => <Tag key={value} selected={params[key] === value} onClick={() => setParam(key, value)}>{label}</Tag>)}
    </div>
  );

  return (
    <aside className="lf-scroll" style={{
      width: "var(--studio-param-w)", flex: "none", borderLeft: "1px solid var(--border-subtle)",
      background: "var(--bg-base)", display: "flex", flexDirection: "column",
    }}>
      <div className="lf-scroll" style={{ flex: 1, overflowY: "auto", padding: 18 }}>
        <Group label={cfg.labels.genre}>
          {chips("genre", pick(cfg.options.genre))}
        </Group>
        <Group label={cfg.labels.style}>
          {chips("style", cfg.options.style)}
        </Group>
        <Group label={cfg.labels.view}>
          {chips("view", cfg.options.view)}
        </Group>
        <Group label={cfg.labels.action}>
          {chips("action", cfg.options.action)}
        </Group>
        <Group label={cfg.labels.size}>
          <SegmentedControl size="sm" options={cfg.options.size} value={params.size} onChange={(v) => setParam("size", v)} />
        </Group>
        <Group label={cfg.labels.usage}>
          <Select value={params.usage} onChange={(e) => setParam("usage", e.target.value)}>
            {cfg.options.usage.map((item) => <option key={item}>{item}</option>)}
          </Select>
        </Group>
        <Group label={cfg.labels.format}>
          {chips("format", cfg.options.format)}
        </Group>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-secondary)" }}>{cfg.labels.lock}</span>
            <Switch checked={params.lock} onChange={(v) => setParam("lock", v)} />
          </label>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-secondary)" }}>{cfg.labels.batch}</span>
            <Switch checked={params.batch} onChange={(v) => setParam("batch", v)} />
          </label>
        </div>
      </div>

      {/* sticky generate footer */}
      <div style={{ padding: 16, borderTop: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>
          <span>{cfg.labels.footerTipPrefix}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", color: "var(--gold-200)" }}>
            <span style={{ width: 10, height: 10, background: "linear-gradient(135deg,var(--gold-300),var(--gold-600))", transform: "rotate(45deg)", borderRadius: 1, boxShadow: "var(--glow-spirit)" }} />{cost} {window.__lf.t("app.reward")}
          </span>
        </div>
        <Button variant="gold" full size="lg" loading={generating} onClick={onGenerate}
          icon={!generating && <i data-lucide="wand-sparkles" style={{ width: 17, height: 17 }} />}>
          {generating ? cfg.buttons.generateLoading : cfg.buttons.generate}
        </Button>
        <div style={{ textAlign: "center", marginTop: 9, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>
          {cfg.labels.footerBalancePrefix} {spirit} {window.__lf.t("app.reward")} · {spirit < cost ? cfg.labels.insufficientHint : cfg.labels.affordableHint.replace("{count}", Math.floor(spirit / cost).toString())}
        </div>
      </div>
    </aside>
  );
}
Object.assign(window, { ParamPanel });
