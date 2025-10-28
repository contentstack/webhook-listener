/*!
 * contentstack-webhook-listener
 * copyright (c) Contentstack LLC
 * MIT Licensed
 */

'use strict';

import { debug as Debug } from 'debug';
import { merge } from 'lodash';
import { createListener } from './core';
import { defaultConfig } from './defaults';
import { logger as log, setLogger } from './logger';
import { MESSAGES } from './messages';

const debug = Debug('webhook:listener');
let notify;
let config: any = {};
let appConfig: any = defaultConfig

/**
 * Register a function that will get called when webhook is triggered.
 * @public
 * @param {function} consumer Function that will get called when webhook is triggered.
 */
export function register(consumer: any) {
  if (typeof consumer !== 'function') {
    throw new Error('Provide function to notify consumer.');
  }
  debug(MESSAGES.REGISTER_CALLED, notify);
  notify = consumer;
  return true;
}

/**
 * Start webhook listener.
 * @public
 * @param {Object} userConfig JSON object that will override default config.
 * @param {Logger} customLogger Instance of a logger that should have info, debug, error, warn method.
 * @returns {Promise} Promise object represents http.Server
 */
export function start(userConfig: any, customLogger?: any) {
  return new Promise((resolve, reject) => {
    try {
      if (customLogger) {
        setLogger(customLogger);
      }
      debug(MESSAGES.START_CALLED, userConfig);
      appConfig = merge(appConfig, userConfig)
      validateConfig(appConfig);

      if (!notify) {
        log.error(
          'Aborting start of webhook listener, since no function is provided to notify.',
        );
        return reject(
          new Error(
            `Aborting start of webhook listener, since no function is provided to notify.`,
          ),
        );
      }

      debug(MESSAGES.STARTING_WITH_CONFIG(JSON.stringify(appConfig)));
      const port = process.env.PORT || appConfig.listener.port;
      const server = createListener(appConfig, notify).listen(port, () => {
        log.info(MESSAGES.SERVER_RUNNING(port));
      });
      return resolve(server);
    } catch (error) {
      return reject(error)
    }
  });
}

/**
 * @public
 * @method setConfig
 * @description
 * Sets listener library's configuration
 * @param _config Listener lib config
 */
export const setConfig = (_config) => {
  appConfig = merge(appConfig, _config)
}

/**
 * Get configuration.
 */
export function getConfig() {
  return config;
}

/**
 * Validates configuration.
 * @param {object} customConfig JSON object that needs to validate.
 */
function validateConfig(customConfig) {
  if (customConfig && customConfig.listener) {
    if (customConfig.listener.endpoint) {
      if (typeof customConfig.listener.endpoint === 'string') {
        const reg = /^\//;
        if (!reg.test(customConfig.listener.endpoint)) {
          customConfig.listener.endpoint = '/' + customConfig.listener.endpoint;
        }
      } else {
        throw new TypeError(MESSAGES.INVALID_LISTENER_ENDPOINT);
      }
    }
    if (
      customConfig.listener.port &&
      typeof customConfig.listener.port !== 'number'
    ) {
      throw new TypeError(MESSAGES.INVALID_LISTENER_PORT);
    }
  }
}

export { setLogger };
