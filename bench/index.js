// TODO
const fs = require("fs");
const path = require("path");
const Benchmark = require("benchmark");
const { Suite } = Benchmark;
const suite = new Suite();

suite.add("parse#readme", () => {});

suite.on("cycle", (ev) => {
  /* eslint-disable-next-line no-console */
  console.log(String(ev.target));
});

suite.run();
