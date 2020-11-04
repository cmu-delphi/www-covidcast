<script>
  import { timeFormat } from 'd3-time-format';
  import { callMetaAPI } from '../../data/api';
  import Datepicker from '../../components/Calendar/Datepicker.svelte';
  import { getLevelInfo, primaryValue, sensorList, sensorMap } from '../../stores/constants';
  import { parseAPITime } from '../../data';
  import { currentSensorEntry, smallMultipleTimeSpan } from '../../stores';
  import { timeMonth } from 'd3-time';
  import { onMount } from 'svelte';
  import { trackEvent } from '../../stores/ga';

  const CSV_SERVER = 'https://delphi.cmu.edu/csv';
  const iso = timeFormat('%Y-%m-%d');

  const sourceNameLookup = {
    'doctor-visits': 'COVID-Related Doctor Visits',
    'fb-survey': 'Facebook Survey Results',
    ght: 'Google Search Trends',
    'hospital-admissions': 'Hospital Admissions',
    'indicator-combination': 'Delphi Data Sources',
    quidel: 'Quidel Antigen Tests',
    safegraph: 'SafeGraph Mobility Data',
  };

  let loading = true;
  /**
   * @type {{id: string, name: string, levels: Set<string>, minTime: Date, maxTime: Date, signals: {id: string, name: string, description: string}[]}[]}
   */
  let sources = [];
  let sourceValue = null;
  let signalValue = null;
  let geoType = 'county';
  let endDate = $smallMultipleTimeSpan[1];
  // one month in the past
  let startDate = timeMonth.offset($smallMultipleTimeSpan[1], -1);

  let levelList = [];
  $: source = sourceValue ? sources.find((d) => d.id === sourceValue) : null;
  $: signal = signalValue && source ? source.signals.find((d) => d.id === signalValue) : null;

  $: {
    if (source && !source.signals.find((d) => d.id === signalValue)) {
      signalValue = source.signals[0].id;
    }
  }

  $: {
    if (source && !source.levels.has(geoType)) {
      // reset to a valid one
      geoType = Array.from(source.levels)[0];
    }
  }

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
        });
        const countSignal = entry.casesOrDeathSignals[primaryValue(entry, options).replace('avg', 'count')];
        lookupMap.set(`${entry.id}-${countSignal}`, {
          name,
          tooltipText: text.replace(' (7-day average) ', ''),
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

    const data = new Map();
    const levels = new Set();
    r.epidata.forEach((entry) => {
      const dataSource = entry.data_source;
      const id = `${dataSource}:${entry.signal}`;
      let known = lookupMap.get(`${dataSource}-${entry.signal}`);

      if (!known) {
        // limit to the one in the map only
        return;
      }

      if (!data.has(dataSource)) {
        data.set(dataSource, {
          id: dataSource,
          name: sourceNameLookup[dataSource] || dataSource,
          levels: new Set(),
          minTime: parseAPITime(entry.min_time),
          maxTime: parseAPITime(entry.max_time),
          signals: [],
        });
      }
      const ds = data.get(dataSource);

      levels.add(entry.geo_type);
      ds.levels.add(entry.geo_type);

      if (ds.signals.every((d) => d.id !== id)) {
        ds.signals.push({
          id,
          signal: entry.signal,
          name: known ? known.name : entry.signal,
          description: known ? known.tooltipText : 'no description found',
        });
      }
    });

    sources = Array.from(data.values()).sort((a, b) => a.name.localeCompare(b.name));
    sourceValue = $currentSensorEntry.id;
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
</script>

<style>
  .root {
    flex-grow: 1;
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

  form {
    visibility: hidden;
  }
</style>

<div class="root" class:loading>
  <p>
    All signals displayed on the COVIDcast map are freely available for download here. You can also access the latest
    daily through the <a href="https://cmu-delphi.github.io/delphi-epidata/api/covidcast.html">COVIDcast API</a> which also
    includes numerous other signals.
  </p>
  <section>
    <h4>1. Select Signal</h4>
    <div data-uk-grid class="uk-form-stacked">
      <div class="uk-width-1-3@m uk-width-expand@s">
        <label for="ds" class="uk-form-label">Data Sources</label>
        <div class="uk-form-controls">
          <select id="ds" bind:value={sourceValue} size="8" class="uk-select">
            {#each sources as source}
              <option value={source.id}>{source.name}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="uk-width-1-3@m uk-width-expand@s">
        <label for="s" class="uk-form-label">Signals</label>
        <div class="uk-form-controls">
          <select id="s" bind:value={signalValue} required size="8" class="uk-select">
            {#if source}
              {#each source.signals as signal}
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
          <span class="uk-form-label">{signal.name}</span>
          <div class="uk-form-controls-text">{signal.description}</div>
        {/if}
      </div>
    </div>
  </section>
  <section class="uk-form-horizontal">
    <h4>2. Specify Parameters</h4>
    <div>
      <span class="uk-form-label">Date Range</span>
      <div class="uk-form-controls">
        <Datepicker
          bind:selected={startDate}
          start={source ? source.minTime : new Date()}
          end={minDate(endDate, source ? source.maxTime : new Date())}
          formattedSelected={iso(startDate)}>
          <button aria-label="selected start date" class="uk-input" on:>{iso(startDate)}</button>
        </Datepicker>
        -
        <Datepicker
          bind:selected={endDate}
          start={maxDate(startDate, source ? source.minTime : new Date())}
          end={source ? source.maxTime : new Date()}
          formattedSelected={iso(endDate)}>
          <button aria-label="selected end date" class="uk-input" on:>{iso(endDate)}</button>
        </Datepicker>
      </div>
    </div>
    <div>
      <label for="geo" class="uk-form-label">Geographic Level</label>
      <div class="uk-form-controls">
        <select id="geo" bind:value={geoType} class="uk-select">
          {#each levelList as level}
            <option value={level.id} disabled={!source || !source.levels.has(level.id)}>{level.labelPlural}</option>
          {/each}
        </select>
        <p class="description">
          Each geographic region is identified with a unique identifier, such as FIPS code. See the <a
            href="https://cmu-delphi.github.io/delphi-epidata/api/covidcast_geography.html">
            geographic coding documentation
          </a> for details.
        </p>
      </div>
    </div>
  </section>
  <section>
    <h4>3. Get Data</h4>
    <p>
      We are happy for you to use this data in products and publications. Please acknowledge us as a source: <cite> Data
        from Delphi COVIDcast, covidcast.cmu.edu. </cite>
    </p>
    <div class="uk-button-group">
      <button
        class="uk-button uk-button-default"
        data-testid="csv"
        on:click={() => {
          currentMode = 'csv';
        }}
        type="submit"
        form="form"
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
    {#if currentMode === 'python'}
      <p>Install <code>covidcast</code> via pip:</p>
      <pre>pip install covidcast</pre>
      <p>Fetch data:</p>
      <pre>
        {`from datetime import date
import covidcast

data = covidcast.signal("${source ? source.id : ''}", "${signal ? signal.signal : ''}",
                        date(${startDate.getFullYear()}, ${startDate.getMonth() + 1}, ${startDate.getDate()}), date(${endDate.getFullYear()}, ${endDate.getMonth() + 1}, ${endDate.getDate()}),
                        "${geoType}")`}
      </pre>
      <p class="description">
        For more details and examples, see the <a href="https://cmu-delphi.github.io/covidcast/covidcast-py/html/">package
          documentation.</a>
      </p>
    {:else if currentMode === 'r'}
      <p>Install <code>covidcast</code> using <a href="https://devtools.r-lib.org/">devtools</a> :</p>
      <pre>devtools::install_github("cmu-delphi/covidcast", ref = "main", subdir = "R-packages/covidcast")</pre>
      <p>Fetch data:</p>
      <pre>
        {`library(covidcast)

cc_data <- suppressMessages(
covidcast_signal(data_source = "${source ? source.id : ''}", signal = "${signal ? signal.signal : ''}",
                 start_day = "${iso(startDate)}", end_day = "${iso(endDate)}",
                 geo_type = "${geoType}")
)`}
      </pre>
      <p class="description">
        For more details and examples, see the <a href="https://cmu-delphi.github.io/covidcast/covidcastR/">package
          documentation.</a>
      </p>
    {/if}
    <form bind:this={form} id="form" method="GET" action={CSV_SERVER} download>
      <input type="hidden" name="signal" value={signalValue} />
      <input type="hidden" name="start_day" value={iso(startDate)} />
      <input type="hidden" name="end_day" value={iso(endDate)} />
      <input type="hidden" name="geo_type" value={geoType} />
    </form>
  </section>
</div>
