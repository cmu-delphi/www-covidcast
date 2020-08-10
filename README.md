# Delphi COVID-19 Monitoring Dashboard

[![Github Actions][github-actions-image]][github-actions-url] [![Netlify Status][netlify-image]][netlify-url]

This is the HCII-led project for visualizing Delphi predictions

## Contribution Guide

`node` and `npm` are required for development.

To begin development, clone this repository and run

`npm install`

To run the development server, run

`npm run start`

To deploy an update run

`npm run deploy`

To lint or check for styling, run

`npm run lint`

If you have having trouble with any of them, run

`npm ci`

To view a version of the visualization in the frame of a cmu.edu site, run the server and go to:

http://localhost:5000/frame.html

### Tagging a release

To release, run

`npm run release`

Then click on draft new release and tag it with the corresponding version number. Add a short description of the changes made and make sure to attach the release.zip file.

## Figma Mock-ups

Current Figma: https://www.figma.com/file/CZ3YwWBL2md9j39qdcBfDs/COVIDCast?node-id=0%3A1

The most current mock (for the graph) is 'Design 7'. Other mock to consider is 'Current Design Plan' . Mocks may lag dev changes.

[github-actions-image]: https://github.com/cmu-delphi/www-covidcast/workflows/ci/badge.svg
[github-actions-url]: https://github.com/cmu-delphi/www-covidcast/actions
[netlify-image]: https://api.netlify.com/api/v1/badges/9ecc1d05-6a4e-4848-a7ad-f4490b0a26aa/deploy-status
[netlify-url]: https://app.netlify.com/sites/cmu-delphi-covidcast/deploys

Old Figma: https://www.figma.com/file/CkdJq5qlvpQNhUsaihBsFE/Delphi-Covid-Forecasting?node-id=0%3A1
