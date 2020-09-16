/*global __VERSION__, $*/
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import './global.css';
import App from './App.svelte';

const hostElement = document.querySelector('#vizbox') || document.body;

const app = new App({
  target: hostElement,
});

console.log('running version:', __VERSION__);

export default app;



// hopefully runs after the main.js thing
$(() => {
  const nav = document.querySelector('.viz-header > nav[aria-hidden]');
  if (nav) {
    // insert where it belongs
    nav.parentElement.insertBefore(nav, nav.parentElement.children[1]);
  }
});
