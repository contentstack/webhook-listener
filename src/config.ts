/*!
* contentstack-webhook-listener
* copyright (c) Contentstack LLC
* MIT Licensed
*/

'use strict';

export interface Config {
  listener: {
    port: number,
    endpoint: string,
    actions: {
      entry: string[],
      asset: string[],
      asset_folder: string[],
      content_type: string[],
    },
  }
  [propName: string]: any
}

export const defaultConfig : Config = {
  listener: {
    port: 5000,
    endpoint: '/notify',
    actions: {
      entry: [
        'delete',
        'publish',
        'unpublish',
      ],
      asset: [
        'delete',
        'publish',
        'unpublish',
      ],
      asset_folder: [
        'delete',
      ],
      content_type: [
        'delete',
      ],
    },
  },
};
