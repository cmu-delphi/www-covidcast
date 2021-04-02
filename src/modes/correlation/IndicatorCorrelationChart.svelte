<script>
  import Vega from '../../components/Vega.svelte';
  import { BASE_SPEC, guessTopPadding, joinTitle } from '../../specs/commonSpec';
  import { genCreditsLayer } from '../../specs/lineSpec';
  import { isMobileDevice } from '../../stores';
  import Toggle from '../mobile/Toggle.svelte';
  import CorrelationTooltip from './CorrelationTooltip.svelte';
  import DownloadMenu from '../mobile/components/DownloadMenu.svelte';
  import { formatDateISO } from '../../formats';
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let primary;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let secondary;

  export let lag = 0;
  /**
   * @type {Promise<import("../../data/correlation").Lag>}
   */
  export let lagData;

  /**
   * @param {Promise<import("../../data/correlation").Lag>} lag
   */
  function prepareData(lag) {
    return lag.then((lagObj) => {
      return lagObj.a.map((xi, i) => {
        const yi = lagObj.b[i];
        return {
          x: xi.value,
          x_date: xi.date_value,
          x_entry: xi,
          y: yi.value,
          y_date: yi.date_value,
          y_enty: yi,
        };
      });
    });
  }

  $: data = prepareData(lagData);

  function prepareDownloadRow(row) {
    const r = {};
    r.regionId = row.x_entry.propertyId;
    r.regionLevel = row.x_entry.level;
    r.regionName = row.x_entry.displayName;

    r.x_indicatorDataSource = primary.value.id;
    r.x_indicatorId = primary.value.signal;
    r.x_indicatorName = primary.name;
    r.x = row.x;
    r.x_date = formatDateISO(row.x_date);

    r.y_indicatorDataSource = secondary.value.id;
    r.y_indicatorId = secondary.value.signal;
    r.y_indicatorName = secondary.name;
    r.y = row.y;
    r.y_date = formatDateISO(row.y_date);

    return r;
  }

  function makeIndicatorCompareSpec(primary, secondary, lag, { zero = true, isMobile } = {}) {
    const title = joinTitle([`${secondary.name} correlated with`, `${primary.name} lagged by ${lag} days`], isMobile);
    /**
     * @type {import('vega-lite').TopLevelSpec}
     */
    const spec = {
      ...BASE_SPEC,
      padding: {
        left: 50,
        right: 10,
        top: guessTopPadding(title, null, 12),
        bottom: 70,
      },
      width: 400,
      height: 400,
      title: {
        text: title,
      },
      layer: [
        {
          transform: [
            // snake line
            {
              window: [
                // lag = 1 ... prev
                { op: 'lag', param: 1, field: 'x', as: 'prevx' },
                { op: 'lag', param: 1, field: 'y', as: 'prevy' },
              ],
            },
            {
              filter: 'datum.prevx != null && datum.prevy != null',
            },
          ],
          mark: {
            type: 'rule', // trail doesn't support different colors per segment
            opacity: 0.7,
            strokeCap: 'round',
          },
          encoding: {
            x: { field: 'x', type: 'quantitative' },
            x2: { field: 'prevx', type: 'quantitative' },
            y: { field: 'y', type: 'quantitative' },
            y2: { field: 'prevy', type: 'quantitative' },
            color: {
              field: 'x_date',
              type: 'temporal',
              scale: {
                scheme: 'blues',
              },
            },
            size: {
              field: 'x_date',
              type: 'temporal',
              scale: { range: [1, 6] },
              legend: {
                orient: 'bottom',
                direction: 'horizontal',
                title: false,
                symbolType: 'square',
              },
            },
          },
        },
        {
          mark: {
            type: 'circle',
            tooltip: true,
          },
          params: [
            {
              name: 'highlight',
              select: {
                type: 'point',
                nearest: true,
                on: 'mousemove',
                clear: 'view:mouseout',
              },
            },
          ],
          encoding: {
            x: {
              field: 'x',
              title: `${primary.name} (${primary.unit})`,
              type: 'quantitative',
              scale: {
                zero,
              },
            },
            y: {
              field: 'y',
              title: `${secondary.name} (${secondary.unit})`,
              type: 'quantitative',
              scale: {
                zero,
              },
            },
            opacity: {
              condition: [
                {
                  param: 'highlight',
                  empty: false,
                  value: 1,
                },
              ],
              value: 0.2,
            },
            size: {
              condition: [
                {
                  param: 'highlight',
                  empty: false,
                  value: 60,
                },
              ],
              value: 30,
            },
          },
        },
        {
          // regression text
          transform: [
            {
              regression: 'x',
              on: 'y',
              params: true, // return model parameters, like .R2
            },
            { calculate: "'R²: ' + format(datum.rSquared, '.2f')", as: 'R2' },
          ],
          mark: {
            type: 'text',
            color: 'firebrick',
            align: 'right',
            x: 'width',
            y: -5,
            size: 14,
          },
          encoding: {
            text: { type: 'nominal', field: 'R2' },
          },
        },
        {
          // regression line
          transform: [
            {
              regression: 'x',
              on: 'y',
              // no params = return points
            },
          ],
          // Draw the linear regression line.
          mark: {
            type: 'line',
            strokeWidth: 2,
            color: 'firebrick',
          },
          encoding: {
            x: {
              field: 'x',
              type: 'quantitative',
            },
            y: {
              field: 'y',
              type: 'quantitative',
            },
          },
        },
        genCreditsLayer(),
      ],
    };
    return spec;
  }

  let scaled = false;
  $: spec = makeIndicatorCompareSpec(primary, secondary, lag, {
    zero: !scaled,
    isMobile: $isMobileDevice,
  });

  let vegaRef = null;
</script>

<div class="chart-correlation">
  <Vega bind:this={vegaRef} {data} {spec} tooltip={CorrelationTooltip} tooltipProps={{ primary, secondary, lag }} />
</div>

<div class="buttons">
  <Toggle bind:checked={scaled}>Rescale X/Y-axis</Toggle>
  <div class="spacer" />
  <DownloadMenu
    fileName="Correlation_{primary.name}_{secondary.name}_Lag_{lag}"
    {vegaRef}
    {data}
    prepareRow={prepareDownloadRow}
    advanced={false}
  />
</div>

<style>
  .chart-correlation {
    position: relative;
    /** 1:1 + padding for legend **/
    padding-top: calc(100% + 50px);
  }

  .chart-correlation > :global(.vega-embed) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .buttons {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
  .spacer {
    flex: 1 1 0;
  }
</style>
