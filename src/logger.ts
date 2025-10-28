import { Console } from 'console';
import { MESSAGES } from './messages';

let logger;
logger = new Console(process.stdout, process.stderr);

/**
 * It will register a logger this it to be used accross the module other wise
 * console log will be used.
 * @param {object} customLogger instance of a logger to be register
 */
function setLogger(customLogger) {
    const validator = validateLogger(customLogger);
    if (!validator) {
        console.warn(MESSAGES.LOGGER_REGISTRATION_FAILED);
    } else {
        logger = customLogger;
        logger.info(MESSAGES.LOGGER_REGISTERED_SUCCESS);
    }
}

const validateLogger = (instance) => {
    let flag = false;
    if (!instance) {
      return flag;
    }
    const requiredFn = ['info', 'warn', 'log', 'error', 'debug'];
    requiredFn.forEach((name) => {
      if (typeof instance[name] !== 'function') {
        console.warn(MESSAGES.UNABLE_TO_REGISTER_LOGGER(name, instance));
        flag = true;
      }
    });

    return !flag;
  };

export {logger, setLogger};
