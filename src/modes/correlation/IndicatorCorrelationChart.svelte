<script>
  import { isMobileDevice } from '../../stores';
  import Vega from '../../components/Vega.svelte';
  import { combineSignals } from '../../data/utils';

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

  $: chartPadding = $isMobileDevice
    ? { left: 20, right: 10, top: 10, bottom: 40 }
    : { left: 20, right: 50, top: 20, bottom: 15 };
  $: sizeLegend = $isMobileDevice
    ? { orient: 'bottom', direction: 'horizontal', title: '' }
    : {
        orient: 'top',
        direction: 'horizontal',
        symbolType: 'square',
        symbolStrokeWidth: 2,
        title: ' ',
      };

  $: options = {
    title: `${secondary.name} correlated with ${primary.name} lagged by ${lag} days`,
    width: 400,
    height: 400,
    padding: chartPadding,
    sizeLegend,
    showTooltips: true,
    showRSquared: true,
  };

  function makeIndicatorCompareSpec(xKey, yKey, options = {}) {
    const lag = options.lag || 0;
    const width = options.width || 100;
    const height = options.height || 100;
    let spec = {
      width: width,
      height: height,
      padding: options.padding != null ? options.padding : null,
      title: options.title || '',
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
              field: xKey,
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
              field: yKey,
              as: 'y',
            },
          ],
        },
        { as: 'x_title', calculate: `"${options.xtitle} (" + timeFormat(datum.x_date, "%b %d") + "): " + datum.x` },
        { as: 'y_title', calculate: `"${options.ytitle} (" + timeFormat(datum.y_date, "%b %d") + "): " + datum.y` },
      ],
      layer: [
        {
          width: width,
          height: height,
          padding: options.padding != null ? options.padding : null,
          mark: {
            type: 'point',
          },
          selection: {
            highlight: {
              type: 'single',
              empty: 'none',
              on: 'mouseover',
              nearest: true,
              clear: 'mouseout',
            },
          },
          encoding: {
            x: {
              field: 'x',
              title: options.axisTitles ? options.xtitle : '',
              type: 'quantitative',
              scale: {
                zero: false,
                domainMin: null,
                domainMax: null,
              },
              axis: {
                ticks: options.ticks,
                labels: options.tickLabels,
              },
            },
            y: {
              field: 'y',
              title: options.axisTitles ? options.ytitle : '',
              type: 'quantitative',
              scale: {
                zero: false,
                domainMin: undefined,
                domainMax: undefined,
              },
              axis: { ticks: options.ticks, labels: options.tickLabels },
            },
            tooltip: options.showTooltips
              ? [
                  {
                    field: 'x_title',
                    title: ' ',
                  },
                  {
                    field: 'y_title',
                    title: '  ', // must be unique?
                  },
                ]
              : false,
            opacity: {
              condition: [
                {
                  selection: 'highlight',
                  value: 1,
                },
              ],
              value: 0.2,
            },
          },
        },
        ...(options.showRSquared
          ? [
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
            ]
          : []),
        {
          transform: [
            {
              window: [
                {
                  op: 'mean',
                  field: 'x',
                  type: 'quantitative',
                  as: 'xmean',
                },
              ],
              frame: [0, 0], // To smooth, replace with e.g. [-6, 0]
            },
            {
              window: [
                {
                  op: 'mean',
                  field: 'y',
                  type: 'quantitative',
                  as: 'ymean',
                },
              ],
              frame: [0, 0], // To smooth, replace with e.g. [6, 0]
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
                tooltip: options.showTooltips
                  ? [
                      {
                        field: 'x_title',
                        title: ' ',
                      },
                      {
                        field: 'y_title',
                        title: '  ', // must be unique?
                      },
                    ]
                  : false,
                color: {
                  field: 'date_value',
                  type: 'temporal',
                  scale: {
                    scheme: 'blues',
                  },
                  condition: [
                    {
                      selection: 'highlightSnake',
                      value: 'black',
                    },
                  ],
                },
                size: {
                  field: 'date_value',
                  type: 'temporal',
                  scale: { range: [0, 6] },
                  legend: options.sizeLegend || null,
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
      ],
    };
    return spec;
  }
  function updateIndicatorCompareSpec(lag = 0) {
    const xIndicator = secondary;
    const yIndicator = primary;
    return makeIndicatorCompareSpec(xIndicator.key, yIndicator.key, {
      showTitle: true,
      axisTitles: true,
      ticks: false,
      tickLabels: true,
      xtitle: xIndicator.name,
      ytitle: yIndicator.name,
      lag,
      showTooltips: false,
      showRSquared: false,
      ...options,
    });
  }
  function topLevelIndicatorCompareSpec(lag) {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      padding: options.padding != null ? options.padding : { left: 20, right: 10, top: 10, bottom: 30 },
      data: { name: 'values' },
      ...{
        columns: 1,
        concat: [updateIndicatorCompareSpec(lag)],
      },
    };
  }

  $: indicatorCompareSpec = topLevelIndicatorCompareSpec(lag);
</script>

<Vega {data} spec={indicatorCompareSpec} />
