// Optional authoring step: the normal website build uses the compiled app.js.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
const modules=process.env.ZHURONG_NODE_MODULES||path.join(os.homedir(),'Documents/AIGC/scroll-demo/node_modules');
let esbuild;
try { esbuild=require('esbuild'); }
catch { esbuild=require(path.join(modules,'.pnpm/esbuild@0.25.0/node_modules/esbuild')); }
esbuild.buildSync({absWorkingDir:root,entryPoints:['src/projects/zhurong/main.tsx'],bundle:true,platform:'browser',format:'iife',jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'},nodePaths:[path.join(root,'node_modules'),modules],outfile:'public/projects/zhurong/assets/app.js'});
fs.copyFileSync(path.join(root,'src/projects/zhurong/figma.css'),path.join(root,'public/projects/zhurong/assets/figma.css'));
console.log('Compiled Zhurong hero and synchronized its styles.');
