const { execSync } = require('child_process');
const { request } = require('@octokit/request');
const { resolve } = require('path');
const { version } = require(resolve(__dirname, '../package.json'));
const { readFileSync, writeFileSync, existsSync } = require('fs');

function removeConventionalCommit(name) {
  if (name.includes(':')) {
    return name.slice(name.indexOf(':') + 1).trim();
  }
  return name;
}

async function main() {
  console.log('fetching git log');
  const out = execSync(`git log --oneline --decorate --graph --first-parent --merges origin/main..HEAD`).toString();
  const mergedPRs = out
    .match(/pull request #(\d+)/gm)
    .map((d) => Number.parseInt(/pull request #(\d+)/gm.exec(d)[1], 10));

  let bugfixes = [];
  let enhancements = [];
  let others = [];

  console.log(`fetching PRs: ${mergedPRs.map((d) => `#${d}`).join(', ')}`);
  for (const pr of mergedPRs) {
    const result = await request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      headers: process.env.GITHUB_TOKEN
        ? {
            authorization: `token ${process.env.GITHUB_TOKEN}`,
          }
        : {},
      owner: 'cmu-delphi',
      repo: 'www-covidcast',
      pull_number: pr,
    });

    let prTitle = result.data.title.trim();
    const labels = result.data.labels.map((l) => l.name);
    if (prTitle.startsWith('fix')) {
      labels.push('bug');
      prTitle = removeConventionalCommit(prTitle);
    } else if (prTitle.startsWith('feat')) {
      labels.push('enhancement');
      prTitle = removeConventionalCommit(prTitle);
    }
    prTitle = `${prTitle[0].toUpperCase()}${prTitle.slice(1)}`;

    const text = `- [#${pr}](${result.data.html_url}) ${prTitle}`;

    if (labels.includes('bug') || prTitle.startsWith('fix')) {
      bugfixes.push(text);
    } else if (labels.includes('enhancement') || prTitle.startsWith('feat')) {
      enhancements.push(text);
    } else {
      others.push(text);
    }
  }

  console.log(`generate changelog`);
  const full = `# Release ${version}

## New Features

${enhancements.join('\n')}

## Bug-fixes

${bugfixes.join('\n')}

## Others

${others.join('\n')}
`;

  const changelog = resolve(__dirname, '../CHANGELOG.md');
  const old = existsSync(changelog) ? readFileSync(changelog).toString() : '';

  const newChangelog = `${full}${old.length > 0 ? '\n\n' : ''}${old}`;
  writeFileSync(changelog, newChangelog);
  execSync(`git add ${changelog}`);
}

main();
