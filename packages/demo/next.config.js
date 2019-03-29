const withCSS = require("@zeit/next-css");
const withTypescript = require("@zeit/next-typescript");

let config = {};
config = withCSS(config);
config = withTypescript(config);

module.exports = config;
