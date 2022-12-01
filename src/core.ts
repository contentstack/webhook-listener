/*!
 * contentstack-webhook-listener
 * copyright (c) Contentstack LLC
 * MIT Licensed
 */

'use strict';

import BasicAuth from 'basic-auth';
import * as bodyParser from 'body-parser';
import { debug as Debug } from 'debug';
import { createServer } from 'http';
import { promisify } from 'util';
import { logger as log } from './logger';

const jsonParser = promisify(bodyParser.json());

let _config: any = {};
let _notify: any;
const debug = Debug('webhook:listener');

/**
 * Handle requests
 * @param {Object} request request object
 * @param {Object} response response object
 */
const requestHandler = (request, response) => {

  log.info(`Request recived, '${request.method} : ${request.url}'`);
  debug('_config', _config);
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
    if (_config && _config.listener && request.url !== _config.listener.endpoint) {
      debug('url authentication failed');
      return Promise.reject({
        body: `${request.url} not found.`,
        statusCode: 404,
        statusMessage: 'Not Found',
      });
    }
  }).then(() => {
    // verify authorization
      debug('validating basic auth', _config.listener);
      if (_config && _config.listener && _config.listener.basic_auth) {
        debug('validating basic auth');
        const creds = BasicAuth(request);
        if (!creds || (creds.name !== _config.listener.basic_auth.user || creds.pass !== _config.listener.basic_auth.pass)) {
        debug('basic auth failed');
        debug(
          'expected %O but received %O',
          _config.listener.basic_auth,
          creds,
        );
        return Promise.reject({
          body: 'Invalid Basic auth.',
          statusCode: 401,
          statusMessage: 'Unauthorized',
        });
      }
    }
  }).then(() => {
    // validate custom headers
    debug('validate custom headers');
    if (_config && _config.listener) {
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
    }
  }).then(async () => {
    debug('parsing json');
    try {
      await jsonParser(request, response);
      const body = request.body;
      const type = body.module;
      const event = body.event;
      let locale;

      if (type !== 'content_type') {
        locale = body.data.locale;
      }
      debug('_config.listener.actions[type]', _config.listener.actions[type]);
      debug('event', event);
      // validate event:type
      if (
        !_config.listener.actions[type] ||
        _config.listener.actions[type].indexOf(event) === -1
      ) {
        debug(`${event}:${type} not defined for processing`);
        return Promise.reject({
          body: `${event}:${type} not defined for processing`,
          statusCode: 403,
          statusMessage: 'Forbidden',
        });
      }

      const data: any = {};
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
      _notify(data).then((data) => {
        debug('Data [_notify]', data);
      }).catch((error) => {
        debug('Error [_notify]', error);
      });
      return Promise.resolve({ statusCode: 200, statusMessage: 'OK', body: data });
    } catch (err) {
      return Promise.reject({
        body: err,
        statusCode: 500,
        statusMessage: 'Internal Error',
      });
    }
  }).then((value) => {
    debug('Value', value);
    response.setHeader('Content-Type', 'application/json');
    response.statusCode = value.statusCode;
    response.statusMessage = value.statusMessage;
    response.end(JSON.stringify(value.body));
    return;
  }).catch((error) => {
    debug('Error', error);
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
export function createListener(config, notify) {
  if (!config) { throw new Error('Please provide configurations.'); }
  if (!notify) { throw new Error('Please provide notify function.'); }

  _config = config;
  _notify = notify;

  return createServer(requestHandler);
}
