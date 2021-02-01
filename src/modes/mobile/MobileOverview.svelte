<script>
  import { nameInfos, nationInfo } from '../../maps';
  import { currentRegionInfo, smallMultipleTimeSpan, currentSensorEntry } from '../../stores';
  import SurveyParameters from '../survey/SurveyParameters.svelte';
  import SignalTable from './SignalTable.svelte';
  import './common.css';

  // use local variables with manual setting for better value comparison updates
  let startDay = $smallMultipleTimeSpan[0];
  let endDay = $smallMultipleTimeSpan[1];

  $: {
    if (startDay.getTime() !== $smallMultipleTimeSpan[0].getTime()) {
      startDay = $smallMultipleTimeSpan[0];
    }
    if (endDay.getTime() !== $smallMultipleTimeSpan[1].getTime()) {
      endDay = $smallMultipleTimeSpan[1];
    }
  }
  $: params = { region: $currentRegionInfo || nationInfo, startDay, endDay };

</script>

<style>
  .root {
    position: relative;
    flex: 1 1 0;
    overflow: auto;
  }
  .details {
    margin-top: 1em;
  }
  .content-grid {
    grid-row-gap: 0;
  }
</style>

<div class="root">
  <SurveyParameters sensor={$currentSensorEntry} items={nameInfos} defaultItem={nationInfo}/>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <h2>Test</h2>
    </div>
    <div class="grid-3-11 details">
      <SignalTable {params} />
    </div>
  </div>
</div>
