<script>
  import { onMount, onDestroy } from 'svelte';
  import { default as embed } from 'vega-embed';

  export let data = Promise.resolve([]);

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

  let loading = true;
  let noData = false;

  $: updateData(vegaPromise, data);
  $: updateSpec(spec);

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

  function updateSpec(spec) {
    if (!root) {
      return;
    }
    vegaPromise = embed(root, spec, {
      actions: false,
    });
    vegaPromise.then((r) => {
      vega = r;
      updateData(r, data);
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
