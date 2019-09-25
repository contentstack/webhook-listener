/*!
 * Contentstack DataSync Mongodb SDK
 * Copyright (c) 2019 Contentstack LLC
 * MIT Licensed
 */


declare module 'webhook-listener' {
		/// <reference types="node" />
	/**
	 * Creates server for webhook listener.
	 * @param {Object} config
	 * @param {Function} notify
	 * @returns {http.Server}
	 */
	export function createListener(config: any, notify: any): import("http").Server;
	/**
	 * Register a function that will get called when webhook is triggered.
	 * @public
	 * @param {function} consumer Function that will get called when webhook is triggered.
	 */
	export function register(consumer: any): boolean;
	/**
	 * Start webhook listener.
	 * @public
	 * @param {Object} userConfig JSON object that will override default config.
	 * @param {Logger} customLogger Instance of a logger that should have info, debug, error, warn method.
	 * @returns {Promise} Promise object represents http.Server
	 */
	export function start(userConfig: any, customLogger?: any): Promise<unknown>;
	/**
	 * @public
	 * @method setConfig
	 * @description
	 * Sets listener library's configuration
	 * @param config Listener lib config
	 */
	export const setConfig: (config: any) => void;
	/**
	 * Get configuration.
	 */
	export function getConfig(): any;

}