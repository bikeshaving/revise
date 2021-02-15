module.exports = {
  mount: {
    public: "/",
    src: "/js",
  },
  plugins: [
    "@snowpack/plugin-dotenv",
    "@snowpack/plugin-babel",
    "@snowpack/plugin-typescript",
  ],
  packageOptions: {
    installTypes: true,
  },
  "devOptions": {
    "open": "none",
    "hmrErrorOverlay": false,
  },
};
