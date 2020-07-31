import 'core-js/stable';
import 'regenerator-runtime/runtime';
import './global.css';
import App from './App.svelte';

const hostElement = document.querySelector('#vizbox') || document.body;

const app = new App({
  target: hostElement,
});

export default app;
