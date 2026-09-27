# 交互式回忆绘本（Memory Book）— 实现计划

## Context

目标是复刻参考视频（TypingMind 展示的 "a spring trip / New Zealand" 绘本）的翻书体验，但产品形态和原始提示词有几处不同（已向用户确认）：

| 维度 | 原提示词 | 用户实际需求 |
|---|---|---|
| 内容 | 插画 | **照片 + 插画混合**（比例各异，需裁切/焦点处理） |
| 制作方式 | 改 `book.ts` 配置 | **网页里上传图片，并直接在书上所见即所得编辑** |
| 语言 | 英文 | **中文**（中文衬线 / 手写字体） |
| 用途 | 展示 | **部署后分享链接 + 自己看 + 送给特定的人** |
| 分享 | 无 | **导出静态站点包（部署到 Vercel/Netlify）+ 导出单 HTML 文件** |
| 风格 | 单一 | **多主题，每个主题有成熟预设；整本书选主题 + 单页微调**。首批：`暖白插画绘本`、`胶片/拍立得` |
| 情感元素 | 无 | **献词页/信件页、背景音乐（用户自己上传）、翻页音效、日期/地点印章** |
| 优先级 | — | **阅读体验优先**，编辑器在阅读体验成熟后再做 |

项目目录 `D:\Claude_projects\04_相册` 目前是空的，从零搭建。无 AGENTS.md，不涉及任务分工规则。

---

## Phase 0：参考分析（写入仓库 `IMPLEMENTATION_PLAN.md`）

从 9 帧参考（0–21s）得到的结论，实施时写成正式文档：

1. **页面组成**：左上极小品牌字 + 页面正中一本书 + 书下方一行小斜体 caption + 书右下角倾斜拍立得 + 左下极小署名。其余全是留白。
2. **比例**：闭合书约 5:6 竖向（单页宽高比 ≈ 0.83）；打开后双页 ≈ 1.67:1。书宽约占视口 ~50%，高 ~70%。
3. **切换方式**：封面 → 打开时书从"居中的单页"平移成"居中的双页"；翻页从右上角掀起，卷曲可见下一页；最后合上回到封底居中。
4. **动画**：每页约 2.6s 节奏，翻页本身约 0.8–1s，ease-in-out，无回弹。
5. **色彩**：背景近白 `#FBFAF7`；纸 `#F4EFE6` 附近；插画高饱和但纸张克制。
6. **字体**：封面/扉页小号衬线小写（"i drew the places…"），caption 为极小斜体衬线。
7. **阴影**：书底环境阴影（大而淡）+ 书脊中缝渐变 + 翻页折痕动态阴影；拍立得有独立小阴影。
8. **交互**：点击/拖角翻页，右上角出现翻角提示。
9. **最影响还原度的细节**：①跨双页的整幅图（一张图横跨左右页，书脊阴影压在图上）②开合时书的居中平移 ③页面顶部撕纸边 + 小星星/小飞机装饰 ④caption 在书外 ⑤大面积留白与书的尺寸比例。

---

## 技术选型

- **React 18 + TypeScript + Vite**，**CSS Modules** + 全局 CSS 变量（主题 token）。不用 Tailwind。
- **翻页：`page-flip`（StPageFlip）直接使用**，自己写一层薄 React 封装（不用 `react-pageflip`，它在 React 重渲染时会与库移动 DOM 冲突）。封装方式：为每页创建稳定的容器 div 交给 StPageFlip，内容用 `createPortal` 渲染进去；页数变化时 `destroy` 后重建并恢复到当前页。
- **存储**：`idb`（IndexedDB）保存书的 JSON 和图片 Blob。
- **图片处理**：上传时 `createImageBitmap` + canvas 压成 webp（长边 ≤ 2560，另存 480px 缩略图给拍立得预览）；`exifr` 读取拍摄日期/GPS 自动填日期印章。
- **导出**：`jszip`（静态包）、`vite-plugin-singlefile`（单 HTML 模板）。
- **中文字体**：Noto Serif SC（Google Fonts，自动按 unicode-range 切片）+ 霞鹜文楷 `lxgw-wenkai-webfont`（jsDelivr）做手写感 caption。英文数字用 Cormorant Garamond。
- **声音**：翻页音效用 Web Audio 合成（滤波白噪声包络，无需素材文件，主题可覆盖）；背景音乐用 `HTMLAudioElement`，默认关闭，在"打开书"的用户手势中才开始播放。
- **不使用** Framer Motion（开合平移用 CSS transition/WAAPI 足够，减少依赖）。

