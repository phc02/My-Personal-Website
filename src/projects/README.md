# 项目页维护

五个项目页面由根目录 `build.mjs` 生成，再由 `scripts/optimize-build.mjs` 提取可缓存资源、替换网页媒体版本并移除部署目录中的未引用文件。

- 铸融：`public/projects/zhurong/index.html` 为模板，`public/projects/zhurong/assets/app.js` 为已构建的交互应用。`src/projects/zhurong/` 保留原始模块和案例源代码。
- M7 供应看板：`src/projects/m7-monitor/`。
- M7 数字孪生：`src/projects/m7-digital-twin/`，本地地图 Demo 位于 `public/projects/m7-digital-twin/demo/`。
- 无感设计：`src/projects/invisible-design/`，包含视频与飞书阅读区。
- 触解迷障：`src/projects/dyslexia/`，包含视频、架构图、流程图和图片放大交互。

共享项目转场：`public/project-transition.js` / `.css`。项目导航：`public/projects/zhurong/assets/header.js` / `.css`。主页项目列表：`src/work.js`。

修改后运行 `npm run check`、`npm run build`，部署 `dist/`。不要直接编辑生成后的根目录 HTML 或 `public/generated/`。
