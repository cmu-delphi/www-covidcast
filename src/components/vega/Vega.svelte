<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import embed from 'vega-embed';
  import { observeResize, unobserveResize } from '../../util';

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
  let signalListeners = [];

  let loading = false;
  let noData = false;
  let hasError = false;
  export let noDataText = 'No data available';

  /**
   * @type {(import('vega-embed').VisualizationSpec, size: {width: number, height: number}) => (import('vega-embed').VisualizationSpec}
   */
  export let patchSpec = null;

  let size = { width: 300, height: 300 };
  $: updateData(vegaPromise, data);
  $: patchedSpec = patchSpec ? patchSpec(spec, size) : spec;
  $: updateSpec(patchedSpec);
  $: updateSignals(vegaPromise, signals);

  /**
   * @param {Promise<import('vega-embed').Result> | null} vegaLoader
   * @param {Promise<any[]>} data
   */
  function updateData(vegaLoader, data) {
    if (!vegaLoader) {
      return;
    }
    loading = true;
    Promise.all([vegaLoader, data]).then(([vega, d]) => {
      if (vegaLoader !== vegaPromise) {
        // outside has changed
        return;
      }
      noData = !d || d.length === 0;
      vega.view
        .change(
          'values',
          vega.view
            .changeset()
            .remove(() => true)
            .insert(d || []),
        )
        .runAsync();
      loading = false;
    });
  }

  /**
   * @param {Promise<import('vega-embed').Result> | null} vegaLoader
   * @param {[key: string]: any} signals
   */
  function updateSignals(vegaLoader, signals) {
    if (!vegaLoader) {
      return;
    }
    if (Object.keys(signals).length === 0) {
      return;
    }
    vegaLoader.then((vega) => {
      if (vegaLoader !== vegaPromise) {
        // outside has changed
        return;
      }
      if (!vega) {
        return;
      }
      Object.entries(signals).forEach(([key, v]) => {
        vega.view.signal(key, v);
      });
      vega.view.runAsync();
    }).catch((error) => {
      console.error(error);
      hasError = true;
    });
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
    vegaPromise = embed(root, spec, {
      actions: false,
      patch: (spec) => {
        spec.signals = spec.signals || [];
        Object.entries(signals).forEach(([key, v]) => {
          spec.signals.push({ name: key, value: v });
        });
        return spec;
      },
    });
    vegaPromise.then((r) => {
      vega = r;
      signalListeners.forEach((signal) => {
        r.view.addSignalListener(signal, (name, value) => {
          dispatch(name, value);
        });
      });
      updateData(r, data);
    });
    vegaPromise.catch((error) => console.error(error));
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
  class:loading-bg={loading}
  class:message-overlay={hasError || (noData && !loading)}
  data-message={hasError ? 'Error occurred' : noDataText} />
