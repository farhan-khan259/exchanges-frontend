import {readdir,readFile,writeFile} from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../dist');
async function walk(dir){const files=[];for(const f of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())files.push(...await walk(p));else if(f.name!=='sw.js')files.push(p);}return files;}
const files=await walk(root);const hash=createHash('sha256');for(const file of files)hash.update(await readFile(file));const cache='khata-shell-'+hash.digest('hex').slice(0,16),urls=files.map(f=>'/'+path.relative(root,f).replaceAll('\\','/'));
await writeFile(path.join(root,'sw.js'),`const CACHE=${JSON.stringify(cache)},URLS=${JSON.stringify(urls)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS))));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('khata-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==self.location.origin||u.pathname.startsWith('/api/')||e.request.method!=='GET')return;
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('/index.html')));return;}
if(URLS.includes(u.pathname))e.respondWith(caches.match(u.pathname).then(r=>r||fetch(e.request)));
});`);
