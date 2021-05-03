<script>
  import { formatDateWeekday, formatDateYearWeekdayAbbr } from '../formats';
  import { WINDOW_SIZE } from '../stores/params';
  import SensorValue from './SensorValue.svelte';
  import TrendText from './TrendText.svelte';

  /**
   * @type {Promise<import("../../stores/params").Trend>}
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

  let loading = false;

  $: {
    if (trend) {
      loading = true;
      trend.then(() => {
        loading = false;
      });
    }
  }
</script>

<p class:loading>
  <slot />
  {#await trend}
    We don't have data on the historical context for this indicator on
    {formatDateWeekday(date.value, true)}.
  {:then d}
    {#if d.isUnknown}
      We don't have data on the historical context for this indicator on
      {formatDateWeekday(date.value, true)}.
    {:else if d.highValuesAre === 'neutral'}
      {#if d.isNeutral}
        On
        {formatDateWeekday(date.value, true)}
        <strong>{sensor.value.name}</strong>
        has
        <strong>
          <TrendText trend={d.minTrend} />
        </strong>
        compared to the
        <strong
          >{WINDOW_SIZE}
          month minimum value of
          <SensorValue {sensor} value={d.min ? d.min.value : null} medium /></strong
        >
        on
        <strong>{formatDateYearWeekdayAbbr(d.minDate, true)}</strong>.
      {:else if +date.value === +d.minDate}
        On
        {formatDateWeekday(date.value, true)}
        <strong>{sensor.value.name}</strong>
        has
        <strong>
          <TrendText trend={d.maxTrend} />
        </strong>
        compared to the
        <strong
          >{WINDOW_SIZE}
          month maximum value of
          <SensorValue {sensor} value={d.max ? d.max.value : null} medium /></strong
        >
        on
        <strong>{formatDateYearWeekdayAbbr(d.maxDate, true)}</strong>.
      {:else if +date.value === +d.maxDate}
        On
        {formatDateWeekday(date.value, true)}
        <strong>{sensor.value.name}</strong>
        has
        <strong>
          <TrendText trend={d.minTrend} />
        </strong>
        compared to the
        <strong
          >{WINDOW_SIZE}
          month minimum value of
          <SensorValue {sensor} value={d.min ? d.min.value : null} medium /></strong
        >
        on
        <strong>{formatDateYearWeekdayAbbr(d.minDate, true)}</strong>.
      {:else}
        On
        {formatDateWeekday(date.value, true)}
        <strong>{sensor.value.name}</strong>
        has
        <strong>
          <TrendText trend={d.minTrend} />
        </strong>
        compared to the
        <strong
          >{WINDOW_SIZE}
          month minimum value of
          <SensorValue {sensor} value={d.min ? d.min.value : null} medium /></strong
        >
        on
        <strong>{formatDateYearWeekdayAbbr(d.minDate, true)}</strong>.
      {/if}
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
        <TrendText trend={d.worstTrend} />
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
