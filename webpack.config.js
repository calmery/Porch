const path = require( 'path' )

const webpack = require( 'webpack' )
const merge = require( 'webpack-merge' )
const CopyWebpackPlugin = require( 'copy-webpack-plugin' )
const nodeExternals = require( 'webpack-node-externals' )
const MinifyPlugin = require( 'babel-minify-webpack-plugin' )

const resolve = filePath => path.resolve( __dirname, filePath )

const common = {
  resolve: {
    extensions: ['.js']
  }
}

const backend = {
  entry: resolve( 'src/entry.js' ),
  output: {
    path: resolve( 'dist' ),
    filename: 'index.js'
  },
  node: {
    __dirname: false,
  },
  plugins: [
    new CopyWebpackPlugin( [
      { from: resolve( 'package.json' ), to: resolve( 'dist/package.json' ) },
    ] )
  ],
  target: 'node',
  externals: [nodeExternals()]
}

const frontend = merge( common, {
  module: {
    rules: [{
      test: /\.elm$/,
      exclude: [/elm-stuff/, /node_modules/],
      use: {
        loader: 'elm-webpack-loader',
        options: {
          verbose: true,
          warn: true
        }
      }
    }, {
      test: /\.html$/,
      exclude: /node_modules/,
      use: [ {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]'
        }
      }, 'extract-loader', {
        loader: 'html-loader',
        options: {
          minimize: true
        }
      } ]
    }, {
      test: /\.css$/,
      loaders: [ 'style-loader', 'css-loader']
    }, {
      test: /\.otf$/,
      exclude: /node_modules/,
      use: [ {
        loader: 'file-loader',
        options: {
          name: 'font/[name].[ext]'
        }
      }]
    }]
  },
  plugins: [
    new MinifyPlugin()
  ]
} )

const conversation = {
  entry: resolve( 'src/public/entry.js' ),
  output: {
    path: resolve( './dist/public/' ),
    filename: 'conversation.js'
  }
}

const index = {
  entry: resolve( 'src/public/entry-index.js' ),
  plugins: [
    new CopyWebpackPlugin( [
      { from: resolve( 'src/public/static/img' ), to: resolve( 'dist/public/img' ) },
    ] )
  ],
  output: {
    path: resolve( './dist/public/' ),
    filename: 'index.js'
  }
}

module.exports = [
  merge( common, backend ),
  merge( merge( common, frontend ), conversation ),
  merge( merge( common, frontend ), index )
]
