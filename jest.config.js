/** @typedef {import('ts-jest')} */
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  globals: {
    "ts-jest": {
      tsconfig: "./tsconfig.json",
    },
  },
  preset: "ts-jest",
};

module.exports = config;
