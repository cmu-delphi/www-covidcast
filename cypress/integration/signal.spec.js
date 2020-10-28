/// <reference types="cypress" />

import { visitWithSensor } from './utils/sensor';

describe('fake sensor data test', () => {
  it('custom data', () => {
    visitWithSensor();
  });
});
