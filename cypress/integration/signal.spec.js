/// <reference types="cypress" />

import { visitWithSensor } from './utils/sensor';

describe('fake sensor data test', () => {
  it('custom data', () => {
    visitWithSensor({
      query: {
        mode: 'single',
      },
    });
    // wait that the map is ready
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.get('.card')
      .wait(1000)
      .matchImageSnapshot({
        failureThreshold: 0.2,
        failureThresholdType: 'percent',
        customDiffConfig: {
          threshold: 0.1,
        },
      });
  });
});