---

## 工程结构

```
src/
  app/            App.tsx, routes（/ 编辑器首页, /read/:id 阅读, viewer 入口）
  viewer-main.tsx # 导出用的纯阅读器入口（不含编辑器代码）
  components/
    Book/         Book.tsx（舞台+尺寸+开合平移）, PageFlip.tsx（StPageFlip 封装）,
                  BookPage.tsx, BookCover.tsx, BackCover.tsx, Spine.tsx
    layouts/      FullSpread, SinglePhoto, PolaroidPage, TextPage, TitlePage, DedicationPage, LetterPage
    Caption/      书外 caption（随当前 spread 淡入淡出）
    PhotoPreview/ 右下角拍立得（下一页预览，点击翻页）
    Stamp/        日期/地点印章
    AudioControls/ 极小的音乐开关
    Editor/       （Phase 3）EditOverlay, PageStrip, ImageDropzone, InlineText, ThemePicker, PageOptions
  themes/         types.ts, storybook/, film/（token + 装饰组件 + 封面 + caption/拍立得样式 + 音效参数）
  data/           schema.ts（类型）, sampleBook.ts（内置示例书）, buildPages.ts（spread → 物理页）
  hooks/          useBookMachine.ts, useBookNavigation.ts, useBookSize.ts, usePreload.ts, useFlipSound.ts
  storage/        db.ts（IndexedDB）, assets.ts（Blob ↔ objectURL）
  export/         exportZip.ts, exportSingleHtml.ts
  styles/         global.css, paper.css（纹理、阴影）
public/assets/book/  示例书图片（cover.webp, page-01.webp …）
```

---

## 数据结构（`src/data/schema.ts`）

```ts
BookDoc {
  id, version, themeId: 'storybook' | 'film',
  meta: { title, subtitle, author, dateRange, dedication?, letter?, closingLine },
  cover: { image?: AssetRef, decor: DecorPreset },
  music?: AssetRef, sound: { flip: boolean },
  spreads: Spread[]
}
Spread {
  id, layout: 'full-spread' | 'two-pages' | 'single-photo' | 'polaroid' | 'text',
  images: { asset: AssetRef, focal: {x,y}, alt }[],
  caption, stamp?: { date?, place? },
  overrides?: { decor?, captionStyle?, paperTone? }   // 单页微调，缺省用主题预设
}
AssetRef = { id, kind: 'idb' | 'url' | 'inline' }     // 编辑器用 idb，导出后变 url/inline
```

`buildPages(book, orientation)` 把逻辑 spread 转成物理页序列：
`[封面(hard)] [扉页左, 扉页右] [献词] [故事 spreads…] [信件] [结尾页 "下次见"] [封底(hard)]`，保证总页数为偶数（1 + 2n + 1）。
- `full-spread`：同一张图渲染到左右两页，各显示一半（`width:200%` + 偏移），书脊阴影叠在图上 —— 还原参考的关键。
- 移动端竖屏：每个 spread 折叠成 1 页（整幅图按焦点裁切适配单页），切换横竖屏时重建并换算到对应 spread。

---

## 书本生命周期状态机（`useBookMachine.ts`）

`closed → opening → reading ⇄ flipping → closing → closed`（外加 `ended`：合上后显示封底，可点击重新打开）

