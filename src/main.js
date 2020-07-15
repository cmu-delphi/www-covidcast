/*
Polyfills for IE compatibility
-https://github.com/paulmillr/es6-shim
-https://www.npmjs.com/package/url-search-params-polyfill
-https://github.com/github/fetch
-https://www.npmjs.com/package/polyfill-array-includes
*/
import 'es6-shim';
import 'url-search-params-polyfill';
import 'whatwg-fetch';
import 'polyfill-array-includes';

import App from './App.svelte';

const hostElement = document.querySelector('#vizbox') || document.body;

const app = new App({
  target: hostElement,
});

export default app;
