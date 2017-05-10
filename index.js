"use strict";

let LogParser = require("./lib/LogParser"),
  logParserObj = new LogParser("sample.log");

logParserObj.readLineByLine();