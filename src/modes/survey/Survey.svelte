<script>
  import Vega from '../../components/Vega.svelte';
  import { fetchMultiSignal } from '../../data';

  import { currentRegionInfo, yesterdayDate } from '../../stores';

  const dataSource = 'fb-survey';

  const criteria =
    '<a href="https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/fb-survey.html#ili-and-cli-indicators">these criteria</a>';
  const community =
    '<a href="https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/fb-survey.html#estimating-community-cli">community</a>';

  const sections = [
    {
      section: 'Symptoms (forecast)',
      questions: [
        {
          question:
            'A1: In the past 24 hours, have you or anyone in your household experienced any of the following ...',
          indicators: [
            {
              name: 'COVID-Like Symptoms',
              description: `Estimated percentage of people with COVID-like illness based on ${criteria}.`,
              signal: 'smoothed_cli',
            },
            {
              name: 'Flu-Like Symptoms',
              description: `Estimated percentage of people with influenza-like illness based on ${criteria}.`,
              signal: 'smoothed_ili',
            },
          ],
        },
        {
          question:
            'A4: How many additional people in your local community that you know personally are sick (fever, along with at least one other symptom from the list)?',
          indicators: [
            {
              name: 'COVID-Like Symptoms in Community',
              description: `Estimated percentage of people reporting illness in their local community, see ${community}, including their household.`,
              signal: 'smoothed_hh_cmnty_cli',
            },
            {
              name: 'COVID-Like Symptoms in Community not including their household',
              description: `Estimated percentage of people reporting illness in their local community, see ${community}, not including their household.`,
              signal: 'smoothed_nohh_cmnty_cli',
            },
          ],
        },
      ],
    },
    {
      section: 'Symptoms (non-forecast)',
      questions: [
        {
          question: 'B8, B10: Have you been tested for coronavirus (COVID-19) in the last 14 days?',
          indicators: [
            {
              name: 'Got Tested for COVID-19',
              description:
                'Estimated percentage of people who were tested for COVID-19 in the past 14 days, regardless of their test result.',
              signal: 'smoothed_tested_14d',
            },
          ],
        },
        {
          question: 'B10a: Did this test find that you had coronavirus (COVID-19)?',
          indicators: [
            {
              name: 'Test Positivity Rate',
              description:
                'Estimated test positivity rate (percent) among people tested for COVID-19 in the past 14 days.',
              signal: 'smoothed_tested_positive_14d',
            },
          ],
        },
        {
          question: 'B12: Have you wanted to be tested for coronavirus (COVID-19) at any time in the last 14 days?',
          indicators: [
            {
              name: 'Wanted but could not get tested',
              description:
                'Estimated percentage of people who wanted to be tested for COVID-19 in the past 14 days, out of people who were not tested in that time.',
              signal: 'smoothed_wanted_test_14d',
            },
          ],
        },
      ],
    },
    {
      section: 'Contacts and risk factors',
      questions: [
        {
          question: 'C14: In the past 5 days, how often did you wear a mask when in public?',
          indicators: [
            {
              name: 'People Wearing Masks',
              description:
                'Estimated percentage of people who wore a mask most or all of the time while in public in the past 5 days; those not in public in the past 5 days are not counted.',
              signal: 'smoothed_wearing_mask',
            },
          ],
        },
      ],
    },
  ];

  const date = yesterdayDate;
  const region = $currentRegionInfo;

  let showErrorBars = false;

  /**
   * @param {Date} date
   * @param {import('../../maps').NameInfo} region
   */
  function loadData(date, region) {
    // collect all data to load
    const signals = sections
      .map((d) => d.questions.map((d) => d.indicators))
      .flat(2)
      .map((d) => d.signal);

    return fetchMultiSignal(dataSource, signals, date, region, ['issue', 'sample_size']);
  }

  /**
   * @param {boolean} showErrorBars
   */
  function createVegaSpec(showErrorBars) {
    /**
     * @type {import('vega-lite').TopLevelSpec}
     */
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      data: { name: 'values' },
      width: 'container',
      height: 'container',
      padding: 0,
      autosize: {
        resize: true,
      },
      transform: [
        {
          calculate: 'datum.value == null ? null : datum.stderr / 100',
          as: 'pStdErr',
        },
        {
          calculate: 'datum.value == null ? null : datum.value / 100',
          as: 'pValue',
        },
        {
          calculate: 'datum.pValue == null ? null : datum.pValue + datum.pStdErr',
          as: 'pValueAndStdErr',
        },
      ],
      encoding: {
        x: {
          field: 'pValue',
          type: 'quantitative',
          scale: {
            domain: [0, 1],
            clamp: true,
          },
          axis: {
            format: '.1%',
            title: 'Percentage',
          },
        },
      },
      layer: [
        {
          mark: 'bar',
        },
        ...(showErrorBars
          ? [
              {
                mark: 'errorbar',
                encoding: {
                  xError: { field: 'pStdErr' },
                },
              },
            ]
          : []),
        {
          mark: {
            type: 'text',
            align: 'left',
            baseline: 'middle',
            dx: 3,
          },
          encoding: {
            x: {
              field: showErrorBars ? 'pValueAndStdErr' : 'pValue', // shift by value and stderr
              type: 'quantitative',
            },
            text: {
              field: 'pValue',
              type: 'quantitative',
              format: '.1%',
            },
          },
        },
      ],
    };

    return spec;
  }

  $: data = loadData(date, region);
  $: spec = createVegaSpec(showErrorBars);

  $: dataLookup = data.then((r) => new Map(r.map((d) => [d.signal, d])));

  function formatSampleSize(entry) {
    if (!entry || entry.sample_size == null) {
      return '?';
    }
    return Math.floor(entry.sample_size).toLocaleString();
  }
</script>

<style>
  .root {
    padding: 1em;
  }
  .split {
    display: flex;
  }
  .split > main {
    flex-grow: 1;
  }

  section {
    margin: 1em 0;
    padding: 0.5em;
    border-bottom: 1px solid lightgray;
  }

  .question {
    margin: 0.5em 0;
    padding: 0.2em;
  }

  .indicator {
    margin: 0.5em 0;
    padding: 0.2em;
  }
  .vega-wrapper {
    position: relative;
    height: 5em;
  }
  .vega-wrapper > :global(*) {
    position: absolute;
    left: 0;
    top: 0;
    right: 2px;
    bottom: 0;
  }

  p {
    padding: 0;
  }

  .info {
    text-align: right;
    font-size: 75%;
  }
</style>

<div class="root">
  <h1>Facebook Survey Results</h1>
  <div class="split">
    <main>
      {#each sections as section}
        <section>
          <h2>{section.section}</h2>
          {#each section.questions as question}
            <div class="question">
              <h3>{question.question}</h3>
              {#each question.indicators as indicator}
                <div class="indicator">
                  <h4>{indicator.name}</h4>
                  <p>
                    {@html indicator.description}
                  </p>
                  <div class="vega-wrapper">
                    <Vega data={data.then((r) => r.filter((d) => d.signal === indicator.signal))} {spec} />
                  </div>
                  {#await dataLookup}
                    <div class="info loading">based on ? samples</div>
                  {:then lookup}
                    <div class="info">based on {formatSampleSize(lookup.get(indicator.signal))} samples</div>
                  {/await}
                </div>
              {/each}
            </div>
          {/each}
        </section>
      {/each}
    </main>
    <aside>
      <div><label><input type="checkbox" bind:value={showErrorBars} />Show Error Bars</label></div>
    </aside>
  </div>
</div>
