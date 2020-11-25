const path = require("path");

module.exports = (env, argv) => {
  return {
    entry: {
      index: path.resolve(__dirname, "./build/esm/index.js"),
    },
    output: {
      path: path.resolve(__dirname, "./build/umd"), // builds to ./build/umd/
      filename: "[name].js", // index.js
      library: "typescriptAlgos", // aka window.myLibrary
      libraryTarget: "umd", // supports commonjs, amd and web browsers
      globalObject: "this",
    },
    module: {
      rules: [
        {
          test: /\.(tsx?)|(js)$/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: {
                      esmodules: true,
                    },
                  },
                ],
              ],
            },
          },
        },
      ],
    },
  };
};
