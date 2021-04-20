<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { observeResize, unobserveResize } from '../../util';
  import { createVegaTooltipAdapter } from './tooltipUtils';

  /**
   * @type {Promise<any[]>}
   */
  export let data = Promise.resolve([]);

  const dispatch = createEventDispatcher();

  export let className = '';

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

  let size = { width: 300, height: 300 };
  $: updateData(vegaPromise, data);
  $: patchedSpec = patchSpec ? patchSpec(spec, size) : spec;
  $: updateSpec(patchedSpec);
  $: updateSignals(vegaPromise, signals);

  /**
   * @type (() => Promise<import('vega-typings').View>)
   */
  export const vegaAccessor = () => vegaPromise.then((v) => v.view);
  /**
   * @type (() => import('vega-typings').View | null)
   */
  export const vegaDirectAccessor = () => (vega ? vega.view : null);

  /**
   * @param {Promise<import('vega-embed').Result> | null} vegaLoader
   * @param {Promise<any[]>} data
   */
  function updateData(vegaLoader, data) {
    if (!vegaLoader) {
      return;
    }
    loading = true;
    hasError = false;
    noData = false;

    Promise.all([vegaLoader, data])
      .then(([vega, d]) => {
        if (vegaLoader !== vegaPromise) {
          // outside has changed
          return;
        }
        vega.view.change(
          'values',
          vega.view
            .changeset()
            .remove(() => true)
            .insert(d || []),
        );

        noData = !d || d.length === 0;
        // also update signals along the way
        Object.entries(signals).forEach(([key, v]) => {
          if (typeof v !== 'function') {
            vega.view.signal(key, resetSignalsUponNoData && noData ? null : v);
          }
        });
        vega.view.runAsync();

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
    vega.view.runAsync();
  }

  function updateSpec(spec) {
    if (!root) {
      return;
    }
    if (vegaPromise) {
      // cleanup old
      vegaPromise.then((r) => {
        if (r) {
          r.finalize();
        }
      });
    }
    vega = null;
    hasError = false;
    const patch = (spec) => {
      spec.signals = spec.signals || [];
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
    vegaPromise = Promise.all([
      import(/* webpackChunkName: 'vegafactory' */ './vegaFactory'),
      spec,
      ...specDatasetsEntries.map((d) => d[1]),
    ]).then(([m, spec, ...ds]) => {
      if (!root) {
        return null;
      }
      // patch in the spec defined datasets with their loaded values
      specDatasetsEntries.forEach((entry, i) => {
        spec.datasets[entry[0]] = ds[i];
      });
      return m.default(root, spec, {
        tooltip: tooltipHandler,
        patch,
      });
    });
    vegaPromise.then((r) => {
      if (!root) {
        return;
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
      updateData(vegaPromise, data);
    });
    vegaPromise.catch((error) => {
      console.error('error while creating vega', error);
      hasError = true;
    });
  }

  let scrollSpyHandler = null;

  function initVegaContainer() {
    size = root.getBoundingClientRect();
    observeResize(root, (s) => {
      // check if size has changed by at least one pixel in width or height
      if (Math.abs(s.width - size.width) > 1 || Math.abs(s.height - size.height) > 1) {
        size = s;
        if (!patchSpec && vega) {
          // trigger a resize within vega
          vega.view.resize().runAsync();
        }
      }
    });
    // in case of a given patchSpec function, a new spec will be generated when the size changes
    // So, if patchSpec is not given, we have to update the spec manually
    if (!patchSpec) {
      updateSpec(spec);
    }
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
  class:loading-bg={!hasError && loading}
  class:message-overlay={hasError || (noData && !loading)}
  data-message={message}
  data-testid="vega"
  data-status={hasError ? 'error' : noData ? 'no-data' : loading ? 'loading' : 'ready'}
/>
