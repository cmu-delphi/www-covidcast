<script>
  import { timeFormat } from 'd3-time-format';
  import { callMetaAPI } from '../../data/api';
  import Datepicker from '../../components/Calendar/Datepicker.svelte';
  import { getLevelInfo, primaryValue, sensorList, sensorMap } from '../../stores/constants';
  import { parseAPITime } from '../../data';
  import { currentInfoSensor, currentSensorEntry, smallMultipleTimeSpan } from '../../stores';
  import { timeMonth } from 'd3-time';
  import { onMount } from 'svelte';
  import { trackEvent } from '../../stores/ga';
  import IoMdHelp from 'svelte-icons/io/IoMdHelp.svelte';
  import Search from '../../components/Search.svelte';
  import { nameInfos } from '../../maps';

  const CSV_SERVER = 'https://delphi.cmu.edu/csv';
  const iso = timeFormat('%Y-%m-%d');

  const CASES_DEATH_SOURCE = 'cases-deaths';

  const sourceNameLookup = {
    'doctor-visits': 'Doctor Visits',
    'fb-survey': 'Delphi Survey Results',
    ght: 'Google Search Trends',
    'hospital-admissions': 'Hospital Admissions',
    [CASES_DEATH_SOURCE]: 'Public Health Reports',
    'indicator-combination': 'COVID Indicator Combination',
    quidel: 'Quidel Antigen Tests',
    safegraph: 'SafeGraph Mobility Data',
  };

  let loading = true;
  /**
   * @type {{id: string, name: string, levels: Set<string>, minTime: Date, maxTime: Date, signals: {id: string, dataSource: string, signal: string, name: string, description: string}[]}[]}
   */
  let signalGroups = [];
  let signalGroupValue = null;
  let signalValue = null;
  let geoType = 'county';
  $: endDate = $smallMultipleTimeSpan[1];
  // one month in the past
  $: startDate = timeMonth.offset($smallMultipleTimeSpan[1], -1);

  let levelList = [];
  $: signalGroup = signalGroupValue ? signalGroups.find((d) => d.id === signalGroupValue) : null;
  $: signal = signalValue && signalGroup ? signalGroup.signals.find((d) => d.id === signalValue) : null;

  $: {
    if (signalGroup && !signalGroup.signals.find((d) => d.id === signalValue)) {
      signalValue = signalGroup.signals[0].id;
    }
  }

  $: {
    if (signalGroup && !signalGroup.levels.has(geoType)) {
      // reset to a valid one
      geoType = Array.from(signalGroup.levels)[0];
    }
  }

  let geoValuesMode = 'all';
  let geoValues = [];
  $: geoItems = nameInfos.filter((d) => d.level === geoType);
  $: {
    if (geoItems != null) {
      geoValues = [];
      geoValuesMode = geoValuesMode === 'all' || geoItems.length === 0 ? 'all' : 'single';
    }
  }
  $: isAllRegions = geoValuesMode === 'all' || geoValues.length === 0;
  $: geoIDs = geoValues.map((d) => d.propertyId);

  let asOfMode = 'latest';
  let asOfDate = new Date();
  const asOfStart = new Date(2000, 0, 1);
  const asOfEnd = new Date(2030, 0, 1);
  $: {
    if (asOfMode === 'latest') {
      asOfDate = new Date();
    }
  }
  $: usesAsOf = asOfMode !== 'latest' && asOfDate instanceof Date;

  function minDate(a, b) {
    if (!a) {
      return b;
    }
    if (!b) {
      return a;
    }
    return a < b ? a : b;
  }
  function maxDate(a, b) {
    if (!a) {
      return b;
    }
    if (!b) {
      return a;
    }
    return a > b ? a : b;
  }
  /**
   * @type {Map<string, {name: string, tooltipText: string}>}
   */
  const lookupMap = new Map(sensorMap);
  // add the cases death extra ones
  sensorList
    .filter((d) => d.isCasesOrDeath)
    .forEach((entry) => {
      const add = (cumulative, ratio) => {
        const options = { cumulative, ratio };
        const signal = entry.casesOrDeathSignals[primaryValue(entry, options)];
        const text = entry.mapTitleText(options);
        const name = `${cumulative ? 'Cumulative ' : ''}${entry.name}${ratio ? ' (per 100,000 people)' : ''}`;
        lookupMap.set(`${entry.id}-${signal}`, {
          name: `${name} (7-day average)`,
          tooltipText: text,
          wrappee: entry,
        });
        const countSignal = entry.casesOrDeathSignals[primaryValue(entry, options).replace('avg', 'count')];
        lookupMap.set(`${entry.id}-${countSignal}`, {
          name,
          tooltipText: text.replace(' (7-day average) ', ''),
          wrappee: entry,
        });
      };
      add(false, false);
      add(false, true);
      add(true, false);
      add(true, true);
    });

  callMetaAPI(null, ['min_time', 'max_time', 'signal', 'geo_type', 'data_source'], {
    time_types: 'day',
  }).then((r) => {
    loading = false;

    const signalGroupMap = new Map();
    const levels = new Set();
    r.epidata.forEach((entry) => {
      const dataSource = entry.data_source;
      const id = `${dataSource}:${entry.signal}`;
      const known = lookupMap.get(`${dataSource}-${entry.signal}`);

      if (!known) {
        // limit to the one in the map only
        return;
      }
      const sensorEntry = known.wrappee || known;

      const signalGroup = sensorEntry.isCasesOrDeath ? CASES_DEATH_SOURCE : dataSource;
      if (!signalGroupMap.has(signalGroup)) {
        signalGroupMap.set(signalGroup, {
          id: signalGroup,
          name: sourceNameLookup[signalGroup] || signalGroup,
          levels: new Set(),
          minTime: parseAPITime(entry.min_time),
          maxTime: parseAPITime(entry.max_time),
          signals: [],
        });
      }
      const ds = signalGroupMap.get(signalGroup);

      levels.add(entry.geo_type);
      ds.levels.add(entry.geo_type);

      if (ds.signals.every((d) => d.id !== id)) {
        ds.signals.push({
          id,
          signal: entry.signal,
          dataSource: entry.data_source,
          entry: sensorEntry,
          name: known ? known.name : entry.signal,
          description: known ? known.tooltipText : 'no description found',
        });
      }
    });

    signalGroups = Array.from(signalGroupMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    signalGroupValue = $currentSensorEntry.isCasesOrDeath ? CASES_DEATH_SOURCE : $currentSensorEntry.id;
    signalValue = $currentSensorEntry.signal;
    levelList = [...levels].map(getLevelInfo);
    geoType = $currentSensorEntry.levels[0];
  });

  let currentMode = 'csv';

  let form = null;

  onMount(() => {
    if (form) {
      form.addEventListener('submit', () => {
        trackEvent(
          'export',
          'download',
          `signal=${signalValue},start_day=${iso(startDate)},end_day=${iso(endDate)},geo_type=${geoType}`,
        );
      });
    }
  });

  function addRegion(detail) {
    geoValues = [...geoValues, detail];
  }
  function removeRegion(detail) {
    geoValues = geoValues.filter((d) => d !== detail);
  }
  function setRegion(detail) {
    geoValues = detail ? [detail] : [];
  }

  function pythonDate(date) {
    return `date(${date.getFullYear()}, ${date.getMonth() + 1}, ${date.getDate()})`;
  }
</script>

<style>
  .root {
    flex-grow: 1;
    padding: 1em;
  }

  p {
    line-height: initial;
    margin: 0;
    margin-bottom: 0.5em;
  }

  .block {
    display: inline-block;
    display: flex;
    flex-direction: column;
    padding: 0.2em;
    width: 20em;
  }

  .group label {
    font-weight: bold;
  }

  .group {
    display: flex;
    flex-wrap: wrap;
  }

  button {
    width: auto;
  }

  section {
    padding: 1em;
  }

  pre {
    padding: 0.2em;
    background: #efefef;
    overflow: auto;
    white-space: pre;
  }

  .description {
    padding: 0;
    font-size: 80%;
  }

  .buttons {
    display: inline-flex;
    align-items: center;
    margin-top: 1em;
  }

  .buttons > button {
    min-width: 5em;
  }

  .info {
    width: 1.5em;
    height: 1.5em;
    display: inline-block;
  }

  .form-row {
    display: flex;
    margin-bottom: 0.5em;
  }

  .form-row > :first-child {
    width: 10em;
    flex-shrink: 0;
  }

  .region-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }

  .region-row label {
    margin-right: 0.5em;
  }

  .region-row :global(.search-container) {
    padding: 1px;
    width: 25em;
    visibility: hidden;
  }

  .search-visible :global(.search-container) {
    visibility: unset;
  }

  @media only screen and (max-width: 710px) {
    .block {
      width: 100%;
    }
  }
