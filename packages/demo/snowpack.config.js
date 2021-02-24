module.exports = {
	workspaceRoot: "../..",
  mount: {
    public: "/",
    src: "/js",
  },
  plugins: [
    "@snowpack/plugin-dotenv",
    "@snowpack/plugin-typescript",
    "@snowpack/plugin-babel",
  ],
  packageOptions: {
    installTypes: true,
  },
  devOptions: {
    "open": "none",
    "hmrErrorOverlay": false,
  },
};
