# 回忆绘本 · Memory Book

在浏览器里做一本**可以真的翻开的书**：上传照片或插画，直接在书上改字、调取景，最后导出成一个网页送给别人。

- 真实翻页：纸张从角上掀起、有折痕阴影；封面是硬板，打开时书会从"合上居中"平移到"摊开居中"，读完再合上。
- 11 套主题，每套 3 种配色、2 种封面、多种装饰和贴纸：
  - 经典：暖白插画绘本、胶片 · 拍立得、复古旅行手账、极简美术馆画册、水彩日记、夜空 · 星图
  - 影视：星期三、怪奇物语、精灵宝可梦、吉卜力夏日、魔法学院（只画作品中的物件和场景，不画角色；想放角色可上传自己的贴纸）
- 8 种版式：整幅跨页、左右两幅、拍立得、图文对页、一大两小、四宫格、手账拼贴、纯文字；放照片时按拍摄时间自动混排。
- 送礼元素：拆封仪式（丝带礼盒、火漆信封、门票、精灵球、录像带、胶卷盒，随主题）、献词页、结尾的信（可以**手写签名**）、主题音效、日期 / 地点印章、每页右下角的"实拍照片"拍立得。
- 拆封仪式感：**定时拆封**（到点前只显示礼物和倒计时，比如生日当天 0 点）、**拆封问答**（先回答一个只有你们知道的问题，答错三次给提示）。两者都只是仪式，不是加密。
- 声音：每个主题**自带合成的背景音乐**（环境声 + 简单旋律，浏览器现场合成，不占流量）；也可以上传一首歌（可选从第几秒开始），或贴一个**网易云 / QQ 音乐的分享链接**（读者用自己的 App 听完整版）。可以**按章节换音乐**；每页可以录一句**语音留言**，翻到时自动播放、背景音乐暂时变小；读到最后音乐慢慢淡出。
- **自动放映**：书自己一页页翻（慢 / 中 / 快、全屏、不熄屏），适合给长辈看或投到电视上；可设成"打开后自动放映"。
- **会动的照片**：放一段短视频（实况照片先在相册里"存储为视频"），压成前 10 秒、无声、720p，在那一页上无声循环。
- 手机倾斜时书桌上的物件会轻轻移动；安卓手机翻页有轻微震动。
- 书桌场景：每个主题在书的四周摆着自己的物件（茶杯、胶卷、指南针、对讲机、精灵球、风铃、羽毛笔……），有光影和环境动效，部分物件可以点（彩蛋）。
- 主题照片滤镜：胶片颗粒、黑白高反差、VHS 录像带、夏日通透、古旧棕褐等，整本或按页关闭。
- 分享：导出**网站文件夹 .zip**（拖到 Netlify Drop 即得链接，也可直接双击打开）或**单个 .html 文件**。只打包这本书用到的字体片段；照片可选"精简"（长边 1400，体积约减半）或"高清"。zip 里带分享封面图（`og:image`、微信缩略图）和网页图标。
- 发微信：**翻书视频（.mp4）**自动拆封、翻完整本书（带音乐、章节换歌和语音留言）；**长图（.jpg）**把封面和每一页拼成一张。
- 打印：**PDF**——家用打印（A4 横向，一个跨页一张）或交给印刷厂（单页 300 dpi，含 3 mm 出血，内页和封面分开，附印刷说明）。
- 不丢书：自动申请浏览器"持久存储"；书架底部显示已用空间；每本书可**备份成 .mbook**（照片 + 编辑数据），换电脑或浏览器后"从备份恢复"继续编辑；空间快满、保存失败时会提醒。
- 续读：读到一半关掉，下次合上的书下方会出现"接着上次读下去"。

## 开始

```bash
npm install
```

```bash
npm run dev
```

打开 http://localhost:5173 。`npm run dev` 会先构建一次导出用的阅读器模板（`public/viewer/viewer.html`）。

## 使用

1. **书架**：点"新建一本"选择照片（或直接把照片拖进窗口；iPhone 的 HEIC 照片也可以，第一次用到时会下载约 750 KB 的解码器）。照片按拍摄时间排序：横图做成整幅跨页，竖图两两并排，拍摄日期自动写进印章。
2. **编辑**：点书上的任何文字直接修改；拖动图片调整取景，悬停可"换一张"（照片或短视频；视频悬停还有"不要动"）；下方小图条点击跳页、拖动排序、"+"加照片；右上角切换主题 / 配色 / 照片滤镜、选音乐（主题音乐 / 上传的歌 / 音乐 App 里的歌 / 不要音乐）、开关音效、撤销（Ctrl+Z）。故事页下方的选项里有"语音留言"和"章节"；翻到结尾的信，可以"手写签名"。所有改动自动保存在这台设备的浏览器里（IndexedDB）。
3. **预览**：和读者看到的一模一样。
4. **导出**：右上角"导出"。可以开关拆封仪式、填写"送给 / 来自"、设拆封时间和拆封问题、打开"自动放映"、选照片画质；也可以录翻书视频、拼长图、做打印用的 PDF，或备份这本书。
   - 翻书视频 / 长图有两种做法：电脑版 Chrome / Edge 默认**录屏**（共享此标签页，画面和书里完全一样）；手机和其他浏览器用**直接生成**（把每一页画成图片、在画布上翻页、编码成 MP4，不用共享屏幕，可选竖屏 9:16 / 横屏 16:9，带音乐和翻页声）。电脑上也可以点"直接生成"。
   - 手机上做好后可以"保存 / 分享"（系统分享面板，能直接存到相册或发给微信好友）；微信内置浏览器不能保存文件，要先"在浏览器打开"。
