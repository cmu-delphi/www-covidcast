<script>
  import { getLevelInfo } from '../stores/constants';

  export let summary = null;

  $: total = summary && summary.items ? summary.items.length : 0;

  $: info = getLevelInfo(summary ? summary.level : 'county');

  let loading = true;
  let valid = 0;
  $: {
    loading = true;
    if (summary && summary.data) {
      summary.data.then((rows) => {
        let validRows = 0;
        for (const row of rows) {
          if (row.geo_value.endsWith('000') || row.value == null || Number.isNaN(row.value)) {
            // mega county ignore or invalid
            continue;
          }
          validRows++;
        }
        loading = false;
        // update once for better performance
        valid = validRows;
      });
    }
  }

  function percent(v) {
    return Math.round((v * 100) / total);
  }
</script>

<div
  class="root base-font-size container-style"
  class:hidden={!summary || !summary.data}
  class:loading-bg={loading}
  data-testid="coverage"
  title={`Showing data for ${valid} ${info.labelPlural} out of ${total} ${info.labelPlural} (${percent(valid)}%)`}
>
  {percent(valid)}% Coverage
</div>

<style>
  .root {
    font-size: 0.7rem;
  }
  .hidden {
    display: none;
  }
</style>
