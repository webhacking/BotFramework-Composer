self.addEventListener('install', ev => {
  ev.waitUntil(
    new Promise(resolve => {
      console.log('installing...');
      resolve();
    })
  );
  console.log('installed');
});

self.addEventListener('fetch', ev => {
  console.log('fetching ', ev.request.url);
  ev.respondWith(fetch(ev.request));
});
