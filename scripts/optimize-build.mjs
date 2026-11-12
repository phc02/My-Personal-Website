import {readFile, writeFile, readdir, mkdir, rm, rmdir, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve, relative, dirname, extname, posix, sep} from 'node:path';

const hash = data => createHash('sha256').update(data).digest('hex');
const extensions = {'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','image/svg+xml':'.svg','image/gif':'.gif','font/woff2':'.woff2','font/woff':'.woff','font/ttf':'.ttf'};
async function filesIn(folder) {
  const output = [];
  for (const item of await readdir(folder, {withFileTypes: true})) {
    if (item.isSymbolicLink()) continue;
    const path = resolve(folder, item.name);
    if (item.isDirectory()) output.push(...await filesIn(path));
    else if (item.isFile()) output.push(path);
  }
  return output;
}

export async function optimizeBuild(root) {
  const publicRoot = resolve(root, 'public'), deployRoot = resolve(root, 'dist');
  const generated = resolve(publicRoot, 'generated');
  if (!generated.startsWith(publicRoot + sep)) throw new Error('Invalid generated directory');
  await rm(generated, {recursive: true, force: true}); await mkdir(generated, {recursive: true});
  const variants = JSON.parse(await readFile(resolve(root, 'src/asset-variants.json'), 'utf8'));
  const assetByHash = new Map(), decoded = new Map(), emitted = new Set();
  const publicFiles = await filesIn(publicRoot);
  for (const path of publicFiles) {
    if (!/\.(png|webp|jpe?g|svg|gif|woff2?|ttf)$/i.test(path)) continue;
    const rel = relative(publicRoot, path).split(sep).join('/');
    const digest = hash(await readFile(path));
    if (!assetByHash.has(digest)) assetByHash.set(digest, variants[rel] || rel);
  }
  async function emit(body, extension) {
    const name = `generated/${hash(body).slice(0,20)}${extension}`;
    if (!emitted.has(name)) {
      emitted.add(name); await mkdir(resolve(deployRoot, 'generated'), {recursive: true});
      await Promise.all([writeFile(resolve(publicRoot, name), body), writeFile(resolve(deployRoot, name), body)]);
    }
    return name;
  }
  const vendors = await Promise.all(['gsap.min.js','ScrollTrigger.min.js','ScrambleTextPlugin.min.js'].map(async name => ({name, code: await readFile(resolve(publicRoot, 'vendor', name), 'utf8')})));
  const routes = ['SPECIAL-intro.html','ZHURONG.html','M7-MONITOR.html','M7-DIGITAL-TWIN.html','INVISIBLE-DESIGN.html','DYSLEXIA.html'];
  const pageSizes = [];
  for (const local of [true, false]) {
    const prefix = local ? 'public/' : '', outputRoot = local ? root : deployRoot;
    for (const route of routes) {
      const path = resolve(outputRoot, route);
      let html = await readFile(path, 'utf8'); const before = Buffer.byteLength(html);
      if (local) html = html.replace(/((?:src|href|poster)=["'])assets\//g, '$1public/assets/');
      if (route === 'ZHURONG.html') html = html.replaceAll('./assets/', `${prefix}projects/zhurong/assets/`);
      const dataPattern = /data:([^;,\s]+);base64,([A-Za-z0-9+/=]+)/g;
      const replacements = [];
      for (const match of html.matchAll(dataPattern)) {
        // CSS masks require CORS even for images. file:// cannot supply it,
        // so keep local-preview masks embedded while hosted pages cache files.
        if (local && /(?:-webkit-)?mask(?:-image)?\s*:\s*url\((?:&quot;|["'])?$/.test(html.slice(Math.max(0, match.index - 80), match.index))) continue;
        const key = hash(match[2]); let rel = decoded.get(key);
        if (!rel) {
          const data = Buffer.from(match[2], 'base64');
          rel = assetByHash.get(hash(data));
          if (!rel) rel = await emit(data, extensions[match[1]] || '.bin');
          decoded.set(key, rel);
        }
        replacements.push({start: match.index, end: match.index + match[0].length, value: prefix + rel});
      }
      if (replacements.length) {
        const chunks = []; let offset = 0;
        for (const item of replacements) { chunks.push(html.slice(offset, item.start), item.value); offset = item.end; }
        chunks.push(html.slice(offset)); html = chunks.join('');
      }
      // Continue to honor the user's exact original images; only lossless variants are substituted.
      for (const [original, variant] of Object.entries(variants)) html = html.replaceAll(prefix + original, prefix + variant);
      // Hosted builds can load large videos from R2.
const videoBase = process.env.VIDEO_ASSET_BASE_URL?.trim().replace(/\/+$/, '');

if (!local && videoBase) {
  if (new URL(videoBase).protocol !== 'https:') {
    throw new Error('VIDEO_ASSET_BASE_URL must use HTTPS');
  }

  for (const filename of [
    '（宣讲）视频演示.mp4',
    '小米汽车M7原型演示.mp4',
    '无感设计演示视频-web.mp4',
  ]) {
    html = html.replaceAll(
      `assets/${filename}`,
      `${videoBase}/${encodeURIComponent(filename)}`,
    );
  }
}
      const continuation = [html.indexOf('zhurong-followups:start'), html.indexOf('monitor-followups'), html.indexOf('id="twin-development-flow"')].filter(n => n >= 0);
      const belowFold = continuation.length ? Math.min(...continuation) : Infinity;
      html = html.replace(/<img\b[^>]*>/g, (tag, offset) => {
        const lazy = (offset >= belowFold || route === 'SPECIAL-intro.html') && !/fetchpriority="high"/.test(tag);
        const attrs = (!/\bdecoding=/.test(tag) ? ' decoding="async"' : '') + (lazy && !/\bloading=/.test(tag) ? ' loading="lazy"' : '');
        return tag.replace(/(\/?>)$/, attrs + '$1');
      });
      const blocks = [...html.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>|<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
      const chunks = []; let offset = 0;
      for (const block of blocks) {
        chunks.push(html.slice(offset, block.index)); offset = block.index + block[0].length;
        if (block[2] !== undefined) {
          const css = block[2].replace(/url\((['"]?)([^)'"\s]+)\1\)/g, (whole, quote, url) => {
            if (/^(data:|https?:|\/\/|#|%23)/.test(url)) return whole;
            const asset = local && url.startsWith('public/') ? url.slice(7) : url.replace(/^\.\//,'');
            return `url(${quote}${posix.relative('generated', asset)}${quote})`;
          });
          const name = await emit(css, '.css'); chunks.push(`<link rel="stylesheet" href="${prefix}${name}"${block[1]}>`);
        } else if (/\bsrc=|\btype=["'](?:application\/ld\+json|importmap)/.test(block[3]) || !block[4].trim()) chunks.push(block[0]);
        else {
          const early = block.index < html.indexOf('</head>');
          let code = block[4]; const refs = [];
          const emitScript = async segment => {
            if (!segment.trim()) return;
            const name = await emit(segment, '.js');
            refs.push(`<script${early ? '' : ' defer'} src="${prefix}${name}"${block[3]}></script>`);
          };
          // Preserve execution order within combined scripts. Moving GSAP in
          // front of the React bundle changes the engine ScrollTrigger binds to.
          while (code.length) {
            const next = vendors.map(vendor => ({vendor, at:code.indexOf(vendor.code)})).filter(item => item.at >= 0).sort((a,b) => a.at - b.at)[0];
            if (!next) { await emitScript(code); break; }
            await emitScript(code.slice(0, next.at));
            refs.push(`<script${early ? '' : ' defer'} src="${prefix}vendor/${next.vendor.name}"></script>`);
            code = code.slice(next.at + next.vendor.code.length);
          }
          chunks.push(refs.join('\n'));
        }
      }
      chunks.push(html.slice(offset)); html = chunks.join('');
      // Only the font required for the current header is requested ahead of layout.
      html = html.replace('</head>', `<link rel="preload" href="${prefix}assets/space-grotesk-regular.ttf" as="font" type="font/ttf" crossorigin>\n</head>`);
      await writeFile(path, html);
      if (!local) pageSizes.push({route, before, after: Buffer.byteLength(html)});
    }
  }
  await writeFile(resolve(deployRoot, 'index.html'), await readFile(resolve(deployRoot, 'SPECIAL-intro.html')));

  // Walk the deploy pages, CSS URLs and runtime asset literals. Keep only reachable files.
  const keep = new Set(), queue = routes.concat('index.html').map(file => ({file, documentBase: ''}));
  ['robots.txt','_headers','.nojekyll'].forEach(file => keep.add(file));
  const visited = new Set();
  const literal = /["'`]([^"'`\n<>]*?\.(?:png|jpe?g|webp|svg|gif|mp4|webm|woff2?|ttf|css|js|html|geojson|json))(?:\?[^"'`\n<>]*)?["'`]/gi;
  while (queue.length) {
    const {file, documentBase} = queue.shift(); const key = file + '|' + documentBase;
    if (visited.has(key)) continue; visited.add(key);
    const path = resolve(deployRoot, file);
    if (!path.startsWith(deployRoot + sep)) continue;
    let info; try { info = await stat(path); } catch { continue; }
    if (!info.isFile()) continue; keep.add(file);
    if (!/\.(html|css|js|json)$/i.test(file)) continue;
    const text = (await readFile(path, 'utf8')).replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&amp;', '&');
    const base = /\.(css|html)$/.test(file) ? posix.dirname(file) : documentBase;
    const candidates = [...text.matchAll(literal)].map(m => m[1]);
    if (file.endsWith('.css')) candidates.push(...[...text.matchAll(/url\((['"]?)([^)'"\s]+)\1\)/g)].map(m => m[2]));
    for (let candidate of candidates) {
      if (/^(?:[a-z]+:|\/\/|#|%23)/i.test(candidate) || candidate.includes('${') || candidate.includes('&quot;')) continue;
      try { candidate = decodeURIComponent(candidate); } catch { continue; }
      const target = posix.normalize(posix.join(base, candidate.replace(/^\//,'')));
      queue.push({file: target, documentBase: file.endsWith('.html') ? posix.dirname(file) : documentBase});
    }
  }
  // The map demo also constructs GeoJSON paths dynamically; retain its complete small runtime.
  for (const path of await filesIn(resolve(deployRoot, 'projects/m7-digital-twin/demo'))) keep.add(relative(deployRoot, path).split(sep).join('/'));
  const all = await filesIn(deployRoot); let removedBytes = 0, removedFiles = 0;
  for (const path of all) {
    const rel = relative(deployRoot, path).split(sep).join('/');
    if (/license|ofl/i.test(rel)) keep.add(rel);
    if (keep.has(rel)) continue;
    if (!path.startsWith(deployRoot + sep)) throw new Error('Invalid deploy cleanup target');
    removedBytes += (await stat(path)).size; removedFiles++; await rm(path);
  }
  async function removeEmpty(folder) {
    if (!folder.startsWith(deployRoot + sep) && folder !== deployRoot) throw new Error('Invalid empty-directory cleanup target');
    for (const item of await readdir(folder,{withFileTypes:true})) if (item.isDirectory() && !item.isSymbolicLink()) await removeEmpty(resolve(folder,item.name));
    if (folder !== deployRoot && (await readdir(folder)).length === 0) await rmdir(folder);
  }
  await removeEmpty(deployRoot);
  const deployed = await filesIn(deployRoot);
  const report = {generatedAt: new Date().toISOString(), pageSizes, deployFiles: deployed.length, deployBytes: (await Promise.all(deployed.map(p => stat(p)))).reduce((sum, info) => sum + info.size, 0), removedFiles, removedBytes};
  await mkdir(resolve(root, 'docs'), {recursive: true});
  await writeFile(resolve(root, 'docs/build-report.json'), JSON.stringify(report, null, 2));
  console.log(`Deploy: ${report.deployFiles} files, ${(report.deployBytes / 1e6).toFixed(1)} MB; removed ${removedFiles} unreferenced build files.`);
}
