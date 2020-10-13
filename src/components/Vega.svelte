<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import embed from 'vega-embed';
  import { Error, expressionFunction } from 'vega';
  import { observeResize, unobserveResize } from '../util';
  import { createVegaTooltipAdapter } from './tooltipUtils';
  import { cachedTime } from './customVegaFunctions';

  expressionFunction('cachedTime', cachedTime);

  export let data = Promise.resolve([]);

  const dispatch = createEventDispatcher();

  /**
   * @type {import('vega-embed').VisualizationSpec}
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
   * @types {string[]}
   */
  export let signalListeners = [];
  /**
   * data listeners to dispatch
   * @types {string[]}
   */
  export let dataListeners = [];
  /**
   * data listeners to dispatch
   * @types {string[]}
   */
  export let eventListeners = [];

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

  export const vegaAccessor = () => vegaPromise.then((v) => v.view);

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
          vega.view.signal(key, resetSignalsUponNoData && noData ? null : v);
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
      vega.view.signal(key, v);
    });
    vega.view.runAsync();
  }

  function updateSpec(spec) {
    if (!root) {
      return;
    }
    if (vegaPromise) {
      // cleanup old
      vegaPromise.then((r) => r.finalize());
    }
    vega = null;
    hasError = false;
    vegaPromise = embed(root, spec, {
      actions: false,
      logLevel: Error,
      tooltip: tooltipHandler,
      patch: (spec) => {
        spec.signals = spec.signals || [];
        Object.entries(signals).forEach(([key, v]) => {
          spec.signals.push({ name: key, value: v });
        });
        return spec;
      },
    });
    vegaPromise.then((r) => {
      if (!root) {
        return;
      }
      vega = r;
      root.setAttribute('role', 'figure');
      signalListeners.forEach((signal) => {
        r.view.addSignalListener(signal, (name, value) => {
          dispatch('signal', { name, value, view: r.view });
        });
      });
      dataListeners.forEach((data) => {
        r.view.addDataListener(data, (name, value) => {
          dispatch('dataListener', { name, value, view: r.view });
        });
      });
      eventListeners.forEach((type) => {
        r.view.addEventListener(type, (event, item) => {
          dispatch(type, { event, item, view: r.view });
        });
      });
      updateData(vegaPromise, data);
    });
    vegaPromise.catch((error) => {
      console.error('error while creating vega', error);
      hasError = true;
    });
  }

  onMount(() => {
    if (patchSpec) {
      size = root.getBoundingClientRect();
      observeResize(root, (s) => {
        size = s;
      });
    } else {
      updateSpec(spec);
    }
  });

  onDestroy(() => {
    if (patchSpec) {
      unobserveResize(root);
    }
    if (tooltipHandler) {
      tooltipHandler.destroy();
    }
    if (vega) {
      vega.finalize();
      vega = null;
      vegaPromise = null;
    } else if (vegaPromise) {
      vegaPromise.then((r) => r.finalize());
      vegaPromise = null;
    }
  });
</script>

<div
  bind:this={root}
  class="root"
  class:loading-bg={!hasError && loading}
  class:message-overlay={hasError || (noData && !loading)}
  data-message={message} />
