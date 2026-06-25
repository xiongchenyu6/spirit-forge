Painterly 仙侠 circular orb icon from the brand set (`assets/icons/`). Use for category / asset-type / nav / currency icons — keep Lucide line icons for small functional UI (toolbar, chevrons, checks).

```jsx
// once per page:
window.LF_ICON_BASE = "../../";        // relative prefix to project root
<OrbIcon name="meditation" size={40} />          // 角色
<OrbIcon name="beast" framed active />            // 怪物 (selected)
<OrbIcon name="crystal" size={28} glow />         // 灵石
```

Names: emblem, crystal, scroll, censer, gourd, pagoda, sword, portal, scroll-bamboo, book, meditation, mountain, taiji, crane, starchart, pouch, talisman, gem, beast, shrine, brush, chest. `framed` adds a gold ring + inset; `active`/`glow` add emissive gold.
