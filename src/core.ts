/*!
 * contentstack-webhook-listener
 * copyright (c) Contentstack LLC
 * MIT Licensed
 */

"use strict";

import { createServer } from "http";
import BasicAuth from "basic-auth";
import { debug as Debug } from "debug";
import * as bodyParser from "body-parser";
import LoggerBuilder from "./logger";

const jsonParser = bodyParser.json();
let _config: any = {};
let _notify: any;

const debug = Debug("webhook:listener");

const requestHandler = (request, response) => {
  try {
    //Should be a POST call.
    if (request.method && request.method !== "POST") {
      debug("Only POST call is supported.");
      let err = JSON.stringify({
        statusCode: 400,
        statusMessage: "Not allowed",
        body: `Only POST call is supported.`
      });
      throw new Error(err);
    }

    //validate endpoint
    debug(`${request.url} invoked`);
    if (request.url !== _config.listener.endpoint) {
      debug("url authentication failed");
      throw new Error(
        JSON.stringify({
          statusCode: 404,
          statusMessage: "Not Found",
          body: `${request.url} not found.`
        })
      );
    }

    // verify authorization
    if (_config.listener.basic_auth) {
      debug("validating basic auth");
      const creds = BasicAuth(request);
      if (
        !creds ||
        (creds.name !== _config.listener.basic_auth.user ||
          creds.pass !== _config.listener.basic_auth.pass)
      ) {
        debug("basic auth failed");
        debug(
          "expected %O but received %O",
          _config.listener.basic_auth,
          creds
        );
        throw new Error(
          JSON.stringify({
            statusCode: 401,
            statusMessage: "Unauthorized",
            body: "Invalid Basic auth."
          })
        );
      }
    }

    // validate custom headers
    for (let headerKey in _config.listener.headers) {
      debug("validating headers");
      if (request.headers[headerKey] !== _config.listener.headers[headerKey]) {
        debug(`${headerKey} was not found in req headers`);
        throw new Error(
          JSON.stringify({
            statusCode: 417,
            statusMessage: "Expectation failed",
            body: "Header key mismatch."
          })
        );
      }
    }

    let promise = new Promise(function(resolve, reject) {
      // use body-parser here..
      jsonParser(request, response, error => {
        // if(error){
        //   throw new error;
        // }
        try {
          const body = request.body;
          const type = body.module;
          const event = body.event;
          let locale;

          if (type !== "content_type") {
            locale = body.data.locale;
          }

          // validate event:type
          if (
            !_config.listener.actions[type] ||
            _config.listener.actions[type].indexOf(event) === -1
          ) {
            debug(`${event}:${type} not defined for processing`);
            reject({
              statusCode: 403,
              statusMessage: "Forbidden",
              body: `${event}:${type} not defined for processing`
            });
          }

          const data: any = {};
          switch (type) {
            case "asset":
              data.data = body.data.asset;
              data.locale = locale;
              data.content_type_uid = "_assets";
              break;
            case "entry":
              data.locale = locale;
              data.data = body.data.entry;
              data.content_type = body.data.content_type;
              data.content_type_uid = body.data.content_type.uid;
              break;
            default:
              data.content_type = body.data;
              data.content_type_uid = "_content_types";
              break;
          }
          data.event = event;
          _notify(data);
          resolve({ statusCode: 200, statusMessage: "OK", body: data });
        } catch (err) {
          reject({
            statusCode: 500,
            statusMessage: "Internal Error",
            body: err
          });
        }
      });
    });

    promise
      .then((value: any) => {
        response.setHeader("Content-Type", "application/json");
        response.statusCode = value.statusCode;
        response.statusMessage = value.statusMessage;
        response.end(JSON.stringify(value.body));
        return;
      })
      .catch((err: any) => {
        response.setHeader("Content-Type", "application/json");
        response.statusCode = err.statusCode;
        response.statusMessage = err.statusMessage;
        response.end(JSON.stringify({ error: { message: err.body } }));
        return;
      });
  } catch (err) {
    debug("something went wrong... ", typeof err);
    err = JSON.parse(err.message);
    response.setHeader("Content-Type", "application/json");
    response.statusCode = err.statusCode;
    response.statusMessage = err.statusMessage;
    response.end(JSON.stringify({ error: { message: err.body } }));
    return;
  }
};

export function createListener(config, notify) {
  if (!config) throw new Error("Please provide configurations.");
  if (!notify) throw new Error("Please provide notify function.");

  _config = config;
  _notify = notify;
  return createServer(requestHandler);
}
