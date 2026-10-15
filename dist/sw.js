const CACHE="khata-shell-0d04d08d90ba9c52",URLS=["/app-icon-192.png","/app-icon-512.png","/app-icon.svg","/assets/index-BHJpwziM.css","/assets/index-CNPKNq89.js","/fonts/Bold.ttf","/fonts/Regular.ttf","/index.html","/manifest.webmanifest","/offline-engine.js"];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS))));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('khata-shell-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==self.location.origin||u.pathname.startsWith('/api/')||e.request.method!=='GET')return;
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('/index.html')));return;}
if(URLS.includes(u.pathname))e.respondWith(caches.match(u.pathname).then(r=>r||fetch(e.request)));
});