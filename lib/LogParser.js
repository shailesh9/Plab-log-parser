"use strict";
const fs = require("fs"),
  es = require("event-stream"),
  Q = require("q");

class LogParser {

  constructor(fileName) {
    this.fileName = fileName;
    this.urlMap = new Map();
    this.urlsToValidate = new Map([
      ["count_pending_messages", "GET"],
      ["get_messages", "GET"],
      ["get_friends_progress", "GET"],
      ["get_friends_score", "GET"]
    ]);
  }

  readLineByLine() {
    let defer = Q.defer(),
      s = fs.createReadStream(this.fileName)
      .pipe(es.split())
      .pipe(es.mapSync(line => {

        // pause the readstream
        s.pause();

        // process line here and call s.resume() when ready

        this.parseLine(line);
        // resume the readstream, possibly from a callback
        s.resume();
      }))
      .on("error", err => {
        console.log("Error while reading file.", err);
        defer.reject(err);
      })
      .on("end", () => {
        console.log("Read entire file.");

        defer.resolve("Read entire file");

        try {

          this.getMeanOfEachUrl();
        } catch (e) {
          console.log("Error Occured", e);
        }
      });

    return defer.promise;
  }

  parseLine(line) {
    if (line.length) {
      line = line.split(" ");

      let method = line[3].match(/=(.+)/)[1],
        url = line[4].match(/=(.+)/)[1],
        endPoint = url.match(/\/([^\/]+)\/?$/)[1],
        dyno = line[7].match(/=(.+)/)[1],
        connectTime = Number(line[8].match(/\d+/g)[0]),
        serviceTime = Number(line[9].match(/\d+/g)[0]),
        path = url.match(/^\/[^/]+\/([^/]+)\//),
        condition = path && this.urlsToValidate.has(endPoint) && method === this.urlsToValidate.get(endPoint);

      if (condition || !isNaN(endPoint) && path && url === `/api/users/${endPoint}`) {
        path = isNaN(endPoint) ? `${method} ${path[0]}{user_id}/${endPoint}` : `${method} ${path[0]}{user_id}`;
        this.addUrlDataInMap(path, dyno, connectTime, serviceTime);
      }
    }
  }

  addUrlDataInMap(path, dyno, connectTime, serviceTime) {
    if (!this.urlMap.has(path)) {
      let dynoCountMap = new Map();

      dynoCountMap.set(dyno, 1);
      this.urlMap.set(path, {
        "count": 1,
        "responseTimeList": [connectTime + serviceTime],
        "urlDyno": dynoCountMap
      });
    }else {
      let urlData = this.urlMap.get(path),
        responseTime = connectTime + serviceTime;

      urlData.count++;
      urlData.responseTimeList.push(responseTime);

      if (urlData.urlDyno.has(dyno)) {
        let dynoCount = urlData.urlDyno.get(dyno);

        dynoCount++;
      }else {
        urlData.urlDyno.set(dyno, 1);
      }
    }
  }

  getMeanOfEachUrl() {
    let mean;

    if (this.urlMap.size) {
      for (let value of this.urlMap.values()) {
        let {responseTimeList} = value;

        if (responseTimeList && responseTimeList.length === 1) {

          value.mean = responseTimeList[0];
          value.median = "NA"; // Only single response time so median and mode are not calculated
          value.mode = "NA";
          value.maxDyno = value.urlDyno.keys().next().value;

        }else if (responseTimeList.length > 0) {
          responseTimeList.sort((a, b) => a - b);

          mean = LogParser.getSum(responseTimeList) / responseTimeList.length;

          if (LogParser.isFloat(mean)) {
            mean = Number(mean.toFixed(2));
          }
          value.mean = mean;

          LogParser.getMedianOfEachUrl(value);
          LogParser.getModeOfEachUrl(value);
          LogParser.getTopDyno(value);
        }
      }

      this.printInConsole();
    }
    return mean;
  }

  static isFloat(n) {
    return n % 1 !== 0;
  }

  static getMedianOfEachUrl(value) {
    let {responseTimeList} = value,
      median;

    if (responseTimeList.length === 2) {

      median = LogParser.getSum(responseTimeList) / 2;

    }else if (LogParser.isEven(responseTimeList.length)) {

      let m1 = responseTimeList.length / 2,
        m2 = m1 - 1;

      median = (responseTimeList[m1] + responseTimeList[m2]) / 2;

    }else {
      let m = Math.floor(responseTimeList.length / 2);

      median = responseTimeList[m];
    }

    if (LogParser.isFloat(median)) {

      value.median = Number(median.toFixed(2));

    }else {

      value.median = median;

    }

    return median;
  }

  static isEven(a) {
    return a % 2 === 0;
  }

  static getSum(list) {
    return list.reduce((a, b) => a + b);
  }

  static getModeOfEachUrl(value) {
    let numMapping = {},
      greatestFreq = 0,
      mode = "NA",
      {responseTimeList} = value;

    responseTimeList.forEach(function findMode(number) {
      numMapping[number] = (numMapping[number] || 0) + 1;

      if (numMapping[number] > 1 && greatestFreq < numMapping[number]) {
        greatestFreq = numMapping[number];
        mode = number;
      }
    });
    value.mode = mode;

    return mode;
  }

  static getTopDyno(value) {
    if (value.urlDyno.size) {
      let maxDynoObj = {},
        maxDyno;

      for (let [key, item] of value.urlDyno.entries()) {
        if (!maxDynoObj[key]) {
          maxDynoObj[key] = item;
          maxDyno = key;
        }else if (maxDynoObj[key] < item) {
          maxDynoObj[key] = item;
          maxDyno = key;
        }
      }

      value.maxDyno = maxDyno;
    }
  }

  printInConsole() {
    if (this.urlMap.size) {
      for (let [key, value] of this.urlMap.entries()) {
        console.log(`Url: ${key} Count: ${value.count} Mean: ${value.mean} Median: ${value.median} Mode: ${value.mode} dyno: ${value.maxDyno}`);
      }
    }
  }
}

module.exports = LogParser;


