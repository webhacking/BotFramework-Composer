export async function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    console.log('Service workers enabled. Registering...');
    const { serviceWorker } = navigator;
    try {
      const registration = await serviceWorker.register('/serviceWorker.js');
      console.log('Registration successful: ', registration);
    } catch (e) {
      console.error('Registration failed: ', e);
    }
  }
}
