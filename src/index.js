import 'core-js/stable';
import 'regenerator-runtime/runtime';
import './global.css';
import App from './components/App.svelte';

document.querySelector('.viz-menu-button').addEventListener('click', (e) => {
  e.preventDefault();
  e.currentTarget.classList.toggle('open');
});

const hostElement = document.querySelector('#vizbox') || document.body;

const app = new App({
  target: hostElement,
});

export default app;
