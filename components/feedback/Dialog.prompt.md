Centered modal (used by 看广告领取灵石 / 灵石不足 / confirmations).

```jsx
<Dialog title="看广告领取灵石" onClose={close}
  footer={<><Button variant="ghost" onClick={close}>暂不领取</Button><Button onClick={watch}>观看广告</Button></>}>
  完整观看一条广告，可获得 5 灵石。
</Dialog>
```
