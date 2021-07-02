<script>
  import SortColumnIndicator, { SortHelper } from '../../components/SortColumnIndicator.svelte';
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
  import { currentSensor, metaDataManager, switchToMode } from '../../stores';
  import SensorBadges from '../../components/SensorBadges.svelte';
  import { modeByID } from '..';
  import GeoLevelBadge from '../../components/GeoLevelBadge.svelte';
  import { formatDateISO } from '../../formats';

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
    };
  }

  $: sortedData = source.sensors.map(fullEntry).sort($sort.comparator);

  function select(signal) {
    console.log(signal);
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
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator label="First Data" {sort} prop="minTime" />
      </th>
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator label="Latest Data" {sort} prop="maxTime" />
      </th>
      <th class="sort-indicator" />
      <th class="sort-indicator" />
    </tr>
  </thead>
  <tbody>
    {#each sortedData as r (r.key)}
      <tr>
        <td>
          <a href="../indicator-signal?sensor={r.key}" on:click|preventDefault={() => select(r)}>{r.name}</a>
          {#if source.reference_signal == r.signal}
            (reference)
          {/if}
          <div><SensorBadges sensor={r} source={false} /></div>
        </td>
        <td>
          {formatDateISO(r.minTime)}
        </td>
        <td>
          {formatDateISO(r.maxTime)}
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
