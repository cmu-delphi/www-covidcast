module.exports = {
  transform: {
    '^.+\\.svelte$': 'svelte-jester',
    '^.+\\.js$': 'babel-jest',
  },
  // // transform all files including node modules
  transformIgnorePatterns: ['node_modules/(?!(svelte|svelte-icons)/)'],
  moduleFileExtensions: ['js', 'svelte'],
  moduleNameMapper: {
    // special module loading
    '!file-loader.*': 'identity-obj-proxy',
    '\\.css': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/cypress'],
};
