<script>
  import { formatDateWeekday, formatDateYearWeekdayAbbr } from '../../formats';
  import { WINDOW_SIZE } from '../../stores/params';
  import SensorValue from './SensorValue.svelte';
  import TrendText from './TrendText.svelte';

  /**
   * @type {import("../../stores/params").Trend}
   */
  export let trend;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let sensor;
  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
</script>

<p>
  <slot />
  {#await trend then d}
    {#if d.isUnknown}
      We don't have data on the historical context for this indicator on
      {formatDateWeekday(date.value, true)}.
    {:else if +date.value === +d.worstDate}
      On
      {formatDateWeekday(date.value, true)}
      <strong>{sensor.value.name}</strong>
      was the
      {WINDOW_SIZE}
      month
      <strong>worst</strong>
      value compared to
      <strong
        >best value of
        <SensorValue {sensor} value={d.best ? d.best.value : null} medium /></strong
      >
      on
      <strong>{formatDateYearWeekdayAbbr(d.bestDate, true)}</strong>.
    {:else}
      On
      {formatDateWeekday(date.value, true)}
      <strong>{sensor.value.name}</strong>
      was
      <strong>
        <TrendText {sensor} trend={d.worstTrend} />
      </strong>
      compared to the
      <strong
        >{WINDOW_SIZE}
        month worst value of
        <SensorValue {sensor} value={d.worst ? d.worst.value : null} medium /></strong
      >
      on
      <strong>{formatDateYearWeekdayAbbr(d.worstDate, true)}</strong>.
    {/if}
  {/await}
</p>
