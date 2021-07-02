/*global __VERSION__*/
import './publicPath';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import './global.css';
import App from './App.svelte';

const hostElement = document.querySelector('#vizbox') || document.body;

const app = new App({
  target: hostElement,
});

console.log('running version:', __VERSION__);
window.COVIDCAST_VERSION = __VERSION__;

export default app;
