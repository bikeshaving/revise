var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/esbuild-plugins-node-modules-polyfill/globals/process.js
var init_process = __esm({
  "node_modules/esbuild-plugins-node-modules-polyfill/globals/process.js"() {
  }
});

// node_modules/esbuild-plugins-node-modules-polyfill/globals/Buffer.js
var init_Buffer = __esm({
  "node_modules/esbuild-plugins-node-modules-polyfill/globals/Buffer.js"() {
  }
});

// node_modules/@twemoji/parser/dist/lib/regex.js
var require_regex = __commonJS({
  "node_modules/@twemoji/parser/dist/lib/regex.js"(exports) {
    "use strict";
    init_Buffer();
    init_process();
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = /(?:\ud83d\udc68\ud83c\udffb\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc68\ud83c\udffc\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc68\ud83c\udffd\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc68\ud83c\udffe\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc68\ud83c\udfff\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffb\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffb\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc69\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffc\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffc\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc69\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffd\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffd\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc69\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffe\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffe\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc69\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udfff\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udfff\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc69\ud83c[\udffb-\udfff]|\ud83e\uddd1\ud83c\udffb\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83e\uddd1\ud83c[\udffc-\udfff]|\ud83e\uddd1\ud83c\udffc\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83e\uddd1\ud83c[\udffb\udffd-\udfff]|\ud83e\uddd1\ud83c\udffd\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83e\uddd1\ud83c[\udffb\udffc\udffe\udfff]|\ud83e\uddd1\ud83c\udffe\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83e\uddd1\ud83c[\udffb-\udffd\udfff]|\ud83e\uddd1\ud83c\udfff\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83e\uddd1\ud83c[\udffb-\udffe]|\ud83d\udc68\ud83c\udffb\u200d\u2764\ufe0f\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc68\ud83c\udffb\u200d\ud83d\udc30\u200d\ud83d\udc68\ud83c[\udffc-\udfff]|\ud83d\udc68\ud83c\udffb\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffc-\udfff]|\ud83d\udc68\ud83c\udffb\u200d\ud83e\udeef\u200d\ud83d\udc68\ud83c[\udffc-\udfff]|\ud83d\udc68\ud83c\udffc\u200d\u2764\ufe0f\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc68\ud83c\udffc\u200d\ud83d\udc30\u200d\ud83d\udc68\ud83c[\udffb\udffd-\udfff]|\ud83d\udc68\ud83c\udffc\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb\udffd-\udfff]|\ud83d\udc68\ud83c\udffc\u200d\ud83e\udeef\u200d\ud83d\udc68\ud83c[\udffb\udffd-\udfff]|\ud83d\udc68\ud83c\udffd\u200d\u2764\ufe0f\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc68\ud83c\udffd\u200d\ud83d\udc30\u200d\ud83d\udc68\ud83c[\udffb\udffc\udffe\udfff]|\ud83d\udc68\ud83c\udffd\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb\udffc\udffe\udfff]|\ud83d\udc68\ud83c\udffd\u200d\ud83e\udeef\u200d\ud83d\udc68\ud83c[\udffb\udffc\udffe\udfff]|\ud83d\udc68\ud83c\udffe\u200d\u2764\ufe0f\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc68\ud83c\udffe\u200d\ud83d\udc30\u200d\ud83d\udc68\ud83c[\udffb-\udffd\udfff]|\ud83d\udc68\ud83c\udffe\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb-\udffd\udfff]|\ud83d\udc68\ud83c\udffe\u200d\ud83e\udeef\u200d\ud83d\udc68\ud83c[\udffb-\udffd\udfff]|\ud83d\udc68\ud83c\udfff\u200d\u2764\ufe0f\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc68\ud83c\udfff\u200d\ud83d\udc30\u200d\ud83d\udc68\ud83c[\udffb-\udffe]|\ud83d\udc68\ud83c\udfff\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb-\udffe]|\ud83d\udc68\ud83c\udfff\u200d\ud83e\udeef\u200d\ud83d\udc68\ud83c[\udffb-\udffe]|\ud83d\udc69\ud83c\udffb\u200d\u2764\ufe0f\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffb\u200d\u2764\ufe0f\u200d\ud83d\udc69\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffb\u200d\ud83d\udc30\u200d\ud83d\udc69\ud83c[\udffc-\udfff]|\ud83d\udc69\ud83c\udffb\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffc-\udfff]|\ud83d\udc69\ud83c\udffb\u200d\ud83e\udd1d\u200d\ud83d\udc69\ud83c[\udffc-\udfff]|\ud83d\udc69\ud83c\udffb\u200d\ud83e\udeef\u200d\ud83d\udc69\ud83c[\udffc-\udfff]|\ud83d\udc69\ud83c\udffc\u200d\u2764\ufe0f\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffc\u200d\u2764\ufe0f\u200d\ud83d\udc69\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffc\u200d\ud83d\udc30\u200d\ud83d\udc69\ud83c[\udffb\udffd-\udfff]|\ud83d\udc69\ud83c\udffc\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb\udffd-\udfff]|\ud83d\udc69\ud83c\udffc\u200d\ud83e\udd1d\u200d\ud83d\udc69\ud83c[\udffb\udffd-\udfff]|\ud83d\udc69\ud83c\udffc\u200d\ud83e\udeef\u200d\ud83d\udc69\ud83c[\udffb\udffd-\udfff]|\ud83d\udc69\ud83c\udffd\u200d\u2764\ufe0f\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffd\u200d\u2764\ufe0f\u200d\ud83d\udc69\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffd\u200d\ud83d\udc30\u200d\ud83d\udc69\ud83c[\udffb\udffc\udffe\udfff]|\ud83d\udc69\ud83c\udffd\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb\udffc\udffe\udfff]|\ud83d\udc69\ud83c\udffd\u200d\ud83e\udd1d\u200d\ud83d\udc69\ud83c[\udffb\udffc\udffe\udfff]|\ud83d\udc69\ud83c\udffd\u200d\ud83e\udeef\u200d\ud83d\udc69\ud83c[\udffb\udffc\udffe\udfff]|\ud83d\udc69\ud83c\udffe\u200d\u2764\ufe0f\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffe\u200d\u2764\ufe0f\u200d\ud83d\udc69\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udffe\u200d\ud83d\udc30\u200d\ud83d\udc69\ud83c[\udffb-\udffd\udfff]|\ud83d\udc69\ud83c\udffe\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb-\udffd\udfff]|\ud83d\udc69\ud83c\udffe\u200d\ud83e\udd1d\u200d\ud83d\udc69\ud83c[\udffb-\udffd\udfff]|\ud83d\udc69\ud83c\udffe\u200d\ud83e\udeef\u200d\ud83d\udc69\ud83c[\udffb-\udffd\udfff]|\ud83d\udc69\ud83c\udfff\u200d\u2764\ufe0f\u200d\ud83d\udc68\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udfff\u200d\u2764\ufe0f\u200d\ud83d\udc69\ud83c[\udffb-\udfff]|\ud83d\udc69\ud83c\udfff\u200d\ud83d\udc30\u200d\ud83d\udc69\ud83c[\udffb-\udffe]|\ud83d\udc69\ud83c\udfff\u200d\ud83e\udd1d\u200d\ud83d\udc68\ud83c[\udffb-\udffe]|\ud83d\udc69\ud83c\udfff\u200d\ud83e\udd1d\u200d\ud83d\udc69\ud83c[\udffb-\udffe]|\ud83d\udc69\ud83c\udfff\u200d\ud83e\udeef\u200d\ud83d\udc69\ud83c[\udffb-\udffe]|\ud83e\uddd1\ud83c\udffb\u200d\u2764\ufe0f\u200d\ud83e\uddd1\ud83c[\udffc-\udfff]|\ud83e\uddd1\ud83c\udffb\u200d\ud83d\udc30\u200d\ud83e\uddd1\ud83c[\udffc-\udfff]|\ud83e\uddd1\ud83c\udffb\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c[\udffb-\udfff]|\ud83e\uddd1\ud83c\udffb\u200d\ud83e\udeef\u200d\ud83e\uddd1\ud83c[\udffc-\udfff]|\ud83e\uddd1\ud83c\udffc\u200d\u2764\ufe0f\u200d\ud83e\uddd1\ud83c[\udffb\udffd-\udfff]|\ud83e\uddd1\ud83c\udffc\u200d\ud83d\udc30\u200d\ud83e\uddd1\ud83c[\udffb\udffd-\udfff]|\ud83e\uddd1\ud83c\udffc\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c[\udffb-\udfff]|\ud83e\uddd1\ud83c\udffc\u200d\ud83e\udeef\u200d\ud83e\uddd1\ud83c[\udffb\udffd-\udfff]|\ud83e\uddd1\ud83c\udffd\u200d\u2764\ufe0f\u200d\ud83e\uddd1\ud83c[\udffb\udffc\udffe\udfff]|\ud83e\uddd1\ud83c\udffd\u200d\ud83d\udc30\u200d\ud83e\uddd1\ud83c[\udffb\udffc\udffe\udfff]|\ud83e\uddd1\ud83c\udffd\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c[\udffb-\udfff]|\ud83e\uddd1\ud83c\udffd\u200d\ud83e\udeef\u200d\ud83e\uddd1\ud83c[\udffb\udffc\udffe\udfff]|\ud83e\uddd1\ud83c\udffe\u200d\u2764\ufe0f\u200d\ud83e\uddd1\ud83c[\udffb-\udffd\udfff]|\ud83e\uddd1\ud83c\udffe\u200d\ud83d\udc30\u200d\ud83e\uddd1\ud83c[\udffb-\udffd\udfff]|\ud83e\uddd1\ud83c\udffe\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c[\udffb-\udfff]|\ud83e\uddd1\ud83c\udffe\u200d\ud83e\udeef\u200d\ud83e\uddd1\ud83c[\udffb-\udffd\udfff]|\ud83e\uddd1\ud83c\udfff\u200d\u2764\ufe0f\u200d\ud83e\uddd1\ud83c[\udffb-\udffe]|\ud83e\uddd1\ud83c\udfff\u200d\ud83d\udc30\u200d\ud83e\uddd1\ud83c[\udffb-\udffe]|\ud83e\uddd1\ud83c\udfff\u200d\ud83e\udd1d\u200d\ud83e\uddd1\ud83c[\udffb-\udfff]|\ud83e\uddd1\ud83c\udfff\u200d\ud83e\udeef\u200d\ud83e\uddd1\ud83c[\udffb-\udffe]|\ud83d\udc68\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d\udc68|\ud83d\udc69\u200d\u2764\ufe0f\u200d\ud83d\udc8b\u200d\ud83d[\udc68\udc69]|\ud83e\udef1\ud83c\udffb\u200d\ud83e\udef2\ud83c[\udffc-\udfff]|\ud83e\udef1\ud83c\udffc\u200d\ud83e\udef2\ud83c[\udffb\udffd-\udfff]|\ud83e\udef1\ud83c\udffd\u200d\ud83e\udef2\ud83c[\udffb\udffc\udffe\udfff]|\ud83e\udef1\ud83c\udffe\u200d\ud83e\udef2\ud83c[\udffb-\udffd\udfff]|\ud83e\udef1\ud83c\udfff\u200d\ud83e\udef2\ud83c[\udffb-\udffe]|\ud83d\udc68\u200d\u2764\ufe0f\u200d\ud83d\udc68|\ud83d\udc69\u200d\u2764\ufe0f\u200d\ud83d[\udc68\udc69]|\ud83e\uddd1\u200d\ud83e\udd1d\u200d\ud83e\uddd1|\ud83d\udc6f\ud83c\udffb\u200d\u2640\ufe0f|\ud83d\udc6f\ud83c\udffb\u200d\u2642\ufe0f|\ud83d\udc6f\ud83c\udffc\u200d\u2640\ufe0f|\ud83d\udc6f\ud83c\udffc\u200d\u2642\ufe0f|\ud83d\udc6f\ud83c\udffd\u200d\u2640\ufe0f|\ud83d\udc6f\ud83c\udffd\u200d\u2642\ufe0f|\ud83d\udc6f\ud83c\udffe\u200d\u2640\ufe0f|\ud83d\udc6f\ud83c\udffe\u200d\u2642\ufe0f|\ud83d\udc6f\ud83c\udfff\u200d\u2640\ufe0f|\ud83d\udc6f\ud83c\udfff\u200d\u2642\ufe0f|\ud83e\udd3c\ud83c\udffb\u200d\u2640\ufe0f|\ud83e\udd3c\ud83c\udffb\u200d\u2642\ufe0f|\ud83e\udd3c\ud83c\udffc\u200d\u2640\ufe0f|\ud83e\udd3c\ud83c\udffc\u200d\u2642\ufe0f|\ud83e\udd3c\ud83c\udffd\u200d\u2640\ufe0f|\ud83e\udd3c\ud83c\udffd\u200d\u2642\ufe0f|\ud83e\udd3c\ud83c\udffe\u200d\u2640\ufe0f|\ud83e\udd3c\ud83c\udffe\u200d\u2642\ufe0f|\ud83e\udd3c\ud83c\udfff\u200d\u2640\ufe0f|\ud83e\udd3c\ud83c\udfff\u200d\u2642\ufe0f|\ud83d\udc6f\u200d\u2640\ufe0f|\ud83d\udc6f\u200d\u2642\ufe0f|\ud83e\udd3c\u200d\u2640\ufe0f|\ud83e\udd3c\u200d\u2642\ufe0f|\ud83d\udc6b\ud83c[\udffb-\udfff]|\ud83d\udc6c\ud83c[\udffb-\udfff]|\ud83d\udc6d\ud83c[\udffb-\udfff]|\ud83d\udc6f\ud83c[\udffb-\udfff]|\ud83d\udc8f\ud83c[\udffb-\udfff]|\ud83d\udc91\ud83c[\udffb-\udfff]|\ud83e\udd1d\ud83c[\udffb-\udfff]|\ud83e\udd3c\ud83c[\udffb-\udfff]|\ud83d[\udc6b-\udc6d\udc6f\udc8f\udc91]|\ud83e[\udd1d\udd3c])|(?:\ud83d[\udc68\udc69]|\ud83e\uddd1)(?:\ud83c[\udffb-\udfff])?\u200d(?:\u2695\ufe0f|\u2696\ufe0f|\u2708\ufe0f|\ud83c[\udf3e\udf73\udf7c\udf84\udf93\udfa4\udfa8\udfeb\udfed]|\ud83d[\udcbb\udcbc\udd27\udd2c\ude80\ude92]|\ud83e[\uddaf-\uddb3\uddbc\uddbd\ude70])(?:\u200d\u27a1\ufe0f)?|(?:\ud83c[\udfcb\udfcc]|\ud83d[\udd74\udd75]|\u26f9)((?:\ud83c[\udffb-\udfff]|\ufe0f)\u200d[\u2640\u2642]\ufe0f(?:\u200d\u27a1\ufe0f)?)|(?:\ud83c[\udfc3\udfc4\udfca]|\ud83d[\udc6e\udc70\udc71\udc73\udc77\udc81\udc82\udc86\udc87\ude45-\ude47\ude4b\ude4d\ude4e\udea3\udeb4-\udeb6]|\ud83e[\udd26\udd35\udd37-\udd39\udd3d\udd3e\uddb8\uddb9\uddcd-\uddcf\uddd4\uddd6-\udddd])(?:\ud83c[\udffb-\udfff])?\u200d[\u2640\u2642]\ufe0f(?:\u200d\u27a1\ufe0f)?|(?:\ud83d\udc68\u200d\ud83d\udc68\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc68\u200d\ud83d\udc68\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83d\udc69\u200d\ud83d\udc69\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc69\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83e\uddd1\u200d\ud83e\uddd1\u200d\ud83e\uddd2\u200d\ud83e\uddd2|\ud83d\udc68\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc68\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83d\udc68\u200d\ud83d\udc68\u200d\ud83d[\udc66\udc67]|\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d[\udc66\udc67]|\ud83d\udc69\u200d\ud83d\udc66\u200d\ud83d\udc66|\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d[\udc66\udc67]|\ud83d\udc69\u200d\ud83d\udc69\u200d\ud83d[\udc66\udc67]|\ud83e\uddd1\u200d\ud83e\uddd1\u200d\ud83e\uddd2|\ud83e\uddd1\u200d\ud83e\uddd2\u200d\ud83e\uddd2|\ud83c\udff3\ufe0f\u200d\u26a7\ufe0f|\ud83c\udff3\ufe0f\u200d\ud83c\udf08|\ud83d\ude36\u200d\ud83c\udf2b\ufe0f|\u26d3\ufe0f\u200d\ud83d\udca5|\u2764\ufe0f\u200d\ud83d\udd25|\u2764\ufe0f\u200d\ud83e\ude79|\ud83c\udf44\u200d\ud83d\udfeb|\ud83c\udf4b\u200d\ud83d\udfe9|\ud83c\udff4\u200d\u2620\ufe0f|\ud83d\udc15\u200d\ud83e\uddba|\ud83d\udc26\u200d\ud83d\udd25|\ud83d\udc3b\u200d\u2744\ufe0f|\ud83d\udc41\u200d\ud83d\udde8|\ud83d\udc68\u200d\ud83d[\udc66\udc67]|\ud83d\udc69\u200d\ud83d[\udc66\udc67]|\ud83d\ude2e\u200d\ud83d\udca8|\ud83d\ude35\u200d\ud83d\udcab|\ud83d\ude42\u200d\u2194\ufe0f|\ud83d\ude42\u200d\u2195\ufe0f|\ud83e\uddd1\u200d\ud83e\uddd2|\ud83e\uddde\u200d\u2640\ufe0f|\ud83e\uddde\u200d\u2642\ufe0f|\ud83e\udddf\u200d\u2640\ufe0f|\ud83e\udddf\u200d\u2642\ufe0f|\ud83d\udc08\u200d\u2b1b|\ud83d\udc26\u200d\u2b1b)|[#*0-9]\ufe0f?\u20e3|(?:[©®\u2122\u265f]\ufe0f)|(?:\ud83c[\udc04\udd70\udd71\udd7e\udd7f\ude02\ude1a\ude2f\ude37\udf21\udf24-\udf2c\udf36\udf7d\udf96\udf97\udf99-\udf9b\udf9e\udf9f\udfcd\udfce\udfd4-\udfdf\udff3\udff5\udff7]|\ud83d[\udc3f\udc41\udcfd\udd49\udd4a\udd6f\udd70\udd73\udd76-\udd79\udd87\udd8a-\udd8d\udda5\udda8\uddb1\uddb2\uddbc\uddc2-\uddc4\uddd1-\uddd3\udddc-\uddde\udde1\udde3\udde8\uddef\uddf3\uddfa\udecb\udecd-\udecf\udee0-\udee5\udee9\udef0\udef3]|[\u203c\u2049\u2139\u2194-\u2199\u21a9\u21aa\u231a\u231b\u2328\u23cf\u23ed-\u23ef\u23f1\u23f2\u23f8-\u23fa\u24c2\u25aa\u25ab\u25b6\u25c0\u25fb-\u25fe\u2600-\u2604\u260e\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262a\u262e\u262f\u2638-\u263a\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267b\u267f\u2692-\u2697\u2699\u269b\u269c\u26a0\u26a1\u26a7\u26aa\u26ab\u26b0\u26b1\u26bd\u26be\u26c4\u26c5\u26c8\u26cf\u26d1\u26d3\u26d4\u26e9\u26ea\u26f0-\u26f5\u26f8\u26fa\u26fd\u2702\u2708\u2709\u270f\u2712\u2714\u2716\u271d\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u2764\u27a1\u2934\u2935\u2b05-\u2b07\u2b1b\u2b1c\u2b50\u2b55\u3030\u303d\u3297\u3299])(?:\ufe0f|(?!\ufe0e))|(?:(?:\ud83c[\udfcb\udfcc]|\ud83d[\udd74\udd75\udd90]|\ud83e\udef0|[\u261d\u26f7\u26f9\u270c\u270d])(?:\ufe0f|(?!\ufe0e))|(?:\ud83c\udfc3|\ud83d\udeb6|\ud83e\uddce)(?:\ud83c[\udffb-\udfff])?(?:\u200d\u27a1\ufe0f)?|(?:\ud83c[\udf85\udfc2\udfc4\udfc7\udfca]|\ud83d[\udc42\udc43\udc46-\udc50\udc66-\udc69\udc6e\udc70-\udc78\udc7c\udc81-\udc83\udc85-\udc87\udcaa\udd7a\udd95\udd96\ude45-\ude47\ude4b-\ude4f\udea3\udeb4\udeb5\udec0\udecc]|\ud83e[\udd0c\udd0f\udd18-\udd1c\udd1e\udd1f\udd26\udd30-\udd39\udd3d\udd3e\udd77\uddb5\uddb6\uddb8\uddb9\uddbb\uddcd\uddcf\uddd1-\udddd\udec3-\udec5\udef1-\udef8]|[\u270a\u270b]))(?:\ud83c[\udffb-\udfff])?|(?:\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc65\udb40\udc6e\udb40\udc67\udb40\udc7f|\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc73\udb40\udc63\udb40\udc74\udb40\udc7f|\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc77\udb40\udc6c\udb40\udc73\udb40\udc7f|\ud83c\udde6\ud83c[\udde8-\uddec\uddee\uddf1\uddf2\uddf4\uddf6-\uddfa\uddfc\uddfd\uddff]|\ud83c\udde7\ud83c[\udde6\udde7\udde9-\uddef\uddf1-\uddf4\uddf6-\uddf9\uddfb\uddfc\uddfe\uddff]|\ud83c\udde8\ud83c[\udde6\udde8\udde9\uddeb-\uddee\uddf0-\uddf7\uddfa-\uddff]|\ud83c\udde9\ud83c[\uddea\uddec\uddef\uddf0\uddf2\uddf4\uddff]|\ud83c\uddea\ud83c[\udde6\udde8\uddea\uddec\udded\uddf7-\uddfa]|\ud83c\uddeb\ud83c[\uddee-\uddf0\uddf2\uddf4\uddf7]|\ud83c\uddec\ud83c[\udde6\udde7\udde9-\uddee\uddf1-\uddf3\uddf5-\uddfa\uddfc\uddfe]|\ud83c\udded\ud83c[\uddf0\uddf2\uddf3\uddf7\uddf9\uddfa]|\ud83c\uddee\ud83c[\udde8-\uddea\uddf1-\uddf4\uddf6-\uddf9]|\ud83c\uddef\ud83c[\uddea\uddf2\uddf4\uddf5]|\ud83c\uddf0\ud83c[\uddea\uddec-\uddee\uddf2\uddf3\uddf5\uddf7\uddfc\uddfe\uddff]|\ud83c\uddf1\ud83c[\udde6-\udde8\uddee\uddf0\uddf7-\uddfb\uddfe]|\ud83c\uddf2\ud83c[\udde6\udde8-\udded\uddf0-\uddff]|\ud83c\uddf3\ud83c[\udde6\udde8\uddea-\uddec\uddee\uddf1\uddf4\uddf5\uddf7\uddfa\uddff]|\ud83c\uddf4\ud83c\uddf2|\ud83c\uddf5\ud83c[\udde6\uddea-\udded\uddf0-\uddf3\uddf7-\uddf9\uddfc\uddfe]|\ud83c\uddf6\ud83c\udde6|\ud83c\uddf7\ud83c[\uddea\uddf4\uddf8\uddfa\uddfc]|\ud83c\uddf8\ud83c[\udde6-\uddea\uddec-\uddf4\uddf7-\uddf9\uddfb\uddfd-\uddff]|\ud83c\uddf9\ud83c[\udde6\udde8\udde9\uddeb-\udded\uddef-\uddf4\uddf7\uddf9\uddfb\uddfc\uddff]|\ud83c\uddfa\ud83c[\udde6\uddec\uddf2\uddf3\uddf8\uddfe\uddff]|\ud83c\uddfb\ud83c[\udde6\udde8\uddea\uddec\uddee\uddf3\uddfa]|\ud83c\uddfc\ud83c[\uddeb\uddf8]|\ud83c\uddfd\ud83c\uddf0|\ud83c\uddfe\ud83c[\uddea\uddf9]|\ud83c\uddff\ud83c[\udde6\uddf2\uddfc]|\ud83c[\udccf\udd8e\udd91-\udd9a\udde6-\uddff\ude01\ude32-\ude36\ude38-\ude3a\ude50\ude51\udf00-\udf20\udf2d-\udf35\udf37-\udf7c\udf7e-\udf84\udf86-\udf93\udfa0-\udfc1\udfc5\udfc6\udfc8\udfc9\udfcf-\udfd3\udfe0-\udff0\udff4\udff8-\udfff]|\ud83d[\udc00-\udc3e\udc40\udc44\udc45\udc51-\udc65\udc6a\udc79-\udc7b\udc7d-\udc80\udc84\udc88-\udc8e\udc90\udc92-\udca9\udcab-\udcfc\udcff-\udd3d\udd4b-\udd4e\udd50-\udd67\udda4\uddfb-\ude44\ude48-\ude4a\ude80-\udea2\udea4-\udeb3\udeb7-\udebf\udec1-\udec5\uded0-\uded2\uded5-\uded8\udedc-\udedf\udeeb\udeec\udef4-\udefc\udfe0-\udfeb\udff0]|\ud83e[\udd0d\udd0e\udd10-\udd17\udd20-\udd25\udd27-\udd2f\udd3a\udd3f-\udd45\udd47-\udd76\udd78-\uddb4\uddb7\uddba\uddbc-\uddcc\uddd0\uddde-\uddff\ude70-\ude7c\ude80-\ude8a\ude8e-\udec2\udec6\udec8\udecd-\udedc\udedf-\udeea\udeef]|[\u23e9-\u23ec\u23f0\u23f3\u267e\u26ce\u2705\u2728\u274c\u274e\u2753-\u2755\u2795-\u2797\u27b0\u27bf\ue50a])|\ufe0f/g;
  }
});

// node_modules/@twemoji/parser/dist/index.js
var require_dist = __commonJS({
  "node_modules/@twemoji/parser/dist/index.js"(exports) {
    "use strict";
    init_Buffer();
    init_process();
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.TypeName = void 0;
    exports.parse = parse;
    exports.toCodePoints = toCodePoints;
    var _regex = require_regex();
    var _regex2 = _interopRequireDefault(_regex);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    var TypeName = exports.TypeName = "emoji";
    function parse(text, options) {
      var assetType = options && options.assetType ? options.assetType : "svg";
      var getTwemojiUrl = options && options.buildUrl ? options.buildUrl : function(codepoints2, assetType2) {
        return assetType2 === "png" ? "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72/" + codepoints2 + ".png" : "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/" + codepoints2 + ".svg";
      };
      var entities = [];
      _regex2.default.lastIndex = 0;
      while (true) {
        var result = _regex2.default.exec(text);
        if (!result) {
          break;
        }
        var emojiText = result[0];
        var codepoints = toCodePoints(removeVS16s(emojiText)).join("-");
        entities.push({
          url: codepoints ? getTwemojiUrl(codepoints, assetType) : "",
          indices: [result.index, _regex2.default.lastIndex],
          text: emojiText,
          type: TypeName
        });
      }
      return entities;
    }
    var vs16RegExp = /\uFE0F/g;
    var zeroWidthJoiner = String.fromCharCode(8205);
    var removeVS16s = function removeVS16s2(rawEmoji) {
      return rawEmoji.indexOf(zeroWidthJoiner) < 0 ? rawEmoji.replace(vs16RegExp, "") : rawEmoji;
    };
    function toCodePoints(unicodeSurrogates) {
      var points = [];
      var char = 0;
      var previous = 0;
      var i = 0;
      while (i < unicodeSurrogates.length) {
        char = unicodeSurrogates.charCodeAt(i++);
        if (previous) {
          points.push((65536 + (previous - 55296 << 10) + (char - 56320)).toString(16));
          previous = 0;
        } else if (char > 55296 && char <= 56319) {
          previous = char;
        } else {
          points.push(char.toString(16));
        }
      }
      return points;
    }
  }
});

