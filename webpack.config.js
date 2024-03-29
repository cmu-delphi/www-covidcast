/* eslint-env node */
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { EnvironmentPlugin, DefinePlugin } = require('webpack');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const pkg = require('./package.json');
// const { preprocess } = require('./svelte.config');

const devMode = process.env.NODE_ENV !== 'production';

// see https://webpack.js.org/plugins/mini-css-extract-plugin/#extracting-all-css-in-a-single-file
function recursiveIssuer(m, c) {
  const issuer = c.moduleGraph.getIssuer(m);
  // For webpack@4 issuer = m.issuer

  if (issuer) {
    return recursiveIssuer(issuer, c);
  }

  const chunks = c.chunkGraph.getModuleChunks(m);
  // For webpack@4 chunks = m._chunks

  for (const chunk of chunks) {
    return chunk.name;
  }

  return false;
}

module.exports = () => {
  return {
    target: devMode ? 'web' : undefined,
    entry: {
      wrapper: './src/wrapper/index.js',
      bundle: './src/index.js',
    },

    output: devMode
      ? {
          path: path.resolve(__dirname, 'public'),
          publicPath: '/',
        }
      : {
          path: path.resolve(__dirname, 'public'),
          filename: '[name].[contenthash].js',
          chunkFilename: '[name].[contenthash].js',
        },
    resolve: {
      alias: {
        svelte: path.resolve('node_modules', 'svelte'),
      },
      extensions: ['.ts', '.mjs', '.js', '.svelte'],
      mainFields: ['svelte', 'module', 'browser', 'main'],
    },

    optimization: {
      minimizer: [
        // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
        `...`,
        new CssMinimizerPlugin(),
      ],
      splitChunks: {
        cacheGroups: {
          styles: {
            name: 'styles',
            type: 'css/mini-extract',
            test: (m, c, entry = 'bundle') => m.constructor.name === 'CssModule' && recursiveIssuer(m, c) === entry,

            // For webpack@4
            // test: /\.css$/,
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
          exclude: /node_modules[\\/](?!(svelte)[\\/])/,
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
          use: [
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
                // preprocess,
                compilerOptions: {
                  dev: devMode,
                },
                hotReload: devMode,
                emitCss: true, // !devMode,
              },
            },
          ].slice(devMode ? 1 : 0),
        },
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
                cacheCompression: false,
              },
            },
            {
              loader: 'ts-loader',
            },
          ].slice(devMode ? 1 : 0),
        },
        {
          // required to prevent errors from Svelte on Webpack 5+, omit on Webpack 4
          test: /node_modules\/svelte\/.*\.mjs$/,
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.(sass|css|scss)$/i,
          use: [
            devMode
              ? 'style-loader'
              : {
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                    // esModule: false,
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
      static: {
        directory: path.join(__dirname, 'public'),
        publicPath: '/',
        watch: true,
      },
      host: 'localhost',
      hot: devMode,
    },

    plugins: [
      devMode ? null : new CleanWebpackPlugin(),
      new DefinePlugin({
        __VERSION__: JSON.stringify(pkg.version),
      }),
      new EnvironmentPlugin({
        COVIDCAST_ENDPOINT_URL: 'https://api.covidcast.cmu.edu/epidata',
      }),
      new HtmlWebpackPlugin({
        title: 'COVIDcast',
        template: './src/index.html',
      }),
      new HtmlWebpackPlugin({
        title: 'COVIDcast',
        template: './src/index.html',
        filename: 'summary/index.html',
      }),
      new HtmlWebpackPlugin({
        title: 'COVIDcast Indicator Details',
        template: './src/index.html',
        filename: 'indicator/index.html',
      }),
      new HtmlWebpackPlugin({
        title: 'COVIDcast Export Data',
        template: './src/index.html',
        filename: 'export/index.html',
      }),
      new HtmlWebpackPlugin({
        title: 'COVIDcast Survey Results',
        template: './src/index.html',
        filename: 'survey-results/index.html',
      }),
      new HtmlWebpackPlugin({
        title: 'COVIDcast Indicator Status Overview',
        template: './src/index.html',
        filename: 'indicator-status/index.html',
      }),
      new HtmlWebpackPlugin({
        title: 'COVIDcast Indicator Source',
        template: './src/index.html',
        filename: 'indicator-source/index.html',
      }),
      new HtmlWebpackPlugin({
        title: 'COVIDcast Indicator Signal',
        template: './src/index.html',
        filename: 'indicator-signal/index.html',
      }),
      new HtmlWebpackPlugin({
        title: 'COVIDcast Dashboard',
        template: './src/index.html',
        filename: 'dashboard/index.html',
      }),
      // new HtmlWebpackPlugin({
      //   title: 'COVIDcast Lab',
      //   template: './src/index.html',
      //   filename: 'lab/index.html',
      // }),
      !devMode &&
        new MiniCssExtractPlugin({
          filename: '[name].[contenthash].css',
          ignoreOrder: true,
          chunkFilename: '[name].[contenthash].css',
        }),
    ].filter(Boolean),
  };
};
