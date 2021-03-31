<script>
  import { callMetaAPI } from '../../data/api';
  import Datepicker from '../../components/Calendar/Datepicker.svelte';
  import { getLevelInfo, sensorList } from '../../stores/constants';
  import { parseAPITime } from '../../data';
  import { currentDateObject, currentSensorEntry } from '../../stores';
  import { timeMonth } from 'd3-time';
  import { onMount } from 'svelte';
  import { trackEvent } from '../../stores/ga';
  import Search from '../../components/Search.svelte';
  import { getCountiesOfState, infosByLevel } from '../../maps';
  import { formatDateISO } from '../../formats';
  import { questions } from '../../stores/questions';
  import { DateParam } from '../../stores/params';
  import FancyHeader from '../mobile/FancyHeader.svelte';
  import '../mobile/common.css';

  const CSV_SERVER = 'https://delphi.cmu.edu/csv';

  let loading = true;
  /**
   * @type {{id: string, name: string, levels: Set<string>, minTime: Date, maxTime: Date, sensors: (import('../../stores/constants').Sensor)[]}[]}
   */
  let sensorGroups = [];
  let sensorGroupValue = null;
  let sensorValue = null;
  let geoType = 'county';

  let endDate = new Date();
  let startDate = new Date();

  function initDate(date) {
    const param = new DateParam(date);
    endDate = param.sparkLineTimeFrame.max;
    startDate = param.sparkLineTimeFrame.min;
  }
  $: initDate($currentDateObject);

  let levelList = [];
  $: sensorGroup = sensorGroupValue ? sensorGroups.find((d) => d.id === sensorGroupValue) : null;
  $: sensor = sensorValue && sensorGroup ? sensorGroup.sensors.find((d) => d.key === sensorValue) : null;

  $: {
    if (sensorGroup && !sensorGroup.sensors.find((d) => d.key === sensorValue)) {
      sensorValue = sensorGroup.sensors[0].key;
    }
  }

  $: {
    if (sensorGroup && !sensorGroup.levels.has(geoType)) {
      // reset to a valid one
      geoType = Array.from(sensorGroup.levels)[0];
    }
  }

  function guessMode(itemLength) {
    return geoValuesMode === 'all' || itemLength === 0 ? 'all' : 'single';
  }

  let geoValuesMode = 'all';
  let geoValues = [];
  $: geoItems = [...(infosByLevel[geoType] || []), ...(geoType === 'county' ? infosByLevel.state : [])];
  $: {
    if (geoItems != null) {
      geoValues = [];
      geoValuesMode = guessMode(geoItems.length);
    }
  }
  function flatIds(geoValues) {
    if (geoType === 'county') {
      // flatten states to its counties
      return geoValues
        .map((d) => (d.level === 'state' ? getCountiesOfState(d).map((d) => d.propertyId) : d.propertyId))
        .flat();
    } else {
      return geoValues.map((d) => d.propertyId);
    }
  }
  $: isAllRegions = geoValuesMode === 'all' || geoValues.length === 0;
  $: geoIDs = flatIds(geoValues);

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
   * @type {Map<string, import('../../stores/constants').Sensor>}
   */
  const lookupMap = new Map();
  // create a flat list of all that is used
  sensorList.forEach((sensor) => {
    if (sensor.isCasesOrDeath) {
      Object.values(sensor.casesOrDeathSensors).forEach((sensor) => {
        lookupMap.set(sensor.key, sensor);
        if (sensor.rawSensor) {
          lookupMap.set(sensor.rawSensor.key, sensor.rawSensor);
        }
      });
    }
    lookupMap.set(sensor.key, sensor);
    if (sensor.rawSensor) {
      lookupMap.set(sensor.rawSensor.key, sensor.rawSensor);
    }
  });
  // add the survey questions one
  questions.forEach((question) => {
    const sensor = question.sensor;
    if (!lookupMap.has(sensor.key)) {
      lookupMap.set(sensor.key, sensor);
    }
    if (sensor.rawSensor && !lookupMap.has(sensor.rawSensor.key)) {
      lookupMap.set(sensor.rawSensor.key, sensor.rawSensor);
    }
  });

  callMetaAPI(null, ['min_time', 'max_time', 'signal', 'geo_type', 'data_source'], {
    time_types: 'day',
  }).then((r) => {
    loading = false;

    const signalGroupMap = new Map();
    const levels = new Set();
    r.epidata.forEach((entry) => {
      const dataSource = entry.data_source;
      const key = `${dataSource}-${entry.signal}`;
      const sensor = lookupMap.get(key);

      if (!sensor) {
        // limit to the one in the map only
        return;
      }
      const signalGroup = sensor.dataSourceName;
      if (!signalGroupMap.has(signalGroup)) {
        signalGroupMap.set(signalGroup, {
          id: signalGroup,
          name: signalGroup,
          levels: new Set(),
          minTime: parseAPITime(entry.min_time),
          maxTime: parseAPITime(entry.max_time),
          sensors: [],
        });
      }
      const ds = signalGroupMap.get(signalGroup);

      levels.add(entry.geo_type);
      ds.levels.add(entry.geo_type);

      if (ds.sensors.every((d) => d.key !== key)) {
        ds.sensors.push(sensor);
      }
    });

    sensorGroups = Array.from(signalGroupMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    for (const sensorGroup of sensorGroups) {
      sensorGroup.sensors.sort((a, b) => a.name.localeCompare(b.name));
    }
    sensorGroupValue = $currentSensorEntry.dataSourceName;
    sensorValue = $currentSensorEntry.key;
    levelList = [...levels].map(getLevelInfo);
    geoType = $currentSensorEntry.levels[0];
  });

  let form = null;

  onMount(() => {
    if (form) {
      form.addEventListener('submit', () => {
        trackEvent(
          'export',
          'download',
          `signal=${sensor ? `${sensor.id}:${sensor.signal}` : ''},start_day=${formatDateISO(
            startDate,
          )},end_day=${formatDateISO(endDate)},geo_type=${geoType}`,
        );
      });
    }
  });

  function addRegion(detail) {
    geoValues = [...geoValues, detail];
    if (detail && geoValuesMode != 'single') {
      geoValuesMode = 'single';
    }
  }
  function removeRegion(detail) {
    geoValues = geoValues.filter((d) => d !== detail);
  }
  function setRegion(detail) {
    geoValues = detail ? [detail] : [];
    if (detail && geoValuesMode != 'single') {
      geoValuesMode = 'single';
    }
  }

  function pythonDate(date) {
    return `date(${date.getFullYear()}, ${date.getMonth() + 1}, ${date.getDate()})`;
  }

  $: dateRange = sensorGroup || { minTime: timeMonth(new Date(), -1), maxTime: timeMonth(new Date(), 1) };
</script>

<div class="mobile-root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <h2>COVIDcast <span>Export</span></h2>
    </div>
  </div>
  <div class="uk-container content-grid">
    <div class="grid-3-11" class:loading>
      <p>
        All signals displayed in COVIDcast are freely available for download here. You can also access the latest daily
        through the
        <a href="https://cmu-delphi.github.io/delphi-epidata/api/covidcast.html">COVIDcast API</a>
        which also includes numerous other signals.
      </p>
      <section class="uk-margin-top">
        <FancyHeader sub="Signal" normal>1. Select</FancyHeader>
        <p>Select a data source and a signal to start with.</p>

        <div data-uk-grid class="uk-form-stacked">
          <div class="uk-width-1-2@m uk-width-expand@s">
            <label for="ds" class="uk-form-label">Data Sources</label>
            <div class="uk-form-controls">
              <select id="ds" bind:value={sensorGroupValue} size="8" class="uk-select">
                {#each sensorGroups as group}
                  <option value={group.id}>{group.name}</option>
                {/each}
              </select>
            </div>
          </div>
          <div class="uk-width-1-2@m uk-width-expand@s">
            <label for="s" class="uk-form-label">Signals</label>
            <div class="uk-form-controls">
              <select id="s" bind:value={sensorValue} required size="8" class="uk-select">
                {#if sensorGroup}
                  {#each sensorGroup.sensors as sensor}
                    <option value={sensor.key}>{sensor.name}</option>
                  {/each}
                {:else}
                  <option value="">Select a Data Source first</option>
                {/if}
              </select>
            </div>
          </div>
        </div>

        {#if sensor}
          <h3 class="mobile-h3 uk-margin-top">{sensor.name}</h3>
          <p>
            {@html sensor.description}
          </p>
          <p>See also:</p>
          <ul>
            {#each sensor.links as link}
              <li>
                {@html link}
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="uk-form-horizontal uk-margin-large-top">
        <FancyHeader sub="Parameters" normal>2. Specify</FancyHeader>
        <p>Customize the date range and pick a geographic level to download data for</p>
        <div>
          <span class="uk-form-label">Date range</span>
          <div class="uk-form-controls">
            <Datepicker
              bind:selected={startDate}
              start={dateRange.minTime}
              end={dateRange.maxTime}
              formattedSelected={formatDateISO(startDate)}
            >
              <button aria-label="selected start date" class="uk-input" on:>{formatDateISO(startDate)}</button>
            </Datepicker>
            -
            <Datepicker
              bind:selected={endDate}
              start={dateRange.minTime}
              end={dateRange.maxTime}
              formattedSelected={formatDateISO(endDate)}
            >
              <button aria-label="selected end date" class="uk-input" on:>{formatDateISO(endDate)}</button>
            </Datepicker>
          </div>
        </div>
        <div>
          <label for="geo" class="uk-form-label">Geographic level</label>
          <div class="uk-form-controls">
            <select id="geo" bind:value={geoType} class="uk-select">
              {#each levelList as level}
                <option value={level.id} disabled={!sensorGroup || !sensorGroup.levels.has(level.id)}>
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
                for="region-all">All</label
              >
            </div>
            <div class="region-row" class:search-visible={geoValuesMode === 'single'}>
              <input
                type="radio"
                name="region"
                value="single"
                id="region-single"
                bind:group={geoValuesMode}
                disabled={geoItems.length === 0}
              />
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
                on:change={(e) => setRegion(e.detail)}
              />
            </div>
          </div>
        </div>
        <div class="uk-margin-top">
          <label for="as-of" class="uk-form-label">As of</label>
          <div class="uk-form-controls">
            <div>
              <input type="radio" name="as-of" value="latest" id="as-of-latest" bind:group={asOfMode} /><label
                for="as-of-latest">Latest</label
              >
            </div>
            <div class="region-row">
              <input type="radio" name="as-of" value="single" id="as-of-single" bind:group={asOfMode} />
              <label for="as-of-single">Specific date: </label>
              <Datepicker
                bind:selected={asOfDate}
                formattedSelected={asOfDate ? formatDateISO(asOfDate) : 'Select date'}
                start={asOfStart}
                end={asOfEnd}
              >
                <button aria-label="selected as of date" class="uk-input" disabled={asOfMode === 'latest'} on:
                  >{asOfDate ? formatDateISO(asOfDate) : 'Select date'}</button
                >
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

      <section class="uk-margin-large-top">
        <FancyHeader sub="Data" normal>3. Get</FancyHeader>
        <p>
          {@html sensor && sensor.entry ? sensor.entry.credits : ''}
        </p>
        <p>
          We provide our data as a direct link to a CSV file or you can use our Python and R packages. Please
          acknowledge us as a source:
          <cite> Data from Delphi COVIDcast, delphi.cmu.edu/covidcast/ </cite>
        </p>

        <h3 class="mobile-h3 uk-margin-top">CSV File</h3>
        <div>
          <p>Direct link:</p>
          <form bind:this={form} id="form" method="GET" action={CSV_SERVER} download>
            <button type="submit" class="uk-button uk-button-default">Download CSV File</button>
            <input type="hidden" name="signal" value={sensor ? `${sensor.id}:${sensor.signal}` : ''} />
            <input type="hidden" name="start_day" value={formatDateISO(startDate)} />
            <input type="hidden" name="end_day" value={formatDateISO(endDate)} />
            <input type="hidden" name="geo_type" value={geoType} />
            {#if !isAllRegions}<input type="hidden" name="geo_values" value={geoIDs.join(',')} />{/if}
            {#if usesAsOf}<input type="hidden" name="as_of" value={formatDateISO(asOfDate)} />{/if}
          </form>
          <p>Manually fetch data:</p>
          <div class="code-block-wrapper">
            <pre
              class="code-block"><code>
            {`wget --content-disposition "${CSV_SERVER}?signal=${sensor ? `${sensor.id}:${sensor.signal}` : ''}&start_day=${formatDateISO(startDate)}&end_day=${formatDateISO(endDate)}&geo_type=${geoType}${isAllRegions ? '' : `&geo_values=${geoIDs.join(',')}`}${usesAsOf ? `&as_of=${formatDateISO(asOfDate)}` : ''}"`}
            </code></pre>
          </div>
          <p class="description">
            For more details about the API, see the
            <a href="https://cmu-delphi.github.io/delphi-epidata/">API documentation</a>. A description of the returned
            data structure can be found at:
            <a href="https://cmu-delphi.github.io/delphi-epidata/api/covidcast.html#response">covidcast</a>.
          </p>
        </div>
        <div>
          <h3 class="mobile-h3 uk-margin-top">Python Package</h3>
          <p>Install <code>covidcast</code> via pip:</p>
          <pre class="code-block"><code>pip install covidcast</code></pre>
          <p>Fetch data:</p>
          <pre
            class="code-block"><code>
        {`from datetime import date
import covidcast

data = covidcast.signal("${sensor ? sensor.id : ''}", "${sensor ? sensor.signal : ''}",
                        ${pythonDate(startDate)}, ${pythonDate(endDate)},
                        "${geoType}"${isAllRegions ? '' : `, ["${geoIDs.join('", "')}"]`}${usesAsOf ? `, as_of = ${pythonDate(asOfDate)}` : ''})`}
      </code></pre>
          <p class="description">
            For more details and examples, see the
            <a href="https://cmu-delphi.github.io/covidcast/covidcast-py/html/">package documentation</a>. A description
            of the returned data structure can be found at:
            <a href="https://cmu-delphi.github.io/covidcast/covidcast-py/html/signals.html#covidcast.signal"
              >covidcast.signal</a
            >.
          </p>
        </div>
        <div>
          <h3 class="mobile-h3 uk-margin-top">R Package</h3>
          <p>Install <code>covidcast</code> using <a href="https://devtools.r-lib.org/">devtools</a> :</p>
          <pre
            class="code-block"><code>
              {`devtools::install_github("cmu-delphi/covidcast", ref = "main",
                         subdir = "R-packages/covidcast")`}
          </code></pre>
          <p>Fetch data:</p>
          <pre
            class="code-block"><code>
        {`library(covidcast)

cc_data <- suppressMessages(
covidcast_signal(data_source = "${sensor ? sensor.id : ''}", signal = "${sensor ? sensor.signal : ''}",
                 start_day = "${formatDateISO(startDate)}", end_day = "${formatDateISO(endDate)}",
                 geo_type = "${geoType}"${isAllRegions ? '' : `, geo_values = c("${geoIDs.join('", "')}")`}${usesAsOf ? `, as_of = "${formatDateISO(asOfDate)}"` : ''})
)`}
      </code></pre>
          <p class="description">
            For more details and examples, see the
            <a href="https://cmu-delphi.github.io/covidcast/covidcastR/">package documentation</a>. A description of the
            returned data structure can be found at:
            <a href="https://cmu-delphi.github.io/covidcast/covidcastR/reference/covidcast_signal.html#value"
              >covidcast_signal</a
            >.
          </p>
        </div>
      </section>
    </div>
  </div>
</div>

<style>
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
  .code-block-wrapper {
    position: relative;
    height: 4em;
  }
  .code-block-wrapper > .code-block {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }
</style>