// node_modules/prismjs/prism.js
var require_prism = __commonJS({
  "node_modules/prismjs/prism.js"(exports, module) {
    init_Buffer();
    init_process();
    var _self = typeof window !== "undefined" ? window : typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope ? self : {};
    var Prism3 = (function(_self2) {
      var lang = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
      var uniqueId = 0;
      var plainTextGrammar = {};
      var _ = {
        /**
         * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
         * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
         * additional languages or plugins yourself.
         *
         * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
         *
         * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
         * empty Prism object into the global scope before loading the Prism script like this:
         *
         * ```js
         * window.Prism = window.Prism || {};
         * Prism.manual = true;
         * // add a new <script> to load Prism's script
         * ```
         *
         * @default false
         * @type {boolean}
         * @memberof Prism
         * @public
         */
        manual: _self2.Prism && _self2.Prism.manual,
        /**
         * By default, if Prism is in a web worker, it assumes that it is in a worker it created itself, so it uses
         * `addEventListener` to communicate with its parent instance. However, if you're using Prism manually in your
         * own worker, you don't want it to do this.
         *
         * By setting this value to `true`, Prism will not add its own listeners to the worker.
         *
         * You obviously have to change this value before Prism executes. To do this, you can add an
         * empty Prism object into the global scope before loading the Prism script like this:
         *
         * ```js
         * window.Prism = window.Prism || {};
         * Prism.disableWorkerMessageHandler = true;
         * // Load Prism's script
         * ```
         *
         * @default false
         * @type {boolean}
         * @memberof Prism
         * @public
         */
        disableWorkerMessageHandler: _self2.Prism && _self2.Prism.disableWorkerMessageHandler,
        /**
         * A namespace for utility methods.
         *
         * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
         * change or disappear at any time.
         *
         * @namespace
         * @memberof Prism
         */
        util: {
          encode: function encode(tokens) {
            if (tokens instanceof Token) {
              return new Token(tokens.type, encode(tokens.content), tokens.alias);
            } else if (Array.isArray(tokens)) {
              return tokens.map(encode);
            } else {
              return tokens.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ");
            }
          },
          /**
           * Returns the name of the type of the given value.
           *
           * @param {any} o
           * @returns {string}
           * @example
           * type(null)      === 'Null'
           * type(undefined) === 'Undefined'
           * type(123)       === 'Number'
           * type('foo')     === 'String'
           * type(true)      === 'Boolean'
           * type([1, 2])    === 'Array'
           * type({})        === 'Object'
           * type(String)    === 'Function'
           * type(/abc+/)    === 'RegExp'
           */
          type: function(o) {
            return Object.prototype.toString.call(o).slice(8, -1);
          },
          /**
           * Returns a unique number for the given object. Later calls will still return the same number.
           *
           * @param {Object} obj
           * @returns {number}
           */
          objId: function(obj) {
            if (!obj["__id"]) {
              Object.defineProperty(obj, "__id", { value: ++uniqueId });
            }
            return obj["__id"];
          },
          /**
           * Creates a deep clone of the given object.
           *
           * The main intended use of this function is to clone language definitions.
           *
           * @param {T} o
           * @param {Record<number, any>} [visited]
           * @returns {T}
           * @template T
           */
          clone: function deepClone(o, visited) {
            visited = visited || {};
            var clone;
            var id;
            switch (_.util.type(o)) {
              case "Object":
                id = _.util.objId(o);
                if (visited[id]) {
                  return visited[id];
                }
                clone = /** @type {Record<string, any>} */
                {};
                visited[id] = clone;
                for (var key in o) {
                  if (o.hasOwnProperty(key)) {
                    clone[key] = deepClone(o[key], visited);
                  }
                }
                return (
                  /** @type {any} */
                  clone
                );
              case "Array":
                id = _.util.objId(o);
                if (visited[id]) {
                  return visited[id];
                }
                clone = [];
                visited[id] = clone;
                /** @type {Array} */
                /** @type {any} */
                o.forEach(function(v, i) {
                  clone[i] = deepClone(v, visited);
                });
                return (
                  /** @type {any} */
                  clone
                );
              default:
                return o;
            }
          },
          /**
           * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
           *
           * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
           *
           * @param {Element} element
           * @returns {string}
           */
          getLanguage: function(element) {
            while (element) {
              var m = lang.exec(element.className);
              if (m) {
                return m[1].toLowerCase();
              }
              element = element.parentElement;
            }
            return "none";
          },
          /**
           * Sets the Prism `language-xxxx` class of the given element.
           *
           * @param {Element} element
           * @param {string} language
           * @returns {void}
           */
          setLanguage: function(element, language) {
            element.className = element.className.replace(RegExp(lang, "gi"), "");
            element.classList.add("language-" + language);
          },
          /**
           * Returns the script element that is currently executing.
           *
           * This does __not__ work for line script element.
           *
           * @returns {HTMLScriptElement | null}
           */
          currentScript: function() {
            if (typeof document === "undefined") {
              return null;
            }
            if (document.currentScript && document.currentScript.tagName === "SCRIPT" && 1 < 2) {
              return (
                /** @type {any} */
                document.currentScript
              );
            }
            try {
              throw new Error();
            } catch (err) {
              var src = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(err.stack) || [])[1];
              if (src) {
                var scripts = document.getElementsByTagName("script");
                for (var i in scripts) {
                  if (scripts[i].src == src) {
                    return scripts[i];
                  }
                }
              }
              return null;
            }
          },
          /**
           * Returns whether a given class is active for `element`.
           *
           * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
           * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
           * given class is just the given class with a `no-` prefix.
           *
           * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
           * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
           * ancestors have the given class or the negated version of it, then the default activation will be returned.
           *
           * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
           * version of it, the class is considered active.
           *
           * @param {Element} element
           * @param {string} className
           * @param {boolean} [defaultActivation=false]
           * @returns {boolean}
           */
          isActive: function(element, className, defaultActivation) {
            var no = "no-" + className;
            while (element) {
              var classList = element.classList;
              if (classList.contains(className)) {
                return true;
              }
              if (classList.contains(no)) {
                return false;
              }
              element = element.parentElement;
            }
            return !!defaultActivation;
          }
        },
        /**
         * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
         *
         * @namespace
         * @memberof Prism
         * @public
         */
        languages: {
          /**
           * The grammar for plain, unformatted text.
           */
          plain: plainTextGrammar,
          plaintext: plainTextGrammar,
          text: plainTextGrammar,
          txt: plainTextGrammar,
          /**
           * Creates a deep copy of the language with the given id and appends the given tokens.
           *
           * If a token in `redef` also appears in the copied language, then the existing token in the copied language
           * will be overwritten at its original position.
           *
           * ## Best practices
           *
           * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
           * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
           * understand the language definition because, normally, the order of tokens matters in Prism grammars.
           *
           * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
           * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
           *
           * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
           * @param {Grammar} redef The new tokens to append.
           * @returns {Grammar} The new language created.
           * @public
           * @example
           * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
           *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
           *     // at its original position
           *     'comment': { ... },
           *     // CSS doesn't have a 'color' token, so this token will be appended
           *     'color': /\b(?:red|green|blue)\b/
           * });
           */
          extend: function(id, redef) {
            var lang2 = _.util.clone(_.languages[id]);
            for (var key in redef) {
              lang2[key] = redef[key];
            }
            return lang2;
          },
          /**
           * Inserts tokens _before_ another token in a language definition or any other grammar.
           *
           * ## Usage
           *
           * This helper method makes it easy to modify existing languages. For example, the CSS language definition
           * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
           * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
           * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
           * this:
           *
           * ```js
           * Prism.languages.markup.style = {
           *     // token
           * };
           * ```
           *
           * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
           * before existing tokens. For the CSS example above, you would use it like this:
           *
           * ```js
           * Prism.languages.insertBefore('markup', 'cdata', {
           *     'style': {
           *         // token
           *     }
           * });
           * ```
           *
           * ## Special cases
           *
           * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
           * will be ignored.
           *
           * This behavior can be used to insert tokens after `before`:
           *
           * ```js
           * Prism.languages.insertBefore('markup', 'comment', {
           *     'comment': Prism.languages.markup.comment,
           *     // tokens after 'comment'
           * });
           * ```
           *
           * ## Limitations
           *
           * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
           * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
           * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
           * deleting properties which is necessary to insert at arbitrary positions.
           *
           * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
           * Instead, it will create a new object and replace all references to the target object with the new one. This
           * can be done without temporarily deleting properties, so the iteration order is well-defined.
           *
           * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
           * you hold the target object in a variable, then the value of the variable will not change.
           *
           * ```js
           * var oldMarkup = Prism.languages.markup;
           * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
           *
           * assert(oldMarkup !== Prism.languages.markup);
           * assert(newMarkup === Prism.languages.markup);
           * ```
           *
           * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
           * object to be modified.
           * @param {string} before The key to insert before.
           * @param {Grammar} insert An object containing the key-value pairs to be inserted.
           * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
           * object to be modified.
           *
           * Defaults to `Prism.languages`.
           * @returns {Grammar} The new grammar object.
           * @public
           */
          insertBefore: function(inside, before, insert, root) {
            root = root || /** @type {any} */
            _.languages;
            var grammar = root[inside];
            var ret = {};
            for (var token in grammar) {
              if (grammar.hasOwnProperty(token)) {
                if (token == before) {
                  for (var newToken in insert) {
                    if (insert.hasOwnProperty(newToken)) {
                      ret[newToken] = insert[newToken];
                    }
                  }
                }
                if (!insert.hasOwnProperty(token)) {
                  ret[token] = grammar[token];
                }
              }
            }
            var old = root[inside];
            root[inside] = ret;
            _.languages.DFS(_.languages, function(key, value) {
              if (value === old && key != inside) {
                this[key] = ret;
              }
            });
            return ret;
          },
          // Traverse a language definition with Depth First Search
          DFS: function DFS(o, callback, type, visited) {
            visited = visited || {};
            var objId = _.util.objId;
            for (var i in o) {
              if (o.hasOwnProperty(i)) {
                callback.call(o, i, o[i], type || i);
                var property = o[i];
                var propertyType = _.util.type(property);
                if (propertyType === "Object" && !visited[objId(property)]) {
                  visited[objId(property)] = true;
                  DFS(property, callback, null, visited);
                } else if (propertyType === "Array" && !visited[objId(property)]) {
                  visited[objId(property)] = true;
                  DFS(property, callback, i, visited);
                }
              }
            }
          }
        },
        plugins: {},
        /**
         * This is the most high-level function in Prism’s API.
         * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
         * each one of them.
         *
         * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
         *
         * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
         * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
         * @memberof Prism
         * @public
         */
        highlightAll: function(async, callback) {
          _.highlightAllUnder(document, async, callback);
        },
        /**
         * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
         * {@link Prism.highlightElement} on each one of them.
         *
         * The following hooks will be run:
         * 1. `before-highlightall`
         * 2. `before-all-elements-highlight`
         * 3. All hooks of {@link Prism.highlightElement} for each element.
         *
         * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
         * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
         * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
         * @memberof Prism
         * @public
         */
        highlightAllUnder: function(container, async, callback) {
          var env = {
            callback,
            container,
            selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
          };
          _.hooks.run("before-highlightall", env);
          env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));
          _.hooks.run("before-all-elements-highlight", env);
          for (var i = 0, element; element = env.elements[i++]; ) {
            _.highlightElement(element, async === true, env.callback);
          }
        },
        /**
         * Highlights the code inside a single element.
         *
         * The following hooks will be run:
         * 1. `before-sanity-check`
         * 2. `before-highlight`
         * 3. All hooks of {@link Prism.highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
         * 4. `before-insert`
         * 5. `after-highlight`
         * 6. `complete`
         *
         * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
         * the element's language.
         *
         * @param {Element} element The element containing the code.
         * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
         * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
         * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
         * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
         *
         * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
         * asynchronous highlighting to work. You can build your own bundle on the
         * [Download page](https://prismjs.com/download.html).
         * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
         * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
         * @memberof Prism
         * @public
         */
        highlightElement: function(element, async, callback) {
          var language = _.util.getLanguage(element);
          var grammar = _.languages[language];
          _.util.setLanguage(element, language);
          var parent = element.parentElement;
          if (parent && parent.nodeName.toLowerCase() === "pre") {
            _.util.setLanguage(parent, language);
          }
          var code = element.textContent;
          var env = {
            element,
            language,
            grammar,
            code
          };
          function insertHighlightedCode(highlightedCode) {
            env.highlightedCode = highlightedCode;
            _.hooks.run("before-insert", env);
            env.element.innerHTML = env.highlightedCode;
            _.hooks.run("after-highlight", env);
            _.hooks.run("complete", env);
            callback && callback.call(env.element);
          }
          _.hooks.run("before-sanity-check", env);
          parent = env.element.parentElement;
          if (parent && parent.nodeName.toLowerCase() === "pre" && !parent.hasAttribute("tabindex")) {
            parent.setAttribute("tabindex", "0");
          }
          if (!env.code) {
            _.hooks.run("complete", env);
            callback && callback.call(env.element);
            return;
          }
          _.hooks.run("before-highlight", env);
          if (!env.grammar) {
            insertHighlightedCode(_.util.encode(env.code));
            return;
          }
          if (async && _self2.Worker) {
            var worker = new Worker(_.filename);
            worker.onmessage = function(evt) {
              insertHighlightedCode(evt.data);
            };
            worker.postMessage(JSON.stringify({
              language: env.language,
              code: env.code,
              immediateClose: true
            }));
          } else {
            insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
          }
        },
        /**
         * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
         * and the language definitions to use, and returns a string with the HTML produced.
         *
         * The following hooks will be run:
         * 1. `before-tokenize`
         * 2. `after-tokenize`
         * 3. `wrap`: On each {@link Token}.
         *
         * @param {string} text A string with the code to be highlighted.
         * @param {Grammar} grammar An object containing the tokens to use.
         *
         * Usually a language definition like `Prism.languages.markup`.
         * @param {string} language The name of the language definition passed to `grammar`.
         * @returns {string} The highlighted HTML.
         * @memberof Prism
         * @public
         * @example
         * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
         */
        highlight: function(text, grammar, language) {
          var env = {
            code: text,
            grammar,
            language
          };
          _.hooks.run("before-tokenize", env);
          if (!env.grammar) {
            throw new Error('The language "' + env.language + '" has no grammar.');
          }
          env.tokens = _.tokenize(env.code, env.grammar);
          _.hooks.run("after-tokenize", env);
          return Token.stringify(_.util.encode(env.tokens), env.language);
        },
        /**
         * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
         * and the language definitions to use, and returns an array with the tokenized code.
         *
         * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
         *
         * This method could be useful in other contexts as well, as a very crude parser.
         *
         * @param {string} text A string with the code to be highlighted.
         * @param {Grammar} grammar An object containing the tokens to use.
         *
         * Usually a language definition like `Prism.languages.markup`.
         * @returns {TokenStream} An array of strings and tokens, a token stream.
         * @memberof Prism
         * @public
         * @example
         * let code = `var foo = 0;`;
         * let tokens = Prism.tokenize(code, Prism.languages.javascript);
         * tokens.forEach(token => {
         *     if (token instanceof Prism.Token && token.type === 'number') {
         *         console.log(`Found numeric literal: ${token.content}`);
         *     }
         * });
         */
        tokenize: function(text, grammar) {
          var rest = grammar.rest;
          if (rest) {
            for (var token in rest) {
              grammar[token] = rest[token];
            }
            delete grammar.rest;
          }
          var tokenList = new LinkedList();
          addAfter(tokenList, tokenList.head, text);
          matchGrammar(text, tokenList, grammar, tokenList.head, 0);
          return toArray(tokenList);
        },
        /**
         * @namespace
         * @memberof Prism
         * @public
         */
        hooks: {
          all: {},
          /**
           * Adds the given callback to the list of callbacks for the given hook.
           *
           * The callback will be invoked when the hook it is registered for is run.
           * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
           *
           * One callback function can be registered to multiple hooks and the same hook multiple times.
           *
           * @param {string} name The name of the hook.
           * @param {HookCallback} callback The callback function which is given environment variables.
           * @public
           */
          add: function(name, callback) {
            var hooks = _.hooks.all;
            hooks[name] = hooks[name] || [];
            hooks[name].push(callback);
          },
          /**
           * Runs a hook invoking all registered callbacks with the given environment variables.
           *
           * Callbacks will be invoked synchronously and in the order in which they were registered.
           *
           * @param {string} name The name of the hook.
           * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
           * @public
           */
          run: function(name, env) {
            var callbacks = _.hooks.all[name];
            if (!callbacks || !callbacks.length) {
              return;
            }
            for (var i = 0, callback; callback = callbacks[i++]; ) {
              callback(env);
            }
          }
        },
        Token
      };
      _self2.Prism = _;
      function Token(type, content, alias, matchedStr) {
        this.type = type;
        this.content = content;
        this.alias = alias;
        this.length = (matchedStr || "").length | 0;
      }
      Token.stringify = function stringify(o, language) {
        if (typeof o == "string") {
          return o;
        }
        if (Array.isArray(o)) {
          var s = "";
          o.forEach(function(e) {
            s += stringify(e, language);
          });
          return s;
        }
        var env = {
          type: o.type,
          content: stringify(o.content, language),
          tag: "span",
          classes: ["token", o.type],
          attributes: {},
          language
        };
        var aliases = o.alias;
        if (aliases) {
          if (Array.isArray(aliases)) {
            Array.prototype.push.apply(env.classes, aliases);
          } else {
            env.classes.push(aliases);
          }
        }
        _.hooks.run("wrap", env);
        var attributes = "";
        for (var name in env.attributes) {
          attributes += " " + name + '="' + (env.attributes[name] || "").replace(/"/g, "&quot;") + '"';
        }
        return "<" + env.tag + ' class="' + env.classes.join(" ") + '"' + attributes + ">" + env.content + "</" + env.tag + ">";
      };
      function matchPattern(pattern, pos, text, lookbehind) {
        pattern.lastIndex = pos;
        var match = pattern.exec(text);
        if (match && lookbehind && match[1]) {
          var lookbehindLength = match[1].length;
          match.index += lookbehindLength;
          match[0] = match[0].slice(lookbehindLength);
        }
        return match;
      }
      function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
        for (var token in grammar) {
          if (!grammar.hasOwnProperty(token) || !grammar[token]) {
            continue;
          }
          var patterns = grammar[token];
          patterns = Array.isArray(patterns) ? patterns : [patterns];
          for (var j = 0; j < patterns.length; ++j) {
            if (rematch && rematch.cause == token + "," + j) {
              return;
            }
            var patternObj = patterns[j];
            var inside = patternObj.inside;
            var lookbehind = !!patternObj.lookbehind;
            var greedy = !!patternObj.greedy;
            var alias = patternObj.alias;
            if (greedy && !patternObj.pattern.global) {
              var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
              patternObj.pattern = RegExp(patternObj.pattern.source, flags + "g");
            }
            var pattern = patternObj.pattern || patternObj;
            for (var currentNode = startNode.next, pos = startPos; currentNode !== tokenList.tail; pos += currentNode.value.length, currentNode = currentNode.next) {
              if (rematch && pos >= rematch.reach) {
                break;
              }
              var str = currentNode.value;
              if (tokenList.length > text.length) {
                return;
              }
              if (str instanceof Token) {
                continue;
              }
              var removeCount = 1;
              var match;
              if (greedy) {
                match = matchPattern(pattern, pos, text, lookbehind);
                if (!match || match.index >= text.length) {
                  break;
                }
                var from = match.index;
                var to = match.index + match[0].length;
                var p = pos;
                p += currentNode.value.length;
                while (from >= p) {
                  currentNode = currentNode.next;
                  p += currentNode.value.length;
                }
                p -= currentNode.value.length;
                pos = p;
                if (currentNode.value instanceof Token) {
                  continue;
                }
                for (var k = currentNode; k !== tokenList.tail && (p < to || typeof k.value === "string"); k = k.next) {
                  removeCount++;
                  p += k.value.length;
                }
                removeCount--;
                str = text.slice(pos, p);
                match.index -= pos;
              } else {
                match = matchPattern(pattern, 0, str, lookbehind);
                if (!match) {
                  continue;
                }
              }
              var from = match.index;
              var matchStr = match[0];
              var before = str.slice(0, from);
              var after = str.slice(from + matchStr.length);
              var reach = pos + str.length;
              if (rematch && reach > rematch.reach) {
                rematch.reach = reach;
              }
              var removeFrom = currentNode.prev;
              if (before) {
                removeFrom = addAfter(tokenList, removeFrom, before);
                pos += before.length;
              }
              removeRange(tokenList, removeFrom, removeCount);
              var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
              currentNode = addAfter(tokenList, removeFrom, wrapped);
              if (after) {
                addAfter(tokenList, currentNode, after);
              }
              if (removeCount > 1) {
                var nestedRematch = {
                  cause: token + "," + j,
                  reach
                };
                matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);
                if (rematch && nestedRematch.reach > rematch.reach) {
                  rematch.reach = nestedRematch.reach;
                }
              }
            }
          }
        }
      }
      function LinkedList() {
        var head = { value: null, prev: null, next: null };
        var tail = { value: null, prev: head, next: null };
        head.next = tail;
        this.head = head;
        this.tail = tail;
        this.length = 0;
      }
      function addAfter(list, node, value) {
        var next = node.next;
        var newNode = { value, prev: node, next };
        node.next = newNode;
        next.prev = newNode;
        list.length++;
        return newNode;
      }
      function removeRange(list, node, count) {
        var next = node.next;
        for (var i = 0; i < count && next !== list.tail; i++) {
          next = next.next;
        }
        node.next = next;
        next.prev = node;
        list.length -= i;
      }
      function toArray(list) {
        var array = [];
        var node = list.head.next;
        while (node !== list.tail) {
          array.push(node.value);
          node = node.next;
        }
        return array;
      }
      if (!_self2.document) {
        if (!_self2.addEventListener) {
          return _;
        }
        if (!_.disableWorkerMessageHandler) {
          _self2.addEventListener("message", function(evt) {
            var message = JSON.parse(evt.data);
            var lang2 = message.language;
            var code = message.code;
            var immediateClose = message.immediateClose;
            _self2.postMessage(_.highlight(code, _.languages[lang2], lang2));
            if (immediateClose) {
              _self2.close();
            }
          }, false);
        }
        return _;
      }
      var script = _.util.currentScript();
      if (script) {
        _.filename = script.src;
        if (script.hasAttribute("data-manual")) {
          _.manual = true;
        }
      }
      function highlightAutomaticallyCallback() {
        if (!_.manual) {
          _.highlightAll();
        }
      }
      if (!_.manual) {
        var readyState = document.readyState;
        if (readyState === "loading" || readyState === "interactive" && script && script.defer) {
          document.addEventListener("DOMContentLoaded", highlightAutomaticallyCallback);
        } else {
          if (window.requestAnimationFrame) {
            window.requestAnimationFrame(highlightAutomaticallyCallback);
          } else {
            window.setTimeout(highlightAutomaticallyCallback, 16);
          }
        }
      }
      return _;
    })(_self);
    if (typeof module !== "undefined" && module.exports) {
      module.exports = Prism3;
    }
    if (typeof globalThis !== "undefined") {
      globalThis.Prism = Prism3;
    }
    Prism3.languages.markup = {
      "comment": {
        pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
        greedy: true
      },
      "prolog": {
        pattern: /<\?[\s\S]+?\?>/,
        greedy: true
      },
      "doctype": {
        // https://www.w3.org/TR/xml/#NT-doctypedecl
        pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
        greedy: true,
        inside: {
          "internal-subset": {
            pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
            lookbehind: true,
            greedy: true,
            inside: null
            // see below
          },
          "string": {
            pattern: /"[^"]*"|'[^']*'/,
            greedy: true
          },
          "punctuation": /^<!|>$|[[\]]/,
          "doctype-tag": /^DOCTYPE/i,
          "name": /[^\s<>'"]+/
        }
      },
      "cdata": {
        pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
        greedy: true
      },
      "tag": {
        pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
        greedy: true,
        inside: {
          "tag": {
            pattern: /^<\/?[^\s>\/]+/,
            inside: {
              "punctuation": /^<\/?/,
              "namespace": /^[^\s>\/:]+:/
            }
          },
          "special-attr": [],
          "attr-value": {
            pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
            inside: {
              "punctuation": [
                {
                  pattern: /^=/,
                  alias: "attr-equals"
                },
                {
                  pattern: /^(\s*)["']|["']$/,
                  lookbehind: true
                }
              ]
            }
          },
          "punctuation": /\/?>/,
          "attr-name": {
            pattern: /[^\s>\/]+/,
            inside: {
              "namespace": /^[^\s>\/:]+:/
            }
          }
        }
      },
      "entity": [
        {
          pattern: /&[\da-z]{1,8};/i,
          alias: "named-entity"
        },
        /&#x?[\da-f]{1,8};/i
      ]
    };
    Prism3.languages.markup["tag"].inside["attr-value"].inside["entity"] = Prism3.languages.markup["entity"];
    Prism3.languages.markup["doctype"].inside["internal-subset"].inside = Prism3.languages.markup;
    Prism3.hooks.add("wrap", function(env) {
      if (env.type === "entity") {
        env.attributes["title"] = env.content.replace(/&amp;/, "&");
      }
    });
    Object.defineProperty(Prism3.languages.markup.tag, "addInlined", {
      /**
       * Adds an inlined language to markup.
       *
       * An example of an inlined language is CSS with `<style>` tags.
       *
       * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
       * case insensitive.
       * @param {string} lang The language key.
       * @example
       * addInlined('style', 'css');
       */
      value: function addInlined2(tagName, lang) {
        var includedCdataInside = {};
        includedCdataInside["language-" + lang] = {
          pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
          lookbehind: true,
          inside: Prism3.languages[lang]
        };
        includedCdataInside["cdata"] = /^<!\[CDATA\[|\]\]>$/i;
        var inside = {
          "included-cdata": {
            pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
            inside: includedCdataInside
          }
        };
        inside["language-" + lang] = {
          pattern: /[\s\S]+/,
          inside: Prism3.languages[lang]
        };
        var def = {};
        def[tagName] = {
          pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function() {
            return tagName;
          }), "i"),
          lookbehind: true,
          greedy: true,
          inside
        };
        Prism3.languages.insertBefore("markup", "cdata", def);
      }
    });
    Object.defineProperty(Prism3.languages.markup.tag, "addAttribute", {
      /**
       * Adds an pattern to highlight languages embedded in HTML attributes.
       *
       * An example of an inlined language is CSS with `style` attributes.
       *
       * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
       * case insensitive.
       * @param {string} lang The language key.
       * @example
       * addAttribute('style', 'css');
       */
      value: function(attrName, lang) {
        Prism3.languages.markup.tag.inside["special-attr"].push({
          pattern: RegExp(
            /(^|["'\s])/.source + "(?:" + attrName + ")" + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
            "i"
          ),
          lookbehind: true,
          inside: {
            "attr-name": /^[^\s=]+/,
            "attr-value": {
              pattern: /=[\s\S]+/,
              inside: {
                "value": {
                  pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                  lookbehind: true,
                  alias: [lang, "language-" + lang],
                  inside: Prism3.languages[lang]
                },
                "punctuation": [
                  {
                    pattern: /^=/,
                    alias: "attr-equals"
                  },
                  /"|'/
                ]
              }
            }
          }
        });
      }
    });
    Prism3.languages.html = Prism3.languages.markup;
    Prism3.languages.mathml = Prism3.languages.markup;
    Prism3.languages.svg = Prism3.languages.markup;
    Prism3.languages.xml = Prism3.languages.extend("markup", {});
    Prism3.languages.ssml = Prism3.languages.xml;
    Prism3.languages.atom = Prism3.languages.xml;
    Prism3.languages.rss = Prism3.languages.xml;
    (function(Prism4) {
      var string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
      Prism4.languages.css = {
        "comment": /\/\*[\s\S]*?\*\//,
        "atrule": {
          pattern: RegExp("@[\\w-](?:" + /[^;{\s"']|\s+(?!\s)/.source + "|" + string.source + ")*?" + /(?:;|(?=\s*\{))/.source),
          inside: {
            "rule": /^@[\w-]+/,
            "selector-function-argument": {
              pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
              lookbehind: true,
              alias: "selector"
            },
            "keyword": {
              pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
              lookbehind: true
            }
            // See rest below
          }
        },
        "url": {
          // https://drafts.csswg.org/css-values-3/#urls
          pattern: RegExp("\\burl\\((?:" + string.source + "|" + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ")\\)", "i"),
          greedy: true,
          inside: {
            "function": /^url/i,
            "punctuation": /^\(|\)$/,
            "string": {
              pattern: RegExp("^" + string.source + "$"),
              alias: "url"
            }
          }
        },
        "selector": {
          pattern: RegExp(`(^|[{}\\s])[^{}\\s](?:[^{};"'\\s]|\\s+(?![\\s{])|` + string.source + ")*(?=\\s*\\{)"),
          lookbehind: true
        },
        "string": {
          pattern: string,
          greedy: true
        },
        "property": {
          pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
          lookbehind: true
        },
        "important": /!important\b/i,
        "function": {
          pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
          lookbehind: true
        },
        "punctuation": /[(){};:,]/
      };
      Prism4.languages.css["atrule"].inside.rest = Prism4.languages.css;
      var markup = Prism4.languages.markup;
      if (markup) {
        markup.tag.addInlined("style", "css");
        markup.tag.addAttribute("style", "css");
      }
    })(Prism3);
    Prism3.languages.clike = {
      "comment": [
        {
          pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
          lookbehind: true,
          greedy: true
        },
        {
          pattern: /(^|[^\\:])\/\/.*/,
          lookbehind: true,
          greedy: true
        }
      ],
      "string": {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true
      },
      "class-name": {
        pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
        lookbehind: true,
        inside: {
          "punctuation": /[.\\]/
        }
      },
      "keyword": /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
      "boolean": /\b(?:false|true)\b/,
      "function": /\b\w+(?=\()/,
      "number": /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
      "operator": /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
      "punctuation": /[{}[\];(),.:]/
    };
    Prism3.languages.javascript = Prism3.languages.extend("clike", {
      "class-name": [
        Prism3.languages.clike["class-name"],
        {
          pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
          lookbehind: true
        }
      ],
      "keyword": [
        {
          pattern: /((?:^|\})\s*)catch\b/,
          lookbehind: true
        },
        {
          pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
          lookbehind: true
        }
      ],
      // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
      "function": /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
      "number": {
        pattern: RegExp(
          /(^|[^\w$])/.source + "(?:" + // constant
          (/NaN|Infinity/.source + "|" + // binary integer
          /0[bB][01]+(?:_[01]+)*n?/.source + "|" + // octal integer
          /0[oO][0-7]+(?:_[0-7]+)*n?/.source + "|" + // hexadecimal integer
          /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source + "|" + // decimal bigint
          /\d+(?:_\d+)*n/.source + "|" + // decimal number (integer or float) but no bigint
          /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source) + ")" + /(?![\w$])/.source
        ),
        lookbehind: true
      },
      "operator": /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
    });
    Prism3.languages.javascript["class-name"][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;
    Prism3.languages.insertBefore("javascript", "keyword", {
      "regex": {
        pattern: RegExp(
          // lookbehind
          // eslint-disable-next-line regexp/no-dupe-characters-character-class
          /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source + // Regex pattern:
          // There are 2 regex patterns here. The RegExp set notation proposal added support for nested character
          // classes if the `v` flag is present. Unfortunately, nested CCs are both context-free and incompatible
          // with the only syntax, so we have to define 2 different regex patterns.
          /\//.source + "(?:" + /(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source + "|" + // `v` flag syntax. This supports 3 levels of nested character classes.
          /(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source + ")" + // lookahead
          /(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
        ),
        lookbehind: true,
        greedy: true,
        inside: {
          "regex-source": {
            pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
            lookbehind: true,
            alias: "language-regex",
            inside: Prism3.languages.regex
          },
          "regex-delimiter": /^\/|\/$/,
          "regex-flags": /^[a-z]+$/
        }
      },
      // This must be declared before keyword because we use "function" inside the look-forward
      "function-variable": {
        pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
        alias: "function"
      },
      "parameter": [
        {
          pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
          lookbehind: true,
          inside: Prism3.languages.javascript
        },
        {
          pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
          lookbehind: true,
          inside: Prism3.languages.javascript
        },
        {
          pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
          lookbehind: true,
          inside: Prism3.languages.javascript
        },
        {
          pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
          lookbehind: true,
          inside: Prism3.languages.javascript
        }
      ],
      "constant": /\b[A-Z](?:[A-Z_]|\dx?)*\b/
    });
    Prism3.languages.insertBefore("javascript", "string", {
      "hashbang": {
        pattern: /^#!.*/,
        greedy: true,
        alias: "comment"
      },
      "template-string": {
        pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
        greedy: true,
        inside: {
          "template-punctuation": {
            pattern: /^`|`$/,
            alias: "string"
          },
          "interpolation": {
            pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
            lookbehind: true,
            inside: {
              "interpolation-punctuation": {
                pattern: /^\$\{|\}$/,
                alias: "punctuation"
              },
              rest: Prism3.languages.javascript
            }
          },
          "string": /[\s\S]+/
        }
      },
      "string-property": {
        pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
        lookbehind: true,
        greedy: true,
        alias: "property"
      }
    });
    Prism3.languages.insertBefore("javascript", "operator", {
      "literal-property": {
        pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
        lookbehind: true,
        alias: "property"
      }
    });
    if (Prism3.languages.markup) {
      Prism3.languages.markup.tag.addInlined("script", "javascript");
      Prism3.languages.markup.tag.addAttribute(
        /on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
        "javascript"
      );
    }
    Prism3.languages.js = Prism3.languages.javascript;
    (function() {
      if (typeof Prism3 === "undefined" || typeof document === "undefined") {
        return;
      }
      if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
      }
      var LOADING_MESSAGE = "Loading\u2026";
      var FAILURE_MESSAGE = function(status, message) {
        return "\u2716 Error " + status + " while fetching file: " + message;
      };
      var FAILURE_EMPTY_MESSAGE = "\u2716 Error: File does not exist or is empty";
      var EXTENSIONS = {
        "js": "javascript",
        "py": "python",
        "rb": "ruby",
        "ps1": "powershell",
        "psm1": "powershell",
        "sh": "bash",
        "bat": "batch",
        "h": "c",
        "tex": "latex"
      };
      var STATUS_ATTR = "data-src-status";
      var STATUS_LOADING = "loading";
      var STATUS_LOADED = "loaded";
      var STATUS_FAILED = "failed";
      var SELECTOR = "pre[data-src]:not([" + STATUS_ATTR + '="' + STATUS_LOADED + '"]):not([' + STATUS_ATTR + '="' + STATUS_LOADING + '"])';
      function loadFile(src, success, error) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", src, true);
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4) {
            if (xhr.status < 400 && xhr.responseText) {
              success(xhr.responseText);
            } else {
              if (xhr.status >= 400) {
                error(FAILURE_MESSAGE(xhr.status, xhr.statusText));
              } else {
                error(FAILURE_EMPTY_MESSAGE);
              }
            }
          }
        };
        xhr.send(null);
      }
      function parseRange(range) {
        var m = /^\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?$/.exec(range || "");
        if (m) {
          var start = Number(m[1]);
          var comma = m[2];
          var end = m[3];
          if (!comma) {
            return [start, start];
          }
          if (!end) {
            return [start, void 0];
          }
          return [start, Number(end)];
        }
        return void 0;
      }
      Prism3.hooks.add("before-highlightall", function(env) {
        env.selector += ", " + SELECTOR;
      });
      Prism3.hooks.add("before-sanity-check", function(env) {
        var pre = (
          /** @type {HTMLPreElement} */
          env.element
        );
        if (pre.matches(SELECTOR)) {
          env.code = "";
          pre.setAttribute(STATUS_ATTR, STATUS_LOADING);
          var code = pre.appendChild(document.createElement("CODE"));
          code.textContent = LOADING_MESSAGE;
          var src = pre.getAttribute("data-src");
          var language = env.language;
          if (language === "none") {
            var extension = (/\.(\w+)$/.exec(src) || [, "none"])[1];
            language = EXTENSIONS[extension] || extension;
          }
          Prism3.util.setLanguage(code, language);
          Prism3.util.setLanguage(pre, language);
          var autoloader = Prism3.plugins.autoloader;
          if (autoloader) {
            autoloader.loadLanguages(language);
          }
          loadFile(
            src,
            function(text) {
              pre.setAttribute(STATUS_ATTR, STATUS_LOADED);
              var range = parseRange(pre.getAttribute("data-range"));
              if (range) {
                var lines = text.split(/\r\n?|\n/g);
                var start = range[0];
                var end = range[1] == null ? lines.length : range[1];
                if (start < 0) {
                  start += lines.length;
                }
                start = Math.max(0, Math.min(start - 1, lines.length));
                if (end < 0) {
                  end += lines.length;
                }
                end = Math.max(0, Math.min(end, lines.length));
                text = lines.slice(start, end).join("\n");
                if (!pre.hasAttribute("data-start")) {
                  pre.setAttribute("data-start", String(start + 1));
                }
              }
              code.textContent = text;
              Prism3.highlightElement(code);
            },
            function(error) {
              pre.setAttribute(STATUS_ATTR, STATUS_FAILED);
              code.textContent = error;
            }
          );
        }
      });
      Prism3.plugins.fileHighlight = {
        /**
         * Executes the File Highlight plugin for all matching `pre` elements under the given container.
         *
         * Note: Elements which are already loaded or currently loading will not be touched by this method.
         *
         * @param {ParentNode} [container=document]
         */
        highlight: function highlight(container) {
          var elements = (container || document).querySelectorAll(SELECTOR);
          for (var i = 0, element; element = elements[i++]; ) {
            Prism3.highlightElement(element);
          }
        }
      };
      var logged = false;
      Prism3.fileHighlight = function() {
        if (!logged) {
          console.warn("Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead.");
          logged = true;
        }
        Prism3.plugins.fileHighlight.highlight.apply(this, arguments);
      };
    })();
  }
});

