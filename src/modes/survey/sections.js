import { sensorList } from '../../stores';

const criteria =
  '<a href="https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/fb-survey.html#ili-and-cli-indicators">these criteria</a>';
const community =
  '<a href="https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/fb-survey.html#estimating-community-cli">community</a>';

export const refSensor = sensorList.find((d) => d.signal === 'smoothed_wearing_mask');
export const dataSource = refSensor.id;

export const sections = [
  {
    section: 'Symptoms (forecast)',
    questions: [
      {
        question: 'A1: In the past 24 hours, have you or anyone in your household experienced any of the following ...',
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
