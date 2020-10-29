/// <reference types="cypress" />

describe('hello test', () => {
  it('smoke test', () => {
    cy.visit('/index.html');

    // https://on.cypress.io/get

    // wait that the map is ready
    cy.get('.mapboxgl-map[data-ready=ready]');

    cy.get('.viz-name h1').should('contain', 'COVIDcast');
  });
  it('smoke mobile test', () => {
    cy.viewport('iphone-x').visit('/index.html');

    // wait that the map is ready
    cy.get('.mapboxgl-map[data-ready=ready]');

    cy.get('.viz-name h1').should('contain', 'COVIDcast');
  });
});
