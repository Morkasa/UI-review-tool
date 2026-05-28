# Morkasa 对稿画布

一个用于比对设计稿和线上稿的 React 工具。界面默认中文，右上角支持 `中文 / EN` 切换。

## 功能

- 左右双画布：左侧放设计稿，右侧放线上稿。
- 两侧都支持上传截图。
- 线上稿支持输入 URL 预览，前提是目标站点允许被 iframe 嵌入。
- 支持桌面、平板、手机三种视口。
- 支持共享缩放和对齐参考线。
- 差异队列覆盖字体、间距、颜色、布局参数。
- 支持复制 Markdown 报告和导出 JSON。
- 暗色工具界面，主色使用 Morkasa 品牌蓝 `#002FA7`。

## 设计系统

- `DESIGN.md` 记录暗色画布方向和组件规则。
- `design-tokens.json` 是颜色、间距、圆角、字体和阴影的 token 来源。
- `design-preview.html` 是独立的 token 预览页。

## 本地开发

```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:5173/`。

## 验证

```bash
npm run build
npm audit
```
