const path = require('path');
const fs = require('fs');

module.exports = (env, argv) => {

  env = env || {};
  argv = argv || {};
  const isEnvDev = [process.env, env.NODE_ENV, argv.mode].includes('development') || env.development;
  const isEnvTest = [process.env, env.NODE_ENV, argv.mode].includes('test') || env.test;
  const isEnvProd = [process.env, env.NODE_ENV, argv.mode].includes('production') || env.production;

  if (isEnvDev) {
    console.log(`Webpack with 'DEVELOPMENT' environment enabled`);
  }
  if (isEnvTest) {
    console.timeLog(`Webpack with 'TEST' environment enabled`);
  }

  const opts = {
    entry: './src/index.ts',
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.ts?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: "tsconfig.browser.json"
              }
            }
          ]
        },
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader'
          }
        }
      ].concat((isEnvDev || isEnvTest) ? {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre"
      } : [])
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    output: {
      filename: 'blockstack-collections.js',
      path: path.resolve(__dirname, 'dist'),
      library: 'blockstack-collections',
      libraryTarget: 'umd',
      globalObject: 'this'
    },
    plugins: []
  }

  return opts;
};
