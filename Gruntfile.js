"use strict";

module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    "eslint": {
      "target": ["lib/**/*.js", "test/lib/**/*.js", "Gruntfile.js"],
      "options": {
        "configFile": ".eslintrc"
      }
    },
    "mochaTest": {
      "test": {
        "options": {
          "reporter": "spec",
          "captureFile": "test_results.txt",
          "quiet": false,
          "timeout": 2000
        },
        "src": ["test/**/*.spec.js"]
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks("grunt-eslint");
  grunt.loadNpmTasks("grunt-mocha-test");

  // Default task.
  grunt.registerTask("default", [
    "buildCommon",
    "testCommon"
  ]);

  // Common build task
  grunt.registerTask("buildCommon", [
    "eslint"
  ]);

  // Common test task
  grunt.registerTask("testCommon", [
    "mochaTest:test"
  ]);
};
