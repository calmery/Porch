const path    = require( 'path' )
const webpack = require( 'webpack' )
const merge   = require( 'webpack-merge' )

const nodeExternals     = require( 'webpack-node-externals' )
const MinifyPlugin      = require( 'babel-minify-webpack-plugin' )
const CopyWebpackPlugin = require( 'copy-webpack-plugin' )

const resolve = source => path.resolve( __dirname, source )

const serverEntryPath = resolve( 'src/server.js' )
const entryPath       = resolve( 'src/public/entry.js' )

const common = {
  devtool: 'source-map',
  resolve: {
    extensions: ['.js']
  },
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

const backend = {
  entry: serverEntryPath,
  output: {
    path: resolve( './dist' ),
    filename: 'server.js'
  },
  externals: [nodeExternals()],
  node: {
    __dirname: false
  },
  target: 'node'
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
      { from: resolve( './src/public/index.html' ), to: resolve( './dist/public/index.html' ) },
      { from: resolve( './src/public/static/img' ), to: resolve( './dist/public/static/img' ) }
    ] ),
    new MinifyPlugin(),
  ],
  output: {
    path: resolve( './dist/public/' ),
    filename: 'porch.js'
  }
}

module.exports = [
  merge( common, backend ),
  merge( common, frontend )
]
