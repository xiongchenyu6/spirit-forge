The 创作台 Prompt box — multi-line description + gold 开始生成 button showing its 灵石 cost.

```jsx
<PromptInput
  value={text} onChange={e => setText(e.target.value)}
  cost={6} onGenerate={run}
  footer={<>国风像素风 · 8方向 · 透明背景</>}
/>
```
