export async function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    console.log('Service workers enabled. Registering...');
    const { serviceWorker } = navigator;
    try {
      const registration = await serviceWorker.register('/serviceWorker.js');
      console.log('Registration successful: ', registration);
      createButtonAndHookUpEvent(registration);
    } catch (e) {
      console.error('Registration failed: ', e);
    }
  }
}

function createButtonAndHookUpEvent(registration) {
  const button = document.querySelector('#update-sw-button');
  if (!button) {
    const newButton = document.createElement('button');
    newButton.value = 'Restart SW';
    newButton.addEventListener('click', async ev => {
      await registration.update();
      console.log('updated sw');
    });
    newButton.setAttribute(
      'style',
      `position: absolute; bottom: 0; left: 0; height: 50px; width: 50px; background-color: gray;`
    );

    document.body.appendChild(newButton);
  }
}
