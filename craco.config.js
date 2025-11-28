// craco.config.js - Simple configuration for TensorFlow.js compatibility
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix Node.js polyfills for TensorFlow.js
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "fs": false,
        "path": false,
        "crypto": false,
        "stream": false,
        "buffer": false,
        "util": false
      };

      // Ignore source map warnings for TensorFlow.js packages
      webpackConfig.ignoreWarnings = [
        {
          module: /node_modules\/@tensorflow/,
          message: /Failed to parse source map/,
        }
      ];

      return webpackConfig;
    },
  },
};
