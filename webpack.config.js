const webpack = require('webpack');

const config = {
  entry: [
   'react-hot-loader/patch',
    __dirname  + '/client/reactcl/app.jsx'
  ],
  output: {
    filename: 'bundle2.js',
    path: __dirname+ '/public',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders:['babel-loader?presets[]=es2015,presets[]=stage-1,presets[]=react']
      }
    ]
  }
};

module.exports = config;
