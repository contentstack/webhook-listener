/*!
* contentstack-webhook-listener
* copyright (c) Contentstack LLC
* MIT Licensed
*/

'use strict';

export const defaultConfig = {
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
