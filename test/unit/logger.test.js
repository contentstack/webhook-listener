const log = require("../../dist/logger");
const {Console} = require("console");
const winston = require("winston");

describe("Check default logger", () => {
    test("Default logger should be instance of console", () => {
        expect(log.logger).toBeInstanceOf(Console);
    });
});

describe("Check setLogger method", () => {
    let customLogger;

    test("Should set console as logger due to undefined logger.", () => {
        log.setLogger(customLogger);
        expect(log.logger).toBeInstanceOf(Console);
    });

    test("Should set console as logger due to missing function.", () => {
        customLogger = {
            info: () => {},
            error: () => {},
            warn: () => {},
        };
        log.setLogger(customLogger);
        expect(log.logger).toBeInstanceOf(Console);
    });

    test("Should set custom logger.", async () => {
        customLogger = winston.createLogger({
            level: "info",
            format: winston.format.json(),
            defaultMeta: {service: "user-service"},
            transports: [
                new winston.transports.Console(),
            ],
        });
        log.setLogger(customLogger);
        expect(typeof log.logger).toBe("object");
        expect(log.logger.level).toBe("info");

    });
});
