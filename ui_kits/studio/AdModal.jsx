/* Studio — Ad reward modal (广告激励弹窗). States: prompt → playing → done */
function AdRewardModal({ open, onClose, onReward, insufficient = false, remaining = 3 }) {
  const { Button, RewardBurst } = window.LingjiForgeDesignSystem_e6d384;
  const m = window.__lf.raw("studio.modal");
  const [stage, setStage] = React.useState("prompt");
  const [pct, setPct] = React.useState(0);

  React.useEffect(() => { if (open) { setStage("prompt"); setPct(0); } }, [open]);
  React.useEffect(() => {
    if (stage !== "playing") return;
    const id = setInterval(() => setPct((p) => {
      if (p >= 100) { clearInterval(id); setStage("done"); if (onReward) onReward(5); return 100; }
      return p + 4;
    }), 70);
    return () => clearInterval(id);
  }, [stage]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "var(--ink-fog)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "lf-fade var(--dur-base) var(--ease-out)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 400, maxWidth: "100%", background: "var(--surface-card)", border: "1px solid var(--border-default)", clipPath: "var(--cut-corner)", boxShadow: "var(--shadow-modal), var(--glow-gold)", padding: 28, animation: "lf-rise var(--dur-slow) var(--ease-out)" }}>
        {stage === "prompt" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ width: 8, height: 8, background: "var(--gold-400)", transform: "rotate(45deg)", boxShadow: "var(--glow-spirit)" }} />
              <h3 style={{ margin: 0, fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 22, color: "var(--text-primary)" }}>{insufficient ? m.insufficientTitle : m.rewardTitle}</h3>
            </div>
            <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.7, color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: insufficient ? m.insufficientDesc : m.rewardDesc }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <Button variant="ghost" onClick={onClose}>{m.deny}</Button>
              <Button variant="gold" icon={<i data-lucide="clapperboard" style={{ width: 16, height: 16 }} />} onClick={() => setStage("playing")}>{m.watch}</Button>
            </div>
          </>
        )}
        {stage === "playing" && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ height: 132, borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, var(--ink-850), var(--ink-700))", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, position: "relative", overflow: "hidden" }}>
              <i data-lucide="play" style={{ width: 36, height: 36, color: "var(--text-muted)" }} />
              <span style={{ position: "absolute", top: 8, right: 10, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{window.__lf.t("studio.modal.playingHintSeconds", { seconds: Math.ceil((100 - pct) * 0.15) })}</span>
            </div>
            <div style={{ width: "100%", height: 6, background: "var(--surface-inset)", borderRadius: 999, overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
              <div style={{ width: pct + "%", height: "100%", background: "linear-gradient(90deg,var(--gold-500),var(--gold-300))", boxShadow: "var(--glow-gold)", transition: "width 70ms linear" }} />
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", marginTop: 14 }}>{m.playingHint}</p>
          </div>
        )}
        {stage === "done" && (
          <div style={{ textAlign: "center", padding: "4px 0" }}>
            <RewardBurst size={128} style={{ margin: "0 auto 8px", display: "block" }} />
            <h3 style={{ margin: 0, fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 26, color: "var(--gold-200)" }}>{m.doneTitle}</h3>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-secondary)", marginTop: 8 }}>{window.__lf.t("studio.modal.doneNote", { remaining })}</p>
            <div style={{ marginTop: 22 }}><Button variant="gold" full onClick={onClose}>{m.doneAction}</Button></div>
          </div>
        )}
      </div>
      <style>{`@keyframes lf-fade{from{opacity:0}}@keyframes lf-rise{from{opacity:0;transform:translateY(12px) scale(0.98)}}`}</style>
    </div>
  );
}
Object.assign(window, { AdRewardModal });