</style>

<div class="root" class:loading>
  <p>
    All signals displayed on the COVIDcast map are freely available for download here. You can also access the latest
    daily through the
    <a href="https://cmu-delphi.github.io/delphi-epidata/api/covidcast.html">COVIDcast API</a>
    which also includes numerous other signals.
  </p>
  <section>
    <h5>1. Select Signal</h5>
    <div class="group">
      <div class="block">
        <label for="ds">Data Sources</label>
        <select id="ds" bind:value={signalGroupValue} size="8">
          {#each signalGroups as group}
            <option value={group.id}>{group.name}</option>
          {/each}
        </select>
      </div>
      <div class="block">
        <label for="s">Signals</label>
        <select id="s" bind:value={signalValue} required size="8">
          {#if signalGroup}
            {#each signalGroup.signals as signal}
              <option value={signal.id}>{signal.name}</option>
            {/each}
          {:else}
            <option value="">Select a Data Source first</option>
          {/if}
        </select>
      </div>
      <div class="block">
        {#if signal}
          <h6>
            {signal.name}
            {#if signal.entry}
              <button
                title="Show sensor description"
                class="pg-button pg-button-circle info"
                on:click={() => {
                  currentInfoSensor.set(signal.entry);
                }}><IoMdHelp /></button>
            {/if}
          </h6>
          <p>{signal.description}</p>
          {#if signal.entry}
            <p>
              See also:
              {@html signal.entry.links.join(', ')}
            </p>
          {/if}
        {/if}
      </div>
    </div>
  </section>
  <section>
    <h5>2. Specify Parameters</h5>
    <div class="form-row">
      <span>Date Range</span>
      <Datepicker
        bind:selected={startDate}
        start={signalGroup ? signalGroup.minTime : minDate(new Date(), startDate)}
        end={signalGroup ? minDate(endDate, signalGroup.maxTime) : endDate}
        formattedSelected={iso(startDate)}>
        <button aria-label="selected start date" class="pg-button" on:>{iso(startDate)}</button>
      </Datepicker>
      &nbsp;-&nbsp;
      <Datepicker
        bind:selected={endDate}
        start={signalGroup ? maxDate(startDate, signalGroup.minTime) : startDate}
        end={signalGroup ? signalGroup.maxTime : maxDate(new Date(), endDate)}
        formattedSelected={iso(endDate)}>
        <button aria-label="selected end date" class="pg-button" on:>{iso(endDate)}</button>
      </Datepicker>
    </div>
    <div class="form-row">
      <label for="geo">Geographic Level</label>
      <div>
        <select id="geo" bind:value={geoType}>
          {#each levelList as level}
            <option value={level.id} disabled={!signalGroup || !signalGroup.levels.has(level.id)}>
              {level.labelPlural}
            </option>
          {/each}
        </select>
        <p class="description">
          Each geographic region is identified with a unique identifier, such as FIPS code. See the
          <a href="https://cmu-delphi.github.io/delphi-epidata/api/covidcast_geography.html">
            geographic coding documentation
          </a>
          for details.
        </p>
      </div>
    </div>
    <div class="form-row">
      <label for="region">Region</label>
      <div>
        <div>
          <input type="radio" name="region" value="all" id="region-all" bind:group={geoValuesMode} /><label
            for="region-all">All</label>
        </div>
        <div class="region-row" class:search-visible={geoValuesMode === 'single'}>
          <input
            type="radio"
            name="region"
            value="single"
            id="region-single"
            bind:group={geoValuesMode}
            disabled={geoItems.length === 0} />
          <label for="region-single">Specific region(s): </label>
          <Search
            className="search-container container-bg"
            placeholder={'Search for a region...'}
            items={geoItems}
            selectedItems={geoValues}
            labelFieldName="displayName"
            maxItemsToShowInList="5"
            on:add={(e) => addRegion(e.detail)}
            on:remove={(e) => removeRegion(e.detail)}
            on:change={(e) => setRegion(e.detail)} />
        </div>
      </div>
    </div>
    <div class="form-row">
      <label for="as-of">As of</label>
      <div>
        <div>
          <input type="radio" name="as-of" value="latest" id="as-of-latest" bind:group={asOfMode} /><label
            for="as-of-latest">Latest</label>
        </div>
        <div class="region-row">
          <input type="radio" name="as-of" value="single" id="as-of-single" bind:group={asOfMode} />
          <label for="as-of-single">Specific date: </label>
          <Datepicker
            bind:selected={asOfDate}
            formattedSelected={asOfDate ? iso(asOfDate) : 'Select date'}
            start={asOfStart}
            end={asOfEnd}>
            <button
              aria-label="selected as of date"
              class="pg-button"
              disabled={asOfMode === 'latest'}
              on:>{asOfDate ? iso(asOfDate) : 'Select date'}</button>
          </Datepicker>
        </div>
        <p class="description">
          The
          <code>as of</code>
          date allows to fetch only data that was available on or before this date.
        </p>
      </div>
    </div>
  </section>
  <section>
    <h5>3. Get Data</h5>
    <p>
      {@html signal && signal.entry ? signal.entry.credits : ''}
      Please acknowledge us as a source:
      <cite> Data from Delphi COVIDcast, covidcast.cmu.edu. </cite>
    </p>
    <div class="pg-button-group buttons">
      <button
        class="pg-button button"
        data-testid="csv"
        on:click={() => {
          currentMode = 'csv';
        }}
        class:selected={currentMode === 'csv'}
        disabled={!geoType || !signalValue}
        title="Get in CSV format">
        CSV
      </button>
      <button
        aria-pressed={String(currentMode === 'python')}
        data-testid="python"
        class="pg-button button"
        class:selected={currentMode === 'python'}
        on:click={() => {
          currentMode = 'python';
        }}
        title="Get Python Code">
        Python
      </button>
      <button
        aria-pressed={String(currentMode === 'r')}
        class="pg-button button"
        data-testid="r"
        class:selected={currentMode === 'r'}
        on:click={() => {
          currentMode = 'r';
        }}
        title="Get R Code">
        R
      </button>
    </div>
    {#if currentMode === 'csv'}
      <p>Direct link:</p>
      <form bind:this={form} id="form" method="GET" action={CSV_SERVER} download>
        <button type="submit" class="pg-button pg-text-button">Download CSV File</button>
        <input type="hidden" name="signal" value={signalValue} />
        <input type="hidden" name="start_day" value={iso(startDate)} />
        <input type="hidden" name="end_day" value={iso(endDate)} />
        <input type="hidden" name="geo_type" value={geoType} />
        {#if !isAllRegions}<input type="hidden" name="geo_values" value={geoIDs.join(',')} />{/if}
        {#if usesAsOf}<input type="hidden" name="as_of" value={iso(asOfDate)} />{/if}
      </form>
      <p>Manually fetch data:</p>
      <pre>
        {`wget --content-disposition "${CSV_SERVER}?signal=${signalValue}&start_day=${iso(startDate)}&end_day=${iso(endDate)}&geo_type=${geoType}${isAllRegions ? '' : `&geo_values=${geoIDs.join(',')}`}${usesAsOf ? `&as_of=${iso(asOfDate)}` : ''}"`}
      </pre>
      <p class="description">
        For more details about the API, see the
        <a href="https://cmu-delphi.github.io/delphi-epidata/">API documentation</a>. A description of the returned data
        structure can be found at:
        <a href="https://cmu-delphi.github.io/delphi-epidata/api/covidcast.html#response">covidcast</a>.
      </p>
    {:else if currentMode === 'python'}
      <p>Install <code>covidcast</code> via pip:</p>
      <pre>pip install covidcast</pre>
      <p>Fetch data:</p>
      <pre>
        {`from datetime import date
import covidcast

data = covidcast.signal("${signal ? signal.dataSource : ''}", "${signal ? signal.signal : ''}",
                        ${pythonDate(startDate)}, ${pythonDate(endDate)},
                        "${geoType}"${isAllRegions ? '' : `, ["${geoIDs.join('", "')}"]`}${usesAsOf ? `, as_of = ${pythonDate(asOfDate)}` : ''})`}
      </pre>
      <p class="description">
        For more details and examples, see the
        <a href="https://cmu-delphi.github.io/covidcast/covidcast-py/html/">package documentation</a>. A description of
        the returned data structure can be found at:
        <a
          href="https://cmu-delphi.github.io/covidcast/covidcast-py/html/signals.html#covidcast.signal">covidcast.signal</a>.
      </p>
    {:else if currentMode === 'r'}
      <p>Install <code>covidcast</code> using <a href="https://devtools.r-lib.org/">devtools</a> :</p>
      <pre>devtools::install_github("cmu-delphi/covidcast", ref = "main", subdir = "R-packages/covidcast")</pre>
      <p>Fetch data:</p>
      <pre>
        {`library(covidcast)

cc_data <- suppressMessages(
covidcast_signal(data_source = "${signal ? signal.dataSource : ''}", signal = "${signal ? signal.signal : ''}",
                 start_day = "${iso(startDate)}", end_day = "${iso(endDate)}",
                 geo_type = "${geoType}"${isAllRegions ? '' : `, geo_values = c("${geoIDs.join('", "')}")`}${usesAsOf ? `, as_of = "${iso(asOfDate)}"` : ''})
)`}
      </pre>
      <p class="description">
        For more details and examples, see the
        <a href="https://cmu-delphi.github.io/covidcast/covidcastR/">package documentation</a>. A description of the
        returned data structure can be found at:
        <a
          href="https://cmu-delphi.github.io/covidcast/covidcastR/reference/covidcast_signal.html#value">covidcast_signal</a>.
      </p>
    {/if}
  </section>
</div>
