<script>
  import Search from '../../components/Search.svelte';
  import { formatAPITime, parseAPITime } from '../../data';
  import { nameInfos } from '../../maps';
  import { currentDate, currentRegionInfo, selectByInfo, smallMultipleTimeSpan } from '../../stores';
  import SensorDatePicker from '../../components/SensorDatePicker.svelte';
  import { refSensor, questions, overviewText } from './questions';
  import SurveyQuestion from './SurveyQuestion.svelte';

  $: selectedDate = parseAPITime($currentDate);
  $: if (selectedDate !== undefined) {
    currentDate.set(formatAPITime(selectedDate));
  }

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
  $: params = { region: $currentRegionInfo, startDay, endDay };
</script>

<style>
  .questions {
    margin-top: 1em;
  }
</style>

<div class="uk-container">
  <div class="content-grid">
    <div class="grid-3-11">
      <h4>Overview</h4>
      <p>
        {@html overviewText}
      </p>
      <h2>Results</h2>
    </div>
  </div>
  <div class="content-grid">
    <aside class="grid-3-11">
      <Search
        className="container-bg"
        placeholder="Search Region"
        items={nameInfos}
        selectedItem={$currentRegionInfo}
        labelFieldName="displayName"
        maxItemsToShowInList="5"
        on:change={(e) => selectByInfo(e.detail)} />
      <div class="sensor-date container-bg">
        <SensorDatePicker sensor={refSensor} bind:value={selectedDate} />
      </div>
    </aside>
  </div>

  <div class="content-grid questions">
    <div class="grid-1-3">
      <div class="toc-container uk-visible@m">
        <div uk-sticky="offset: 32;" class="uk-sticky uk-sticky-fixed uk-sticky-below toc">
          <h5>Outline</h5>
          <ol uk-scrollspy-nav="closest: li; scroll: true; offset: 100" class="uk-nav uk-nav-default">
            {#each questions as question}
              <li><a href="#{question.anchor}">{question.name}</a></li>
            {/each}
          </ol>
        </div>
      </div>
    </div>
    <div class="grid-3-11">
      {#each questions as question}
        <SurveyQuestion {question} date={selectedDate} {params} />
      {/each}
    </div>
  </div>
</div>
