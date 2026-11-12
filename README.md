# 彭海朝的个人作品集

原生 HTML / CSS / JavaScript，配合本地 GSAP 与 ScrollTrigger。保留 HOME、ABOUT、WORK、CONTACT，以及五个项目详情页。

## 本地运行

需要 Node.js 20 或以上版本。构建使用 Node 内置模块，没有额外构建依赖。

```powershell
npm ci
npm run check
npm run build
npm start
```

浏览器打开 `http://localhost:4173/`。修改源码后重新构建。根目录的 `SPECIAL-intro.html` 和五个项目 HTML 是本地预览入口，依赖同目录的 `public/`；部署使用 `dist/`。

## 部署

**只发布 `dist/` 里面的内容。** 它已经包含首页 `index.html`、项目页、样式、脚本、字体、图片、视频和本地地图 Demo。不要把整个项目文件夹上传为网站。

支持较大静态视频文件的 Netlify、Vercel 或自有静态服务器可使用：

- 构建命令：`npm run build`
- 发布目录：`dist`
- Node.js：20 或以上
- 首页：`index.html`

当前最大视频文件约 65 MB。选择支持这一单文件大小的托管服务；文件限制较小的平台需将视频另放到对象存储／CDN。

保持 `.html` 路由可用，勿设置把所有请求强制重写到首页的 SPA 规则。托管服务应支持 MP4 的 HTTP Range 分段请求；本地预览服务已实现。支持 `_headers` 的平台会对内容哈希文件启用长期缓存，并让 HTML 重新验证。

飞书正文、图片及高德地图 SDK 需要网络；飞书的分享权限、CDN 连通情况和地图服务状态由对应服务控制。本地阅读框保留原文与重试入口。

## 文件结构

| 目录／文件 | 用途 |
| --- | --- |
| `src/` | 首页源码和项目详情模块 |
| `public/` | 构建所需的媒体、字体、供应地图 Demo 和预编译项目资源 |
| `public/generated/` | 构建自动生成的可缓存脚本、样式和少量资源，不手工编辑 |
| `src/asset-variants.json` | 原始资源到网页版本的映射 |
| `scripts/` | 构建优化、语法检查、导航验证与性能测量 |
| `qa/` | 当前交互的功能验证与软件图标处理脚本 |
| `docs/` | 当前构建与性能报告 |
| `dist/` | 可直接发布的静态网站 |
| `build.mjs` | 页面生成和部署资源整理 |
| `serve.mjs` | 支持缓存、HEAD、MP4 Range 的本地预览服务 |

项目路由：`ZHURONG.html`、`M7-MONITOR.html`、`M7-DIGITAL-TWIN.html`、`INVISIBLE-DESIGN.html`、`DYSLEXIA.html`。首页保留 `SPECIAL-intro.html` 兼容入口。

## 资源与交互维护

详情页大图不再内嵌到 HTML。大 PNG 使用无损 WebP，首屏外图片延迟加载；头像使用适合显示尺寸的网页版本。视频保留原比例、播放内容与声音，网页版本将 MP4 索引放到文件开头以便尽早播放。无感设计原始视频可留作本地编辑素材，部署只使用 `无感设计演示视频-web.mp4`。

替换资源后检查 `src/asset-variants.json` 中是否有对应网页版本，必要时同步生成该版本或移除该映射。软件原图位于 `public/assets/software-icons/originals/`；更新后运行 `qa/prepare-home-skill-icons.py` 生成卡片素材，再构建。

铸融与 M7 监控详情页使用手机专用的响应式图片，桌面继续读取完整原图。更新这两页的大图后，运行 `python qa/prepare-case-mobile-images.py`（需要 Pillow），并提交生成的 `public/assets/case-responsive/` 与 `src/case-responsive-images.json`。普通部署构建不需要 Python 或图片处理依赖。手机端减少长章节合成层和文字模糊，避免滚动期间持续占用过多图像内存。

手机长案例正文采用逐章按需渲染，只挂载当前及邻近章节，退出范围后释放图片；桌面恢复原生设计画板。正文图片保留可访问的文字副本与固定章节比例。更新正文后，先设置环境变量 `CASE_CHAPTER_CAPTURE=1` 并构建，再运行 `node qa/capture-case-chapters.cjs`（需要 Playwright 与 Chrome）和 `python qa/prepare-case-mobile-chapters.py`。提交 `src/case-mobile-chapters.json` 和 `public/assets/case-mobile-chapters/`，清除该环境变量后重新构建。截图会隐藏固定顶栏，避免把导航重复嵌入每个章节。可用 `node scripts/verify-mobile-case-scroll.cjs` 验证章节挂载数量与长滑稳定性。

共享曲面转场位于 `public/project-transition.js` 和 `.css`。项目页导航位于 `public/projects/zhurong/assets/header.js`，首页导航位于 `src/navigation.js`，点击与页头遮罩同步位于 `src/header-scroll.js`。

## 验证

`npm run check` 检查当前源码语法。导航与性能检查需要本地 Chrome 和 Playwright；可先运行 `npm install --no-save --package-lock=false playwright`。启动预览服务后，另开终端：

```powershell
$env:PORTFOLIO_BASE='http://localhost:4173/'
npm run verify:navigation
npm run profile
```

导航检查覆盖五项目进入返回、滚动位置和列表／网格恢复、HOME／ABOUT／WORK／CONTACT、桌面和手机，以及本地 404 和脚本异常。性能结果记录在 `docs/performance-after.json`，构建体积记录在 `docs/build-report.json`。

第三方字体、组件与 GSAP 的许可文件保留在 `public/` 和构建输出中。
