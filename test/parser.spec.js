let chai = require("chai"),
  LogParser = require("../lib/LogParser"),
  expect = chai.expect,
  logObj;

chai.should();
function initValid() {
  logObj = new LogParser(__dirname + '/ValidTest.log')
}

function initInvalid() {
  logObj = new LogParser(__dirname + "/InvalidTest.log")
}
describe("LogParser test cases", () => {
  describe("when passed with valid log file", () => {
    before(initValid);
    it ("should read log file line by line", (done) => {

      logObj.readLineByLine()
        .then(result => {
          expect(result).to.equal("Read entire file");
          done();
        }, err => {
          done(err);
        });
    });
  });
  
  describe("when passed with invalid log file", () => {
    before(initInvalid);
    it ("should return empty urlMap", (done) => {

      logObj.readLineByLine()
        .then(result => {
          expect(logObj.urlMap.size).to.equal(0);
          done();
        }, err => {
          done(err);
        });
    });
  });
  
  describe("Math", () => {
    it("should return true for float number", () => {
      let isFloat = LogParser.isFloat(14.6);

      expect(isFloat).to.equal(true);
    });

    it("should return sum of array of integers", () => {
      let sum = LogParser.getSum([1, 2, 3, 4, 5]);

      expect(sum).to.equal(15)
    });

    it("should return true for even number", () => {
      let isEven = LogParser.isEven(8);

      expect(isEven).to.equal(true);
    });
    
    it("it should return median of array of intergers", () => {
      let obj = {
        "responseTimeList": [1, 2, 3, 4, 5]
      },
        median = LogParser.getMedianOfEachUrl(obj);
      
      expect(median).to.equal(3);
    });
    
    it("it should return mode of array of integers", () => {
      let obj = {
        "responseTimeList": [1, 1, 3, 3, 3, 2, 8]
      },
        mode = LogParser.getModeOfEachUrl(obj);

      expect(mode).to.equal(3)
    })
  })
});
