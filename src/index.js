/*global __VERSION__*/
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import './global.css';
import App from './components/App.svelte';

const hostElement = document.querySelector('#vizbox') || document.body;

const app = new App({
  target: hostElement,
});

console.log('running version:', __VERSION__);

export default app;

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
