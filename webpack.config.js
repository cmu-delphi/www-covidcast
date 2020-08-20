/* eslint-env node */
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const { EnvironmentPlugin, DefinePlugin } = require('webpack');
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const pkg = require('./package.json');

const devMode = process.env.NODE_ENV !== 'production';

module.exports = () => {
  return {
    entry: {
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
      minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
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
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },

    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /node_modules\/(?!svelte)/,
          use: ['babel-loader'],
        },
        {
          test: /\.svelte$/,
          use: [
            'babel-loader',
            {
              loader: 'svelte-loader',
              options: {
                dev: devMode,
                hotReload: false,
                emitCss: true,
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                hmr: false,
                esModule: false,
              },
            },
            'css-loader',
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
      ],
    },

    devServer: {
      contentBase: path.join(__dirname, 'public'),
      watchContentBase: true,
      host: 'localhost',
      hot: false,
    },

    plugins: [
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
      new HtmlWebpackPlugin({
        filename: 'embed.html',
        alwaysWriteToDisk: true,
        template: './src/embed.html',
      }),
      new HtmlWebpackHarddiskPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: devMode ? '[name].js' : '[name].[chunkhash].js',
        ignoreOrder: true,
      }),
      !devMode && new CleanWebpackPlugin(),
    ].filter(Boolean),
  };
};
