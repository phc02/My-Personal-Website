import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
async function scan(folder) {
  const output=[];
  for(const entry of await readdir(folder,{withFileTypes:true})){
    const file=`${folder}/${entry.name}`;
    if(entry.isDirectory())output.push(...await scan(file));
    else if(/\.(js|mjs|cjs)$/.test(file))output.push(file);
  }
  return output;
}
const files=[...(await scan('src')),...(await scan('scripts')),'build.mjs','serve.mjs','public/project-transition.js','public/projects/zhurong/assets/header.js'];
for(const file of files){const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
console.log(`Syntax checked ${files.length} JavaScript files.`);
