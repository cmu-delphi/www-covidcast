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
      filename: '[name].js',
      chunkFilename: devMode ? '[name].js' : '[name].[chunkhash].js',
      // publicPath: './',
    },

    resolve: {
      alias: {
        svelte: path.resolve('node_modules', 'svelte'),
      },
      extensions: ['.mjs', '.js', '.svelte'],
      mainFields: ['svelte', 'browser', 'module', 'main'],
    },

    optimization: {
      minimizer: [new OptimizeCSSAssetsPlugin(), new TerserPlugin()],
      splitChunks: {
        cacheGroups: {
          // no splitting of css files
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/](?!(uikit)\/)/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },

    module: {
      rules: [
        !devMode && {
          test: /\.m?js$/,
          exclude: /node_modules\/(?!(svelte|mapbox-gl)\/)/,
          use: ['babel-loader'],
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
                'babel-loader',
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
                hmr,
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
      new EnvironmentPlugin(['NODE_ENV']),
      // new CopyPlugin({
      //   patterns: ['./src/static'],
      // }),
      new HtmlWebpackPlugin({
        alwaysWriteToDisk: true,
        template: './src/index.html',
      }),
      new HtmlWebpackHarddiskPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        ignoreOrder: true,
        chunkFilename: devMode ? '[name].css' : '[name].[chunkhash].css',
      }),
    ].filter(Boolean),
  };
};
