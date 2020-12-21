<script>
  import Search from '../../components/Search.svelte';
  import { formatAPITime, parseAPITime } from '../../data';
  import { nameInfos, nationInfo } from '../../maps';
  import { currentDate, currentRegionInfo, selectByInfo } from '../../stores';
  import { refSensor, visibleLevels } from './questions';
  import SensorDatePicker2 from '../../components/SensorDatePicker2.svelte';

  const filteredInfos = nameInfos.filter((d) => visibleLevels.includes(d.level));
  filteredInfos.unshift(nationInfo);
  $: selectedDate = parseAPITime($currentDate);
  $: if (selectedDate !== undefined) {
    currentDate.set(formatAPITime(selectedDate));
  }
</script>

<style>
  .parameters {
    position: sticky;
    top: -1px;
    background: white;
    z-index: 100;
    padding-bottom: 0.5em;
    display: flex;
    box-shadow: 0 0 0 18px white; /* to hide box-shadow from cards */
  }

  @media only screen and (max-width: 715px) {
    .parameters {
      display: block;
      padding-bottom: 0;
    }
    .parameters > :global(*) {
      margin-bottom: 0.5em;
    }
  }

  .parameters :global(.survey-search) {
    background: #f0f1f3;
    flex: 2 1 auto;
  }
  .parameters :global(.survey-search input) {
    background: #f0f1f3;
    letter-spacing: 3px;
  }

  .parameters :global(.survey-date) {
    flex: 1 1 auto;
  }
</style>

<aside class="grid-3-11 parameters">
  <Search
    className="survey-search"
    placeholder="Search Region"
    items={filteredInfos}
    selectedItem={$currentRegionInfo || nationInfo}
    labelFieldName="displayName"
    maxItemsToShowInList="5"
    on:change={(e) => selectByInfo(e.detail && e.detail.level === 'nation' ? null : e.detail)} />
  <SensorDatePicker2 className="survey-date" bind:value={selectedDate} sensor={refSensor} />
</aside>
