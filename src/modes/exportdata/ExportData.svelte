<script>
  import modes from '..';
  import SingleModeToggle from '../../components/SingleModeToggle.svelte';
  import { timeFormat } from 'd3-time-format';
  import { callMetaAPI } from '../../data/api';
  import Datepicker from '../../components/Calendar/Datepicker.svelte';
  import { getLevelInfo, sensorMap } from '../../stores/constants';
  import { parseAPITime } from '../../data';
  import { currentSensorEntry, smallMultipleTimeSpan } from '../../stores';

  const CSV_SERVER = 'http://rosmarus.refsmmat.com:5000';
  const iso = timeFormat('%Y-%m-%d');

  let loading = true;
  /**
   * @type {{id: string, name: string, levels: Set<string>, minTime: Date, maxTime: Date, signals: {id: string, name: string, description: string}[]}[]}
   */
  let sources = [];
  let sourceValue = null;
  let signalValue = null;
  let geoType = 'county';
  let startDate = $smallMultipleTimeSpan[0];
  let endDate = $smallMultipleTimeSpan[1];

  let levelList = [];
  $: source = sourceValue ? sources.find((d) => d.id === sourceValue) : null;
  $: signal = signalValue && source ? source.signals.find((d) => d.id === signalValue) : null;

  $: {
    if (source && !source.signals.find((d) => d.id === signalValue)) {
      signalValue = source.signals[0].id;
    }
  }

  $: csvUrl = '';
  $: {
    const url = new URL(`${CSV_SERVER}/csv`);
    url.searchParams.set('signal', signal ? signal.id : '');
    url.searchParams.set('start_day', iso(startDate));
    url.searchParams.set('end_day', iso(endDate));
    url.searchParams.set('geo_type', geoType);
    csvUrl = url.toString();
  }

  callMetaAPI().then((r) => {
    loading = false;

    const data = new Map();
    const levels = new Set();
    r.epidata.forEach((entry) => {
      const dataSource = entry.data_source;
      if (!data.has(dataSource)) {
        data.set(dataSource, {
          id: dataSource,
          name: dataSource,
          levels: new Set(),
          minTime: parseAPITime(entry.min_time),
          maxTime: parseAPITime(entry.max_time),
          signals: [],
        });
      }
      const ds = data.get(dataSource);

      levels.add(entry.geo_type);
      ds.levels.add(entry.geo_type);

      const id = `${dataSource}:${entry.signal}`;
      if (ds.signals.every((d) => d.id !== id)) {
        const known = sensorMap.get(`${dataSource}-${entry.signal}`);
        ds.signals.push({
          id,
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
</script>

<style>
  .root {
    flex-grow: 1;
    padding: 1em;
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
  }

  button {
    width: auto;
  }

  section {
    padding: 1em;
  }
</style>

<div class="root" class:loading>
  <h4>Export Data</h4>
  <section>
    <h5>1. Select Signal</h5>
    <div class="group">
      <div class="block">
        <label for="ds">Data Sources</label>
        <select id="ds" bind:value={sourceValue} size="8">
          {#each sources as source}
            <option value={source.id}>{source.name}</option>
          {/each}
        </select>
      </div>
      <div class="block">
        <label for="s">Signals</label>
        <select id="s" bind:value={signalValue} required size="8">
          {#if source}
            {#each source.signals as signal}
              <option value={signal.id}>{signal.name}</option>
            {/each}
          {:else}
            <option value="">Select a Data Source first</option>
          {/if}
        </select>
      </div>
      <div class="block">
        {#if signal}
          <h6>{signal.name}</h6>
          <p>{signal.description}</p>
        {/if}
      </div>
    </div>
  </section>
  <section>
    <h5>2. Specify Parameter</h5>
    <div>
      <span>Date Range</span>
      <Datepicker
        bind:selected={startDate}
        start={source ? source.minTime : new Date()}
        end={source ? source.maxTime : new Date()}
        formattedSelected={iso(startDate)}>
        <button aria-label="selected start date" class="pg-button" on:>{iso(startDate)}</button>
      </Datepicker>
      -
      <Datepicker
        bind:selected={endDate}
        start={source ? source.minTime : new Date()}
        end={source ? source.maxTime : new Date()}
        formattedSelected={iso(endDate)}>
        <button aria-label="selected end date" class="pg-button" on:>{iso(endDate)}</button>
      </Datepicker>
    </div>
    <div>
      <label for="geo">Geographic Level</label>
      <select id="geo" bind:value={geoType}>
        {#each levelList as level}
          <option value={level.id} disabled={!source || !source.levels.has(level.id)}>{level.labelPlural}</option>
        {/each}
      </select>
    </div>
  </section>
  <section>
    <h5>3. Get Data</h5>
    <form method="GET" action="{CSV_SERVER}/csv" target="_blank">
      <input type="hidden" name="signal" value={signalValue} />
      <input type="hidden" name="start_day" value={iso(startDate)} />
      <input type="hidden" name="end_day" value={iso(endDate)} />
      <input type="hidden" name="geo_type" value={geoType} />
      <button type="submit" disabled={!geoType || !signalValue} class="pg-button">Download CSV</button>
    </form>
  </section>
  <SingleModeToggle mode={modes[0]} label="Back" />
</div>
