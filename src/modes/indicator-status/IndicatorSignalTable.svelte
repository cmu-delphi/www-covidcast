<script>
  import SortColumnIndicator, { SortHelper } from '../../components/SortColumnIndicator.svelte';
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
  import StarIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/star.svg';
  import { currentSensor, metaDataManager, switchToMode } from '../../stores';
  import SensorBadges from '../../components/SensorBadges.svelte';
  import { modeByID } from '..';
  import GeoLevelBadge from '../../components/GeoLevelBadge.svelte';
  import { formatDateISO, formatWeek } from '../../formats';

  /**
   * @type {import('../../data/meta').SensorSource}
   */
  export let source;
  const sort = new SortHelper('name', false, 'name');

  function fullEntry(sensor) {
    const meta = $metaDataManager.getTimeFrame(sensor);
    return {
      ...sensor,
      minTime: meta.min,
      maxTime: meta.max,
      minWeek: meta.min_week,
      maxWeek: meta.max_week,
    };
  }

  $: sortedData = source.sensors
    .filter((d) => d.active !== false)
    .map(fullEntry)
    .sort($sort.comparator);

  function select(signal) {
    currentSensor.set(signal.key);
    switchToMode(modeByID['indicator-signal']);
  }
</script>

<table class="mobile-table">
  <thead>
    <tr>
      <th class="mobile-th">Signal</th>
      <th class="mobile-th">First Data</th>
      <th class="mobile-th">Latest Data</th>
      <th class="mobile-th">Levels</th>
      <th />
    </tr>
    <tr>
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator label="Name" {sort} prop="name" />
      </th>
      <th class="sort-indicator uk-text-center uk-text-nowrap">
        <SortColumnIndicator label="First Data" {sort} prop="minTime" />
      </th>
      <th class="sort-indicator uk-text-center uk-text-nowrap">
        <SortColumnIndicator label="Latest Data" {sort} prop="maxTime" />
      </th>
      <th class="sort-indicator" />
      <th class="sort-indicator" />
    </tr>
  </thead>
  <tbody class="table-body">
    {#each sortedData as r (r.key)}
      <tr>
        <td>
          <a href="../indicator-signal?sensor={r.key}" on:click|preventDefault={() => select(r)}>
            {#if source.reference_signal == r.signal}
              <span class="inline-svg-icon" title="reference signal for this data source" style="padding: 0"
                >{@html StarIcon}</span
              >
            {/if}
            {r.name}</a
          >
          <div><SensorBadges sensor={r} source={false} /></div>
        </td>
        <td class="uk-text-nowrap">
          {r.isWeeklySignal ? formatWeek(r.minWeek) : formatDateISO(r.minTime)}
        </td>
        <td class="uk-text-nowrap uk">
          {r.isWeeklySignal ? formatWeek(r.minWeek) : formatDateISO(r.maxTime)}
        </td>
        <td>
          {#each $metaDataManager.getLevels(r) as level}
            <GeoLevelBadge {level} />{' '}
          {/each}
        </td>
        <td>
          <a
            href="../indicator-signal?sensor={r.key}"
            class="uk-link-text details-link"
            on:click|preventDefault={() => select(r)}
          >
            {@html chevronRightIcon}
          </a>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .details-link {
    width: 6px;
    display: inline-block;
    fill: currentColor;
  }
</style>
