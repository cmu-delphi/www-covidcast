<script>
  import { onMount, onDestroy } from 'svelte';
  import { default as embed } from 'vega-embed';
  /**
   * @typedef {import('../stores/fetchData').EpiDataRow} EpiDataRow
   */

  /**
   * @type {EpiDataRow[]}
   */
  export let data = [];

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

  $: updateData();

  function updateData() {
    if (!vega) {
      return;
    }
    vega.view.change(
      'values',
      vega.view
        .changeset()
        .remove(() => true)
        .insert(data),
    );
  }

  onMount(() => {
    const bb = root.getBoundingClientRect();
    embed(root, schema, { actions: false, width: bb.width, height: bb.height })
      .then((r) => {
        vega = r;
        updateData();
      })
      .catch((error) => console.error(error));
  });

  onDestroy(() => {
    if (vega) {
      vega.finalize();
      vega = null;
    }
  });
</script>

<div bind:this={root} />
