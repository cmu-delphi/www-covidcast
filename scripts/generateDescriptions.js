/**
 * helper script to download the google doc description format and generate a JSON out of it
 */

const fetch = require('node-fetch');
const fs = require('fs');
const yaml = require('js-yaml');
const marked = require('marked');

const isCheckMode = process.argv.includes('--check');
const isFallBackMode = process.argv.includes('--fallback');

// has to be publicly viewable
const DOC_URL =
  process.env.COVIDCAST_SIGNAL_DOC || 'https://docs.google.com/document/d/1RLy4O-gtACVjLEVD_vxyPqvp9nWVhqEjoWAKi68RKpg';

const SURVEY_DOC_URL =
  process.env.COVIDCAST_SURVEY_DOC || 'https://docs.google.com/document/d/148mmPJ6wFYdINA5EGW4Q4Tt7zZKR0qPQKMDdalJ7vlA';

async function loadDoc(url) {
  /**
   * download as plain text
   * @type {string}
   */
  const text = await fetch(`${url}/export?format=txt`).then((res) => res.text());
  if (text.startsWith('<!DOCTYPE html>')) {
    console.warn(`${url}: expecting a text file, got a HTML file`);
    return '';
  }
  // console.log(text);
  // find first code block
  const start = text.indexOf('---');
  let code = text.slice(start).trim();
  // replace * in links
  code = code.replace(/^[*] (.*)$/gm, ' - link: "$1"');
  // console.log(code);
  // unify line endings
  return code.replace(/\r?\n/g, '\n');
}

function compare(current, fileName) {
  if (!fs.existsSync(fileName)) {
    console.error(`file ${fileName} doesn't exit`);
    process.exit(1);
  }
  if (!current) {
    console.warn(`current text is empty, indicating a downloading error`, fileName);
    return true;
  }
  const stored = fs.readFileSync(fileName).toString().replace(/\r?\n/g, '\n');
  if (stored !== current) {
    console.error(
      `file ${fileName} is out of date and needs to be synced. Open a new PR and commit the output of "npm run gen"`,
    );
    process.exit(1);
  } else {
    console.log(`file ${fileName} matches the downloaded file`);
  }
}

async function handleFile(docUrl, fileName, converter) {
  const code = (await Promise.all(docUrl.split(',').map(loadDoc))).join('\n\n');
  if (isCheckMode) {
    return compare(code, fileName);
  }
  if (!code && isFallBackMode && fs.existsSync(fileName)) {
    converter(fs.readFileSync(fileName).toString());
    return;
  }
  if (!code) {
    console.error('failed to download file', fileName);
    process.exit(1);
  }
  fs.writeFileSync(fileName, code);
  converter(code);
}

function convertDescriptions(code) {
  const entries = yaml.loadAll(code).map((doc) => {
    const r = {};
    Object.entries(doc).map(([key, value]) => {
      const formattedKey = key[0].toLowerCase() + key.slice(1);
      if (formattedKey === 'description' || formattedKey === 'credits') {
        value = marked.parseInline(value.trim());
      } else if (formattedKey === 'links') {
        // expect an array with an link property
        value = value.map((value) => marked.parseInline(value.link.trim()));
      } else if (
        formattedKey === 'casesOrDeathSignals' ||
        (formattedKey === 'mapTitleText' && typeof value !== 'string') ||
        (formattedKey === 'yAxis' && typeof value !== 'string')
      ) {
        // also format nested object
        const sub = {};
        Object.entries(value).forEach(([k, v]) => {
          sub[k[0].toLowerCase() + k.slice(1)] = v;
        });
        value = sub;
      }
      r[formattedKey] = value;
    });
    return r;
  });
  fs.writeFileSync('./src/stores/descriptions.generated.json', JSON.stringify(entries, null, 2));
}

function generateDescriptions() {
  return handleFile(DOC_URL, './src/stores/descriptions.raw.txt', convertDescriptions);
}

function convertSurveyDescriptions(code) {
  const parsed = {
    overview: '',
    questions: [],
  };

  const [overview, ...rest] = yaml.loadAll(code);

  function parseDoc(doc) {
    const r = {};
    Object.entries(doc).map(([key, value]) => {
      const formattedKey = key[0].toLowerCase() + key.slice(1);
      if (formattedKey === 'overview') {
        value = marked.parse(value.trim());
      } else if (formattedKey === 'description' || formattedKey === 'question') {
        value = marked.parseInline(value.trim());
      } else if (formattedKey === 'oldRevisions') {
        // also format nested object
        const arr = value.map((entry) => {
          const sub = {};
          Object.entries(entry).forEach(([k, v]) => {
            sub[k[0].toLowerCase() + k.slice(1)] = v;
          });
          return sub;
        });
        value = arr;
      }
      r[formattedKey] = value;
    });
    return r;
  }
  Object.assign(parsed, parseDoc(overview));
  for (const doc of rest) {
    parsed.questions.push(parseDoc(doc));
  }
  fs.writeFileSync('./src/modes/survey/descriptions.generated.json', JSON.stringify(parsed, null, 2));
}

function generateSurveyDescriptions() {
  return handleFile(SURVEY_DOC_URL, './src/modes/survey/descriptions.raw.txt', convertSurveyDescriptions);
}

if (require.main === module) {
  generateDescriptions();
  generateSurveyDescriptions();
}
