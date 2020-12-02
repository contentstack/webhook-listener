"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLogger = exports.logger = void 0;
const console_1 = require("console");
let logger;
exports.logger = logger;
exports.logger = logger = new console_1.Console(process.stdout, process.stderr);
/**
 * It will register a logger this it to be used accross the module other wise
 * console log will be used.
 * @param {object} customLogger instance of a logger to be register
 */
function setLogger(customLogger) {
    const validator = validateLogger(customLogger);
    if (!validator) {
        console.warn('Failed to register logger, using console for logging.');
    }
    else {
        exports.logger = logger = customLogger;
        logger.info('Logger registered successfully.');
    }
}
exports.setLogger = setLogger;
const validateLogger = (instance) => {
    let flag = false;
    if (!instance) {
        return flag;
    }
    const requiredFn = ['info', 'warn', 'log', 'error', 'debug'];
    requiredFn.forEach((name) => {
        if (typeof instance[name] !== 'function') {
            console.warn(`Unable to register custom logger since '${name}()' does not exist on ${instance}!`);
            flag = true;
        }
    });
    return !flag;
};
//# sourceMappingURL=logger.js.map