# Contributing to COVIDCast

## Branches

- `main`

  The main branch of this project is called `main` and contains the latest release candidate.
  It is protected such that only reviewed pull requests are merged in.

- `dev`

  The `dev` branch is used for the current release and continuous merge during a sprint.
  New features or bugfixes are merged into this branch using a pull request.

- `<author>/<name>`

  new features by authors are created in feature branches. By convention the branch should start with the author name.
  The name itself should either reflects its content in a condensed form or referencing an issue which this branch addresses. Examples: `sgratzl/hotspots`, `sgratzl/issue_34`.

## Issues

TODO

## Pull Requests

The purpose of a pull request is to merge the solution to an existing issue into the current `dev` branch.
The comments / reviews of the PR should limit to the changed aspects of this PR. Discussions of new ideas or unrelated
bugs should be moved to a new issue or Slack.

### Pull Request Creation

By default new pull requests should be merged into the `dev` branch.
The `main` branch is protected for the current release candidate only.
An exception of this rule are hotfixes which fixes specific bugs in the current release candidate.

Follow the pull request template request review of the primary code and also assign the primary code owner.

### Pull Request Reviews

Every pull request has to be reviewed. The review should be done by the primary code owner of this repository.
The primary code owner can request reviews of other users if needed. Tasks of reviewing a PR include

- testing the feature/bugfix which the PR addresses
- check the code quality of the code, regarding:
  - use of camel case naming convention, e.g. `testMethod` instead of `test_method`
  - comments for complicated code sections
  - no `console.log` statements
  - no `debugger` statements
  - no `TODO` markers
  - ...

Once the PR has be successfully reviewed and approved the primary code owner / assignee merges the PR.
In addition, he/she should close any references issues which are not automatically closed.
