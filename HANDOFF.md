# 回忆绘本 · 交接说明（2026-10-03）

给下一个对话窗口：先读这份，再按需看 `README.md`（功能、结构、脚本用法）。不要一上来遍历整个项目。

## 0. 当前状态（最重要）

- 本地 `main` 比 GitHub 多 **5 个提交，全部没推送**：
  - `56ad6fe` 离线 / HEIC / 直接生成视频（第三期收尾）
  - `1cd19d4` **修复编辑后不保存**（自动保存一直被跳过，刷新就丢改动；线上版本有这个 bug，建议尽快上线）
  - `352c8c9` 第四期一、二：主题音乐、语音留言、章节换歌、音乐 App 链接、自动放映、定时拆封、拆封问答、倾斜视差 / 震动
  - `3b539b1` 第四期三：会动的照片（短视频）
  - `a43cd4b` 第四期四：手写签名、导出 PDF
  - （之后还有一个文档提交：README / HANDOFF）
- **推送 `main` = 发布上线**（GitHub Pages 自动构建）。推送前必须问用户。
- 提交信息末尾加：`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。
- 只在电脑 Chrome（含手机模拟）上测过。**真机待验证**：iPhone 录音、语音自动播放、音乐淡入淡出（这次改成 Web Audio 才在 iPhone 上生效）、倾斜权限、低电量模式下的动态照片、安卓震动、微信里跳转音乐 App / 复制链接；以及上一期遗留的竖屏视频、iPhone 照片拍摄日期。
- 主题音乐的"好不好听"只做了响度 / 频谱检查，需要用户亲耳听（`sound-check` 会输出 11 个 wav）。

## 1. 项目是什么

- 目录：`D:\Claude_projects\04_相册`，React 19 + Vite 8 + TypeScript，纯前端、无后端。
- 产品："回忆绘本"——在浏览器里上传照片 / 插画，所见即所得地编辑一本可真实翻页的书，导出送人。中文界面；用户偏好中文。
- 第一至三期：11 套主题、8 种版式、编辑器、导出 zip / html、书桌场景、音效、滤镜、拆封、样书、离线、HEIC、直接生成视频。
- 第四期（本轮）：见 0 的提交列表和 README。

## 2. 仓库与上线

- GitHub：https://github.com/chengnuo19/photo （公开，`main`）。线上：https://chengnuo19.github.io/photo/ ，`.github/workflows/deploy.yml` 推送即发布，`BASE_PATH=/photo/`。
- 用户访问 github.io 很慢。国内镜像费用已向用户说明（备案约一两百元 / 年；香港轻量服务器免备案），**用户还没决定**。

## 3. 第四期的关键设计

- **数据版本 2**：`src/data/migrate.ts` 的 `migrateDoc` 在所有入口调用（`db.ts` 读书、`backup.ts` 恢复、`viewer-main.tsx`）。v1 的 `music: {src,title}` → `{kind:'file',…}`；没有 `music` = 主题音乐。`.mbook` 备份也是版本 2。新增资源字段（语音、章节音乐、视频）都已登记在 `db.ts` 的 `forEachSrc` / `mapSrcs`——**以后再加资源字段，两处都要改**。
- **声音**：
  - `sound/engine.ts`：一个 AudioContext，`audio()` 返回 `{ctx, noise, sfx, music}` 两条总线；创建时设 `navigator.audioSession.type='playback'`（iPhone 静音键下也出声）。
  - `sound/score.ts`：主题配乐 = `Score {loop, bar(k), bed, level, wet}`；乐器（piano / musicBox / celesta / harp / pizz / bass / chip / synth / pad）、环境声（rain / wind / hearth / cicadas / hiss / projector / room）、偶发音（crackles / chimes / birds / crickets / thunder）；带混响和限幅。实时用提前 3.5 秒的调度器，离线用 `renderScore`。各主题在 `themes/<id>/music.ts`，挂在 `scene.tsx` 的 `xxxSound.music`。响度目标约 −20 dBFS（`sound-check` 校准过）。
  - `sound/music.ts` `BookAudio`：按"段"（整本书 'book' + 有音乐的章节 spread id）交叉淡变、结尾淡出、语音时压低到 0.16、静音开关。歌曲用 `<audio>` 经 `MediaElementSource` 接入；**`file://` 打开的导出书不能接入（会静音），退回直接改元素音量**。iPhone 上后续切歌要在第一次手势时"解锁"每个元素（start() 里做了）。
  - `sound/sections.ts`：哪一页放哪段音乐（阅读和视频共用）。`sound/soundtrack.ts`：视频离线混音（分段音乐 + 翻页声 + 语音和压低）。
  - 语音：`sound/voice.ts` 录音 → 解码 → 用 mediabunny 编成 AAC `.m4a`（iPhone 能放）。
