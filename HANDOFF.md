# 回忆绘本 · 交接说明（2026-09-29）

给下一个对话窗口：先读这份，再按需看 `README.md`（功能、结构、脚本用法）和 `PLAN_V3.md`（第三期设计）。不要一上来遍历整个项目。

## 0. 当前状态（最重要）

- **2026-09-28 这一轮的改动全部还没提交、没推送**（工作区有大量 `M` / `??` 文件）。用户还没回复"要不要提交上线"。
- **推送 `main` = 发布上线**（GitHub Pages 自动构建）。提交 / 推送前必须先问用户。
- 提交信息末尾加：`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。
- 本轮只在电脑 Chrome（含手机模拟）上测过；**真 iPhone Safari / 安卓 / 微信内置浏览器都没测**。上线后建议让用户用手机实际做一次竖屏视频、导入一张 iPhone 照片。

## 1. 项目是什么

- 目录：`D:\Claude_projects\04_相册`，React 19 + Vite 8 + TypeScript，纯前端、无后端。
- 产品："回忆绘本"——在浏览器里上传照片 / 插画，所见即所得地编辑一本可真实翻页的书，导出送人。
- 中文界面；用户偏好用中文提问和汇报。
- 已完成三期：11 套主题（6 经典 + 5 影视：星期三 / 怪奇物语 / 宝可梦 / 吉卜力 / 魔法学院），8 种版式，编辑器，导出 zip / 单 html，书桌场景 + 彩蛋，WebAudio 主题音效，主题照片滤镜，送礼拆封，11 本样书（Unsplash 实拍照片，id 形如 `sample-journal`、`sample-stranger`、`sample-watercolor`）。

## 2. 仓库与上线

- GitHub：https://github.com/chengnuo19/photo （公开仓库，分支 `main`）。
- 线上：**https://chengnuo19.github.io/photo/** —— `.github/workflows/deploy.yml` 在推送 `main` 时自动构建发布（1–2 分钟）。
- 构建时 `BASE_PATH=/photo/`（`vite.config.ts` 读取，本地开发是 `/`）。
- 用户已确认：影视主题保留原作名字。
- 用户网络访问 github.io 很慢（约 16–50 KB/s）。国内镜像（腾讯云 / 阿里云）**用户尚未决定**。

## 3. 2026-09-28 这一轮做的事（未提交）

用户从优化建议里选了 1、2、4 三项：

### 3.1 离线 / PWA
- `src/sw/service-worker.js`：Service Worker 源码。`scripts/vite-sw.mjs`（+ `vite-sw.d.mts`）是 Vite 插件，构建结束后扫描 `dist/`，把"路径 → 内容哈希"清单和预缓存列表写在前面，生成 `dist/sw.js`。
  - `index.html`：网络优先，3 秒没响应或断网用本机缓存。
  - 清单里的文件：缓存优先，按内容哈希做 key（文件没变就不会重新下载）；上一个版本的文件保留一轮，避免更新时已打开的页面缺文件。
  - 其他请求（外站、Range 请求等）直接走网络。
- 预缓存约 1.4 MB（主程序 JS / CSS）。**不预缓存**：主题字体 CSS、`heic-to`、`mediabunny`、`modern-screenshot`、`viewer/`、`books/`（第一次用到才缓存）。
- `src/offline.ts`：只在生产环境注册（页面 load 后 2.5 秒）。Worker 接管后，页面把已加载资源的列表发给它补存（首访时的字体和图片）。
- `public/manifest.webmanifest` + `public/icons/*.png`（由 `scripts/make-icons.mjs` 生成），`index.html` 加了 manifest / apple-touch-icon。

### 3.2 HEIC 导入
- `src/storage/assets.ts`：`createImageBitmap` 失败时，按文件头 `ftyp` 判断是不是 HEIF / HEIC，是就懒加载 `heic-to`（约 750 KB gzip）解码，一次只解一张。新增 `IMAGE_ACCEPT`、`isImageFile`，用在书架、主题库和编辑器的选图 / 拖放。
- 拍摄日期仍用 exifr 读原文件。**用真 iPhone 照片读日期没验证过**：本地用 pillow-heif 生成的测试文件，EXIF 本身不合规。

### 3.3 不用录屏的翻书视频 / 长图（手机可用）
- `src/export/film/`：
  - `press.tsx`：离屏、透明地排好每一页和每条字幕，用的是和阅读器同一个 `PageFace` 组件（从 `Book.tsx` 抽出来的）。
  - `renderer.ts`：在画布上画书。虚拟屏幕：竖屏 414×736 → 1080×1920，横屏 1280×720 → 1920×1080。纸页翻页复用 vendor 里的 `FlipCalculation`，并照 HTML 渲染器画折叠阴影；封面是透视旋转（分 48 条竖条画）。
  - `film.ts`：时间线（开场停 1.2s、翻页 0.95s、每页停 2.6s）、`modern-screenshot` 页面拍照、离线混音（`sound/engine.ts` 新增的 `renderSoundtrack`）、`mediabunny` 用 WebCodecs 编码 H.264 + AAC 的 MP4（3 Mbps）；没有 WebCodecs 时退回实时录画布。`makeLongImage` 用同样的方法拼长图（带字幕）。
- `src/app/RecordPage.tsx`：电脑 Chrome / Edge 默认仍然录屏，多了"直接生成"入口；手机直接进入生成模式，可选竖屏 / 横屏，有进度条和取消；完成后显示预览、"保存 / 分享"（Web Share）和"下载文件"；在微信里会提示先"在浏览器打开"。
- 字体片段挑选从 `exportBook.ts` 抽到 `src/export/fontSlices.ts`，导出和视频共用。顺手修了：导出之前漏掉了故事页标题 / 正文的字形。

### 3.4 本轮验证结果
- `offline-check`：PASS（关掉服务器后书架 91 ms 打开，样书照片 0 张坏图）。
- `heic-check`：PASS（2 张 HEIC + 1 张 webp，尺寸正确，约 1.2 s）。
- `film-check`（watercolor / journal / stranger，桌面 + `--phone`）：PASS。竖屏 52 s / 20 MB，横屏 44 s / 16 MB，都有 AAC 音轨；抽帧目视检查了折页、封面开合、字幕。
- 回归测试：`record-check`（录屏视频 + 长图）、`e2e-editor`（含导出 zip / html）、`e2e-safety` 全部通过；`npm run build`（含 tsc）通过。

## 4. 必须知道的约定 / 坑

- **翻页引擎**在 `src/vendor/page-flip`（StPageFlip 2.0.7 源码），本地修改都标注 `MB:`。引擎的 bug 在这里修，不要装 npm 包。引擎在 `window` 上监听 `mousemove`，CSS `pointer-events` 挡不住。
- **主题是异步加载的**：任何渲染一本书的新代码，都要先 `await loadBookThemes(doc)`（或用 `useThemes`），否则会回退成 storybook 主题。
- **modern-screenshot 的两个坑**（都已在 `film.ts` / `press.tsx` 里处理）：
  1. 背景里的内联 SVG data URI 如果含 `url(#id)`（纸纹、水彩遮罩），库会把它当成外部文件去抓，导致整个背景失效（纸变透明、变黑）。解决：在 `onCloneEachNode` 里改写成 `url%28%23id%29`。
  2. 单独拍绝对定位的字幕 `<p>` 会得到空白图，要拍外层的 `[data-press-caption]` 盒子。
- **导出模板** `public/viewer/viewer.html` 由 `npm run build:viewer` 生成（已 gitignore）。
- **数据只在浏览器里**（IndexedDB `memory-book`）。送书要靠导出。
- **端口**：另一个对话常占着 5173。用 5174（`.claude/launch.json` 的 `memory-book-alt`，或 `npx vite --port 5174 --strictPort`），脚本加 `BASE=http://localhost:5174/`。**用完记得关掉后台服务器**（本轮曾因残留的预览服务器占着端口，导致测试打到旧版本）。
- Windows 上 Git Bash 会改写 `/photo/` 这类参数，要加 `MSYS_NO_PATHCONV=1`。
- 脚本参数里的 `--flag` 要从位置参数中过滤掉（曾经把 `--no-build` 当成了书 id）。
- 仓库有 `.gitattributes`（LF），提交时的 CRLF 警告是正常的。
- 内置浏览器面板隐藏时 rAF 会被节流，视觉验证用 Playwright 脚本（系统 Chrome，`playwright-core`）。
- 测试用 HEIC：scratch venv 里装 `pillow-heif` 生成（不要装到用户的系统 Python）。

## 5. 测试脚本（`scripts/`，用法见 README）

| 脚本 | 用途 |
|---|---|
| `e2e-editor.mjs <out> <照片目录>` | 书架 → 主题库 → 导入 → 编辑 → 换主题 → 导出 zip / html → 离线打开 |
| `e2e-safety.mjs <out> <照片目录>` | 导入进度 + 坏文件、存储提示、备份 / 恢复、续读、录制页 |
| `record-check.mjs <out> [书id] [image\|video\|both]` | 无人值守录屏做长图 / 视频 |
| `film-check.mjs <out> [书id] [--phone] [--only=portrait\|landscape\|image]` | 直接生成视频 / 长图，用 ffprobe 检查，抽帧出联系表 |
| `heic-check.mjs <out> <x.heic> [更多…]` | HEIC 导入 |
| `offline-check.mjs <out> [书id] [--no-build]` | 以 `/photo/` 构建并预览，访问后关掉服务器，检查离线 |
| `flaky-images.mjs <out> [书id] [失败次数]` | 模拟断网，检查图片自动重试 |
| `make-icons.mjs` | 重新生成主屏幕图标 |
| `theme-sheet` / `decor-sheet` / `scene-sheet` / `unwrap-sheet` / `sample-sheet` / `contrast-audit` | 各主题截图拼板、对比度审计 |

照片目录可以直接用 `public/assets/samples/storybook/`。本机装有 ffmpeg / ffprobe。

## 6. 待办 / 可以接着做的

- 【等用户回复】提交并推送本轮改动（= 上线），然后请用户在真手机上验证：竖屏视频、保存 / 分享、iPhone 照片导入（含拍摄日期）。
- 【等用户决定】国内镜像。
- 之前给用户的建议中还没做的：
  - 3：推送前在 CI 里先跑测试再发布。
  - 5：`og:image` 在微信里大概率不生效（要备案域名 + 公众号 JS-SDK），和国内镜像一起考虑。
  - 6：提醒用户备份；iOS 上持久存储是否申请成功要单独核实。
  - 7：`.mbook` / IndexedDB 加版本号和迁移。
  - 8：收礼人看书的分享链路，需要一点服务端，是产品决策。
  - 9：README 和界面里提醒"放进 public/books 会公开"。
- 直接生成的视频可以考虑的改进：开场的拆礼物动画（现在直接从合上的书开始）；背景在窗口比例和视频比例差太多时，会改用纯色桌面。
- `actions/deploy-pages@v4` 的 Node 20 弃用警告。
