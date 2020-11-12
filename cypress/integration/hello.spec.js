/// <reference types="cypress" />

describe('hello test', () => {
  it('smoke test', () => {
    cy.visit('/index.html');

    // https://on.cypress.io/get

    // wait that the map is ready
    cy.get('.mapboxgl-map[data-ready=ready]', {
      timeout: 30000,
    });

    cy.get('.banner').should('contain', 'daily doctor visits');
  });
  it('smoke mobile test', () => {
    cy.viewport('iphone-x').visit('/index.html');

    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('ResizeObserver loop limit exceeded')) {
        return false;
      }
    });

    // wait that the map is ready
    cy.get('.mapboxgl-map[data-ready=ready]', {
      timeout: 30000
    });

    cy.get('.banner').should('contain', 'daily doctor visits');
  });
});
