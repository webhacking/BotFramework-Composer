self.addEventListener('install', ev => {
  ev.waitUntil(async function() {
    await new Promise(resolve => {
      console.log('installing...');
      resolve();
    });
    console.log('installed...');
  });
});

self.addEventListener('fetch', ev => {
  ev.waitUntil(async function() {
    await new Promise(resolve => {
      console.log(ev);
      console.log(ev.request);
      resolve();
    });
  });
});
