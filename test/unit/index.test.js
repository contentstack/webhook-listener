const request = require("supertest");
const http = require("http");
const winston = require("winston");
const { register, start, getConfig, setConfig, initConfig } = require("../../dist");
const logs = require("../../dist/logger");
const { defaultConfig } = require("../../dist/config");

let notify = function (res) {
  //console.dir(response, { showHidden: true, colors: true, depth: null });
};

const dummyConsumerWithoutNotify = {};

describe("Test start method", () => {
  test("start method without registering consumers should throw error", () => {
    start()
      .then()
      .catch(error => {
        expect(error.message).toBe("Aborting start of webhook listener, since no function is provided to notify.");
      })
      .finally(srv => {
        initConfig();
      })
  });
});

describe("Test register method", () => {
  test("It should return true as consumer contains notify method", () => {
    expect(register(notify)).toBe(true);
  });
  test("It should throw error as consumer not contain notify method", () => {
    expect(() => {
      register(dummyConsumerWithoutNotify);
    }).toThrowError("Provide function to notify consumer.");
  });
});

describe("Test start method without user config.", () => {
  let server;

  beforeAll(() => {
    register(notify);
    start().then(svr => {
      server = svr;
    });
  });

  afterAll(function () {
    server.close();
    initConfig();
  });

  test("Start method should return instance of http.server", () => {
    expect(server).toBeInstanceOf(http.Server);
  });

  test("Default port should be 5000", () => {
    expect(server.address().port).toBe(5000);
  });

  test("POST /notify publish entry", () => {
    let dummyPayload = require("./dummy/entry_publish.json");
    return request(server)
      .post("/notify")
      .send(dummyPayload)
      .set("Accept", "application/json")
      .then(response => {
        expect(response.statusCode).toBe(200);
      });
  });

  test("POST /notify with action not allowed for entry.", () => {
    let dummyPayload = require("./dummy/entry_created.json");
    return request(server)
      .post("/notify")
      .send(dummyPayload)
      .set("Accept", "application/json")
      .then(response => {
        expect(response.statusCode).toBe(403);
      });
  });

  test("POST /notify with action delete cotenttype.", () => {
    let dummyPayload = require("./dummy/cotenttype_deleted.json");
    return request(server)
      .post("/notify")
      .send(dummyPayload)
      .set("Accept", "application/json")
      .then(response => {
        expect(response.statusCode).toBe(200);
      });
  });

  test("POST /notify publish asset", () => {
    let dummyPayload = require("./dummy/asset_publish.json");
    return request(server)
      .post("/notify")
      .send(dummyPayload)
      .set("Accept", "application/json")
      .then(response => {
        expect(response.statusCode).toBe(200);
      });
  });

  test("GET /notify should throw 400", () => {
    return request(server)
      .get("/notify")
      .then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.body.error.message).toBe(
          "Only POST call is supported.",
        );
      });
  });

  test("GET /notfound should throw 404", done => {
    let dummyPayload = require("./dummy/entry_publish.json");
    return request(server)
      .post("/trigger")
      .send(dummyPayload)
      .set("Accept", "application/json")
      .end((err, res) => {
        expect(res.statusCode).toBe(404);
        done();
      });
  });
});

describe("Test getConfig method", () => {
  test("It should return default config.", () => {
    initConfig();
    let config = getConfig();
    console.log('config', config)

    expect(config.listener.port).toBe(5000);
    expect(config.listener.endpoint).toBe("/notify");
  });
});

describe("Test setConfig method", () => {
  test("It should return modified config.", () => {
    initConfig();
    let userConfig = {
      userKey: "userValue"
    };
    setConfig(userConfig);
    let config = getConfig();
    console.log('config', config)

    expect(config.listener.port).toBe(5000);
    expect(config.listener.endpoint).toBe("/notify");
    expect(config.userKey).toBe("userValue");
  });
});

describe("Test start method with custom logger", () => {
  test("It should set custom logger using start method.", () => {
    register(notify);
    let customLogger = winston.createLogger({
      transports: [
        new winston.transports.Console(),
      ],
    });

    start({}, customLogger).then(srv => {
      server = srv;
      expect(typeof logs.logger).toBe("object");
      expect(logs.logger.transports[0].name).toBe("console");
      server.close();
    });
  });
});

describe("Test start method with invalid user config", () => {
  test("It should throw error when endpoint in config set to number", done => {
    let config;
    register(notify);
    config = {
      listener: {
        port: "trigger",
        endpoint: 1232,
      },
    };
    start(config)
      .then(svr => { })
      .catch(error => {
        expect(error.message).toBe("Please provide valid listener.endpoint");
      })
      .finally(done);
  });

  test("It should throw error when port in config set to string", done => {
    let config;
    register(notify);
    config = {
      listener: {
        port: "trigger",
        endpoint: "trigger",
      },
    };
    start(config)
      .then(svr => {
        svr.close()
      })
      .catch(error => {
        expect(error.message).toBe("Please provide valid listener.port");
      })
      .finally(done);
  });
});

