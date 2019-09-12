const path = require('path');

module.exports = (env, argv) => {

  env = env || {};
  argv = argv || {};
  const isEnvAnalyze = process.env.ANALYZE || env.ANALYZE;
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
          test: /\.ts$/,
          exclude: /(node_modules|bower_components)/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', {
                    targets: '> 2%',
                    useBuiltIns: 'usage',
                    corejs: { version: 3 },
                  }]
                ]
              }
            },
            {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.browser.json',
                transpileOnly: true
              }
            }
          ]
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
    externals: {
      blockstack: 'blockstack'
    },
    output: {
      filename: 'blockstack-collections.js',
      path: path.resolve(__dirname, 'dist'),
      library: 'blockstackCollections',
      libraryTarget: 'umd',
      globalObject: 'this'
    },
    plugins: [],
    devServer: {
      contentBase: [__dirname, path.join(__dirname, 'dist')],
      index: path.join(__dirname, 'index.html'),
      host: '127.0.0.1',
      port: 9134,
      open: true
    }
  }

  if (isEnvAnalyze) {
    opts.plugins.push(new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)())
  }

  return opts;
};
