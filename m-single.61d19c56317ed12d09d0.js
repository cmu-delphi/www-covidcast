(window.webpackJsonp=window.webpackJsonp||[]).push([[10],{301:function(e,t,n){"use strict";n.r(t);var c=n(0),a=n(314),i=n(60),r=n(3),l=n(1),o=n(318),s=n(309),u=n(315),b=n(105),d=n(307),O=n(316);n(282);function j(e,t,n){const c=e.slice();return c[11]=t[n],c[13]=n,c}function p(e){let t,n,a,i,r,l,o,s,u=e[11].displayName+"",b=(null!=e[7][e[13]]?e[0].formatValue(e[7][e[13]]):"?")+"",O=0===e[13]&&function(e){let t,n,a,i,r=Object(d.b)(e[5]?e[5]:e[1])+"";return{c(){t=Object(c.u)("td"),n=Object(c.Z)("on "),a=Object(c.Z)(r),Object(c.g)(t,"class","hint svelte-1jszwbg"),Object(c.g)(t,"rowspan",i=e[4].length)},m(e,i){Object(c.F)(e,t,i),Object(c.e)(t,n),Object(c.e)(t,a)},p(e,n){34&n&&r!==(r=Object(d.b)(e[5]?e[5]:e[1])+"")&&Object(c.S)(a,r),16&n&&i!==(i=e[4].length)&&Object(c.g)(t,"rowspan",i)},d(e){e&&Object(c.t)(t)}}}(e);return{c(){t=Object(c.u)("tr"),n=Object(c.u)("td"),a=Object(c.Z)(u),i=Object(c.V)(),r=Object(c.u)("td"),l=Object(c.Z)(b),o=Object(c.V)(),O&&O.c(),s=Object(c.V)(),Object(c.g)(n,"class","legend svelte-1jszwbg"),Object(c.U)(n,"--color",0===e[13]?"grey":e[11].color),Object(c.g)(r,"class","key-fact svelte-1jszwbg")},m(e,u){Object(c.F)(e,t,u),Object(c.e)(t,n),Object(c.e)(n,a),Object(c.e)(t,i),Object(c.e)(t,r),Object(c.e)(r,l),Object(c.e)(t,o),O&&O.m(t,null),Object(c.e)(t,s)},p(e,t){16&t&&u!==(u=e[11].displayName+"")&&Object(c.S)(a,u),16&t&&Object(c.U)(n,"--color",0===e[13]?"grey":e[11].color),129&t&&b!==(b=(null!=e[7][e[13]]?e[0].formatValue(e[7][e[13]]):"?")+"")&&Object(c.S)(l,b),0===e[13]&&O.p(e,t)},d(e){e&&Object(c.t)(t),O&&O.d()}}}function g(e){let t,n,a,i,r,l,b,d,O,g,m,f,v,h,y,w,$,x,S,k=e[0].plotTitleText+"";b=new s.a({props:{sensor:e[0]}});let V=e[4],z=[];for(let t=0;t<V.length;t+=1)z[t]=p(j(e,V,t));return $=new u.a({props:{data:e[6].data,spec:e[6].spec,noDataText:e[6].noDataText,signals:{currentDate:e[1],highlightTimeValue:e[3]},signalListeners:["highlight"],tooltip:o.a,tooltipProps:{sensor:e[0]}}}),$.$on("signal",(function(){Object(c.G)(e[2])&&e[2].apply(this,arguments)})),{c(){t=Object(c.u)("section"),n=Object(c.u)("div"),a=Object(c.u)("h3"),i=Object(c.Z)(k),r=Object(c.V)(),l=Object(c.u)("div"),Object(c.n)(b.$$.fragment),d=Object(c.V)(),O=Object(c.u)("div"),g=Object(c.V)(),m=Object(c.u)("table"),f=Object(c.u)("colgroup"),f.innerHTML='<col class="locationCol svelte-1jszwbg"/> \n      <col class="valueCol svelte-1jszwbg"/> \n      <col class="dateCol svelte-1jszwbg"/>',v=Object(c.V)(),h=Object(c.u)("tbody");for(let e=0;e<z.length;e+=1)z[e].c();y=Object(c.V)(),w=Object(c.u)("main"),Object(c.n)($.$$.fragment),Object(c.g)(a,"class","uk-card-title uk-margin-remove-bottom"),Object(c.g)(l,"class","toolbar svelte-1jszwbg"),Object(c.g)(n,"class","uk-card-header svelte-1jszwbg"),Object(c.g)(O,"class","grow svelte-1jszwbg"),Object(c.g)(m,"class","key svelte-1jszwbg"),Object(c.bb)(m,"single",1===e[4].length),Object(c.g)(w,"class","vega-wrapper svelte-1jszwbg"),Object(c.g)(t,"class","uk-card uk-card-body uk-card-default uk-card-small card svelte-1jszwbg"),Object(c.g)(t,"data-testid",x="sensor-"+e[0].key)},m(e,o){Object(c.F)(e,t,o),Object(c.e)(t,n),Object(c.e)(n,a),Object(c.e)(a,i),Object(c.e)(n,r),Object(c.e)(n,l),Object(c.I)(b,l,null),Object(c.e)(t,d),Object(c.e)(t,O),Object(c.e)(t,g),Object(c.e)(t,m),Object(c.e)(m,f),Object(c.e)(m,v),Object(c.e)(m,h);for(let e=0;e<z.length;e+=1)z[e].m(h,null);Object(c.e)(t,y),Object(c.e)(t,w),Object(c.I)($,w,null),S=!0},p(n,[a]){e=n,(!S||1&a)&&k!==(k=e[0].plotTitleText+"")&&Object(c.S)(i,k);const r={};if(1&a&&(r.sensor=e[0]),b.$set(r),179&a){let t;for(V=e[4],t=0;t<V.length;t+=1){const n=j(e,V,t);z[t]?z[t].p(n,a):(z[t]=p(n),z[t].c(),z[t].m(h,null))}for(;t<z.length;t+=1)z[t].d(1);z.length=V.length}16&a&&Object(c.bb)(m,"single",1===e[4].length);const l={};64&a&&(l.data=e[6].data),64&a&&(l.spec=e[6].spec),64&a&&(l.noDataText=e[6].noDataText),10&a&&(l.signals={currentDate:e[1],highlightTimeValue:e[3]}),1&a&&(l.tooltipProps={sensor:e[0]}),$.$set(l),(!S||1&a&&x!==(x="sensor-"+e[0].key))&&Object(c.g)(t,"data-testid",x)},i(e){S||(Object(c.cb)(b.$$.fragment,e),Object(c.cb)($.$$.fragment,e),S=!0)},o(e){Object(c.db)(b.$$.fragment,e),Object(c.db)($.$$.fragment,e),S=!1},d(e){e&&Object(c.t)(t),Object(c.r)(b),Object(c.s)(z,e),Object(c.r)($)}}}function m(e,t,n){let a;Object(c.l)(e,r.D,(e=>n(10,a=e)));let i,l,{sensor:o}=t,{date:s}=t,{onHighlight:u}=t,{highlightTimeValue:d}=t,j=a[0],p=a[1],{selections:g=[]}=t,m=g.map((()=>null));return e.$$set=e=>{"sensor"in e&&n(0,o=e.sensor),"date"in e&&n(1,s=e.date),"onHighlight"in e&&n(2,u=e.onHighlight),"highlightTimeValue"in e&&n(3,d=e.highlightTimeValue),"selections"in e&&n(4,g=e.selections)},e.$$.update=()=>{if(8&e.$$.dirty&&n(5,i=null!=d?Object(b.g)(d):null),1792&e.$$.dirty&&(j.getTime()!==a[0].getTime()&&n(8,j=a[0]),p.getTime()!==a[1].getTime()&&n(9,p=a[1])),785&e.$$.dirty&&n(6,l=Object(O.c)(o,g,j,p)),114&e.$$.dirty){const e=Object(b.e)(i||s);Promise.resolve(l.data).then((t=>{n(7,m=g.map((n=>{const c=t.find((t=>String(t.time_value)===e&&t.geo_value===n.info.propertyId));return c?c.value:null})))}))}},[o,s,u,d,g,i,l,m,j,p,a]}class f extends c.b{constructor(e){super(),Object(c.E)(this,e,m,g,c.P,{sensor:0,date:1,onHighlight:2,highlightTimeValue:3,selections:4})}}var v=f,h=n(37);n(283);function y(e,t,n){const c=e.slice();return c[9]=t[n],c}function w(e,t){let n,a,i;return a=new v({props:{sensor:t[9],date:t[2],selections:t[0],onHighlight:O.b,highlightTimeValue:t[3]}}),{key:e,first:null,c(){n=Object(c.v)(),Object(c.n)(a.$$.fragment),this.first=n},m(e,t){Object(c.F)(e,n,t),Object(c.I)(a,e,t),i=!0},p(e,t){const n={};4&t&&(n.date=e[2]),1&t&&(n.selections=e[0]),8&t&&(n.highlightTimeValue=e[3]),a.$set(n)},i(e){i||(Object(c.cb)(a.$$.fragment,e),i=!0)},o(e){Object(c.db)(a.$$.fragment,e),i=!1},d(e){e&&Object(c.t)(n),Object(c.r)(a,e)}}}function $(e){let t,n,r,o,s,u,b,d=[],O=new Map;r=new a.a({props:{placeholder:e[1]?"Compare with...":"Search for a location...",items:i.e,selectedItems:e[0],labelFieldName:"displayName",maxItemsToShowInList:"5",colorFieldName:"color",filterItem:e[4],maxSelections:Math.min(h.f.length+1,4)}}),r.$on("add",e[5]),r.$on("remove",e[6]),r.$on("change",e[7]);let j=l.o;const p=e=>e[9].key;for(let t=0;t<j.length;t+=1){let n=y(e,j,t),c=p(n);O.set(c,d[t]=w(c,n))}return{c(){t=Object(c.u)("div"),n=Object(c.u)("div"),Object(c.n)(r.$$.fragment),o=Object(c.V)(),s=Object(c.u)("div"),u=Object(c.u)("div");for(let e=0;e<d.length;e+=1)d[e].c();Object(c.g)(n,"class","search-container svelte-14y7tpq"),Object(c.g)(u,"class","card-grid svelte-14y7tpq"),Object(c.g)(s,"class","grid-wrapper svelte-14y7tpq"),Object(c.g)(t,"class","root base-font-size svelte-14y7tpq")},m(e,a){Object(c.F)(e,t,a),Object(c.e)(t,n),Object(c.I)(r,n,null),Object(c.e)(t,o),Object(c.e)(t,s),Object(c.e)(s,u);for(let e=0;e<d.length;e+=1)d[e].m(u,null);b=!0},p(e,[t]){const n={};if(2&t&&(n.placeholder=e[1]?"Compare with...":"Search for a location..."),1&t&&(n.selectedItems=e[0]),r.$set(n),13&t){const n=l.o;Object(c.B)(),d=Object(c.eb)(d,t,p,1,e,n,O,u,c.M,w,null,y),Object(c.k)()}},i(e){if(!b){Object(c.cb)(r.$$.fragment,e);for(let e=0;e<j.length;e+=1)Object(c.cb)(d[e]);b=!0}},o(e){Object(c.db)(r.$$.fragment,e);for(let e=0;e<d.length;e+=1)Object(c.db)(d[e]);b=!1},d(e){e&&Object(c.t)(t),Object(c.r)(r);for(let e=0;e<d.length;e+=1)d[e].d()}}}function x(e,t,n){let a,i,l,o;Object(c.l)(e,r.m,(e=>n(0,a=e))),Object(c.l)(e,r.o,(e=>n(1,i=e))),Object(c.l)(e,r.i,(e=>n(2,l=e))),Object(c.l)(e,r.u,(e=>n(3,o=e)));let s;return e.$$.update=()=>{1&e.$$.dirty&&(s=new Set(a.map((e=>e.info.level))))},[a,i,l,o,function(e){return 0===s.size||s.has(e.level)},e=>Object(r.b)(e.detail),e=>Object(r.y)(e.detail.info),e=>Object(r.A)(e.detail)]}class S extends c.b{constructor(e){super(),Object(c.E)(this,e,x,$,c.P,{})}}t.default=S},306:function(e,t,n){"use strict";n.d(t,"b",(function(){return i})),n.d(t,"f",(function(){return r})),n.d(t,"d",(function(){return l})),n.d(t,"a",(function(){return o})),n.d(t,"c",(function(){return b})),n.d(t,"e",(function(){return d}));var c=n(15),a=n(323);function i(e){return Object(c.f)(e).l>.32?"#000":"#fff"}function r(e,t){return e.map(((e,n)=>[e,t[n]]))}function l(e,t){return Array.isArray(e)?e.map((e=>{const n=Object(c.g)(e);return n.opacity=t,n.toString()})):l([e],t)[0]}function o(e,t,n,c){null==c&&(c=n-t);const a={start:e-c/2,end:e.getTime()+c/2};let i=t-a.start;return i<=0&&(i=n-a.end,i>=0&&(i=0)),a.start=a.start+i,a.end=a.end+i,a}const s=new WeakMap,u=new a.a((e=>{for(const t of e){const e=s.get(t.target);e&&e(t.contentRect,t)}}));function b(e,t){s.set(e,t),u.observe(e)}function d(e){s.delete(e),u.unobserve(e)}},307:function(e,t,n){"use strict";n.d(t,"d",(function(){return s})),n.d(t,"c",(function(){return u})),n.d(t,"e",(function(){return b})),n.d(t,"a",(function(){return d})),n.d(t,"b",(function(){return O})),n.d(t,"f",(function(){return j}));var c=n(159);const a=Object(c.a)("%B %d"),i=(Object(c.a)("%b %d"),Object(c.a)("%m/%d")),r=Object(c.a)("%Y-%m-%d"),l=Object(c.a)("%m/%d/%Y"),o=Object(c.a)("%b %-d");function s(e){return e?i(e):"?"}function u(e){return e?a(e):"?"}function b(e,t=!0){return e?o(e)+(t?function(e){if(e>3&&e<21)return"th";switch(e%10){case 1:return"st";case 2:return"nd";case 3:return"rd";default:return"th"}}(e.getDate()):""):"?"}function d(e){return e?r(e):"?"}function O(e){return e?l(e):"?"}function j(e){return e&&"number"==typeof e.population?e.population.toLocaleString():"Unknown"}},309:function(e,t,n){"use strict";var c=n(0),a=n(3);function i(e){let t,n,a,i;return{c(){t=Object(c.u)("button"),Object(c.g)(t,"title","Show sensor description"),Object(c.g)(t,"class",n="uk-icon-button "+e[2]),Object(c.g)(t,"data-uk-toggle","target: #info-dialog"),Object(c.g)(t,"data-uk-icon","icon: question-plain"),Object(c.bb)(t,"uk-icon-button-small",!e[1])},m(n,r){Object(c.F)(n,t,r),a||(i=Object(c.H)(t,"click",Object(c.W)(e[3])),a=!0)},p(e,a){4&a&&n!==(n="uk-icon-button "+e[2])&&Object(c.g)(t,"class",n),6&a&&Object(c.bb)(t,"uk-icon-button-small",!e[1])},d(e){e&&Object(c.t)(t),a=!1,i()}}}function r(e){let t,n=null!=e[0]&&e[0].description&&i(e);return{c(){n&&n.c(),t=Object(c.v)()},m(e,a){n&&n.m(e,a),Object(c.F)(e,t,a)},p(e,[c]){null!=e[0]&&e[0].description?n?n.p(e,c):(n=i(e),n.c(),n.m(t.parentNode,t)):n&&(n.d(1),n=null)},i:c.J,o:c.J,d(e){n&&n.d(e),e&&Object(c.t)(t)}}}function l(e,t,n){let{sensor:c}=t,{large:i=!1}=t,{className:r=""}=t;return e.$$set=e=>{"sensor"in e&&n(0,c=e.sensor),"large"in e&&n(1,i=e.large),"className"in e&&n(2,r=e.className)},[c,i,r,()=>{a.j.set(c)}]}class o extends c.b{constructor(e){super(),Object(c.E)(this,e,l,r,c.P,{sensor:0,large:1,className:2})}}t.a=o},312:function(e,t,n){"use strict";function c(e,t){return{description:"shows the current data injected via a signal",data:{values:[{date_value:null}]},transform:[{calculate:"toDate(".concat(e,")"),as:"date_value"}],mark:{type:"rule",tooltip:!1},encoding:{color:{value:t},x:{field:"date_value",type:"temporal"}}}}function a(e,t="diamond",n="black"){return{description:"shows the current data injected via a signal",data:{values:[{date_value:null}]},transform:[{calculate:"toDate(".concat(e,")"),as:"date_value"}],mark:{type:"point",shape:t,color:n,fill:n,tooltip:!1},encoding:{y:{value:-7},x:{field:"date_value",type:"temporal"}}}}n.d(t,"c",(function(){return c})),n.d(t,"d",(function(){return a})),n.d(t,"a",(function(){return i})),n.d(t,"b",(function(){return r}));const i=c("currentDate","#c00"),r=a("currentDate","circle","#c00")},315:function(e,t,n){"use strict";var c=n(0),a=n(59),i=n(306),r=n(434);function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);t&&(c=c.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,c)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){s(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}let u=null;function b(e){return e&&null!=e.datum?b(e.datum):e}function d(e,t={}){if(!e)return;let n=!1,c=null,a=t;const i=(t,i,l,s)=>{if(n)return;const{popper:d,update:O,hide:j}=function(){if(u)return u;const e=document.createElement("div");e.classList.add("viz-tooltip","mapboxgl-popup-content","mapboxgl-map"),document.body.appendChild(e);let t={width:0,height:0,x:0,y:0};const n={getBoundingClientRect:()=>({left:t.x,right:t.x+t.width,width:t.width,top:t.y,bottom:t.y+t.height,height:t.height})},c=Object(r.a)(n,e,{placement:"top-start",modifiers:[{name:"offset",options:{offset:[0,8]}},{name:"flip",options:{padding:8}}]}),a=(n=0,a=0,i=0,r=0)=>{t.x=n,t.y=a,t.width=i,t.height=r,e.style.display="",c.update()},i=()=>{e.style.display="none"};return u={instance:c,popper:e,update:a,hide:i},{instance:c,popper:e,update:a,hide:i}}(),p=b(l);if(null==s||""===s||null==p.value)return j(),void(c&&c.$set({hidden:!0}));O(i.clientX,i.clientY),c?c.$set({hidden:!1,item:b(l)}):c=new e({target:d,props:o(o({},a),{},{hidden:!1,item:b(l)})})};return i.destroy=()=>{c&&(c.$destroy(),c=null),n=!0},i.update=e=>{a=e,c&&c.$set(o({},a))},i}function O(e){let t,n;return{c(){t=Object(c.u)("div"),Object(c.g)(t,"class","root vega-embed"),Object(c.g)(t,"data-message",e[4]),Object(c.g)(t,"data-testid","vega"),Object(c.g)(t,"data-status",n=e[2]?"error":e[1]?"no-data":e[0]?"loading":"ready"),Object(c.bb)(t,"loading-bg",!e[2]&&e[0]),Object(c.bb)(t,"message-overlay",e[2]||e[1]&&!e[0])},m(n,a){Object(c.F)(n,t,a),e[22](t)},p(e,[a]){16&a&&Object(c.g)(t,"data-message",e[4]),7&a&&n!==(n=e[2]?"error":e[1]?"no-data":e[0]?"loading":"ready")&&Object(c.g)(t,"data-status",n),5&a&&Object(c.bb)(t,"loading-bg",!e[2]&&e[0]),7&a&&Object(c.bb)(t,"message-overlay",e[2]||e[1]&&!e[0])},i:c.J,o:c.J,d(n){n&&Object(c.t)(t),e[22](null)}}}function j(e,t,r){let{data:l=Promise.resolve([])}=t;const o=Object(a.a)();let{spec:s}=t,u=null,b=null,O=null,{signals:j={}}=t,{signalListeners:p=[]}=t,{dataListeners:g=[]}=t,{eventListeners:m=[]}=t,{scrollSpy:f=-1}=t,v=!1,h=!1,y=!1,{resetSignalsUponNoData:w=!0}=t,{noDataText:$="No data available"}=t,{patchSpec:x=null}=t,{tooltip:S}=t,{tooltipProps:k={}}=t,V={width:300,height:300};function z(e,t){e&&(r(0,v=!0),r(2,y=!1),r(1,h=!1),Promise.all([e,t]).then((([t,n])=>{e===O&&(t.view.change("values",t.view.changeset().remove((()=>!0)).insert(n||[])),r(1,h=!n||0===n.length),Object.entries(j).forEach((([e,n])=>{t.view.signal(e,w&&h?null:n)})),t.view.runAsync(),r(0,v=!1))})).catch((e=>{console.error("error while updating data",e),r(0,v=!1),r(1,h=!1),r(2,y=!0)})))}function P(e){if(!u)return;O&&O.then((e=>e.finalize())),b=null,r(2,y=!1);const t=e=>(e.signals=e.signals||[],Object.entries(j).forEach((([t,n])=>{e.signals.push({name:t,value:n})})),e.signals.push({name:"width",init:"containerSize()[0]",on:[{events:{source:"window",type:"resize"},update:"containerSize()[0]"}]}),e.signals.push({name:"height",init:"containerSize()[1]",on:[{events:{source:"window",type:"resize"},update:"containerSize()[1]"}]}),e);r(18,O=n.e(15).then(n.bind(null,433)).then((n=>n.default(u,e,{actions:!1,logLevel:Error,tooltip:T,patch:t})))),O.then((t=>{u&&(b=t,u.setAttribute("role","figure"),p.forEach((n=>{t.view.addSignalListener(n,((n,c)=>{o("signal",{name:n,value:c,view:t.view,spec:e})}))})),g.forEach((n=>{t.view.addDataListener(n,((n,c)=>{o("dataListener",{name:n,value:c,view:t.view,spec:e})}))})),m.forEach((n=>{t.view.addEventListener(n,((c,a)=>{o(n,{event:c,item:a,view:t.view,spec:e})}))})),z(O,l))})),O.catch((e=>{console.error("error while creating vega",e),r(2,y=!0)}))}let _,T,D,E=null;function C(){r(19,V=u.getBoundingClientRect()),Object(i.c)(u,(e=>{(Math.abs(e.width-V.width)>1||Math.abs(e.height-V.height)>1)&&(r(19,V=e),!x&&b&&b.view.resize().runAsync())})),x||P(s)}return Object(a.c)((()=>{if(f>=0){UIkit.scrollspy(u,{offset:f});const e=()=>{C(),u.removeEventListener("inview",e)};u.addEventListener("inview",e)}else C()})),Object(a.b)((()=>{Object(i.e)(u),E&&(E.$destroy(),E=null),T&&T.destroy(),b?(b.finalize(),b=null,r(18,O=null)):O&&(O.then((e=>e.finalize())),r(18,O=null))})),e.$$set=e=>{"data"in e&&r(5,l=e.data),"spec"in e&&r(6,s=e.spec),"signals"in e&&r(7,j=e.signals),"signalListeners"in e&&r(8,p=e.signalListeners),"dataListeners"in e&&r(9,g=e.dataListeners),"eventListeners"in e&&r(10,m=e.eventListeners),"scrollSpy"in e&&r(11,f=e.scrollSpy),"resetSignalsUponNoData"in e&&r(12,w=e.resetSignalsUponNoData),"noDataText"in e&&r(13,$=e.noDataText),"patchSpec"in e&&r(14,x=e.patchSpec),"tooltip"in e&&r(15,S=e.tooltip),"tooltipProps"in e&&r(16,k=e.tooltipProps)},e.$$.update=()=>{8199&e.$$.dirty&&r(4,_=y?"Error occurred":h&&!v?$:null),32768&e.$$.dirty&&r(20,T=d(S)),1114112&e.$$.dirty&&T&&T.update(k),262176&e.$$.dirty&&z(O,l),540736&e.$$.dirty&&r(21,D=x?x(s,V):s),2097152&e.$$.dirty&&P(D),262272&e.$$.dirty&&function(e,t){e&&b&&0!==Object.keys(t).length&&(r(2,y=!1),Object.entries(t).forEach((([e,t])=>{b.view.signal(e,t)})),b.view.runAsync())}(O,j)},[v,h,y,u,_,l,s,j,p,g,m,f,w,$,x,S,k,()=>O.then((e=>e.view)),O,V,T,D,function(e){c.i[e?"unshift":"push"]((()=>{u=e,r(3,u)}))}]}class p extends c.b{constructor(e){super(),Object(c.E)(this,e,j,O,c.P,{data:5,spec:6,signals:7,signalListeners:8,dataListeners:9,eventListeners:10,scrollSpy:11,resetSignalsUponNoData:12,noDataText:13,patchSpec:14,tooltip:15,tooltipProps:16,vegaAccessor:17})}get vegaAccessor(){return this.$$.ctx[17]}}t.a=p},316:function(e,t,n){"use strict";n.d(t,"c",(function(){return j})),n.d(t,"b",(function(){return g})),n.d(t,"d",(function(){return m})),n.d(t,"a",(function(){return v}));var c=n(319),a=n(105),i=n(1),r=n(3),l=n(77),o=n(312);function s(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);t&&(c=c.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,c)}return n}function u(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?s(Object(n),!0).forEach((function(t){b(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):s(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function b(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function d(e,t,n,c){return Promise.all(t.map((t=>{const r=t.info;return r.level===i.k.id?[]:Object(a.d)(e,r.level,r.propertyId,n,c,!1,{geo_value:r.propertyId}).then((t=>Object(a.a)(t,e))).then((e=>e.map((e=>(e.displayName=r.displayName,e)))))}))).then((e=>e.flat()))}function O(e,t,n,c){return t&&t.level!==i.k.id?Object(a.d)(e,t.level,t.propertyId,n,c,!1,{geo_value:t.propertyId}).then((t=>Object(a.a)(t,e))).then((e=>e.map((e=>(e.displayName=t.displayName,e))))):Promise.resolve([])}function j(e,t,n,c){const a=t.length<2,r=0===t.length?null:t[0].info;return{sensor:e,data:a?O(e,r,n,c):d(e,t,n,c),spec:v(e,t,[n,c]),noDataText:r?r.level===i.k.id?"Please select a county":"No data available":"No location selected"}}const p=Object(l.a)((e=>{r.u.set(e)}),1,{leading:!1,trailing:!0});function g(e){const t=function(e){const t=e.detail.value;return t&&Array.isArray(t.date_value)&&t.date_value.length>0?Number.parseInt(Object(a.e)(t.date_value[0]),10):null}(e);t&&p(t)}function m(e){const t=e.detail.item;return t&&t.isVoronoi?t.datum.datum.time_value:null}const f=[{calculate:"datum.value == null ? null : (datum.value - datum.stderr) / 100",as:"value_lower_bound"},{calculate:"datum.value == null ? null : (datum.value + datum.stderr) / 100",as:"value_upper_bound"}];function v(e,t,n,a){const i="percent"===e.format,r=i?e=>e/100:e=>e,l=a&&a.field?a.field:i?"pValue":"value",s=!(!a||!a.domain),b=r(s?a.domain[1]:0),d=[{as:"clipped",calculate:"".concat(!s," || datum.").concat(l," == null ? false : datum.").concat(l," > ").concat(b)},{as:"clippedData",calculate:"datum.clipped ? datum.".concat(l," : null")}];return{$schema:"https://vega.github.io/schema/vega-lite/v4.json",data:{name:"values"},padding:{left:50,top:6,bottom:20,right:2},autosize:{type:"none",contains:"padding",resize:!0},transform:[...e.hasStdErr?i?f:c.e:[],{as:"pValue",calculate:"datum.value == null ? null : datum.value / 100"},...s?d:[]],resolve:{scale:{y:"shared"}},encoding:{color:Object(c.a)(t),x:{field:"date_value",type:"temporal",axis:{title:null,format:"%m/%d",formatType:"cachedTime",tickCount:"month"},scale:n?{domain:[n[0].getTime(),n[1].getTime()]}:{}}},layer:[...e.hasStdErr?[c.d]:[],{mark:{type:"line",interpolate:"linear"},encoding:{y:{field:l,type:"quantitative",scale:{domainMin:s?r(a.domain[0]):0,domainMax:s?r(a.domain[1]):void 0,clamp:!0,nice:!s},axis:u(u({},i?{format:".1%",formatType:"cachedNumber"}:{}),{},{title:null,tickCount:3,minExtent:25})}}},...s?[{mark:{type:"text",text:"∶",size:12,baseline:"bottom",dx:-.3,dy:3.5,stroke:"#FFAAAA",strokeOpacity:.5},encoding:{y:{field:"clippedData",type:"quantitative"}}}]:[],{selection:{highlight:{type:"single",empty:"none",on:"mouseover",nearest:!0,encodings:["x"],clear:"mouseout"}},mark:{type:"rule",strokeWidth:2.5,color:"white",opacity:.001,tooltip:!0}},{mark:{type:"point",radius:1,stroke:null,fill:"grey"},encoding:{opacity:{condition:[{selection:"highlight",value:1},{test:"datum.time_value == highlightTimeValue",value:1}],value:0},y:{field:l,type:"quantitative"}}},{mark:{type:"rule"},encoding:{opacity:{condition:[{selection:"highlight",value:1},{test:"datum.time_value == highlightTimeValue",value:1}],value:0},y:{field:l,type:"quantitative"}}},o.a],config:{customFormatTypes:!0,legend:{disable:!0}}}}},318:function(e,t,n){"use strict";var c=n(0),a=n(307);n(251);function i(e){let t,n,a=e[2].displayName+"";return{c(){t=Object(c.Z)(a),n=Object(c.Z)(" on")},m(e,a){Object(c.F)(e,t,a),Object(c.F)(e,n,a)},p(e,n){4&n&&a!==(a=e[2].displayName+"")&&Object(c.S)(t,a)},d(e){e&&Object(c.t)(t),e&&Object(c.t)(n)}}}function r(e){let t,n,a,i,r,l,s,u,b=e[0].yAxis+"",d=e[0].formatValue(e[2].value)+"",O=e[0].hasStdErr&&null!=e[2].stderr&&o(e);return{c(){t=Object(c.u)("tr"),n=Object(c.u)("th"),a=Object(c.Z)(b),i=Object(c.V)(),r=Object(c.u)("td"),l=Object(c.Z)(d),s=Object(c.V)(),O&&O.c(),u=Object(c.v)(),Object(c.g)(n,"class","svelte-1icnyvz"),Object(c.g)(r,"class","right svelte-1icnyvz")},m(e,o){Object(c.F)(e,t,o),Object(c.e)(t,n),Object(c.e)(n,a),Object(c.e)(t,i),Object(c.e)(t,r),Object(c.e)(r,l),Object(c.F)(e,s,o),O&&O.m(e,o),Object(c.F)(e,u,o)},p(e,t){1&t&&b!==(b=e[0].yAxis+"")&&Object(c.S)(a,b),5&t&&d!==(d=e[0].formatValue(e[2].value)+"")&&Object(c.S)(l,d),e[0].hasStdErr&&null!=e[2].stderr?O?O.p(e,t):(O=o(e),O.c(),O.m(u.parentNode,u)):O&&(O.d(1),O=null)},d(e){e&&Object(c.t)(t),e&&Object(c.t)(s),O&&O.d(e),e&&Object(c.t)(u)}}}function l(e){let t,n,i,r,l,o,s,u,b,d,O,j,p,g,m,f,v,h,y,w,$,x,S,k,V,z,P,_,T,D,E,C,F,N,L,Z,A,q=e[0].yAxis+"",I=Object(a.c)(e[2].date_value)+"",R=e[0].formatValue(e[2].count)+"",M=e[0].formatValue(e[2].countRatio)+"",H=e[0].formatValue(e[2].avg)+"",J=e[0].formatValue(e[2].avgRatio)+"",U=Object(a.c)(e[2].date_value)+"",B=e[0].formatValue(e[2].countCumulative)+"",W=e[0].formatValue(e[2].countRatioCumulative)+"";return{c(){t=Object(c.u)("tr"),n=Object(c.u)("th"),i=Object(c.Z)(q),r=Object(c.V)(),l=Object(c.u)("th"),l.textContent="Count",o=Object(c.V)(),s=Object(c.u)("th"),s.textContent="Ratios (per 100,000)",u=Object(c.V)(),b=Object(c.u)("tr"),d=Object(c.u)("th"),O=Object(c.Z)(I),j=Object(c.V)(),p=Object(c.u)("td"),g=Object(c.Z)(R),m=Object(c.V)(),f=Object(c.u)("td"),v=Object(c.Z)(M),h=Object(c.V)(),y=Object(c.u)("tr"),w=Object(c.u)("th"),w.textContent="7-day average",$=Object(c.V)(),x=Object(c.u)("td"),S=Object(c.Z)(H),k=Object(c.V)(),V=Object(c.u)("td"),z=Object(c.Z)(J),P=Object(c.V)(),_=Object(c.u)("tr"),T=Object(c.u)("th"),D=Object(c.Z)(U),E=Object(c.Z)(" (cumulative)"),C=Object(c.V)(),F=Object(c.u)("td"),N=Object(c.Z)(B),L=Object(c.V)(),Z=Object(c.u)("td"),A=Object(c.Z)(W),Object(c.g)(n,"class","svelte-1icnyvz"),Object(c.g)(l,"class","area svelte-1icnyvz"),Object(c.g)(s,"class","area svelte-1icnyvz"),Object(c.g)(d,"class","svelte-1icnyvz"),Object(c.g)(p,"class","right svelte-1icnyvz"),Object(c.g)(f,"class","right svelte-1icnyvz"),Object(c.g)(w,"class","svelte-1icnyvz"),Object(c.g)(x,"class","right svelte-1icnyvz"),Object(c.g)(V,"class","right svelte-1icnyvz"),Object(c.g)(T,"class","svelte-1icnyvz"),Object(c.g)(F,"class","right svelte-1icnyvz"),Object(c.g)(Z,"class","right svelte-1icnyvz")},m(e,a){Object(c.F)(e,t,a),Object(c.e)(t,n),Object(c.e)(n,i),Object(c.e)(t,r),Object(c.e)(t,l),Object(c.e)(t,o),Object(c.e)(t,s),Object(c.F)(e,u,a),Object(c.F)(e,b,a),Object(c.e)(b,d),Object(c.e)(d,O),Object(c.e)(b,j),Object(c.e)(b,p),Object(c.e)(p,g),Object(c.e)(b,m),Object(c.e)(b,f),Object(c.e)(f,v),Object(c.F)(e,h,a),Object(c.F)(e,y,a),Object(c.e)(y,w),Object(c.e)(y,$),Object(c.e)(y,x),Object(c.e)(x,S),Object(c.e)(y,k),Object(c.e)(y,V),Object(c.e)(V,z),Object(c.F)(e,P,a),Object(c.F)(e,_,a),Object(c.e)(_,T),Object(c.e)(T,D),Object(c.e)(T,E),Object(c.e)(_,C),Object(c.e)(_,F),Object(c.e)(F,N),Object(c.e)(_,L),Object(c.e)(_,Z),Object(c.e)(Z,A)},p(e,t){1&t&&q!==(q=e[0].yAxis+"")&&Object(c.S)(i,q),4&t&&I!==(I=Object(a.c)(e[2].date_value)+"")&&Object(c.S)(O,I),5&t&&R!==(R=e[0].formatValue(e[2].count)+"")&&Object(c.S)(g,R),5&t&&M!==(M=e[0].formatValue(e[2].countRatio)+"")&&Object(c.S)(v,M),5&t&&H!==(H=e[0].formatValue(e[2].avg)+"")&&Object(c.S)(S,H),5&t&&J!==(J=e[0].formatValue(e[2].avgRatio)+"")&&Object(c.S)(z,J),4&t&&U!==(U=Object(a.c)(e[2].date_value)+"")&&Object(c.S)(D,U),5&t&&B!==(B=e[0].formatValue(e[2].countCumulative)+"")&&Object(c.S)(N,B),5&t&&W!==(W=e[0].formatValue(e[2].countRatioCumulative)+"")&&Object(c.S)(A,W)},d(e){e&&Object(c.t)(t),e&&Object(c.t)(u),e&&Object(c.t)(b),e&&Object(c.t)(h),e&&Object(c.t)(y),e&&Object(c.t)(P),e&&Object(c.t)(_)}}}function o(e){let t,n,a,i,r,l=e[0].formatValue(e[2].stderr)+"";return{c(){t=Object(c.u)("tr"),n=Object(c.u)("th"),n.textContent="Standard Error",a=Object(c.V)(),i=Object(c.u)("td"),r=Object(c.Z)(l),Object(c.g)(n,"class","svelte-1icnyvz"),Object(c.g)(i,"class","right svelte-1icnyvz")},m(e,l){Object(c.F)(e,t,l),Object(c.e)(t,n),Object(c.e)(t,a),Object(c.e)(t,i),Object(c.e)(i,r)},p(e,t){5&t&&l!==(l=e[0].formatValue(e[2].stderr)+"")&&Object(c.S)(r,l)},d(e){e&&Object(c.t)(t)}}}function s(e){let t,n,o,s,u,b,d,O=Object(a.c)(e[2].date_value)+"",j=e[2].displayName&&i(e);function p(e,t){return e[0].isCasesOrDeath?l:r}let g=p(e),m=g(e);return{c(){t=Object(c.u)("div"),n=Object(c.u)("h5"),j&&j.c(),o=Object(c.V)(),s=Object(c.Z)(O),u=Object(c.V)(),b=Object(c.u)("table"),d=Object(c.u)("tbody"),m.c(),Object(c.g)(n,"class","svelte-1icnyvz"),Object(c.g)(t,"aria-label","tooltip"),Object(c.g)(t,"class","tooltip svelte-1icnyvz"),Object(c.bb)(t,"hidden",e[1])},m(e,a){Object(c.F)(e,t,a),Object(c.e)(t,n),j&&j.m(n,null),Object(c.e)(n,o),Object(c.e)(n,s),Object(c.e)(t,u),Object(c.e)(t,b),Object(c.e)(b,d),m.m(d,null)},p(e,[r]){e[2].displayName?j?j.p(e,r):(j=i(e),j.c(),j.m(n,o)):j&&(j.d(1),j=null),4&r&&O!==(O=Object(a.c)(e[2].date_value)+"")&&Object(c.S)(s,O),g===(g=p(e))&&m?m.p(e,r):(m.d(1),m=g(e),m&&(m.c(),m.m(d,null))),2&r&&Object(c.bb)(t,"hidden",e[1])},i:c.J,o:c.J,d(e){e&&Object(c.t)(t),j&&j.d(),m.d()}}}function u(e,t,n){let{sensor:c}=t,{hidden:a=!1}=t,{item:i}=t;return e.$$set=e=>{"sensor"in e&&n(0,c=e.sensor),"hidden"in e&&n(1,a=e.hidden),"item"in e&&n(2,i=e.item)},[c,a,i]}class b extends c.b{constructor(e){super(),Object(c.E)(this,e,u,s,c.P,{sensor:0,hidden:1,item:2})}}t.a=b},319:function(e,t,n){"use strict";n.d(t,"d",(function(){return o})),n.d(t,"e",(function(){return s})),n.d(t,"a",(function(){return d})),n.d(t,"b",(function(){return O})),n.d(t,"c",(function(){return j}));var c=n(348),a=n(312);function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);t&&(c=c.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,c)}return n}function r(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){l(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}const o={mark:{type:"area",interpolate:"monotone"},encoding:{color:{field:"geo_value"},opacity:{value:.25},y:{field:"value_lower_bound",type:"quantitative"},y2:{field:"value_upper_bound"}}},s=[{calculate:"datum.value == null ? null : datum.value - datum.stderr",as:"value_lower_bound"},{calculate:"datum.value == null ? null : datum.value + datum.stderr",as:"value_upper_bound"}],u={field:"date_value",type:"temporal",axis:{orient:"bottom",labels:!1,title:null}},b=r(r({},u),{},{axis:{orient:"bottom",title:null,format:"%m/%d",formatType:"time",tickCount:"week",grid:!0,labelSeparation:10}});function d(e){return e?{field:"geo_value",type:"nominal",scale:{domain:e.map((e=>e.info.propertyId)),range:e.map(((e,t)=>0===t?"grey":e.color))}}:{value:"grey"}}function O(e,t,n,c,i){const l="countRatioCumulative"===t||"avgRatio"===t?" per 100,000 people":"",O=e.yAxis+l,j="countRatioCumulative"===t||"countCumulative"===t?60:50,p={$schema:"https://vega.github.io/schema/vega-lite/v4.json",title:{text:i,font:'"Open Sans", Helvetica, sans-serif',fontSize:14.08,fontWeight:700,lineHeight:22,color:"#666"},data:{name:"values",values:c?[{date_value:c[0],value:0},{date_value:c[1],value:1}]:[]},autosize:{type:"none",contains:"padding",resize:!0},padding:{left:j,right:2,top:50,bottom:5},transform:e.hasStdErr?s:[],vconcat:[{encoding:{x:r(r({},u),{},{scale:{domain:{selection:"dateRange"}}})},resolve:{axis:{x:"independent"}},layer:[{mark:{type:"line",interpolate:"monotone"},encoding:{color:d(n),x:r({},b),y:{field:t,type:"quantitative",scale:{domainMin:0},axis:{minExtent:25,title:O}}}},{selection:{highlight:{type:"single",empty:"none",nearest:!0,encodings:["x"],on:"mouseover",clear:"mouseout"}},mark:{type:"circle",tooltip:!0},encoding:{color:{field:"geo_value"},x:r(r({},b),{},{axis:r(r({},b.axis),{},{labels:!1,grid:!1,tickCount:"day"})}),y:{field:t,type:"quantitative"}}},...e.hasStdErr?[o]:[],{transform:[{filter:{selection:"highlight"}}],mark:"rule",encoding:{y:{field:t,type:"quantitative"}}},a.a]},{height:40,padding:{top:0},view:{cursor:"col-resize"},encoding:{color:{field:"geo_value"},x:r({},b),y:{field:t,type:"quantitative",axis:{minExtent:25,tickCount:3,title:" "}}},layer:[{selection:{dateRange:{type:"interval",encodings:["x"],init:{x:[c[0].getTime(),c[1].getTime()]},mark:{cursor:"move"}}},mark:{type:"line",interpolate:"monotone"},encoding:{y:{field:t,type:"quantitative",axis:{minExtent:25,tickCount:3,title:" "}}}},...e.hasStdErr?[o]:[],{selection:{highlight2:{type:"single",empty:"none",nearest:!0,encodings:["x"],on:"mouseover",clear:"mouseout"}},transform:[{filter:{selection:"highlight2"}}],mark:"rule",encoding:{y:{field:t,type:"quantitative"}}},a.a]}],config:{customFormatTypes:!0,legend:{disable:!0}}};if(e.isCasesOrDeath){const e={mark:{type:"line",interpolate:"monotone",opacity:.2},encoding:{y:{field:t.replace("avg","count"),type:"quantitative"},color:{field:"geo_value"}}};p.vconcat[0].layer.unshift(e),p.vconcat[1].layer.unshift(e)}return p}function j(e,t){return Object(c.a)({},e,{vconcat:[{height:Math.floor(t.height-40-110)},{height:40}]})}}}]);