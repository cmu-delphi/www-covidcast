<script>
  import Search from '../../components/Search.svelte';
  import Vega from '../../components/Vega.svelte';
  import { formatAPITime, parseAPITime } from '../../data';
  import { nameInfos } from '../../maps';
  import { currentDate, currentDateObject, currentRegionInfo, selectByInfo, times } from '../../stores';
  import Datepicker from '../../components/Calendar/Datepicker.svelte';
  import { createVegaSpec } from './vegaSpec';
  import { formatTime, refSensor, sections } from './sections';
  import { computeRelatedGroups, loadSummaryData } from './summary';

  let showErrorBars = false;

  /**
   * @type {'none' | 'region' | 'date'}
   */
  let related = 'none';

  let showTimeSeries = false;

  $: relatedGroups = computeRelatedGroups($currentDateObject, $currentRegionInfo, related);
  $: data = !showTimeSeries ? loadSummaryData($currentDateObject, $currentRegionInfo, related) : Promise.resolve([]);
  $: spec = createVegaSpec(showErrorBars, relatedGroups);

  $: dataLookup = data.then((r) => new Map(r.map((d) => [d.signal, d])));

  function formatSampleSize(entry) {
    if (!entry || entry.sample_size == null) {
      return '?';
    }
    return Math.floor(entry.sample_size).toLocaleString();
  }
  function formatIssueDate(entry) {
    if (!entry || entry.issue == null) {
      return '?';
    }
    return formatTime(parseAPITime(entry.issue));
  }

  $: selectedDate = parseAPITime($currentDate);
  /**
   * @type {[Date, Date]}
   */
  $: startEndDates = [];
  $: if ($times !== null) {
    const dates = $times.get(refSensor.key);
    startEndDates = dates ? dates.map(parseAPITime) : [];
  }
  $: if (selectedDate !== undefined) {
    currentDate.set(formatAPITime(selectedDate));
  }
</script>

<style>
  .root {
    padding: 1em;
  }
  .split {
    display: flex;
  }
  .split > main {
    flex-grow: 1;
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

  .info {
    text-align: right;
    font-size: 75%;
  }

  .filter-group {
    margin: 1em 0;
  }

  .filter-calendar > :global(div) {
    display: block;
  }

  .calendar {
    width: 100%;
  }

  label {
    display: block;
  }
  input[type='checkbox'],
  input[type='radio'] {
    margin-right: 0.5em;
  }

  .filter-spacer {
    margin-top: 3em;
  }
</style>

<div class="root">
  <h1>
    Facebook Survey Results of {$currentRegionInfo ? $currentRegionInfo.displayName : '?'} as of {formatTime(selectedDate)}
  </h1>
  <div class="split">
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
                  {#if showTimeSeries}
                    <div>Test</div>
                  {:else}
                    <Vega data={data.then((r) => r.filter((d) => d.signal === indicator.signal))} {spec} />
                    {#await dataLookup}
                      <div class="info loading">based on ? samples, published ?</div>
                    {:then lookup}
                      <div class="info">
                        based on {formatSampleSize(lookup.get(indicator.signal))} samples, published {formatIssueDate(lookup.get(indicator.signal))}
                      </div>
                    {/await}
                  {/if}
                </div>
              {/each}
            </div>
          {/each}
        </section>
      {/each}
    </main>
    <aside>
      <div class="filter-group">
        <h5>Selected Region</h5>
        <Search
          className="search-container container-style container-bg"
          placeholder="Search Region"
          items={nameInfos}
          selectedItem={$currentRegionInfo}
          labelFieldName="displayName"
          maxItemsToShowInList="5"
          on:change={(e) => selectByInfo(e.detail)} />
      </div>
      <div class="filter-group">
        <h5>Mode</h5>
        <label><input type="radio" bind:group={showTimeSeries} name="vis" value={false} />Summaries</label>
        <label><input type="radio" bind:group={showTimeSeries} name="vis" value={true} />Time Series</label>
      </div>
      {#if showTimeSeries}
        <div class="filter-group filter-spacer">
          <h5>Advanced</h5>
          <label><input type="checkbox" bind:checked={showErrorBars} />Show Error Bands</label>
        </div>
      {:else}
        <div class="filter-group filter-calendar">
          <h5>Selected Date</h5>
          {#if selectedDate != null && startEndDates.length !== 0}
            <Datepicker
              bind:selected={selectedDate}
              start={startEndDates[0]}
              end={startEndDates[1]}
              formattedSelected={formatTime(selectedDate)}>
              <button
                aria-label="selected date"
                class="pg-button pg-text-button base-font-size calendar"
                on:>{formatTime(selectedDate)}</button>
            </Datepicker>
          {:else}
            <button
              aria-label="selected date"
              class="pg-button pg-text-button base-font-size calendar"
              on:>{formatTime(selectedDate)}</button>
          {/if}
        </div>
        <div class="filter-group filter-spacer">
          <h5>Show Related Results</h5>
          <label><input type="radio" bind:group={related} name="related" value="none" />None</label>
          <label><input
              type="radio"
              bind:group={related}
              name="related"
              value="region"
              disabled={!$currentRegionInfo || $currentRegionInfo.level !== 'county'} />Related regions</label>
          <label><input type="radio" bind:group={related} name="related" value="date" disabled={showTimeSeries} />Previous
            dates</label>
        </div>
        <div class="filter-group filter-spacer">
          <h5>Advanced</h5>
          <label><input type="checkbox" bind:checked={showErrorBars} />Show Error Bars</label>
        </div>
      {/if}
    </aside>
  </div>
</div>
