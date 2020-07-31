<script>
  import { onMount, onDestroy } from 'svelte';
  import { default as embed } from 'vega-embed';
  /**
   * @typedef {import('../stores/fetchData').EpiDataRow} EpiDataRow
   */

  /**
   * @type {Promise<EpiDataRow[]>}
   */
  export let data = Promise.resolve([]);

  /**
   * @type {import('vega-embed').VisualizationSpec}
   */
  export let schema;

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

  let loading = true;

  $: updateData();

  function updateData() {
    if (!vegaPromise) {
      return;
    }
    loading = true;
    Promise.all([vegaPromise, data]).then(([vega, d]) => {
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

  onMount(() => {
    const bb = root.getBoundingClientRect();
    // don't know why the size diff
    const margin = 6;
    vegaPromise = embed(root, schema, {
      actions: false,
      width: bb.width - margin,
      height: bb.height - margin,
      padding: 0,
    });
    vegaPromise.then((r) => {
      vega = r;
      updateData();
    });
    vegaPromise.catch((error) => console.error(error));
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

<div bind:this={root} class:loading />
