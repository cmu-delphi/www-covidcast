<script>
  import { groupedSensorList, sensorList } from '../../stores/constants';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import { SensorParam } from '../../stores/params';
  import { formatDateISO, formatDateShortNumbers } from '../../formats';
  import filterIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/filter.svg';
  import { currentMode, metaDataManager } from '../../stores';
  import { modeByID } from '..';
  import TrendIndicator from '../../components/TrendIndicator.svelte';
  import Vega from '../../components/vega/Vega.svelte';
  import SparkLineTooltip from '../../components/SparkLineTooltip.svelte';
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
  import { generateSparkLine } from '../../specs/lineSpec';
  import SensorValue from '../../components/SensorValue.svelte';
  import DownloadMenu from '../../components//DownloadMenu.svelte';
  import IndicatorAnnotations from '../../components/IndicatorAnnotations.svelte';

  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;
  /**
   * @type {import("../../stores/DataFetcher").DataFetcher}
   */
  export let fetcher;

  function computeDataSources() {
    const map = new Map();
    for (const sensor of sensorList) {
      const ds = sensor.dataSourceName;
      const e = map.get(ds);
      if (e) {
        e.sensors.push(sensor);
      } else {
        map.set(ds, {
          name: ds,
          label: ds,
          sensors: [sensor],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  const dataSources = computeDataSources();

  let selectedDatasource = '';

  $: {
    if (selectedDatasource === 'all') {
      selectedDatasource = '';
    }
  }

  function matchDataSource(sensor, selected) {
    return selected === '' || selected === 'all' || sensor.dataSourceName === selected;
  }
  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   * @param {import("../../stores/params").RegionParam} region
   */
  function loadData(region, date) {
    const flatSensors = groupedSensorList.map((group) => group.sensors).flat();
    const trends = fetcher.fetchNSensors1Region1DateTrend(flatSensors, region, date);
    const sparkLines = fetcher.fetchNSensor1RegionSparklines(flatSensors, region, date);
    return groupedSensorList.map((group) => {
      return {
        ...group,
        sensors: group.sensors.map((s) => {
          const sensor = new SensorParam(s, $metaDataManager);
          return {
            sensor,
            // same order ensured
            sparkLine: sparkLines.shift(),
            trend: trends.shift(),
            switchMode: () => {
              sensor.set(s, true);
              currentMode.set(modeByID.indicator);
            },
          };
        }),
      };
    });
  }

  function generateDumpData(loadedData, date, region) {
    const sensors = loadedData.map((d) => d.sensors).flat();
    return Promise.all(sensors.map((d) => d.trend)).then((trends) =>
      trends.map((trend, i) => {
        const sensor = sensors[i].sensor;
        return {
          indicatorDataSource: sensor.value.id,
          indicatorId: sensor.value.signal,
          indicatorName: sensor.name,
          regionId: region.propertyId,
          regionLevel: region.level,
          regionName: region.displayName,
          date: formatDateISO(date.value),
          value: trend.value,
          trend: trend.trend,
          delta: trend.delta == null || Number.isNaN(trend.delta) ? '' : trend.delta,
          change: trend.change == null || Number.isNaN(trend.change) ? '' : trend.change,
          refDate: formatDateISO(trend.refDate),
          refValue: trend.refValue,
        };
      }),
    );
  }

  /**
   * @type {import('vega-lite').TopLevelSpec}
   */
  $: spec = generateSparkLine({ highlightDate: true, domain: date.sparkLineTimeFrame.domain });

  $: loadedData = loadData(region, date);
  $: dumpData = generateDumpData(loadedData, date, region);
  $: fileName = `Overview_${region.propertyId}-${region.displayName}_${formatDateISO(date.value)}`;
</script>

<div class="uk-position-relative">
  <FancyHeader sub="Indicators">COVID-19</FancyHeader>
  <DownloadMenu {fileName} data={dumpData} absolutePos prepareRow={(row) => row} />
</div>

<div class="icon-wrapper">
  <span>
    <span class="inline-svg-icon">
      {@html filterIcon}
    </span>
  </span>
  <select class="uk-select" bind:value={selectedDatasource}>
    <option value="" disabled hidden>Filter by</option>
    <optgroup label="Data Sources">
      {#each dataSources as ds}
        <option value={ds.name}>{ds.label} ({ds.sensors.length})</option>
      {/each}
    </optgroup>
    <option value="all">All Indicators ({sensorList.length})</option>
  </select>
</div>

<table class="mobile-table">
  <thead>
    <tr>
      <th class="mobile-th"><span>Indicator</span></th>
      <th class="mobile-th uk-text-right"><span>Change Last 7 days</span></th>
      <th class="mobile-th uk-text-right"><span>Value</span></th>
      <th class="mobile-th uk-text-right">
        <span>historical trend</span>
        <div class="mobile-th-range">
          <span> {formatDateShortNumbers(date.sparkLineTimeFrame.min)} </span>
          <span> {formatDateShortNumbers(date.sparkLineTimeFrame.max)} </span>
        </div>
      </th>
      <th class="mobile-th" />
    </tr>
  </thead>
  {#each loadedData as group (group.label)}
    {#if !selectedDatasource || selectedDatasource === 'all' || group.sensors.some( (d) => matchDataSource(d.sensor, selectedDatasource), )}
      <tbody>
        <tr class="row-group">
          <th class="mobile-h3" colspan="5">{group.label}</th>
        </tr>
        {#each group.sensors as entry (entry.sensor.key)}
          {#if matchDataSource(entry.sensor, selectedDatasource)}
            <tr class="has-addon">
              <td>
                <IndicatorAnnotations
                  asHint
                  sensor={entry.sensor}
                  {region}
                  {date}
                  range="sparkLine"
                  className="mobile-row-annotation"
                />
                <a
                  href="../indicator?sensor={entry.sensor.key}"
                  class="uk-link-text"
                  on:click|preventDefault={entry.switchMode}
                >
                  {entry.sensor.name}
                </a>
              </td>
              <td>
                {#await entry.trend}
                  <TrendIndicator trend={null} block />
                {:then d}
                  <TrendIndicator trend={d} block />
                {/await}
              </td>
              <td class="uk-text-right table-value">
                {#await entry.trend}
                  ?
                {:then t}
                  <SensorValue sensor={entry.sensor} value={t ? t.value : null} />
                {/await}
              </td>
              <td rowspan="2">
                <div class="mobile-table-chart">
                  <Vega
                    {spec}
                    data={entry.sparkLine}
                    tooltip={SparkLineTooltip}
                    tooltipProps={{ sensor: entry.sensor }}
                    signals={{ currentDate: date.value }}
                    noDataText="N/A"
                  />
                </div>
              </td>
              <td rowspan="2">
                <a
                  href="../indicator?sensor={entry.sensor.key}"
                  class="uk-link-text details-link"
                  on:click|preventDefault={entry.switchMode}
                >
                  {@html chevronRightIcon}
                </a>
              </td>
            </tr>
            <tr class="addon">
              <td colspan="3">Source: {entry.sensor.value.dataSourceName}</td>
            </tr>
          {/if}
        {/each}
      </tbody>
    {/if}
  {/each}
</table>

<style>
  .icon-wrapper {
    margin-top: 1em;
    position: relative;
  }

  .icon-wrapper > span {
    position: absolute;
    left: 0;
    width: 40px;
    top: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #d3d4d8;
  }

  .icon-wrapper .uk-select {
    padding-left: 50px !important;
    padding-top: 5px;
    padding-bottom: 5px;
    border-radius: 3px;
    border: 1px solid #d3d4d8;
  }

  .details-link {
    width: 6px;
    display: inline-block;
    fill: currentColor;
  }

  .table-value {
    white-space: nowrap;
    font-weight: 700;
  }
</style>
