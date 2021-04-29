<script>
  import Vega from '../../components/vega/Vega.svelte';
  import { BASE_SPEC, guessTopPadding, joinTitle } from '../../specs/commonSpec';
  import { genCreditsLayer } from '../../specs/lineSpec';
  import { isMobileDevice } from '../../stores';
  import Toggle from '../../components/Toggle.svelte';
  import CorrelationTooltip from './CorrelationTooltip.svelte';
  import DownloadMenu from '../../components/DownloadMenu.svelte';
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
   * @type {Promise<import("../../data/correlation").Lag[]>}
   */
  export let lags;

  /**
   * @param {Promise<import("../../data/correlation").Lag[]>} lags
   */
  function prepareDomain(lagsPromise) {
    return lagsPromise.then((lags) => {
      let xMin = Number.POSITIVE_INFINITY;
      let xMax = Number.NEGATIVE_INFINITY;
      let yMin = Number.POSITIVE_INFINITY;
      let yMax = Number.NEGATIVE_INFINITY;
      for (const lag of lags) {
        for (const x of lag.a) {
          if (x.value < xMin) {
            xMin = x.value;
          }
          if (x.value > xMax) {
            xMax = x.value;
          }
        }
        for (const y of lag.b) {
          if (y.value < yMin) {
            yMin = y.value;
          }
          if (y.value > yMax) {
            yMax = y.value;
          }
        }
      }
      return {
        x: [xMin, xMax],
        y: [yMin, yMax],
      };
    });
  }
  /**
   * @param {Promise<import("../../data/correlation").Lag>} lag
   */
  function prepareData(lag) {
    return lag.then((lagObj) => {
      if (!lagObj) {
        return [];
      }
      return lagObj.a.map((xi, i) => {
        const yi = lagObj.b[i];
        return {
          x: xi.value,
          x_date: xi.date_value,
          x_entry: xi,
          y: yi.value,
          y_date: yi.date_value,
          y_entry: yi,
        };
      });
    });
  }

  $: data = prepareData(lagData);

  let domains = { x: [], y: [] };
  $: {
    prepareDomain(lags).then((d) => {
      domains = d;
    });
  }

  // complex lag obj
  let lagObj = {
    lag,
  };

  function updateLagInfo(lagData) {
    lagData.then((lagInfo) => {
      if (!lagInfo) {
        return;
      }
      const x1 = domains.x[0];
      const x2 = domains.x[1];
      // update with real information
      lagObj = {
        lag,
        r2: lagInfo.r2,
        slope: lagInfo.slope,
        intercept: lagInfo.intercept,
        samples: lagInfo.samples,
        x1,
        x2,
        y1: lagInfo.slope * x1 + lagInfo.intercept,
        y2: lagInfo.slope * x2 + lagInfo.intercept,
      };
    });
  }

  $: {
    lagObj = {
      lag,
      x1: domains.x[0],
      x2: domains.x[1],
      y1: null,
      y2: null,
    };
    updateLagInfo(lagData);
  }

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

  function makeExpression(title, variable, signal) {
    if (Array.isArray(title)) {
      return `[${title.map((d) => makeExpression(d, variable, signal)).join(',')}]`;
    }
    if (!title.includes(variable)) {
      return `"${title}"`;
    }
    return title
      .split(variable)
      .map((d) => `"${d}"`)
      .join(` + ${signal} + `);
  }

  function makeIndicatorCompareSpec(primary, secondary, { zero = true, isMobile, xDomain = [], yDomain = [] } = {}) {
    const title = joinTitle([`${primary.name} correlated with`, `${secondary.name}$lag_days_later`], isMobile);
    /**
     * @type {import('vega-lite').TopLevelSpec}
     */
    const spec = {
      ...BASE_SPEC,
      padding: {
        left: 50,
        right: isMobile ? 10 : 120,
        top: guessTopPadding(title, null, 12),
        bottom: isMobile ? 70 : 60,
      },
      width: 400,
      height: 400,
      title: {
        text: {
          expr: makeExpression(title, '$lag_days_later', `lagToOffset(lag.lag, false)`),
        },
      },
      resolve: {
        axis: {
          x: 'shared',
          y: 'shared',
        },
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
            x: {
              field: 'x',
              type: 'quantitative',
              title: `${primary.name} (${primary.unit})`,
              scale: {
                zero,
                domainMax: zero ? xDomain[1] : undefined,
              },
            },
            x2: { field: 'prevx' },
            y: {
              field: 'y',
              type: 'quantitative',
              title: `${secondary.name} (${secondary.unit})`,
              scale: {
                zero,
                domainMax: zero ? yDomain[1] : undefined,
              },
            },
            y2: { field: 'prevy' },
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
                orient: isMobile ? 'bottom' : 'right',
                direction: isMobile ? 'horizontal' : 'vertical',
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
              type: 'quantitative',
            },
            y: {
              field: 'y',
              type: 'quantitative',
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
          data: {
            values: [
              {
                lag: {},
              },
            ],
          },
          transform: [
            {
              calculate: 'lag',
              as: 'lag',
            },
          ],
          layer: [
            {
              mark: {
                type: 'text',
                color: 'firebrick',
                align: 'right',
                x: 'width',
                y: -5,
                size: 14,
                text: {
                  expr: "'R²: ' + format(lag.r2, '.2f')",
                },
              },
            },
            {
              mark: {
                type: 'rule',
                strokeWidth: 2,
                color: 'firebrick',
                clip: true,
              },
              encoding: {
                x: {
                  // use expressions to avoid that x1 is part of the x-scale domain
                  value: {
                    expr: `scale('x', lag.x1)`,
                  },
                  // field: 'lag.x1',
                  // type: 'quantitative',
                },
                x2: {
                  value: {
                    expr: `scale('x', lag.x2)`,
                  },
                  // field: 'lag.x2',
                  // type: 'quantitative',
                },
                y: {
                  value: {
                    expr: `scale('y', lag.y1)`,
                  },
                  // field: 'lag.y1',
                  // type: 'quantitative',
                },
                y2: {
                  value: {
                    expr: `scale('y', lag.y2)`,
                  },
                  // field: 'lag.y2',
                  // type: 'quantitative',
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
  $: spec = makeIndicatorCompareSpec(primary, secondary, {
    zero: !scaled,
    isMobile: $isMobileDevice,
    xDomain: domains.x,
    yDomain: domains.y,
  });

  let vegaRef = null;
</script>

<div class="chart-correlation">
  <Vega
    bind:this={vegaRef}
    {data}
    {spec}
    tooltip={CorrelationTooltip}
    tooltipProps={{ primary, secondary, lag }}
    signals={{ lag: lagObj }}
  />
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

  @media only screen and (min-width: 750px) {
    .chart-correlation {
      /** 1:1 + padding for legend **/
      padding-top: calc(100% + 50px - 100px);
    }
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
