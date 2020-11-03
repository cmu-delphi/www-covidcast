/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
    browser: true,
    jest: true,
  },
  plugins: ['svelte3'],
  overrides: [
    {
      // see https://github.com/sveltejs/eslint-plugin-svelte3/blob/master/OTHER_PLUGINS.md
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
      rules: {
        'import/first': 'off',
        'import/no-duplicates': 'off',
        'import/no-mutable-exports': 'off',
        'import/no-unresolved': 'off',
      },
    },
  ],
  settings: {
    // ...
  },
};
