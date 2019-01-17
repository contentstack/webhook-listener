const { createListener } = require("../../dist/core");
const { defaultConfig } = require("../../dist/defaults");
const http = require("http");

const  notify = function(res) {
    //console.dir(response, { showHidden: true, colors: true, depth: null });
  };

describe("Test createListener method", () => {
  test("It should throw error as without config and consumers", () => {
    expect(createListener).toThrowError("Please provide configurations.");
  });
  test("It should throw error as notify method not passed", () => {
    expect(() => {
      createListener(defaultConfig);
    }).toThrowError("Please provide notify function.");
  });
  test("It should return instance of http.server", () => {
    expect(createListener(defaultConfig, notify)).toBeInstanceOf(
      http.Server,
    );
  });
});
