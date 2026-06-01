module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: { strict: false, esModuleInterop: true } }],
  },
  testEnvironment: 'node',
  testTimeout: 30000,
};
