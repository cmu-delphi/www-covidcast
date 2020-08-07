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

Issues are the main communication point when it comes to bugfixes, new features, or other possible changes. The repository has several issue templates that help to structure issues. An bug issue should address a single bug in the application.

The discussion / comments within an issue should restrict to the topic of the issue identified by its title. An exception are general `discussion` labeled issues which are designed for an more open discussion. Once the discussion agrees to a solution/change a new issue should be created with a clear description.

Issues are assigned to a single user which is responsible for the implementation of the issue eventually leading to a pull request.

## Project Board

The main project board is located at https://github.com/cmu-delphi/www-covidcast/projects/2.

The columns have the following meaning:

- `To Do`

  contains newly created issues that needs still to be evaluated and discussed and not yet ready to be implemented

- `Up Next`

  contains assigned issues that should be implemented next. The top most issue has the highest priority

- `In Progress`

  once a developer starts working on an issue he/she should move the issue from the `Up Next` to the `In Progress` column indicating that it is currently implemented

- `In Review`

  after creating the pull request for an issue the pull request card as well as the corresponding issue card are moved to the `In Review` column indicating that they can be reviewed and tested.

- `Done`

  after merging the pull request, the pull request and issue cards can be moved to the `Done` column

- `Icebox`

  the `Icebox` column contains issues that open for discussion, have no specific plan, or longer future ideas

## Pull Requests

The purpose of a pull request is to merge the solution to an existing issue into the current `dev` branch.
The comments / reviews of the PR should limit to the changed aspects of this PR. Discussions of new ideas or unrelated bugs should be moved to slack and eventually to a new Github issue.

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
  - no duplicated code
  - good modularization
  - ...

Once the PR has be successfully reviewed and approved the primary code owner / assignee merges the PR.
In addition, he/she should close any references issues which are not automatically closed.
