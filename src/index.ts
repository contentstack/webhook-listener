/*!
* contentstack-webhook-listener
* copyright (c) Contentstack LLC
* MIT Licensed
*/

'use strict';

import { debug as Debug } from 'debug';
import { merge as _merge } from 'lodash';
import { createListener } from './core';
import { defaultConfig } from './defaults';
import { logger as log, setLogger } from './logger';

const debug = Debug('webhook:listener');
let notify;
let config: any = {};

/**
 * Register a function that will get called when webhook is triggered.
 * @public
 * @param {function} consumer Function that will get called when webhook is triggered.
 */
export function register(consumer: any) {
  if (typeof consumer !== 'function') {
    throw new Error('Provide function to notify consumer.');
  }
  debug('register called with %O', notify);
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
  if (customLogger) {
    setLogger(customLogger);
  }
  return new Promise((resolve, reject) => {
    debug('start called with %O', userConfig);
    try {
      validateConfig(userConfig);
    } catch (err){
      return reject(err)
    }
    // Override default with user config
    if (userConfig) {
      // Reassiging to different variable as import caches config while running test cases
      // and provides old merged config.
      const _defaultConfig = defaultConfig;
      resetConfig();
      config = _merge(_defaultConfig, userConfig);
    } else {
      log.info('Starting listener with default configs');
      config = defaultConfig;
    }
    if (!notify) {
      log.error('Aborting start of webhook listener, since no function is provided to notify.');
      reject(new Error(`Aborting start of webhook listener, since no function is provided to notify.`));
    } else {
      debug('starting with config: ' + JSON.stringify(config));
      const port = process.env.PORT || config.listener.port;
      const server =  createListener(config, notify).listen(
        port, () => {
          log.info(`Server running at port ${port}`);
        },
      );
      return resolve(server);
    }
  });
}

/**
 * Get configuration.
 */
export function getConfig() {
  return config;
}

/**
 * Reset configuration to blank object.
 */
function resetConfig() {
  return config = {};
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
        throw new TypeError('Please provide valide listener.endpoint');
      }
    }
    if (customConfig.listener.port && typeof customConfig.listener.port !== 'number') {
      throw new TypeError('Please provide valide listener.port');
    }
  }
}

export {
  setLogger,
};