- 所有输入（点击、键盘、拍立得、拖拽）经 `useBookNavigation` 进入，**只在 `reading` 态接受**；`flipping` 期间丢弃（不排队，避免连击后连翻）。
- 由 StPageFlip 的 `changeState`（`user_fold` / `flipping` / `read`）和 `flip` 事件驱动状态转换；另加超时兜底（flippingTime + 300ms）防止卡在 `flipping`。
- 开合：封面在 index 0 时书容器 `translateX(-25%)`，封底 `translateX(+25%)`，打开/合上时与翻页同步过渡到 0，实现"闭合书居中 → 双页居中"。
- `resize` 发生在翻页中：延迟到 `read` 后再 `update()`。

---

## 视觉实现要点

- **纸张**：主题色 `#F4EFE6`/`#F7F3EA` + 内联 SVG `feTurbulence` 噪点 data-URI（opacity ≈ 0.04–0.06）+ 极轻的边缘泛黄 radial 渐变。
- **三层阴影**：①书底环境阴影：多层 box-shadow（近处实 + 远处大模糊）+ 书下方椭圆模糊投影 ②书脊：中缝左右各一条线性渐变（深→透明）+ 中线高光 ③翻页动态阴影：StPageFlip `drawShadow` + `maxShadowOpacity≈0.35`，再叠加折痕高光。
- **纸张厚度**：书左右边缘用 2–4 层错开的伪元素模拟页边，厚度随已读/未读页数变化。
- **翻页参数**：`flippingTime ≈ 900ms`，`showPageCorners` 开（悬停右上角掀起一角），`swipeDistance` 调小给触摸。reduced-motion：`flippingTime 350ms`、关闭角落预览，但保留翻页本身。
- **尺寸**（`useBookSize`）：单页比例 5:6；可用高 = 视口高 − 顶部 64px − caption 区 72px − 边距；页高 clamp 到 [360, 760]px，双页宽 ≤ 视口宽 − 2×48px；< 768px 宽切单页模式，16px 侧边距。
- **Caption / 拍立得** 在书外：caption 居中于书下方，切页时淡出淡入；拍立得在书右下角外侧，−6° 旋转、白边、独立阴影，显示下一 spread 的缩略图，点击翻页，悬停轻微摆正。
- **图片**：`object-fit: cover` + `object-position` 用焦点；所有 objectURL 启动时建立，当前 ±2 个 spread 用 `img.decode()` 预加载；加载前显示纸色占位 + 极淡纹理；失败时显示"图片无法加载"的铅笔字占位，不影响翻页。

### 两套主题预设
- **暖白插画绘本（storybook）**：米白纸、Noto Serif SC 小号扉页、霞鹜文楷斜体 caption、页顶撕纸边 + 小星星 + 小飞机虚线装饰、封面花朵 + 串珠 + 星星 SVG 装饰、白边拍立得、印章为淡色铅笔字。
- **胶片/拍立得（film）**：深色卡纸（#2B2724 类）、照片以拍立得/胶片框放置并有胶带、手写 caption、印章为橙红日期数码字（仿胶片日期戳）、封面为一张贴着的拍立得 + 手写标题。
- 单页 overrides 只允许在主题预设内选（装饰开/关/变体、caption 风格、纸色调），保证不会搭配出难看的组合。

---

## 分阶段实施

### Phase 1 — 原型（验证核心翻书体验）
1. Vite + React + TS 脚手架，安装 `page-flip`。
2. `PageFlip` 封装 + `useBookMachine` + `useBookNavigation`（点击左右、拖拽、键盘 ←/→、触摸滑动、输入锁）。
3. storybook 主题基础版；`sampleBook.ts` 内置示例：封面 → 扉页（"一次春天的旅行 / 新西兰"）→ 3 个故事 spread → 结尾页 → 封底。示例图先用我生成的扁平 SVG 占位插画（后续换成用户的图）。
4. 开书/合书居中平移。
- 自检：翻页流畅、连击不乱、首页/末页边界正确，能合上。

### Phase 2 — 打磨（达到可发布质量）
纸纹理、三层阴影、书脊、页边厚度、撕纸边装饰、caption、拍立得预览、图片预加载与失败占位、响应式 + 移动端单页模式、翻页音效、reduced-motion、日期/地点印章、献词页、信件页。每一步用浏览器面板截图对照参考。

