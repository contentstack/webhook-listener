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
import { logger as log } from './logger';
import { promisify } from "util";


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
  try {

    // Should be a POST call.
    if (request.method && request.method !== 'POST') {
      debug('Only POST call is supported.');
      const err = JSON.stringify({
        body: `Only POST call is supported.`,
        statusCode: 400,
        statusMessage: 'Not allowed',
      });
      throw new Error(err);
    }

    // validate endpoint
    debug(`${request.url} invoked`);
    if (request.url !== _config.listener.endpoint) {
      debug('url authentication failed');
      throw new Error(
        JSON.stringify({
          body: `${request.url} not found.`,
          statusCode: 404,
          statusMessage: 'Not Found',
        }),
      );
    }

    // verify authorization
    if (_config.listener.basic_auth) {
      debug('validating basic auth');
      const creds = BasicAuth(request);
      if (!creds || (creds.name !== _config.listener.basic_auth.user || creds.pass !== _config.listener.basic_auth.pass)) {
        debug('basic auth failed');
        debug(
          'expected %O but received %O',
          _config.listener.basic_auth,
          creds,
        );
        throw new Error(
          JSON.stringify({
            body: 'Invalid Basic auth.',
            statusCode: 401,
            statusMessage: 'Unauthorized',
          }),
        );
      }
    }

    // validate custom headers
    for (const headerKey in _config.listener.headers) {
      debug('validating headers');
      if (request.headers[headerKey] !== _config.listener.headers[headerKey]) {
        debug(`${headerKey} was not found in req headers`);
        throw new Error(
          JSON.stringify({
            body: 'Header key mismatch.',
            statusCode: 417,
            statusMessage: 'Expectation failed',
          }),
        );
      }
    }

    const promise = new Promise((resolve, reject) => {

      // use body-parser here..
      jsonParser(request, response, (error) => {
        try {
          const body = request.body;
          const type = body.module;
          const event = body.event;
          let locale;

          if (type !== 'content_type') {
            locale = body.data.locale;
          }

          // validate event:type
          if (
            !_config.listener.actions[type] ||
            _config.listener.actions[type].indexOf(event) === -1
          ) {
            debug(`${event}:${type} not defined for processing`);
            reject({
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
          _notify(data);
          resolve({ statusCode: 200, statusMessage: 'OK', body: data });
        } catch (err) {
          reject({
            body: err,
            statusCode: 500,
            statusMessage: 'Internal Error',
          });
        }
      });
    });

    promise
      .then((value: any) => {
        response.setHeader('Content-Type', 'application/json');
        response.statusCode = value.statusCode;
        response.statusMessage = value.statusMessage;
        response.end(JSON.stringify(value.body));
        return;
      })
      .catch((err: any) => {
        response.setHeader('Content-Type', 'application/json');
        response.statusCode = err.statusCode;
        response.statusMessage = err.statusMessage;
        response.end(JSON.stringify({ error: { message: err.body } }));
        return;
      });
  } catch (err) {
    debug('something went wrong... ', typeof err);
    err = JSON.parse(err.message);
    response.setHeader('Content-Type', 'application/json');
    response.statusCode = err.statusCode;
    response.statusMessage = err.statusMessage;
    response.end(JSON.stringify({ error: { message: err.body } }));
    return;
  }
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