5. **备份**：书架上每本书下面的"备份"，或导出菜单里的"备份这本书"。书只存在这个浏览器里，换设备、清理浏览器之前请先备份。

阅读时：点右页 / → / 空格 下一页，点左页 / ← 上一页，拖动页角翻页，手机上左右滑或轻点。

**离线**：线上版带 Service Worker（`src/sw/service-worker.js`，构建时由 `scripts/vite-sw.mjs` 生成 `dist/sw.js`）。第一次打开后，程序本身会在后台存到本机，看过的字体和图片也会留下；之后再打开几乎是秒开，断网也能看书和编辑。手机上可以"添加到主屏幕"。发布新版本后，联网时打开会自动用新版（网络 3 秒没响应就先用本机的旧版）。

## 部署

应用本身是纯静态的：

```bash
npm run build
```

把 `dist/` 放到任何静态托管（Vercel、Netlify、GitHub Pages）即可。

本仓库已配置 GitHub Pages：每次推送到 `main`，`.github/workflows/deploy.yml` 会自动构建并发布到 https://chengnuo19.github.io/photo/ （站点在子目录下，构建时用环境变量 `BASE_PATH=/photo/`；本地开发不受影响）。

想把送人的书也放到这个站点：把导出的 zip 解压到 `public/books/<名字>/`，推送后链接就是 `https://chengnuo19.github.io/photo/books/<名字>/`。注意：每个人的书都只存在自己的浏览器里，**分享书请用导出**。

## 结构

```
src/
  app/            书架、阅读、编辑、录制页面与路由（#/、#/book/:id、#/book/:id/edit、#/book/:id/record/video|image|pdf）
  components/
    Book/         Book（舞台、开合平移、三层阴影、页边厚度）、PageFlipView（翻页引擎的 React 封装）
    Editor/       原位编辑文字 / 图片、页面小图条、当前页选项（语音留言、章节）、音乐选择、送礼设置
    Slideshow/    自动放映
    Signature/    手写签名（画板 + 信上的签名，存成 SVG 路径）
    Scene/        书桌场景的基础件（背景、物件、彩蛋、纹理）
    Unwrap/       送礼拆封
    Caption/  PhotoPreview/  Music/  Masthead/  ui/
  themes/         每个主题一个目录（按需加载：每个主题单独打包，打开哪本书才下载哪个主题）：一套完整预设（纸、字、配色、装饰、版式、书桌场景 scene.tsx、音效、滤镜、包装）
  sound/          WebAudio 合成：音效（engine）、主题音乐（score：乐器、环境声、提前调度）、播放器（music：章节交叉淡变、结尾淡出、语音时压低）、录音（voice）、离线混音（soundtrack）
  themes/<id>/music.ts  每个主题的配乐
  data/           schema（书的数据结构，版本 2）、migrate（旧版本升级）、buildPages（逻辑跨页 → 物理页）、bookOps、timing（翻页节奏）、gift（倒计时 / 问答）、musicLink
  hooks/          useBookMachine（closed/opening/reading/flipping/closing/ended 状态机）等
  storage/        IndexedDB、图片导入（压缩为 WebP、读取 EXIF）、短视频导入（video）、持久存储与空间（quota）、备份恢复（backup）
  export/         导出 zip / 单 html、分享封面图（shareCard）、录屏做长图和视频（capture）、字体片段挑选（fontSlices）
    film/         不用录屏的视频 / 长图：press（离屏排版每一页）、renderer（画布上翻页，复用引擎的 FlipCalculation）、film（时间线、配音、WebCodecs 编码）
    pdf/          打印用 PDF：writer（极简 PDF 写入，每页一张 JPEG）、makePdf（家用 A4 / 印刷单页 + 出血）
  sw/             Service Worker（离线与缓存）
  vendor/page-flip/  StPageFlip 2.0.7（MIT）源码，本地修改处标注 "MB:"
scripts/          示例插画生成、Playwright 截图与端到端测试、主屏幕图标（make-icons）、Service Worker 构建插件（vite-sw）
```

