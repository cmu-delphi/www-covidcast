<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { default as embed } from 'vega-embed';

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
  let signals = {};

  /**
   * signals to dispatch
   * @types {string[]}
   */
  let signalListeners = [];

  let loading = true;
  let noData = false;

  $: updateData(vegaPromise, data);
  $: updateSpec(spec);
  $: updateSignals(vegaPromise, signals);

  /**
   * @param {Promise<import('vega-embed').Result> | null} vegaPromise
   * @param {Promise<any[]>} data
   */
  function updateData(vegaPromise, data) {
    if (!vegaPromise) {
      return;
    }
    loading = true;
    Promise.all([vegaPromise, data]).then(([vega, d]) => {
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
   * @param {Promise<import('vega-embed').Result> | null} vegaPromise
   * @param {[key: string]: any} signals
   */
  function updateSignals(vegaPromise, signals) {
    if (!vegaPromise) {
      return;
    }
    if (Object.keys(signals).length === 0) {
      return;
    }
    vegaPromise.then((vega) => {
      Object.entries(signals).forEach(([key, v]) => {
        vega.view.signal(key, v);
      });
    });
  }

  function updateSpec(spec) {
    if (!root) {
      return;
    }
    vegaPromise = embed(root, spec, {
      actions: false,
    });
    vegaPromise.then((r) => {
      vega = r;
      signalListeners.forEach((signal) => {
        r.view.addSignalListener(signal, (name, value) => {
          dispatch(name, value);
        });
      });
      r.view.addSignalListener();
      updateData(r, data);
      updateSignals(r, signals);
    });
    vegaPromise.catch((error) => console.error(error));
  }

  onMount(() => {
    updateSpec(spec);
  });

  onDestroy(() => {
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

<div bind:this={root} class="root" class:loading-bg={loading && !noData} class:no-data={noData} />
