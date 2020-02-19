self.addEventListener('install', async ev => {
  await ev.waitUntil(
    new Promise(resolve => {
      console.log('installing...');
      resolve();
    })
  );
  console.log('installed...');
});
