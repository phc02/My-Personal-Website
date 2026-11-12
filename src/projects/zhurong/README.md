# 铸融项目首屏迁移

来源：用户指定的 scroll-demo 首屏。原目录未修改。

仅挂载 ContainerScroll 与 ClickSpark，不挂载 ProjectIntroduction、UserResearch 或其他后续章节。

- main.tsx：首屏入口与返回作品列表链接。
- container-scroll-animation.tsx：保留原始滚动参数，rotationX 18 → 0、scale 0.9 → 1、y 0 → 36，标题 y 0 → -76，滚动距离 max(2 × 视口高度, 1800px)。
- ClickSpark.tsx：原始白色点击反馈。
- original-styles.css：来源样式记录。
- public/projects/zhurong/：可运行的独立构建、首屏背景和屏幕图片。
- 根目录 ZHURONG.html 与 dist/ZHURONG.html：由 npm run build 生成的单文件项目页面，图片与脚本内嵌。

字体沿用原 demo 的 MiSans CDN 字体样式。运行页面不读取原 scroll-demo 目录。

## 白边小球转场

circle-scroll.tsx 让小球成为后续案例内容的柔边圆形窗口：滚动时上移并扩大渐变蒙版，内容保持真实页面的比例与位置，描边在扩张初段淡出。铺满后直接衔接原页面；反向滚动沿同一路径收回。窗口根据视口高度放入足够的后续章节，确保手机端同样连续。预览不可交互且不参与无障碍阅读，实际章节与链接保持原样。不支持渐变蒙版的浏览器回退到圆形裁切。

修改 React 或 figma.css 后运行 node scripts/build-zhurong.cjs，再运行 npm run build 更新独立构建及根目录、dist 详情页。可通过 ZHURONG_NODE_MODULES 指定包含 React、GSAP、@gsap/react 与 esbuild 的开发依赖目录；普通网站构建继续使用已编译的 app.js。

圆形视窗使用 8–16px 的渐变蒙版羽化边缘，静止描边为 1px、35% 不透明度，在扩张前 35% 淡出。上移为连续运动，扩张采用 sine.inOut，滚动追随缓动为 0.2 秒；完整铺满后衔接实际章节，反向滚动沿同一路径还原。减少动态模式直接显示正文。