// src/clients/demos.tsx
init_Buffer();
init_process();

// node_modules/@b9g/crank/crank.js
init_Buffer();
init_process();

// node_modules/@b9g/crank/event-target.js
init_Buffer();
init_process();
var NONE = 0;
var CAPTURING_PHASE = 1;
var AT_TARGET = 2;
var BUBBLING_PHASE = 3;
function isEventTarget(value) {
  return value != null && typeof value.addEventListener === "function" && typeof value.removeEventListener === "function" && typeof value.dispatchEvent === "function";
}
function setEventProperty(ev, key, value) {
  Object.defineProperty(ev, key, { value, writable: false, configurable: true });
}
function isListenerOrListenerObject(value) {
  return typeof value === "function" || value !== null && typeof value === "object" && typeof value.handleEvent === "function";
}
function normalizeListenerOptions(options) {
  if (typeof options === "boolean") {
    return { capture: options };
  } else if (options == null) {
    return {};
  }
  return options;
}
var _parent = /* @__PURE__ */ Symbol.for("CustomEventTarget.parent");
var _listeners = /* @__PURE__ */ Symbol.for("CustomEventTarget.listeners");
var _delegates = /* @__PURE__ */ Symbol.for("CustomEventTarget.delegates");
var _dispatchEventOnSelf = /* @__PURE__ */ Symbol.for("CustomEventTarget.dispatchSelf");
var CustomEventTarget = class {
  constructor(parent = null) {
    this[_parent] = parent;
    this[_listeners] = [];
    this[_delegates] = /* @__PURE__ */ new Set();
  }
  addEventListener(type, listener, options) {
    if (!isListenerOrListenerObject(listener)) {
      return;
    }
    const listeners = this[_listeners];
    options = normalizeListenerOptions(options);
    let callback;
    if (typeof listener === "function") {
      callback = listener;
    } else {
      callback = (ev) => listener.handleEvent(ev);
    }
    const record = { type, listener, callback, options };
    if (options.once) {
      record.callback = function() {
        const i = listeners.indexOf(record);
        if (i !== -1) {
          listeners.splice(i, 1);
        }
        return callback.apply(this, arguments);
      };
    }
    if (listeners.some((record1) => record.type === record1.type && record.listener === record1.listener && !record.options.capture === !record1.options.capture)) {
      return;
    }
    listeners.push(record);
    for (const delegate of this[_delegates]) {
      delegate.addEventListener(type, record.callback, record.options);
    }
  }
  removeEventListener(type, listener, options) {
    const listeners = this[_listeners];
    if (listeners == null || !isListenerOrListenerObject(listener)) {
      return;
    }
    const options1 = normalizeListenerOptions(options);
    const i = listeners.findIndex((record2) => record2.type === type && record2.listener === listener && !record2.options.capture === !options1.capture);
    if (i === -1) {
      return;
    }
    const record = listeners[i];
    listeners.splice(i, 1);
    for (const delegate of this[_delegates]) {
      delegate.removeEventListener(record.type, record.callback, record.options);
    }
  }
  dispatchEvent(ev) {
    const path = [];
    for (let parent = this[_parent]; parent; parent = parent[_parent]) {
      path.push(parent);
    }
    let cancelBubble = false;
    let immediateCancelBubble = false;
    const stopPropagation = ev.stopPropagation;
    setEventProperty(ev, "stopPropagation", () => {
      cancelBubble = true;
      return stopPropagation.call(ev);
    });
    const stopImmediatePropagation = ev.stopImmediatePropagation;
    setEventProperty(ev, "stopImmediatePropagation", () => {
      immediateCancelBubble = true;
      return stopImmediatePropagation.call(ev);
    });
    setEventProperty(ev, "target", this);
    try {
      setEventProperty(ev, "eventPhase", CAPTURING_PHASE);
      for (let i = path.length - 1; i >= 0; i--) {
        const target = path[i];
        const listeners = target[_listeners];
        setEventProperty(ev, "currentTarget", target);
        for (let i2 = 0; i2 < listeners.length; i2++) {
          const record = listeners[i2];
          if (record.type === ev.type && record.options.capture) {
            try {
              record.callback.call(target, ev);
            } catch (err) {
              console.error(err);
            }
            if (immediateCancelBubble) {
              return true;
            }
          }
        }
        if (cancelBubble) {
          return true;
        }
      }
      {
        setEventProperty(ev, "eventPhase", AT_TARGET);
        setEventProperty(ev, "currentTarget", this);
        this[_dispatchEventOnSelf](ev);
        if (immediateCancelBubble) {
          return true;
        }
        const listeners = this[_listeners];
        for (let i = 0; i < listeners.length; i++) {
          const record = listeners[i];
          if (record.type === ev.type) {
            try {
              record.callback.call(this, ev);
            } catch (err) {
              console.error(err);
            }
            if (immediateCancelBubble) {
              return true;
            }
          }
        }
        if (cancelBubble) {
          return true;
        }
      }
      if (ev.bubbles) {
        setEventProperty(ev, "eventPhase", BUBBLING_PHASE);
        for (let i = 0; i < path.length; i++) {
          const target = path[i];
          setEventProperty(ev, "currentTarget", target);
          const listeners = target[_listeners];
          for (let i2 = 0; i2 < listeners.length; i2++) {
            const record = listeners[i2];
            if (record.type === ev.type && !record.options.capture) {
              try {
                record.callback.call(target, ev);
              } catch (err) {
                console.error(err);
              }
              if (immediateCancelBubble) {
                return true;
              }
            }
          }
          if (cancelBubble) {
            return true;
          }
        }
      }
    } finally {
      setEventProperty(ev, "eventPhase", NONE);
      setEventProperty(ev, "currentTarget", null);
      return !ev.defaultPrevented;
    }
  }
  [_dispatchEventOnSelf](_ev) {
  }
};
CustomEventTarget.dispatchEventOnSelf = _dispatchEventOnSelf;
function addEventTargetDelegates(target, delegates, include = (target1) => target === target1) {
  const delegates1 = delegates.filter(isEventTarget);
  for (let target1 = target; target1 && include(target1); target1 = target1[_parent]) {
    for (let i = 0; i < delegates1.length; i++) {
      const delegate = delegates1[i];
      if (target1[_delegates].has(delegate)) {
        continue;
      }
      target1[_delegates].add(delegate);
      for (const record of target1[_listeners]) {
        delegate.addEventListener(record.type, record.callback, record.options);
      }
    }
  }
}
function removeEventTargetDelegates(target, delegates, include = (target1) => target === target1) {
  const delegates1 = delegates.filter(isEventTarget);
  for (let target1 = target; target1 && include(target1); target1 = target1[_parent]) {
    for (let i = 0; i < delegates1.length; i++) {
      const delegate = delegates1[i];
      if (!target1[_delegates].has(delegate)) {
        continue;
      }
      target1[_delegates].delete(delegate);
      for (const record of target1[_listeners]) {
        delegate.removeEventListener(record.type, record.callback, record.options);
      }
    }
  }
}
function clearEventListeners(target) {
  const listeners = target[_listeners];
  const delegates = target[_delegates];
  for (let i = 0; i < listeners.length; i++) {
    const record = listeners[i];
    for (const delegate of delegates) {
      delegate.removeEventListener(record.type, record.callback, record.options);
    }
  }
  listeners.length = 0;
  delegates.clear();
}

// node_modules/@b9g/crank/_utils.js
init_Buffer();
init_process();
function wrap(value) {
  return value === void 0 ? [] : Array.isArray(value) ? value : [value];
}
function unwrap(arr) {
  return arr.length === 0 ? void 0 : arr.length === 1 ? arr[0] : arr;
}
function arrayify(value) {
  return value == null ? [] : Array.isArray(value) ? value : typeof value === "string" || typeof value[Symbol.iterator] !== "function" ? [value] : [...value];
}
function isIteratorLike(value) {
  return value != null && typeof value.next === "function";
}
function isPromiseLike(value) {
  return value != null && typeof value.then === "function";
}
function createRaceRecord(contender) {
  const deferreds = /* @__PURE__ */ new Set();
  const record = { deferreds, settled: false };
  Promise.resolve(contender).then((value) => {
    for (const { resolve } of deferreds) {
      resolve(value);
    }
    deferreds.clear();
    record.settled = true;
  }, (err) => {
    for (const { reject } of deferreds) {
      reject(err);
    }
    deferreds.clear();
    record.settled = true;
  });
  return record;
}
var wm = /* @__PURE__ */ new WeakMap();
function safeRace(contenders) {
  let deferred;
  const result = new Promise((resolve, reject) => {
    deferred = { resolve, reject };
    for (const contender of contenders) {
      if (!isPromiseLike(contender)) {
        Promise.resolve(contender).then(resolve, reject);
        continue;
      }
      let record = wm.get(contender);
      if (record === void 0) {
        record = createRaceRecord(contender);
        record.deferreds.add(deferred);
        wm.set(contender, record);
      } else if (record.settled) {
        Promise.resolve(contender).then(resolve, reject);
      } else {
        record.deferreds.add(deferred);
      }
    }
  });
  return result.finally(() => {
    for (const contender of contenders) {
      if (isPromiseLike(contender)) {
        const record = wm.get(contender);
        if (record) {
          record.deferreds.delete(deferred);
        }
      }
    }
  });
}

