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
import { MESSAGES } from './messages';


let _config: any = {};
let _notify: any;
const debug = Debug('webhook:listener');

let jsonParser = bodyParser.json({ limit: '1mb' });
/**
 * Handle requests with enhanced error handling for socket issues
 * @param {Object} request request object
 * @param {Object} response response object
 */
const requestHandler = (request, response) => {
  // Set up error handling for the request/response cycle
  const handleSocketError = (error) => {
    debug('Socket error in request handler:', error);
    if (!response.headersSent) {
      try {
        response.statusCode = 500;
        response.statusMessage = 'Internal Server Error';
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ error: { message: 'Connection error occurred' } }));
      } catch (writeError) {
        debug('Failed to send error response:', writeError);
      }
    }
  };
  
  // Handle socket hang up and connection reset errors
  request.on('error', handleSocketError);
  response.on('error', handleSocketError);
  
  // Handle client disconnect
  request.on('close', () => {
    debug('Client disconnected during request processing');
  });
  
  log.info(MESSAGES.REQUEST_RECEIVED);
  debug('_config', _config);
  // Explicitly remove or override the X-Powered-By header
  response.setHeader('X-Powered-By', ''); 
  return Promise.resolve().then(() => {
    // Should be a POST call.
    if (request.method && request.method !== 'POST') {
      debug(MESSAGES.ONLY_POST_SUPPORTED);
      return Promise.reject({
        body: `Only POST requests are supported.`,
        statusCode: 400,
        statusMessage: 'Not allowed',
      });
    }
  }).then(() => {
    // validate endpoint
    debug(MESSAGES.REQUEST_INVOKED(request.url));
    if (_config && _config.listener && request.url !== _config.listener.endpoint) {
      debug(MESSAGES.URL_AUTH_FAILED);
      return Promise.reject({
        body: `${request.url} not found.`,
        statusCode: 404,
        statusMessage: 'Not Found',
      });
    }
  }).then(() => {
    // verify authorization
      debug(MESSAGES.VALIDATING_BASIC_AUTH, _config.listener);
      if (_config && _config.listener && _config.listener.basic_auth) {
        debug(MESSAGES.VALIDATING_BASIC_AUTH);
        const creds = BasicAuth(request);
        if (!creds || (creds.name !== _config.listener.basic_auth.user || creds.pass !== _config.listener.basic_auth.pass)) {
        debug(MESSAGES.BASIC_AUTH_FAILED);
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
    debug(MESSAGES.VALIDATING_CUSTOM_HEADERS);
    if (_config && _config.listener) {
      for (const headerKey in _config.listener.headers) {
        debug(MESSAGES.VALIDATING_HEADERS);
        if (request.headers[headerKey] !== _config.listener.headers[headerKey]) {
          debug(MESSAGES.HEADER_NOT_FOUND(headerKey));
          return Promise.reject({
              body: 'Header key mismatch.',
              statusCode: 417,
              statusMessage: 'Expectation failed',
            });
        }
      } 
    }
  }).then(async () => {
    debug(MESSAGES.PARSING_JSON);
    try {
      if (_config.reqBodyLimit) {
        jsonParser = bodyParser.json({ limit: _config.reqBodyLimit });
      }
      await new Promise((resolve, reject) => {
        jsonParser(request, response, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(undefined);
          }
        });
      });
      const body = request.body;
      const type = body.module;
      const event = body.event;
      let locale;

      if (type !== 'content_type') {
        locale = body.data.locale;
      }
      debug('_config.listener.actions[type]', _config.listener.actions[type]);
      debug(MESSAGES.EVENT, event);
      // validate event:type
      if (
        !_config.listener.actions[type] ||
        _config.listener.actions[type].indexOf(event) === -1
      ) {
        debug(MESSAGES.EVENT_NOT_DEFINED(event, type));
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
      // Enhanced error handling for notify function
      _notify(data).then((data) => {
        debug(MESSAGES.DATA_RECEIVED_NOTIFY, data);
      }).catch((error) => {
        log.error(MESSAGES.ERROR_OCCURRED_NOTIFY, error);
        debug('Notify function error details:', error);
        // Don't fail the request if notify fails - webhook should still return success
      });
      return Promise.resolve({ statusCode: 200, statusMessage: 'OK', body: data });
    } catch (err) {
      // Log the full error internally for debugging
      log.error('Error processing request:', err);
      
      // Return only safe, generic error message to client
      return Promise.reject({
        body: 'Failed to process request',
        statusCode: 500,
        statusMessage: 'Internal Error',
      });
    }
  }).then((value) => {
    debug(MESSAGES.VALUE, value);
    
    // Check if response is still writable before sending
    if (!response.headersSent && !response.destroyed) {
      try {
        response.setHeader('Content-Type', 'application/json');
        response.statusCode = value.statusCode;
        response.statusMessage = value.statusMessage;
        // Example: Return only safe fields
        const safeBody = {
          data: value.body?.data || value?.body || null
        };

        response.end(JSON.stringify(safeBody));
      } catch (writeError) {
        debug('Failed to send success response:', writeError);
      }
    }
    return;
  }).catch((error) => {
    debug(MESSAGES.ERROR, error);
    
    // Enhanced error response handling
    if (!response.headersSent && !response.destroyed) {
      try {
        const safeError = {
          statusCode: error.statusCode || 500,
          statusMessage: error.statusMessage || 'Internal Server Error',
          body: typeof error.body === 'string' 
          ? error.body 
          : (typeof error.body === 'object' && error.body !== null
              ? JSON.stringify(error.body)
              : 'An unexpected error occurred.'),    
        };
        
        response.setHeader('Content-Type', 'application/json');
        response.statusCode = safeError.statusCode;
        response.statusMessage = safeError.statusMessage;
        response.end();
      } catch (writeError) {
        debug('Failed to send error response:', writeError);
        // Last resort - try to close the connection
        try {
          response.destroy();
        } catch (destroyError) {
          debug('Failed to destroy response:', destroyError);
        }
      }
    }
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
