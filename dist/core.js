/*!
 * contentstack-webhook-listener
 * copyright (c) Contentstack LLC
 * MIT Licensed
 */
'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createListener = void 0;
const basic_auth_1 = __importDefault(require("basic-auth"));
const bodyParser = __importStar(require("body-parser"));
const debug_1 = require("debug");
const http_1 = require("http");
const util_1 = require("util");
const logger_1 = require("./logger");
const jsonParser = util_1.promisify(bodyParser.json());
let _config = {};
let _notify;
const debug = debug_1.debug('webhook:listener');
/**
 * Handle requests
 * @param {Object} request request object
 * @param {Object} response response object
 */
const requestHandler = (request, response) => {
    logger_1.logger.info(`Request recived, '${request.method} : ${request.url}'`);
    return Promise.resolve().then(() => {
        // Should be a POST call.
        if (request.method && request.method !== 'POST') {
            debug('Only POST call is supported.');
            return Promise.reject({
                body: `Only POST call is supported.`,
                statusCode: 400,
                statusMessage: 'Not allowed',
            });
        }
    }).then(() => {
        // validate endpoint
        debug(`${request.url} invoked`);
        if (request.url !== _config.listener.endpoint) {
            debug('url authentication failed');
            return Promise.reject({
                body: `${request.url} not found.`,
                statusCode: 404,
                statusMessage: 'Not Found',
            });
        }
    }).then(() => {
        // verify authorization
        if (_config.listener.basic_auth) {
            debug('validating basic auth');
            const creds = basic_auth_1.default(request);
            if (!creds || (creds.name !== _config.listener.basic_auth.user || creds.pass !== _config.listener.basic_auth.pass)) {
                debug('basic auth failed');
                debug('expected %O but received %O', _config.listener.basic_auth, creds);
                return Promise.reject({
                    body: 'Invalid Basic auth.',
                    statusCode: 401,
                    statusMessage: 'Unauthorized',
                });
            }
        }
    }).then(() => {
        // validate custom headers
        for (const headerKey in _config.listener.headers) {
            debug('validating headers');
            if (request.headers[headerKey] !== _config.listener.headers[headerKey]) {
                debug(`${headerKey} was not found in req headers`);
                return Promise.reject({
                    body: 'Header key mismatch.',
                    statusCode: 417,
                    statusMessage: 'Expectation failed',
                });
            }
        }
    }).then(() => {
        return jsonParser(request, response).then(() => {
            try {
                const body = request.body;
                const type = body.module;
                const event = body.event;
                let locale;
                if (type !== 'content_type') {
                    locale = body.data.locale;
                }
                // validate event:type
                if (!_config.listener.actions[type] ||
                    _config.listener.actions[type].indexOf(event) === -1) {
                    debug(`${event}:${type} not defined for processing`);
                    return Promise.reject({
                        body: `${event}:${type} not defined for processing`,
                        statusCode: 403,
                        statusMessage: 'Forbidden',
                    });
                }
                const data = {};
                switch (type) {
                    case 'asset':
                        data.data = body.data.asset;
                        data.locale = locale;
                        data.content_type_uid = '_assets';
                        break;
                    case 'entry':
                        data.locale = locale;
                        data.data = body.data.entry;
                        data.content_type = body.data.content_type;
                        data.content_type_uid = body.data.content_type.uid;
                        break;
                    default:
                        data.content_type = body.data;
                        data.content_type_uid = '_content_types';
                        break;
                }
                data.event = event;
                _notify(data);
                return Promise.resolve({ statusCode: 200, statusMessage: 'OK', body: data });
            }
            catch (err) {
                return Promise.reject({
                    body: err,
                    statusCode: 500,
                    statusMessage: 'Internal Error',
                });
            }
        });
    }).then((value) => {
        response.setHeader('Content-Type', 'application/json');
        response.statusCode = value.statusCode;
        response.statusMessage = value.statusMessage;
        response.end(JSON.stringify(value.body));
        return;
    }).catch((error) => {
        response.setHeader('Content-Type', 'application/json');
        response.statusCode = error.statusCode;
        response.statusMessage = error.statusMessage;
        response.end(JSON.stringify({ error: { message: error.body } }));
        return;
    });
};
/**
 * Creates server for webhook listener.
 * @param {Object} config
 * @param {Function} notify
 * @returns {http.Server}
 */
function createListener(config, notify) {
    if (!config) {
        throw new Error('Please provide configurations.');
    }
    if (!notify) {
        throw new Error('Please provide notify function.');
    }
    _config = config;
    _notify = notify;
    return http_1.createServer(requestHandler);
}
exports.createListener = createListener;
//# sourceMappingURL=core.js.map