// node_modules/@b9g/crank/crank.js
var NOOP = () => {
};
function getTagName(tag) {
  return typeof tag === "function" ? tag.name || "Anonymous" : typeof tag === "string" ? tag : (
    // tag is symbol, using else branch to avoid typeof tag === "symbol"
    tag.description || "Anonymous"
  );
}
var Fragment = "";
var Portal = /* @__PURE__ */ Symbol.for("crank.Portal");
var Copy = /* @__PURE__ */ Symbol.for("crank.Copy");
var Text = /* @__PURE__ */ Symbol.for("crank.Text");
var Raw = /* @__PURE__ */ Symbol.for("crank.Raw");
var ElementSymbol = /* @__PURE__ */ Symbol.for("crank.Element");
var Element2 = class {
  constructor(tag, props) {
    this.tag = tag;
    this.props = props;
  }
};
Element2.prototype.$$typeof = ElementSymbol;
function isElement(value) {
  return value != null && value.$$typeof === ElementSymbol;
}
var DEPRECATED_PROP_PREFIXES = ["crank-", "c-", "$"];
var DEPRECATED_SPECIAL_PROP_BASES = ["key", "ref", "static", "copy"];
function createElement(tag, props, ...children) {
  if (props == null) {
    props = {};
  }
  if ("static" in props) {
    console.error(`The \`static\` prop is deprecated. Use \`copy\` instead.`);
    props["copy"] = props["static"];
    delete props["static"];
  }
  for (let i = 0; i < DEPRECATED_PROP_PREFIXES.length; i++) {
    const propPrefix = DEPRECATED_PROP_PREFIXES[i];
    for (let j = 0; j < DEPRECATED_SPECIAL_PROP_BASES.length; j++) {
      const propBase = DEPRECATED_SPECIAL_PROP_BASES[j];
      const deprecatedPropName = propPrefix + propBase;
      if (deprecatedPropName in props) {
        const targetPropBase = propBase === "static" ? "copy" : propBase;
        console.error(`The \`${deprecatedPropName}\` prop is deprecated. Use \`${targetPropBase}\` instead.`);
        props[targetPropBase] = props[deprecatedPropName];
        delete props[deprecatedPropName];
      }
    }
  }
  if (children.length > 1) {
    props.children = children;
  } else if (children.length === 1) {
    props.children = children[0];
  }
  return new Element2(tag, props);
}
function cloneElement(el) {
  if (!isElement(el)) {
    throw new TypeError(`Cannot clone non-element: ${String(el)}`);
  }
  return new Element2(el.tag, { ...el.props });
}
function narrow(value) {
  if (typeof value === "boolean" || value == null) {
    return;
  } else if (typeof value === "string" || isElement(value)) {
    return value;
  } else if (typeof value[Symbol.iterator] === "function") {
    return createElement(Fragment, null, value);
  }
  return value.toString();
}
var DidDiff = 1 << 0;
var DidCommit = 1 << 1;
var IsCopied = 1 << 2;
var IsUpdating = 1 << 3;
var IsExecuting = 1 << 4;
var IsRefreshing = 1 << 5;
var IsScheduling = 1 << 6;
var IsSchedulingFallback = 1 << 7;
var IsUnmounted = 1 << 8;
var IsErrored = 1 << 9;
var IsResurrecting = 1 << 10;
var IsSyncGen = 1 << 11;
var IsAsyncGen = 1 << 12;
var IsInForOfLoop = 1 << 13;
var IsInForAwaitOfLoop = 1 << 14;
var NeedsToYield = 1 << 15;
var PropsAvailable = 1 << 16;
var IsSchedulingRefresh = 1 << 17;
function getFlag(ret, flag) {
  return !!(ret.f & flag);
}
function setFlag(ret, flag, value = true) {
  if (value) {
    ret.f |= flag;
  } else {
    ret.f &= ~flag;
  }
}
var Retainer = class {
  constructor(el) {
    this.f = 0;
    this.el = el;
    this.ctx = void 0;
    this.children = void 0;
    this.fallback = void 0;
    this.value = void 0;
    this.oldProps = void 0;
    this.pendingDiff = void 0;
    this.onNextDiff = void 0;
    this.graveyard = void 0;
    this.lingerers = void 0;
  }
};
function cloneRetainer(ret) {
  const clone = new Retainer(ret.el);
  clone.f = ret.f;
  clone.ctx = ret.ctx;
  clone.children = ret.children;
  clone.fallback = ret.fallback;
  clone.value = ret.value;
  clone.scope = ret.scope;
  clone.oldProps = ret.oldProps;
  clone.pendingDiff = ret.pendingDiff;
  clone.onNextDiff = ret.onNextDiff;
  clone.graveyard = ret.graveyard;
  clone.lingerers = ret.lingerers;
  return clone;
}
function getValue(ret, isNested = false, index) {
  if (getFlag(ret, IsScheduling) && isNested) {
    return ret.fallback ? getValue(ret.fallback, isNested, index) : void 0;
  } else if (ret.fallback && !getFlag(ret, DidDiff)) {
    return ret.fallback ? getValue(ret.fallback, isNested, index) : ret.fallback;
  } else if (ret.el.tag === Portal) {
    return;
  } else if (ret.el.tag === Fragment || typeof ret.el.tag === "function") {
    if (index != null && ret.ctx) {
      ret.ctx.index = index;
    }
    return unwrap(getChildValues(ret, index));
  }
  return ret.value;
}
function getChildValues(ret, startIndex) {
  const values = [];
  const lingerers = ret.lingerers;
  const rawChildren = ret.children;
  const isChildrenArray = Array.isArray(rawChildren);
  const childrenLength = rawChildren === void 0 ? 0 : isChildrenArray ? rawChildren.length : 1;
  let currentIndex = startIndex;
  for (let i = 0; i < childrenLength; i++) {
    if (lingerers != null && lingerers[i] != null) {
      const rets = lingerers[i];
      for (const ret2 of rets) {
        const value = getValue(ret2, true, currentIndex);
        if (Array.isArray(value)) {
          for (let j = 0; j < value.length; j++) {
            values.push(value[j]);
          }
          if (currentIndex != null) {
            currentIndex += value.length;
          }
        } else if (value) {
          values.push(value);
          if (currentIndex != null) {
            currentIndex++;
          }
        }
      }
    }
    const child = isChildrenArray ? rawChildren[i] : rawChildren;
    if (child) {
      const value = getValue(child, true, currentIndex);
      if (Array.isArray(value)) {
        for (let j = 0; j < value.length; j++) {
          values.push(value[j]);
        }
        if (currentIndex != null) {
          currentIndex += value.length;
        }
      } else if (value) {
        values.push(value);
        if (currentIndex != null) {
          currentIndex++;
        }
      }
    }
  }
  if (lingerers != null && lingerers.length > childrenLength) {
    for (let i = childrenLength; i < lingerers.length; i++) {
      const rets = lingerers[i];
      if (rets != null) {
        for (const ret2 of rets) {
          const value = getValue(ret2, true, currentIndex);
          if (Array.isArray(value)) {
            for (let j = 0; j < value.length; j++) {
              values.push(value[j]);
            }
            if (currentIndex != null) {
              currentIndex += value.length;
            }
          } else if (value) {
            values.push(value);
            if (currentIndex != null) {
              currentIndex++;
            }
          }
        }
      }
    }
  }
  return values;
}
function stripSpecialProps(props) {
  let _;
  let result;
  ({ key: _, ref: _, copy: _, hydrate: _, children: _, ...result } = props);
  return result;
}
var defaultAdapter = {
  create() {
    throw new Error("adapter must implement create");
  },
  adopt() {
    throw new Error("adapter must implement adopt() for hydration");
  },
  scope: ({ scope }) => scope,
  read: (value) => value,
  text: ({ value }) => value,
  raw: ({ value }) => value,
  patch: NOOP,
  arrange: NOOP,
  remove: NOOP,
  finalize: NOOP
};
var Renderer = class {
  constructor(adapter2) {
    this.cache = /* @__PURE__ */ new WeakMap();
    this.adapter = { ...defaultAdapter, ...adapter2 };
  }
  /**
   * Renders an element tree into a specific root.
   *
   * @param children - An element tree. Rendering null deletes cached renders.
   * @param root - The root to be rendered into. The renderer caches renders
   * per root.
   * @param bridge - An optional context that will be the ancestor context of
   * all elements in the tree. Useful for connecting different renderers so
   * that events/provisions/errors properly propagate. The context for a given
   * root must be the same between renders.
   *
   * @returns The result of rendering the children, or a possible promise of
   * the result if the element tree renders asynchronously.
   */
  render(children, root, bridge) {
    const ret = getRootRetainer(this, bridge, { children, root });
    return renderRoot(this.adapter, root, ret, children);
  }
  hydrate(children, root, bridge) {
    const ret = getRootRetainer(this, bridge, {
      children,
      root,
      hydrate: true
    });
    return renderRoot(this.adapter, root, ret, children);
  }
};
function getRootRetainer(renderer2, bridge, { children, root, hydrate: hydrate2 }) {
  let ret;
  const bridgeCtx = bridge && bridge[_ContextState];
  if (typeof root === "object" && root !== null) {
    ret = renderer2.cache.get(root);
  }
  const adapter2 = renderer2.adapter;
  if (ret === void 0) {
    ret = new Retainer(createElement(Portal, { children, root, hydrate: hydrate2 }));
    ret.value = root;
    ret.ctx = bridgeCtx;
    ret.scope = adapter2.scope({
      tag: Portal,
      tagName: getTagName(Portal),
      props: stripSpecialProps(ret.el.props),
      scope: void 0,
      root
    });
    if (typeof root === "object" && root !== null && children != null) {
      renderer2.cache.set(root, ret);
    }
  } else if (ret.ctx !== bridgeCtx) {
    throw new Error("A previous call to render() was passed a different context");
  } else {
    ret.el = createElement(Portal, { children, root, hydrate: hydrate2 });
    if (typeof root === "object" && root !== null && children == null) {
      renderer2.cache.delete(root);
    }
  }
  return ret;
}
function renderRoot(adapter2, root, ret, children) {
  const diff2 = diffChildren(adapter2, root, ret, ret.ctx, ret.scope, ret, children);
  const schedulePromises = [];
  if (isPromiseLike(diff2)) {
    return diff2.then(() => {
      commit(adapter2, ret, ret, ret.ctx, ret.scope, root, 0, schedulePromises, void 0);
      if (schedulePromises.length > 0) {
        return Promise.all(schedulePromises).then(() => {
          if (typeof root !== "object" || root === null) {
            unmount(adapter2, ret, ret.ctx, root, ret, false);
          }
          return adapter2.read(unwrap(getChildValues(ret)));
        });
      }
      if (typeof root !== "object" || root === null) {
        unmount(adapter2, ret, ret.ctx, root, ret, false);
      }
      return adapter2.read(unwrap(getChildValues(ret)));
    });
  }
  commit(adapter2, ret, ret, ret.ctx, ret.scope, root, 0, schedulePromises, void 0);
  if (schedulePromises.length > 0) {
    return Promise.all(schedulePromises).then(() => {
      if (typeof root !== "object" || root === null) {
        unmount(adapter2, ret, ret.ctx, root, ret, false);
      }
      return adapter2.read(unwrap(getChildValues(ret)));
    });
  }
  if (typeof root !== "object" || root === null) {
    unmount(adapter2, ret, ret.ctx, root, ret, false);
  }
  return adapter2.read(unwrap(getChildValues(ret)));
}
function diffChild(adapter2, root, host, ctx, scope, parent, newChildren) {
  let child = narrow(newChildren);
  let ret = parent.children;
  let graveyard;
  let diff2;
  if (typeof child === "object") {
    let childCopied = false;
    const oldKey = typeof ret === "object" ? ret.el.props.key : void 0;
    const newKey = child.props.key;
    if (oldKey !== newKey) {
      if (typeof ret === "object") {
        (graveyard = graveyard || []).push(ret);
      }
      ret = void 0;
    }
    if (child.tag === Copy) {
      childCopied = true;
    } else if (typeof ret === "object" && ret.el === child && getFlag(ret, DidCommit)) {
      childCopied = true;
    } else {
      if (ret && ret.el.tag === child.tag) {
        ret.el = child;
        if (child.props.copy && typeof child.props.copy !== "string") {
          childCopied = true;
        }
      } else if (ret) {
        let candidateFound = false;
        for (let predecessor = ret, candidate = ret.fallback; candidate; predecessor = candidate, candidate = candidate.fallback) {
          if (candidate.el.tag === child.tag) {
            const clone = cloneRetainer(candidate);
            setFlag(clone, IsResurrecting);
            predecessor.fallback = clone;
            const fallback = ret;
            ret = candidate;
            ret.el = child;
            ret.fallback = fallback;
            setFlag(ret, DidDiff, false);
            candidateFound = true;
            break;
          }
        }
        if (!candidateFound) {
          const fallback = ret;
          ret = new Retainer(child);
          ret.fallback = fallback;
        }
      } else {
        ret = new Retainer(child);
      }
      if (childCopied && getFlag(ret, DidCommit)) ;
      else if (child.tag === Raw || child.tag === Text) ;
      else if (child.tag === Fragment) {
        diff2 = diffChildren(adapter2, root, host, ctx, scope, ret, ret.el.props.children);
      } else if (typeof child.tag === "function") {
        diff2 = diffComponent(adapter2, root, host, ctx, scope, ret);
      } else {
        diff2 = diffHost(adapter2, root, ctx, scope, ret);
      }
    }
    if (typeof ret === "object") {
      if (childCopied) {
        setFlag(ret, IsCopied);
        diff2 = getInflightDiff(ret);
      } else {
        setFlag(ret, IsCopied, false);
      }
    }
  } else if (typeof child === "string") {
    if (typeof ret === "object" && ret.el.tag === Text) {
      ret.el.props.value = child;
    } else {
      if (typeof ret === "object") {
        (graveyard = graveyard || []).push(ret);
      }
      ret = new Retainer(createElement(Text, { value: child }));
    }
  } else {
    if (typeof ret === "object") {
      (graveyard = graveyard || []).push(ret);
    }
    ret = void 0;
  }
  parent.children = ret;
  if (isPromiseLike(diff2)) {
    const diff1 = diff2.finally(() => {
      setFlag(parent, DidDiff);
      if (graveyard) {
        if (parent.graveyard) {
          for (let i = 0; i < graveyard.length; i++) {
            parent.graveyard.push(graveyard[i]);
          }
        } else {
          parent.graveyard = graveyard;
        }
      }
    });
    let onNextDiffs;
    const diff22 = parent.pendingDiff = safeRace([
      diff1,
      new Promise((resolve) => onNextDiffs = resolve)
    ]);
    if (parent.onNextDiff) {
      parent.onNextDiff(diff22);
    }
    parent.onNextDiff = onNextDiffs;
    return diff22;
  } else {
    setFlag(parent, DidDiff);
    if (graveyard) {
      if (parent.graveyard) {
        for (let i = 0; i < graveyard.length; i++) {
          parent.graveyard.push(graveyard[i]);
        }
      } else {
        parent.graveyard = graveyard;
      }
    }
    if (parent.onNextDiff) {
      parent.onNextDiff(diff2);
      parent.onNextDiff = void 0;
    }
    parent.pendingDiff = void 0;
  }
}
function diffChildren(adapter2, root, host, ctx, scope, parent, newChildren) {
  if (!Array.isArray(newChildren) && (typeof newChildren !== "object" || newChildren === null || typeof newChildren[Symbol.iterator] !== "function") && !Array.isArray(parent.children)) {
    return diffChild(adapter2, root, host, ctx, scope, parent, newChildren);
  }
  const oldRetained = wrap(parent.children);
  const newRetained = [];
  const newChildren1 = arrayify(newChildren);
  const diffs = [];
  let childrenByKey;
  let seenKeys;
  let isAsync = false;
  let oi = 0;
  let oldLength = oldRetained.length;
  let graveyard;
  for (let ni = 0, newLength = newChildren1.length; ni < newLength; ni++) {
    let ret = oi >= oldLength ? void 0 : oldRetained[oi];
    let child = narrow(newChildren1[ni]);
    {
      let oldKey = typeof ret === "object" ? ret.el.props.key : void 0;
      let newKey = typeof child === "object" ? child.props.key : void 0;
      if (newKey !== void 0 && seenKeys && seenKeys.has(newKey)) {
        console.error(`Duplicate key found in <${getTagName(parent.el.tag)}>`, newKey);
        child = cloneElement(child);
        newKey = child.props.key = void 0;
      }
      if (oldKey === newKey) {
        if (childrenByKey !== void 0 && newKey !== void 0) {
          childrenByKey.delete(newKey);
        }
        oi++;
      } else {
        childrenByKey = childrenByKey || createChildrenByKey(oldRetained, oi);
        if (newKey === void 0) {
          while (ret !== void 0 && oldKey !== void 0) {
            oi++;
            ret = oldRetained[oi];
            oldKey = typeof ret === "object" ? ret.el.props.key : void 0;
          }
          oi++;
        } else {
          ret = childrenByKey.get(newKey);
          if (ret !== void 0) {
            childrenByKey.delete(newKey);
          }
          (seenKeys = seenKeys || /* @__PURE__ */ new Set()).add(newKey);
        }
      }
    }
    let diff2 = void 0;
    if (typeof child === "object") {
      let childCopied = false;
      if (child.tag === Copy) {
        childCopied = true;
      } else if (typeof ret === "object" && ret.el === child && getFlag(ret, DidCommit)) {
        childCopied = true;
      } else {
        if (ret && ret.el.tag === child.tag) {
          ret.el = child;
          if (child.props.copy && typeof child.props.copy !== "string") {
            childCopied = true;
          }
        } else if (ret) {
          let candidateFound = false;
          for (let predecessor = ret, candidate = ret.fallback; candidate; predecessor = candidate, candidate = candidate.fallback) {
            if (candidate.el.tag === child.tag) {
              const clone = cloneRetainer(candidate);
              setFlag(clone, IsResurrecting);
              predecessor.fallback = clone;
              const fallback = ret;
              ret = candidate;
              ret.el = child;
              ret.fallback = fallback;
              setFlag(ret, DidDiff, false);
              candidateFound = true;
              break;
            }
          }
          if (!candidateFound) {
            const fallback = ret;
            ret = new Retainer(child);
            ret.fallback = fallback;
          }
        } else {
          ret = new Retainer(child);
        }
        if (childCopied && getFlag(ret, DidCommit)) ;
        else if (child.tag === Raw || child.tag === Text) ;
        else if (child.tag === Fragment) {
          diff2 = diffChildren(adapter2, root, host, ctx, scope, ret, ret.el.props.children);
        } else if (typeof child.tag === "function") {
          diff2 = diffComponent(adapter2, root, host, ctx, scope, ret);
        } else {
          diff2 = diffHost(adapter2, root, ctx, scope, ret);
        }
      }
      if (typeof ret === "object") {
        if (childCopied) {
          setFlag(ret, IsCopied);
          diff2 = getInflightDiff(ret);
        } else {
          setFlag(ret, IsCopied, false);
        }
      }
      if (isPromiseLike(diff2)) {
        isAsync = true;
      }
    } else if (typeof child === "string") {
      if (typeof ret === "object" && ret.el.tag === Text) {
        ret.el.props.value = child;
      } else {
        if (typeof ret === "object") {
          (graveyard = graveyard || []).push(ret);
        }
        ret = new Retainer(createElement(Text, { value: child }));
      }
    } else {
      if (typeof ret === "object") {
        (graveyard = graveyard || []).push(ret);
      }
      ret = void 0;
    }
    diffs[ni] = diff2;
    newRetained[ni] = ret;
  }
  for (; oi < oldLength; oi++) {
    const ret = oldRetained[oi];
    if (typeof ret === "object" && (typeof ret.el.props.key === "undefined" || !seenKeys || !seenKeys.has(ret.el.props.key))) {
      (graveyard = graveyard || []).push(ret);
    }
  }
  if (childrenByKey !== void 0 && childrenByKey.size > 0) {
    graveyard = graveyard || [];
    for (const ret of childrenByKey.values()) {
      graveyard.push(ret);
    }
  }
  parent.children = unwrap(newRetained);
  if (isAsync) {
    const diffs1 = Promise.all(diffs).then(() => void 0).finally(() => {
      setFlag(parent, DidDiff);
      if (graveyard) {
        if (parent.graveyard) {
          for (let i = 0; i < graveyard.length; i++) {
            parent.graveyard.push(graveyard[i]);
          }
        } else {
          parent.graveyard = graveyard;
        }
      }
    });
    let onNextDiffs;
    const diffs2 = parent.pendingDiff = safeRace([
      diffs1,
      new Promise((resolve) => onNextDiffs = resolve)
    ]);
    if (parent.onNextDiff) {
      parent.onNextDiff(diffs2);
    }
    parent.onNextDiff = onNextDiffs;
    return diffs2;
  } else {
    setFlag(parent, DidDiff);
    if (graveyard) {
      if (parent.graveyard) {
        for (let i = 0; i < graveyard.length; i++) {
          parent.graveyard.push(graveyard[i]);
        }
      } else {
        parent.graveyard = graveyard;
      }
    }
    if (parent.onNextDiff) {
      parent.onNextDiff(diffs);
      parent.onNextDiff = void 0;
    }
    parent.pendingDiff = void 0;
  }
}
function getInflightDiff(ret) {
  if (ret.ctx && ret.ctx.inflight) {
    return ret.ctx.inflight[1];
  } else if (ret.pendingDiff) {
    return ret.pendingDiff;
  }
}
function createChildrenByKey(children, offset) {
  const childrenByKey = /* @__PURE__ */ new Map();
  for (let i = offset; i < children.length; i++) {
    const child = children[i];
    if (typeof child === "object" && typeof child.el.props.key !== "undefined") {
      childrenByKey.set(child.el.props.key, child);
    }
  }
  return childrenByKey;
}
function diffHost(adapter2, root, ctx, scope, ret) {
  const el = ret.el;
  const tag = el.tag;
  if (el.tag === Portal) {
    root = ret.value = el.props.root;
  }
  if (getFlag(ret, DidCommit)) {
    scope = ret.scope;
  } else {
    scope = ret.scope = adapter2.scope({
      tag,
      tagName: getTagName(tag),
      props: el.props,
      scope,
      root
    });
  }
  return diffChildren(adapter2, root, ret, ctx, scope, ret, ret.el.props.children);
}
function commit(adapter2, host, ret, ctx, scope, root, index, schedulePromises, hydrationNodes) {
  if (getFlag(ret, IsCopied) && getFlag(ret, DidCommit)) {
    return getValue(ret);
  }
  const el = ret.el;
  const tag = el.tag;
  if (typeof tag === "function" || tag === Fragment || tag === Portal || tag === Raw || tag === Text) {
    if (typeof el.props.copy === "string") {
      console.error(`String copy prop ignored for <${getTagName(tag)}>. Use booleans instead.`);
    }
    if (typeof el.props.hydrate === "string") {
      console.error(`String hydrate prop ignored for <${getTagName(tag)}>. Use booleans instead.`);
    }
  }
  let value;
  let skippedHydrationNodes;
  if (hydrationNodes && el.props.hydrate != null && !el.props.hydrate && typeof el.props.hydrate !== "string") {
    skippedHydrationNodes = hydrationNodes;
    hydrationNodes = void 0;
  }
  if (typeof tag === "function") {
    ret.ctx.index = index;
    value = commitComponent(ret.ctx, schedulePromises, hydrationNodes);
  } else {
    if (tag === Fragment) {
      value = commitChildren(adapter2, host, ctx, scope, root, ret, index, schedulePromises, hydrationNodes);
    } else if (tag === Text) {
      value = commitText(adapter2, ret, el, scope, hydrationNodes, root);
    } else if (tag === Raw) {
      value = commitRaw(adapter2, host, ret, scope, hydrationNodes, root);
    } else {
      value = commitHost(adapter2, ret, ctx, root, schedulePromises, hydrationNodes);
    }
    if (ret.fallback) {
      unmount(adapter2, host, ctx, root, ret.fallback, false);
      ret.fallback = void 0;
    }
  }
  if (skippedHydrationNodes) {
    skippedHydrationNodes.splice(0, value == null ? 0 : Array.isArray(value) ? value.length : 1);
  }
  if (!getFlag(ret, DidCommit)) {
    setFlag(ret, DidCommit);
    if (typeof tag !== "function" && tag !== Fragment && tag !== Portal && typeof el.props.ref === "function") {
      el.props.ref(adapter2.read(value));
    }
  }
  return value;
}
function commitChildren(adapter2, host, ctx, scope, root, parent, index, schedulePromises, hydrationNodes) {
  let values = [];
  const rawChildren = parent.children;
  const isChildrenArray = Array.isArray(rawChildren);
  const childrenLength = rawChildren === void 0 ? 0 : isChildrenArray ? rawChildren.length : 1;
  for (let i = 0; i < childrenLength; i++) {
    let child = isChildrenArray ? rawChildren[i] : rawChildren;
    let schedulePromises1;
    let isSchedulingFallback = false;
    while (child && (!getFlag(child, DidDiff) && child.fallback || getFlag(child, IsScheduling))) {
      if (getFlag(child, IsScheduling) && child.ctx.schedule) {
        (schedulePromises1 = schedulePromises1 || []).push(child.ctx.schedule.promise);
        isSchedulingFallback = true;
      }
      if (!getFlag(child, DidDiff) && getFlag(child, DidCommit)) {
        for (const node of getChildValues(child)) {
          adapter2.remove({
            node,
            parentNode: host.value,
            isNested: false,
            root
          });
        }
      }
      child = child.fallback;
      if (schedulePromises1 && isSchedulingFallback && child) {
        if (!getFlag(child, DidDiff)) {
          const inflightDiff = getInflightDiff(child);
          schedulePromises1.push(inflightDiff);
        } else {
          schedulePromises1 = void 0;
        }
        if (getFlag(child, IsSchedulingFallback)) {
          isSchedulingFallback = true;
        } else {
          setFlag(child, IsSchedulingFallback, true);
          isSchedulingFallback = false;
        }
      }
    }
    if (schedulePromises1 && schedulePromises1.length > 1) {
      schedulePromises.push(safeRace(schedulePromises1));
    }
    if (child) {
      const value = commit(adapter2, host, child, ctx, scope, root, index, schedulePromises, hydrationNodes);
      if (Array.isArray(value)) {
        for (let j = 0; j < value.length; j++) {
          values.push(value[j]);
        }
        index += value.length;
      } else if (value) {
        values.push(value);
        index++;
      }
    }
  }
  if (parent.graveyard) {
    for (let i = 0; i < parent.graveyard.length; i++) {
      const child = parent.graveyard[i];
      unmount(adapter2, host, ctx, root, child, false);
    }
    parent.graveyard = void 0;
  }
  if (parent.lingerers) {
    values = getChildValues(parent);
  }
  return values;
}
function commitText(adapter2, ret, el, scope, hydrationNodes, root) {
  const value = adapter2.text({
    value: el.props.value,
    scope,
    oldNode: ret.value,
    hydrationNodes,
    root
  });
  ret.value = value;
  return value;
}
function commitRaw(adapter2, host, ret, scope, hydrationNodes, root) {
  if (!ret.oldProps || ret.oldProps.value !== ret.el.props.value) {
    const oldNodes = wrap(ret.value);
    for (let i = 0; i < oldNodes.length; i++) {
      const oldNode = oldNodes[i];
      adapter2.remove({
        node: oldNode,
        parentNode: host.value,
        isNested: false,
        root
      });
    }
    ret.value = adapter2.raw({
      value: ret.el.props.value,
      scope,
      hydrationNodes,
      root
    });
  }
  ret.oldProps = stripSpecialProps(ret.el.props);
  return ret.value;
}
function commitHost(adapter2, ret, ctx, root, schedulePromises, hydrationNodes) {
  if (getFlag(ret, IsCopied) && getFlag(ret, DidCommit)) {
    return getValue(ret);
  }
  const tag = ret.el.tag;
  const props = stripSpecialProps(ret.el.props);
  const oldProps = ret.oldProps;
  let node = ret.value;
  let copyProps;
  let copyChildren = false;
  if (oldProps) {
    for (const propName in props) {
      if (props[propName] === Copy) {
        props[propName] = oldProps[propName];
        (copyProps = copyProps || /* @__PURE__ */ new Set()).add(propName);
      }
    }
    if (typeof ret.el.props.copy === "string") {
      const copyMetaProp = new MetaProp("copy", ret.el.props.copy);
      if (copyMetaProp.include) {
        for (const propName of copyMetaProp.props) {
          if (propName in oldProps) {
            props[propName] = oldProps[propName];
            (copyProps = copyProps || /* @__PURE__ */ new Set()).add(propName);
          }
        }
      } else {
        for (const propName in oldProps) {
          if (!copyMetaProp.props.has(propName)) {
            props[propName] = oldProps[propName];
            (copyProps = copyProps || /* @__PURE__ */ new Set()).add(propName);
          }
        }
      }
      copyChildren = copyMetaProp.includes("children");
    }
  }
  const scope = ret.scope;
  let childHydrationNodes;
  let quietProps;
  let hydrationMetaProp;
  if (!getFlag(ret, DidCommit)) {
    if (tag === Portal) {
      if (ret.el.props.hydrate && typeof ret.el.props.hydrate !== "string") {
        childHydrationNodes = adapter2.adopt({
          tag,
          tagName: getTagName(tag),
          node,
          props,
          scope,
          root
        });
        if (childHydrationNodes) {
          for (let i = 0; i < childHydrationNodes.length; i++) {
            adapter2.remove({
              node: childHydrationNodes[i],
              parentNode: node,
              isNested: false,
              root
            });
          }
        }
      }
    } else {
      if (!node && hydrationNodes) {
        const nextChild = hydrationNodes.shift();
        if (typeof ret.el.props.hydrate === "string") {
          hydrationMetaProp = new MetaProp("hydration", ret.el.props.hydrate);
          if (hydrationMetaProp.include) {
            quietProps = new Set(Object.keys(props));
            for (const propName of hydrationMetaProp.props) {
              quietProps.delete(propName);
            }
          } else {
            quietProps = hydrationMetaProp.props;
          }
        }
        childHydrationNodes = adapter2.adopt({
          tag,
          tagName: getTagName(tag),
          node: nextChild,
          props,
          scope,
          root
        });
        if (childHydrationNodes) {
          node = nextChild;
          for (let i = 0; i < childHydrationNodes.length; i++) {
            adapter2.remove({
              node: childHydrationNodes[i],
              parentNode: node,
              isNested: false,
              root
            });
          }
        }
      }
      if (!node) {
        node = adapter2.create({
          tag,
          tagName: getTagName(tag),
          props,
          scope,
          root
        });
      }
      ret.value = node;
    }
  }
  if (tag !== Portal) {
    adapter2.patch({
      tag,
      tagName: getTagName(tag),
      node,
      props,
      oldProps,
      scope,
      root,
      copyProps,
      isHydrating: !!childHydrationNodes,
      quietProps
    });
  }
  if (!copyChildren) {
    const children = commitChildren(adapter2, ret, ctx, scope, tag === Portal ? node : root, ret, 0, schedulePromises, hydrationMetaProp && !hydrationMetaProp.includes("children") ? void 0 : childHydrationNodes);
    adapter2.arrange({
      tag,
      tagName: getTagName(tag),
      node,
      props,
      children,
      oldProps,
      scope,
      root
    });
  }
  ret.oldProps = props;
  if (tag === Portal) {
    flush(adapter2, ret.value);
    return;
  }
  return node;
}
var MetaProp = class {
  constructor(propName, propValue) {
    this.include = true;
    this.props = /* @__PURE__ */ new Set();
    let noBangs = true;
    let allBangs = true;
    const tokens = propValue.split(/[,\s]+/);
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].trim();
      if (!token) {
        continue;
      } else if (token.startsWith("!")) {
        noBangs = false;
        this.props.add(token.slice(1));
      } else {
        allBangs = false;
        this.props.add(token);
      }
    }
    if (!allBangs && !noBangs) {
      console.error(`Invalid ${propName} prop "${propValue}".
Use prop or !prop but not both.`);
      this.include = true;
      this.props.clear();
    } else {
      this.include = noBangs;
    }
  }
  includes(propName) {
    if (this.include) {
      return this.props.has(propName);
    } else {
      return !this.props.has(propName);
    }
  }
};
function contextContains(parent, child) {
  for (let current = child; current !== void 0; current = current.parent) {
    if (current === parent) {
      return true;
    }
  }
  return false;
}
var ANONYMOUS_ROOT = {};
function flush(adapter2, root, initiator) {
  if (root != null) {
    adapter2.finalize(root);
  }
  if (typeof root !== "object" || root === null) {
    root = ANONYMOUS_ROOT;
  }
  const afterMap = afterMapByRoot.get(root);
  if (afterMap) {
    const afterMap1 = /* @__PURE__ */ new Map();
    for (const [ctx, callbacks] of afterMap) {
      if (getFlag(ctx.ret, IsScheduling) || initiator && !contextContains(initiator, ctx)) {
        afterMap.delete(ctx);
        afterMap1.set(ctx, callbacks);
      }
    }
    if (afterMap1.size) {
      afterMapByRoot.set(root, afterMap1);
    } else {
      afterMapByRoot.delete(root);
    }
    for (const [ctx, callbacks] of afterMap) {
      const value = adapter2.read(getValue(ctx.ret));
      for (const callback of callbacks) {
        callback(value);
      }
    }
  }
}
function unmount(adapter2, host, ctx, root, ret, isNested) {
  if (ret.fallback) {
    unmount(adapter2, host, ctx, root, ret.fallback, isNested);
    ret.fallback = void 0;
  }
  if (getFlag(ret, IsResurrecting)) {
    return;
  }
  if (ret.lingerers) {
    for (let i = 0; i < ret.lingerers.length; i++) {
      const lingerers = ret.lingerers[i];
      if (lingerers) {
        for (const lingerer of lingerers) {
          unmount(adapter2, host, ctx, root, lingerer, isNested);
        }
      }
    }
    ret.lingerers = void 0;
  }
  if (typeof ret.el.tag === "function") {
    unmountComponent(ret.ctx, isNested);
  } else if (ret.el.tag === Fragment) {
    unmountChildren(adapter2, host, ctx, root, ret, isNested);
  } else if (ret.el.tag === Portal) {
    unmountChildren(adapter2, ret, ctx, ret.value, ret, false);
    if (ret.value != null) {
      adapter2.finalize(ret.value);
    }
  } else {
    unmountChildren(adapter2, ret, ctx, root, ret, true);
    if (getFlag(ret, DidCommit)) {
      if (ctx) {
        removeEventTargetDelegates(ctx.ctx, [ret.value], (ctx1) => ctx1[_ContextState].host === host);
      }
      adapter2.remove({
        node: ret.value,
        parentNode: host.value,
        isNested,
        root
      });
    }
  }
}
function unmountChildren(adapter2, host, ctx, root, ret, isNested) {
  if (ret.graveyard) {
    for (let i = 0; i < ret.graveyard.length; i++) {
      const child = ret.graveyard[i];
      unmount(adapter2, host, ctx, root, child, isNested);
    }
    ret.graveyard = void 0;
  }
  const rawChildren = ret.children;
  if (Array.isArray(rawChildren)) {
    for (let i = 0; i < rawChildren.length; i++) {
      const child = rawChildren[i];
      if (typeof child === "object") {
        unmount(adapter2, host, ctx, root, child, isNested);
      }
    }
  } else if (rawChildren !== void 0) {
    unmount(adapter2, host, ctx, root, rawChildren, isNested);
  }
}
var provisionMaps = /* @__PURE__ */ new WeakMap();
var scheduleMap = /* @__PURE__ */ new WeakMap();
var cleanupMap = /* @__PURE__ */ new WeakMap();
var afterMapByRoot = /* @__PURE__ */ new WeakMap();
var ContextState = class {
  constructor(adapter2, root, host, parent, scope, ret) {
    this.adapter = adapter2;
    this.root = root;
    this.host = host;
    this.parent = parent;
    this.ctx = new Context(this);
    this.scope = scope;
    this.ret = ret;
    this.iterator = void 0;
    this.inflight = void 0;
    this.enqueued = void 0;
    this.onPropsProvided = void 0;
    this.onPropsRequested = void 0;
    this.pull = void 0;
    this.index = 0;
    this.schedule = void 0;
  }
};
var _ContextState = /* @__PURE__ */ Symbol.for("crank.ContextState");
var Context = class extends CustomEventTarget {
  // TODO: If we could make the constructor function take a nicer value, it
  // would be useful for testing purposes.
  constructor(state) {
    super(state.parent ? state.parent.ctx : null);
    this[_ContextState] = state;
  }
  /**
   * The current props of the associated element.
   */
  get props() {
    return this[_ContextState].ret.el.props;
  }
  /**
   * The current value of the associated element.
   *
   * @deprecated
   */
  get value() {
    console.warn("Context.value is deprecated.");
    return this[_ContextState].adapter.read(getValue(this[_ContextState].ret));
  }
  get isExecuting() {
    return getFlag(this[_ContextState].ret, IsExecuting);
  }
  get isUnmounted() {
    return getFlag(this[_ContextState].ret, IsUnmounted);
  }
  *[Symbol.iterator]() {
    const ctx = this[_ContextState];
    setFlag(ctx.ret, IsInForOfLoop);
    try {
      while (!getFlag(ctx.ret, IsUnmounted) && !getFlag(ctx.ret, IsErrored)) {
        if (getFlag(ctx.ret, NeedsToYield)) {
          throw new Error(`<${getTagName(ctx.ret.el.tag)}> context iterated twice without a yield`);
        } else {
          setFlag(ctx.ret, NeedsToYield);
        }
        yield ctx.ret.el.props;
      }
    } finally {
      setFlag(ctx.ret, IsInForOfLoop, false);
    }
  }
  async *[Symbol.asyncIterator]() {
    const ctx = this[_ContextState];
    setFlag(ctx.ret, IsInForAwaitOfLoop);
    try {
      while (!getFlag(ctx.ret, IsUnmounted) && !getFlag(ctx.ret, IsErrored)) {
        if (getFlag(ctx.ret, NeedsToYield)) {
          throw new Error(`<${getTagName(ctx.ret.el.tag)}> context iterated twice without a yield`);
        } else {
          setFlag(ctx.ret, NeedsToYield);
        }
        if (getFlag(ctx.ret, PropsAvailable)) {
          setFlag(ctx.ret, PropsAvailable, false);
          yield ctx.ret.el.props;
        } else {
          const props = await new Promise((resolve) => ctx.onPropsProvided = resolve);
          if (getFlag(ctx.ret, IsUnmounted) || getFlag(ctx.ret, IsErrored)) {
            break;
          }
          yield props;
        }
        if (ctx.onPropsRequested) {
          ctx.onPropsRequested();
          ctx.onPropsRequested = void 0;
        }
      }
    } finally {
      setFlag(ctx.ret, IsInForAwaitOfLoop, false);
      if (ctx.onPropsRequested) {
        ctx.onPropsRequested();
        ctx.onPropsRequested = void 0;
      }
    }
  }
  /**
   * Re-executes a component.
   *
   * @param callback - Optional callback to execute before refresh
   * @returns The rendered result of the component or a promise thereof if the
   * component or its children execute asynchronously.
   */
  refresh(callback) {
    const ctx = this[_ContextState];
    if (getFlag(ctx.ret, IsUnmounted)) {
      console.error(`Component <${getTagName(ctx.ret.el.tag)}> is unmounted. Check the isUnmounted property if necessary.`);
      return ctx.adapter.read(getValue(ctx.ret));
    } else if (getFlag(ctx.ret, IsExecuting)) {
      console.error(`Component <${getTagName(ctx.ret.el.tag)}> is already executing Check the isExecuting property if necessary.`);
      return ctx.adapter.read(getValue(ctx.ret));
    }
    if (callback) {
      const result = callback();
      if (isPromiseLike(result)) {
        return Promise.resolve(result).then(() => {
          if (!getFlag(ctx.ret, IsUnmounted)) {
            return this.refresh();
          }
          return ctx.adapter.read(getValue(ctx.ret));
        });
      }
    }
    if (getFlag(ctx.ret, IsScheduling)) {
      setFlag(ctx.ret, IsSchedulingRefresh);
    }
    let diff2;
    const schedulePromises = [];
    try {
      setFlag(ctx.ret, IsRefreshing);
      diff2 = enqueueComponent(ctx);
      if (isPromiseLike(diff2)) {
        return diff2.then(() => ctx.adapter.read(commitComponent(ctx, schedulePromises))).then((result2) => {
          if (schedulePromises.length) {
            return Promise.all(schedulePromises).then(() => {
              return ctx.adapter.read(getValue(ctx.ret));
            });
          }
          return result2;
        }).catch((err) => {
          const diff3 = propagateError(ctx, err, schedulePromises);
          if (diff3) {
            return diff3.then(() => {
              if (schedulePromises.length) {
                return Promise.all(schedulePromises).then(() => {
                  return ctx.adapter.read(getValue(ctx.ret));
                });
              }
              return ctx.adapter.read(getValue(ctx.ret));
            });
          }
          if (schedulePromises.length) {
            return Promise.all(schedulePromises).then(() => {
              return ctx.adapter.read(getValue(ctx.ret));
            });
          }
          return ctx.adapter.read(getValue(ctx.ret));
        }).finally(() => setFlag(ctx.ret, IsRefreshing, false));
      }
      const result = ctx.adapter.read(commitComponent(ctx, schedulePromises));
      if (schedulePromises.length) {
        return Promise.all(schedulePromises).then(() => {
          return ctx.adapter.read(getValue(ctx.ret));
        });
      }
      return result;
    } catch (err) {
      const diff3 = propagateError(ctx, err, schedulePromises);
      if (diff3) {
        return diff3.then(() => {
          if (schedulePromises.length) {
            return Promise.all(schedulePromises).then(() => {
              return ctx.adapter.read(getValue(ctx.ret));
            });
          }
        }).then(() => ctx.adapter.read(getValue(ctx.ret)));
      }
      if (schedulePromises.length) {
        return Promise.all(schedulePromises).then(() => {
          return ctx.adapter.read(getValue(ctx.ret));
        });
      }
      return ctx.adapter.read(getValue(ctx.ret));
    } finally {
      if (!isPromiseLike(diff2)) {
        setFlag(ctx.ret, IsRefreshing, false);
      }
    }
  }
  schedule(callback) {
    if (!callback) {
      return new Promise((resolve) => this.schedule(resolve));
    }
    const ctx = this[_ContextState];
    let callbacks = scheduleMap.get(ctx);
    if (!callbacks) {
      callbacks = /* @__PURE__ */ new Set();
      scheduleMap.set(ctx, callbacks);
    }
    callbacks.add(callback);
  }
  after(callback) {
    if (!callback) {
      return new Promise((resolve) => this.after(resolve));
    }
    const ctx = this[_ContextState];
    const root = ctx.root || ANONYMOUS_ROOT;
    let afterMap = afterMapByRoot.get(root);
    if (!afterMap) {
      afterMap = /* @__PURE__ */ new Map();
      afterMapByRoot.set(root, afterMap);
    }
    let callbacks = afterMap.get(ctx);
    if (!callbacks) {
      callbacks = /* @__PURE__ */ new Set();
      afterMap.set(ctx, callbacks);
    }
    callbacks.add(callback);
  }
  flush(callback) {
    console.error("Context.flush() method has been renamed to after()");
    this.after(callback);
  }
  cleanup(callback) {
    if (!callback) {
      return new Promise((resolve) => this.cleanup(resolve));
    }
    const ctx = this[_ContextState];
    if (getFlag(ctx.ret, IsUnmounted)) {
      const value = ctx.adapter.read(getValue(ctx.ret));
      callback(value);
      return;
    }
    let callbacks = cleanupMap.get(ctx);
    if (!callbacks) {
      callbacks = /* @__PURE__ */ new Set();
      cleanupMap.set(ctx, callbacks);
    }
    callbacks.add(callback);
  }
  consume(key) {
    for (let ctx = this[_ContextState].parent; ctx !== void 0; ctx = ctx.parent) {
      const provisions = provisionMaps.get(ctx);
      if (provisions && provisions.has(key)) {
        return provisions.get(key);
      }
    }
  }
  provide(key, value) {
    const ctx = this[_ContextState];
    let provisions = provisionMaps.get(ctx);
    if (!provisions) {
      provisions = /* @__PURE__ */ new Map();
      provisionMaps.set(ctx, provisions);
    }
    provisions.set(key, value);
  }
  [CustomEventTarget.dispatchEventOnSelf](ev) {
    const ctx = this[_ContextState];
    let propCallback = ctx.ret.el.props["on" + ev.type];
    if (typeof propCallback === "function") {
      propCallback(ev);
    } else {
      for (const propName in ctx.ret.el.props) {
        if (propName.toLowerCase() === "on" + ev.type.toLowerCase()) {
          propCallback = ctx.ret.el.props[propName];
          if (typeof propCallback === "function") {
            propCallback(ev);
          }
        }
      }
    }
  }
};
function diffComponent(adapter2, root, host, parent, scope, ret) {
  let ctx;
  if (ret.ctx) {
    ctx = ret.ctx;
    if (getFlag(ctx.ret, IsExecuting)) {
      console.error(`Component <${getTagName(ctx.ret.el.tag)}> is already executing`);
      return;
    } else if (ctx.schedule) {
      return ctx.schedule.promise.then(() => {
        return diffComponent(adapter2, root, host, parent, scope, ret);
      });
    }
  } else {
    ctx = ret.ctx = new ContextState(adapter2, root, host, parent, scope, ret);
  }
  setFlag(ctx.ret, IsUpdating);
  return enqueueComponent(ctx);
}
function diffComponentChildren(ctx, children, isYield) {
  if (getFlag(ctx.ret, IsUnmounted) || getFlag(ctx.ret, IsErrored)) {
    return;
  } else if (children === void 0) {
    console.error(`Component <${getTagName(ctx.ret.el.tag)}> has ${isYield ? "yielded" : "returned"} undefined. If this was intentional, ${isYield ? "yield" : "return"} null instead.`);
  }
  let diff2;
  try {
    setFlag(ctx.ret, IsExecuting);
    diff2 = diffChildren(ctx.adapter, ctx.root, ctx.host, ctx, ctx.scope, ctx.ret, narrow(children));
    if (diff2) {
      diff2 = diff2.catch((err) => handleChildError(ctx, err));
    }
  } catch (err) {
    diff2 = handleChildError(ctx, err);
  } finally {
    setFlag(ctx.ret, IsExecuting, false);
  }
  return diff2;
}
function enqueueComponent(ctx) {
  if (!ctx.inflight) {
    const [block, diff2] = runComponent(ctx);
    if (block) {
      ctx.inflight = [block.finally(() => advanceComponent(ctx)), diff2];
    }
    return diff2;
  } else if (!ctx.enqueued) {
    let resolve;
    ctx.enqueued = [
      new Promise((resolve1) => resolve = resolve1).finally(() => advanceComponent(ctx)),
      ctx.inflight[0].finally(() => {
        const [block, diff2] = runComponent(ctx);
        resolve(block);
        return diff2;
      })
    ];
  }
  return ctx.enqueued[1];
}
function advanceComponent(ctx) {
  ctx.inflight = ctx.enqueued;
  ctx.enqueued = void 0;
}
function runComponent(ctx) {
  if (getFlag(ctx.ret, IsUnmounted)) {
    return [void 0, void 0];
  }
  const ret = ctx.ret;
  const initial = !ctx.iterator;
  if (initial) {
    setFlag(ctx.ret, IsExecuting);
    clearEventListeners(ctx.ctx);
    let returned;
    try {
      returned = ret.el.tag.call(ctx.ctx, ret.el.props, ctx.ctx);
    } catch (err) {
      setFlag(ctx.ret, IsErrored);
      throw err;
    } finally {
      setFlag(ctx.ret, IsExecuting, false);
    }
    if (isIteratorLike(returned)) {
      ctx.iterator = returned;
    } else if (!isPromiseLike(returned)) {
      return [
        void 0,
        diffComponentChildren(ctx, returned, false)
      ];
    } else {
      const returned1 = returned instanceof Promise ? returned : Promise.resolve(returned);
      return [
        returned1.catch(NOOP),
        returned1.then((returned2) => diffComponentChildren(ctx, returned2, false), (err) => {
          setFlag(ctx.ret, IsErrored);
          throw err;
        })
      ];
    }
  }
  let iteration;
  if (initial) {
    try {
      setFlag(ctx.ret, IsExecuting);
      iteration = ctx.iterator.next();
    } catch (err) {
      setFlag(ctx.ret, IsErrored);
      throw err;
    } finally {
      setFlag(ctx.ret, IsExecuting, false);
    }
    if (isPromiseLike(iteration)) {
      setFlag(ctx.ret, IsAsyncGen);
    } else {
      setFlag(ctx.ret, IsSyncGen);
    }
  }
  if (getFlag(ctx.ret, IsSyncGen)) {
    if (!initial) {
      try {
        setFlag(ctx.ret, IsExecuting);
        const oldResult = ctx.adapter.read(getValue(ctx.ret));
        iteration = ctx.iterator.next(oldResult);
      } catch (err) {
        setFlag(ctx.ret, IsErrored);
        throw err;
      } finally {
        setFlag(ctx.ret, IsExecuting, false);
      }
    }
    if (isPromiseLike(iteration)) {
      throw new Error("Mixed generator component");
    }
    if (getFlag(ctx.ret, IsInForOfLoop) && !getFlag(ctx.ret, NeedsToYield) && !getFlag(ctx.ret, IsUnmounted) && !getFlag(ctx.ret, IsSchedulingRefresh)) {
      console.error(`Component <${getTagName(ctx.ret.el.tag)}> yielded/returned more than once in for...of loop`);
    }
    setFlag(ctx.ret, NeedsToYield, false);
    setFlag(ctx.ret, IsSchedulingRefresh, false);
    if (iteration.done) {
      setFlag(ctx.ret, IsSyncGen, false);
      ctx.iterator = void 0;
    }
    const diff2 = diffComponentChildren(ctx, iteration.value, !iteration.done);
    const block = isPromiseLike(diff2) ? diff2.catch(NOOP) : void 0;
    return [block, diff2];
  } else {
    if (getFlag(ctx.ret, IsInForAwaitOfLoop)) {
      pullComponent(ctx, iteration);
      const block = resumePropsAsyncIterator(ctx);
      return [block, ctx.pull && ctx.pull.diff];
    } else {
      resumePropsAsyncIterator(ctx);
      if (!initial) {
        try {
          setFlag(ctx.ret, IsExecuting);
          const oldResult = ctx.adapter.read(getValue(ctx.ret));
          iteration = ctx.iterator.next(oldResult);
        } catch (err) {
          setFlag(ctx.ret, IsErrored);
          throw err;
        } finally {
          setFlag(ctx.ret, IsExecuting, false);
        }
      }
      if (!isPromiseLike(iteration)) {
        throw new Error("Mixed generator component");
      }
      const diff2 = iteration.then((iteration2) => {
        if (getFlag(ctx.ret, IsInForAwaitOfLoop)) {
          pullComponent(ctx, iteration2);
        } else {
          if (getFlag(ctx.ret, IsInForOfLoop) && !getFlag(ctx.ret, NeedsToYield) && !getFlag(ctx.ret, IsUnmounted) && !getFlag(ctx.ret, IsSchedulingRefresh)) {
            console.error(`Component <${getTagName(ctx.ret.el.tag)}> yielded/returned more than once in for...of loop`);
          }
        }
        setFlag(ctx.ret, NeedsToYield, false);
        setFlag(ctx.ret, IsSchedulingRefresh, false);
        if (iteration2.done) {
          setFlag(ctx.ret, IsAsyncGen, false);
          ctx.iterator = void 0;
        }
        return diffComponentChildren(
          ctx,
          // Children can be void so we eliminate that here
          iteration2.value,
          !iteration2.done
        );
      }, (err) => {
        setFlag(ctx.ret, IsErrored);
        throw err;
      });
      return [diff2.catch(NOOP), diff2];
    }
  }
}
function resumePropsAsyncIterator(ctx) {
  if (ctx.onPropsProvided) {
    ctx.onPropsProvided(ctx.ret.el.props);
    ctx.onPropsProvided = void 0;
    setFlag(ctx.ret, PropsAvailable, false);
  } else {
    setFlag(ctx.ret, PropsAvailable);
    if (getFlag(ctx.ret, IsInForAwaitOfLoop)) {
      return new Promise((resolve) => ctx.onPropsRequested = resolve);
    }
  }
  return ctx.pull && ctx.pull.iterationP && ctx.pull.iterationP.then(NOOP, NOOP);
}
async function pullComponent(ctx, iterationP) {
  if (!iterationP || ctx.pull) {
    return;
  }
  ctx.pull = { iterationP: void 0, diff: void 0, onChildError: void 0 };
  let done = false;
  try {
    let childError;
    while (!done) {
      if (isPromiseLike(iterationP)) {
        ctx.pull.iterationP = iterationP;
      }
      let onDiff;
      ctx.pull.diff = new Promise((resolve) => onDiff = resolve).then(() => {
        if (!(getFlag(ctx.ret, IsUpdating) || getFlag(ctx.ret, IsRefreshing))) {
          commitComponent(ctx, []);
        }
      }, (err) => {
        if (!(getFlag(ctx.ret, IsUpdating) || getFlag(ctx.ret, IsRefreshing)) || // TODO: is this flag necessary?
        !getFlag(ctx.ret, NeedsToYield)) {
          return propagateError(ctx, err, []);
        }
        throw err;
      });
      let iteration;
      try {
        iteration = await iterationP;
      } catch (err) {
        done = true;
        setFlag(ctx.ret, IsErrored);
        setFlag(ctx.ret, NeedsToYield, false);
        onDiff(Promise.reject(err));
        break;
      }
      let oldResult;
      {
        let floating = true;
        const oldResult1 = new Promise((resolve, reject) => {
          ctx.ctx.schedule(resolve);
          ctx.pull.onChildError = (err) => {
            reject(err);
            if (floating) {
              childError = err;
              resumePropsAsyncIterator(ctx);
              return ctx.pull.diff;
            }
          };
        });
        oldResult1.catch(NOOP);
        oldResult = Object.create(oldResult1);
        oldResult.then = function(onfulfilled, onrejected) {
          floating = false;
          return oldResult1.then(onfulfilled, onrejected);
        };
        oldResult.catch = function(onrejected) {
          floating = false;
          return oldResult1.catch(onrejected);
        };
      }
      if (childError != null) {
        try {
          setFlag(ctx.ret, IsExecuting);
          if (typeof ctx.iterator.throw !== "function") {
            throw childError;
          }
          iteration = await ctx.iterator.throw(childError);
        } catch (err) {
          done = true;
          setFlag(ctx.ret, IsErrored);
          setFlag(ctx.ret, NeedsToYield, false);
          onDiff(Promise.reject(err));
          break;
        } finally {
          childError = void 0;
          setFlag(ctx.ret, IsExecuting, false);
        }
      }
      if (!getFlag(ctx.ret, IsInForAwaitOfLoop)) {
        setFlag(ctx.ret, PropsAvailable, false);
      }
      done = !!iteration.done;
      let diff2;
      try {
        if (!isPromiseLike(iterationP)) {
          diff2 = void 0;
        } else if (!getFlag(ctx.ret, NeedsToYield) && getFlag(ctx.ret, PropsAvailable) && getFlag(ctx.ret, IsInForAwaitOfLoop)) {
          diff2 = void 0;
        } else {
          diff2 = diffComponentChildren(ctx, iteration.value, !iteration.done);
        }
      } catch (err) {
        onDiff(Promise.reject(err));
      } finally {
        onDiff(diff2);
        setFlag(ctx.ret, NeedsToYield, false);
      }
      if (getFlag(ctx.ret, IsUnmounted)) {
        while ((!iteration || !iteration.done) && ctx.iterator && getFlag(ctx.ret, IsInForAwaitOfLoop)) {
          try {
            setFlag(ctx.ret, IsExecuting);
            iteration = await ctx.iterator.next(oldResult);
          } catch (err) {
            setFlag(ctx.ret, IsErrored);
            throw err;
          } finally {
            setFlag(ctx.ret, IsExecuting, false);
          }
        }
        if ((!iteration || !iteration.done) && ctx.iterator && typeof ctx.iterator.return === "function") {
          try {
            setFlag(ctx.ret, IsExecuting);
            await ctx.iterator.return();
          } catch (err) {
            setFlag(ctx.ret, IsErrored);
            throw err;
          } finally {
            setFlag(ctx.ret, IsExecuting, false);
          }
        }
        break;
      } else if (!getFlag(ctx.ret, IsInForAwaitOfLoop)) {
        break;
      } else if (!iteration.done) {
        try {
          setFlag(ctx.ret, IsExecuting);
          iterationP = ctx.iterator.next(oldResult);
        } finally {
          setFlag(ctx.ret, IsExecuting, false);
        }
      }
    }
  } finally {
    if (done) {
      setFlag(ctx.ret, IsAsyncGen, false);
      ctx.iterator = void 0;
    }
    ctx.pull = void 0;
  }
}
function commitComponent(ctx, schedulePromises, hydrationNodes) {
  if (ctx.schedule) {
    ctx.schedule.promise.then(() => {
      commitComponent(ctx, []);
      propagateComponent(ctx);
    });
    return getValue(ctx.ret);
  }
  const values = commitChildren(ctx.adapter, ctx.host, ctx, ctx.scope, ctx.root, ctx.ret, ctx.index, schedulePromises, hydrationNodes);
  if (getFlag(ctx.ret, IsUnmounted)) {
    return;
  }
  addEventTargetDelegates(ctx.ctx, values);
  const wasScheduling = getFlag(ctx.ret, IsScheduling);
  let schedulePromises1;
  const callbacks = scheduleMap.get(ctx);
  if (callbacks) {
    scheduleMap.delete(ctx);
    setFlag(ctx.ret, IsScheduling);
    const result = ctx.adapter.read(unwrap(values));
    for (const callback of callbacks) {
      const scheduleResult = callback(result);
      if (isPromiseLike(scheduleResult)) {
        (schedulePromises1 = schedulePromises1 || []).push(scheduleResult);
      }
    }
    if (schedulePromises1 && !getFlag(ctx.ret, DidCommit)) {
      const scheduleCallbacksP = Promise.all(schedulePromises1).then(() => {
        setFlag(ctx.ret, IsScheduling, wasScheduling);
        propagateComponent(ctx);
        if (ctx.ret.fallback) {
          unmount(ctx.adapter, ctx.host, ctx.parent, ctx.root, ctx.ret.fallback, false);
        }
        ctx.ret.fallback = void 0;
      });
      let onAbort;
      const scheduleP = safeRace([
        scheduleCallbacksP,
        new Promise((resolve) => onAbort = resolve)
      ]).finally(() => {
        ctx.schedule = void 0;
      });
      ctx.schedule = { promise: scheduleP, onAbort };
      schedulePromises.push(scheduleP);
    } else {
      setFlag(ctx.ret, IsScheduling, wasScheduling);
    }
  } else {
    setFlag(ctx.ret, IsScheduling, wasScheduling);
  }
  if (!getFlag(ctx.ret, IsScheduling)) {
    if (!getFlag(ctx.ret, IsUpdating)) {
      propagateComponent(ctx);
    }
    if (ctx.ret.fallback) {
      unmount(ctx.adapter, ctx.host, ctx.parent, ctx.root, ctx.ret.fallback, false);
    }
    ctx.ret.fallback = void 0;
    setFlag(ctx.ret, IsUpdating, false);
  }
  setFlag(ctx.ret, DidCommit);
  return getValue(ctx.ret, true);
}
function isRetainerActive(target, host) {
  const stack = [host];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === target) {
      return true;
    }
    const isHostBoundary = current !== host && (typeof current.el.tag === "string" && current.el.tag !== Fragment || current.el.tag === Portal);
    if (current.children && !isHostBoundary) {
      if (Array.isArray(current.children)) {
        for (const child of current.children) {
          if (child) {
            stack.push(child);
          }
        }
      } else {
        stack.push(current.children);
      }
    }
    if (current.fallback && !getFlag(current, DidDiff)) {
      stack.push(current.fallback);
    }
  }
  return false;
}
function propagateComponent(ctx) {
  const values = getChildValues(ctx.ret, ctx.index);
  addEventTargetDelegates(ctx.ctx, values, (ctx1) => ctx1[_ContextState].host === ctx.host);
  const host = ctx.host;
  const initiator = ctx.ret;
  if (!isRetainerActive(initiator, host)) {
    return;
  }
  if (!getFlag(host, DidCommit)) {
    return;
  }
  const props = stripSpecialProps(host.el.props);
  const hostChildren = getChildValues(host, 0);
  ctx.adapter.arrange({
    tag: host.el.tag,
    tagName: getTagName(host.el.tag),
    node: host.value,
    props,
    oldProps: props,
    children: hostChildren,
    scope: host.scope,
    root: ctx.root
  });
  flush(ctx.adapter, ctx.root, ctx);
}
async function unmountComponent(ctx, isNested) {
  if (getFlag(ctx.ret, IsUnmounted)) {
    return;
  }
  let cleanupPromises;
  const callbacks = cleanupMap.get(ctx);
  if (callbacks) {
    const oldResult = ctx.adapter.read(getValue(ctx.ret));
    cleanupMap.delete(ctx);
    for (const callback of callbacks) {
      const cleanup = callback(oldResult);
      if (isPromiseLike(cleanup)) {
        (cleanupPromises = cleanupPromises || []).push(cleanup);
      }
    }
  }
  let didLinger = false;
  if (!isNested && cleanupPromises && getChildValues(ctx.ret).length > 0) {
    didLinger = true;
    const index = ctx.index;
    const lingerers = ctx.host.lingerers || (ctx.host.lingerers = []);
    let set = lingerers[index];
    if (set == null) {
      set = /* @__PURE__ */ new Set();
      lingerers[index] = set;
    }
    set.add(ctx.ret);
    await Promise.all(cleanupPromises);
    set.delete(ctx.ret);
    if (set.size === 0) {
      lingerers[index] = void 0;
    }
    if (!lingerers.some(Boolean)) {
      ctx.host.lingerers = void 0;
    }
  }
  if (getFlag(ctx.ret, IsUnmounted)) {
    return;
  }
  setFlag(ctx.ret, IsUnmounted);
  if (ctx.schedule) {
    ctx.schedule.onAbort();
    ctx.schedule = void 0;
  }
  clearEventListeners(ctx.ctx);
  unmountChildren(ctx.adapter, ctx.host, ctx, ctx.root, ctx.ret, isNested);
  if (didLinger) {
    if (ctx.root != null) {
      ctx.adapter.finalize(ctx.root);
    }
  }
  if (ctx.iterator) {
    if (ctx.pull) {
      resumePropsAsyncIterator(ctx);
      return;
    }
    if (ctx.inflight) {
      await ctx.inflight[1];
    }
    let iteration;
    if (getFlag(ctx.ret, IsInForOfLoop)) {
      try {
        setFlag(ctx.ret, IsExecuting);
        const oldResult = ctx.adapter.read(getValue(ctx.ret));
        const iterationP = ctx.iterator.next(oldResult);
        if (isPromiseLike(iterationP)) {
          if (!getFlag(ctx.ret, IsAsyncGen)) {
            throw new Error("Mixed generator component");
          }
          iteration = await iterationP;
        } else {
          if (!getFlag(ctx.ret, IsSyncGen)) {
            throw new Error("Mixed generator component");
          }
          iteration = iterationP;
        }
      } catch (err) {
        setFlag(ctx.ret, IsErrored);
        throw err;
      } finally {
        setFlag(ctx.ret, IsExecuting, false);
      }
    }
    if ((!iteration || !iteration.done) && ctx.iterator && typeof ctx.iterator.return === "function") {
      try {
        setFlag(ctx.ret, IsExecuting);
        const iterationP = ctx.iterator.return();
        if (isPromiseLike(iterationP)) {
          if (!getFlag(ctx.ret, IsAsyncGen)) {
            throw new Error("Mixed generator component");
          }
          iteration = await iterationP;
        } else {
          if (!getFlag(ctx.ret, IsSyncGen)) {
            throw new Error("Mixed generator component");
          }
          iteration = iterationP;
        }
      } catch (err) {
        setFlag(ctx.ret, IsErrored);
        throw err;
      } finally {
        setFlag(ctx.ret, IsExecuting, false);
      }
    }
  }
}
function handleChildError(ctx, err) {
  if (!ctx.iterator) {
    throw err;
  }
  if (ctx.pull) {
    ctx.pull.onChildError(err);
    return ctx.pull.diff;
  }
  if (!ctx.iterator.throw) {
    throw err;
  }
  resumePropsAsyncIterator(ctx);
  let iteration;
  try {
    setFlag(ctx.ret, IsExecuting);
    iteration = ctx.iterator.throw(err);
  } catch (err2) {
    setFlag(ctx.ret, IsErrored);
    throw err2;
  } finally {
    setFlag(ctx.ret, IsExecuting, false);
  }
  if (isPromiseLike(iteration)) {
    return iteration.then((iteration2) => {
      if (iteration2.done) {
        setFlag(ctx.ret, IsSyncGen, false);
        setFlag(ctx.ret, IsAsyncGen, false);
        ctx.iterator = void 0;
      }
      return diffComponentChildren(ctx, iteration2.value, !iteration2.done);
    }, (err2) => {
      setFlag(ctx.ret, IsErrored);
      throw err2;
    });
  }
  if (iteration.done) {
    setFlag(ctx.ret, IsSyncGen, false);
    setFlag(ctx.ret, IsAsyncGen, false);
    ctx.iterator = void 0;
  }
  return diffComponentChildren(ctx, iteration.value, !iteration.done);
}
function propagateError(ctx, err, schedulePromises) {
  const parent = ctx.parent;
  if (!parent) {
    throw err;
  }
  let diff2;
  try {
    diff2 = handleChildError(parent, err);
  } catch (err2) {
    return propagateError(parent, err2, schedulePromises);
  }
  if (isPromiseLike(diff2)) {
    return diff2.then(() => void commitComponent(parent, schedulePromises), (err2) => propagateError(parent, err2, schedulePromises));
  }
  commitComponent(parent, schedulePromises);
}

