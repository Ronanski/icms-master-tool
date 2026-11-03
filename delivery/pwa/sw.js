/* Logic Sim service worker: keeps the installed page (Stable at /, Beta at /beta/) so the app starts at once and updates only when the user agrees.
   M31 (Mina, beta.80): the page is fetched with a fresh ?t= query (as the version check does). A plain fetch of the page, even with
   cache 'reload', could get the old page from the GitHub Pages CDN for up to 10 min after a deploy: Update now then kept the old Beta. */
const FRESH=()=>fetch(SCOPE+'?t='+Date.now(),{cache:'reload'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r});
const SCOPE=self.registration.scope,CACHE='logic-sim-'+SCOPE;
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>FRESH().then(r=>c.put(SCOPE,r))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const r=e.request;if(r.mode!=='navigate')return;const u=new URL(r.url);if(!u.href.startsWith(SCOPE))return;if(!SCOPE.endsWith('/beta/')&&u.pathname.indexOf('/beta/')>=0)return;
 e.respondWith(caches.open(CACHE).then(c=>c.match(SCOPE).then(hit=>hit||fetch(r).then(n=>{c.put(SCOPE,n.clone());return n}))))});
self.addEventListener('message',e=>{if(e.data==='update'){e.waitUntil(caches.open(CACHE).then(c=>FRESH().then(r=>c.put(SCOPE,r))).then(()=>self.clients.matchAll()).then(cl=>cl.forEach(x=>x.postMessage('updated'))).catch(()=>self.clients.matchAll().then(cl=>cl.forEach(x=>x.postMessage('failed')))))}});
