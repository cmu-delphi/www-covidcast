/* eslint-env node */
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const { EnvironmentPlugin, DefinePlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const pkg = require('./package.json');

const devMode = process.env.NODE_ENV !== 'production';
const hmr = devMode;

module.exports = () => {
  return {
    entry: {
      wrapper: './src/wrapper/index.js',
      bundle: './src/index.js',
    },

    output: {
      path: path.resolve(__dirname, 'public'),
      filename: devMode ? '[name].js' : '[name].[contenthash].js',
      chunkFilename: devMode ? '[name].js' : '[name].[contenthash].js',
      publicPath: hmr ? '/' : undefined,
    },

    resolve: {
      alias: {
        svelte: path.resolve('node_modules', 'svelte'),
      },
      extensions: ['.mjs', '.js', '.svelte'],
      mainFields: ['svelte', 'module', 'browser', 'main'],
    },

    optimization: {
      minimizer: [new OptimizeCSSAssetsPlugin(), new TerserPlugin()],
      splitChunks: {
        minChunks: 2,
        maxInitialRequests: 4,
        maxAsyncRequests: 6,
        cacheGroups: {
          // no splitting of css files
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true,
          },
        },
      },
    },

    module: {
      rules: [
        !devMode && {
          test: /\.m?js$/,
          exclude: /node_modules[\\/](?!(svelte|mapbox-gl)[\\/])/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
                cacheCompression: false,
              },
            },
          ],
        },
        {
          test: /\.svelte$/,
          use: hmr
            ? [
                {
                  loader: 'svelte-loader-hot',
                  options: {
                    dev: true,
                    hotReload: true,
                    emitCss: false,
                  },
                },
              ]
            : [
                {
                  loader: 'babel-loader',
                  options: {
                    cacheDirectory: true,
                    cacheCompression: false,
                  },
                },
                {
                  loader: 'svelte-loader',
                  options: {
                    dev: devMode,
                    emitCss: true,
                  },
                },
              ],
        },
        {
          test: /\.(sass|css|scss)$/i,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                esModule: false,
              },
            },
            'css-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.(png|jpg|gif|svg|jpeg)$/i,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 8192,
              },
            },
          ],
        },
        {
          test: /\.(txt|csv|tsv)$/i,
          use: 'raw-loader',
        },
      ].filter(Boolean),
    },

    devServer: {
      contentBase: [path.join(__dirname, 'public'), path.join(__dirname, 'src/assets')],
      contentBasePublicPath: ['/', '/assets'],
      watchContentBase: true,
      host: 'localhost',
      hot: hmr,
    },

    plugins: [
      devMode ? null : new CleanWebpackPlugin(),
      new DefinePlugin({
        __VERSION__: JSON.stringify(pkg.version),
      }),
      new EnvironmentPlugin({
        NODE_ENV: 'production',
        COVIDCAST_ENDPOINT_URL: 'https://api.covidcast.cmu.edu/epidata/api.php',
      }),
      // new CopyPlugin({
      //   patterns: ['./src/static'],
      // }),

      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        title: 'COVIDcast',
        template: './src/index.html',
      }),
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        title: 'COVIDcast',
        template: './src/index.html',
        filename: 'landing/index.html',
      }),
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        title: 'COVIDcast',
        template: './src/index.html',
        filename: 'overview/index.html',
      }),
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        title: 'COVIDcast Indicator Details',
        template: './src/index.html',
        filename: 'indicator/index.html',
      }),
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        title: 'COVIDcast',
        template: './src/index.html',
        filename: 'old/index.html',
      }),
      // new HtmlWebpackPlugin({
      //   alwaysWriteToDisk: true,
      //   title: 'COVIDcast Timelapse',
      //   template: './src/index.html',
      //   filename: 'timelapse/index.html',
      // }),
      // new HtmlWebpackPlugin({
      //   alwaysWriteToDisk: true,
      //   title: 'COVIDcast Top 10',
      //   template: './src/index.html',
      //   filename: 'top10/index.html',
      // }),
      // new HtmlWebpackPlugin({
      //   alwaysWriteToDisk: true,
      //   title: 'COVIDcast Region Details',
      //   template: './src/index.html',
      //   filename: 'single/index.html',
      // }),
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        title: 'COVIDcast Export Data',
        template: './src/index.html',
        filename: 'export/index.html',
      }),
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        title: 'COVIDcast Survey Results',
        template: './src/index.html',
        filename: 'survey-results/index.html',
      }),
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        title: 'COVIDcast Lab',
        template: './src/index.html',
        filename: 'lab/index.html',
      }),

      new HtmlWebpackHarddiskPlugin(),
      new MiniCssExtractPlugin({
        filename: devMode ? '[name].css' : '[name].[contenthash].css',
        ignoreOrder: true,
        chunkFilename: devMode ? '[name].css' : '[name].[contenthash].css',
      }),
    ].filter(Boolean),
  };
};
