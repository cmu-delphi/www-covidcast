<script>
  import Vega from '../../components/Vega.svelte';
  import { combineSignals } from '../../data/utils';
  import { BASE_SPEC } from '../../specs/commonSpec';
  import { genCreditsLayer } from '../../specs/lineSpec';
  import Toggle from '../mobile/Toggle.svelte';

  /**
   * @type {import("../../stores/params").DateParam}
   */
  export let date;
  /**
   * @type {import("../../stores/params").RegionParam}
   */
  export let region;

  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let primary;
  /**
   * @type {import("../../stores/params").SensorParam}
   */
  export let secondary;
  /**
   * @type {import("../../stores/params").DataFetcher}
   */
  export let fetcher;
  /**
   * Days of lag
   */
  export let lag = 0;

  function loadData(primary, secondary, region, date) {
    if (!secondary) {
      return Promise.resolve([]);
    }
    const primaryData = fetcher.fetch1Sensor1RegionNDates(primary, region, date.windowTimeFrame);
    const secondaryData = fetcher.fetch1Sensor1RegionNDates(secondary, region, date.windowTimeFrame);
    return Promise.all([primaryData, secondaryData]).then((r) => {
      const ref = r[0].map((d) => ({ ...d })); // merge into a copy
      return combineSignals(r, ref, [primary.key, secondary.key]);
    });
  }

  $: data = loadData(primary, secondary, region, date);

  function makeIndicatorCompareSpec(primary, secondary, lag, { zero = true } = {}) {
    /**
     * @type {import('vega-lite').TopLevelSpec}
     */
    const spec = {
      ...BASE_SPEC,
      padding: {
        left: 50,
        right: 10,
        top: 50,
        bottom: 70,
      },
      width: 400,
      height: 400,
      title: `${secondary.name} correlated with ${primary.name} lagged by ${lag} days`,
      transform: [
        {
          window: [
            {
              op: 'lag',
              param: lag >= 0 ? lag : 0,
              field: 'date_value',
              as: 'x_date',
            },
            {
              op: 'lag',
              param: lag >= 0 ? lag : 0,
              field: primary.key,
              as: 'x',
            },
            {
              op: 'lag',
              param: lag <= 0 ? -lag : 0,
              field: 'date_value',
              as: 'y_date',
            },
            {
              op: 'lag',
              param: lag <= 0 ? -lag : 0,
              field: secondary.key,
              as: 'y',
            },
          ],
        },
        { as: 'x_title', calculate: `"${primary.name} (" + timeFormat(datum.x_date, "%b %d") + "): " + datum.x` },
        { as: 'y_title', calculate: `"${secondary.name} (" + timeFormat(datum.y_date, "%b %d") + "): " + datum.y` },
      ],
      layer: [
        {
          mark: {
            type: 'point',
          },
          // selection: {
          //   highlight: {
          //     type: 'single',
          //     empty: 'none',
          //     on: 'mouseover',
          //     nearest: true,
          //     clear: 'mouseout',
          //   },
          // },
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
            tooltip: [
              {
                field: 'x_title',
                title: ' ',
              },
              {
                field: 'y_title',
                title: '  ', // must be unique?
              },
            ],
            opacity: {
              // condition: [
              //   {
              //     selection: 'highlight',
              //     value: 1,
              //   },
              // ],
              value: 0.2,
            },
          },
        },
        {
          transform: [
            {
              regression: 'x',
              on: 'y',
              params: true,
            },
            { calculate: "'R²: '+format(datum.rSquared, '.2f')", as: 'R2' },
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
          transform: [
            // {
            //   window: [
            //     {
            //       op: 'mean',
            //       field: 'x',
            //       type: 'quantitative',
            //       as: 'xmean',
            //     },
            //   ],
            //   frame: [0, 0], // To smooth, replace with e.g. [-6, 0]
            // },
            // {
            //   window: [
            //     {
            //       op: 'mean',
            //       field: 'y',
            //       type: 'quantitative',
            //       as: 'ymean',
            //     },
            //   ],
            //   frame: [0, 0], // To smooth, replace with e.g. [6, 0]
            // },
            {
              calculate: 'datum.x',
              as: 'xmean',
            },
            {
              calculate: 'datum.y',
              as: 'ymean',
            },
          ],
          layer: [
            // Draw the "snake" line, a 7-day moving average of the points.
            {
              // Get next (or previous?) point along mean, to draw rule.
              transform: [
                { window: [{ op: 'lag', param: 1, field: 'xmean', as: 'nextx' }] },
                { window: [{ op: 'lag', param: 1, field: 'ymean', as: 'nexty' }] },
              ],
              mark: {
                type: 'rule',
                color: 'gray',
                opacity: 0.7,
              },
              // selection: {
              //   highlightSnake: {
              //     type: 'single',
              //     empty: 'none',
              //     on: 'mouseover',
              //     clear: 'mouseout',
              //   },
              // },
              encoding: {
                x2: { field: 'nextx', type: 'quantitative' },
                y2: { field: 'nexty', type: 'quantitative' },
                x: { field: 'xmean', type: 'quantitative' },
                y: { field: 'ymean', type: 'quantitative' },
                tooltip: [
                  {
                    field: 'x_title',
                    title: ' ',
                  },
                  {
                    field: 'y_title',
                    title: '  ', // must be unique?
                  },
                ],
                color: {
                  field: 'date_value',
                  type: 'temporal',
                  scale: {
                    scheme: 'blues',
                  },
                  // condition: [
                  //   {
                  //     selection: 'highlightSnake',
                  //     value: 'black',
                  //   },
                  // ],
                },
                size: {
                  field: 'date_value',
                  type: 'temporal',
                  scale: { range: [0, 6] },
                  legend: {
                    orient: 'bottom',
                    direction: 'horizontal',
                    title: '',
                  },
                },
              },
            },
            // Draw the linear regression line.
            {
              transform: [
                {
                  regression: 'x',
                  on: 'y',
                },
              ],
              mark: {
                type: 'line',
                strokeWidth: 2,
                color: 'firebrick',
                tooltip: true,
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
          ],
        },
        genCreditsLayer(),
      ],
    };
    return spec;
  }

  let scaled = false;
  $: spec = makeIndicatorCompareSpec(primary, secondary, lag, {
    zero: !scaled,
  });
</script>

<div class="chart-correlation">
  <Vega {data} {spec} />
</div>
<Toggle bind:checked={scaled}>Rescale X/Y-axis</Toggle>

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
</style>
