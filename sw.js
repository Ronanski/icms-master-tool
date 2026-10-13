/* Logic Sim service worker: keeps the installed page (Stable at /, Beta at /beta/) so the app starts at once and updates only when the user agrees. */
const SCOPE=self.registration.scope,CACHE='logic-sim-'+SCOPE;
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.add(new Request(SCOPE,{cache:'reload'}))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const r=e.request;if(r.mode!=='navigate')return;const u=new URL(r.url);if(!u.href.startsWith(SCOPE))return;if(!SCOPE.endsWith('/beta/')&&u.pathname.indexOf('/beta/')>=0)return;
 e.respondWith(caches.open(CACHE).then(c=>c.match(SCOPE).then(hit=>hit||fetch(r).then(n=>{c.put(SCOPE,n.clone());return n}))))});
self.addEventListener('message',e=>{if(e.data==='update'){e.waitUntil(caches.open(CACHE).then(c=>fetch(SCOPE,{cache:'reload'}).then(r=>c.put(SCOPE,r))).then(()=>self.clients.matchAll()).then(cl=>cl.forEach(x=>x.postMessage('updated'))).catch(()=>self.clients.matchAll().then(cl=>cl.forEach(x=>x.postMessage('failed')))))}});
