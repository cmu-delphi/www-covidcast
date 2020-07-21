/* eslint-env node */
module.exports = {
  presets: [
    [
      '@babel/env',
      {
        useBuiltIns: 'entry',
        corejs: 3,
        targets: ['last 2 versions', 'ie >= 11'],
      },
    ],
  ],
};