describe("Test start method with user config", () => {
  let server;
  let config;
  beforeAll(() => {
    register(notify);
    config = {
      listener: {
        port: 4000,
        endpoint: "trigger",
      },
    };
    server = start(config).then(svr => {
      server = svr;
    });
  });
  afterAll(function () {
    server.close();
    initConfig();
  });

  test("start method should return instance of http.server", () => {
    expect(server).toBeInstanceOf(http.Server);
  });

  test("default port should be 4000", () => {
    expect(server.address().port).toBe(4000);
  });

  test("POST /trigger", () => {
    let dummyPayload = require("./dummy/entry_publish.json");
    return request(server)
      .post("/trigger")
      .send(dummyPayload)
      .set("Accept", "application/json")
      .then(response => {
        expect(response.statusCode).toBe(200);
      });
  });

  test("GET /trigger should throw 400", () => {
    return request(server)
      .get("/notify")
      .then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.body.error.message).toBe(
          "Only POST call is supported.",
        );
      });
  });

  test("GET /notfound should throw 404", done => {
    let dummyPayload = require("./dummy/entry_publish.json");
    return request(server)
      .post("/notfound")
      .send(dummyPayload)
      .set("Accept", "application/json")
      .end((err, res) => {
        expect(res.statusCode).toBe(404);
        done();
      });
  });
});

describe("Test start method with custom header.", () => {
  let server;
  let config;
  beforeAll(() => {
    register(notify);
    config = {
      listener: {
        port: 4000,
        endpoint: "/trigger",
        headers: {
          "x-secure-header": "randomnumbers",
        },
      },
    };
    server = start(config).then(svr => {
      server = svr;
    });
  });

  afterAll(function () {
    server.close();
    initConfig();
  });

  test("POST with custom header", () => {
    let dummyPayload = require("./dummy/entry_publish.json");
    return request(server)
      .post("/trigger")
      .send(dummyPayload)
      .set("Accept", "application/json")
      .set("x-secure-header", "randomnumbers")
      .then(response => {
        expect(response.statusCode).toBe(200);
      });
  });
  test("POST with wrong custom header", () => {
    let dummyPayload = require("./dummy/entry_publish.json");
    return request(server)
      .post("/trigger")
      .send(dummyPayload)
      .set("Accept", "application/json")
      .set("x-secure-header", "adsf")
      .then(response => {
        expect(response.statusCode).toBe(417);
      });
  });
  test("POST without custom header", () => {
    let dummyPayload = require("./dummy/entry_publish.json");
    return request(server)
      .post("/trigger")
      .send(dummyPayload)
      .set("Accept", "application/json")
      .then(response => {
        expect(response.statusCode).toBe(417);
      });
  });
});

describe("Test start method with basic auth ", () => {
  let server;
  let config;
  beforeAll(() => {
    register(notify);
    config = {
      listener: {
        port: 4000,
        endpoint: "/trigger",
        basic_auth: {
          user: "admin",
          pass: "admin",
        },
      },
    };
    server = start(config).then(svr => {
      server = svr;
    });
  });

  afterAll(function () {
    server.close();
    initConfig();
  });

  test("POST /trigger with basic auth", () => {
    let dummyPayload = require("./dummy/entry_publish.json");
    return request(server)
      .post("/trigger")
      .auth("admin", "admin")
      .send(dummyPayload)
      .set("x-secure-header", "randomnumbers")
      .set("Accept", "application/json")
      .then(response => {
        expect(response.statusCode).toBe(200);
      });
  });

  test("POST /trigger with invalid username in basic auth.", () => {
    let dummyPayload = require("./dummy/entry_publish.json");
    return request(server)
      .post("/trigger")
      .auth("owner", "admin")
      .send(dummyPayload)
      .set("Accept", "application/json")
      .then(response => {
        expect(response.statusCode).toBe(401);
      });
  });

  test("POST /trigger with invalid password  in basic auth.", () => {
    let dummyPayload = require("./dummy/entry_publish.json");
    return request(server)
      .post("/trigger")
      .auth("admin", "password")
      .send(dummyPayload)
      .set("Accept", "application/json")
      .then(response => {
        expect(response.statusCode).toBe(401);
      });
  });

  test("POST /trigger with invalid credentials in basic auth.", () => {
    let dummyPayload = require("./dummy/entry_publish.json");
    return request(server)
      .post("/trigger")
      .auth("owner", "password")
      .send(dummyPayload)
      .set("Accept", "application/json")
      .then(response => {
        expect(response.statusCode).toBe(401);
      });
  });

  test("POST /trigger without basic auth.", () => {
    let dummyPayload = require("./dummy/entry_publish.json");
    return request(server)
      .post("/trigger")
      .send(dummyPayload)
      .set("Accept", "application/json")
      .then(response => {
        expect(response.statusCode).toBe(401);
      });
  });
});
