<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { observeResize, unobserveResize } from '../../util';
  import { createVegaTooltipAdapter } from './tooltipUtils';
  import createVega from './vegaFactory';

  /**
   * @type {Promise<any[]>}
   */
  export let data = Promise.resolve([]);

  const dispatch = createEventDispatcher();

  export let className = '';
  export let style = undefined;

  /**
   * @type {import('vega-embed').VisualizationSpec | Promise<import('vega-embed').VisualizationSpec>}
   */
  export let spec;

  /**
   * @type {HTMLElement|null}
   */
  let root = null;
  /**
   * @type {import('vega-embed').Result | null}
   */
  let vega = null;
  /**
   * @type {Promise<import('vega-embed').Result> | null}
   */
  let vegaPromise = null;

  /**
   * @type {{[key: string]: any}}
   */
  export let signals = {};

  /**
   * signals to dispatch
   * @type {string[]}
   */
  export let signalListeners = [];
  /**
   * data listeners to dispatch
   * @type {string[]}
   */
  export let dataListeners = [];
  /**
   * data listeners to dispatch
   * @type {string[]}
   */
  export let eventListeners = [];

  /**
   * if >= 0 enables scroll-spy behavior to lazy render the vega plot upon visibility
   * the number represents the offset argument of UIkit.scrollspy
   * @type {number}
   */
  export let scrollSpy = -1;

  /**
   * @type {'canvas' | 'svg'}
   */
  export let renderer = 'canvas';

  let loading = false;
  let noData = false;
  let hasError = false;

  export let resetSignalsUponNoData = true;

  export let noDataText = 'No data available';
  $: message = hasError ? 'Error occurred' : noData && !loading ? noDataText : null;

  /**
   * @type {(import('vega-embed').VisualizationSpec, size: {width: number, height: number}) => (import('vega-embed').VisualizationSpec}
   */
  export let patchSpec = null;

  /**
   * // svelte component
   */
  export let tooltip = undefined;
  /**
   * @type {Record<string, unknown>}
   */
  export let tooltipProps = {};

  $: tooltipHandler = createVegaTooltipAdapter(tooltip);
  $: {
    if (tooltipHandler) {
      tooltipHandler.update(tooltipProps);
    }
  }
  $: updateData(data);
  $: updateSignals(vegaPromise, signals);

  /**
   * @type (() => Promise<import('vega-typings').View>)
   */
  export const vegaAccessor = () => vegaPromise.then((v) => v.view);
  /**
   * @type (() => import('vega-typings').View | null)
   */
  export const vegaDirectAccessor = () => (vega ? vega.view : null);

  let loadedData = null;
  /**
   * @param {Promise<any[]>} data
   */
  function updateData(data) {
    loading = true;
    hasError = false;
    noData = false;
    loadedData = null;

    Promise.resolve(data)
      .then((d) => {
        loadedData = d || [];
        noData = !d || d.length === 0;
        loading = false;
      })
      .catch((error) => {
        console.error('error while updating data', error);
        loading = false;
        noData = false;
        hasError = true;
      });
  }

  /**
   * @param {Promise<import('vega-embed').Result> | null} vegaLoader
   * @param {[key: string]: any} signals
   */
  function updateSignals(vegaLoader, signals) {
    if (!vegaLoader || !vega) {
      return;
    }
    if (Object.keys(signals).length === 0) {
      return;
    }
    hasError = false;
    Object.entries(signals).forEach(([key, v]) => {
      if (typeof v !== 'function') {
        vega.view.signal(key, v);
      }
    });
    // console.log('runAsync - update signals');
    vega.view.runAsync();
  }

  let initialized = false;

  function updateSpec(spec, initialized) {
    if (!root || !initialized) {
      return;
    }
    // console.log('update spec');
    if (vegaPromise) {
      // cleanup old
      vegaPromise.then((r) => {
        if (r) {
          r.finalize();
        }
      });
    }
    vega = null;
    loading = true;
    hasError = false;

    const patch = (spec) => {
      spec.signals = spec.signals || [];
      // init signal entries
      Object.entries(signals).forEach(([key, v]) => {
        const obj = { name: key };
        const existing = spec.signals.find((d) => d.name === key);
        if (typeof v === 'function') {
          // mixing the whole object
          Object.assign(obj, v(existing));
        } else {
          obj.value = v;
        }
        if (existing) {
          Object.assign(existing, obj);
        } else {
          spec.signals.push(obj);
        }
      });
      spec.signals.push({
        name: 'width',
        init: 'containerSize()[0]',
        on: [
          {
            events: { source: 'window', type: 'resize' },
            update: 'containerSize()[0]',
          },
        ],
      });
      spec.signals.push({
        name: 'height',
        init: 'containerSize()[1]',
        on: [
          {
            events: { source: 'window', type: 'resize' },
            update: 'containerSize()[1]',
          },
        ],
      });
      return spec;
    };

    const specDatasetsEntries = Object.entries(spec.datasets || {});
    let patchedInData = null;
    vegaPromise = Promise.all([spec, ...specDatasetsEntries.map((d) => d[1])])
      .then(([spec, ...ds]) => {
        if (!root) {
          return null;
        }
        if (specDatasetsEntries.length > 0 || loadedData) {
          // create a shallow copy of spec since we patch it
          spec = {
            ...spec,
            datasets: {
              ...(spec.datasets || {}),
            },
          };
        }
        // patch in the spec defined datasets with their loaded values
        specDatasetsEntries.forEach((entry, i) => {
          spec.datasets[entry[0]] = ds[i];
        });
        // set initial loaded data
        if (loadedData) {
          // console.log('patch in loaded data');
          patchedInData = loadedData;
          spec.datasets.values = loadedData;
        }
        // build vega
        return createVega(root, spec, {
          tooltip: tooltipHandler,
          renderer,
          patch,
        });
      })
      .then((r) => {
        if (patchedInData) {
          r.__loadedData = patchedInData;
        }
        if (!root) {
          return r;
        }
        vega = r;
        root.setAttribute('role', 'figure');
        signalListeners.forEach((signal) => {
          r.view.addSignalListener(signal, (name, value) => {
            dispatch('signal', { name, value, view: r.view, spec: r.spec });
            dispatch(`signal_${name}`, { name, value, view: r.view, spec: r.spec });
          });
        });
        dataListeners.forEach((data) => {
          r.view.addDataListener(data, (name, value) => {
            dispatch('dataListener', { name, value, view: r.view, spec: r.spec });
            dispatch(`dataListener_${name}`, { name, value, view: r.view, spec: r.spec });
          });
        });
        eventListeners.forEach((type) => {
          r.view.addEventListener(type, (event, item) => {
            dispatch(type, { event, item, view: r.view, spec: r.spec });
          });
        });
        // console.log('inited vega');
        loading = false;
        return r;
      });
    vegaPromise.catch((error) => {
      console.error('error while creating vega', error);
      hasError = true;
    });
  }

  let scrollSpyHandler = null;

  let size = { width: 300, height: 300 };
  $: patchedSpec = spec;
  function updatePatchedSpec(patchSpec, spec, size) {
    if (!patchSpec || !size) {
      return;
    }
    patchedSpec = patchSpec(spec, size);
  }
  $: {
    // separate step to aovid size updates automatically trigger a patchedSpec update if not needed
    updatePatchedSpec(patchSpec, spec, size);
  }
  $: updateSpec(patchedSpec, initialized);

  function sendData(vega, d) {
    const currentData = vega.__loadedData;
    if (currentData === d) {
      // same data
      // console.log('same data');
      return false;
    }
    vega.__loadedData = d;
    vega.view.change(
      'values',
      vega.view
        .changeset()
        .remove(() => true)
        .insert(d || []),
    );

    // also update signals along the way
    Object.entries(signals).forEach(([key, v]) => {
      if (typeof v !== 'function') {
        vega.view.signal(key, resetSignalsUponNoData && noData ? null : v);
      }
    });
    return true;
  }

  $: {
    if (vega && loadedData) {
      // sync vega and the data
      if (sendData(vega, loadedData)) {
        // console.log('runAsync - update data');
        vega.view.runAsync();
      }
    }
  }

  function initVegaContainer() {
    size = root.getBoundingClientRect();
    initialized = true;
    observeResize(root, (s) => {
      // check if size has changed by at least one pixel in width or height
      if (Math.abs(s.width - size.width) > 1 || Math.abs(s.height - size.height) > 1) {
        size = s;
        if (!patchSpec && vega) {
          // console.log('runAsync - resize');
          vega.view.resize().runAsync();
        }
      }
    });
  }

  onMount(() => {
    if (scrollSpy >= 0) {
      // use a scroll spy to find out whether we are visible
      // eslint-disable-next-line no-undef
      UIkit.scrollspy(root, {
        offset: scrollSpy,
      });
      const handler = () => {
        initVegaContainer();
        root.removeEventListener('inview', handler); // once
      };
      root.addEventListener('inview', handler);
    } else {
      initVegaContainer();
    }
  });

  onDestroy(() => {
    unobserveResize(root);

    if (scrollSpyHandler) {
      scrollSpyHandler.$destroy();
      scrollSpyHandler = null;
    }
    if (tooltipHandler) {
      tooltipHandler.destroy();
    }
    if (vega) {
      vega.finalize();
      vega = null;
      vegaPromise = null;
    } else if (vegaPromise) {
      vegaPromise.then((r) => {
        if (r) {
          r.finalize();
        }
      });
      vegaPromise = null;
    }
  });
</script>

<div
  bind:this={root}
  class="root vega-embed {className}"
  {style}
  class:loading-bg={!hasError && loading}
  class:message-overlay={hasError || (noData && !loading)}
  data-message={message}
  data-testid="vega"
  data-status={hasError ? 'error' : noData ? 'no-data' : loading ? 'loading' : 'ready'}
/>
