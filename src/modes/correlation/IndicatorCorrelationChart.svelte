<script>
  import Vega from '../../components/Vega.svelte';
  import { combineSignals } from '../../data/utils';
  import { commonConfig } from '../../specs/commonSpec';
  import { genCreditsLayer } from '../../specs/lineSpec';

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

  function makeIndicatorCompareSpec(primary, secondary, lag) {
    /**
     * @type {import('vega-lite').TopLevelSpec}
     */
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      padding: {
        left: 50,
        right: 10,
        top: 50,
        bottom: 70,
      },
      autosize: {
        type: 'none',
        contains: 'padding',
        resize: true,
      },
      data: { name: 'values' },
      width: 400,
      height: 400,
      title: {
        text: `${secondary.name} correlated with ${primary.name} lagged by ${lag} days`,
        align: 'left',
        anchor: 'start',
      },
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
              title: primary.name,
              type: 'quantitative',
              scale: {
                zero: false,
              },
            },
            y: {
              field: 'y',
              title: secondary.name,
              type: 'quantitative',
              scale: {
                zero: false,
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
              selection: {
                highlightSnake: {
                  type: 'single',
                  empty: 'none',
                  on: 'mouseover',
                  clear: 'mouseout',
                },
              },
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
                  legend: { orient: 'bottom', direction: 'horizontal', title: '' },
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
                  scale: {
                    domainMin: undefined,
                    domainMax: undefined,
                  },
                },
                y: {
                  field: 'y',
                  type: 'quantitative',
                  scale: {
                    domainMin: undefined,
                    domainMax: undefined,
                  },
                },
              },
            },
          ],
        },
        genCreditsLayer(),
      ],
      config: commonConfig,
    };
    return spec;
  }

  $: spec = makeIndicatorCompareSpec(primary, secondary, lag);
</script>

<Vega {data} {spec} />
