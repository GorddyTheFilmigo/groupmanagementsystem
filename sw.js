const CACHE='groupflow-v1';

self.addEventListener('install',e=>{
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch',e=>{
  // Only cache GET requests
  if(e.request.method!=='GET')return;
  e.respondWith(
    fetch(e.request)
      .then(response=>{
        // Clone and cache successful responses
        if(response&&response.status===200){
          const clone=response.clone();
          caches.open(CACHE).then(cache=>cache.put(e.request,clone));
        }
        return response;
      })
      .catch(()=>caches.match(e.request))
  );
});