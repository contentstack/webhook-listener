/*!
 * contentstack-webhook-listener
 * copyright (c) Contentstack LLC
 * MIT Licensed
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLogger = exports.initConfig = exports.getConfig = exports.setConfig = exports.start = exports.register = void 0;
const debug_1 = require("debug");
const lodash_1 = require("lodash");
const core_1 = require("./core");
const config_1 = require("./config");
const logger_1 = require("./logger");
Object.defineProperty(exports, "setLogger", { enumerable: true, get: function () { return logger_1.setLogger; } });
const debug = debug_1.debug('webhook:listener');
let notify;
let config = config_1.defaultConfig;
/**
 * Register a function that will get called when webhook is triggered.
 * @public
 * @param {function} consumer Function that will get called when webhook is triggered.
 */
function register(consumer) {
    if (typeof consumer !== 'function') {
        throw new Error('Provide function to notify consumer.');
    }
    debug('register called with %O', notify);
    notify = consumer;
    return true;
}
exports.register = register;
/**
 * Start webhook listener.
 * @public
 * @param {Object} userConfig JSON object that will override default config.
 * @param {Logger} customLogger Instance of a logger that should have info, debug, error, warn method.
 * @returns {Promise} Promise object represents http.Server
 */
function start(userConfig, customLogger) {
    return new Promise((resolve, reject) => {
        try {
            if (customLogger) {
                logger_1.setLogger(customLogger);
            }
            debug('start called with %O', userConfig);
            setConfig(userConfig);
            validateConfig(config);
            if (!notify) {
                logger_1.logger.error('Aborting start of webhook listener, since no function is provided to notify.');
                return reject(new Error(`Aborting start of webhook listener, since no function is provided to notify.`));
            }
            debug('starting with config: ' + JSON.stringify(config));
            const port = process.env.PORT || config.listener.port;
            const server = core_1.createListener(config, notify).listen(port, () => {
                logger_1.logger.info(`Server running at port ${port}`);
            });
            return resolve(server);
        }
        catch (error) {
            return reject(error);
        }
    });
}
exports.start = start;
/**
 * @public
 * @method setConfig
 * @description
 * Sets listener library's configuration
 * @param {Config} config Listener lib config
 */
function setConfig(newConfig) {
    config = lodash_1.merge(config, newConfig);
}
exports.setConfig = setConfig;
/**
 * Get configuration.
 */
function getConfig() {
    return config;
}
exports.getConfig = getConfig;
/**
 * Initialize / reset configuration to defaults.
 */
function initConfig() {
    config = config_1.defaultConfig;
}
exports.initConfig = initConfig;
/**
 * Validates configuration.
 * @param {Config} customConfig JSON object that needs to validate.
 */
function validateConfig(customConfig) {
    if (customConfig && customConfig.listener) {
        if (customConfig.listener.endpoint) {
            if (typeof customConfig.listener.endpoint === 'string') {
                const reg = /^\//;
                if (!reg.test(customConfig.listener.endpoint)) {
                    customConfig.listener.endpoint = '/' + customConfig.listener.endpoint;
                }
            }
            else {
                throw new TypeError('Please provide valid listener.endpoint');
            }
        }
        if (customConfig.listener.port &&
            typeof customConfig.listener.port !== 'number') {
            throw new TypeError('Please provide valid listener.port');
        }
    }
}
//# sourceMappingURL=index.js.map