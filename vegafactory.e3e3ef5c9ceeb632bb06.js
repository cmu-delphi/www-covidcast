(self.webpackChunkwww_covidcast=self.webpackChunkwww_covidcast||[]).push([[457],{1017:(e,t,n)=>{"use strict";n.r(t),n.d(t,{cachedTime:()=>h,cachedNumber:()=>b,default:()=>m});var r=n(8257),o=n(7539),c=n(2781),i=n(3538),u=n(9698),s=n(3776),a=n(3368);function f(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function l(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}(0,i.projection)("albersUsaTerritories",(function(){const e=(0,u.geoAlbersUsaTerritories)();return e.fitExtent=function(t,n){return(0,s.qg)(e,t,n)},e.fitSize=function(t,n){return(0,s.mF)(e,t,n)},e.fitWidth=function(t,n){return(0,s.V6)(e,t,n)},e.fitHeight=function(t,n){return(0,s.rf)(e,t,n)},e}));const p=new Map;function h(e,t){const n="d:".concat(t);if(p.has(n))return p.get(n)(e);const o=(0,r.i$)(t);return p.set(n,o),o(e)}function b(e,t){const n="n:".concat(t);if(p.has(n))return p.get(n)(e);const r=(0,o.WU)(t);return p.set(n,r),r(e)}function m(e,t,n){return(0,c.ZP)(e,t,function(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?f(Object(n),!0).forEach((function(t){l(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):f(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}({actions:!1,logLevel:i.Error},n))}(0,i.expressionFunction)("cachedTime",h),(0,i.expressionFunction)("cachedNumber",b),(0,i.expressionFunction)("customExtent",(function(e,t){if(0===e.length)return{min:null,max:null,range:0};let n=Number.POSITIVE_INFINITY,r=Number.NEGATIVE_INFINITY;for(const o of e){const e=null!=o?o[t]:null;null!=e&&(n=Math.min(n,+e),r=Math.max(r,+e))}return{min:n,max:r,range:r-n}})),(0,i.expressionFunction)("customObjChecks",(function(e,...t){return 0===t.length||t.every((([t,n,r])=>{const o=null!=e?e[t]:null;switch(n){case"==":return o==r;case"<":return o<r;case">":return o>r;case">=":return o>=r;case"<=":return o<=r;default:return o===r}}))})),(0,i.expressionFunction)("patchPickedItem",(function(e){return"touchmove"!==e.type&&"touchend"!==e.type||(e.item=e.vega.view()._handler.pickEvent(e.changedTouches[0]),e.vega.item=()=>e.item),e.item})),(0,i.expressionFunction)("paddingSquareCenter",(function([e,t],n,r,o,c,i,u,s){const a=e-o.left-o.right,f=t-o.top-o.bottom,l=n.length+2*c,p=r.length+2*i,h=a/l/u,b=f/p/s,m=Math.min(h,b),g=l*m*u,d=p*m*s;return{left:o.left+(a-g)/2,right:o.right+(a-g)/2,top:o.top+(f-d)/2,bottom:o.bottom+(f-d)/2}})),(0,i.expressionFunction)("array2object",(function(e,t){const n={};for(const r of e)n[r[t]]=r;return n})),(0,i.expressionFunction)("customInFilter",((e,t,n)=>e.filter((e=>n.includes(e[t]))))),(0,i.expressionFunction)("customCountDays",((e,t)=>a.Z.count(e,t)))}}]);