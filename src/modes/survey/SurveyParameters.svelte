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
  .parameter-container {
    position: sticky;
    top: 0px;
    background: #fafafc;
    border-top: 1px solid #d3d4d8;
    border-bottom: 1px solid #d3d4d8;
    z-index: 120;
  }

  .uk-container {
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .parameters {
    display: flex;
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
    background: white;
    flex: 2 1 auto;
  }
  .parameters :global(.survey-search input) {
    background: white;
    font-weight: 600;
    letter-spacing: 3px;
    height: 60px;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .parameters :global(.survey-date) {
    flex: 1 1 auto;
  }
</style>

<div class="parameter-container">
  <div class="content-grid uk-container">
    <div class="grid-3-11 parameters">
      <Search
        className="survey-search"
        placeholder="Search Region"
        items={filteredInfos}
        selectedItem={$currentRegionInfo || nationInfo}
        labelFieldName="displayName"
        maxItemsToShowInList="5"
        selectOnClick
        on:change={(e) => selectByInfo(e.detail && e.detail.level === 'nation' ? null : e.detail)} />
      <SensorDatePicker2 className="survey-date" bind:value={selectedDate} sensor={refSensor} />
    </div>
  </div>
</div>
