<script>
  import SortColumnIndicator, { SortHelper } from '../../components/SortColumnIndicator.svelte';
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
  import { currentSensor, metaDataManager, switchToMode } from '../../stores';
  import SensorBadges from '../../components/SensorBadges.svelte';
  import { modeByID } from '..';
  import GeoLevelBadge from '../../components/GeoLevelBadge.svelte';

  /**
   * @type {import('../../data/meta').SensorSource}
   */
  export let source;
  const sort = new SortHelper('name', false, 'name');
  let sortedData = source.sensors.slice().sort($sort.comparator);

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
      <th class="mobile-th">Tags</th>
      <th class="mobile-th">Levels</th>
      <th />
    </tr>
    <tr>
      <th class="sort-indicator uk-text-center">
        <SortColumnIndicator label="Name" {sort} prop="name" />
      </th>
      <th class="sort-indicator" />
      <th class="sort-indicator" />
      <th class="sort-indicator" />
    </tr>
  </thead>
  <tbody>
    {#each sortedData as r (r.key)}
      <tr>
        <td>
          <a href="../indicator-signal?sensor={r.key}" on:click|preventDefault={() => select(r)}>{r.name}</a>
          <div class="source">API: {r.signal}</div>
        </td>
        <td>
          <SensorBadges sensor={r} />
        </td>
        <td>
          {#each $metaDataManager.getLevels(r) as level}
            <GeoLevelBadge {level} />
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
  .source {
    font-size: 0.75rem;
  }
</style>
