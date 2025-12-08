/*!
 * contentstack-webhook-listener
 * copyright (c) Contentstack LLC
 * MIT Licensed
 */

'use strict';

/**
 * Centralized messages for the webhook listener.
 * This file contains all log messages, debug messages, and error messages
 * used throughout the application, including enhanced error handling and reconnection messages.
 */

export const MESSAGES = {
  // Debug messages for index.ts
  REGISTER_CALLED: 'Register called with object: %O',
  START_CALLED: 'Start called with object: %O',
  STARTING_WITH_CONFIG: (config: string) => `Starting with config: ${config}`,
  
  // Log messages for index.ts
  SERVER_RUNNING: (port: string | number) => `Server is running on port ${port}.`,
  
  // Error messages for index.ts
  INVALID_LISTENER_ENDPOINT: 'Please provide a valid listener endpoint.',
  INVALID_LISTENER_PORT: 'Please provide a valid listener port.',
  
  // Log messages for core.ts
  REQUEST_RECEIVED: 'Request received.',
  
  // Debug messages for core.ts
  ONLY_POST_SUPPORTED: 'Only POST requests are supported.',
  REQUEST_INVOKED: (url: string) => `Request invoked: ${url}`,
  URL_AUTH_FAILED: 'URL authentication failed.',
  VALIDATING_BASIC_AUTH: 'Validating basic authentication...',
  BASIC_AUTH_FAILED: 'Basic authentication failed.',
  VALIDATING_CUSTOM_HEADERS: 'Validating custom headers...',
  VALIDATING_HEADERS: 'Validating headers...',
  HEADER_NOT_FOUND: (headerKey: string) => `Header '${headerKey}' was not found in the request.`,
  PARSING_JSON: 'Parsing JSON...',
  EVENT: 'Event',
  EVENT_NOT_DEFINED: (event: string, type: string) => `Event '${event}:${type}' not defined for processing.`,
  DATA_RECEIVED_NOTIFY: 'Data received for [_notify].',
  ERROR_OCCURRED_NOTIFY: 'Error occurred in [_notify].',
  VALUE: 'Value',
  ERROR: 'Error',
  
  // Logger messages
  LOGGER_REGISTRATION_FAILED: 'Failed to register logger.',
  LOGGER_REGISTERED_SUCCESS: 'Logger registered successfully.',
  UNABLE_TO_REGISTER_LOGGER: (name: string, instance: any) => 
    `Unable to register custom logger: '${name}()' does not exist on ${instance}.`,
    
  // Enhanced error handling and reconnection messages
  SERVER_ERROR: (message: string, code: string) => 
    `Webhook server error: ${message} (${code || 'NO_CODE'})`,
  CLIENT_ERROR: (message: string) => 
    `Webhook client error: ${message}`,
  SERVER_CLOSED: 'Webhook server closed unexpectedly.',
  SERVER_RECONNECTING: (attempt: number, maxAttempts: number) => 
    `Attempting to reconnect webhook server (${attempt}/${maxAttempts})...`,
  RECONNECT_DELAY: (delay: number) => 
    `Waiting ${delay}ms before reconnection attempt...`,
  RECONNECT_SUCCESS: 'Webhook server reconnected successfully.',
  RECONNECT_FAILED: (error: string) => 
    `Webhook server reconnection failed: ${error}`,
  SERVER_SHUTDOWN_COMPLETE: 'Webhook server shutdown completed.',
};

