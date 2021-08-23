<script>
  import Vega from '../../components/vega/Vega.svelte';
  import { formatDateISO, formatWeek } from '../../formats';
  import { generateStateBinaryDataSpec } from '../../specs/mapSpec';
  import DownloadMenu from '../../components/DownloadMenu.svelte';
  import IndicatorMapTooltip from './IndicatorMapTooltip.svelte';

  /**
   * @type {{name: string}}
   */
  export let signal;
  /**
   * @type {Date}
   */
  export let date;

  export let data;

  const spec = generateStateBinaryDataSpec();

  let vegaRef = null;
</script>

<div class="chart-aspect-4-3">
  <Vega bind:this={vegaRef} {spec} {data} tooltip={IndicatorMapTooltip} />
  <DownloadMenu
    {vegaRef}
    {data}
    absolutePos
    fileName="{signal.name}_US States_{signal.isWeeklySignal ? formatWeek(date.week) : formatDateISO(date.value)}"
    advanced={false}
  />
</div>
