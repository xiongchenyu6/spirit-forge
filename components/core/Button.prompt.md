Primary action button for 灵机阁 — gold is the main "开始生成 / 造物" action; use jade for secondary, ghost/outline for tertiary, danger sparingly.

```jsx
<Button variant="gold" size="lg" icon={<i data-lucide="sparkles" />}>开始生成</Button>
<Button variant="jade">看广告领取灵石</Button>
<Button variant="ghost" size="sm">重新推演</Button>
```

Variants: `gold` (primary, gradient fill + glow on hover), `jade` (translucent teal), `outline`, `ghost`, `danger`. Sizes `sm | md | lg`. Props: `icon`, `iconRight`, `loading`, `full`, `disabled`. Press gives a subtle shrink; never bounces.
