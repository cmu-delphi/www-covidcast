<script>
  import { CSV_SERVER_ENDPOINT } from '../../data/api';
  import Datepicker from '../../components/Calendar/Datepicker.svelte';
  import { levelList } from '../../stores/constants';
  import { annotationManager, currentDateObject, metaDataManager } from '../../stores';
  import { timeMonth } from 'd3-time';
  import { onMount } from 'svelte';
  import { trackEvent } from '../../stores/ga';
  import Search from '../../components/Search.svelte';
  import { getCountiesOfState, getInfoByName, infosByLevel } from '../../data/regions';
  import { formatDateISO, formatWeek } from '../../formats';
  import { DateParam } from '../../stores/params';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import IndicatorAnnotation from '../../components/IndicatorAnnotation.svelte';
  import SensorBadges from '../../components/SensorBadges.svelte';
  import SourceBadges from '../../components/SourceBadges.svelte';
  import { EpiWeek } from '../../data/EpiWeek';

  let showObsolete = false;
  let sourceValue = null;
  $: source = sourceValue ? $metaDataManager.metaSources.find((d) => d.source === sourceValue) : null;
  $: sensors = source ? source.sensors : [];
  let sensorValue = null;
  $: sensor = sensorValue ? $metaDataManager.getSensor(sensorValue) : null;
  $: {
    if (source && !sensors.find((d) => d.key === sensorValue)) {
      sensorValue = sensors[0].key;
    }
  }

  $: isWeekly = sensor ? sensor.isWeeklySignal : false;
  $: formatDate = isWeekly ? (d) => formatWeek(d).replace('W', '') : formatDateISO;

  let geoType = 'county';

  let startDate = new Date();
  let endDate = new Date();

  function initDate(date) {
    const param = new DateParam(date);
    endDate = param.sparkLineTimeFrame.max;
    startDate = param.sparkLineTimeFrame.min;
  }
  $: initDate($currentDateObject);

  $: sensorLevels = sensor ? $metaDataManager.getLevels(sensor) : null;

  $: {
    if (sensorLevels && !sensorLevels.includes(geoType)) {
      // reset to a valid one
      geoType = sensorLevels[0];
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

  let form = null;

  onMount(() => {
    if (form) {
      form.addEventListener('submit', () => {
        const date = `start_day=${formatDate(startDate)},end_day=${formatDate(endDate)}`;
        trackEvent(
          'export',
          'download',
          `signal=${sensor ? `${sensor.id}:${sensor.signal}` : ''},${date},geo_type=${geoType}`,
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
  function pythonWeek(date) {
    const week = EpiWeek.fromDate(date);
    return `Week(${week.year}, ${week.week})`;
  }

  $: formatPythonDate = isWeekly ? pythonWeek : pythonDate;

  function resolveDateRange(sensor) {
    if (!sensor) {
      return { minTime: timeMonth(new Date(), -1), maxTime: timeMonth(new Date(), 1) };
    }
    const t = $metaDataManager.getTimeFrame(sensor);
    return {
      minTime: t.min,
      maxTime: t.max,
    };
  }

  $: dateRange = resolveDateRange(sensor);

  // resolve known annotation for the selected combination
  $: annotations = isAllRegions
    ? $annotationManager.getWindowLevelAnnotations(sensor, geoType, startDate, endDate)
    : $annotationManager.getWindowAnnotations(
        sensor,
        geoIDs.map((d) => getInfoByName(d, geoType)),
        startDate,
        endDate,
      );
</script>

<div class="mobile-root">
  <div class="mobile-header-line-bg">
    <div class="mobile-header-line">
      <h2>COVIDcast <span>Export</span></h2>
    </div>
  </div>
  <div class="uk-container content-grid">
    <div class="grid-3-11">
      <p>
        All signals displayed in COVIDcast are freely available for download here. You can also access the latest daily
        through the
        <a href="https://cmu-delphi.github.io/delphi-epidata/api/covidcast.html">COVIDcast API</a>
        which also includes numerous other signals.
      </p>
      <section class="uk-margin-top">
        <FancyHeader sub="Data Source" normal>1. Select</FancyHeader>
        <p>Select a data source to start with.</p>

        <div data-uk-grid class="uk-form-stacked">
          <div class="uk-width-1-1@m uk-width-expand@s">
            <label for="ds" class="uk-form-label">Data Sources</label>
            <div class="uk-form-controls">
              <select id="ds" bind:value={sourceValue} size="8" class="uk-select">
                {#each $metaDataManager.metaSources as source}
                  {#if showObsolete || !source.obsolete}
                    <option value={source.source}>{source.name}</option>
                  {/if}
                {/each}
              </select>
            </div>
            {#if $metaDataManager.metaSources.some((d) => d.obsolete)}
              <label><input type="checkbox" bind:checked={showObsolete} /> Show Obsolete Data Sources</label>
            {/if}
          </div>
        </div>

        {#if source}
          <h3 class="mobile-h3 uk-margin-top">{source.name}</h3>
          <div>
            <SourceBadges {source} />
          </div>
          <p>
            {@html source.description}
          </p>
          {#if source.link.length > 0}
            <p>See also:</p>
            <ul>
              {#each source.link as link}
                <li>
                  <a href={link.href}>{link.alt}</a>
                </li>
              {/each}
            </ul>
          {/if}
        {/if}
      </section>

      <section class="uk-margin-top">
        <FancyHeader sub="Signal" normal>2. Select</FancyHeader>
        <p>Pick a signal from this data source.</p>
        <div class="uk-width-1-1@m uk-width-expand@s">
          <label for="ds" class="uk-form-label">Signals</label>
          <div class="uk-form-controls">
            <select id="ds" bind:value={sensorValue} size="8" class="uk-select">
              {#if source}
                {#each sensors as s}
                  <option value={s.key}>{s.name}</option>
                {/each}
              {:else}
                <option value="">Select a Data Source first</option>
              {/if}
            </select>
          </div>
        </div>

        {#if sensor}
          <h3 class="mobile-h3 uk-margin-top">{sensor.name}</h3>
          <div>
            <SensorBadges {sensor} />
          </div>
          <p>
            {@html sensor.description}
          </p>
          {#if sensor.meta.link.length > 0}
            <p>See also:</p>
            <ul>
              {#each sensor.meta.link as link}
                <li>
                  <a href={link.href}>{link.alt}</a>
                </li>
              {/each}
            </ul>
          {/if}
        {/if}
      </section>

      <section class="uk-form-horizontal uk-margin-large-top">
        <FancyHeader sub="Parameters" normal>3. Specify</FancyHeader>
        <p>Customize the {isWeekly ? 'week' : 'date'} range and pick a geographic level to download data for</p>
        <div>
          <span class="uk-form-label">{isWeekly ? 'Week' : 'Date'} range</span>
          <div class="uk-form-controls">
            <Datepicker
              bind:selected={startDate}
              start={dateRange.minTime}
              end={dateRange.maxTime}
              pickWeek={isWeekly}
              formattedSelected={formatDate(startDate)}
            >
              <button aria-label="selected start date" class="uk-input" on:click>{formatDate(startDate)}</button>
            </Datepicker>
            -
            <Datepicker
              bind:selected={endDate}
              start={dateRange.minTime}
              end={dateRange.maxTime}
              pickWeek={isWeekly}
              formattedSelected={formatDate(endDate)}
            >
              <button aria-label="selected end date" class="uk-input" on:click>{formatDate(endDate)}</button>
            </Datepicker>
          </div>
        </div>
        <div>
          <label for="geo" class="uk-form-label">Geographic level</label>
          <div class="uk-form-controls">
            <select id="geo" bind:value={geoType} class="uk-select">
              {#each levelList as level}
                <option value={level.id} disabled={!sensorLevels || !sensorLevels.includes(level.id)}>
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
                title="Region"
                selectedItems={geoValues}
                labelFieldName="displayName"
                maxItemsToShowInList={5}
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
              <label for="as-of-single">Specific {isWeekly ? 'week' : 'date'}: </label>
              <Datepicker
                bind:selected={asOfDate}
                pickWeek={isWeekly}
                formattedSelected={asOfDate ? formatDate(asOfDate) : 'Select date'}
                start={asOfStart}
                end={asOfEnd}
              >
                <button aria-label="selected as of date" class="uk-input" disabled={asOfMode === 'latest'} on:click
                  >{asOfDate ? formatDate(asOfDate) : 'Select date'}</button
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

        {#each annotations as annotation}
          <IndicatorAnnotation {annotation} />
        {/each}
      </section>

      <section class="uk-margin-large-top">
        <FancyHeader sub="Data" normal>4. Get</FancyHeader>
        <p>
          {@html sensor && sensor.credits ? sensor.credits : ''}
        </p>
        <p>
          We provide our data as a direct link to a CSV file or you can use our Python and R packages. Please
          acknowledge us as a source:
          <cite> Data from Delphi COVIDcast, delphi.cmu.edu/covidcast/ </cite>
        </p>

        <h3 class="mobile-h3 uk-margin-top">CSV File</h3>
        <div>
          <p>Direct link:</p>
          <form bind:this={form} id="form" method="GET" action={CSV_SERVER_ENDPOINT} download>
            <button type="submit" class="uk-button uk-button-default">Download CSV File</button>
            <input type="hidden" name="signal" value={sensor ? `${sensor.id}:${sensor.signal}` : ''} />
            <input type="hidden" name="start_day" value={formatDate(startDate)} />
            <input type="hidden" name="end_day" value={formatDate(endDate)} />
            <input type="hidden" name="geo_type" value={geoType} />
            {#if !isAllRegions}<input type="hidden" name="geo_values" value={geoIDs.join(',')} />{/if}
            {#if usesAsOf}<input type="hidden" name="as_of" value={formatDate(asOfDate)} />{/if}
          </form>
          <p>Manually fetch data:</p>
          <div class="code-block-wrapper">
            <pre
              class="code-block"><code>
            {`wget --content-disposition "${CSV_SERVER_ENDPOINT}?signal=${sensor ? `${sensor.id}:${sensor.signal}` : ''}&start_day=${formatDate(startDate)}&end_day=${formatDate(endDate)}&geo_type=${geoType}${isAllRegions ? '' : `&geo_values=${geoIDs.join(',')}`}${usesAsOf ? `&as_of=${formatDate(asOfDate)}` : ''}"`}
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
        {`${isWeekly ? 'from epiweeks import Week' : 'from datetime import date'}
import covidcast

data = covidcast.signal("${sensor ? sensor.id : ''}", "${sensor ? sensor.signal : ''}",
                        ${formatPythonDate(startDate)}, ${formatPythonDate(endDate)},
                        "${geoType}"${isAllRegions ? '' : `, ["${geoIDs.join('", "')}"]`}${usesAsOf ? `, as_of = ${formatPythonDate(asOfDate)}` : ''})`}
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
          <p>Install <code>covidcast</code> via CRAN:</p>
          <pre class="code-block"><code>install.packages('covidcast')</code></pre>
          <p>Fetch data:</p>
          <pre
            class="code-block"><code>
        {`library(covidcast)

cc_data <- covidcast_signal(
  data_source = "${sensor ? sensor.id : ''}", signal = "${sensor ? sensor.signal : ''}",
  start_day = "${formatDate(startDate)}", end_day = "${formatDate(endDate)}",
  geo_type = "${geoType}"${isAllRegions ? '' : `, geo_values = c("${geoIDs.join('", "')}")`}${usesAsOf ? `, as_of = "${formatDate(asOfDate)}"` : ''}
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
