/*!
* contentstack-webhook-listener
* copyright (c) Contentstack LLC
* MIT Licensed
*/ 

'use strict';

import { debug as Debug } from "debug";
import { createListener } from "./core";
import { defaultConfig } from "./defaults";
import { merge as _merge} from "lodash";

const debug = Debug("webhook:listener");
let notify;
let config: any = {};

export function register(consumer: any) {
  if(typeof consumer !== "function") {
    throw new Error('Provide function to notify consumer.')
  }
  debug("register called with %O", notify);
  notify = consumer;
  return true;
}

export function start(userConfig) {
  return new Promise((resolve, reject)=>{
    debug("start called with %O", userConfig);
    //validateConfig(userConfig);
    // override default with user config
    if(userConfig) {
      //reassiging to different variable as import caches config while running test cases
      //and provides old merged config. 
      let _defaultConfig = defaultConfig;
      resetConfig();
      config = _merge(_defaultConfig, userConfig);
    } else {
      console.log("Starting listener with default configs");
      config = defaultConfig;
    }
    if (!notify) {
      reject('`Aborting start of webhook listener, since no function is provided to notify.`')
      throw new Error(`Aborting start of webhook listener, since no function is provided to notify.`)
    } else {
      debug('starting with config: '+ JSON.stringify(config));
      let port = process.env.PORT || config.listener.port
      let server =  createListener(config, notify).listen(
        port, () => {
          console.log(`Server running at port ${port}`);
        }
      );  
      return resolve(server);
    }
  })
}

export function getConfig() {
  return config;
}

function resetConfig() {
  return config = {};
}

function validateConfig(config) {
  if (config.listener && typeof config.listener.endpoint === "string") {
    const reg = /^\//;
    if (!reg.test(config.listener.endpoint)) {
      config.listener.endpoint = "/" + config.listener.endpoint;
    }
  } else {
    throw new Error(`Kindly provide an endpoint for listening events`);
  }
}
