const path    = require( 'path' )
const webpack = require( 'webpack' )
const merge   = require( 'webpack-merge' )

const MinifyPlugin      = require( 'babel-minify-webpack-plugin' )
const CopyWebpackPlugin = require( 'copy-webpack-plugin' )

const resolve = source => path.resolve( __dirname, source )

const entryPath = resolve( 'src/entry.js' )

const common = {
  devtool: 'source-map',
  resolve: {
    extensions: ['.js']
  },
  plugins: [new MinifyPlugin()],
  module: {
    loaders: [ {
      test   : /\.js$/,
      exclude: /node_modules/,
      loader : 'babel-loader',
      query  : {
        presets: ["latest"]
      }
    } ]
  }
}

const frontend = {
  entry: entryPath,
  module: {
    rules: [{
      test: /\.(css|scss)$/,
      use: ['style-loader', {
        loader: 'css-loader',
        options: {
          minimize: true
        }
      }, 'sass-loader']
    }]
  },
  plugins: [
    new CopyWebpackPlugin( [
      { from: resolve( './src/index.html' ), to: resolve( './public/index.html' ) },
      { from: resolve( './src/static/img' ), to: resolve( './dist/static/img' ) }
    ] )
  ],
  output: {
    path: resolve( './public/' ),
    filename: 'porch.js'
  }
}

module.exports = [
  merge( common, frontend )
]
