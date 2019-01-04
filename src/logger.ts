import {createWriteStream} from 'fs';
import { Console } from 'console'

export default class LoggerBuilder {
    private static instance: LoggerBuilder;
    private logger;

    constructor(customLogger?) {
        if (LoggerBuilder.instance) {
            return LoggerBuilder.instance;
        }

        LoggerBuilder.instance = this;

        let validator = this.validateLogger(customLogger)
        if( !validator && !customLogger) {
            console.warn("Failed to register logger, using console for logging.");
            const output = createWriteStream('./stdout.log');
            const errorOutput = createWriteStream('./stderr.log');
            this.logger = new Console(output, errorOutput);
        } else {
            this.logger = customLogger;
        }
    }

    public get Logger() {
        return this.logger
    }

    private validateLogger(logger) {
        if(!logger) {
            return false;
        }
        let functionExists = ['info', 'warn', 'log', 'error', 'debug'];
        functionExists.forEach(functionName => {
            if( typeof logger[functionName] !== "function" ) {
                console.warn("Failed to initialize custom logger due to missing function '" + functionName + "'.")
                return false;
            }
        });
        return true;
    }
}


