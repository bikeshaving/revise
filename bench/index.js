const fs = require("fs");
const path = require("path");
const Benchmark = require("benchmark");
const { Suite } = Benchmark;

const sup = require("../lib");

const suite = new Suite();

const readme = fs.readFileSync(path.join(__dirname, "../README.sup"), "utf8");
suite.add("parse#readme", () => {
  sup.parse(readme);
});

suite.on("cycle", (ev) => {
  /* eslint-disable-next-line no-console */
  console.log(String(ev.target));
});

suite.run();
