/// <reference types="cypress" />

context('Querying', () => {
  beforeEach(() => {
    cy.visit('/index.html');
  });

  it('cy.get() - query DOM elements', () => {
    // https://on.cypress.io/get

    cy.get('.viz-name h1').should('contain', 'COVIDcast');
  });
});
