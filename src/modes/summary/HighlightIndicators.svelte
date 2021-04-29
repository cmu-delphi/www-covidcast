<script>
  import { sensorList } from '../../stores';
  import KPIValue from '../../components/KPIValue.svelte';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import TrendIndicator from '../../components/TrendIndicator.svelte';
  import { SensorParam } from '../../stores/params';
  import { formatDateWeekday } from '../../formats';
  import SensorUnit from '../../components/SensorUnit.svelte';
  import MaxDateHint from '../../blocks/MaxDateHint.svelte';

  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../../stores/params").DataFetcher}
   */
  export let fetcher;

  const highlights = sensorList.filter((d) => d.highlight && d.highlight.includes('location'));

  $: highlightSensors = highlights.map((h) => ({
    sensor: new SensorParam(h),
    trend: fetcher.fetchWindowTrend(h, region, date),
  }));
</script>

<FancyHeader sub="Indicators">Key</FancyHeader>

<p>
  On {formatDateWeekday(date.value)}
  {#if highlightSensors.length > 0}
    <MaxDateHint sensor={highlightSensors[0].sensor.value} level={region.level} suffix="," />
  {:else}
    {`, `}
  {/if}
  the {highlightSensors.length > 0 ? highlightSensors[0].sensor.valueUnit : 'value'}s were:
</p>

<div class="mobile-two-col">
  {#each highlightSensors as s (s.sensor.key)}
    <div class="mobile-kpi">
      <h3>{s.sensor.name}</h3>
      <div>
        {#await s.trend}
          <KPIValue value={null} loading />
        {:then d}
          <KPIValue value={d && d.current ? d.current.value : null} digits={2} />
        {/await}
      </div>
      <div class="sub">
        <SensorUnit sensor={s.sensor} long />
      </div>
    </div>
  {/each}
</div>

<p>Compared to the previous week that means:</p>

<div class="mobile-two-col">
  {#each highlightSensors as s (s.sensor.key)}
    <div class="mobile-kpi">
      <div>
        {#await s.trend}
          <TrendIndicator trend={null} long />
        {:then d}
          <TrendIndicator trend={d} long />
        {/await}
      </div>
    </div>
  {/each}
</div>