// node_modules/@b9g/crank/dom.js
init_Buffer();
init_process();

// node_modules/@b9g/crank/_css.js
init_Buffer();
init_process();
function camelToKebabCase(str) {
  if (/^[A-Z]/.test(str)) {
    return `-${str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`).slice(1)}`;
  }
  return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}
var UNITLESS_PROPERTIES = /* @__PURE__ */ new Set([
  "animation-iteration-count",
  "aspect-ratio",
  "border-image-outset",
  "border-image-slice",
  "border-image-width",
  "box-flex",
  "box-flex-group",
  "box-ordinal-group",
  "column-count",
  "columns",
  "flex",
  "flex-grow",
  "flex-positive",
  "flex-shrink",
  "flex-negative",
  "flex-order",
  "font-weight",
  "grid-area",
  "grid-column",
  "grid-column-end",
  "grid-column-span",
  "grid-column-start",
  "grid-row",
  "grid-row-end",
  "grid-row-span",
  "grid-row-start",
  "line-height",
  "opacity",
  "order",
  "orphans",
  "tab-size",
  "widows",
  "z-index",
  "zoom"
]);
function formatStyleValue(name, value) {
  if (typeof value === "number") {
    if (UNITLESS_PROPERTIES.has(name)) {
      return String(value);
    }
    return `${value}px`;
  }
  return String(value);
}

// node_modules/@b9g/crank/_svg.js
init_Buffer();
init_process();
var REACT_SVG_PROPS = {
  accentHeight: "accent-height",
  alignmentBaseline: "alignment-baseline",
  arabicForm: "arabic-form",
  baselineShift: "baseline-shift",
  capHeight: "cap-height",
  clipPath: "clip-path",
  clipRule: "clip-rule",
  colorInterpolation: "color-interpolation",
  colorInterpolationFilters: "color-interpolation-filters",
  colorProfile: "color-profile",
  colorRendering: "color-rendering",
  dominantBaseline: "dominant-baseline",
  enableBackground: "enable-background",
  fillOpacity: "fill-opacity",
  fillRule: "fill-rule",
  floodColor: "flood-color",
  floodOpacity: "flood-opacity",
  fontFamily: "font-family",
  fontSize: "font-size",
  fontSizeAdjust: "font-size-adjust",
  fontStretch: "font-stretch",
  fontStyle: "font-style",
  fontVariant: "font-variant",
  fontWeight: "font-weight",
  glyphName: "glyph-name",
  glyphOrientationHorizontal: "glyph-orientation-horizontal",
  glyphOrientationVertical: "glyph-orientation-vertical",
  horizAdvX: "horiz-adv-x",
  horizOriginX: "horiz-origin-x",
  imageRendering: "image-rendering",
  letterSpacing: "letter-spacing",
  lightingColor: "lighting-color",
  markerEnd: "marker-end",
  markerMid: "marker-mid",
  markerStart: "marker-start",
  overlinePosition: "overline-position",
  overlineThickness: "overline-thickness",
  paintOrder: "paint-order",
  pointerEvents: "pointer-events",
  renderingIntent: "rendering-intent",
  shapeRendering: "shape-rendering",
  stopColor: "stop-color",
  stopOpacity: "stop-opacity",
  strikethroughPosition: "strikethrough-position",
  strikethroughThickness: "strikethrough-thickness",
  strokeDasharray: "stroke-dasharray",
  strokeDashoffset: "stroke-dashoffset",
  strokeLinecap: "stroke-linecap",
  strokeLinejoin: "stroke-linejoin",
  strokeMiterlimit: "stroke-miterlimit",
  strokeOpacity: "stroke-opacity",
  strokeWidth: "stroke-width",
  textAnchor: "text-anchor",
  textDecoration: "text-decoration",
  textRendering: "text-rendering",
  transformOrigin: "transform-origin",
  underlinePosition: "underline-position",
  underlineThickness: "underline-thickness",
  unicodeBidi: "unicode-bidi",
  unicodeRange: "unicode-range",
  unitsPerEm: "units-per-em",
  vAlphabetic: "v-alphabetic",
  vHanging: "v-hanging",
  vIdeographic: "v-ideographic",
  vMathematical: "v-mathematical",
  vectorEffect: "vector-effect",
  vertAdvY: "vert-adv-y",
  vertOriginX: "vert-origin-x",
  vertOriginY: "vert-origin-y",
  wordSpacing: "word-spacing",
  writingMode: "writing-mode",
  xHeight: "x-height",
  // xlink/xml namespace attributes (deprecated in SVG 2 but still used)
  xlinkActuate: "xlink:actuate",
  xlinkArcrole: "xlink:arcrole",
  xlinkHref: "xlink:href",
  xlinkRole: "xlink:role",
  xlinkShow: "xlink:show",
  xlinkTitle: "xlink:title",
  xlinkType: "xlink:type",
  xmlBase: "xml:base",
  xmlLang: "xml:lang",
  xmlSpace: "xml:space",
  xmlnsXlink: "xmlns:xlink"
};

// node_modules/@b9g/crank/dom.js
var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
var MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
function getRootDocument(root) {
  if (root && root.ownerDocument) {
    return root.ownerDocument;
  }
  if (root && root.nodeType === Node.DOCUMENT_NODE) {
    return root;
  }
  return document;
}
function isWritableProperty(element, name) {
  let propOwner = element;
  do {
    if (Object.prototype.hasOwnProperty.call(propOwner, name)) {
      break;
    }
  } while (propOwner = Object.getPrototypeOf(propOwner));
  if (propOwner === null) {
    return false;
  }
  const descriptor = Object.getOwnPropertyDescriptor(propOwner, name);
  if (descriptor != null && (descriptor.writable === true || descriptor.set !== void 0)) {
    return true;
  }
  return false;
}
function emitHydrationWarning(propName, quietProps, expectedValue, actualValue, element, displayName) {
  const checkName = propName;
  const showName = displayName || propName;
  if (!quietProps || !quietProps.has(checkName)) {
    if (expectedValue === null || expectedValue === false) {
      console.warn(`Expected "${showName}" to be missing but found ${String(actualValue)} while hydrating:`, element);
    } else if (expectedValue === true || expectedValue === "") {
      console.warn(`Expected "${showName}" to be ${expectedValue === true ? "present" : '""'} but found ${String(actualValue)} while hydrating:`, element);
    } else {
      const win = element.ownerDocument.defaultView;
      if (win && win.location) {
        const origin = win.location.origin;
        if (new URL(expectedValue, origin).href === new URL(actualValue, origin).href) {
          return;
        }
      }
      console.warn(`Expected "${showName}" to be "${String(expectedValue)}" but found ${String(actualValue)} while hydrating:`, element);
    }
  }
}
function patchProp(element, name, value, oldValue, props, isSVG, isMathML, copyProps, quietProps, isHydrating) {
  if (copyProps != null && copyProps.has(name)) {
    return;
  }
  const colonIndex = name.indexOf(":");
  if (colonIndex !== -1) {
    const [ns, name1] = [name.slice(0, colonIndex), name.slice(colonIndex + 1)];
    switch (ns) {
      case "prop":
        element[name1] = value;
        return;
      case "attr":
        if (value == null || value === false) {
          if (isHydrating && element.hasAttribute(name1)) {
            emitHydrationWarning(name, quietProps, value, element.getAttribute(name1), element);
          }
          element.removeAttribute(name1);
          return;
        } else if (value === true) {
          if (isHydrating && !element.hasAttribute(name1)) {
            emitHydrationWarning(name, quietProps, value, null, element);
          }
          element.setAttribute(name1, "");
          return;
        }
        if (typeof value !== "string") {
          value = String(value);
        }
        if (isHydrating && element.getAttribute(name1) !== value) {
          emitHydrationWarning(name, quietProps, value, element.getAttribute(name1), element);
        }
        element.setAttribute(name1, value);
        return;
    }
  }
  switch (name) {
    // TODO: fix hydration warnings for the style prop
    case "style": {
      const style = element.style;
      if (value == null || value === false) {
        if (isHydrating && style.cssText !== "") {
          emitHydrationWarning(name, quietProps, value, style.cssText, element);
        }
        element.removeAttribute("style");
      } else if (value === true) {
        if (isHydrating && style.cssText !== "") {
          emitHydrationWarning(name, quietProps, "", style.cssText, element);
        }
        element.setAttribute("style", "");
      } else if (typeof value === "string") {
        if (style.cssText !== value) {
          style.cssText = value;
        }
      } else {
        if (typeof oldValue === "string") {
          style.cssText = "";
        }
        if (oldValue) {
          for (const styleName in oldValue) {
            if (value && styleName in value)
              continue;
            const cssName = camelToKebabCase(styleName);
            if (isHydrating && style.getPropertyValue(cssName) !== "") {
              emitHydrationWarning(name, quietProps, null, style.getPropertyValue(cssName), element, `style.${styleName}`);
            }
            style.removeProperty(cssName);
          }
        }
        if (value) {
          for (const styleName in value) {
            const cssName = camelToKebabCase(styleName);
            const styleValue = value[styleName];
            if (styleValue == null) {
              if (isHydrating && style.getPropertyValue(cssName) !== "") {
                emitHydrationWarning(name, quietProps, null, style.getPropertyValue(cssName), element, `style.${styleName}`);
              }
              style.removeProperty(cssName);
            } else {
              const formattedValue = formatStyleValue(cssName, styleValue);
              if (style.getPropertyValue(cssName) !== formattedValue) {
                style.setProperty(cssName, formattedValue);
              }
            }
          }
        }
      }
      break;
    }
    case "class":
    case "className":
      if (name === "className" && "class" in props)
        break;
      if (value === true) {
        if (isHydrating && element.getAttribute("class") !== "") {
          emitHydrationWarning(name, quietProps, "", element.getAttribute("class"), element);
        }
        element.setAttribute("class", "");
      } else if (value == null) {
        if (isHydrating && element.hasAttribute("class")) {
          emitHydrationWarning(name, quietProps, value, element.getAttribute("class"), element);
        }
        element.removeAttribute("class");
      } else if (typeof value === "object") {
        if (typeof oldValue === "string") {
          element.setAttribute("class", "");
        }
        let shouldIssueWarning = false;
        const hydratingClasses = isHydrating ? new Set(Array.from(element.classList)) : void 0;
        const hydratingClassName = isHydrating ? element.getAttribute("class") : void 0;
        if (oldValue) {
          for (const classNames in oldValue) {
            if (value && value[classNames])
              continue;
            const classes = classNames.split(/\s+/).filter(Boolean);
            element.classList.remove(...classes);
          }
        }
        if (value) {
          for (const classNames in value) {
            if (!value[classNames])
              continue;
            const classes = classNames.split(/\s+/).filter(Boolean);
            element.classList.add(...classes);
            for (const className of classes) {
              if (hydratingClasses && hydratingClasses.has(className)) {
                hydratingClasses.delete(className);
              } else if (isHydrating) {
                shouldIssueWarning = true;
              }
            }
          }
        }
        if (shouldIssueWarning || hydratingClasses && hydratingClasses.size > 0) {
          emitHydrationWarning(name, quietProps, Object.keys(value).filter((k) => value[k]).join(" "), hydratingClassName || "", element);
        }
      } else if (!isSVG && !isMathML) {
        if (element.className !== value) {
          if (isHydrating) {
            emitHydrationWarning(name, quietProps, value, element.className, element);
          }
          element.className = value;
        }
      } else if (element.getAttribute("class") !== value) {
        if (isHydrating) {
          emitHydrationWarning(name, quietProps, value, element.getAttribute("class"), element);
        }
        element.setAttribute("class", value);
      }
      break;
    case "innerHTML":
      if (value !== oldValue) {
        if (isHydrating) {
          emitHydrationWarning(name, quietProps, value, element.innerHTML, element);
        }
        element.innerHTML = value;
      }
      break;
    case "dangerouslySetInnerHTML": {
      const htmlValue = value && typeof value === "object" && "__html" in value ? value.__html ?? "" : "";
      const oldHtmlValue = oldValue && typeof oldValue === "object" && "__html" in oldValue ? oldValue.__html ?? "" : "";
      if (htmlValue !== oldHtmlValue) {
        element.innerHTML = htmlValue;
      }
      break;
    }
    case "htmlFor":
      if ("for" in props)
        break;
      if (value == null || value === false) {
        element.removeAttribute("for");
      } else {
        element.setAttribute("for", String(value === true ? "" : value));
      }
      break;
    default: {
      if (name[0] === "o" && name[1] === "n" && name[2] === name[2].toUpperCase() && typeof value === "function") {
        name = name.toLowerCase();
      }
      if (isSVG && name in REACT_SVG_PROPS) {
        name = REACT_SVG_PROPS[name];
      }
      if (name in element && // boolean properties will coerce strings, but sometimes they map to
      // enumerated attributes, where truthy strings ("false", "no") map to
      // falsy properties, so we force using setAttribute.
      !(typeof value === "string" && typeof element[name] === "boolean") && isWritableProperty(element, name)) {
        let domValue = element[name];
        let propValue = value;
        if ((name === "src" || name === "href") && typeof value === "string" && typeof domValue === "string") {
          try {
            propValue = new URL(value, element.baseURI).href;
          } catch {
          }
        }
        if (propValue !== domValue || oldValue === void 0) {
          if (isHydrating && typeof element[name] === "string" && element[name] !== value) {
            emitHydrationWarning(name, quietProps, value, element[name], element);
          }
          element[name] = value;
        }
        return;
      }
      if (value === true) {
        value = "";
      } else if (value == null || value === false) {
        if (isHydrating && element.hasAttribute(name)) {
          emitHydrationWarning(name, quietProps, value, element.getAttribute(name), element);
        }
        element.removeAttribute(name);
        return;
      } else if (typeof value !== "string") {
        value = String(value);
      }
      if (element.getAttribute(name) !== value) {
        if (isHydrating) {
          emitHydrationWarning(name, quietProps, value, element.getAttribute(name), element);
        }
        element.setAttribute(name, value);
      }
    }
  }
}
var adapter = {
  scope({ scope: xmlns, tag, props, root }) {
    switch (tag) {
      case Portal: {
        const ns = root instanceof Element ? root.namespaceURI : null;
        xmlns = ns === SVG_NAMESPACE ? SVG_NAMESPACE : ns === MATHML_NAMESPACE ? MATHML_NAMESPACE : void 0;
        break;
      }
      case "svg":
        xmlns = SVG_NAMESPACE;
        break;
      case "math":
        xmlns = MATHML_NAMESPACE;
        break;
      case "foreignObject":
        xmlns = void 0;
        break;
    }
    return props.xmlns || xmlns;
  },
  create({ tag, tagName, scope: xmlns, root }) {
    if (typeof tag !== "string") {
      throw new Error(`Unknown tag: ${tagName}`);
    } else if (tag.toLowerCase() === "svg") {
      xmlns = SVG_NAMESPACE;
    } else if (tag.toLowerCase() === "math") {
      xmlns = MATHML_NAMESPACE;
    } else if (tag === "foreignObject") {
      xmlns = SVG_NAMESPACE;
    }
    const doc = getRootDocument(root);
    return xmlns ? doc.createElementNS(xmlns, tag) : doc.createElement(tag);
  },
  adopt({ tag, tagName, node, root }) {
    if (typeof tag !== "string" && tag !== Portal) {
      throw new Error(`Unknown tag: ${tagName}`);
    }
    const doc = getRootDocument(root);
    if (node === doc.body || node === doc.head || node === doc.documentElement || node === doc) {
      console.warn(`Hydrating ${node.nodeName.toLowerCase()} is discouraged as it is destructive and may remove unknown nodes.`);
    }
    if (node == null || typeof tag === "string" && (node.nodeType !== Node.ELEMENT_NODE || tag.toLowerCase() !== node.tagName.toLowerCase())) {
      console.warn(`Expected <${tagName}> while hydrating but found: `, node);
      return;
    }
    return Array.from(node.childNodes);
  },
  patch({ tag, tagName, node, props, oldProps, scope: xmlns, copyProps, quietProps, isHydrating }) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      throw new TypeError(`Cannot patch node: ${String(node)}`);
    } else if (props.class && props.className) {
      console.error(`Both "class" and "className" set in props for <${tagName}>. Use one or the other.`);
    }
    const element = node;
    const isSVG = xmlns === SVG_NAMESPACE || tag === "foreignObject";
    const isMathML = xmlns === MATHML_NAMESPACE;
    if (oldProps) {
      for (let name in oldProps) {
        if (name in props)
          continue;
        patchProp(element, name, void 0, oldProps[name], props, isSVG, isMathML, copyProps, quietProps, isHydrating);
      }
    }
    for (let name in props) {
      patchProp(element, name, props[name], oldProps ? oldProps[name] : void 0, props, isSVG, isMathML, copyProps, quietProps, isHydrating);
    }
  },
  arrange({ tag, node, props, children }) {
    if (tag === Portal && (node == null || typeof node.nodeType !== "number")) {
      throw new TypeError(`<Portal> root is not a node. Received: ${String(node)}`);
    }
    if (!("innerHTML" in props) && !("dangerouslySetInnerHTML" in props)) {
      let oldChild = node.firstChild;
      for (let i = 0; i < children.length; i++) {
        const newChild = children[i];
        if (oldChild === newChild) {
          oldChild = oldChild.nextSibling;
        } else {
          node.insertBefore(newChild, oldChild);
          if (tag !== Portal && oldChild && i + 1 < children.length && oldChild !== children[i + 1]) {
            oldChild = oldChild.nextSibling;
          }
        }
      }
    }
  },
  remove({ node, parentNode, isNested }) {
    if (!isNested && node.parentNode === parentNode) {
      parentNode.removeChild(node);
    }
  },
  text({ value, oldNode, hydrationNodes, root }) {
    const doc = getRootDocument(root);
    if (hydrationNodes != null) {
      let node = hydrationNodes.shift();
      if (!node || node.nodeType !== Node.TEXT_NODE) {
        console.warn(`Expected "${value}" while hydrating but found:`, node);
      } else {
        const textData = node.data;
        if (textData.length > value.length) {
          if (textData.startsWith(value)) {
            node.data = value;
            hydrationNodes.unshift(doc.createTextNode(textData.slice(value.length)));
            return node;
          }
        } else if (textData === value) {
          return node;
        }
        console.warn(`Expected "${value}" while hydrating but found:`, textData);
        oldNode = node;
      }
    }
    if (oldNode != null) {
      if (oldNode.data !== value) {
        oldNode.data = value;
      }
      return oldNode;
    }
    return doc.createTextNode(value);
  },
  raw({ value, scope: xmlns, hydrationNodes, root }) {
    let nodes;
    if (typeof value === "string") {
      const doc = getRootDocument(root);
      const el = xmlns == null ? doc.createElement("div") : xmlns === SVG_NAMESPACE ? doc.createElementNS(xmlns, "svg") : doc.createElementNS(xmlns, "math");
      el.innerHTML = value;
      nodes = Array.from(el.childNodes);
    } else {
      nodes = value == null ? [] : Array.isArray(value) ? [...value] : [value];
    }
    if (hydrationNodes != null) {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const hydrationNode = hydrationNodes.shift();
        if (hydrationNode && typeof hydrationNode === "object" && typeof hydrationNode.nodeType === "number" && node.isEqualNode(hydrationNode)) {
          nodes[i] = hydrationNode;
        } else {
          console.warn(`Expected <Raw value="${String(value)}"> while hydrating but found:`, hydrationNode);
        }
      }
    }
    return nodes.length === 0 ? void 0 : nodes.length === 1 ? nodes[0] : nodes;
  }
};
var DOMRenderer = class extends Renderer {
  constructor() {
    super(adapter);
  }
  render(children, root, ctx) {
    validateRoot(root);
    return super.render(children, root, ctx);
  }
  hydrate(children, root, ctx) {
    validateRoot(root);
    return super.hydrate(children, root, ctx);
  }
};
function validateRoot(root) {
  if (root == null || typeof root === "object" && typeof root.nodeType !== "number") {
    throw new TypeError(`Render root is not a node. Received: ${String(root)}`);
  } else if (root.nodeType !== Node.ELEMENT_NODE) {
    throw new TypeError(`Render root must be an element node. Received: ${String(root)}`);
  }
}
var renderer = new DOMRenderer();

// node_modules/@b9g/crankeditable/src/crank-editable.js
init_Buffer();
init_process();

// ../dist/src/contentarea.js
init_Buffer();
init_process();

// ../dist/src/_chunks/chunk-CETUMGXV.js
init_Buffer();
init_process();
var __defProp2 = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp2(target, name, { get: all[name], enumerable: true });
};

// ../dist/src/edit.js
init_Buffer();
init_process();
var subseq_exports = {};
__export(subseq_exports, {
  align: () => align,
  clear: () => clear,
  complement: () => complement,
  contains: () => contains,
  difference: () => difference,
  expand: () => expand,
  fill: () => fill,
  interleave: () => interleave,
  intersection: () => intersection,
  mask: () => mask,
  measure: () => measure,
  pushSegment: () => pushSegment,
  shrink: () => shrink,
  union: () => union
});
function measure(subseq) {
  let length = 0, includedLength = 0, excludedLength = 0;
  for (let i = 0; i < subseq.length; i++) {
    const s = subseq[i];
    length += s;
    if (i % 2 === 0) {
      excludedLength += s;
    } else {
      includedLength += s;
    }
  }
  return { length, includedLength, excludedLength };
}
function pushSegment(subseq, length, included) {
  if (length < 0) {
    throw new RangeError("Negative length");
  } else if (length === 0) {
    return;
  } else if (!subseq.length) {
    if (included) {
      subseq.push(0, length);
    } else {
      subseq.push(length);
    }
  } else {
    const included1 = subseq.length % 2 === 0;
    if (included === included1) {
      subseq[subseq.length - 1] += length;
    } else {
      subseq.push(length);
    }
  }
}
function contains(subseq, index) {
  if (index < 0) {
    return false;
  }
  for (let i = 0; i < subseq.length; i++) {
    index -= subseq[i];
    if (index < 0) {
      return i % 2 === 1;
    }
  }
  return false;
}
function clear(subseq) {
  const { length } = measure(subseq);
  return length ? [length] : [];
}
function fill(subseq) {
  const { length } = measure(subseq);
  return length ? [0, length] : [];
}
function complement(subseq) {
  return subseq[0] === 0 ? subseq.slice(1) : [0, ...subseq];
}
function align(subseq1, subseq2) {
  if (measure(subseq1).length !== measure(subseq2).length) {
    throw new Error("Length mismatch");
  }
  const result = [];
  for (let i1 = 0, i2 = 0, length1 = 0, length2 = 0, included1 = true, included2 = true; i1 < subseq1.length || i2 < subseq2.length; ) {
    if (length1 === 0) {
      if (i1 >= subseq1.length) {
        throw new Error("Length mismatch");
      }
      length1 = subseq1[i1++];
      included1 = !included1;
    }
    if (length2 === 0) {
      if (i2 >= subseq2.length) {
        throw new Error("Size mismatch");
      }
      length2 = subseq2[i2++];
      included2 = !included2;
    }
    if (length1 < length2) {
      if (length1) {
        result.push([length1, included1, included2]);
      }
      length2 = length2 - length1;
      length1 = 0;
    } else if (length1 > length2) {
      if (length2) {
        result.push([length2, included1, included2]);
      }
      length1 = length1 - length2;
      length2 = 0;
    } else {
      if (length1) {
        result.push([length1, included1, included2]);
      }
      length1 = length2 = 0;
    }
  }
  return result;
}
function union(subseq1, subseq2) {
  const result = [];
  for (const [length, included1, included2] of align(subseq1, subseq2)) {
    pushSegment(result, length, included1 || included2);
  }
  return result;
}
function intersection(subseq1, subseq2) {
  const result = [];
  for (const [length, included1, included2] of align(subseq1, subseq2)) {
    pushSegment(result, length, included1 && included2);
  }
  return result;
}
function difference(subseq1, subseq2) {
  const result = [];
  for (const [length, included1, included2] of align(subseq1, subseq2)) {
    pushSegment(result, length, included1 && !included2);
  }
  return result;
}
function shrink(subseq1, subseq2) {
  if (measure(subseq1).length !== measure(subseq2).length) {
    throw new Error("Length mismatch");
  }
  const result = [];
  for (const [length, included1, included2] of align(subseq1, subseq2)) {
    if (!included2) {
      pushSegment(result, length, included1);
    }
  }
  return result;
}
function expand(subseq1, subseq2) {
  if (measure(subseq1).length !== measure(subseq2).excludedLength) {
    throw new Error("Length mismatch");
  }
  const result = [];
  for (let i1 = 0, i2 = 0, length1 = 0, included1 = true, included2 = true; i2 < subseq2.length; i2++) {
    let length2 = subseq2[i2];
    included2 = !included2;
    if (included2) {
      pushSegment(result, length2, false);
    } else {
      while (length2) {
        if (length1 === 0) {
          length1 = subseq1[i1++];
          included1 = !included1;
        }
        const minLength = Math.min(length1, length2);
        pushSegment(result, minLength, included1);
        length1 -= minLength;
        length2 -= minLength;
      }
    }
  }
  return result;
}
function interleave(subseq1, subseq2) {
  if (measure(subseq1).excludedLength !== measure(subseq2).excludedLength) {
    throw new Error("Length mismatch");
  }
  const result1 = [];
  const result2 = [];
  for (let i1 = 0, i2 = 0, length1 = 0, length2 = 0, included1 = true, included2 = true; i1 < subseq1.length || i2 < subseq2.length; ) {
    if (length1 === 0 && i1 < subseq1.length) {
      length1 = subseq1[i1++];
      included1 = !included1;
    }
    if (length2 === 0 && i2 < subseq2.length) {
      length2 = subseq2[i2++];
      included2 = !included2;
    }
    if (included1 && included2) {
      pushSegment(result1, length1, true);
      pushSegment(result1, length2, false);
      pushSegment(result2, length1, false);
      pushSegment(result2, length2, true);
      length1 = length2 = 0;
    } else if (included1) {
      pushSegment(result1, length1, true);
      pushSegment(result2, length1, false);
      length1 = 0;
    } else if (included2) {
      pushSegment(result1, length2, false);
      pushSegment(result2, length2, true);
      length2 = 0;
    } else {
      const minLength = Math.min(length1, length2);
      pushSegment(result1, minLength, false);
      pushSegment(result2, minLength, false);
      length1 -= minLength;
      length2 -= minLength;
    }
  }
  return [result1, result2];
}
function mask(subseq1, subseq2) {
  const length2 = measure(subseq2).length;
  const result = [];
  let excludedPos = 0;
  let j = 0, pos2 = 0, included2 = false;
  let remaining2 = subseq2.length > 0 ? subseq2[0] : 0;
  for (let i = 0; i < subseq1.length; i++) {
    const len = subseq1[i];
    if (i % 2 === 0) {
      pushSegment(result, len, false);
      excludedPos += len;
    } else {
      while (pos2 + remaining2 <= excludedPos && j < subseq2.length - 1) {
        pos2 += remaining2;
        j++;
        included2 = j % 2 === 1;
        remaining2 = subseq2[j];
      }
      pushSegment(
        result,
        len,
        excludedPos > 0 && excludedPos < length2 && included2 && pos2 < excludedPos
      );
    }
  }
  return result;
}
var Edit = class _Edit {
  constructor(parts) {
    validateEditParts(parts);
    this.parts = parts;
  }
  /** A string which represents a concatenation of all insertions. */
  get inserted() {
    let text = "";
    for (let i = 2; i < this.parts.length; i += 3) {
      const inserted = this.parts[i];
      text += inserted;
    }
    return text;
  }
  /** A string which represents a concatenation of all deletions. */
  get deleted() {
    let text = "";
    for (let i = 1; i < this.parts.length; i += 3) {
      const deleted = this.parts[i];
      text += deleted;
    }
    return text;
  }
  /**
   * Returns an array of operations, which is more readable than the parts
   * array.
   *
   *   new Edit([0, "old", "new", 3, "", "", 6]).operations();
   *   [
   *     {type: "delete", start: 0, end: 3, value: "old"},
   *     {type: "insert", start: 0, value: "new"},
   *     {type: "retain", start: 3, end: 6},
   *   ]
   *
   * When insertions and deletions happen at the same index, deletions will
   * always appear before insertions in the operations array (deletion-first format).
   */
  operations() {
    const operations = [];
    let currentPos = 0;
    if (this.parts.length === 1) {
      const finalPos2 = this.parts[0];
      if (finalPos2 > 0) {
        operations.push({
          type: "retain",
          start: 0,
          end: finalPos2
        });
      }
      return operations;
    }
    for (let i = 0; i < this.parts.length - 1; i += 3) {
      const position = this.parts[i];
      const deleted = this.parts[i + 1];
      const inserted = this.parts[i + 2];
      if (position > currentPos) {
        operations.push({
          type: "retain",
          start: currentPos,
          end: position
        });
      }
      if (deleted) {
        operations.push({
          type: "delete",
          start: position,
          end: position + deleted.length,
          value: deleted
        });
      }
      if (inserted) {
        operations.push({
          type: "insert",
          start: position,
          value: inserted
        });
      }
      currentPos = position + deleted.length;
    }
    const finalPos = this.parts[this.parts.length - 1];
    if (finalPos > currentPos) {
      operations.push({
        type: "retain",
        start: currentPos,
        end: finalPos
      });
    }
    return operations;
  }
  apply(text) {
    let result = "";
    let sourcePos = 0;
    const operations = this.operations();
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      switch (op.type) {
        case "retain":
          result += text.slice(sourcePos, sourcePos + (op.end - op.start));
          sourcePos += op.end - op.start;
          break;
        case "delete":
          sourcePos += op.end - op.start;
          break;
        case "insert":
          result += op.value;
          break;
      }
    }
    return result;
  }
  /** Composes two consecutive edits. */
  compose(that) {
    let [insertSeqA, insertedA, deleteSeqA, deletedA] = factor(this);
    let [insertSeqB, insertedB, deleteSeqB, deletedB] = factor(that);
    deleteSeqA = expand(deleteSeqA, insertSeqA);
    deleteSeqB = expand(deleteSeqB, deleteSeqA);
    [deleteSeqA, insertSeqB] = interleave(deleteSeqA, insertSeqB);
    deleteSeqB = expand(deleteSeqB, insertSeqB);
    insertSeqA = expand(insertSeqA, insertSeqB);
    {
      const toggleSeq = intersection(insertSeqA, deleteSeqB);
      if (measure(toggleSeq).includedLength) {
        deleteSeqA = shrink(deleteSeqA, toggleSeq);
        insertedA = erase(insertSeqA, insertedA, toggleSeq);
        insertSeqA = shrink(insertSeqA, toggleSeq);
        deletedB = erase(deleteSeqB, deletedB, toggleSeq);
        deleteSeqB = shrink(deleteSeqB, toggleSeq);
        insertSeqB = shrink(insertSeqB, toggleSeq);
      }
    }
    const insertSeq = union(insertSeqA, insertSeqB);
    const inserted = consolidate(insertSeqA, insertedA, insertSeqB, insertedB);
    const deleteSeq = shrink(union(deleteSeqA, deleteSeqB), insertSeq);
    const deleted = consolidate(deleteSeqA, deletedA, deleteSeqB, deletedB);
    return synthesize(insertSeq, inserted, deleteSeq, deleted).normalize();
  }
  invert() {
    let [insertSeq, inserted, deleteSeq, deleted] = factor(this);
    deleteSeq = expand(deleteSeq, insertSeq);
    insertSeq = shrink(insertSeq, deleteSeq);
    return synthesize(deleteSeq, deleted, insertSeq, inserted);
  }
  /**
   * Transforms two concurrent edits against the same base document.
   *
   * Given edits A and B both applicable to the same document s0, returns
   * [A', B'] such that:
   *   B'.apply(A.apply(s0)) === A'.apply(B.apply(s0))
   *
   * A' is A adjusted to apply after B has been applied.
   * B' is B adjusted to apply after A has been applied.
   *
   * When both edits insert at the same position, `this` (A) gets left
   * priority (its insertion appears first in the converged result).
   */
  transform(that) {
    const [insertSeqL, insertedL, deleteSeqL, deletedL] = factor(this);
    const [insertSeqR, insertedR, deleteSeqR, deletedR] = factor(that);
    const maskL = mask(insertSeqL, deleteSeqR);
    const maskR = mask(insertSeqR, deleteSeqL);
    const hasCanceledL = measure(maskL).includedLength > 0;
    const hasCanceledR = measure(maskR).includedLength > 0;
    const insertSeqL1 = hasCanceledL ? shrink(insertSeqL, maskL) : insertSeqL;
    const insertedL1 = hasCanceledL ? erase(insertSeqL, insertedL, maskL) : insertedL;
    const insertSeqR1 = hasCanceledR ? shrink(insertSeqR, maskR) : insertSeqR;
    const insertedR1 = hasCanceledR ? erase(insertSeqR, insertedR, maskR) : insertedR;
    const [insertSeqL2, insertSeqR2] = interleave(insertSeqL1, insertSeqR1);
    const insertSeqUnion = union(insertSeqL2, insertSeqR2);
    const deleteSeqL1 = expand(deleteSeqL, insertSeqUnion);
    const deleteSeqR1 = expand(deleteSeqR, insertSeqUnion);
    const deleteOnlyL = difference(deleteSeqL1, deleteSeqR1);
    const deleteOnlyR = difference(deleteSeqR1, deleteSeqL1);
    const deleteOverlap = intersection(deleteSeqL, deleteSeqR);
    const deletedL1 = erase(deleteSeqL, deletedL, deleteOverlap);
    const deletedR1 = erase(deleteSeqR, deletedR, deleteOverlap);
    const insertSeqL3 = shrink(insertSeqL2, deleteSeqR1);
    const deleteOnlyL1 = shrink(deleteOnlyL, deleteSeqR1);
    const deleteSeqL2 = shrink(deleteOnlyL1, insertSeqL3);
    const insertSeqR3 = shrink(insertSeqR2, deleteSeqL1);
    const deleteOnlyR1 = shrink(deleteOnlyR, deleteSeqL1);
    const deleteSeqR2 = shrink(deleteOnlyR1, insertSeqR3);
    let resultL = synthesize(insertSeqL3, insertedL1, deleteSeqL2, deletedL1).normalize();
    let resultR = synthesize(insertSeqR3, insertedR1, deleteSeqR2, deletedR1).normalize();
    if (hasCanceledR) {
      const canceledTextR = erase(insertSeqR, insertedR, difference(insertSeqR, maskR));
      const canceledSeqR = shrink(maskR, expand(deleteSeqR, insertSeqR));
      resultL = synthesize(clear(canceledSeqR), "", canceledSeqR, canceledTextR).compose(resultL);
    }
    if (hasCanceledL) {
      const canceledTextL = erase(insertSeqL, insertedL, difference(insertSeqL, maskL));
      const canceledSeqL = shrink(maskL, expand(deleteSeqL, insertSeqL));
      resultR = synthesize(clear(canceledSeqL), "", canceledSeqL, canceledTextL).compose(resultR);
    }
    return [resultL, resultR];
  }
  normalize() {
    const insertSeq = [];
    const deleteSeq = [];
    let inserted = "";
    let deleted = "";
    let insertion;
    const operations = this.operations();
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      switch (op.type) {
        case "insert": {
          insertion = op.value;
          break;
        }
        case "retain": {
          if (insertion !== void 0) {
            pushSegment(insertSeq, insertion.length, true);
            inserted += insertion;
            insertion = void 0;
          }
          pushSegment(insertSeq, op.end - op.start, false);
          pushSegment(deleteSeq, op.end - op.start, false);
          break;
        }
        case "delete": {
          const length = op.end - op.start;
          const deletion = op.value;
          let prefix = 0;
          let suffix = 0;
          if (insertion !== void 0) {
            if (insertion === deletion) {
              prefix = deletion.length;
            } else {
              prefix = commonPrefixLength(insertion, deletion);
              const insertionRemainder = insertion.slice(prefix);
              const deletionRemainder = deletion.slice(prefix);
              suffix = commonSuffixLength(
                insertionRemainder,
                deletionRemainder
              );
            }
            pushSegment(insertSeq, prefix, false);
            pushSegment(insertSeq, insertion.length - prefix - suffix, true);
            inserted += insertion.slice(prefix, insertion.length - suffix);
          }
          deleted += deletion.slice(prefix, deletion.length - suffix);
          pushSegment(deleteSeq, prefix, false);
          pushSegment(deleteSeq, length - prefix - suffix, true);
          pushSegment(deleteSeq, suffix, false);
          pushSegment(insertSeq, length - prefix - suffix, false);
          pushSegment(insertSeq, suffix, false);
          insertion = void 0;
          break;
        }
      }
    }
    if (insertion !== void 0) {
      pushSegment(insertSeq, insertion.length, true);
      inserted += insertion;
    }
    const result = synthesize(insertSeq, inserted, deleteSeq, deleted);
    if (result.parts.length <= 1) {
      return result;
    }
    const compactedParts = [];
    for (let i = 0; i < result.parts.length - 1; i += 3) {
      const position = result.parts[i];
      const deleted2 = result.parts[i + 1];
      const inserted2 = result.parts[i + 2];
      if (deleted2 && inserted2) {
        const prefixLen = commonPrefixLength(deleted2, inserted2);
        const deletedRemainder = deleted2.slice(prefixLen);
        const insertedRemainder = inserted2.slice(prefixLen);
        const suffixLen = commonSuffixLength(
          deletedRemainder,
          insertedRemainder
        );
        if (prefixLen > 0 || suffixLen > 0) {
          const optimizedDeleted = deleted2.slice(
            prefixLen,
            deleted2.length - suffixLen
          );
          const optimizedInserted = inserted2.slice(
            prefixLen,
            inserted2.length - suffixLen
          );
          const optimizedPosition = position + prefixLen;
          if (optimizedDeleted || optimizedInserted) {
            compactedParts.push(
              optimizedPosition,
              optimizedDeleted,
              optimizedInserted
            );
          }
        } else {
          compactedParts.push(position, deleted2, inserted2);
        }
      } else {
        compactedParts.push(position, deleted2, inserted2);
      }
    }
    compactedParts.push(result.parts[result.parts.length - 1]);
    return new _Edit(compactedParts);
  }
  hasChangesBetween(start, end) {
    const ops = this.operations();
    for (const op of ops) {
      switch (op.type) {
        case "delete": {
          if (start <= op.start && op.start <= end || start <= op.end && op.end <= end) {
            return true;
          }
          break;
        }
        case "insert": {
          if (start <= op.start && op.start <= end) {
            return true;
          }
          break;
        }
      }
    }
    return false;
  }
  static builder(value = "") {
    let index = 0;
    let inserted = "";
    let deleted = "";
    const insertSeq = [];
    const deleteSeq = [];
    return {
      retain(length) {
        if (value != null && value !== "") {
          length = Math.min(value.length - index, length);
        }
        if (length > 0) {
          index += length;
          pushSegment(insertSeq, length, false);
          pushSegment(deleteSeq, length, false);
        }
        return this;
      },
      delete(length) {
        if (value != null && value !== "") {
          length = Math.min(value.length - index, length);
          deleted += value.slice(index, index + length);
        }
        index += length;
        pushSegment(insertSeq, length, false);
        pushSegment(deleteSeq, length, true);
        return this;
      },
      insert(value2) {
        pushSegment(insertSeq, value2.length, true);
        inserted += value2;
        return this;
      },
      concat(edit) {
        const ops = edit.operations();
        for (const op of ops) {
          switch (op.type) {
            case "delete":
              this.delete(op.end - op.start);
              break;
            case "insert":
              this.insert(op.value);
              break;
            case "retain":
              this.retain(op.end - op.start);
              break;
          }
        }
        if (value != null && index > value.length) {
          throw new RangeError("Edit is longer than original value");
        }
        return this;
      },
      build() {
        if (value != null && index < value.length) {
          pushSegment(insertSeq, value.length - index, false);
          pushSegment(deleteSeq, value.length - index, false);
        }
        return synthesize(insertSeq, inserted, deleteSeq, deleted);
      }
    };
  }
  /**
   * Given two strings, this method finds an edit which can be applied to the
   * first string to result in the second.
   *
   * @param startHint - An optional hint can be provided to disambiguate edits
   * which cannot be inferred by comparing the text alone. For example,
   * inserting "a" into the string "aaaa" to make it "aaaaa" could be an
   * insertion at any index in the string. This value should be the smaller of
   * the start indices of the selection from before and after the edit.
   */
  static diff(text1, text2, startHint) {
    let prefix = commonPrefixLength(text1, text2);
    let suffix = commonSuffixLength(text1, text2);
    if (prefix + suffix > Math.min(text1.length, text2.length)) {
      if (startHint != null && startHint >= 0) {
        prefix = Math.min(prefix, startHint);
      }
      suffix = commonSuffixLength(text1.slice(prefix), text2.slice(prefix));
    }
    return _Edit.builder(text1).retain(prefix).insert(text2.slice(prefix, text2.length - suffix)).delete(text1.length - prefix - suffix).retain(suffix).build();
  }
};
function synthesize(insertSeq, inserted, deleteSeq, deleted) {
  if (measure(insertSeq).includedLength !== inserted.length) {
    throw new Error("insertSeq and inserted string do not match in length");
  } else if (measure(deleteSeq).includedLength !== deleted.length) {
    throw new Error("deleteSeq and deleted string do not match in length");
  }
  const parts = [];
  let insertIndex = 0;
  let deleteIndex = 0;
  let position = 0;
  let pendingPos = -1;
  let pendingDeleted = "";
  let pendingInserted = "";
  function flushPending() {
    if (pendingPos >= 0 && (pendingDeleted || pendingInserted)) {
      parts.push(pendingPos, pendingDeleted, pendingInserted);
      pendingPos = -1;
      pendingDeleted = "";
      pendingInserted = "";
    }
  }
  const expandedDeleteSeq = expand(deleteSeq, insertSeq);
  for (const [length, deleting, inserting] of align(
    expandedDeleteSeq,
    insertSeq
  )) {
    if (deleting || inserting) {
      const deletedText = deleting ? deleted.slice(deleteIndex, deleteIndex + length) : "";
      const insertedText = inserting ? inserted.slice(insertIndex, insertIndex + length) : "";
      if (pendingPos >= 0 && position === pendingPos + pendingDeleted.length) {
        pendingDeleted += deletedText;
        pendingInserted += insertedText;
      } else {
        flushPending();
        pendingPos = position;
        pendingDeleted = deletedText;
        pendingInserted = insertedText;
      }
      if (deleting) {
        deleteIndex += length;
      }
      if (inserting) {
        insertIndex += length;
      }
    }
    if (!inserting || deleting) {
      position += length;
    }
  }
  flushPending();
  const totalLength = measure(deleteSeq).length;
  parts.push(totalLength);
  return new Edit(parts);
}
function commonPrefixLength(text1, text2) {
  let min = 0;
  let max = Math.min(text1.length, text2.length);
  let mid = max;
  while (min < mid) {
    if (text1.slice(min, mid) === text2.slice(min, mid)) {
      min = mid;
    } else {
      max = mid;
    }
    mid = Math.floor((max - min) / 2 + min);
  }
  return mid;
}
function commonSuffixLength(text1, text2) {
  let min = 0;
  let max = Math.min(text1.length, text2.length);
  let mid = max;
  while (min < mid) {
    if (text1.slice(text1.length - mid, text1.length - min) === text2.slice(text2.length - mid, text2.length - min)) {
      min = mid;
    } else {
      max = mid;
    }
    mid = Math.floor((max - min) / 2 + min);
  }
  return mid;
}
function factor(edit) {
  const insertSeq = [];
  const deleteSeq = [];
  let inserted = "";
  let deleted = "";
  const operations = edit.operations();
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    switch (op.type) {
      case "retain": {
        const length = op.end - op.start;
        pushSegment(insertSeq, length, false);
        pushSegment(deleteSeq, length, false);
        break;
      }
      case "delete": {
        const length = op.end - op.start;
        pushSegment(insertSeq, length, false);
        pushSegment(deleteSeq, length, true);
        deleted += op.value;
        break;
      }
      case "insert":
        pushSegment(insertSeq, op.value.length, true);
        inserted += op.value;
        break;
    }
  }
  return [insertSeq, inserted, deleteSeq, deleted];
}
function consolidate(subseq1, text1, subseq2, text2) {
  let i1 = 0;
  let i2 = 0;
  let result = "";
  for (const [length, included1, included2] of align(subseq1, subseq2)) {
    if (included1 && included2) {
      throw new Error("Overlapping subseqs");
    } else if (included1) {
      result += text1.slice(i1, i1 + length);
      i1 += length;
    } else if (included2) {
      result += text2.slice(i2, i2 + length);
      i2 += length;
    }
  }
  return result;
}
function erase(subseq1, str, subseq2) {
  let i = 0;
  let result = "";
  for (const [length, included1, included2] of align(subseq1, subseq2)) {
    if (included1) {
      if (!included2) {
        result += str.slice(i, i + length);
      }
      i += length;
    } else if (included2) {
      throw new Error("Non-overlapping subseqs");
    }
  }
  return result;
}
function validateEditParts(parts) {
  if (parts.length === 0) {
    throw new Error("Edit parts cannot be empty");
  }
  if (parts.length !== 1 && (parts.length - 1) % 3 !== 0) {
    throw new Error(
      `Edit parts length ${parts.length} is invalid - must be 1 or (operations * 3 + 1)`
    );
  }
  if (parts.length === 1) {
    if (typeof parts[0] !== "number") {
      throw new Error("Single-element edit must be a number (final position)");
    }
    if (parts[0] < 0) {
      throw new Error("Final position cannot be negative");
    }
    return;
  }
  const finalPos = parts[parts.length - 1];
  if (typeof finalPos !== "number") {
    throw new Error("Final position must be a number");
  }
  if (finalPos < 0) {
    throw new Error("Final position cannot be negative");
  }
  let previousPos = -1;
  for (let i = 0; i < parts.length - 1; i += 3) {
    const position = parts[i];
    const deleted = parts[i + 1];
    const inserted = parts[i + 2];
    if (typeof position !== "number") {
      throw new Error(
        `Position at index ${i} must be a number, got ${typeof position}`
      );
    }
    if (typeof deleted !== "string") {
      throw new Error(
        `Deleted at index ${i + 1} must be a string, got ${typeof deleted}`
      );
    }
    if (typeof inserted !== "string") {
      throw new Error(
        `Inserted at index ${i + 2} must be a string, got ${typeof inserted}`
      );
    }
    if (position < 0) {
      throw new Error(`Position ${position} at index ${i} cannot be negative`);
    }
    if (position <= previousPos) {
      throw new Error(
        `Position ${position} at index ${i} must be > previous end position ${previousPos}`
      );
    }
    const deletionEnd = position + deleted.length;
    const nextIndex = i + 3;
    if (nextIndex < parts.length - 1) {
      const nextPos = parts[nextIndex];
      if (deletionEnd > nextPos) {
        throw new Error(
          `Deletion at position ${position} extends to ${deletionEnd}, exceeding next position ${nextPos}`
        );
      }
    } else {
      if (deletionEnd > finalPos) {
        throw new Error(
          `Deletion at position ${position} extends to ${deletionEnd}, exceeding final position ${finalPos}`
        );
      }
    }
    previousPos = deletionEnd;
  }
  if (previousPos > finalPos) {
    throw new Error(
      `Operations extend to position ${previousPos}, exceeding final position ${finalPos}`
    );
  }
}

// ../dist/src/contentarea.js
var _cache = /* @__PURE__ */ Symbol.for("ContentArea._cache");
var _observer = /* @__PURE__ */ Symbol.for("ContentArea._observer");
var _onselectionchange = /* @__PURE__ */ Symbol.for("ContentArea._onselectionchange");
var _value = /* @__PURE__ */ Symbol.for("ContentArea._value");
var _selectionRange = /* @__PURE__ */ Symbol.for("ContentArea._selectionRange");
var _staleValue = /* @__PURE__ */ Symbol.for("ContentArea._staleValue");
var _staleSelectionRange = /* @__PURE__ */ Symbol.for("ContentArea._slateSelectionRange");
var _compositionBuffer = /* @__PURE__ */ Symbol.for("ContentArea._compositionBuffer");
var _compositionStartValue = /* @__PURE__ */ Symbol.for("ContentArea._compositionStartValue");
var _compositionSelectionRange = /* @__PURE__ */ Symbol.for(
  "ContentArea._compositionSelectionRange"
);
var ContentAreaElement = class extends HTMLElement {
  constructor() {
    super();
    this[_cache] = /* @__PURE__ */ new Map();
    this[_observer] = new MutationObserver((records) => {
      if (this[_compositionBuffer]) {
        this[_compositionBuffer].push(...records);
      }
      validate(this, records);
    });
    this[_onselectionchange] = () => {
      this[_selectionRange] = getSelectionRange(this);
    };
    this[_value] = "";
    this[_selectionRange] = { start: 0, end: 0, direction: "none" };
    this[_staleValue] = void 0;
    this[_staleSelectionRange] = void 0;
    this[_compositionBuffer] = void 0;
    this[_compositionStartValue] = void 0;
    this[_compositionSelectionRange] = void 0;
  }
  /******************************/
  /*** Custom Element methods ***/
  /******************************/
  connectedCallback() {
    this[_observer].observe(this, {
      subtree: true,
      childList: true,
      characterData: true,
      characterDataOldValue: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: [
        "data-content",
        "data-contentbefore",
        "data-contentafter"
      ]
    });
    document.addEventListener(
      "selectionchange",
      this[_onselectionchange],
      // We use capture in an attempt to run before other event listeners.
      true
    );
    validate(this);
    this[_onselectionchange]();
    let processCompositionTimeout;
    this.addEventListener("compositionstart", () => {
      clearTimeout(processCompositionTimeout);
      if (processCompositionTimeout == null) {
        this[_compositionBuffer] = [];
        this[_compositionStartValue] = this[_value];
        this[_compositionSelectionRange] = { ...this[_selectionRange] };
      }
      processCompositionTimeout = void 0;
    });
    const processComposition = () => {
      if (this[_compositionBuffer] && this[_compositionBuffer].length > 0 && this[_compositionStartValue] !== void 0 && this[_compositionSelectionRange] !== void 0) {
        const edit = Edit.diff(
          this[_compositionStartValue],
          this[_value],
          this[_compositionSelectionRange].start
        );
        const ev = new ContentEvent("contentchange", {
          detail: { edit, source: null, mutations: this[_compositionBuffer] }
        });
        this.dispatchEvent(ev);
        this[_staleValue] = void 0;
        this[_staleSelectionRange] = void 0;
      }
      this[_compositionBuffer] = void 0;
      this[_compositionStartValue] = void 0;
      this[_compositionSelectionRange] = void 0;
      processCompositionTimeout = void 0;
    };
    this.addEventListener("compositionend", () => {
      clearTimeout(processCompositionTimeout);
      processCompositionTimeout = setTimeout(processComposition);
    });
    this.addEventListener("blur", () => {
      clearTimeout(processCompositionTimeout);
      processComposition();
    });
    this.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this[_compositionBuffer]) {
        clearTimeout(processCompositionTimeout);
        processComposition();
      }
    });
  }
  disconnectedCallback() {
    this[_cache].clear();
    this[_value] = "";
    this[_observer].disconnect();
    if (document) {
      document.removeEventListener(
        "selectionchange",
        this[_onselectionchange],
        true
      );
    }
  }
  get value() {
    validate(this);
    return this[_staleValue] == null ? this[_value] : this[_staleValue];
  }
  get selectionStart() {
    validate(this);
    const range = this[_staleSelectionRange] || this[_selectionRange];
    return range.start;
  }
  set selectionStart(start) {
    validate(this);
    const { end, direction } = getSelectionRange(this);
    setSelectionRange(this, { start, end, direction });
  }
  get selectionEnd() {
    validate(this);
    const range = this[_staleSelectionRange] || this[_selectionRange];
    return range.end;
  }
  set selectionEnd(end) {
    validate(this);
    const { start, direction } = getSelectionRange(this);
    setSelectionRange(this, { start, end, direction });
  }
  get selectionDirection() {
    validate(this);
    const range = this[_staleSelectionRange] || this[_selectionRange];
    return range.direction;
  }
  set selectionDirection(direction) {
    validate(this);
    const { start, end } = getSelectionRange(this);
    setSelectionRange(this, { start, end, direction });
  }
  getSelectionRange() {
    validate(this);
    const range = this[_staleSelectionRange] || this[_selectionRange];
    return { ...range };
  }
  setSelectionRange(start, end, direction = "none") {
    validate(this);
    setSelectionRange(this, { start, end, direction });
  }
  indexAt(node, offset) {
    validate(this);
    return indexAt(this, node, offset);
  }
  nodeOffsetAt(index) {
    validate(this);
    return nodeOffsetAt(this, index);
  }
  source(source) {
    return validate(this, this[_observer].takeRecords(), source);
  }
};
var PreventDefaultSource = /* @__PURE__ */ Symbol.for("ContentArea.PreventDefaultSource");
var ContentEvent = class extends CustomEvent {
  constructor(typeArg, eventInit) {
    super(typeArg, { bubbles: true, ...eventInit });
  }
  preventDefault() {
    if (this.defaultPrevented) {
      return;
    }
    super.preventDefault();
    const area = this.target;
    area[_staleValue] = area[_value];
    area[_staleSelectionRange] = area[_selectionRange];
    const records = this.detail.mutations;
    for (let i = records.length - 1; i >= 0; i--) {
      const record = records[i];
      switch (record.type) {
        case "childList": {
          for (let j = 0; j < record.addedNodes.length; j++) {
            const node = record.addedNodes[j];
            if (node.parentNode) {
              node.parentNode.removeChild(node);
            }
          }
          for (let j = 0; j < record.removedNodes.length; j++) {
            const node = record.removedNodes[j];
            record.target.insertBefore(node, record.nextSibling);
          }
          break;
        }
        case "characterData": {
          if (record.oldValue !== null) {
            record.target.data = record.oldValue;
          }
          break;
        }
        case "attributes": {
          if (record.oldValue === null) {
            record.target.removeAttribute(record.attributeName);
          } else {
            record.target.setAttribute(
              record.attributeName,
              record.oldValue
            );
          }
          break;
        }
      }
    }
    const records1 = area[_observer].takeRecords();
    validate(area, records1, PreventDefaultSource);
  }
};
var IS_OLD = 1 << 0;
var IS_VALID = 1 << 1;
var IS_BLOCKLIKE = 1 << 2;
var PREPENDS_NEWLINE = 1 << 3;
var APPENDS_NEWLINE = 1 << 4;
var NodeInfo = class {
  constructor(offset) {
    this.f = 0;
    this.offset = offset;
    this.length = 0;
    this.beforeLength = 0;
    this.afterLength = 0;
  }
};
function validate(_this, records = _this[_observer].takeRecords(), source = null) {
  if (typeof _this !== "object" || _this[_cache] == null) {
    throw new TypeError("this is not a ContentAreaElement");
  } else if (!document.contains(_this)) {
    throw new Error(
      "ContentArea cannot be read before it is inserted into the DOM"
    );
  }
  if (!invalidate(_this, records)) {
    return false;
  }
  const oldValue = _this[_value];
  const edit = diff(_this, oldValue, _this[_selectionRange].start);
  _this[_value] = edit.apply(oldValue);
  _this[_selectionRange] = getSelectionRange(_this);
  if (source !== PreventDefaultSource && !_this[_compositionBuffer]) {
    const ev = new ContentEvent("contentchange", {
      detail: { edit, source, mutations: records }
    });
    _this.dispatchEvent(ev);
    _this[_staleValue] = void 0;
    _this[_staleSelectionRange] = void 0;
  }
  return true;
}
function invalidate(_this, records) {
  const cache = _this[_cache];
  if (!cache.get(_this)) {
    return true;
  }
  let invalid = false;
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    for (let j = 0; j < record.addedNodes.length; j++) {
      const addedNode = record.addedNodes[j];
      clear2(addedNode, cache);
    }
    for (let j = 0; j < record.removedNodes.length; j++) {
      clear2(record.removedNodes[j], cache);
    }
    let node = record.target;
    if (node === _this) {
      invalid = true;
      continue;
    } else if (!_this.contains(node)) {
      clear2(node, cache);
      continue;
    }
    for (; node !== _this; node = node.parentNode) {
      if (!cache.has(node)) {
        break;
      }
      const nodeInfo = cache.get(node);
      if (nodeInfo) {
        nodeInfo.f &= ~IS_VALID;
      }
      invalid = true;
    }
  }
  if (invalid) {
    const nodeInfo = cache.get(_this);
    nodeInfo.f &= ~IS_VALID;
  }
  return invalid;
}
function clear2(parent, cache) {
  const walker = document.createTreeWalker(
    parent,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
  );
  for (let node = parent; node !== null; node = walker.nextNode()) {
    cache.delete(node);
  }
}
var NEWLINE = "\n";
function diff(_this, oldValue, oldSelectionStart) {
  var _a;
  const walker = document.createTreeWalker(
    _this,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
  );
  const cache = _this[_cache];
  const stack = [];
  let nodeInfo;
  let value = "";
  for (let node = _this, descending = true, offset = 0, oldIndex = 0, oldIndexRelative = 0, hasNewline = false; ; node = walker.currentNode) {
    if (descending) {
      nodeInfo = cache.get(node);
      if (nodeInfo === void 0) {
        cache.set(node, nodeInfo = new NodeInfo(0));
        if (isBlocklikeElement(node)) {
          nodeInfo.f |= IS_BLOCKLIKE;
        }
      }
      if (offset && !hasNewline && nodeInfo.f & IS_BLOCKLIKE) {
        hasNewline = true;
        offset += NEWLINE.length;
        value += NEWLINE;
        if (nodeInfo.f & PREPENDS_NEWLINE) {
          oldIndex += NEWLINE.length;
        }
        nodeInfo.f |= PREPENDS_NEWLINE;
      } else {
        if (nodeInfo.f & PREPENDS_NEWLINE) {
          oldIndex += NEWLINE.length;
        }
        nodeInfo.f &= ~PREPENDS_NEWLINE;
      }
      if (nodeInfo.f & IS_OLD) {
        const expectedOffset = oldIndex - oldIndexRelative;
        const deleteLength = nodeInfo.offset - expectedOffset;
        if (deleteLength < 0) {
          throw new Error("cache offset error");
        } else if (deleteLength > 0) {
          oldIndex += deleteLength;
        }
      }
      nodeInfo.offset = offset;
      descending = false;
      if (nodeInfo.f & IS_VALID) {
        if (nodeInfo.length) {
          value += oldValue.slice(oldIndex, oldIndex + nodeInfo.length);
          oldIndex += nodeInfo.length;
          offset += nodeInfo.length;
          hasNewline = oldValue.slice(Math.max(0, oldIndex - NEWLINE.length), oldIndex) === NEWLINE;
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.data;
        if (text.length) {
          value += text;
          offset += text.length;
          hasNewline = text.endsWith(NEWLINE);
        }
        if (nodeInfo.f & IS_OLD) {
          oldIndex += nodeInfo.length;
        }
      } else if (node.nodeName === "BR") {
        value += NEWLINE;
        offset += NEWLINE.length;
        hasNewline = true;
        if (nodeInfo.f & IS_OLD) {
          oldIndex += nodeInfo.length;
        }
      } else if (node !== _this && node.hasAttribute("data-content")) {
        const text = node.getAttribute("data-content") || "";
        if (text.length) {
          value += text;
          offset += text.length;
          hasNewline = text.endsWith(NEWLINE);
        }
        nodeInfo.beforeLength = 0;
        nodeInfo.afterLength = 0;
        if (nodeInfo.f & IS_OLD) {
          oldIndex += nodeInfo.length;
        }
      } else {
        const beforeText = node !== _this ? ((_a = node.getAttribute) == null ? void 0 : _a.call(node, "data-contentbefore")) || "" : "";
        descending = !!walker.firstChild();
        if (descending) {
          stack.push({ nodeInfo, oldIndexRelative });
          oldIndexRelative = oldIndex;
          if (nodeInfo.f & IS_OLD) {
            oldIndex += nodeInfo.beforeLength;
          }
          nodeInfo.beforeLength = beforeText.length;
          offset = beforeText.length;
          if (beforeText.length) {
            value += beforeText;
            hasNewline = beforeText.endsWith(NEWLINE);
          }
        } else {
          if (beforeText.length) {
            value += beforeText;
            offset += beforeText.length;
            hasNewline = beforeText.endsWith(NEWLINE);
          }
          if (nodeInfo.f & IS_OLD) {
            oldIndex += nodeInfo.beforeLength;
          }
          nodeInfo.beforeLength = beforeText.length;
        }
      }
    } else {
      if (!stack.length) {
        throw new Error("Stack is empty");
      }
      ({ nodeInfo, oldIndexRelative } = stack.pop());
      offset = nodeInfo.offset + offset;
    }
    if (!descending) {
      if (!(nodeInfo.f & IS_VALID)) {
        if (node !== _this && node.nodeType === Node.ELEMENT_NODE && node.nodeName !== "BR" && !node.hasAttribute("data-content")) {
          const afterText = node.getAttribute("data-contentafter") || "";
          if (afterText.length) {
            value += afterText;
            offset += afterText.length;
            hasNewline = afterText.endsWith(NEWLINE);
          }
          if (nodeInfo.f & IS_OLD) {
            oldIndex += nodeInfo.afterLength;
          }
          nodeInfo.afterLength = afterText.length;
        }
        if (nodeInfo.f & APPENDS_NEWLINE && node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute("data-content")) {
          oldIndex += NEWLINE.length;
        }
        if (!hasNewline && nodeInfo.f & IS_BLOCKLIKE) {
          value += NEWLINE;
          offset += NEWLINE.length;
          hasNewline = true;
          nodeInfo.f |= APPENDS_NEWLINE;
        } else {
          nodeInfo.f &= ~APPENDS_NEWLINE;
        }
        nodeInfo.length = offset - nodeInfo.offset;
        nodeInfo.f |= IS_VALID;
      }
      nodeInfo.f |= IS_OLD;
      descending = !!walker.nextSibling();
      if (!descending) {
        if (walker.currentNode === _this) {
          break;
        }
        walker.parentNode();
      }
    }
    if (oldIndex > oldValue.length) {
      throw new Error("cache length error");
    }
  }
  const selectionStart = getSelectionRange(_this).start;
  return Edit.diff(
    oldValue,
    value,
    Math.min(oldSelectionStart, selectionStart)
  );
}
var BLOCKLIKE_DISPLAYS = /* @__PURE__ */ new Set([
  "block",
  "flex",
  "grid",
  "flow-root",
  "list-item",
  "table",
  "table-row-group",
  "table-header-group",
  "table-footer-group",
  "table-row",
  "table-caption"
]);
function isBlocklikeElement(node) {
  return node.nodeType === Node.ELEMENT_NODE && BLOCKLIKE_DISPLAYS.has(
    // handle two-value display syntax like `display: block flex`
    getComputedStyle(node).display.split(" ")[0]
  );
}
function indexAt(_this, node, offset) {
  const cache = _this[_cache];
  if (node == null || !_this.contains(node)) {
    return -1;
  }
  if (!cache.has(node)) {
    offset = 0;
    while (!cache.has(node)) {
      node = node.parentNode;
    }
  }
  let index;
  if (node.nodeType === Node.TEXT_NODE) {
    const nodeInfo = cache.get(node);
    index = offset + nodeInfo.offset;
    node = node.parentNode;
  } else {
    if (offset <= 0) {
      index = 0;
    } else if (offset >= node.childNodes.length) {
      const nodeInfo = cache.get(node);
      index = nodeInfo.length - nodeInfo.afterLength;
      if (nodeInfo.f & APPENDS_NEWLINE) {
        index -= NEWLINE.length;
      }
    } else {
      let child = node.childNodes[offset];
      while (child !== null && !cache.has(child)) {
        child = child.previousSibling;
      }
      if (child === null) {
        index = 0;
      } else {
        node = child;
        const nodeInfo = cache.get(node);
        index = nodeInfo.f & PREPENDS_NEWLINE ? -NEWLINE.length : 0;
      }
    }
  }
  for (; node !== _this; node = node.parentNode) {
    const nodeInfo = cache.get(node);
    index += nodeInfo.offset;
  }
  return index;
}
function nodeOffsetAt(_this, index) {
  if (index < 0) {
    return [null, 0];
  }
  const [node, offset] = findNodeOffset(_this, index);
  if (node && node.nodeName === "BR") {
    return nodeOffsetFromChild(node);
  }
  return [node, offset];
}
function findNodeOffset(_this, index) {
  const cache = _this[_cache];
  const walker = document.createTreeWalker(
    _this,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
  );
  for (let node2 = _this; node2 !== null; ) {
    const nodeInfo = cache.get(node2);
    if (nodeInfo == null) {
      return nodeOffsetFromChild(node2, index > 0);
    }
    if (nodeInfo.f & PREPENDS_NEWLINE) {
      index -= 1;
    }
    if (index === nodeInfo.length && node2.nodeType === Node.TEXT_NODE) {
      return [node2, node2.data.length];
    } else if (index >= nodeInfo.length) {
      index -= nodeInfo.length;
      const nextSibling = walker.nextSibling();
      if (nextSibling === null) {
        if (node2 === _this) {
          return [node2, getNodeLength(node2)];
        }
        return nodeOffsetFromChild(walker.currentNode, true);
      }
      node2 = nextSibling;
    } else {
      if (node2.nodeType === Node.ELEMENT_NODE) {
        if (node2.hasAttribute("data-content")) {
          return nodeOffsetFromChild(node2, index > 0);
        }
        const ni = cache.get(node2);
        if (ni.beforeLength > 0) {
          if (index < ni.beforeLength) {
            return [node2, 0];
          }
          index -= ni.beforeLength;
        }
      }
      const firstChild = walker.firstChild();
      if (firstChild === null) {
        const offset = node2.nodeType === Node.TEXT_NODE ? index : Math.min(index > 0 ? 1 : 0, getNodeLength(node2));
        return [node2, offset];
      } else {
        node2 = firstChild;
      }
    }
  }
  const node = walker.currentNode;
  return [node, getNodeLength(node)];
}
function getNodeLength(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.data.length;
  }
  return node.childNodes.length;
}
function nodeOffsetFromChild(node, after = false) {
  const parentNode = node.parentNode;
  if (parentNode === null) {
    return [null, 0];
  }
  let offset = Array.from(parentNode.childNodes).indexOf(node);
  if (after) {
    offset++;
  }
  return [parentNode, offset];
}
function getSelectionRange(_this) {
  const selection = document.getSelection();
  if (!selection) {
    return { start: 0, end: 0, direction: "none" };
  }
  const { focusNode, focusOffset, anchorNode, anchorOffset, isCollapsed } = selection;
  const focus = Math.max(0, indexAt(_this, focusNode, focusOffset));
  const anchor = isCollapsed ? focus : Math.max(0, indexAt(_this, anchorNode, anchorOffset));
  return {
    start: Math.min(focus, anchor),
    end: Math.max(focus, anchor),
    direction: focus < anchor ? "backward" : focus > anchor ? "forward" : "none"
  };
}
function setSelectionRange(_this, { start, end, direction }) {
  const selection = document.getSelection();
  if (!selection) {
    return;
  }
  start = Math.max(0, start || 0);
  end = Math.max(0, end || 0);
  if (end < start) {
    start = end;
  }
  const [focus, anchor] = direction === "backward" ? [start, end] : [end, start];
  if (focus === anchor) {
    const [node, offset] = nodeOffsetAt(_this, focus);
    selection.collapse(node, offset);
  } else {
    const [anchorNode, anchorOffset] = nodeOffsetAt(_this, anchor);
    const [focusNode, focusOffset] = nodeOffsetAt(_this, focus);
    if (anchorNode === null && focusNode === null) {
      selection.collapse(null);
    } else if (anchorNode === null) {
      selection.collapse(focusNode, focusOffset);
    } else if (focusNode === null) {
      selection.collapse(anchorNode, anchorOffset);
    } else {
      selection.setBaseAndExtent(
        anchorNode,
        anchorOffset,
        focusNode,
        focusOffset
      );
    }
  }
}

// ../dist/src/state.js
init_Buffer();
init_process();

// ../dist/src/history.js
init_Buffer();
init_process();
function isNoop(edit) {
  const operations = edit.operations();
  return operations.length === 1 && operations[0].type === "retain";
}
function isComplex(edit) {
  let count = 0;
  for (const op of edit.operations()) {
    if (op.type !== "retain") {
      count++;
      if (count > 1) {
        return true;
      }
    }
  }
  return false;
}
var EditHistory = class {
  current;
  undoStack;
  redoStack;
  constructor() {
    this.current = void 0;
    this.undoStack = [];
    this.redoStack = [];
  }
  checkpoint() {
    if (this.current) {
      this.undoStack.push(this.current);
      this.current = void 0;
    }
  }
  append(edit) {
    if (isNoop(edit)) {
      return;
    } else if (this.redoStack.length) {
      this.redoStack.length = 0;
    }
    if (this.current) {
      const oldEdit = this.current;
      if (!isComplex(oldEdit) && !isComplex(edit)) {
        this.current = oldEdit.compose(edit);
        return;
      } else {
        this.checkpoint();
      }
    }
    this.current = edit;
  }
  canUndo() {
    return !!(this.current || this.undoStack.length);
  }
  undo() {
    this.checkpoint();
    const edit = this.undoStack.pop();
    if (edit) {
      this.redoStack.push(edit);
      return edit.invert();
    }
  }
  canRedo() {
    return !!this.redoStack.length;
  }
  redo() {
    this.checkpoint();
    const edit = this.redoStack.pop();
    if (edit) {
      this.undoStack.push(edit);
      return edit;
    }
  }
};

// ../dist/src/keyer.js
init_Buffer();
init_process();
var Keyer = class {
  nextKey;
  keys;
  constructor() {
    this.nextKey = 0;
    this.keys = /* @__PURE__ */ new Map();
  }
  keyAt(i) {
    if (!this.keys.has(i)) {
      this.keys.set(i, this.nextKey++);
    }
    return this.keys.get(i);
  }
  transform(edit) {
    const operations = edit.operations();
    for (let i = operations.length - 1; i >= 0; i--) {
      const op = operations[i];
      switch (op.type) {
        case "delete": {
          for (let j = op.start + 1; j <= op.end; j++) {
            this.keys.delete(j);
          }
          this.keys = adjustKeysAfterDelete(
            this.keys,
            op.start,
            op.end - op.start
          );
          break;
        }
        case "insert": {
          this.keys = shiftKeysAfterInsert(
            this.keys,
            op.start,
            op.value.length
          );
          break;
        }
      }
    }
  }
};
function adjustKeysAfterDelete(keys, start, length) {
  const newKeys = /* @__PURE__ */ new Map();
  keys.forEach((value, key) => {
    if (key > start) {
      newKeys.set(key - length, value);
    } else {
      newKeys.set(key, value);
    }
  });
  return newKeys;
}
function shiftKeysAfterInsert(keys, start, length) {
  const newKeys = /* @__PURE__ */ new Map();
  keys.forEach((value, key) => {
    if (key >= start) {
      newKeys.set(key + length, value);
    } else {
      newKeys.set(key, value);
    }
  });
  return newKeys;
}

// ../dist/src/state.js
function selectionRangeFromEdit(edit) {
  const ops = edit.operations();
  let newIndex = 0;
  let start;
  let end;
  for (const op of ops) {
    switch (op.type) {
      case "retain":
        newIndex += op.end - op.start;
        break;
      case "delete":
        if (start === void 0)
          start = newIndex;
        end = newIndex;
        break;
      case "insert":
        if (start === void 0)
          start = newIndex;
        newIndex += op.value.length;
        end = newIndex;
        break;
    }
  }
  if (start === void 0)
    return void 0;
  return { start, end, direction: "none" };
}
var EditableState = class {
  #value;
  #history;
  #keyer;
  #selection;
  #source;
  get value() {
    return this.#value;
  }
  get history() {
    return this.#history;
  }
  get keyer() {
    return this.#keyer;
  }
  get selection() {
    return this.#selection;
  }
  get source() {
    return this.#source;
  }
  constructor(options) {
    this.#value = (options == null ? void 0 : options.value) ?? "";
    this.#history = new EditHistory();
    this.#keyer = new Keyer();
    this.#selection = void 0;
    this.#source = null;
  }
  applyEdit(edit, options) {
    let source;
    let recordHistory = true;
    if (typeof options === "string") {
      source = options;
    } else if (options) {
      source = options.source;
      recordHistory = options.history ?? true;
    }
    edit = edit.normalize();
    this.#value = edit.apply(this.#value);
    this.#keyer.transform(edit);
    if (recordHistory && source !== "history") {
      this.#history.append(edit);
    }
    this.#selection = selectionRangeFromEdit(edit);
    this.#source = source ?? null;
  }
  setValue(newValue, options) {
    const edit = Edit.diff(this.#value, newValue);
    this.applyEdit(edit, options);
  }
  undo() {
    const edit = this.#history.undo();
    if (!edit)
      return false;
    this.applyEdit(edit, "history");
    return true;
  }
  redo() {
    const edit = this.#history.redo();
    if (!edit)
      return false;
    this.applyEdit(edit, "history");
    return true;
  }
  canUndo() {
    return this.#history.canUndo();
  }
  canRedo() {
    return this.#history.canRedo();
  }
  checkpoint() {
    this.#history.checkpoint();
  }
  reset(value = "") {
    this.#value = value;
    this.#history = new EditHistory();
    this.#keyer = new Keyer();
    this.#selection = void 0;
    this.#source = "reset";
  }
};

// node_modules/@b9g/crankeditable/src/crank-editable.js
function* CrankEditable({ state, children }) {
  if (!customElements.get("content-area")) {
    customElements.define("content-area", ContentAreaElement);
  }
  let lastEditSelection;
  let pendingSelection;
  let area;
  let initial = true;
  const dispatchStateChange = () => {
    this.dispatchEvent(new Event("statechange", { bubbles: true }));
  };
  this.addEventListener("contentchange", (ev) => {
    const { edit, source } = ev.detail;
    if (source === "render") {
      return;
    }
    if (initial) {
      initial = false;
      return;
    }
    const target = ev.target;
    pendingSelection = target.getSelectionRange();
    ev.preventDefault();
    state.applyEdit(edit);
    lastEditSelection = pendingSelection;
    dispatchStateChange();
  });
  this.addEventListener("beforeinput", (ev) => {
    const { inputType } = ev;
    switch (inputType) {
      case "historyUndo": {
        ev.preventDefault();
        if (state.undo()) {
          lastEditSelection = state.selection;
          dispatchStateChange();
        }
        break;
      }
      case "historyRedo": {
        ev.preventDefault();
        if (state.redo()) {
          lastEditSelection = state.selection;
          dispatchStateChange();
        }
        break;
      }
    }
  });
  this.addEventListener("keydown", (ev) => {
    const kev = ev;
    const mod = kev.metaKey || kev.ctrlKey;
    if (!mod)
      return;
    let handled = false;
    if (kev.key === "z" || kev.key === "Z") {
      kev.preventDefault();
      handled = kev.shiftKey ? state.redo() : state.undo();
    } else if (kev.key === "y" && kev.ctrlKey && !kev.metaKey) {
      kev.preventDefault();
      handled = state.redo();
    }
    if (handled) {
      lastEditSelection = state.selection;
      dispatchStateChange();
    }
  });
  const onselectionchange = () => {
    if (!area)
      return;
    const sel = area.getSelectionRange();
    if (lastEditSelection && (lastEditSelection.start !== sel.start || lastEditSelection.end !== sel.end)) {
      state.checkpoint();
    }
    lastEditSelection = sel;
  };
  document.addEventListener("selectionchange", onselectionchange);
  this.cleanup(() => {
    document.removeEventListener("selectionchange", onselectionchange);
  });
  let oldSelectionRange;
  for ({ state, children } of this) {
    const selectionRange = pendingSelection ?? state.selection ?? oldSelectionRange;
    pendingSelection = void 0;
    this.after((el) => {
      area = el;
      el.source("render");
      if (selectionRange) {
        el.setSelectionRange(
          selectionRange.start,
          selectionRange.end,
          selectionRange.direction
        );
        const sel = document.getSelection();
        if (sel && sel.focusNode) {
          const focusEl = sel.focusNode.nodeType === Node.ELEMENT_NODE ? sel.focusNode : sel.focusNode.parentElement;
          if (focusEl) {
            focusEl.scrollIntoView({ block: "nearest", inline: "nearest" });
          }
        }
      }
    });
    const areaEl = yield createElement(
      "content-area",
      null,
      children
    );
    oldSelectionRange = areaEl.getSelectionRange();
  }
}

// src/clients/demos.tsx
var import_parser = __toESM(require_dist(), 1);

// src/utils/prism.ts
init_Buffer();
init_process();
var import_prismjs = __toESM(require_prism(), 1);

// node_modules/prismjs/components/prism-javascript.js
init_Buffer();
init_process();
Prism.languages.javascript = Prism.languages.extend("clike", {
  "class-name": [
    Prism.languages.clike["class-name"],
    {
      pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
      lookbehind: true
    }
  ],
  "keyword": [
    {
      pattern: /((?:^|\})\s*)catch\b/,
      lookbehind: true
    },
    {
      pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
      lookbehind: true
    }
  ],
  // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
  "function": /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
  "number": {
    pattern: RegExp(
      /(^|[^\w$])/.source + "(?:" + // constant
      (/NaN|Infinity/.source + "|" + // binary integer
      /0[bB][01]+(?:_[01]+)*n?/.source + "|" + // octal integer
      /0[oO][0-7]+(?:_[0-7]+)*n?/.source + "|" + // hexadecimal integer
      /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source + "|" + // decimal bigint
      /\d+(?:_\d+)*n/.source + "|" + // decimal number (integer or float) but no bigint
      /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source) + ")" + /(?![\w$])/.source
    ),
    lookbehind: true
  },
  "operator": /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
});
Prism.languages.javascript["class-name"][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;
Prism.languages.insertBefore("javascript", "keyword", {
  "regex": {
    pattern: RegExp(
      // lookbehind
      // eslint-disable-next-line regexp/no-dupe-characters-character-class
      /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source + // Regex pattern:
      // There are 2 regex patterns here. The RegExp set notation proposal added support for nested character
      // classes if the `v` flag is present. Unfortunately, nested CCs are both context-free and incompatible
      // with the only syntax, so we have to define 2 different regex patterns.
      /\//.source + "(?:" + /(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source + "|" + // `v` flag syntax. This supports 3 levels of nested character classes.
      /(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source + ")" + // lookahead
      /(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
    ),
    lookbehind: true,
    greedy: true,
    inside: {
      "regex-source": {
        pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
        lookbehind: true,
        alias: "language-regex",
        inside: Prism.languages.regex
      },
      "regex-delimiter": /^\/|\/$/,
      "regex-flags": /^[a-z]+$/
    }
  },
  // This must be declared before keyword because we use "function" inside the look-forward
  "function-variable": {
    pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
    alias: "function"
  },
  "parameter": [
    {
      pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
      lookbehind: true,
      inside: Prism.languages.javascript
    },
    {
      pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
      lookbehind: true,
      inside: Prism.languages.javascript
    },
    {
      pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
      lookbehind: true,
      inside: Prism.languages.javascript
    },
    {
      pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
      lookbehind: true,
      inside: Prism.languages.javascript
    }
  ],
  "constant": /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});
Prism.languages.insertBefore("javascript", "string", {
  "hashbang": {
    pattern: /^#!.*/,
    greedy: true,
    alias: "comment"
  },
  "template-string": {
    pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
    greedy: true,
    inside: {
      "template-punctuation": {
        pattern: /^`|`$/,
        alias: "string"
      },
      "interpolation": {
        pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
        lookbehind: true,
        inside: {
          "interpolation-punctuation": {
            pattern: /^\$\{|\}$/,
            alias: "punctuation"
          },
          rest: Prism.languages.javascript
        }
      },
      "string": /[\s\S]+/
    }
  },
  "string-property": {
    pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
    lookbehind: true,
    greedy: true,
    alias: "property"
  }
});
Prism.languages.insertBefore("javascript", "operator", {
  "literal-property": {
    pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
    lookbehind: true,
    alias: "property"
  }
});
if (Prism.languages.markup) {
  Prism.languages.markup.tag.addInlined("script", "javascript");
  Prism.languages.markup.tag.addAttribute(
    /on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
    "javascript"
  );
}
Prism.languages.js = Prism.languages.javascript;

// node_modules/prismjs/components/prism-markup.js
init_Buffer();
init_process();
Prism.languages.markup = {
  "comment": {
    pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
    greedy: true
  },
  "prolog": {
    pattern: /<\?[\s\S]+?\?>/,
    greedy: true
  },
  "doctype": {
    // https://www.w3.org/TR/xml/#NT-doctypedecl
    pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
    greedy: true,
    inside: {
      "internal-subset": {
        pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
        lookbehind: true,
        greedy: true,
        inside: null
        // see below
      },
      "string": {
        pattern: /"[^"]*"|'[^']*'/,
        greedy: true
      },
      "punctuation": /^<!|>$|[[\]]/,
      "doctype-tag": /^DOCTYPE/i,
      "name": /[^\s<>'"]+/
    }
  },
  "cdata": {
    pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
    greedy: true
  },
  "tag": {
    pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
    greedy: true,
    inside: {
      "tag": {
        pattern: /^<\/?[^\s>\/]+/,
        inside: {
          "punctuation": /^<\/?/,
          "namespace": /^[^\s>\/:]+:/
        }
      },
      "special-attr": [],
      "attr-value": {
        pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
        inside: {
          "punctuation": [
            {
              pattern: /^=/,
              alias: "attr-equals"
            },
            {
              pattern: /^(\s*)["']|["']$/,
              lookbehind: true
            }
          ]
        }
      },
      "punctuation": /\/?>/,
      "attr-name": {
        pattern: /[^\s>\/]+/,
        inside: {
          "namespace": /^[^\s>\/:]+:/
        }
      }
    }
  },
  "entity": [
    {
      pattern: /&[\da-z]{1,8};/i,
      alias: "named-entity"
    },
    /&#x?[\da-f]{1,8};/i
  ]
};
Prism.languages.markup["tag"].inside["attr-value"].inside["entity"] = Prism.languages.markup["entity"];
Prism.languages.markup["doctype"].inside["internal-subset"].inside = Prism.languages.markup;
Prism.hooks.add("wrap", function(env) {
  if (env.type === "entity") {
    env.attributes["title"] = env.content.replace(/&amp;/, "&");
  }
});
Object.defineProperty(Prism.languages.markup.tag, "addInlined", {
  /**
   * Adds an inlined language to markup.
   *
   * An example of an inlined language is CSS with `<style>` tags.
   *
   * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
   * case insensitive.
   * @param {string} lang The language key.
   * @example
   * addInlined('style', 'css');
   */
  value: function addInlined(tagName, lang) {
    var includedCdataInside = {};
    includedCdataInside["language-" + lang] = {
      pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
      lookbehind: true,
      inside: Prism.languages[lang]
    };
    includedCdataInside["cdata"] = /^<!\[CDATA\[|\]\]>$/i;
    var inside = {
      "included-cdata": {
        pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
        inside: includedCdataInside
      }
    };
    inside["language-" + lang] = {
      pattern: /[\s\S]+/,
      inside: Prism.languages[lang]
    };
    var def = {};
    def[tagName] = {
      pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function() {
        return tagName;
      }), "i"),
      lookbehind: true,
      greedy: true,
      inside
    };
    Prism.languages.insertBefore("markup", "cdata", def);
  }
});
Object.defineProperty(Prism.languages.markup.tag, "addAttribute", {
  /**
   * Adds an pattern to highlight languages embedded in HTML attributes.
   *
   * An example of an inlined language is CSS with `style` attributes.
   *
   * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
   * case insensitive.
   * @param {string} lang The language key.
   * @example
   * addAttribute('style', 'css');
   */
  value: function(attrName, lang) {
    Prism.languages.markup.tag.inside["special-attr"].push({
      pattern: RegExp(
        /(^|["'\s])/.source + "(?:" + attrName + ")" + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
        "i"
      ),
      lookbehind: true,
      inside: {
        "attr-name": /^[^\s=]+/,
        "attr-value": {
          pattern: /=[\s\S]+/,
          inside: {
            "value": {
              pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
              lookbehind: true,
              alias: [lang, "language-" + lang],
              inside: Prism.languages[lang]
            },
            "punctuation": [
              {
                pattern: /^=/,
                alias: "attr-equals"
              },
              /"|'/
            ]
          }
        }
      }
    });
  }
});
Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;
Prism.languages.xml = Prism.languages.extend("markup", {});
Prism.languages.ssml = Prism.languages.xml;
Prism.languages.atom = Prism.languages.xml;
Prism.languages.rss = Prism.languages.xml;

// node_modules/prismjs/components/prism-diff.js
init_Buffer();
init_process();
(function(Prism3) {
  Prism3.languages.diff = {
    "coord": [
      // Match all kinds of coord lines (prefixed by "+++", "---" or "***").
      /^(?:\*{3}|-{3}|\+{3}).*$/m,
      // Match "@@ ... @@" coord lines in unified diff.
      /^@@.*@@$/m,
      // Match coord lines in normal diff (starts with a number).
      /^\d.*$/m
    ]
    // deleted, inserted, unchanged, diff
  };
  var PREFIXES = {
    "deleted-sign": "-",
    "deleted-arrow": "<",
    "inserted-sign": "+",
    "inserted-arrow": ">",
    "unchanged": " ",
    "diff": "!"
  };
  Object.keys(PREFIXES).forEach(function(name) {
    var prefix = PREFIXES[name];
    var alias = [];
    if (!/^\w+$/.test(name)) {
      alias.push(/\w+/.exec(name)[0]);
    }
    if (name === "diff") {
      alias.push("bold");
    }
    Prism3.languages.diff[name] = {
      pattern: RegExp("^(?:[" + prefix + "].*(?:\r\n?|\n|(?![\\s\\S])))+", "m"),
      alias,
      inside: {
        "line": {
          pattern: /(.)(?=[\s\S]).*(?:\r\n?|\n)?/,
          lookbehind: true
        },
        "prefix": {
          pattern: /[\s\S]/,
          alias: /\w+/.exec(name)[0]
        }
      }
    };
  });
  Object.defineProperty(Prism3.languages.diff, "PREFIXES", {
    value: PREFIXES
  });
})(Prism);

// node_modules/prismjs/components/prism-bash.js
init_Buffer();
init_process();
(function(Prism3) {
  var envVars = "\\b(?:BASH|BASHOPTS|BASH_ALIASES|BASH_ARGC|BASH_ARGV|BASH_CMDS|BASH_COMPLETION_COMPAT_DIR|BASH_LINENO|BASH_REMATCH|BASH_SOURCE|BASH_VERSINFO|BASH_VERSION|COLORTERM|COLUMNS|COMP_WORDBREAKS|DBUS_SESSION_BUS_ADDRESS|DEFAULTS_PATH|DESKTOP_SESSION|DIRSTACK|DISPLAY|EUID|GDMSESSION|GDM_LANG|GNOME_KEYRING_CONTROL|GNOME_KEYRING_PID|GPG_AGENT_INFO|GROUPS|HISTCONTROL|HISTFILE|HISTFILESIZE|HISTSIZE|HOME|HOSTNAME|HOSTTYPE|IFS|INSTANCE|JOB|LANG|LANGUAGE|LC_ADDRESS|LC_ALL|LC_IDENTIFICATION|LC_MEASUREMENT|LC_MONETARY|LC_NAME|LC_NUMERIC|LC_PAPER|LC_TELEPHONE|LC_TIME|LESSCLOSE|LESSOPEN|LINES|LOGNAME|LS_COLORS|MACHTYPE|MAILCHECK|MANDATORY_PATH|NO_AT_BRIDGE|OLDPWD|OPTERR|OPTIND|ORBIT_SOCKETDIR|OSTYPE|PAPERSIZE|PATH|PIPESTATUS|PPID|PS1|PS2|PS3|PS4|PWD|RANDOM|REPLY|SECONDS|SELINUX_INIT|SESSION|SESSIONTYPE|SESSION_MANAGER|SHELL|SHELLOPTS|SHLVL|SSH_AUTH_SOCK|TERM|UID|UPSTART_EVENTS|UPSTART_INSTANCE|UPSTART_JOB|UPSTART_SESSION|USER|WINDOWID|XAUTHORITY|XDG_CONFIG_DIRS|XDG_CURRENT_DESKTOP|XDG_DATA_DIRS|XDG_GREETER_DATA_DIR|XDG_MENU_PREFIX|XDG_RUNTIME_DIR|XDG_SEAT|XDG_SEAT_PATH|XDG_SESSION_DESKTOP|XDG_SESSION_ID|XDG_SESSION_PATH|XDG_SESSION_TYPE|XDG_VTNR|XMODIFIERS)\\b";
  var commandAfterHeredoc = {
    pattern: /(^(["']?)\w+\2)[ \t]+\S.*/,
    lookbehind: true,
    alias: "punctuation",
    // this looks reasonably well in all themes
    inside: null
    // see below
  };
  var insideString = {
    "bash": commandAfterHeredoc,
    "environment": {
      pattern: RegExp("\\$" + envVars),
      alias: "constant"
    },
    "variable": [
      // [0]: Arithmetic Environment
      {
        pattern: /\$?\(\([\s\S]+?\)\)/,
        greedy: true,
        inside: {
          // If there is a $ sign at the beginning highlight $(( and )) as variable
          "variable": [
            {
              pattern: /(^\$\(\([\s\S]+)\)\)/,
              lookbehind: true
            },
            /^\$\(\(/
          ],
          "number": /\b0x[\dA-Fa-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:[Ee]-?\d+)?/,
          // Operators according to https://www.gnu.org/software/bash/manual/bashref.html#Shell-Arithmetic
          "operator": /--|\+\+|\*\*=?|<<=?|>>=?|&&|\|\||[=!+\-*/%<>^&|]=?|[?~:]/,
          // If there is no $ sign at the beginning highlight (( and )) as punctuation
          "punctuation": /\(\(?|\)\)?|,|;/
        }
      },
      // [1]: Command Substitution
      {
        pattern: /\$\((?:\([^)]+\)|[^()])+\)|`[^`]+`/,
        greedy: true,
        inside: {
          "variable": /^\$\(|^`|\)$|`$/
        }
      },
      // [2]: Brace expansion
      {
        pattern: /\$\{[^}]+\}/,
        greedy: true,
        inside: {
          "operator": /:[-=?+]?|[!\/]|##?|%%?|\^\^?|,,?/,
          "punctuation": /[\[\]]/,
          "environment": {
            pattern: RegExp("(\\{)" + envVars),
            lookbehind: true,
            alias: "constant"
          }
        }
      },
      /\$(?:\w+|[#?*!@$])/
    ],
    // Escape sequences from echo and printf's manuals, and escaped quotes.
    "entity": /\\(?:[abceEfnrtv\\"]|O?[0-7]{1,3}|U[0-9a-fA-F]{8}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{1,2})/
  };
  Prism3.languages.bash = {
    "shebang": {
      pattern: /^#!\s*\/.*/,
      alias: "important"
    },
    "comment": {
      pattern: /(^|[^"{\\$])#.*/,
      lookbehind: true
    },
    "function-name": [
      // a) function foo {
      // b) foo() {
      // c) function foo() {
      // but not “foo {”
      {
        // a) and c)
        pattern: /(\bfunction\s+)[\w-]+(?=(?:\s*\(?:\s*\))?\s*\{)/,
        lookbehind: true,
        alias: "function"
      },
      {
        // b)
        pattern: /\b[\w-]+(?=\s*\(\s*\)\s*\{)/,
        alias: "function"
      }
    ],
    // Highlight variable names as variables in for and select beginnings.
    "for-or-select": {
      pattern: /(\b(?:for|select)\s+)\w+(?=\s+in\s)/,
      alias: "variable",
      lookbehind: true
    },
    // Highlight variable names as variables in the left-hand part
    // of assignments (“=” and “+=”).
    "assign-left": {
      pattern: /(^|[\s;|&]|[<>]\()\w+(?:\.\w+)*(?=\+?=)/,
      inside: {
        "environment": {
          pattern: RegExp("(^|[\\s;|&]|[<>]\\()" + envVars),
          lookbehind: true,
          alias: "constant"
        }
      },
      alias: "variable",
      lookbehind: true
    },
    // Highlight parameter names as variables
    "parameter": {
      pattern: /(^|\s)-{1,2}(?:\w+:[+-]?)?\w+(?:\.\w+)*(?=[=\s]|$)/,
      alias: "variable",
      lookbehind: true
    },
    "string": [
      // Support for Here-documents https://en.wikipedia.org/wiki/Here_document
      {
        pattern: /((?:^|[^<])<<-?\s*)(\w+)\s[\s\S]*?(?:\r?\n|\r)\2/,
        lookbehind: true,
        greedy: true,
        inside: insideString
      },
      // Here-document with quotes around the tag
      // → No expansion (so no “inside”).
      {
        pattern: /((?:^|[^<])<<-?\s*)(["'])(\w+)\2\s[\s\S]*?(?:\r?\n|\r)\3/,
        lookbehind: true,
        greedy: true,
        inside: {
          "bash": commandAfterHeredoc
        }
      },
      // “Normal” string
      {
        // https://www.gnu.org/software/bash/manual/html_node/Double-Quotes.html
        pattern: /(^|[^\\](?:\\\\)*)"(?:\\[\s\S]|\$\([^)]+\)|\$(?!\()|`[^`]+`|[^"\\`$])*"/,
        lookbehind: true,
        greedy: true,
        inside: insideString
      },
      {
        // https://www.gnu.org/software/bash/manual/html_node/Single-Quotes.html
        pattern: /(^|[^$\\])'[^']*'/,
        lookbehind: true,
        greedy: true
      },
      {
        // https://www.gnu.org/software/bash/manual/html_node/ANSI_002dC-Quoting.html
        pattern: /\$'(?:[^'\\]|\\[\s\S])*'/,
        greedy: true,
        inside: {
          "entity": insideString.entity
        }
      }
    ],
    "environment": {
      pattern: RegExp("\\$?" + envVars),
      alias: "constant"
    },
    "variable": insideString.variable,
    "function": {
      pattern: /(^|[\s;|&]|[<>]\()(?:add|apropos|apt|apt-cache|apt-get|aptitude|aspell|automysqlbackup|awk|basename|bash|bc|bconsole|bg|bzip2|cal|cargo|cat|cfdisk|chgrp|chkconfig|chmod|chown|chroot|cksum|clear|cmp|column|comm|composer|cp|cron|crontab|csplit|curl|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|docker|docker-compose|du|egrep|eject|env|ethtool|expand|expect|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|git|gparted|grep|groupadd|groupdel|groupmod|groups|grub-mkconfig|gzip|halt|head|hg|history|host|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|ip|java|jobs|join|kill|killall|less|link|ln|locate|logname|logrotate|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|lynx|make|man|mc|mdadm|mkconfig|mkdir|mke2fs|mkfifo|mkfs|mkisofs|mknod|mkswap|mmv|more|most|mount|mtools|mtr|mutt|mv|nano|nc|netstat|nice|nl|node|nohup|notify-send|npm|nslookup|op|open|parted|passwd|paste|pathchk|ping|pkill|pnpm|podman|podman-compose|popd|pr|printcap|printenv|ps|pushd|pv|quota|quotacheck|quotactl|ram|rar|rcp|reboot|remsync|rename|renice|rev|rm|rmdir|rpm|rsync|scp|screen|sdiff|sed|sendmail|seq|service|sftp|sh|shellcheck|shuf|shutdown|sleep|slocate|sort|split|ssh|stat|strace|su|sudo|sum|suspend|swapon|sync|sysctl|tac|tail|tar|tee|time|timeout|top|touch|tr|traceroute|tsort|tty|umount|uname|unexpand|uniq|units|unrar|unshar|unzip|update-grub|uptime|useradd|userdel|usermod|users|uudecode|uuencode|v|vcpkg|vdir|vi|vim|virsh|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yarn|yes|zenity|zip|zsh|zypper)(?=$|[)\s;|&])/,
      lookbehind: true
    },
    "keyword": {
      pattern: /(^|[\s;|&]|[<>]\()(?:case|do|done|elif|else|esac|fi|for|function|if|in|select|then|until|while)(?=$|[)\s;|&])/,
      lookbehind: true
    },
    // https://www.gnu.org/software/bash/manual/html_node/Shell-Builtin-Commands.html
    "builtin": {
      pattern: /(^|[\s;|&]|[<>]\()(?:\.|:|alias|bind|break|builtin|caller|cd|command|continue|declare|echo|enable|eval|exec|exit|export|getopts|hash|help|let|local|logout|mapfile|printf|pwd|read|readarray|readonly|return|set|shift|shopt|source|test|times|trap|type|typeset|ulimit|umask|unalias|unset)(?=$|[)\s;|&])/,
      lookbehind: true,
      // Alias added to make those easier to distinguish from strings.
      alias: "class-name"
    },
    "boolean": {
      pattern: /(^|[\s;|&]|[<>]\()(?:false|true)(?=$|[)\s;|&])/,
      lookbehind: true
    },
    "file-descriptor": {
      pattern: /\B&\d\b/,
      alias: "important"
    },
    "operator": {
      // Lots of redirections here, but not just that.
      pattern: /\d?<>|>\||\+=|=[=~]?|!=?|<<[<-]?|[&\d]?>>|\d[<>]&?|[<>][&=]?|&[>&]?|\|[&|]?/,
      inside: {
        "file-descriptor": {
          pattern: /^\d/,
          alias: "important"
        }
      }
    },
    "punctuation": /\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/,
    "number": {
      pattern: /(^|\s)(?:[1-9]\d*|0)(?:[.,]\d+)?\b/,
      lookbehind: true
    }
  };
  commandAfterHeredoc.inside = Prism3.languages.bash;
  var toBeCopied = [
    "comment",
    "function-name",
    "for-or-select",
    "assign-left",
    "parameter",
    "string",
    "environment",
    "function",
    "keyword",
    "builtin",
    "boolean",
    "file-descriptor",
    "operator",
    "punctuation",
    "number"
  ];
  var inside = insideString.variable[1].inside;
  for (var i = 0; i < toBeCopied.length; i++) {
    inside[toBeCopied[i]] = Prism3.languages.bash[toBeCopied[i]];
  }
  Prism3.languages.sh = Prism3.languages.bash;
  Prism3.languages.shell = Prism3.languages.bash;
})(Prism);

// node_modules/prismjs/components/prism-typescript.js
init_Buffer();
init_process();
(function(Prism3) {
  Prism3.languages.typescript = Prism3.languages.extend("javascript", {
    "class-name": {
      pattern: /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,
      lookbehind: true,
      greedy: true,
      inside: null
      // see below
    },
    "builtin": /\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\b/
  });
  Prism3.languages.typescript.keyword.push(
    /\b(?:abstract|declare|is|keyof|readonly|require)\b/,
    // keywords that have to be followed by an identifier
    /\b(?:asserts|infer|interface|module|namespace|type)\b(?=\s*(?:[{_$a-zA-Z\xA0-\uFFFF]|$))/,
    // This is for `import type *, {}`
    /\btype\b(?=\s*(?:[\{*]|$))/
  );
  delete Prism3.languages.typescript["parameter"];
  delete Prism3.languages.typescript["literal-property"];
  var typeInside = Prism3.languages.extend("typescript", {});
  delete typeInside["class-name"];
  Prism3.languages.typescript["class-name"].inside = typeInside;
  Prism3.languages.insertBefore("typescript", "function", {
    "decorator": {
      pattern: /@[$\w\xA0-\uFFFF]+/,
      inside: {
        "at": {
          pattern: /^@/,
          alias: "operator"
        },
        "function": /^[\s\S]+/
      }
    },
    "generic-function": {
      // e.g. foo<T extends "bar" | "baz">( ...
      pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\s*\()/,
      greedy: true,
      inside: {
        "function": /^#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/,
        "generic": {
          pattern: /<[\s\S]+/,
          // everything after the first <
          alias: "class-name",
          inside: typeInside
        }
      }
    }
  });
  Prism3.languages.ts = Prism3.languages.typescript;
})(Prism);

// node_modules/prismjs/components/prism-jsx.js
init_Buffer();
init_process();
(function(Prism3) {
  var javascript = Prism3.util.clone(Prism3.languages.javascript);
  var space = /(?:\s|\/\/.*(?!.)|\/\*(?:[^*]|\*(?!\/))\*\/)/.source;
  var braces = /(?:\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])*\})/.source;
  var spread = /(?:\{<S>*\.{3}(?:[^{}]|<BRACES>)*\})/.source;
  function re(source, flags) {
    source = source.replace(/<S>/g, function() {
      return space;
    }).replace(/<BRACES>/g, function() {
      return braces;
    }).replace(/<SPREAD>/g, function() {
      return spread;
    });
    return RegExp(source, flags);
  }
  spread = re(spread).source;
  Prism3.languages.jsx = Prism3.languages.extend("markup", javascript);
  Prism3.languages.jsx.tag.pattern = re(
    /<\/?(?:[\w.:-]+(?:<S>+(?:[\w.:$-]+(?:=(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s{'"/>=]+|<BRACES>))?|<SPREAD>))*<S>*\/?)?>/.source
  );
  Prism3.languages.jsx.tag.inside["tag"].pattern = /^<\/?[^\s>\/]*/;
  Prism3.languages.jsx.tag.inside["attr-value"].pattern = /=(?!\{)(?:"(?:\\[\s\S]|[^\\"])*"|'(?:\\[\s\S]|[^\\'])*'|[^\s'">]+)/;
  Prism3.languages.jsx.tag.inside["tag"].inside["class-name"] = /^[A-Z]\w*(?:\.[A-Z]\w*)*$/;
  Prism3.languages.jsx.tag.inside["comment"] = javascript["comment"];
  Prism3.languages.insertBefore("inside", "attr-name", {
    "spread": {
      pattern: re(/<SPREAD>/.source),
      inside: Prism3.languages.jsx
    }
  }, Prism3.languages.jsx.tag);
  Prism3.languages.insertBefore("inside", "special-attr", {
    "script": {
      // Allow for two levels of nesting
      pattern: re(/=<BRACES>/.source),
      alias: "language-javascript",
      inside: {
        "script-punctuation": {
          pattern: /^=(?=\{)/,
          alias: "punctuation"
        },
        rest: Prism3.languages.jsx
      }
    }
  }, Prism3.languages.jsx.tag);
  var stringifyToken = function(token) {
    if (!token) {
      return "";
    }
    if (typeof token === "string") {
      return token;
    }
    if (typeof token.content === "string") {
      return token.content;
    }
    return token.content.map(stringifyToken).join("");
  };
  var walkTokens = function(tokens) {
    var openedTags = [];
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      var notTagNorBrace = false;
      if (typeof token !== "string") {
        if (token.type === "tag" && token.content[0] && token.content[0].type === "tag") {
          if (token.content[0].content[0].content === "</") {
            if (openedTags.length > 0 && openedTags[openedTags.length - 1].tagName === stringifyToken(token.content[0].content[1])) {
              openedTags.pop();
            }
          } else {
            if (token.content[token.content.length - 1].content === "/>") {
            } else {
              openedTags.push({
                tagName: stringifyToken(token.content[0].content[1]),
                openedBraces: 0
              });
            }
          }
        } else if (openedTags.length > 0 && token.type === "punctuation" && token.content === "{") {
          openedTags[openedTags.length - 1].openedBraces++;
        } else if (openedTags.length > 0 && openedTags[openedTags.length - 1].openedBraces > 0 && token.type === "punctuation" && token.content === "}") {
          openedTags[openedTags.length - 1].openedBraces--;
        } else {
          notTagNorBrace = true;
        }
      }
      if (notTagNorBrace || typeof token === "string") {
        if (openedTags.length > 0 && openedTags[openedTags.length - 1].openedBraces === 0) {
          var plainText = stringifyToken(token);
          if (i < tokens.length - 1 && (typeof tokens[i + 1] === "string" || tokens[i + 1].type === "plain-text")) {
            plainText += stringifyToken(tokens[i + 1]);
            tokens.splice(i + 1, 1);
          }
          if (i > 0 && (typeof tokens[i - 1] === "string" || tokens[i - 1].type === "plain-text")) {
            plainText = stringifyToken(tokens[i - 1]) + plainText;
            tokens.splice(i - 1, 1);
            i--;
          }
          tokens[i] = new Prism3.Token("plain-text", plainText, null, plainText);
        }
      }
      if (token.content && typeof token.content !== "string") {
        walkTokens(token.content);
      }
    }
  };
  Prism3.hooks.add("after-tokenize", function(env) {
    if (env.language !== "jsx" && env.language !== "tsx") {
      return;
    }
    walkTokens(env.tokens);
  });
})(Prism);

// node_modules/prismjs/components/prism-tsx.js
init_Buffer();
init_process();
(function(Prism3) {
  var typescript = Prism3.util.clone(Prism3.languages.typescript);
  Prism3.languages.tsx = Prism3.languages.extend("jsx", typescript);
  delete Prism3.languages.tsx["parameter"];
  delete Prism3.languages.tsx["literal-property"];
  var tag = Prism3.languages.tsx.tag;
  tag.pattern = RegExp(/(^|[^\w$]|(?=<\/))/.source + "(?:" + tag.pattern.source + ")", tag.pattern.flags);
  tag.lookbehind = true;
})(Prism);

// src/utils/prism.ts
globalThis.Prism = import_prismjs.default;
import_prismjs.default.manual = true;
function wrapContent(content) {
  return Array.isArray(content) ? content : [content];
}
function unwrapContent(content) {
  if (content.length === 0) {
    return "";
  } else if (content.length === 1 && typeof content[0] === "string") {
    return content[0];
  }
  return content;
}
function splitLines(tokens) {
  const lines = splitLinesRec(tokens);
  if (lines.length && !lines[lines.length - 1].length) {
    lines.pop();
  }
  return lines;
}
function splitLinesRec(tokens) {
  let currentLine = [];
  const lines = [currentLine];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (typeof token === "string") {
      const split = token.split(/\r\n|\r|\n/);
      for (let j = 0; j < split.length; j++) {
        if (j > 0) {
          lines.push(currentLine = []);
        }
        const token1 = split[j];
        if (token1) {
          currentLine.push(token1);
        }
      }
    } else {
      const split = splitLinesRec(wrapContent(token.content));
      if (split.length > 1) {
        for (let j = 0; j < split.length; j++) {
          if (j > 0) {
            lines.push(currentLine = []);
          }
          const line = split[j];
          if (line.length) {
            const token1 = new import_prismjs.default.Token(
              token.type,
              unwrapContent(line),
              token.alias
            );
            token1.length = line.reduce((l, t) => l + t.length, 0);
            currentLine.push(token1);
          }
        }
      } else {
        currentLine.push(token);
      }
    }
  }
  return lines;
}
function tokenize(code, language) {
  if (!code) return [[]];
  const grammar = import_prismjs.default.languages[language] || import_prismjs.default.languages.javascript;
  const tokens = import_prismjs.default.tokenize(code, grammar);
  return splitLines(tokens);
}

// src/clients/demos.tsx
function* SimpleEditable({ initial }) {
  const state = new EditableState({ value: initial });
  for ({} of this) {
    const lines = state.value.split(/\r\n|\r|\n/);
    if (/(?:\r\n|\r|\n)$/.test(state.value)) {
      lines.pop();
    }
    let cursor = 0;
    yield /* @__PURE__ */ createElement(CrankEditable, { state, onstatechange: () => this.refresh() }, /* @__PURE__ */ createElement("pre", { class: "editable", contenteditable: "true", spellcheck: false }, lines.map((line) => {
      const key = state.keyer.keyAt(cursor);
      cursor += line.length + 1;
      return /* @__PURE__ */ createElement("div", { key }, line || /* @__PURE__ */ createElement("br", null));
    })));
  }
}
var COLORS = [
  "#FF0000",
  "#FFA500",
  "#FFDC00",
  "#008000",
  "#0000FF",
  "#4B0082",
  "#800080"
];
function* RainbowEditable({ initial }) {
  const state = new EditableState({ value: initial });
  for ({} of this) {
    let cursor = 0;
    const lines = state.value.split(/\r\n|\r|\n/);
    if (/(?:\r\n|\r|\n)$/.test(state.value)) {
      lines.pop();
    }
    yield /* @__PURE__ */ createElement(CrankEditable, { state, onstatechange: () => this.refresh() }, /* @__PURE__ */ createElement("div", { class: "editable", contenteditable: "true", spellcheck: false, hydrate: "!children" }, lines.map((line) => {
      const key = state.keyer.keyAt(cursor);
      cursor += line.length + 1;
      const chars = line ? [...line].map((char, i) => /* @__PURE__ */ createElement("span", { style: { color: COLORS[i % COLORS.length] } }, char)) : /* @__PURE__ */ createElement("br", null);
      return /* @__PURE__ */ createElement("div", { key }, chars);
    })));
  }
}
function printTokens(tokens) {
  const result = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (typeof token === "string") {
      result.push(token);
    } else {
      const children = Array.isArray(token.content) ? printTokens(token.content) : token.content;
      let className = "token " + token.type;
      if (Array.isArray(token.alias)) {
        className += " " + token.alias.join(" ");
      } else if (typeof token.alias === "string") {
        className += " " + token.alias;
      }
      result.push(/* @__PURE__ */ createElement("span", { class: className }, children));
    }
  }
  return result;
}
function* CodeEditable({ initial }) {
  const state = new EditableState({ value: initial });
  for ({} of this) {
    const lines = tokenize(state.value, "typescript");
    let cursor = 0;
    yield /* @__PURE__ */ createElement(CrankEditable, { state, onstatechange: () => this.refresh() }, /* @__PURE__ */ createElement("pre", { class: "editable", contenteditable: "true", spellcheck: false, hydrate: "!children" }, lines.map((line) => {
      const key = state.keyer.keyAt(cursor);
      const length = line.reduce((l, t) => l + t.length, 0);
      cursor += length + 1;
      return /* @__PURE__ */ createElement("div", { key }, /* @__PURE__ */ createElement("code", null, printTokens(line)), /* @__PURE__ */ createElement("br", null));
    })));
  }
}
var SOCIAL_PATTERN = /(#\w+)|(@\w+)|(https?:\/\/[^\s]+)/g;
function highlightSocial(text) {
  const result = [];
  let lastIndex = 0;
  for (const match of text.matchAll(SOCIAL_PATTERN)) {
    const index = match.index;
    if (index > lastIndex) {
      result.push(text.slice(lastIndex, index));
    }
    const value = match[0];
    let color;
    let href;
    if (match[1]) {
      color = "#c084fc";
      href = `https://example.com/tags/${value.slice(1)}`;
    } else if (match[2]) {
      color = "#60a5fa";
      href = `https://example.com/${value.slice(1)}`;
    } else {
      color = "#34d399";
      href = value;
    }
    result.push(
      /* @__PURE__ */ createElement("a", { href, target: "_blank", rel: "noopener", style: { color, textDecoration: "underline" } }, value)
    );
    lastIndex = index + value.length;
  }
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }
  return result;
}
function* SocialEditable({ initial }) {
  const state = new EditableState({ value: initial });
  for ({} of this) {
    const lines = state.value.split(/\r\n|\r|\n/);
    if (/(?:\r\n|\r|\n)$/.test(state.value)) {
      lines.pop();
    }
    let cursor = 0;
    yield /* @__PURE__ */ createElement(CrankEditable, { state, onstatechange: () => this.refresh() }, /* @__PURE__ */ createElement("div", { class: "editable", contenteditable: "true", spellcheck: false, hydrate: "!children" }, lines.map((line) => {
      const key = state.keyer.keyAt(cursor);
      cursor += line.length + 1;
      return /* @__PURE__ */ createElement("div", { key }, line ? highlightSocial(line) : /* @__PURE__ */ createElement("br", null));
    })));
  }
}
function renderTwemoji(text) {
  const entities = (0, import_parser.parse)(text);
  if (!entities.length) return [text];
  const result = [];
  let lastIndex = 0;
  for (const entity of entities) {
    const [start, end] = entity.indices;
    if (start > lastIndex) {
      result.push(text.slice(lastIndex, start));
    }
    result.push(
      /* @__PURE__ */ createElement(
        "img",
        {
          "data-content": entity.text,
          src: entity.url,
          alt: entity.text,
          draggable: false,
          style: {
            height: "1.2em",
            width: "1.2em",
            verticalAlign: "middle",
            display: "inline-block"
          }
        }
      )
    );
    lastIndex = end;
  }
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }
  return result;
}
function* TwemojiEditable({ initial }) {
  const state = new EditableState({ value: initial });
  for ({} of this) {
    const lines = state.value.split(/\r\n|\r|\n/);
    if (/(?:\r\n|\r|\n)$/.test(state.value)) {
      lines.pop();
    }
    let cursor = 0;
    yield /* @__PURE__ */ createElement(CrankEditable, { state, onstatechange: () => this.refresh() }, /* @__PURE__ */ createElement("div", { class: "editable", contenteditable: "true", spellcheck: false, hydrate: "!children" }, lines.map((line) => {
      const key = state.keyer.keyAt(cursor);
      cursor += line.length + 1;
      return /* @__PURE__ */ createElement("div", { key }, line ? renderTwemoji(line) : /* @__PURE__ */ createElement("br", null));
    })));
  }
}
function* BlockquoteEditable({ initial }) {
  const state = new EditableState({ value: initial });
  for ({} of this) {
    const lines = state.value.split(/\r\n|\r|\n/);
    if (/(?:\r\n|\r|\n)$/.test(state.value)) {
      lines.pop();
    }
    let cursor = 0;
    yield /* @__PURE__ */ createElement(CrankEditable, { state, onstatechange: () => this.refresh() }, /* @__PURE__ */ createElement(
      "div",
      {
        class: "editable",
        contenteditable: "true",
        spellcheck: false,
        hydrate: "!children",
        onkeydown: (ev) => {
          if (ev.key === "Enter" && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey) {
            const area = ev.currentTarget.closest("content-area");
            if (!area) return;
            const pos = area.selectionStart;
            const value = area.value;
            const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
            const lineEnd = value.indexOf("\n", pos);
            const line = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
            if (line === "> ") {
              ev.preventDefault();
              state.setValue(
                value.slice(0, lineStart) + value.slice(lineStart + 2),
                "user"
              );
              this.refresh();
            }
          }
        }
      },
      lines.map((line) => {
        const key = state.keyer.keyAt(cursor);
        cursor += line.length + 1;
        const match = line.match(/^(> )([\s\S]*)$/);
        if (match) {
          return /* @__PURE__ */ createElement("div", { key, "data-contentbefore": "> ", style: {
            borderLeft: "3px solid var(--highlight-color)",
            paddingLeft: "0.5em",
            marginLeft: "0.25em",
            color: "var(--text-muted)"
          } }, match[2] || /* @__PURE__ */ createElement("br", null));
        }
        return /* @__PURE__ */ createElement("div", { key }, line || /* @__PURE__ */ createElement("br", null));
      })
    ));
  }
}
function* TodoEditable({ initial }) {
  const state = new EditableState({ value: initial });
  for ({} of this) {
    const lines = state.value.split(/\r\n|\r|\n/);
    if (/(?:\r\n|\r|\n)$/.test(state.value)) {
      lines.pop();
    }
    let cursor = 0;
    yield /* @__PURE__ */ createElement(CrankEditable, { state, onstatechange: () => this.refresh() }, /* @__PURE__ */ createElement(
      "div",
      {
        class: "editable",
        contenteditable: "true",
        spellcheck: false,
        hydrate: "!children",
        onkeydown: (ev) => {
          if (ev.shiftKey || ev.ctrlKey || ev.metaKey) return;
          const area = ev.currentTarget.closest("content-area");
          if (!area) return;
          const pos = area.selectionStart;
          const end = area.selectionEnd;
          if (pos !== end) return;
          const value = area.value;
          const lineStart = value.lastIndexOf("\n", pos - 1) + 1;
          const lineEnd = value.indexOf("\n", pos);
          const line = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
          const todoMatch = line.match(/^(- \[[ x]\] )([\s\S]*)$/);
          if (!todoMatch) return;
          const prefix = todoMatch[1];
          if (ev.key === "Enter" && todoMatch[2] === "") {
            ev.preventDefault();
            state.setValue(
              value.slice(0, lineStart) + value.slice(lineStart + prefix.length),
              "user"
            );
            this.refresh();
          } else if (ev.key === "Enter" && todoMatch[2] !== "") {
            ev.preventDefault();
            const newValue = value.slice(0, pos) + "\n- [ ] " + value.slice(pos);
            state.setValue(newValue, "user");
            this.refresh();
          } else if (ev.key === "Backspace" && pos === lineStart + prefix.length) {
            ev.preventDefault();
            state.setValue(
              value.slice(0, lineStart) + value.slice(lineStart + prefix.length),
              "user"
            );
            this.refresh();
          }
        }
      },
      lines.map((line) => {
        const lineStart = cursor;
        const key = state.keyer.keyAt(cursor);
        cursor += line.length + 1;
        const match = line.match(/^(- \[[ x]\] )([\s\S]*)$/);
        if (match) {
          const prefix = match[1];
          const checked = prefix === "- [x] ";
          return /* @__PURE__ */ createElement("div", { key, "data-contentbefore": prefix, style: {
            paddingLeft: "1.5em"
          } }, /* @__PURE__ */ createElement(
            "input",
            {
              type: "checkbox",
              checked,
              "data-content": "",
              contenteditable: "false",
              style: {
                marginLeft: "-1.5em",
                marginRight: "0.25em",
                cursor: "pointer"
              },
              onclick: (ev) => {
                const input = ev.target;
                input.checked = checked;
                const newPrefix = checked ? "- [ ] " : "- [x] ";
                state.setValue(
                  state.value.slice(0, lineStart) + newPrefix + state.value.slice(lineStart + prefix.length),
                  "user"
                );
                this.refresh();
              }
            }
          ), /* @__PURE__ */ createElement("span", { style: checked ? { textDecoration: "line-through", opacity: "0.5" } : void 0 }, match[2]), !match[2] && /* @__PURE__ */ createElement("br", { "data-content": "" }));
        }
        return /* @__PURE__ */ createElement("div", { key }, line || /* @__PURE__ */ createElement("br", null));
      })
    ));
  }
}
function* EditableTitle({ initial }) {
  const state = new EditableState({ value: initial });
  for ({} of this) {
    const lines = state.value.split(/\r\n|\r|\n/);
    if (/(?:\r\n|\r|\n)$/.test(state.value)) {
      lines.pop();
    }
    let cursor = 0;
    yield /* @__PURE__ */ createElement(CrankEditable, { state, onstatechange: () => this.refresh() }, /* @__PURE__ */ createElement(
      "h1",
      {
        contenteditable: "true",
        spellcheck: false,
        style: {
          fontSize: "max(40px, 8vw)",
          color: "var(--highlight-color)",
          margin: "0",
          outline: "none"
        }
      },
      lines.map((line) => {
        const key = state.keyer.keyAt(cursor);
        cursor += line.length + 1;
        return /* @__PURE__ */ createElement("div", { key }, line || /* @__PURE__ */ createElement("br", null));
      })
    ));
  }
}
function* EditableTagline({ initial }) {
  const state = new EditableState({ value: initial });
  for ({} of this) {
    const lines = state.value.split(/\r\n|\r|\n/);
    if (/(?:\r\n|\r|\n)$/.test(state.value)) {
      lines.pop();
    }
    let cursor = 0;
    yield /* @__PURE__ */ createElement(CrankEditable, { state, onstatechange: () => this.refresh() }, /* @__PURE__ */ createElement(
      "p",
      {
        contenteditable: "true",
        spellcheck: false,
        hydrate: "!children",
        style: {
          fontSize: "1.25rem",
          color: "var(--text-muted)",
          margin: "0.5em 0 0",
          outline: "none"
        }
      },
      lines.map((line) => {
        const key = state.keyer.keyAt(cursor);
        cursor += line.length + 1;
        return /* @__PURE__ */ createElement("div", { key }, line || /* @__PURE__ */ createElement("br", null));
      })
    ));
  }
}
function hydrate(id, Component) {
  const el = document.getElementById(id);
  if (!el) return;
  const initial = el.dataset.initial || "\n";
  renderer.hydrate(
    /* @__PURE__ */ createElement(Component, { initial }),
    el
  );
}
hydrate("hero-title", EditableTitle);
hydrate("hero-tagline", EditableTagline);
hydrate("demo-simple", SimpleEditable);
hydrate("demo-rainbow", RainbowEditable);
hydrate("demo-code", CodeEditable);
hydrate("demo-social", SocialEditable);
hydrate("demo-twemoji", TwemojiEditable);
hydrate("demo-blockquote", BlockquoteEditable);
hydrate("demo-todo", TodoEditable);
/*! Bundled license information:

prismjs/prism.js:
  (**
   * Prism: Lightweight, robust, elegant syntax highlighting
   *
   * @license MIT <https://opensource.org/licenses/MIT>
   * @author Lea Verou <https://lea.verou.me>
   * @namespace
   * @public
   *)
*/