### 为什么把 page-flip 放进 vendor

原库的渲染循环在 `destroy()` 后仍会一直运行，窗口缩放只能重建，线性动画没有纸张的重量感，触摸时轻点无效、慢速拖动方向判断错误，合上封面时会在空桌面上画一块灰色阴影。这些都在 `src/vendor/page-flip` 里修好了（搜索 `MB:`），并加了 `setPageSize()` 与 `flipProgress` 事件。

## 样书

11 本样书的照片来自 Unsplash（免费 Unsplash License，来源见 `public/assets/samples/SOURCES.md`），故事和照片的对应写在 `src/data/samples.ts`。想换成自己的：替换 `public/assets/samples/<主题>/` 里的同名图片，或改 `samples.ts`。数据结构见 `src/data/schema.ts`。

## 测试

```bash
node scripts/shot.mjs <输出目录> 1600x900 "wait:2000|key:ArrowRight|wait:1400|shot:open" http://localhost:5173/#/book/sample-nz
```

```bash
node scripts/e2e-editor.mjs <输出目录> <照片目录>
```

```bash
node scripts/theme-sheet.mjs <输出目录> [主题id,逗号分隔] [宽x高] [all|first]
```

```bash
node scripts/contrast-audit.mjs [主题id,逗号分隔]
```

```bash
node scripts/decor-sheet.mjs <输出目录> [主题id] [宽x高] [配色]
```

```bash
node scripts/scene-sheet.mjs <输出目录> [主题id] [宽x高,宽x高]
```

```bash
node scripts/unwrap-sheet.mjs <输出目录> [主题id] [宽x高]
```

```bash
node scripts/sample-sheet.mjs <输出目录> [主题id] [宽x高]
```

```bash
node scripts/e2e-safety.mjs <输出目录> <照片目录>
```

```bash
node scripts/record-check.mjs <输出目录> [书id] [image|video|both]
```

```bash
node scripts/flaky-images.mjs <输出目录> [书id] [失败次数]
```

```bash
node scripts/film-check.mjs <输出目录> [书id] [--phone] [--only=portrait|landscape|image]
```

```bash
node scripts/heic-check.mjs <输出目录> <照片.heic> [更多文件…]
```

```bash
node scripts/offline-check.mjs <输出目录> [书id]
```

```bash
node scripts/sound-check.mjs <输出目录> [主题id…]
```

```bash
node scripts/music-check.mjs <输出目录> [照片目录] [--no-build]
```

```bash
node scripts/gift-check.mjs <输出目录> [照片目录] [--no-build]
```

```bash
node scripts/motion-check.mjs <输出目录> [照片目录] [--no-build]
```

```bash
node scripts/pdf-check.mjs <输出目录> [照片目录]
```

`flaky-images` 让每张照片的前几次请求都断网失败，检查照片最终都能自动重试加载出来。`e2e-safety` 检查导入进度与读不了的文件、存储提示、备份 → 删除 → 恢复、续读；`record-check` 用 Chrome 的 `--auto-accept-this-tab-capture` 无人值守地录一次长图 / 视频。`film-check` 用"直接生成"做竖屏、横屏视频和长图，用 ffprobe 检查 MP4（分辨率、时长、音轨），再用 ffmpeg 抽帧拼成联系表方便目视检查（`--phone` 模拟手机）。`heic-check` 导入 HEIC（其中一张不带 MIME 类型，模拟 Windows 上的 iPhone 照片），检查存进去的尺寸；测试用 HEIC 可以用 pillow-heif 生成。`offline-check` 以 `/photo/` 构建并启动预览，访问一次后**关掉服务器**，检查书架、样书（含照片）和主题库都还能打开。`sound-check` 离线渲染每个主题的配乐各 30 秒，检查不静音、不削波、各主题响度接近，并存成 wav 供试听。`music-check` 走一遍音乐：默认主题音乐、上传歌曲从 0:05 开始、Chrome 假麦克风录语音（存成 AAC）、章节换成主题音乐、语音时音乐压低、结尾淡出、`file://` 打开的导出书能放歌、直接生成的视频有声音、音乐 App 链接卡片。`gift-check` 用 Playwright 的时钟检查倒计时、拆封问答（答案不出现在导出文件里）和自动放映。`motion-check` 导入 12 秒带声音的视频，检查压成 ≤10 秒、无声、720p 的 H.264，阅读和导出时在播放，备份带上视频。`pdf-check` 手写签名后做两种 PDF，用 pdfinfo / pdfimages（TeX Live 或 poppler 自带）检查页数、A4、出血和 TrimBox、300 dpi。music / gift / motion 三个脚本会先构建导出模板（`--no-build` 跳过）。所有脚本都可以用环境变量 `BASE` 指向别的端口。

截图脚本使用本机安装的 Chrome（playwright-core，不额外下载浏览器）。
