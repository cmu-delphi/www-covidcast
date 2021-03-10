<script>
  import { callMetaAPI } from '../../data/api';
  import Datepicker from '../../components/Calendar/Datepicker.svelte';
  import { getLevelInfo, primaryValue, sensorList, sensorMap } from '../../stores/constants';
  import { parseAPITime } from '../../data';
  import { currentSensorEntry, smallMultipleTimeSpan } from '../../stores';
  import { timeMonth } from 'd3-time';
  import { onMount } from 'svelte';
  import { trackEvent } from '../../stores/ga';
  import Search from '../../components/Search.svelte';
  import { infosByLevel } from '../../maps';
  import { formatDateISO } from '../../formats';
  import InfoDialogButton from '../../components/InfoDialogButton.svelte';
  import { questionCategories, refSensor } from '../../modes/survey/questions';
  import { CASES_DEATH_SOURCE, getDataSource } from '../../stores/dataSourceLookup';

  const CSV_SERVER = 'https://delphi.cmu.edu/csv';

  let loading = true;
  /**
   * @type {{id: string, name: string, levels: Set<string>, minTime: Date, maxTime: Date, signals: {id: string, dataSource: string, signal: string, name: string, description: string}[]}[]}
   */
  let signalGroups = [];
  let signalGroupValue = null;
  let signalValue = null;
  let geoType = 'county';

  let endDate = new Date();
  let startDate = new Date();

  function initDate(defaultEndDate) {
    endDate = defaultEndDate;
    // one month in the past
    startDate = timeMonth.offset(defaultEndDate, -1);
  }
  $: initDate($smallMultipleTimeSpan[1]);

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
  $: geoItems = infosByLevel[geoType] || [];
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
  // add the survey questions one
  questionCategories.forEach((cat) => {
    cat.questions.forEach((question) => {
      const key = `${question.dataSource}-${question.signal}`;
      if (lookupMap.has(key)) {
        return;
      }
      lookupMap.set(key, {
        name: question.name,
        tooltipText: question.signalTooltip,
        wrappee: refSensor,
        fake: true,
      });
    });
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
          name: getDataSource(signalGroup),
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
          entry: known.fake ? null : sensorEntry,
          name: known ? known.name : entry.signal,
          description: known ? known.tooltipText : 'no description found',
        });
      }
    });

    signalGroups = Array.from(signalGroupMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    signalGroupValue = $currentSensorEntry.isCasesOrDeath ? CASES_DEATH_SOURCE : $currentSensorEntry.id;
    signalValue = `${$currentSensorEntry.id}:${$currentSensorEntry.signal}`;
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
          `signal=${signalValue},start_day=${formatDateISO(startDate)},end_day=${formatDateISO(
            endDate,
          )},geo_type=${geoType}`,
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

  $: dateRange = signalGroup || { minTime: timeMonth(new Date(), -1), maxTime: timeMonth(new Date(), 1) };
</script>

<style>
  .root {
    flex-grow: 1;
    padding: 1em;
  }

  .description {
    padding: 0;
    font-size: 80%;
  }

  .region-row :global(.search-container) {
    display: inline-flex;
  }

  .code-block {
    max-width: calc(100vw - 80px);
  }
</style>

<div class="root uk-container" class:loading>
  <p>
    All signals displayed on the COVIDcast map are freely available for download here. You can also access the latest
    daily through the
    <a href="https://cmu-delphi.github.io/delphi-epidata/api/covidcast.html">COVIDcast API</a>
    which also includes numerous other signals.
  </p>
  <section class="uk-margin-top">
    <h4>1. Select Signal</h4>
    <div data-uk-grid class="uk-form-stacked">
      <div class="uk-width-1-3@m uk-width-expand@s">
        <label for="ds" class="uk-form-label">Data Sources</label>
        <div class="uk-form-controls">
          <select id="ds" bind:value={signalGroupValue} size="8" class="uk-select">
            {#each signalGroups as group}
              <option value={group.id}>{group.name}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="uk-width-1-3@m uk-width-expand@s">
        <label for="s" class="uk-form-label">Signals</label>
        <div class="uk-form-controls">
          <select id="s" bind:value={signalValue} required size="8" class="uk-select">
            {#if signalGroup}
              {#each signalGroup.signals as signal}
                <option value={signal.id}>{signal.name}</option>
              {/each}
            {:else}
              <option value="">Select a Data Source first</option>
            {/if}
          </select>
        </div>
      </div>
      <div class="uk-width-1-3@m uk-width-expand@s">
        {#if signal}
          <span class="uk-form-label">
            {signal.name}
            <InfoDialogButton sensor={signal.entry} />
          </span>
          <div class="uk-form-controls-text">{signal.description}</div>
          {#if signal.entry}
            <div class="uk-form-controls-text">
              See also:
              {@html signal.entry.links.join(', ')}
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </section>
  <section class="uk-form-horizontal uk-margin-top">
    <h4>2. Specify Parameters</h4>
    <div>
      <span class="uk-form-label">Date Range</span>
      <div class="uk-form-controls">
        <Datepicker
          bind:selected={startDate}
          start={dateRange.minTime}
          end={dateRange.maxTime}
          formattedSelected={formatDateISO(startDate)}>
          <button aria-label="selected start date" class="uk-input" on:>{formatDateISO(startDate)}</button>
        </Datepicker>
        -
        <Datepicker
          bind:selected={endDate}
          start={dateRange.minTime}
          end={dateRange.maxTime}
          formattedSelected={formatDateISO(endDate)}>
          <button aria-label="selected end date" class="uk-input" on:>{formatDateISO(endDate)}</button>
        </Datepicker>
      </div>
    </div>
    <div>
      <label for="geo" class="uk-form-label">Geographic Level</label>
      <div class="uk-form-controls">
        <select id="geo" bind:value={geoType} class="uk-select">
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
    <div>
      <label for="region" class="uk-form-label">Region</label>
      <div class="uk-form-controls">
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
            className="search-container"
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
    <div class="uk-margin-top">
      <label for="as-of" class="uk-form-label">As of</label>
      <div class="uk-form-controls">
        <div>
          <input type="radio" name="as-of" value="latest" id="as-of-latest" bind:group={asOfMode} /><label
            for="as-of-latest">Latest</label>
        </div>
        <div class="region-row">
          <input type="radio" name="as-of" value="single" id="as-of-single" bind:group={asOfMode} />
          <label for="as-of-single">Specific date: </label>
          <Datepicker
            bind:selected={asOfDate}
            formattedSelected={asOfDate ? formatDateISO(asOfDate) : 'Select date'}
            start={asOfStart}
            end={asOfEnd}>
            <button
              aria-label="selected as of date"
              class="uk-input"
              disabled={asOfMode === 'latest'}
              on:>{asOfDate ? formatDateISO(asOfDate) : 'Select date'}</button>
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
  <section class="uk-margin-top">
    <h4>3. Get Data</h4>
    <p>
      {@html signal && signal.entry ? signal.entry.credits : ''}
      Please acknowledge us as a source:
      <cite> Data from Delphi COVIDcast, delphi.cmu.edu/covidcast/ </cite>
    </p>
    <div class="uk-button-group">
      <button
        class="uk-button uk-button-default"
        data-testid="csv"
        on:click={() => {
          currentMode = 'csv';
        }}
        class:uk-active={currentMode === 'csv'}
        disabled={!geoType || !signalValue}
        title="Get in CSV format">
        CSV
      </button>
      <button
        aria-pressed={String(currentMode === 'python')}
        class="uk-button uk-button-default"
        data-testid="python"
        class:uk-active={currentMode === 'python'}
        on:click={() => {
          currentMode = 'python';
        }}
        title="Get Python Code">
        Python
      </button>
      <button
        aria-pressed={String(currentMode === 'r')}
        class="uk-button uk-button-default"
        data-testid="r"
        class:uk-active={currentMode === 'r'}
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
        <button type="submit" class="uk-button uk-button-default">Download CSV File</button>
        <input type="hidden" name="signal" value={signalValue} />
        <input type="hidden" name="start_day" value={formatDateISO(startDate)} />
        <input type="hidden" name="end_day" value={formatDateISO(endDate)} />
        <input type="hidden" name="geo_type" value={geoType} />
        {#if !isAllRegions}<input type="hidden" name="geo_values" value={geoIDs.join(',')} />{/if}
        {#if usesAsOf}<input type="hidden" name="as_of" value={formatDateISO(asOfDate)} />{/if}
      </form>
      <p>Manually fetch data:</p>
      <pre
        class="code-block"><code>
        {`wget --content-disposition "${CSV_SERVER}?signal=${signalValue}&start_day=${formatDateISO(startDate)}&end_day=${formatDateISO(endDate)}&geo_type=${geoType}${isAllRegions ? '' : `&geo_values=${geoIDs.join(',')}`}${usesAsOf ? `&as_of=${formatDateISO(asOfDate)}` : ''}"`}
      </code></pre>
      <p class="description">
        For more details about the API, see the
        <a href="https://cmu-delphi.github.io/delphi-epidata/">API documentation</a>. A description of the returned data
        structure can be found at:
        <a href="https://cmu-delphi.github.io/delphi-epidata/api/covidcast.html#response">covidcast</a>.
      </p>
    {:else if currentMode === 'python'}
      <p>Install <code>covidcast</code> via pip:</p>
      <pre><code>pip install covidcast</code></pre>
      <p>Fetch data:</p>
      <pre class="code-block"><code>
        {`from datetime import date
import covidcast

data = covidcast.signal("${signal ? signal.dataSource : ''}", "${signal ? signal.signal : ''}",
                        ${pythonDate(startDate)}, ${pythonDate(endDate)},
                        "${geoType}"${isAllRegions ? '' : `, ["${geoIDs.join('", "')}"]`}${usesAsOf ? `, as_of = ${pythonDate(asOfDate)}` : ''})`}
      </code></pre>
      <p class="description">
        For more details and examples, see the
        <a href="https://cmu-delphi.github.io/covidcast/covidcast-py/html/">package documentation</a>. A description of
        the returned data structure can be found at:
        <a
          href="https://cmu-delphi.github.io/covidcast/covidcast-py/html/signals.html#covidcast.signal">covidcast.signal</a>.
      </p>
    {:else if currentMode === 'r'}
      <p>Install <code>covidcast</code> using <a href="https://devtools.r-lib.org/">devtools</a> :</p>
      <pre><code>devtools::install_github("cmu-delphi/covidcast", ref = "main", subdir = "R-packages/covidcast")</code></pre>
      <p>Fetch data:</p>
      <pre class="code-block"><code>
        {`library(covidcast)

cc_data <- suppressMessages(
covidcast_signal(data_source = "${signal ? signal.dataSource : ''}", signal = "${signal ? signal.signal : ''}",
                 start_day = "${formatDateISO(startDate)}", end_day = "${formatDateISO(endDate)}",
                 geo_type = "${geoType}"${isAllRegions ? '' : `, geo_values = c("${geoIDs.join('", "')}")`}${usesAsOf ? `, as_of = "${formatDateISO(asOfDate)}"` : ''})
)`}
      </code></pre>
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
