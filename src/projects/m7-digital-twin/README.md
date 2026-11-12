# M7 数字孪生详情页

- page.html、style.css：Figma 画板、视频屏幕及步骤按钮。
- interactions.js：步骤提示与体验鼠标。
- experience.js：屏幕纵深推进、嵌入 Demo 和反向返回。
- public/projects/m7-digital-twin/demo：用户指定本地原型的完整副本，运行不依赖原文件夹。
- local-data.js：原三份 GeoJSON 数据的本地脚本版本，兼容 file:// 页面。
- 高德 SDK、底图与地图样式仍通过原有在线服务加载。
- npm run build 生成根目录和 dist 中的 M7-DIGITAL-TWIN.html，并将 Demo 复制到 dist。
