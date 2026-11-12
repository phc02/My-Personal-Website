/* Authoring only: snapshot the exact desktop artwork before mobile virtualization. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const {mkdirSync,writeFileSync}=require('node:fs');
const {resolve}=require('node:path');
const root=resolve(__dirname,'..'),output=resolve(root,'.tmp/case-chapter-captures');
mkdirSync(output,{recursive:true});
(async()=>{
 const server=spawn(process.execPath,['serve.mjs'],{cwd:root,env:{...process.env,PORT:'4295'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no)});
  browser=await chromium.launch({channel:'chrome',headless:true});const manifest={};
  for(const [route,selector] of [['ZHURONG','.zhurong-followups > .zhurong-case-section'],['M7-MONITOR','.monitor-case-section']]){
   const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'reduce'});
   await page.route('https://**/*',request=>request.abort());
   await page.goto(`http://127.0.0.1:4295/${route}.html`,{waitUntil:'load'});
   await page.addStyleTag({content:'.hero-header,.header-safety,.monitor-read-progress,.cursor-dot-trail,.navigation-page{visibility:hidden!important}'});
   await page.evaluate(()=>document.fonts.ready);manifest[route]=[];
   const chapters=page.locator(selector);
   for(let index=0;index<await chapters.count();index++){
    const chapter=chapters.nth(index);await chapter.scrollIntoViewIfNeeded();
    await chapter.evaluate(async element=>{await Promise.all([...element.querySelectorAll('img')].map(image=>{image.loading='eager';return image.decode().catch(()=>{});}));});
    await page.evaluate(()=>document.fonts.ready);
    const data=await chapter.evaluate(element=>({label:element.getAttribute('aria-label')||'',text:element.innerText,width:element.getBoundingClientRect().width,height:element.getBoundingClientRect().height}));
    const name=`${route}-${index}.png`;await chapter.screenshot({path:resolve(output,name),animations:'disabled',scale:'css'});
    manifest[route].push({...data,file:name});console.log('Captured',route,index);
   }
   await page.close();
  }
  writeFileSync(resolve(output,'manifest.json'),JSON.stringify(manifest,null,2));
 }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1});