- **送礼**：`BookDoc.gift = {unwrap,to,from,unlockAt,quiz:{question,answers(加盐 FNV 散列),salt,hint},autoplay}`。`Unwrap.tsx` 先倒计时再问答；`preview`（应用内作者）可跳过，导出的书不能。
- **自动放映**：`components/Slideshow`，节奏在 `data/timing.ts`（和视频共用常量）。`BookHandle` 新增 `phase()`。
- **动态照片**：`BookImage.motion = {src, seconds}`，`src` 仍是静止画面（缩略图、视频、长图、PDF 都用它）。`storage/video.ts` 用 mediabunny Conversion 压成 ≤10 s、无声、长边 720 的 H.264；不能压缩时保留 ≤20 MB 原文件。`PageImage` 里的 `Clip` 用 IntersectionObserver 播放 / 暂停；`MotionContext=false`（press 里）只用静止画面。
- **签名**：`Letter.signature = {d,w,h}`（SVG 路径），`components/Signature`；画板用 portal 挂在 body 上（编辑器选项栏有 transform，会让 fixed 定位失效）。
- **PDF**：`export/pdf/writer.ts`（每页一张 JPEG 的极简 PDF）、`makePdf.ts`（home：A4 横向 200 dpi；print：单页 300 dpi + 3 mm 出血 + TrimBox，内页 / 封面两个 PDF + 说明打成 zip）。入口：录制页 `#/book/:id/record/pdf`。复用 `film.ts` 导出的 `snapper`。

## 4. 必须知道的约定 / 坑

- 翻页引擎在 `src/vendor/page-flip`（本地修改标 `MB:`），不要装 npm 包。
- 渲染书的新代码要先 `await loadBookThemes(doc)`（或 `useThemes`）。
- modern-screenshot 两个坑（内联 SVG 的 `url(#id)`、单拍绝对定位字幕会空白）已在 film 里处理，PDF 复用同一套。
- **导出模板** `public/viewer/viewer.html` 由 `npm run build:viewer` 生成（gitignore）。用 `npx vite --port 5174`（launch.json 的 `memory-book-alt`）时**不会自动重建**——测导出前先 `npm run build:viewer`（music / gift / motion 脚本默认会做）。
- 在开发服务器里改过的模块，Vite 会给 URL 加 `?t=`；测试脚本里 `import('/src/…')` 会拿到**另一个模块实例**（另一个 AudioContext）。要用 `performance.getEntriesByType('resource')` 找到应用实际加载的 URL（见 music-check）。
- AnalyserNode 测电平时把 `smoothingTimeConstant` 设成 0，否则多次读取会互相平均。
- 端口：5173 常被别的对话占用，用 5174；脚本加 `BASE=http://localhost:5174/`。offline-check 用 4179，**失败时可能留下 `vite preview` 进程**，下次会报 "server did not stop"——先关掉那个进程。
- Git Bash 的长 heredoc 里有 `×`、`→` 等字符时会解析失败：把补丁脚本写成文件再运行。
- Windows 上 Git Bash 会改写 `/photo/` 参数，加 `MSYS_NO_PATHCONV=1`。
- PDF 校验工具：TeX Live 自带 `pdfinfo` / `pdfimages`（`/e/texlive/2026/bin/windows`，需加进 PATH）。

## 5. 测试脚本（用法见 README）

旧的：`e2e-editor`、`e2e-safety`、`record-check`、`film-check`、`heic-check`、`offline-check`、`flaky-images` 及各种截图拼板。
新的：`sound-check`（主题配乐响度）、`music-check`、`gift-check`、`motion-check`、`pdf-check`。本轮最后一次全部通过。

## 6. 待办 / 可以接着做的

- 【等用户】推送上线（至少 `1cd19d4` 自动保存修复），然后真机验证（见 0）。
- 【等用户】试听 11 个主题配乐，不喜欢的再调（`themes/<id>/music.ts`）。
- 【等用户】国内镜像。
- 之前的建议里还没做的：推送前在 CI 里跑测试；首屏主 CSS 里 309 条 `@font-face`（约 106 KB gzip）拆到主题；`react-dom/server` 和 jszip 不要预缓存；`sw.js` 文件清单拆出去；iOS 持久存储引导和定期备份提醒；`og:image` 在微信里要备案域名 + 公众号。
- 第四期可以继续改进的：直接生成的视频里让动态照片也动起来（现在用静止画面）；PDF 的文字是图片（不能选中）；章节标题页现在复用"纯文字"版式；`actions/deploy-pages@v4` 的 Node 20 弃用警告。
