import App from './App.svelte';
require('es6-shim');
require('url-search-params-polyfill');
import 'whatwg-fetch'
import 'polyfill-array-includes';

const hostElement = document.querySelector('#vizbox') || document.body;

const app = new App({
  target: hostElement,
});

export default app;
