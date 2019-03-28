const withCSS = require("@zeit/next-css");
const withTypescript = require("@zeit/next-typescript");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

let config = {
  webpack(config, options) {
    if (options.isServer) {
      config.plugins.push(new ForkTsCheckerWebpackPlugin());
    }
    return config;
  },
};
config = withCSS(config);
config = withTypescript(config);

module.exports = config;
