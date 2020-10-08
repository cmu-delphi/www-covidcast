# Delphi COVID-19 Monitoring Dashboard

[![License: MIT][mit-image]][mit-url] [![Github Actions][github-actions-image]][github-actions-url] [![Netlify Status][netlify-image]][netlify-url]

This is the HCII-led project for visualizing Delphi predictions

The current stable `main` version is deployed at https://cmu-delphi-covidcast.netlify.app/.

The next `dev` version is deployed at https://dev--cmu-delphi-covidcast.netlify.app/.

## Figma Mock-Ups

Located at: https://www.figma.com/file/CZ3YwWBL2md9j39qdcBfDs/COVIDCast?node-id=0%3A1

## Development Environment

`node` and `npm` are required for development.

To begin development, clone this repository and run

`npm install`

To lint or check for styling, run

`npm run lint`

To run the development server, run

`npm start`

the website should open automatically.

### Release Process

To create a release, run

1. create a release branch `release-vX.X.X` and push to origin
1. run `npm run release` and publish the release
1. create a PR that merges the `release` branch in the `main` branch
1. create a PR that merges the `main` branch back into the `dev` branch

Then go to the release page and update short description of the changes made.

## License

This repository is released under the **MIT License**.

[mit-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[mit-url]: https://opensource.org/licenses/MIT
[github-actions-image]: https://github.com/cmu-delphi/www-covidcast/workflows/ci/badge.svg
[github-actions-url]: https://github.com/cmu-delphi/www-covidcast/actions
[netlify-image]: https://api.netlify.com/api/v1/badges/9ecc1d05-6a4e-4848-a7ad-f4490b0a26aa/deploy-status
[netlify-url]: https://app.netlify.com/sites/cmu-delphi-covidcast/deploys
