module.exports = {
  testEnvironment: 'jsdom',
  // preprocess *.ts test files with ts-jest
  preset: 'ts-jest',

  transform: {
    '^.+\\.svelte$': ['svelte-jester', { preprocess: true }],
    '^.+\\.js$': 'babel-jest',
  },
  // // transform all files including node modules
  transformIgnorePatterns: ['node_modules/(?!(svelte|svelte-icons|lodash-es|d3-.*)/)'],
  moduleFileExtensions: ['js', 'ts', 'svelte'],
  moduleNameMapper: {
    // special module loading
    '!file-loader.*': 'identity-obj-proxy',
    '\\.css': 'identity-obj-proxy',
    '!raw-loader.*': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/cypress'],
};
