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
import { EventEmitter } from 'events';

const debug = Debug('webhook:listener');
let notify;
let config: any = {};
let appConfig: any = defaultConfig;
let server: any = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10; // After this, switch to long-term retry
const reconnectDelay = 5000; // 5 seconds
const longTermRetryDelay = 30000; // 30 seconds for persistent retries
let isShuttingDown = false;
let isInLongTermRetry = false;
const emitter = new EventEmitter();

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
 * Start webhook listener with enhanced error handling and reconnection logic.
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
      appConfig = merge(appConfig, userConfig);
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

      startServer()
        .then((serverInstance) => {
          server = serverInstance;
          resolve(serverInstance);
        })
        .catch(reject);
    } catch (error) {
      return reject(error);
    }
  });
}

/**
 * Start the HTTP server with error handling and reconnection logic.
 * @private
 */
function startServer(): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // First, ensure any existing server is properly closed
      if (server && server.listening) {
        debug('Closing existing server before starting new one');
        server.close(() => {
          debug('Existing server closed, starting new server');
          createNewServer(resolve, reject);
        });
        return;
      }
      
      createNewServer(resolve, reject);
    } catch (error) {
      return reject(error);
    }
  });
}

/**
 * Create a new server instance with proper error handling
 * @private
 */
function createNewServer(resolve: Function, reject: Function) {
  try {
    debug(MESSAGES.STARTING_WITH_CONFIG(JSON.stringify(appConfig)));
    const port = process.env.PORT || appConfig.listener.port;
    
    const serverInstance = createListener(appConfig, notify);
    
    // Handle connection errors
    serverInstance.on('clientError', (error: any, socket: any) => {
      log.warn(MESSAGES.CLIENT_ERROR(error.message));
      debug('Client error details:', error);
      
      // Destroy the socket to prevent hanging connections
      if (socket && !socket.destroyed) {
        socket.destroy();
      }
    });
    
    // Handle server close events
    serverInstance.on('close', () => {
      log.info(MESSAGES.SERVER_CLOSED);
      if (!isShuttingDown) {
        debug('Server closed, will attempt reconnection');
        // Don't immediately reconnect here, let the error handler do it
      }
    });
      
    // Handle server listen errors (like EADDRINUSE)
    serverInstance.on('listening', () => {
      log.info(MESSAGES.SERVER_RUNNING(port));
      reconnectAttempts = 0; // Reset reconnect attempts on successful start
      isInLongTermRetry = false;
      emitter.emit('server-started', serverInstance);
      resolve(serverInstance);
    });
    
    // Handle listen errors specifically
    serverInstance.on('error', (error: any) => {
      log.error(MESSAGES.SERVER_ERROR(error.message, error.code));
      debug('Server error details:', error);
      
      // For all errors (including EADDRINUSE), reject and let reconnection logic handle it
      if (!isShuttingDown) {
        emitter.emit('server-error', error);
      }
      reject(error);
    });
    
    serverInstance.listen(port);
  } catch (error) {
    reject(error);
  }
}

/**
 * Handle server reconnection with exponential backoff.
 * @private
 */
function handleServerReconnection() {
  if (isShuttingDown) {
    return;
  }
  
  reconnectAttempts++;
  
  // Use shorter delays and reset counter more frequently
  let delay;
  if (reconnectAttempts <= 3) {
    // Quick retries for first 3 attempts (2s, 4s, 8s) + small random delay to avoid port conflicts
    delay = Math.min(2000 * Math.pow(2, reconnectAttempts - 1), 8000) + Math.random() * 1000;
  } else if (reconnectAttempts <= 10) {
    // Medium delays for attempts 4-10 (15s) + random delay
    delay = 15000 + Math.random() * 5000;
  } else {
    // Longer delays for persistent issues (30s) + random delay
    delay = 30000 + Math.random() * 10000;
    // Reset counter every 20 attempts to give fresh chances
    if (reconnectAttempts >= 20) {
      log.info('Resetting reconnection counter for fresh attempts');
      reconnectAttempts = 0;
    }
  }
  
  log.info(MESSAGES.RECONNECT_DELAY(delay));
  
  setTimeout(() => {
    if (!isShuttingDown) {
      startServer()
        .then((serverInstance) => {
          server = serverInstance;
          reconnectAttempts = 0; // Reset counter on success
          log.info(MESSAGES.RECONNECT_SUCCESS);
          emitter.emit('reconnect-success', serverInstance);
        })
        .catch((error) => {
          log.warn(MESSAGES.RECONNECT_FAILED(error.message));
          handleServerReconnection(); // Try again
        });
    }
  }, delay);
}

/**
 * Check if an error is a network-related error that requires reconnection.
 * @private
 */
function isNetworkError(error: any): boolean {
  const networkErrorCodes = [
    'ECONNRESET',
    'ECONNREFUSED', 
    'ETIMEDOUT',
    'ENOTFOUND',
    'EHOSTUNREACH',
    'EPIPE',
    'EADDRINUSE'
  ];
  
  return networkErrorCodes.includes(error.code) || 
         error.message?.includes('socket hang up') ||
         error.message?.includes('connection reset');
}



/**
 * Gracefully shutdown the webhook listener.
 * @public
 */
export function shutdown(): Promise<void> {
  return new Promise((resolve) => {
    isShuttingDown = true;
    
    if (server) {
      server.close(() => {
        log.info(MESSAGES.SERVER_SHUTDOWN_COMPLETE);
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Get the event emitter for webhook listener events.
 * @public
 */
export function getEventEmitter(): EventEmitter {
  return emitter;
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
