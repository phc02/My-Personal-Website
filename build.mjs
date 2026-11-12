import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {optimizeBuild} from './scripts/optimize-build.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const read=p=>readFile(resolve(root,p),'utf8');
await mkdir(resolve(root,'dist'),{recursive:true});
await cp(resolve(root,'src/cursor-dot-trail.js'),resolve(root,'public/projects/zhurong/assets/cursor-dot-trail.js'));
await cp(resolve(root,'public'),resolve(root,'dist'),{recursive:true});
let html=await read('src/index.html');
for(const name of ['style.css','resume-envelope.css','resume-envelope.js','loading.js','intro.js','home-skills.js','cursor-dot-trail.js','eye-tracker.js','navigation.js','header-magnet.js','header-scroll.js','work.js','contact-shape.js','contact.js'])await cp(resolve(root,'src',name),resolve(root,'dist',name));
await writeFile(resolve(root,'dist/index.html'),html);
let css=await read('src/style.css');
for(const name of ['poppins-medium.ttf','poppins-light.ttf','space-grotesk-regular.ttf','space-grotesk-medium.ttf','america-regular.woff2','america-light.woff2','america-medium.woff2','america-mono.woff2','orb.png']){
 const data=await readFile(resolve(root,'public/assets',name));
 css=css.replaceAll(`assets/${name}`,`data:${name.endsWith('woff2')?'font/woff2':name.endsWith('ttf')?'font/ttf':'image/png'};base64,${data.toString('base64')}`);
}
const projectTransitionCss=await read('public/project-transition.css'),projectTransitionJs=await read('public/project-transition.js');
const resumeCss=await read('src/resume-envelope.css');
let standalone=html.replace('<link rel="stylesheet" href="style.css">',`<style>${css}</style>`);
standalone=standalone.replace('<link rel="stylesheet" href="resume-envelope.css">',()=>`<style>${resumeCss}</style>`);
standalone=standalone.replace('<link rel="stylesheet" href="project-transition.css">',()=>`<style>${projectTransitionCss}</style>`).replace('<script src="project-transition.js"></script>',()=>`<script>${projectTransitionJs}</script>`);
standalone=standalone.replace('assets/haichao.jpeg',`data:image/jpeg;base64,${(await readFile(resolve(root,'public/assets/haichao.jpeg'))).toString('base64')}`);
for(const name of ['彭海朝17501149766.png','resume-envelope/flap.svg','resume-envelope/body.svg','resume-envelope/stamp.png','resume-envelope/collapse.svg']){
 const mime=name.endsWith('.svg')?'image/svg+xml':'image/png';
 standalone=standalone.replaceAll(`assets/${name}`,`data:${mime};base64,${(await readFile(resolve(root,'public/assets',name))).toString('base64')}`);
}
standalone=standalone.replace('assets/微信二维码.png',`data:image/png;base64,${(await readFile(resolve(root,'public/assets/微信二维码.png'))).toString('base64')}`);
standalone=standalone.replace(/  <script defer[^\n]+\n/g,'');
const scripts=await Promise.all(['public/vendor/gsap.min.js','public/vendor/ScrollTrigger.min.js','src/eye-tracker.js','src/loading.js','src/intro.js','src/resume-envelope.js','src/home-skills.js','src/cursor-dot-trail.js','src/navigation.js','src/header-magnet.js','src/header-scroll.js','src/work.js','public/vendor/ScrambleTextPlugin.min.js','src/contact-shape.js','src/contact.js'].map(read));
for(const name of ['figma','blender','codex','photoshop','jimeng-ai','jianying','unity','after-effects','vscode']){
 const path=`assets/software-icons/home/${name}.png`;
 const embedded=`data:image/png;base64,${(await readFile(resolve(root,'public',path))).toString('base64')}`;
 for(let i=0;i<scripts.length;i++)scripts[i]=scripts[i].replaceAll(path,embedded);
}
standalone=standalone.replace('</body>',()=>scripts.map(code=>`<script>${code.replaceAll('</script','<\\/script')}</script>`).join('\n')+'\n</body>');
standalone=standalone.replace('</head>',`<!-- ${await read('public/vendor/contact-button-LICENSE.txt')} -->\n</head>`);
for(let i=1;i<=5;i++){
 const preview=`assets/work-previews/project-${i}.webp`;
 standalone=standalone.replaceAll(preview,`data:image/webp;base64,${(await readFile(resolve(root,'public',preview))).toString('base64')}`);
}
await writeFile(resolve(root,'SPECIAL-intro.html'),standalone);
await writeFile(resolve(root,'dist/SPECIAL-intro.html'),standalone);
// Standalone first-screen case study: original local demo hero only.
let project=await read('public/projects/zhurong/index.html');
project=project.replace('<link rel="stylesheet" href="../../project-transition.css">',()=>`<style>${projectTransitionCss}</style>`).replace('<script src="../../project-transition.js"></script>',()=>`<script>${projectTransitionJs}</script>`);
const projectButtonLicense=await read('public/projects/zhurong/assets/work-return-LICENSE.txt');
project=project.replace('</head>',()=>`<!-- ${projectButtonLicense} -->\n</head>`);
project=project.replace('<link rel="stylesheet" href="./assets/style.css">',`<style>${await read('public/projects/zhurong/assets/style.css')}</style>`);
let figmaCss=await read('public/projects/zhurong/assets/figma.css');
let continuationCss=await read('public/projects/zhurong/assets/sections.css');
for(const name of [...new Set([...continuationCss.matchAll(/\.\.\/\.\.\/m7-monitor\/assets\/([^'\")]+)/g)].map(m=>m[1]))]){
 continuationCss=continuationCss.replaceAll(`../../m7-monitor/assets/${name}`,`data:font/woff2;base64,${(await readFile(resolve(root,'public/projects/m7-monitor/assets',name))).toString('base64')}`);
}
continuationCss=continuationCss.replaceAll('../../../assets/space-grotesk-medium.ttf',`data:font/ttf;base64,${(await readFile(resolve(root,'public/assets/space-grotesk-medium.ttf'))).toString('base64')}`);
project=project.replace('<link rel="stylesheet" href="./assets/sections.css">',()=>`<style>${continuationCss}</style>`);
for(const name of [...new Set([...project.matchAll(/\.\/assets\/continuation\/([a-zA-Z0-9_.-]+)/g)].map(m=>m[1]))]){
 const mime=name.endsWith('.svg')?'image/svg+xml':name.endsWith('.jpg')?'image/jpeg':'image/png';
 project=project.replaceAll(`./assets/continuation/${name}`,`data:${mime};base64,${(await readFile(resolve(root,'public/projects/zhurong/assets/continuation',name))).toString('base64')}`);
}
project=project.replace('<script defer src="./assets/sections.js"></script>','');
for(const name of [...new Set([...figmaCss.matchAll(/\.\/figma\/([^'")]+)/g)].map(m=>m[1]))]){
 const mime=name.endsWith('.woff2')?'font/woff2':'image/png';
 figmaCss=figmaCss.replaceAll(`./figma/${name}`,`data:${mime};base64,${(await readFile(resolve(root,'public/projects/zhurong/assets/figma',name))).toString('base64')}`);
}
project=project.replace('<link rel="stylesheet" href="./assets/figma.css">',()=>`<style>${figmaCss}</style>`);
project=project.replace('<script defer src="./assets/app.js"></script>','');
let projectHeaderCss=await read('public/projects/zhurong/assets/header.css');
projectHeaderCss=projectHeaderCss.replace('../../../assets/space-grotesk-regular.ttf',`data:font/ttf;base64,${(await readFile(resolve(root,'public/assets/space-grotesk-regular.ttf'))).toString('base64')}`);
project=project.replace('<link rel="stylesheet" href="./assets/header.css">',()=>`<style>${projectHeaderCss}</style>`);
for(const path of ['../../vendor/gsap.min.js','./assets/header.js','../../header-magnet.js','./assets/cursor-dot-trail.js']) project=project.replace(`<script defer src="${path}"></script>`,'');
project=project.replaceAll('../../../SPECIAL-intro.html','SPECIAL-intro.html');

let projectCode=await read('public/projects/zhurong/assets/app.js');
for(const name of ['hero-atmosphere.png','casting-insight-dashboard.png']){
 projectCode=projectCode.replaceAll(`./assets/${name}`,`data:image/png;base64,${(await readFile(resolve(root,'public/projects/zhurong/assets',name))).toString('base64')}`);
}
for(const name of ['648eb.png','70a7a.png','933b7.svg','cf343.svg','b08d9.svg']){
 const mime=name.endsWith('.svg')?'image/svg+xml':'image/png';
 projectCode=projectCode.replaceAll(`./assets/figma/${name}`,`data:${mime};base64,${(await readFile(resolve(root,'public/projects/zhurong/assets/figma',name))).toString('base64')}`);
}
project=project.replace('../../../SPECIAL-intro.html#work','SPECIAL-intro.html#work');
projectCode=projectCode.replaceAll('../../../SPECIAL-intro.html#work','SPECIAL-intro.html#work');
projectCode+=';\n'+await read('src/cursor-dot-trail.js')+';\n'+await read('public/vendor/gsap.min.js')+';\n'+await read('public/projects/zhurong/assets/header.js')+';\n'+await read('src/header-magnet.js');
projectCode=await read('src/projects/zhurong/sections.js')+';\n'+projectCode;
project=project.replace('</body>',()=>`<script>${projectCode.replaceAll('</script','<\\/script')}</script></body>`);
await writeFile(resolve(root,'ZHURONG.html'),project);
await writeFile(resolve(root,'dist/ZHURONG.html'),project);
console.log('Built dist/ and standalone SPECIAL-intro.html');

// Independent case-study pages reuse the project header.
const projectPages=[['M7-MONITOR.html','小米汽车M7 · 供应看板实时监控'],['M7-DIGITAL-TWIN.html','小米汽车M7 · 数字孪生交互原型'],['INVISIBLE-DESIGN.html','无感设计分享'],['DYSLEXIA.html','触解迷障']];
const projectTemplate=await read('public/projects/zhurong/index.html');
const projectHeaderMarkup=projectTemplate.slice(projectTemplate.indexOf('<body>')+6,projectTemplate.indexOf('<div id="root">'));
// M7 monitor first screen: exact Figma artwork, with responsive full-bleed crop.
const monitorCursorCode=await read('src/cursor-dot-trail.js');
let monitorCss=await read('src/projects/m7-monitor/style.css')+'\n'+await read('src/projects/m7-monitor/sections.css')+'\n'+await read('src/projects/m7-monitor/motion.css');
let monitorFonts=await read('public/projects/m7-monitor/assets/fonts.css');
for(const name of [...new Set([...monitorFonts.matchAll(/url\('([^']+)'\)/g)].map(m=>m[1]))]) monitorFonts=monitorFonts.replaceAll(name,`data:font/woff2;base64,${(await readFile(resolve(root,'public/projects/m7-monitor/assets',name))).toString('base64')}`);
monitorCss=monitorFonts+'\n'+monitorCss;
let monitorContent=await read('src/projects/m7-monitor/page.html');
for(const [token,name] of [['monitor-scene','monitor-scene.png'],['mi-logo','mi-logo-source.png']]) monitorContent=monitorContent.replaceAll(`{{${token}}}`,`data:image/png;base64,${(await readFile(resolve(root,'public/projects/m7-monitor/assets',name))).toString('base64')}`);
let monitorSections=await read('src/projects/m7-monitor/sections.html');
for(const name of [...new Set([...monitorSections.matchAll(/\{\{continuation\/([^}]+)\}\}/g)].map(m=>m[1]))]){
 const mime=name.endsWith('.svg')?'image/svg+xml':'image/png';
 monitorSections=monitorSections.replaceAll(`{{continuation/${name}}}`,`data:${mime};base64,${(await readFile(resolve(root,'public/projects/m7-monitor/assets/continuation',name))).toString('base64')}`);
}
monitorContent+=`<div class="monitor-followups">${monitorSections}</div>`;
const monitorSectionsCode=await read('src/projects/m7-monitor/sections.js');
monitorCss+=`@font-face{font-family:MonitorSpace;src:url('data:font/ttf;base64,${(await readFile(resolve(root,'public/assets/space-grotesk-medium.ttf'))).toString('base64')}') format('truetype');font-weight:500;font-display:swap}`;
for(const [filename,title] of projectPages){
 let blank=`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — 彭海朝</title><style>html,body{margin:0;background:#000;color:#fff;min-height:100%;}*{box-sizing:border-box}.zhurong-page{min-height:100svh;background:#000}${projectHeaderCss}\n${projectTransitionCss}</style><script>${projectTransitionJs}</script></head><body>${projectHeaderMarkup.replaceAll('../../../SPECIAL-intro.html','SPECIAL-intro.html')}<main class="zhurong-page" aria-label="${title}"></main><script>${await read('public/vendor/gsap.min.js')}\n${await read('public/projects/zhurong/assets/header.js')}\n${await read('src/header-magnet.js')}</script></body></html>`;
 if(filename==='M7-MONITOR.html'){
  const awaitScrollTrigger=await read('public/vendor/ScrollTrigger.min.js');
  blank=blank.replace('</style>',()=>monitorCss+'</style>').replace('<body>','<body class="monitor-detail">').replace(`<main class="zhurong-page" aria-label="${title}"></main>`,()=>`<main class="zhurong-page" aria-label="${title}">${monitorContent}</main>`);
  const monitorMotion=await read('src/projects/m7-monitor/motion.js');
  const monitorScrollReveal=await read('src/projects/m7-monitor/scroll-reveal.js');
  blank=blank.replace('</body>',()=>`<script>${awaitScrollTrigger}\n${monitorSectionsCode}\n${monitorCursorCode}\n${monitorMotion}\n${monitorScrollReveal}</script></body>`);
 }
 if(filename==='M7-DIGITAL-TWIN.html'){
  const awaitTwinCss=await read('src/projects/m7-digital-twin/style.css');
  let twinContent=await read('src/projects/m7-digital-twin/page.html');
  for(const name of ['5016-104.png','5227-7727.png','screen-poster.png'])twinContent=twinContent.replaceAll(`{{twin/${name}}}`,`data:image/png;base64,${(await readFile(resolve(root,'public/projects/m7-digital-twin/assets',name))).toString('base64')}`);
  blank=blank.replace('</style>',()=>monitorFonts+'\n'+awaitTwinCss+'</style>');
  blank=blank.replace('<body>','<body class="twin-detail">').replace(`<main class="zhurong-page" aria-label="${title}"></main>`,()=>`<main class="zhurong-page" aria-label="${title}">${twinContent}</main>`);
  const twinInteractions=await read('src/projects/m7-digital-twin/interactions.js');
  const twinExperience=await read('src/projects/m7-digital-twin/experience.js');
  blank=blank.replace('</body>',()=>`<script>${monitorCursorCode}\n${twinInteractions}\n${twinExperience}</script></body>`);
 }
 if(filename==='INVISIBLE-DESIGN.html'||filename==='DYSLEXIA.html'){
  const invisibleCss=await read('src/projects/invisible-design/style.css');
  let invisibleContent=(await read('src/projects/invisible-design/page.html')).replaceAll('无感设计分享',title);
  if(filename==='INVISIBLE-DESIGN.html')invisibleContent=invisibleContent.replace('class="invisible-video-section"','class="invisible-video-section" data-pause-offscreen="true"').replace('class="invisible-video-toggle"','class="invisible-video-toggle" data-cursor="hide"');
  if(filename==='DYSLEXIA.html')invisibleContent=invisibleContent.replace('class="invisible-video-section"','class="invisible-video-section dyslexia-video-section"').replace('class="invisible-video-toggle"','class="invisible-video-toggle" data-cursor="hide"');
  blank=blank.replace('</style>',()=>invisibleCss+'</style>').replace(`<main class="zhurong-page" aria-label="${title}"></main>`,()=>`<main class="zhurong-page" aria-label="${title}">${invisibleContent}</main>`);
  const invisibleInteractions=await read('src/projects/invisible-design/interactions.js');
  blank=blank.replace('</body>',()=>`<script>${invisibleInteractions}</script></body>`);
 }
 if(filename==='INVISIBLE-DESIGN.html'){
  const documentCss=await read('src/projects/invisible-design/document.css');
  const documentContent=await read('src/projects/invisible-design/document.html');
  const documentInteractions=await read('src/projects/invisible-design/document.js');
  blank=blank.replace('<body>','<body class="invisible-detail">').replace('</style>',()=>documentCss+'</style>').replace('</main>',()=>documentContent+'</main>');
  blank=blank.replace('</body>',()=>`<script>${monitorCursorCode}\n${documentInteractions}</script></body>`);
 }
 if(filename==='DYSLEXIA.html'){
  const diagramsCss=await read('src/projects/dyslexia/diagrams.css');
  const diagramsContent=await read('src/projects/dyslexia/diagrams.html');
  const diagramsInteractions=await read('src/projects/dyslexia/diagrams.js');
  blank=blank.replace('<body>','<body class="dyslexia-detail">').replace('</style>',()=>diagramsCss+'</style>').replace('</main>',()=>diagramsContent+'</main>');
  blank=blank.replace('</body>',()=>`<script>${monitorCursorCode}\n${diagramsInteractions}</script></body>`);
 }
 const fullscreenVideo=filename==='DYSLEXIA.html'?'（宣讲）视频演示.mp4':'无感设计演示视频.mp4';
 await writeFile(resolve(root,filename),blank.replaceAll('{{twin-video}}','public/assets/小米汽车M7原型演示.mp4').replaceAll('{{twin-demo}}','public/projects/m7-digital-twin/demo/index.html').replaceAll('{{invisible-video}}',`public/assets/${fullscreenVideo}`).replaceAll('{{diagram-assets}}','public/assets'));await writeFile(resolve(root,'dist',filename),blank.replaceAll('{{twin-video}}','assets/小米汽车M7原型演示.mp4').replaceAll('{{twin-demo}}','projects/m7-digital-twin/demo/index.html').replaceAll('{{invisible-video}}',`assets/${fullscreenVideo}`).replaceAll('{{diagram-assets}}','assets'));
}
await optimizeBuild(root);
