import 'core-js/stable';
import './global.css';
import App from './components/App.svelte';

const hostElement = document.querySelector('#vizbox') || document.body;

const app = new App({
  target: hostElement,
});

export default app;
