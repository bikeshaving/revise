#!/usr/bin/env node
const fs = require("fs");
const { Interpreter } = require("../lib/index.js");
const baseExt = require("../lib/rules/base.js");
const htmlExt = require("../lib/rules/html.js");

const interpreter = new Interpreter([baseExt, htmlExt]);

const file = process.argv[2];
if (file) {
  const sup = fs.readFileSync(file, "utf8");
  const { html } = interpreter.interpret(sup);
  console.log(html);
}
