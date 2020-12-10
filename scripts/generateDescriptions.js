/**
 * helper script to download the google doc description format and generate a JSON out of it
 */

const fetch = require('node-fetch');
const fs = require('fs');
const yaml = require('js-yaml');
const marked = require('marked');

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
  // console.log(text);
  // find first code block
  const start = text.indexOf('---');
  let code = text.slice(start).trim();
  // replace * in links
  code = code.replace(/^[*] (.*)$/gm, ' - link: "$1"');
  // console.log(code);
  return code;
}

async function generateDescriptions() {
  const code = (await Promise.all(DOC_URL.split(',').map(loadDoc))).join('\n\n');

  fs.writeFileSync('./src/stores/descriptions.raw.txt', code);

  const entries = [];
  yaml.safeLoadAll(code, (doc) => {
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
    entries.push(r);
  });
  fs.writeFileSync('./src/stores/descriptions.generated.json', JSON.stringify(entries, null, 2));
}

async function generateSurveyDescriptions() {
  const code = (await Promise.all(SURVEY_DOC_URL.split(',').map(loadDoc))).join('\n\n');

  fs.writeFileSync('./src/modes/survey/descriptions.raw.txt', code);

  const parsed = {
    overview: '',
    questions: [],
  };

  let first = true;

  yaml.safeLoadAll(code, (doc) => {
    const r = {};
    Object.entries(doc).map(([key, value]) => {
      const formattedKey = key[0].toLowerCase() + key.slice(1);
      if (formattedKey === 'description' || formattedKey === 'question' || formattedKey === 'overview') {
        value = marked.parseInline(value.trim());
      }
      r[formattedKey] = value;
    });
    if (first) {
      Object.assign(parsed, r);
      first = false;
    } else {
      parsed.questions.push(r);
    }
  });
  fs.writeFileSync('./src/modes/survey/descriptions.generated.json', JSON.stringify(parsed, null, 2));
}

if (require.main === module) {
  generateDescriptions();
  generateSurveyDescriptions();
}