### Phase 3 — 编辑器（所见即所得）+ 第二主题
- IndexedDB 存储，首页列出本地的书（"新建一本书"）。
- 编辑模式：书冻结拖拽（重建 StPageFlip 时 `useMouseEvents:false`），只用箭头/底部缩略图条翻页。
  - 点击图片 → 替换 / 拖动设置焦点；拖入图片到页面直接放置。
  - 点击 caption、标题、献词、信件 → `contentEditable` 原位编辑。
  - 底部细长缩略图条：拖拽排序 spread、增删页、选 layout。
  - 右上角极简浮动工具：主题切换、当前页微调（装饰/caption 风格/纸色调）、上传背景音乐、翻页音效开关。
- 批量上传：按 EXIF 拍摄时间自动排序并生成 spread，自动填日期印章。
- 实现 film 主题。

### Phase 4 — 导出与部署
- **静态站点包**：`vite build` 额外产出 `viewer/`（只含阅读器）。导出时编辑器 fetch 这些文件 + `book.json` + `assets/*.webp` + 音乐 → JSZip 下载；解压后拖到 Netlify Drop / Vercel 即得链接。附 `README.txt` 说明部署步骤。
- **单 HTML**：`vite-plugin-singlefile` 产出 `viewer-single.html` 模板，导出时把书 JSON 和 base64 图片/音乐注入 `<script type="application/json">`。导出前提示文件大小；字体仍走 CDN（中文字体无法内嵌）。
- 编辑器本身部署到 Vercel（部署前征求用户同意）。

### Phase 5 — QA
用 Playwright + 浏览器面板在以下场景截图与交互测试，并修复问题：1920×1080、1600×900、1366×768、平板 768×1024、手机 375×812（竖/横）、窗口缩放、翻页中 resize、快速连击 20 次、首页后退、末页前进、合书后重开、图片加载失败、无音乐/有音乐、reduced-motion、导出包离线打开、单 HTML 打开。每阶段结束都按"能否在 Product Hunt 展示"的标准自审一次。

---

## 验证方式

- `npm run dev` 后用内置浏览器面板打开，逐项操作：开书 → 翻到末页 → 合书 → 重开；键盘、拖拽、点击拍立得。
- `resize_window` 切换上述尺寸，截图检查书是否居中、无裁切、无横向滚动。
- JS 注入连续触发 `flipNext()` 20 次，检查状态机最终为 `reading` 且页码正确。
- 导出 zip 解压后用 `npx serve` 打开；单 HTML 直接双击打开，确认图片/音乐/翻页全部正常。
- `npm run build` 无 TS 错误。

---

## 进度（2026-09-27）

| 阶段 | 状态 | 备注 |
|---|---|---|
| Phase 0 参考分析 | ✅ | 见上文 |
| Phase 1 原型 | ✅ | 开书 → 扉页 → 3 个故事跨页 → 合书；状态机、点击 / 拖拽 / 键盘 / 触摸 |
| Phase 2 打磨 | ✅ | 纸纹、三层阴影、书脊、页边厚度、撕纸边、caption、拍立得、预加载、失败占位、移动端单页、翻页声、reduced-motion |
| Phase 3 编辑器 + 胶片主题 | ✅ | IndexedDB、书架、原位编辑、拖动取景、小图条排序、撤销、音乐、献词 / 信开关、EXIF 排序与日期 |
| Phase 4 导出 | ✅ | zip（可双击离线打开）/ 单 html；字体按用字挑选切片（示例约 46 片） |
| Phase 5 QA | ✅ | 1920×1080、1600×900、1366×768、768×1024、390/375 手机；连击 20 次、翻页中缩放、横竖切换、半拖回弹、图片失败、生产构建端到端 |
| 部署 | ⏳ | 待确认 |

与原计划的偏差：
- 翻页库改为把 StPageFlip 源码放入 `src/vendor/page-flip` 并修补（见 README），而不是直接依赖 npm 包。
- 字体全部自托管（Google Fonts 在国内不稳定，且导出需离线可用）。
- 新增"实拍照片"：每个跨页可附一张真实照片，显示为书旁的拍立得（无则预览下一页）。
