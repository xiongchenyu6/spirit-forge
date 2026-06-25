灵石 (spirit-stone) currency display — the gold gem + balance. Brand-specific; sits in the top bar.

```jsx
<SpiritStone count={128} onAdd={openAdModal} />
<SpiritStone count={2} low onAdd={openAdModal} />  {/* 灵石不足 */}
```

`onAdd` adds the "+" entry to watch an ad. `low` switches to cinnabar warning styling.
