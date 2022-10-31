import { Console } from 'console';

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
        console.warn('Failed to register logger, using console for logging.');
    } else {
        logger = customLogger;
        logger.info('Logger registered successfully.');
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
        console.warn(`Unable to register custom logger since '${name}()' does not exist on ${instance}!`);
        flag = true;
      }
    });

    return !flag;
  };

export {logger, setLogger};
