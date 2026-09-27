# 回忆绘本 · Memory Book

在浏览器里做一本**可以真的翻开的书**：上传照片或插画，直接在书上改字、调取景，最后导出成一个网页送给别人。

- 真实翻页：纸张从角上掀起、有折痕阴影；封面是硬板，打开时书会从"合上居中"平移到"摊开居中"，读完再合上。
- 11 套主题，每套 3 种配色、2 种封面、多种装饰和贴纸：
  - 经典：暖白插画绘本、胶片 · 拍立得、复古旅行手账、极简美术馆画册、水彩日记、夜空 · 星图
  - 影视：星期三、怪奇物语、精灵宝可梦、吉卜力夏日、魔法学院（只画作品中的物件和场景，不画角色；想放角色可上传自己的贴纸）
- 8 种版式：整幅跨页、左右两幅、拍立得、图文对页、一大两小、四宫格、手账拼贴、纯文字；放照片时按拍摄时间自动混排。
- 送礼元素：拆封仪式（丝带礼盒、火漆信封、门票、精灵球、录像带、胶卷盒，随主题）、献词页、结尾的信、背景音乐（拆封 / 翻开时淡入）、主题音效、日期 / 地点印章、每页右下角的"实拍照片"拍立得。
- 书桌场景：每个主题在书的四周摆着自己的物件（茶杯、胶卷、指南针、对讲机、精灵球、风铃、羽毛笔……），有光影和环境动效，部分物件可以点（彩蛋）。
- 主题照片滤镜：胶片颗粒、黑白高反差、VHS 录像带、夏日通透、古旧棕褐等，整本或按页关闭。
- 分享：导出**网站文件夹 .zip**（拖到 Netlify Drop 即得链接，也可直接双击打开）或**单个 .html 文件**。只打包这本书用到的字体片段；照片可选"精简"（长边 1400，体积约减半）或"高清"。zip 里带分享封面图（`og:image`、微信缩略图）和网页图标。
- 发微信：**翻书视频（.mp4）**自动拆封、翻完整本书；**长图（.jpg）**把封面和每一页拼成一张。都是页面录下自己（浏览器会请你选择"此标签页"），需电脑版 Chrome / Edge。
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

1. **书架**：点"新建一本"选择照片（或直接把照片拖进窗口）。照片按拍摄时间排序：横图做成整幅跨页，竖图两两并排，拍摄日期自动写进印章。
2. **编辑**：点书上的任何文字直接修改；拖动图片调整取景，悬停可"换一张"；下方小图条点击跳页、拖动排序、"+"加照片；右上角切换主题 / 配色 / 照片滤镜、加音乐、开关音效、撤销（Ctrl+Z）。所有改动自动保存在这台设备的浏览器里（IndexedDB）。
3. **预览**：和读者看到的一模一样。
4. **导出**：右上角"导出"。可以开关拆封仪式、填写"送给 / 来自"、选照片画质；也可以录翻书视频、拼长图，或备份这本书。
5. **备份**：书架上每本书下面的"备份"，或导出菜单里的"备份这本书"。书只存在这个浏览器里，换设备、清理浏览器之前请先备份。

阅读时：点右页 / → / 空格 下一页，点左页 / ← 上一页，拖动页角翻页，手机上左右滑或轻点。

## 部署

应用本身是纯静态的：

```bash
npm run build
```

把 `dist/` 放到任何静态托管（Vercel、Netlify、GitHub Pages）即可。注意：每个人的书都只存在自己的浏览器里，**分享书请用导出**。

## 结构

```
src/
  app/            书架、阅读、编辑、录制页面与路由（#/、#/book/:id、#/book/:id/edit、#/book/:id/record/video|image）
  components/
    Book/         Book（舞台、开合平移、三层阴影、页边厚度）、PageFlipView（翻页引擎的 React 封装）
    Editor/       原位编辑文字 / 图片、页面小图条、当前页选项
    Scene/        书桌场景的基础件（背景、物件、彩蛋、纹理）
    Unwrap/       送礼拆封
    Caption/  PhotoPreview/  Music/  Masthead/  ui/
  themes/         每个主题一个目录（按需加载：每个主题单独打包，打开哪本书才下载哪个主题）：一套完整预设（纸、字、配色、装饰、版式、书桌场景 scene.tsx、音效、滤镜、包装）
  sound/          WebAudio 合成音效（无音频文件）
  data/           schema（书的数据结构）、buildPages（逻辑跨页 → 物理页）、bookOps、sampleBook
  hooks/          useBookMachine（closed/opening/reading/flipping/closing/ended 状态机）等
  storage/        IndexedDB、图片导入（压缩为 WebP、读取 EXIF）、持久存储与空间（quota）、备份恢复（backup）
  export/         导出 zip / 单 html、分享封面图（shareCard）、录制长图和视频（capture）
  vendor/page-flip/  StPageFlip 2.0.7（MIT）源码，本地修改处标注 "MB:"
scripts/          示例插画生成、Playwright 截图与端到端测试
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

`e2e-safety` 检查导入进度与读不了的文件、存储提示、备份 → 删除 → 恢复、续读；`record-check` 用 Chrome 的 `--auto-accept-this-tab-capture` 无人值守地录一次长图 / 视频。所有脚本都可以用环境变量 `BASE` 指向别的端口。

截图脚本使用本机安装的 Chrome（playwright-core，不额外下载浏览器）。
