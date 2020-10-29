<script>
  import Search from '../../components/Search.svelte';
  import { formatAPITime, parseAPITime } from '../../data';
  import { nameInfos } from '../../maps';
  import { currentDate, currentRegionInfo, selectByInfo, smallMultipleTimeSpan } from '../../stores';
  import SensorDatePicker from '../../components/SensorDatePicker.svelte';
  import { refSensor, sections } from './sections';
  import { createTimeSeriesSpec, loadTimeSeriesData } from './timeSeries';
  import SignalSummary from './SignalSummary.svelte';

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

  $: timeSeriesData = loadTimeSeriesData($currentRegionInfo, [startDay, endDay]);
  $: timeSeriesSpec = createTimeSeriesSpec([startDay, endDay]);
</script>

<style>
  .root {
    padding: 1em;
    max-width: 60em;
  }

  section {
    margin: 1em 0;
    padding: 0.5em;
    border-bottom: 1px solid lightgray;
  }

  .question {
    margin: 0.5em 0;
    padding: 0.2em;
  }

  .indicator {
    margin: 0.5em 0;
    padding: 0.2em;
  }

  .indicator :global(.vega-embed) {
    display: block;
  }

  p {
    padding: 0;
  }

  aside {
    display: flex;
    justify-content: space-evenly;
  }

  .sensor-date {
    display: flex;
    align-items: center;
    padding: 0 1em;
  }
</style>

<div class="root">
  <h1>Facebook Survey Results</h1>
  <aside>
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
  <main>
    {#each sections as section}
      <section>
        <h2>{section.section}</h2>
        {#each section.questions as question}
          <div class="question">
            <h3>{question.question}</h3>
            {#each question.indicators as indicator}
              <div class="indicator">
                <h4>{indicator.name}</h4>
                <p>
                  {@html indicator.description}
                </p>
                <SignalSummary
                  date={selectedDate}
                  data={timeSeriesData.get(indicator.signal) || []}
                  low={indicator.negated}
                  spec={timeSeriesSpec} />
              </div>
            {/each}
          </div>
        {/each}
      </section>
    {/each}
  </main>
</div>
