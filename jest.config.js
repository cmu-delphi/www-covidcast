module.exports = {
  transform: {
    '^.+\\.svelte$': 'svelte-jester',
    '^.+\\.js$': 'babel-jest',
  },
  // transform all files including node modules
  transformIgnorePatterns: [],
  moduleFileExtensions: ['js', 'svelte'],
  moduleNameMapper: {
    // special module loading
    '!file-loader.*': 'identity-obj-proxy',
    '\\.css': 'identity-obj-proxy',
    '\\.csv$': '<rootDir>/src/__mocks__/csvMock.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/cypress'],
};
