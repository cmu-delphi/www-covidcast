<script>
  import { groupedSensorList } from '../../stores';
  import FancyHeader from '../../components/FancyHeader.svelte';
  import { SensorParam } from '../../stores/params';
  import { formatDateISO, formatDateShortNumbers, formatFraction } from '../../formats';
  import { currentMode, metaDataManager } from '../../stores';
  import { modeByID } from '..';
  import Vega from '../../components/vega/Vega.svelte';
  import SparkLineTooltip from '../../components/SparkLineTooltip.svelte';
  import chevronRightIcon from '!raw-loader!@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
  import { generateSparkLine } from '../../specs/lineSpec';
  import DownloadMenu from '../../components//DownloadMenu.svelte';
  import IndicatorAnnotations from '../../components/IndicatorAnnotations.svelte';
  import SensorUnit from '../../components/SensorUnit.svelte';

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

  /**
   * @param {import("../../stores/params").SensorParam} sensor
   * @param {import("../../stores/params").DateParam} date
   * @param {import("../../stores/params").RegionParam} region
   */
  function loadData(groupedSensorList, region, date) {
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

  $: loadedData = loadData($groupedSensorList, region, date);
  $: dumpData = generateDumpData(loadedData, date, region);
  $: fileName = `Overview_${region.propertyId}-${region.displayName}_${formatDateISO(date.value)}`;

  function cleanSource(source) {
    return source.replace(/\(.*\)/, '').trim();
  }
</script>

<div class="uk-position-relative">
  <FancyHeader sub="Indicators Table">COVID-19</FancyHeader>
  <DownloadMenu {fileName} data={dumpData} absolutePos prepareRow={(row) => row} />
</div>

<table class="mobile-table">
  <thead>
    <tr>
      <th class="mobile-th"><span /></th>
      <th class="mobile-th"><span>Indicator</span></th>
      <th class="mobile-th uk-text-right"><span>Relative Change Last 7 Days</span></th>
      <th class="mobile-th uk-text-right" colspan="2"><span>Value</span></th>
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
  <tbody>
    {#each loadedData as group (group.label)}
      {#each group.sensors as entry, index (entry.sensor.key)}
        <tr>
          {#if index === 0}
            <td rowspan={group.sensors.length} class="group-label">{group.label}</td>
          {/if}
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
              ({cleanSource(entry.sensor.value.dataSourceName)})
            </a>
          </td>
          <td class="uk-text-right bold-value">
            {#await entry.trend}
              ?
            {:then t}
              {#if t == null || t.value == null || Number.isNaN(t.value) || t.change == null}
                N/A
              {:else}
                {formatFraction(t.change, true)}
              {/if}
            {/await}
          </td>
          <td class="uk-text-right bold-value table-value">
            {#await entry.trend}
              ?
            {:then t}
              {#if t == null || t.value == null || Number.isNaN(t.value)}
                N/A
              {:else}
                {entry.sensor.formatValue(t.value)}
              {/if}
            {/await}
          </td>
          <td class="bold-value table-unit">
            {#await entry.trend then t}
              {#if t != null && t.value != null && !Number.isNaN(t.value)}
                <SensorUnit sensor={entry.sensor} />
              {/if}
            {/await}
          </td>
          <td class="chart-table-cell">
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
          <td>
            <a
              href="../indicator?sensor={entry.sensor.key}"
              class="uk-link-text details-link"
              on:click|preventDefault={entry.switchMode}
            >
              {@html chevronRightIcon}
            </a>
          </td>
        </tr>
      {/each}
    {/each}
  </tbody>
</table>

<style>
  .details-link {
    width: 6px;
    display: inline-block;
    fill: currentColor;
  }

  .bold-value {
    white-space: nowrap;
    font-weight: 700;
  }

  .table-value {
    padding-right: 0 !important;
  }

  .table-unit {
    padding-left: 1px !important;
  }

  .group-label {
    writing-mode: vertical-rl;
  }

  .chart-table-cell {
    padding-bottom: 0 !important;
  }
</style>
