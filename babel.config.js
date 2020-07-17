/* eslint-env node */
module.exports = {
  presets: [
    [
      '@babel/env',
      {
        useBuiltIns: 'entry',
        corejs: 3,
      },
    ],
  ],
};
